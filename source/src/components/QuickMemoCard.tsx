import React, { useState, useEffect } from 'react';
import { Mic, Send, Save, Sparkles, User, Tag, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Student } from '../types';
import { VoiceRecorder } from './VoiceRecorder';

interface QuickMemoCardProps {
  students: Student[];
  onSaveMemoOnly: (text: string) => void;
  onAgentTriage: (text: string) => void;
}

const QUICK_TAGS = [
  { label: '+ 학부모 전화', text: '학부모에게 전화가 와서 ' },
  { label: '+ 수행평가/성적', text: '수행평가 성적 관련하여 ' },
  { label: '+ 방과후 방문 예고', text: '내일 학교로 직접 찾아오겠다고 ' },
  { label: '+ 문자/카톡 민원', text: '학부모가 문자로 ' },
  { label: '+ 교우관계 생활지도', text: '학생 교우관계 상담 중 ' },
];

export const QuickMemoCard: React.FC<QuickMemoCardProps> = ({
  students,
  onSaveMemoOnly,
  onAgentTriage,
}) => {
  const [memoText, setMemoText] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [detectedStudent, setDetectedStudent] = useState<Student | null>(null);
  const [autoAnalyzeVoice, setAutoAnalyzeVoice] = useState(true);

  // Live auto-detect student from text
  useEffect(() => {
    if (!memoText.trim()) {
      setDetectedStudent(null);
      return;
    }
    const found = students.find((s) => memoText.includes(s.name));
    setDetectedStudent(found || null);
  }, [memoText, students]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAgentSubmit();
    }
  };

  const handleSaveOnly = () => {
    if (!memoText.trim()) return;
    onSaveMemoOnly(memoText.trim());
    setMemoText('');
    setShowVoiceRecorder(false);
  };

  const handleAgentSubmit = () => {
    if (!memoText.trim()) return;
    onAgentTriage(memoText.trim());
    setMemoText('');
    setShowVoiceRecorder(false);
  };

  const handleVoiceTranscript = (transcript: string) => {
    const updated = memoText ? `${memoText} ${transcript}` : transcript;
    setMemoText(updated);
    if (autoAnalyzeVoice && transcript.trim()) {
      onAgentTriage(updated);
      setMemoText('');
      setShowVoiceRecorder(false);
    }
  };

  const addQuickTag = (tagText: string) => {
    setMemoText((prev) => (prev ? `${prev} ${tagText}` : tagText));
  };

  return (
    <div className="bg-white border-2 border-[#0E6B5C]/20 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:border-[#0E6B5C]/40 transition-all space-y-3 sm:space-y-4">
      {/* Top Banner / Heading */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5 sm:pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0E6B5C] animate-pulse shrink-0" />
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
            <span className="sm:hidden">빠른 메모 & 음성 기록</span>
            <span className="hidden sm:inline">빠른 메모 & 실시간 기록 스테이션</span>
          </h2>
          <span className="text-xs text-slate-500 hidden lg:inline truncate">
            · 사건 발생 직후 구두·텍스트로 남겨두면 Agent가 법률 조항과 누적 반복성을 분석합니다
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap ${
              showVoiceRecorder
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-[#E3F3EF] text-[#0E6B5C] border-[#0E6B5C]/30 hover:bg-[#CBE7E0]'
            }`}
          >
            <Mic className="w-3.5 h-3.5 shrink-0" />
            <span>{showVoiceRecorder ? '음성 닫기' : '음성 입력'}</span>
          </button>
        </div>
      </div>

      {/* Voice Recorder Overlay (Collapsible) */}
      {showVoiceRecorder && (
        <VoiceRecorder
          onTranscriptComplete={handleVoiceTranscript}
          onClose={() => setShowVoiceRecorder(false)}
          autoAnalyze={autoAnalyzeVoice}
          onAutoAnalyzeChange={setAutoAnalyzeVoice}
        />
      )}

      {/* Quick Situation Helpers */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs text-slate-600 no-scrollbar">
        <span className="text-slate-400 shrink-0 hidden sm:flex items-center gap-1 text-[11px]">
          <Tag className="w-3 h-3" /> 빠른 태그:
        </span>
        {QUICK_TAGS.map((tag, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => addQuickTag(tag.text)}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-xs whitespace-nowrap transition-colors shrink-0"
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          rows={3}
          value={memoText}
          onChange={(e) => setMemoText(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={1000}
          placeholder="사건이나 상담 내용을 자유롭게 적어보세요. (예: 김철수 학부모가 전화로 수행평가 점수 올려달라며 고함지르고 내일 학교로 찾아오겠다고 함)"
          className="w-full bg-[#FBFDFD] border border-slate-200 focus:border-[#0E6B5C] focus:ring-2 focus:ring-[#0E6B5C]/15 rounded-xl p-3 sm:p-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none resize-none leading-relaxed transition-all min-h-[84px] sm:min-h-[96px]"
        />

        {/* Dynamic detected student pill */}
        {detectedStudent && (
          <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 bg-[#E3F3EF] border border-[#0E6B5C]/30 text-[#0E6B5C] px-2.5 py-0.5 rounded-full text-[11px] font-semibold shadow-xs animate-fadeIn whitespace-nowrap">
            <User className="w-3 h-3 shrink-0" />
            <span>
              자동 인식: {detectedStudent.name} ({detectedStudent.cls})
            </span>
          </div>
        )}

        <div className="absolute bottom-2.5 right-3 text-[11px] text-slate-400 tabular-nums">
          {memoText.length}/1000
        </div>
      </div>

      {/* Bottom Bar: Action Buttons & Guidance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pt-0.5">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-[#0E6B5C] shrink-0" />
          <span className="text-xs">
            교사의 주관적 감정문은 Agent가 자동 분리하여 사실만 객관적으로 분석합니다.
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleSaveOnly}
            disabled={!memoText.trim()}
            className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 min-h-[42px] sm:min-h-[44px] px-3 sm:px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5 shrink-0" />
            <span>메모만 저장</span>
          </button>

          <button
            type="button"
            onClick={handleAgentSubmit}
            disabled={!memoText.trim()}
            className="flex-[1.4] sm:flex-initial justify-center inline-flex items-center gap-1.5 min-h-[42px] sm:min-h-[44px] px-3.5 sm:px-4 py-2 bg-[#0E6B5C] hover:bg-[#0A5448] text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span>Agent 분석 및 일지 전환</span>
          </button>
        </div>
      </div>
    </div>
  );
};
