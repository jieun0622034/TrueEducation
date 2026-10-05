import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Play,
  RotateCcw,
  Send,
  ShieldAlert,
  Clock,
  User,
  Radio,
  Wand2,
} from 'lucide-react';
import { getLiveCoachingScript } from '../utils/engine';

import { agentFetch } from '../utils/agentApi';
interface LiveCallCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToMemo: (transcript: string) => void;
}

interface CallMessage {
  sender: 'parent' | 'teacher';
  text: string;
  time: string;
  detectedThreat?: string;
  suggestedScript?: string;
  legalNotice?: string;
}

interface CallScenario {
  title: string;
  callerName: string;
  callerNumber: string;
  initialUtterance: string;
  speakerRole?: 'parent' | 'teacher' | 'student' | 'friend';
  studentName?: string;
  persona?: string;
  difficulty?: string;
}

const DEFAULT_CALL_SCENARIOS: CallScenario[] = [
  {
    title: '맘카페 유포 및 교육청 민원 협박',
    callerName: '1-3 김철수 학부모',
    callerNumber: '010-8291-****',
    speakerRole: 'parent',
    initialUtterance:
      '선생님 지금 제정신이세요? 통화 녹음한 거 맘카페랑 교육청 민원 게시판에 다 올릴 테니까 학부모 무서운 줄 똑똑히 알아두세요!',
  },
  {
    title: '수행평가 1점 상향 강요 및 폭언',
    callerName: '2-1 박영희 학부모',
    callerNumber: '010-4712-****',
    speakerRole: 'parent',
    initialUtterance:
      '우리 애가 이번 수행평가 1점 깎여서 특목고 떨어지게 생겼는데 왜 원칙 타령만 하십니까? 당장 만점으로 수정 안 해주시면 가만 안 있습니다.',
  },
  {
    title: '야간 사생활 침해 및 교무실 불시 방문',
    callerName: '1-2 이민준 학부모',
    callerNumber: '010-9943-****',
    speakerRole: 'parent',
    initialUtterance:
      '밤 10시에 전화해서 죄송한데 지금 당장 교감 선생님 번호 대세요. 내일 아침 교무실 쳐들어가서 담임 교체 요구할 겁니다.',
  },
];

