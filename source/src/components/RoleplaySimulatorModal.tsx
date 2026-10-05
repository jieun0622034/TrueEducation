import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Bot,
  User,
  Sparkles,
  Send,
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Plus,
  RefreshCw,
  Wand2,
  Shield,
  Scale,
  Brain,
} from 'lucide-react';
import { RoleplayMessage, Student } from '../types';

import { agentFetch } from '../utils/agentApi';
interface RoleplayScenario {
  id: string;
  title: string;
  parentInitial: string;
  difficulty: string;
  persona?: string;
  expectedKeywords?: string[];
  rubricTips?: string;
}

interface RoleplaySimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherName: string;
  students?: Student[];
}

const DEFAULT_SCENARIOS: RoleplayScenario[] = [
  {
    id: 'score',
    title: '시나리오 A: 수행평가 감점 항의 및 점수 상향 요구',
    parentInitial:
      '선생님, 우리 아이가 밤새며 준비했는데 1점 깎여서 2등급 떨어지게 생겼어요. 이거 채점 기준이 엉터리 아닙니까? 당장 만점으로 고쳐주세요!',
    difficulty: '보통',
    persona: '성적 결과에 집착하며 감정적으로 재채점을 강요하는 학부모',
    rubricTips: '학교 평가관리규정 및 공식 이의신청 절차를 침착하게 안내할 것',
  },
  {
    id: 'threat',
    title: '시나리오 B: 맘카페 유포 및 교육청 민원 협박',
    parentInitial:
      '당신 같은 교사 밑에서 우리 애가 마음고생한 거 생각하면 피눈물이 나요. 오늘 통화 녹음한 거 맘카페랑 교육청 민원에 그대로 다 올릴 겁니다!',
    difficulty: '고위험',
    persona: '온라인 커뮤니티 파급력을 무기로 교사를 심리적으로 압박하는 학부모',
    rubricTips: '허위사실 유포 및 명예훼손에 대한 법적 경고와 관리자 보고 절차 고지',
  },
  {
    id: 'night_visit',
    title: '시나리오 C: 퇴근 후 밤 10시 전화 및 내일 학교 방문 난동',
    parentInitial:
      '밤늦게 연락해서 미안하지만 나 지금 화가 머리끝까지 났어요. 내일 아침 교무실 쳐들어갈 테니까 교장 선생님이랑 같이 대기하세요!',
    difficulty: '최고위험',
    persona: '근무시간 외 폭언 및 학교 내 침입과 소란을 예고하는 다혈질 학부모',
    rubricTips: '근무시간 외 연락 제한 고지 및 방문 시 관리자 동석 사전예약 원칙 안내',
  },
];

