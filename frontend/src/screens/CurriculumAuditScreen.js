import React, { useState } from 'react';
import { Text, View, ScrollView, TextInput, Alert } from 'react-native';
import { Shield, GraduationCap, Sparkles, CheckCircle2, AlertTriangle, CircleHelp } from 'lucide-react-native';
import { colors } from '../theme/colors';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:5000';

// This is the original single-screen curriculum auditor (the "Curriculum Gap
// Auditor" / SRI flow from the Dev Report), moved unchanged into the Home tab of the
// navigation shell. It is the working demo path and must keep functioning exactly as
// before through the rest of the build - it becomes the curriculum_skills predict
// head in Phase 2, but /api/audit/analyze keeps serving it in the meantime.
export default function CurriculumAuditScreen() {
  const [curriculumTitle, setCurriculumTitle] = useState('Computer Science Fundamentals');
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);

  const [subjects, setSubjects] = useState([
    { name: 'Core Syntax & Basics', weight: 0.35, vulnerability: 0.85 },
    { name: 'Database Design', weight: 0.25, vulnerability: 0.40 },
    { name: 'Systems Architecture', weight: 0.40, vulnerability: 0.20 }
  ]);
  const [futureSkillsScore, setFutureSkillsScore] = useState(65);
  const [sriScore, setSriScore] = useState(68.5);
  const [auditSummary, setAuditSummary] = useState('Paste a syllabus to see the skills that will keep learners resilient in an AI-shaped world.');
  const [recommendations, setRecommendations] = useState([]);
  const [analysisMode, setAnalysisMode] = useState(null);

  const calculateLocalSRI = () => {
    let weightedNonVulnerability = 0;
    subjects.forEach(sub => {
      weightedNonVulnerability += sub.weight * (1 - sub.vulnerability);
    });

    const alpha = 0.8;
    const computed = (weightedNonVulnerability + alpha * (futureSkillsScore / 100)) * 100;
    setSriScore(parseFloat(computed.toFixed(1)));
  };

  const handleAuditSubmission = async () => {
    if (!rawText.trim()) {
      Alert.alert("Missing Syllabus Data", "Please paste or type syllabus content to evaluate.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/audit/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: curriculumTitle,
          gradeLevel: "Tertiary Education",
          syllabusText: rawText,
          alpha: 0.8
        })
      });

      const result = await response.json();
      if (result.success) {
        const audit = result.audit;
        setSriScore(audit.readinessIndex);
        setFutureSkillsScore(audit.futureSkillsScore);
        setSubjects(audit.subjects);
        setAuditSummary(audit.summary);
        setRecommendations(audit.recommendations || []);
        setAnalysisMode(audit.analysisMode);
      } else {
        throw new Error(result.error || "Failed payload processing.");
      }
    } catch (err) {
      calculateLocalSRI();
      setAuditSummary('Offline simulator used. Start the ZivaDzidzo backend to receive curriculum-specific insight.');
      setRecommendations([
        'Add an applied project that asks learners to test and improve AI output.',
        'Assess evidence, judgement, and iteration—not recall alone.'
      ]);
      setAnalysisMode('offline');
      Alert.alert("Offline Simulator", "Used local calculation model engine.");
    } finally {
      setLoading(false);
    }
  };

  const sriTone = sriScore >= 70 ? 'teal' : sriScore >= 50 ? 'gold' : 'red';
  const sriLabel = sriScore >= 70 ? '▲ AI READY' : sriScore >= 50 ? '● MODERATE RISK' : '▼ HIGH OBSOLESCENCE';

  return (
    <ScrollView className="flex-1 bg-bg pt-4 px-4">
      <View className="mb-6 flex-row items-center justify-between">
        <View>
          <Text className="text-ink-muted text-xs tracking-widest uppercase">ChiedzaAI Platform</Text>
          <Text className="text-ink font-display text-2xl">ZivaDzidzo</Text>
        </View>
        <GraduationCap color={colors.gold} size={28} />
      </View>

      <Card className="mb-6">
        <Text className="text-ink-muted text-sm mb-1">Skills Obsolescence & Readiness Index (SRI)</Text>
        <View className="flex-row items-baseline mb-3">
          <Text className="text-ink font-mono-semibold text-5xl">{sriScore}%</Text>
          <Badge tone={sriTone} className="ml-2">{sriLabel}</Badge>
        </View>

        <Text className="text-ink-muted text-xs leading-relaxed">
          The SRI tracks the resilience of this curriculum against generative AI automation. Lower indices suggest subjects need immediate adaptive updates.
        </Text>
        <View className="mt-4 flex-row items-center">
          <Sparkles color={colors.indigo} size={15} />
          <Text className="text-indigo text-xs ml-2">
            Future skills integration: {futureSkillsScore}%{analysisMode ? ` · ${analysisMode === 'openai' ? 'OpenAI analysis' : 'demo-ready analysis'}` : ''}
          </Text>
        </View>
      </Card>

      <Card className="mb-6">
        <Text className="text-ink font-body-semibold text-base mb-3">Auditor Pipeline Input</Text>

        <TextInput
          className="bg-bg text-ink font-body border border-border rounded-xl px-4 py-3 mb-3"
          placeholder="Curriculum Title"
          placeholderTextColor={colors.inkFaint}
          value={curriculumTitle}
          onChangeText={setCurriculumTitle}
        />

        <TextInput
          className="bg-bg text-ink font-body border border-border rounded-xl px-4 py-3 mb-4 h-28"
          placeholder="Paste Syllabus or Course Topics here..."
          placeholderTextColor={colors.inkFaint}
          multiline
          textAlignVertical="top"
          value={rawText}
          onChangeText={setRawText}
        />

        <Button onPress={handleAuditSubmission} loading={loading}>
          <Shield color={colors.bg} size={18} />
          <Text className="text-bg font-body-semibold text-center">Execute Chiedza AI Audit</Text>
        </Button>
      </Card>

      {!!analysisMode && (
        <View className="bg-indigo/10 border border-indigo/25 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-2">
            <CircleHelp color={colors.indigo} size={18} />
            <Text className="text-ink font-body-semibold ml-2">What this means</Text>
          </View>
          <Text className="text-ink-muted text-sm leading-relaxed">{auditSummary}</Text>
        </View>
      )}

      <View className="mb-8">
        <Text className="text-ink font-body-semibold text-lg mb-1">Curriculum risk map</Text>
        <Text className="text-ink-faint text-xs mb-4">Tap into the story behind every score.</Text>
        {subjects.map((sub, idx) => (
          <Card key={idx} className="mb-3">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-4">
                <Text className="text-ink font-body-semibold">{sub.name}</Text>
                <Text className="text-ink-muted text-xs mt-1">Automation vulnerability: {Math.round(sub.vulnerability * 100)}%</Text>
              </View>
              {sub.vulnerability > 0.6 ? <AlertTriangle color={colors.gold} size={18} /> : <CheckCircle2 color={colors.teal} size={18} />}
            </View>
            {!!sub.rationale && <Text className="text-ink-muted text-xs leading-relaxed mt-3">Why: {sub.rationale}</Text>}
            {!!sub.modernization && <Text className="text-indigo text-xs leading-relaxed mt-2">Next move: {sub.modernization}</Text>}
          </Card>
        ))}
      </View>

      {recommendations.length > 0 && (
        <View className="mb-12">
          <Text className="text-ink font-body-semibold text-lg mb-4">Recommended next moves</Text>
          {recommendations.map((recommendation, index) => (
            <Card key={index} className="mb-3 flex-row">
              <Text className="text-gold font-mono-medium mr-3">0{index + 1}</Text>
              <Text className="text-ink-muted text-sm leading-relaxed flex-1">{recommendation}</Text>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
