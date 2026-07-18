import React, { useState } from 'react';
import { Text, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Shield, GraduationCap, Sparkles, CheckCircle2, AlertTriangle, CircleHelp } from 'lucide-react-native';

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

  return (
    <ScrollView className="flex-1 bg-[#0A0F1D] pt-4 px-4">
      <View className="mb-6 flex-row items-center justify-between">
        <View>
          <Text className="text-gray-400 text-xs tracking-widest uppercase">ChiedzaAI Platform</Text>
          <Text className="text-white text-2xl font-bold tracking-tight">ZivaDzidzo</Text>
        </View>
        <GraduationCap color="#3B82F6" size={28} />
      </View>

      <View className="bg-[#141B2D] border border-gray-800 rounded-3xl p-6 mb-6">
        <Text className="text-gray-400 text-sm mb-1">Skills Obsolescence & Readiness Index (SRI)</Text>
        <View className="flex-row items-baseline mb-3">
          <Text className="text-white text-5xl font-black">{sriScore}%</Text>
          <Text className="text-emerald-400 text-xs font-bold ml-2">
            {sriScore >= 70 ? '▲ AI READY' : sriScore >= 50 ? '● MODERATE RISK' : '▼ HIGH OBSOLESCENCE'}
          </Text>
        </View>

        <Text className="text-gray-400 text-xs leading-relaxed">
          The SRI tracks the resilience of this curriculum against generative AI automation. Lower indices suggest subjects need immediate adaptive updates.
        </Text>
        <View className="mt-4 flex-row items-center">
          <Sparkles color="#60A5FA" size={15} />
          <Text className="text-blue-300 text-xs ml-2">
            Future skills integration: {futureSkillsScore}%{analysisMode ? ` · ${analysisMode === 'openai' ? 'OpenAI analysis' : 'demo-ready analysis'}` : ''}
          </Text>
        </View>
      </View>

      <View className="bg-[#141B2D] border border-gray-800 rounded-3xl p-5 mb-6">
        <Text className="text-white font-semibold text-base mb-3">Auditor Pipeline Input</Text>

        <TextInput
          className="bg-[#0A0F1D] text-white border border-gray-800 rounded-xl px-4 py-3 mb-3"
          placeholder="Curriculum Title"
          placeholderTextColor="#6B7280"
          value={curriculumTitle}
          onChangeText={setCurriculumTitle}
        />

        <TextInput
          className="bg-[#0A0F1D] text-white border border-gray-800 rounded-xl px-4 py-3 mb-4 h-28"
          placeholder="Paste Syllabus or Course Topics here..."
          placeholderTextColor="#6B7280"
          multiline
          textAlignVertical="top"
          value={rawText}
          onChangeText={setRawText}
        />

        <TouchableOpacity
          className="bg-accent rounded-xl py-4 flex-row items-center justify-center"
          onPress={handleAuditSubmission}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Shield color="#fff" size={18} className="mr-2" />
              <Text className="text-white font-bold text-center">Execute Chiedza AI Audit</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {!!analysisMode && (
        <View className="bg-[#10233E] border border-blue-900 rounded-3xl p-5 mb-6">
          <View className="flex-row items-center mb-2">
            <CircleHelp color="#60A5FA" size={18} />
            <Text className="text-white font-semibold ml-2">What this means</Text>
          </View>
          <Text className="text-blue-100 text-sm leading-relaxed">{auditSummary}</Text>
        </View>
      )}

      <View className="mb-8">
        <Text className="text-white font-semibold text-lg mb-1">Curriculum risk map</Text>
        <Text className="text-gray-500 text-xs mb-4">Tap into the story behind every score.</Text>
        {subjects.map((sub, idx) => (
          <View key={idx} className="bg-[#141B2D] border border-gray-800 rounded-2xl p-4 mb-3">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-4">
              <Text className="text-white font-medium">{sub.name}</Text>
                <Text className="text-gray-400 text-xs mt-1">Automation vulnerability: {Math.round(sub.vulnerability * 100)}%</Text>
              </View>
              {sub.vulnerability > 0.6 ? <AlertTriangle color="#F59E0B" size={18} /> : <CheckCircle2 color="#10B981" size={18} />}
            </View>
            {!!sub.rationale && <Text className="text-gray-300 text-xs leading-relaxed mt-3">Why: {sub.rationale}</Text>}
            {!!sub.modernization && <Text className="text-blue-300 text-xs leading-relaxed mt-2">Next move: {sub.modernization}</Text>}
          </View>
        ))}
      </View>

      {recommendations.length > 0 && (
        <View className="mb-12">
          <Text className="text-white font-semibold text-lg mb-4">Recommended next moves</Text>
          {recommendations.map((recommendation, index) => (
            <View key={index} className="bg-[#141B2D] border border-gray-800 rounded-2xl p-4 mb-3 flex-row">
              <Text className="text-blue-400 font-bold mr-3">0{index + 1}</Text>
              <Text className="text-gray-200 text-sm leading-relaxed flex-1">{recommendation}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
