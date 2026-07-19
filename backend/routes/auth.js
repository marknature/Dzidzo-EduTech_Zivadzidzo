const express = require('express');
const { supabase } = require('../db');
const { requireAuth } = require('../middleware/auth');
const supabaseService = require('../services/supabaseService');
const { ROLES } = require('../config');

const router = express.Router();
const DASHBOARD_ROLES = new Set(Object.values(ROLES));

function membershipPending(res) {
  return res.status(403).json({
    success: false,
    error: 'Your account is awaiting assignment by an institution administrator.',
    code: 'MEMBERSHIP_PENDING',
  });
}

// Called once right after Supabase sign-in/sign-up. Institution membership and role
// are assigned by a trusted administrator or invite flow, never by a self-service
// "first school" fallback. That prevents a new account from silently joining the
// wrong tenant or gaining a role through client-controlled profile fields.
router.post('/session-sync', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Missing bearer token.' });
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired session.' });
    }

    // A session sync only needs the caller's own profile. Query under the caller's
    // JWT so the endpoint works without a service-role key and remains protected by
    // `profiles_select_own` RLS. Membership is still never created or assigned here.
    const client = supabaseService.clientForToken(token);
    const { data: existingProfile, error: existingProfileError } = await client
      .from('profiles')
      .select('id, institution_id, role, full_name')
      .eq('id', userData.user.id)
      .maybeSingle();
    if (existingProfileError) {
      return res.status(500).json({ success: false, error: 'Could not look up profile.' });
    }
    if (existingProfile?.institution_id && DASHBOARD_ROLES.has(existingProfile.role)) {
      return res.status(200).json({ success: true, profile: existingProfile, created: false });
    }

    return membershipPending(res);
  } catch (error) {
    console.warn('Session sync failed:', error.message);
    return res.status(502).json({ success: false, error: 'Could not verify your institution access. Please retry.' });
  }
});

router.get('/me', requireAuth, (req, res) => res.json({ success: true, profile: req.profile }));

module.exports = router;
