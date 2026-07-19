const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const supabaseService = require('../services/supabaseService');
const { runStructuredPrediction } = require('../services/openaiService');
const { teacherRolesSchema, teacherRolesSystemPrompt } = require('../schemas/teacherRoles');
const { TASK_TYPES, PREDICTION_WRITE_ROLES, AI_TOOL_USAGE_FREQUENCY_NUMERIC, modelVersionTag } = require('../config');

const router = express.Router();
router.use(requireAuth);

// Server-side only - never trust a client to send these (prompt.md's engineered-features
// rule). usage_frequency_numeric maps never=0 ... daily=4.
function computeTeacherRolesEngineeredFeatures(teacher) {
  const yearsExperience = Math.max(Number(teacher.years_experience) || 0, 1);
  const trainingHours = Number(teacher.training_hours) || 0;
  const digitalSkillsScore = Number(teacher.digital_skills_score) || 0;
  const usageFrequencyNumeric = AI_TOOL_USAGE_FREQUENCY_NUMERIC[teacher.ai_tool_usage_frequency] ?? 0;

  const trainingHoursPerYearOfService = trainingHours / yearsExperience;
  const digitalReadinessIndex =
    0.5 * digitalSkillsScore +
    0.3 * (usageFrequencyNumeric * 20) +
    0.2 * Math.min(trainingHours / 40, 1) * 100;

  return {
    training_hours_per_year_of_service: Number(trainingHoursPerYearOfService.toFixed(2)),
    digital_readiness_index: Number(digitalReadinessIndex.toFixed(2)),
  };
}

router.post('/teacher-roles', requireRole(...PREDICTION_WRITE_ROLES), async (req, res) => {
  const { teacherId } = req.body || {};
  if (!teacherId) {
    return res.status(400).json({ success: false, error: 'teacherId is required.' });
  }

  try {
    const client = supabaseService.clientForToken(req.authToken);
    const teacher = await supabaseService.getTeacherById(client, teacherId);
    if (!teacher || teacher.institution_id !== req.profile.institution_id) {
      return res.status(404).json({ success: false, error: 'Teacher not found.' });
    }

    const engineeredFeatures = computeTeacherRolesEngineeredFeatures(teacher);
    const rawFeatures = {
      full_name: teacher.full_name,
      years_experience: teacher.years_experience,
      ai_tool_usage_frequency: teacher.ai_tool_usage_frequency,
      digital_skills_score: teacher.digital_skills_score,
      training_hours: teacher.training_hours,
    };
    const inputFeatures = { raw: rawFeatures, engineered: engineeredFeatures };

    const userContent = `Teacher: ${teacher.full_name}\n` +
      `Years of teaching experience: ${teacher.years_experience ?? 'unknown'}\n` +
      `Self/admin-rated digital skills score (0-100): ${teacher.digital_skills_score ?? 'unknown'}\n` +
      `AI tool usage frequency: ${teacher.ai_tool_usage_frequency ?? 'unknown'}\n` +
      `Training hours in the last 12 months: ${teacher.training_hours ?? 'unknown'}\n` +
      `Engineered feature - training hours per year of service: ${engineeredFeatures.training_hours_per_year_of_service}\n` +
      `Engineered feature - digital readiness index (0-100): ${engineeredFeatures.digital_readiness_index}\n\n` +
      `Assess this teacher's AI-disruption exposure and reskilling priority.`;

    const { result, modelUsed, costUsd } = await runStructuredPrediction({
      schema: teacherRolesSchema,
      systemPrompt: teacherRolesSystemPrompt,
      userContent,
    });

    const predictionRow = await supabaseService.insertPrediction(client, {
      institution_id: req.profile.institution_id,
      task_type: TASK_TYPES.TEACHER_ROLES,
      target_ref_id: teacherId,
      input_features: inputFeatures,
      prediction: {
        ai_disruption_exposure_score: result.ai_disruption_exposure_score,
        exposure_band: result.exposure_band,
        reskilling_priority: result.reskilling_priority,
        recommended_actions: result.recommended_actions,
      },
      rationale: {
        contributing_factors: result.contributing_factors,
        caveats: result.caveats,
      },
      confidence: result.confidence,
      model_version: modelVersionTag(TASK_TYPES.TEACHER_ROLES),
      created_by: req.profile.id,
    });

    await supabaseService.insertAutoLlmCostEntry({
      institutionId: req.profile.institution_id,
      amountUsd: costUsd,
      note: `Teacher Roles prediction for ${teacher.full_name} (${modelUsed})`,
      relatedPredictionId: predictionRow.id,
      createdBy: req.profile.id,
    });

    res.status(201).json({ success: true, prediction: predictionRow });
  } catch (error) {
    if (error.code === 'OPENAI_NOT_CONFIGURED') {
      return res.status(503).json({ success: false, error: 'OPENAI_API_KEY is not configured on the backend.' });
    }
    console.error('Teacher Roles prediction failed:', error.message);
    res.status(502).json({ success: false, error: 'The prediction could not be completed. Please retry.' });
  }
});

router.get('/teacher-roles', async (req, res) => {
  try {
    const client = supabaseService.clientForToken(req.authToken);
    const predictions = await supabaseService.listPredictions(
      client,
      req.profile.institution_id,
      TASK_TYPES.TEACHER_ROLES,
      req.query.teacherId
    );
    res.json({ success: true, predictions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
module.exports.computeTeacherRolesEngineeredFeatures = computeTeacherRolesEngineeredFeatures;