export const LiveCallCopilotModal: React.FC<LiveCallCopilotModalProps> = ({
  isOpen,
  onClose,
  onSendToMemo,
}) => {
  const [scenarios, setScenarios] = useState<CallScenario[]>(DEFAULT_CALL_SCENARIOS);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [isCallActive, setIsCallActive] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isMicListening, setIsMicListening] = useState(false);
  const [teacherInput, setTeacherInput] = useState('');
  const [isParentThinking, setIsParentThinking] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScenarioBuilder, setShowScenarioBuilder] = useState(false);
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [scenarioBuilderError, setScenarioBuilderError] = useState('');
  const [scenarioBuilderForm, setScenarioBuilderForm] = useState({
    studentName: '김철수',
    gradeLevel: '중학교 2학년',
    callerRole: 'parent',
    issueCategory: '수행평가 채점 기준 불복 및 폭언',
    difficulty: '고위험 (주의~높음)',
    customPrompt: '',
  });

  // Active call dialogue history
  const [messages, setMessages] = useState<CallMessage[]>([]);

  // Real-time Copilot HUD state
  const [latestCopilot, setLatestCopilot] = useState<{
    detectedThreat?: string;
    suggestedScript: string;
    legalNotice: string;
    level: 0 | 1 | 2;
  }>({
    detectedThreat: '상급기관 민원 제기 및 유포 암시',
    suggestedScript:
      '학부모님, 말씀하신 사안은 학교 정식 상담 절차를 통해 규정에 따라 공정하게 확인하겠습니다. 감정적인 언사나 유포 언급은 삼가해 주시기 바랍니다.',
    legalNotice: '교육부 고시 제2조 제3호 (교육활동 부당 간섭)',
    level: 2,
  });

  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isTeacherInputComposingRef = useRef(false);

  // Initialize or reset scenario
  useEffect(() => {
    if (isOpen) {
      setIsCallActive(true);
      setCallDuration(0);
      const sc = scenarios[selectedScenarioIndex] || DEFAULT_CALL_SCENARIOS[0];
      const initialMsg: CallMessage = {
        sender: 'parent',
        text: sc.initialUtterance,
        time: '00:01',
        detectedThreat: '유포 및 민원 제기 협박',
        suggestedScript:
          '학부모님, 학교 규정에 따라 정식 절차로 협의하셔야 하며, 교원의 정당한 교육활동을 저해하는 발언은 중단해 주시기 바랍니다.',
        legalNotice: '교원지위법 제19조 제2호 나목',
      };
      setMessages([initialMsg]);

      // Speak initial parent line if speaker is enabled
      if (isSpeakerOn) {
        speakUtterance(sc.initialUtterance);
      }

      // Start call timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      stopTts();
      stopMic();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopTts();
      stopMic();
    };
  }, [isOpen, selectedScenarioIndex, scenarios]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isParentThinking]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const speakUtterance = (text: string) => {
    if (!('speechSynthesis' in window) || !isSpeakerOn) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.05; // Slightly faster, realistic emotional parent speech
      utterance.pitch = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  };

  const stopTts = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const startMic = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('현재 브라우저 환경에서 마이크 음성 인식을 지원하지 않습니다. 아래 텍스트 입력창이나 추천 대본을 활용해주세요.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsMicListening(true);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalStr = '';
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTeacherInput(finalStr || interim);
      };

      recognition.onerror = () => {
        setIsMicListening(false);
      };

      recognition.onend = () => {
        setIsMicListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsMicListening(false);
    }
  };

  const stopMic = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsMicListening(false);
  };

  const handleGenerateScenario = async () => {
    setIsGeneratingScenario(true);
    setScenarioBuilderError('');
    try {
      const response = await agentFetch('/api/gemini/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenarioBuilderForm),
      });
      if (!response.ok) throw new Error('시나리오 생성 요청에 실패했습니다.');

      const data = await response.json();
      const generated = data.scenario;
      if (!generated?.parentInitial) throw new Error('생성된 시나리오 내용을 받지 못했습니다.');

      const newScenario: CallScenario = {
        title: generated.title || scenarioBuilderForm.issueCategory,
        callerName: `${scenarioBuilderForm.gradeLevel} ${scenarioBuilderForm.studentName} ${
          scenarioBuilderForm.callerRole === 'parent'
            ? '학부모'
            : scenarioBuilderForm.callerRole === 'teacher'
              ? '학생의 선생님'
              : scenarioBuilderForm.callerRole === 'student'
                ? '학생 본인'
                : '친구'
        }`,
        callerNumber: 'AI 맞춤 시나리오',
        initialUtterance: generated.parentInitial,
        speakerRole: scenarioBuilderForm.callerRole as CallScenario['speakerRole'],
        studentName: scenarioBuilderForm.studentName,
        persona: generated.persona,
        difficulty: generated.difficulty || scenarioBuilderForm.difficulty,
      };
      const newIndex = scenarios.length;
      setScenarios((prev) => [...prev, newScenario]);
      setSelectedScenarioIndex(newIndex);
      setTeacherInput('');
      setIsCallActive(true);
      setCallDuration(0);
      setShowScenarioBuilder(false);
      setScenarioBuilderError('');
      stopTts();
    } catch (error) {
      setScenarioBuilderError(
        error instanceof Error ? error.message : '시나리오 생성 중 오류가 발생했습니다.',
      );
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  const handleTeacherSubmit = async (spokenText?: string) => {
    const textToSend = (spokenText || teacherInput).trim();
    if (!textToSend) return;

    stopMic();
    setTeacherInput('');

    const newTeacherMsg: CallMessage = {
      sender: 'teacher',
      text: textToSend,
      time: formatTimer(callDuration),
    };

    const nextHistory = [...messages, newTeacherMsg];
    setMessages(nextHistory);
    setIsParentThinking(true);

    try {
      const currentSc = scenarios[selectedScenarioIndex] || DEFAULT_CALL_SCENARIOS[0];
      const res = await agentFetch('/api/gemini/call-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: `${currentSc.title} (${currentSc.callerName}; ${currentSc.persona || ''}; ${currentSc.difficulty || ''})`,
          speakerRole: currentSc.speakerRole || 'parent',
          studentName: currentSc.studentName || scenarioBuilderForm.studentName,
          teacherInput: textToSend,
          conversationHistory: nextHistory.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      const data = await res.json();
      const parentReply = data.parentReply || '...선생님, 그렇게 원칙만 내세우시면 교육청에 계속 따질 수밖에 없습니다.';
      const copilot = data.copilot || {};

      const newParentMsg: CallMessage = {
        sender: 'parent',
        text: parentReply,
        time: formatTimer(callDuration + 2),
        detectedThreat: copilot.detectedThreat,
        suggestedScript: copilot.suggestedScript,
        legalNotice: copilot.legalNotice,
      };

      setMessages((prev) => [...prev, newParentMsg]);
      setIsParentThinking(false);

      if (isSpeakerOn) {
        speakUtterance(parentReply);
      }

      // Update Copilot HUD
      if (copilot.suggestedScript) {
        const threatLevel = copilot.detectedThreat ? 2 : 1;
        setLatestCopilot({
          detectedThreat: copilot.detectedThreat || '교육활동 관련 일반 항의',
          suggestedScript: copilot.suggestedScript,
          legalNotice: copilot.legalNotice || '교원지위법 제19조 (교육활동 보호)',
          level: threatLevel,
        });
      }
    } catch {
      // Fallback response if network or server error
      const fallbackScript = getLiveCoachingScript(textToSend);
      const fallbackReply = '선생님 말씀은 알겠지만, 저는 이대로 물러설 수 없습니다. 정식 기준을 서면으로 보내주세요.';

      setMessages((prev) => [
        ...prev,
        {
          sender: 'parent',
          text: fallbackReply,
          time: formatTimer(callDuration + 2),
        },
      ]);
      setIsParentThinking(false);

      setLatestCopilot({
        detectedThreat: '지속적 항의 및 이의 제기',
        suggestedScript: fallbackScript.scripts[0]?.script || '학부모님, 정식 절차에 따라 교무실로 공식 문의해 주시기 바랍니다.',
        legalNotice: '교원지위법 제19조 제2호 나목',
        level: 1,
      });

      if (isSpeakerOn) {
        speakUtterance(fallbackReply);
      }
    }
  };

  const handleApplyScript = (script: string) => {
    handleTeacherSubmit(script);
  };

  const handleCopyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    stopTts();
    stopMic();
  };

  const handleSaveToMemo = () => {
    const sc = scenarios[selectedScenarioIndex] || DEFAULT_CALL_SCENARIOS[0];
    const transcriptText = `[실시간 통화 상담 코칭 기록 - ${sc.callerName}]
통화 시간: ${formatTimer(callDuration)}
사안 유형: ${sc.title}

대화 전문:
${messages.map((m) => `[${m.time}] ${m.sender === 'teacher' ? '교사' : '학부모'}: ${m.text}`).join('\n')}

감지된 교권 침해 신호: ${latestCopilot.detectedThreat || '없음'}
적용 법령 근거: ${latestCopilot.legalNotice}`;

    onSendToMemo(transcriptText);
    onClose();
  };

  if (!isOpen) return null;

  const currentSc = scenarios[selectedScenarioIndex] || DEFAULT_CALL_SCENARIOS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-2xl max-w-2xl w-full max-h-[96vh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden pb-safe sm:pb-0 text-white">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto my-2 sm:hidden shrink-0 mobile-drag-handle" />

        {/* 1. Real-Time Phone Call Top Bar */}
        <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400">
                <PhoneCall className="w-4 h-4 animate-pulse" />
              </div>
              {isCallActive && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-100">{currentSc.callerName}</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.2 rounded-full font-mono">
                  REC 녹음 중
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{currentSc.callerNumber}</span>
                <span>·</span>
                <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimer(callDuration)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Speaker Toggle */}
            <button
              onClick={() => {
                const next = !isSpeakerOn;
                setIsSpeakerOn(next);
                if (!next) stopTts();
              }}
              title={isSpeakerOn ? '스피커폰 끄기' : '스피커폰 켜기'}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isSpeakerOn
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isSpeakerOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Agent Scenario Builder and Scenario Switcher */}
        <div className="border-b border-slate-800 bg-slate-900">
          <div className="px-3.5 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
              <span className="text-[11px] text-slate-300 font-semibold truncate">
                실전 상황 · Agent 맞춤 시나리오 생성
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowScenarioBuilder((open) => !open);
                setScenarioBuilderError('');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shrink-0 transition-colors"
            >
              <Wand2 className="w-3 h-3" />
              {showScenarioBuilder ? '닫기' : 'Agent로 생성'}
            </button>
          </div>

          {showScenarioBuilder && (
            <div className="px-3.5 pb-3.5 space-y-2.5 border-t border-slate-800 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="text-[10px] text-slate-300 font-semibold space-y-1">
                  <span>학생 이름</span>
                  <input
                    value={scenarioBuilderForm.studentName}
                    onChange={(event) =>
                      setScenarioBuilderForm({ ...scenarioBuilderForm, studentName: event.target.value })
                    }
                    placeholder="예: 김철수"
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white outline-none focus:border-indigo-400"
                  />
                </label>
                <label className="text-[10px] text-slate-300 font-semibold space-y-1">
                  <span>통화 상대</span>
                  <select
                    value={scenarioBuilderForm.callerRole}
                    onChange={(event) =>
                      setScenarioBuilderForm({ ...scenarioBuilderForm, callerRole: event.target.value })
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white outline-none focus:border-indigo-400"
                  >
                    <option value="parent">학부모</option>
                    <option value="teacher">선생님</option>
                    <option value="student">학생 본인</option>
                    <option value="friend">학생의 친구</option>
                  </select>
                </label>
                <label className="text-[10px] text-slate-300 font-semibold space-y-1">
                  <span>학년·학교급</span>
                  <input
                    value={scenarioBuilderForm.gradeLevel}
                    onChange={(event) =>
                      setScenarioBuilderForm({ ...scenarioBuilderForm, gradeLevel: event.target.value })
                    }
                    placeholder="예: 중학교 2학년"
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white outline-none focus:border-indigo-400"
                  />
                </label>
              </div>

              <label className="block text-[10px] text-slate-300 font-semibold space-y-1">
                <span>상담 사안</span>
                <input
                  value={scenarioBuilderForm.issueCategory}
                  onChange={(event) =>
                    setScenarioBuilderForm({ ...scenarioBuilderForm, issueCategory: event.target.value })
                  }
                  placeholder="예: 생활지도 항의와 반복적인 야간 연락"
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white outline-none focus:border-indigo-400"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="text-[10px] text-slate-300 font-semibold space-y-1">
                  <span>훈련 난이도</span>
                  <select
                    value={scenarioBuilderForm.difficulty}
                    onChange={(event) =>
                      setScenarioBuilderForm({ ...scenarioBuilderForm, difficulty: event.target.value })
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white outline-none focus:border-indigo-400"
                  >
                    <option value="보통 (단순 항의)">보통 · 단순 항의</option>
                    <option value="주의 (절차 거부)">주의 · 절차 거부 및 언성 높임</option>
                    <option value="고위험 (폭언·민원 압박)">고위험 · 폭언 및 민원 압박</option>
                    <option value="최고위험 (불시 방문·위해 암시)">최고위험 · 불시 방문·위해 암시</option>
                  </select>
                </label>
                <label className="text-[10px] text-slate-300 font-semibold space-y-1">
                  <span>추가 요청 (선택)</span>
                  <input
                    value={scenarioBuilderForm.customPrompt}
                    onChange={(event) =>
                      setScenarioBuilderForm({ ...scenarioBuilderForm, customPrompt: event.target.value })
                    }
                    placeholder="상황의 구체적인 설정"
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white outline-none focus:border-indigo-400"
                  />
                </label>
              </div>

              {scenarioBuilderError && (
                <p role="alert" className="text-[11px] text-red-300">{scenarioBuilderError}</p>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateScenario}
                  disabled={isGeneratingScenario || !scenarioBuilderForm.issueCategory.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-colors"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingScenario ? 'animate-pulse' : ''}`} />
                  {isGeneratingScenario ? '시나리오 만드는 중...' : '생성 후 통화 시작'}
                </button>
              </div>
            </div>
          )}

          <div className="px-3.5 py-1.5 border-t border-slate-800/70 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            <span className="text-[11px] text-slate-400 shrink-0">선택:</span>
            {scenarios.map((sc, idx) => (
              <button
                key={`${sc.title}-${idx}`}
                type="button"
                onClick={() => setSelectedScenarioIndex(idx)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  selectedScenarioIndex === idx
                    ? 'bg-[#0E6B5C] text-white font-bold shadow-xs'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {sc.title}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Golden-Time Copilot HUD Banner (Critical Assistance) */}
        <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border-b border-red-900/40 p-3 sm:p-3.5">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
              <span className="text-[11px] font-bold text-red-300 uppercase tracking-wide">
                Agent 실시간 방어 코치:
              </span>
              <span className="text-[11px] bg-red-900/60 text-red-200 border border-red-700/60 px-1.5 py-0.2 rounded font-semibold truncate max-w-[200px] sm:max-w-none">
                {latestCopilot.detectedThreat || '침해 신호 감지 중'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono shrink-0 hidden xs:inline">
              {latestCopilot.legalNotice}
            </span>
          </div>

          {/* Recommended Counter-Script for Teacher */}
          <div className="bg-slate-950/90 border border-slate-700/80 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs text-slate-200 leading-relaxed font-sans flex-1">
              <span className="text-[#36D7B7] font-bold mr-1">💡 지금 읽을 대본:</span>
              "{latestCopilot.suggestedScript}"
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => handleApplyScript(latestCopilot.suggestedScript)}
                disabled={!isCallActive || isParentThinking}
                className="px-2.5 py-1.5 bg-[#0E6B5C] hover:bg-[#0A5448] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3" /> 이 대본으로 답변
              </button>

              <button
                type="button"
                onClick={() => handleCopyScript(latestCopilot.suggestedScript)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer"
                title="대본 복사"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Live Dialogue Chat Flow */}
        <div
          ref={chatScrollRef}
          className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 bg-slate-900/60 text-xs"
          style={{ minHeight: '180px', maxHeight: '35vh' }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${
                msg.sender === 'teacher' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                <span className="font-semibold">
                  {msg.sender === 'teacher' ? '선생님 (본인)' : currentSc.callerName}
                </span>
                <span>·</span>
                <span>{msg.time}</span>
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 leading-relaxed shadow-sm ${
                  msg.sender === 'teacher'
                    ? 'bg-[#0E6B5C] text-white rounded-br-xs'
                    : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-xs'
                }`}
              >
                <p className="break-words">{msg.text}</p>
              </div>
            </div>
          ))}

          {isParentThinking && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-spin" />
              <span>학부모가 발언 중입니다...</span>
            </div>
          )}
        </div>

        {/* 5. Teacher Input Console & Real Call Controls */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-2.5">
          {isCallActive ? (
            <>
              {/* Input row */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={isMicListening ? stopMic : startMic}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                    isMicListening
                      ? 'bg-red-600 text-white animate-pulse shadow-red-500/50 shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title={isMicListening ? '음성인식 중지' : '음성으로 말하기'}
                >
                  {isMicListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={teacherInput}
                  onChange={(e) => setTeacherInput(e.target.value)}
                  onCompositionStart={() => {
                    isTeacherInputComposingRef.current = true;
                  }}
                  onCompositionEnd={() => {
                    isTeacherInputComposingRef.current = false;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      if (
                        e.nativeEvent.isComposing ||
                        isTeacherInputComposingRef.current ||
                        e.nativeEvent.keyCode === 229
                      ) {
                        return;
                      }
                      e.preventDefault();
                      handleTeacherSubmit();
                    }
                  }}
                  placeholder={
                    isMicListening
                      ? '말씀하시면 실시간으로 입력됩니다...'
                      : '답변을 직접 입력하거나 추천 대본을 누르세요...'
                  }
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-[#0E6B5C] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
                />

                <button
                  type="button"
                  onClick={() => handleTeacherSubmit()}
                  disabled={!teacherInput.trim() || isParentThinking}
                  className="px-3.5 py-2.5 bg-[#0E6B5C] hover:bg-[#0A5448] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>전송</span>
                </button>
              </div>

              {/* Call Control Footer */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-slate-400">
                  {isMicListening ? (
                    <span className="text-red-400 animate-pulse font-semibold">
                      ● 마이크 청취 중... 말씀하세요
                    </span>
                  ) : (
                    <span>* Gemini AI가 실시간 학부모로 대화에 응답합니다.</span>
                  )}
                </div>

                {/* Big Red Hang Up Button */}
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  <PhoneOff className="w-3.5 h-3.5" /> 통화 종료
                </button>
              </div>
            </>
          ) : (
            /* Call Ended Screen */
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center mx-auto">
                <PhoneOff className="w-5 h-5 text-red-400" />
              </div>

              <div>
                <h4 className="font-bold text-sm text-white">통화가 종료되었습니다</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  총 통화 시간: <span className="font-mono text-emerald-400">{formatTimer(callDuration)}</span> · 대화 {messages.length}회차 기록 완료
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveToMemo}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0E6B5C] hover:bg-[#0A5448] text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-300" />
                  오늘의 메모에 자동 저장 & 교권 침해 분석
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCallActive(true);
                    setCallDuration(0);
                    setMessages([
                      {
                        sender: 'parent',
                        text: currentSc.initialUtterance,
                        time: '00:01',
                      },
                    ]);
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  다시 통화하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
