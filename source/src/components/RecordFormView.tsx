import React, { useState } from 'react';
import { Student } from '../types';
import { Sparkles, ArrowLeft, Send, Check } from 'lucide-react';
import { splitFactAndEmotion } from '../utils/engine';

interface RecordFormViewProps {
  students: Student[];
  initialStudentId?: number;
  initialContent?: string;
  initialPurpose?: string;
  initialDate?: string;
  initialTarget?: '학부모' | '학생' | '교사';
  initialMethod?: '전화' | '문자' | '내방' | '화상';
  initialKind?: '상담' | '일상';
  memoId?: number;
  onBack: () => void;
  onSubmitAnalysis: (recordData: {
    studentId: number;
    studentName: string;
    studentNo: string;
    studentCls: string;
    date: string;
    kind: '상담' | '일상';
    target: '학부모' | '학생' | '교사';
    method: '전화' | '문자' | '내방' | '화상';
    purpose: string;
    content: string;
    memoId?: number;
  }) => void;
}

export const RecordFormView: React.FC<RecordFormViewProps> = ({
  students,
  initialStudentId,
  initialContent = '',
  initialPurpose = '',
  initialDate,
  initialTarget = '학부모',
  initialMethod = '전화',
  initialKind = '상담',
  memoId,
  onBack,
  onSubmitAnalysis,
}) => {
  const [studentId, setStudentId] = useState<number>(
    initialStudentId || (students.length > 0 ? students[0].id : 0)
  );
  const [date, setDate] = useState<string>(
    initialDate || new Date().toISOString().slice(0, 10)
  );
  const [kind, setKind] = useState<'상담' | '일상'>(initialKind);
  const [target, setTarget] = useState<'학부모' | '학생' | '교사'>(initialTarget);
  const [method, setMethod] = useState<'전화' | '문자' | '내방' | '화상'>(initialMethod);
  const [purpose, setPurpose] = useState<string>(initialPurpose);
  const [content, setContent] = useState<string>(initialContent);
  const [error, setError] = useState<string | null>(null);

  // Live fact & emotion preview
  const { fact, emotion } = splitFactAndEmotion(content);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!studentId) {
      setError('관련 학생을 선택해주세요.');
      return;
    }
    if (!content.trim()) {
      setError('상담 및 사건 내용을 입력해주세요.');
      return;
    }

    const stu = students.find((s) => s.id === studentId);
    if (!stu) return;

    onSubmitAnalysis({
      studentId: stu.id,
      studentName: stu.name,
      studentNo: stu.no,
      studentCls: stu.cls,
      date,
      kind,
      target,
      method,
      purpose: purpose.trim(),
      content: content.trim(),
      memoId,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          돌아가기
        </button>
        <h1 className="text-base font-bold text-slate-900">
          정식 상담·교권 사건 기록 작성
        </h1>
        <div className="w-16" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          {/* Row 1: Student & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                관련 학생 *
              </label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0E6B5C]"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.cls} · 학번 {s.no})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                발생 일자 *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0E6B5C]"
              />
            </div>
          </div>

          {/* Row 2: Target & Method & Kind */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Kind */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                기록 성격
              </label>
              <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                {(['상담', '일상'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`flex-1 min-h-[40px] sm:min-h-0 py-2 sm:py-1.5 rounded-md font-semibold transition-colors ${
                      kind === k
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Target */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                상담/연락 대상
              </label>
              <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                {(['학부모', '학생', '교사'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTarget(t)}
                    className={`flex-1 min-h-[40px] sm:min-h-0 py-2 sm:py-1.5 rounded-md font-semibold transition-colors ${
                      target === t
                        ? 'bg-[#0E6B5C] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Method */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                상담 방식
              </label>
              <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                {(['전화', '문자', '내방', '화상'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`flex-1 min-h-[40px] sm:min-h-0 py-2 sm:py-1.5 rounded-md font-semibold transition-colors ${
                      method === m
                        ? 'bg-[#0E6B5C] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Purpose */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              상담 목적 및 요약 (선택, 40자 이내)
            </label>
            <input
              type="text"
              maxLength={40}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="예: 수행평가 이의 제기 및 야간 방문 예고"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0E6B5C]"
            />
          </div>

          {/* Row 4: Detailed Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                상세 상담 내용 및 있었던 사실 *
              </label>
              <span className="text-[11px] text-slate-400">
                {content.length}/2000자
              </span>
            </div>
            <textarea
              rows={7}
              required
              maxLength={2000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="일어난 일과 상대방의 발언을 가감 없이 적어주세요. 선생님의 생각이나 감정을 섞어 적으셔도 Agent가 자동으로 사실과 감정을 분리하여 분석합니다."
              className="w-full p-3.5 bg-white border border-slate-200 focus:border-[#0E6B5C] focus:ring-2 focus:ring-[#0E6B5C]/15 rounded-xl text-xs text-slate-800 placeholder-slate-400 leading-relaxed outline-none"
            />
          </div>

          {/* Live Fact vs Emotion Preview Drawer */}
          {content.trim() && (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0E6B5C]" />
                  실시간 사실/감정 분리 미리보기
                </span>
                <span className="text-[10px] text-slate-400">
                  교사 심리 보호 및 법적 객관성 확보 알고리즘
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                  <span className="font-semibold text-slate-800 block mb-1 text-[11px]">
                    [객관적 사실] (위험도 분석 적용)
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {fact || '(사실 문장이 감지되지 않음)'}
                  </p>
                </div>

                <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg">
                  <span className="font-semibold text-amber-900 block mb-1 text-[11px]">
                    [선생님 감정] (판단에서 자동 제외)
                  </span>
                  <p className="text-amber-900/80 italic leading-relaxed">
                    {emotion || '(분리된 감정 표현 없음)'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              취소
            </button>

            <button
              type="submit"
              disabled={!content.trim()}
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0E6B5C] hover:bg-[#0A5448] text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              Agent 위험도 분석 및 일지 생성
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