export const RoleplaySimulatorModal: React.FC<RoleplaySimulatorModalProps> = ({
  isOpen,
  onClose,
  teacherName,
  students = [],
}) => {
  const [scenarios, setScenarios] = useState<RoleplayScenario[]>(DEFAULT_SCENARIOS);
  const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario>(DEFAULT_SCENARIOS[0]);
  const [messages, setMessages] = useState<RoleplayMessage[]>([]);
  const [teacherInput, setTeacherInput] = useState('');
  const [isSimulatingResponse, setIsSimulatingResponse] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [isMicListening, setIsMicListening] = useState(false);

  // Scenario Architect Agent Builder states
  const [showAgentBuilder, setShowAgentBuilder] = useState(false);
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [agentStep, setAgentStep] = useState<string>('');
  const [builderForm, setBuilderForm] = useState({
    studentName: students[0]?.name || '김철수',
    gradeLevel: '중학교 2학년',
    issueCategory: '수행평가 채점 기준 불복 및 폭언',
    difficulty: '고위험 (주의~높음)',
    customPrompt: '',
  });

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Setup initial message
  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          sender: 'parent',
          text: selectedScenario.parentInitial,
          timestamp: '시작',
        },
      ]);
      if (isTtsEnabled) {
        speakText(selectedScenario.parentInitial);
      }
    } else {
      stopTts();
      stopMic();
    }
    return () => {
      stopTts();
      stopMic();
    };
  }, [isOpen, selectedScenario]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isSimulatingResponse]);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || !isTtsEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch {}
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
      alert('현재 브라우저 환경에서 마이크 음성 인식을 지원하지 않습니다. 텍스트 입력창을 이용해주세요.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => setIsMicListening(true);
      recognition.onresult = (event: any) => {
        let text = '';
        for (let i = 0; i < event.results.length; ++i) {
          text += event.results[i][0].transcript;
        }
        setTeacherInput(text);
      };
      recognition.onerror = () => setIsMicListening(false);
      recognition.onend = () => setIsMicListening(false);

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

  const handleSelectScenario = (sc: RoleplayScenario) => {
    setSelectedScenario(sc);
    setMessages([
      {
        sender: 'parent',
        text: sc.parentInitial,
        timestamp: '시작',
      },
    ]);
    setTeacherInput('');
    if (isTtsEnabled) {
      speakText(sc.parentInitial);
    }
  };

  // Generate new Scenario with Scenario Architect Agent
  const handleGenerateScenario = async () => {
    setIsGeneratingScenario(true);
    setAgentStep('① 교원지위법 판례 및 교육부 고시 침해 유형 분석 중...');

    try {
      setTimeout(() => {
        setAgentStep('② 상대 학부모 심리 프로파일 및 격앙 발언 톤(Tone) 구성 중...');
      }, 700);

      setTimeout(() => {
        setAgentStep('③ 교사 법적 방어 채점 루브릭 및 키워드 생성 중...');
      }, 1400);

      const res = await agentFetch('/api/gemini/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(builderForm),
      });

      const data = await res.json();
      const generated = data.scenario;

      const newScenario: RoleplayScenario = {
        id: generated.id || `agent-${Date.now()}`,
        title: `[Agent 맞춤] ${generated.title || builderForm.issueCategory}`,
        parentInitial:
          generated.parentInitial ||
          `선생님, ${builderForm.studentName} 담임 맞으시죠? 지금 당장 교무실 앞으로 나와서 해명하세요!`,
        difficulty: generated.difficulty || builderForm.difficulty,
        persona: generated.persona || `${builderForm.studentName} 학생 학부모`,
        expectedKeywords: generated.expectedKeywords || ['규정', '절차', '교무실'],
        rubricTips: generated.rubricTips || '공식 절차와 감정적 언쟁 방지를 고지할 것',
      };

      setScenarios((prev) => [newScenario, ...prev]);
      setSelectedScenario(newScenario);
      setMessages([
        {
          sender: 'parent',
          text: newScenario.parentInitial,
          timestamp: '시작',
        },
      ]);
      setShowAgentBuilder(false);
      setIsGeneratingScenario(false);
      setAgentStep('');

      if (isTtsEnabled) {
        speakText(newScenario.parentInitial);
      }
    } catch {
      setIsGeneratingScenario(false);
      setAgentStep('');
    }
  };

  const handleTeacherSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = teacherInput.trim();
    if (!text) return;

    stopMic();
    setTeacherInput('');

    const newMsgList: RoleplayMessage[] = [
      ...messages,
      {
        sender: 'teacher',
        text,
        timestamp: '방금',
      },
    ];

    setMessages(newMsgList);
    setIsSimulatingResponse(true);

    try {
      const res = await agentFetch('/api/gemini/call-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: `${selectedScenario.title} (${selectedScenario.persona || ''})`,
          teacherInput: text,
          conversationHistory: newMsgList.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      const data = await res.json();
      const parentReply =
        data.parentReply ||
        '아니 선생님, 제 말의 핵심은 그게 아니잖아요! 왜 원칙 핑계만 대시면서 학부모 요구를 무시하십니까?';
      const copilot = data.copilot || {};

      // Scoring heuristic
      const isComposed = !/화나|짜증|어쩌라|당신|그만|소리/i.test(text);
      const hasLegalNotice = /기준|규정|공식|절차|근무시간|학교|교무실|교원지위/i.test(text);

      let score = 70;
      let tip = '';
      if (isComposed && hasLegalNotice) {
        score = 96;
        tip = '완벽합니다! 감정적 언쟁을 단호히 차단하고 학교 공식 규정과 절차를 침착하게 고지하셨습니다.';
      } else if (!isComposed) {
        score = 45;
        tip = '주의: 상대방의 격앙된 언사에 맞대응하면 오히려 상대방의 민원 빌미가 될 수 있습니다. 감정을 배제하고 공식 창구를 고지하세요.';
      } else {
        score = 80;
        tip = '양호합니다. 추가로 "교무실 안심번호를 통한 정식 면담 신청"이나 "교원지위법상 교육활동 보호 원칙"을 언급하시면 더 견고해집니다.';
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: `[Agent 실시간 코칭 피드백: ${score}점] ${tip}`,
          timestamp: '분석 완료',
          feedback: {
            score,
            tip,
            isAppropriate: score >= 75,
          },
        },
        {
          sender: 'parent',
          text: parentReply,
          timestamp: '방금',
        },
      ]);
      setIsSimulatingResponse(false);

      if (isTtsEnabled) {
        speakText(parentReply);
      }
    } catch {
      // Fallback response
      const fallbackReply = '선생님 말씀은 알겠지만 저는 납득할 수 없습니다. 교장 선생님과 직접 이야기하겠습니다.';
      setMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: '[Agent 실시간 코칭 피드백: 85점] 침착하게 공식 절차를 안내하셨습니다.',
          timestamp: '분석 완료',
          feedback: {
            score: 85,
            tip: '침착하게 공식 절차를 안내하셨습니다.',
            isAppropriate: true,
          },
        },
        {
          sender: 'parent',
          text: fallbackReply,
          timestamp: '방금',
        },
      ]);
      setIsSimulatingResponse(false);

      if (isTtsEnabled) {
        speakText(fallbackReply);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl max-w-3xl w-full max-h-[95vh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden pb-safe sm:pb-0">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-2 sm:hidden shrink-0 mobile-drag-handle" />

        {/* Top Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-100 bg-[#FAFBFB]">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 truncate">
                  AI 모의 학부모 상담 및 교권 방어 시뮬레이터
                </h2>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full border border-indigo-200 shrink-0">
                  Agent Sandbox
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate hidden xs:block">
                격앙된 학부모와의 실전 대화를 시뮬레이션하고, 교사의 법적 대응과 감정 침착성을 실시간 채점합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {/* TTS Toggle */}
            <button
              onClick={() => {
                const next = !isTtsEnabled;
                setIsTtsEnabled(next);
                if (!next) stopTts();
              }}
              title={isTtsEnabled ? '음성 낭독 끄기' : '음성 낭독 켜기'}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                isTtsEnabled ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {isTtsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* 🌟 Scenario Architect Agent Generator Trigger Banner */}
        <div className="px-3.5 sm:px-6 py-2 bg-gradient-to-r from-indigo-50 via-purple-50 to-white border-b border-indigo-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 animate-pulse" />
            <span className="text-xs font-bold text-indigo-950 truncate">
              {showAgentBuilder
                ? 'AI 시나리오 생성 에이전트 설정'
                : '원하는 상황을 에이전트가 새롭게 짜드립니다'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAgentBuilder(!showAgentBuilder)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Wand2 className="w-3 h-3" />
            <span>{showAgentBuilder ? '창 닫기' : '새 시나리오 생성'}</span>
          </button>
        </div>

        {/* Agent Builder Form (Collapsible) */}
        {showAgentBuilder && (
          <div className="p-3.5 sm:p-5 bg-indigo-50/40 border-b border-indigo-100 space-y-3 text-xs animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="font-bold text-slate-700 block mb-1">대상 학생 및 학년</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={builderForm.studentName}
                    onChange={(e) => setBuilderForm({ ...builderForm, studentName: e.target.value })}
                    placeholder="학생 이름 (예: 김철수)"
                    className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={builderForm.gradeLevel}
                    onChange={(e) => setBuilderForm({ ...builderForm, gradeLevel: e.target.value })}
                    placeholder="학년 (예: 중2, 초5)"
                    className="w-24 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">훈련 난이도</label>
                <select
                  value={builderForm.difficulty}
                  onChange={(e) => setBuilderForm({ ...builderForm, difficulty: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value="보통 (단순 항의)">보통 (단순 항의 및 하소연)</option>
                  <option value="주의 (학교 절차 거부)">주의 (학교 절차 거부 및 교사 역정)</option>
                  <option value="고위험 (주의~높음)">고위험 (폭언·맘카페 유포·고소 협박)</option>
                  <option value="최고위험 (방문 난동)">최고위험 (불시 방문 난동 및 위해 암시)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">사안 분야 / 침해 유형</label>
              <input
                type="text"
                value={builderForm.issueCategory}
                onChange={(e) => setBuilderForm({ ...builderForm, issueCategory: e.target.value })}
                placeholder="예: 수행평가 1점 상향 강요, 학폭 가해 지목 불복, 밤 11시 사생활 연락..."
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
              />
            </div>

            {/* Quick Random Situations */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 font-semibold">추천 사안:</span>
              {[
                '수행평가 채점 기준 불복',
                '학폭 가해 지목 및 교사 고소 협박',
                '맘카페 악의적 유포 및 교육청 민원',
                '밤 10시 전화 및 교무실 불시 방문',
              ].map((cat, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setBuilderForm({ ...builderForm, issueCategory: cat })}
                  className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 rounded text-[11px] text-slate-600 transition-colors cursor-pointer"
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Agent Generation Progress */}
            {isGeneratingScenario ? (
              <div className="p-3 bg-indigo-100/70 border border-indigo-200 rounded-xl space-y-1.5 text-center">
                <div className="flex items-center justify-center gap-2 text-indigo-900 font-bold">
                  <Brain className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>AI Scenario Architect Agent 작동 중...</span>
                </div>
                <p className="text-xs text-indigo-700 font-mono animate-pulse">{agentStep}</p>
              </div>
            ) : (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleGenerateScenario}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>에이전트로 새 시나리오 생성 & 실전 시작</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Scenario Carousel Selector */}
        <div className="px-3.5 sm:px-6 py-2 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs bg-slate-50/50">
          <span className="font-semibold text-slate-400 shrink-0">선택:</span>
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(sc)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                selectedScenario.id === sc.id
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="mr-1">{sc.title}</span>
              <span className="text-[10px] opacity-80">({sc.difficulty})</span>
            </button>
          ))}
        </div>

        {/* Rubric Guidance Banner */}
        <div className="px-3.5 sm:px-6 py-2 bg-[#FAFBFB] border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5 truncate">
            <Scale className="w-3.5 h-3.5 text-[#0E6B5C] shrink-0" />
            <span className="font-bold text-slate-800 shrink-0">방어 핵심 수칙:</span>
            <span className="truncate">{selectedScenario.rubricTips || '공식 절차 안내 및 감정적 언쟁 차단'}</span>
          </div>

          <button
            onClick={() => handleSelectScenario(selectedScenario)}
            className="text-slate-400 hover:text-slate-600 inline-flex items-center gap-0.5 shrink-0 ml-2 cursor-pointer"
            title="대화 초기화"
          >
            <RotateCcw className="w-3 h-3" /> 초기화
          </button>
        </div>

        {/* Chat Messages Body */}
        <div
          ref={chatScrollRef}
          className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-3.5 bg-slate-50/30 text-xs"
          style={{ minHeight: '220px', maxHeight: '45vh' }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.sender === 'teacher'
                  ? 'items-end'
                  : msg.sender === 'agent'
                  ? 'items-center'
                  : 'items-start'
              }`}
            >
              {msg.sender === 'agent' ? (
                <div className="w-full my-1.5 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-950 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1 text-[11px] text-indigo-700">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Agent 실시간 대응력 채점
                    </span>
                    <span className="text-xs font-mono font-black text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                      {msg.feedback?.score}점 / 100점
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-700">
                    {msg.feedback?.tip}
                  </p>
                </div>
              ) : (
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 leading-relaxed shadow-xs ${
                    msg.sender === 'teacher'
                      ? 'bg-[#0E6B5C] text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  <div className="text-[10px] font-semibold opacity-75 mb-0.5">
                    {msg.sender === 'teacher' ? `${teacherName} (선생님)` : '학부모'}
                  </div>
                  <p className="break-words">{msg.text}</p>
                </div>
              )}
            </div>
          ))}

          {isSimulatingResponse && (
            <div className="flex items-center gap-2 text-slate-400 italic text-xs p-2">
              <Bot className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span>학부모가 다음 발언을 준비 중이며, Agent가 법적 대응력을 분석 중입니다...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleTeacherSubmit}
          className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={isMicListening ? stopMic : startMic}
            className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              isMicListening
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title="음성으로 말하기"
          >
            {isMicListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={teacherInput}
            onChange={(e) => setTeacherInput(e.target.value)}
            placeholder={
              isMicListening
                ? '음성 인식 중... 말씀하시면 자동으로 입력됩니다'
                : '선생님의 방어 답변을 입력하세요 (예: "학부모님, 규정에 따라 공식 절차로...")'
            }
            className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
          />

          <button
            type="submit"
            disabled={!teacherInput.trim() || isSimulatingResponse}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">전송</span>
          </button>
        </form>
      </div>
    </div>
  );
};
