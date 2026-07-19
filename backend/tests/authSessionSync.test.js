const express = require('express');
const request = require('supertest');

jest.mock('../db', () => ({
  supabase: { auth: { getUser: jest.fn() } },
}));

jest.mock('../services/supabaseService', () => ({
  clientForToken: jest.fn(),
}));

const { supabase } = require('../db');
const supabaseService = require('../services/supabaseService');
const authRouter = require('../routes/auth');

function app() {
  const server = express();
  server.use(express.json());
  server.use('/auth', authRouter);
  return server;
}

function profileClient(profileResult) {
  const maybeSingle = jest.fn().mockResolvedValue(profileResult);
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));
  const from = jest.fn(() => ({ select }));
  return { client: { from }, from, select, eq, maybeSingle };
}

beforeEach(() => {
  jest.clearAllMocks();
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'profile-user' } }, error: null });
});

test('session sync returns a provisioned caller profile without requiring service-role access', async () => {
  const query = profileClient({
    data: { id: 'profile-user', institution_id: 'school-1', role: 'admin', full_name: 'Demo Admin' },
    error: null,
  });
  supabaseService.clientForToken.mockReturnValue(query.client);

  const response = await request(app())
    .post('/auth/session-sync')
    .set('Authorization', 'Bearer caller-jwt');

  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    success: true,
    profile: { id: 'profile-user', institution_id: 'school-1', role: 'admin', full_name: 'Demo Admin' },
    created: false,
  });
  expect(supabaseService.clientForToken).toHaveBeenCalledWith('caller-jwt');
  expect(query.from).toHaveBeenCalledWith('profiles');
  expect(query.eq).toHaveBeenCalledWith('id', 'profile-user');
});

test('session sync keeps missing or incomplete memberships out of the dashboard', async () => {
  const query = profileClient({
    data: { id: 'profile-user', institution_id: null, role: 'admin', full_name: 'Unassigned User' },
    error: null,
  });
  supabaseService.clientForToken.mockReturnValue(query.client);

  const response = await request(app())
    .post('/auth/session-sync')
    .set('Authorization', 'Bearer caller-jwt');

  expect(response.status).toBe(403);
  expect(response.body).toMatchObject({ success: false, code: 'MEMBERSHIP_PENDING' });
});

test('session sync rejects requests without a bearer token before profile lookup', async () => {
  const response = await request(app()).post('/auth/session-sync');

  expect(response.status).toBe(401);
  expect(response.body).toMatchObject({ success: false, error: 'Missing bearer token.' });
  expect(supabase.auth.getUser).not.toHaveBeenCalled();
});
