import React, { useState } from 'react';
import { Memo, Student } from '../types';
import {
  Clock,
  Mic,
  FileText,
  CheckCircle,
  ArrowRight,
  Trash2,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface TodayMemosSectionProps {
  memos: Memo[];
  students: Student[];
  onConvertMemo: (memo: Memo) => void;
  onDeleteMemo: (memoId: number) => void;
  onOpenRecord: (recordId: number) => void;
}

export const TodayMemosSection: React.FC<TodayMemosSectionProps> = ({
  memos,
  students,
  onConvertMemo,
  onDeleteMemo,
  onOpenRecord,
}) => {
  const [filterMode, setFilterMode] = useState<'today_all' | 'pending' | 'converted' | 'all'>('today_all');

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayMemos = memos.filter((m) => m.date === todayStr);

  const filteredMemos = memos.filter((m) => {
    if (filterMode === 'today_all') return m.date === todayStr;
    if (filterMode === 'pending') return m.date === todayStr && !m.converted;
    if (filterMode === 'converted') return m.date === todayStr && m.converted;
    return true; // all
  });

  const pendingCount = todayMemos.filter((m) => !m.converted).length;
  const convertedCount = todayMemos.filter((m) => m.converted).length;

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4">
      {/* Header with Title and Today's Metric */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0E6B5C] shrink-0" />
            <h3 className="text-sm font-bold text-slate-900 whitespace-nowrap">
              오늘의 메모 및 사건 기록
            </h3>
          </div>
          {/* PC metric subtitle */}
          <span className="hidden sm:inline text-xs text-slate-500 tabular-nums">
            (오늘 총 {todayMemos.length}건 · 미전환 {pendingCount}건 · 정식 일지화 {convertedCount}건)
          </span>
          {/* Mobile compact badge */}
          <span className="sm:hidden text-[11px] font-semibold text-[#0E6B5C] bg-[#E3F3EF] px-2 py-0.5 rounded-full whitespace-nowrap">
            오늘 {todayMemos.length}건
          </span>
        </div>

        {/* Filter Tabs - Clean 4-column grid on mobile, exact pill bar on PC */}
        <div className="grid grid-cols-4 sm:flex items-center gap-1 bg-slate-100 p-1 sm:p-0.5 rounded-xl sm:rounded-lg text-xs font-medium w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterMode('today_all')}
            className={`px-1.5 sm:px-2.5 py-1.5 sm:py-1 rounded-lg sm:rounded-md transition-colors whitespace-nowrap shrink-0 text-center ${
              filterMode === 'today_all'
                ? 'bg-white text-slate-900 shadow-xs font-bold sm:font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="sm:hidden">오늘({todayMemos.length})</span>
            <span className="hidden sm:inline">오늘 전체 ({todayMemos.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('pending')}
            className={`px-1.5 sm:px-2.5 py-1.5 sm:py-1 rounded-lg sm:rounded-md transition-colors whitespace-nowrap shrink-0 text-center ${
              filterMode === 'pending'
                ? 'bg-white text-amber-900 shadow-xs font-bold sm:font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="sm:hidden">대기({pendingCount})</span>
            <span className="hidden sm:inline">대기중 ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('converted')}
            className={`px-1.5 sm:px-2.5 py-1.5 sm:py-1 rounded-lg sm:rounded-md transition-colors whitespace-nowrap shrink-0 text-center ${
              filterMode === 'converted'
                ? 'bg-white text-emerald-900 shadow-xs font-bold sm:font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="sm:hidden">완료({convertedCount})</span>
            <span className="hidden sm:inline">일지 등록됨 ({convertedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-1.5 sm:px-2.5 py-1.5 sm:py-1 rounded-lg sm:rounded-md transition-colors whitespace-nowrap shrink-0 text-center ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-bold sm:font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="sm:hidden">전체({memos.length})</span>
            <span className="hidden sm:inline">전체 히스토리 ({memos.length})</span>
          </button>
        </div>
      </div>

      {/* Memos List */}
      {filteredMemos.length > 0 ? (
        <div className="space-y-3">
          {filteredMemos.map((memo) => {
            const student = memo.detectedStudentId
              ? students.find((s) => s.id === memo.detectedStudentId)
              : null;

            return (
              <div
                key={memo.id}
                className="group border border-slate-200 hover:border-[#0E6B5C]/40 rounded-xl p-3.5 sm:p-4 bg-[#FCFDFD] hover:bg-white transition-all shadow-xs space-y-2.5"
              >
                {/* Meta Top Line: Mobile vs PC */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  {/* Left Meta Badges */}
                  <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 overflow-x-auto no-scrollbar min-w-0">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 whitespace-nowrap shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{memo.date === todayStr ? formatTime(memo.created) : `${memo.date} ${formatTime(memo.created)}`}</span>
                    </span>

                    {memo.isAudio && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0E6B5C] bg-[#E3F3EF] px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
                        <Mic className="w-3 h-3 shrink-0" /> 음성
                      </span>
                    )}

                    {student && (
                      <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap shrink-0">
                        {student.name} ({student.cls})
                      </span>
                    )}

                    {memo.detectedTarget && (
                      <span className="hidden sm:inline text-slate-500 text-[11px] whitespace-nowrap shrink-0">
                        대상: {memo.detectedTarget} · {memo.detectedMethod || '전화'}
                      </span>
                    )}
                  </div>

                  {/* Right Status & Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {memo.converted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="sm:hidden">등록됨</span>
                        <span className="hidden sm:inline">상담 일지 등록 완료</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        <span className="sm:hidden">미전환</span>
                        <span className="hidden sm:inline">미전환 메모</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteMemo(memo.id)}
                      className="sm:opacity-0 sm:group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 transition-opacity"
                      title="메모 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Memo Body */}
                <p className="text-[13px] sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-keep">
                  {memo.text}
                </p>

                {/* Card Actions: Clean Full-Width Single-Line Button on Mobile, Classic Split on PC */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="hidden sm:inline text-slate-400 text-[11px] whitespace-nowrap">
                    {memo.text.length}자 기록됨
                  </span>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {memo.converted && memo.recordId ? (
                      <button
                        type="button"
                        onClick={() => onOpenRecord(memo.recordId!)}
                        className="w-full sm:w-auto justify-center inline-flex items-center gap-1 text-[#0E6B5C] hover:text-[#0A5448] bg-[#E3F3EF]/50 sm:bg-transparent font-bold py-2 sm:py-1 px-3 sm:px-2.5 rounded-lg sm:rounded hover:bg-[#E3F3EF] transition-colors whitespace-nowrap"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>분석 결과 보고서 열기</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onConvertMemo(memo)}
                        className="w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-1.5 bg-[#0E6B5C] hover:bg-[#0A5448] text-white font-bold rounded-lg transition-all shadow-xs whitespace-nowrap"
                      >
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>정식 상담 기록 전환 및 위험도 분석</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">
            {filterMode === 'pending'
              ? '대기 중인 메모가 없습니다. 모든 메모가 상담 일지로 분석 및 저장되었습니다.'
              : filterMode === 'converted'
              ? '아직 일지로 등록된 메모가 없습니다.'
              : '오늘 작성된 메모가 없습니다.'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            위의 [빠른 메모] 입력창에 사건 내용을 작성하거나 음성으로 말해보세요.
          </p>
        </div>
      )}
    </section>
  );
};
