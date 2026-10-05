import React, { useState } from 'react';
import {
  AnalysisResult,
  ConsultationRecord,
  RiskLevel,
  Student,
} from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Printer,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  X,
  Sparkles,
  Info,
  Calendar,
  Layers,
  Scale,
} from 'lucide-react';
import { LEVEL_NAMES, generateDraftDocument } from '../utils/engine';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordData: {
    studentId: number;
    studentName: string;
    studentNo?: string;
    studentCls?: string;
    date: string;
    kind: '상담' | '일상';
    target: '학부모' | '학생' | '교사';
    method: '전화' | '문자' | '내방' | '화상';
    purpose?: string;
    content: string;
    level: RiskLevel;
    result: AnalysisResult;
    id?: number;
    memoId?: number;
    done?: number[];
  };
  onSaveRecord?: (record: any) => void;
  onOpenReport?: (studentId: number, target: string) => void;
  onOpenAdmissibility?: (recordData: any) => void;
  teacherName?: string;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  recordData,
  onSaveRecord,
  onOpenReport,
  onOpenAdmissibility,
  teacherName,
}) => {
  const [selectedSignalCode, setSelectedSignalCode] = useState<string | null>(null);
  const [draftType, setDraftType] = useState<'admin' | 'parent' | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [expandedLaws, setExpandedLaws] = useState<Record<string, boolean>>({});
  const [checkedAdvice, setCheckedAdvice] = useState<number[]>(recordData.done || []);

  if (!isOpen) return null;

  const { result } = recordData;
  const level = result.level;

  const toggleLaw = (id: string) => {
    setExpandedLaws((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAdvice = (index: number) => {
    setCheckedAdvice((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleCopyDraft = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  // Render fact text with highlighted signal spans
  const renderHighlightedFact = () => {
    const text = result.fact || recordData.content;
    const spans = result.spans || [];

    if (!spans.length) {
      return <span>{text}</span>;
    }

    // Sort spans by start index
    const sorted = [...spans].sort((a, b) => a.s - b.s);
    const elements: React.ReactNode[] = [];
    let cur = 0;

    sorted.forEach((sp, idx) => {
      if (sp.s > cur) {
        elements.push(<span key={`plain-${idx}`}>{text.slice(cur, sp.s)}</span>);
      }
      const isSelected = selectedSignalCode === sp.code;
      const highlightClass =
        sp.level === 2
          ? 'bg-red-100 text-red-900 border-b-2 border-red-500 font-medium'
          : sp.level === 1
          ? 'bg-amber-100 text-amber-900 border-b-2 border-amber-500 font-medium'
          : 'bg-emerald-100 text-emerald-900 border-b-2 border-emerald-500';

      elements.push(
        <mark
          key={`mark-${idx}`}
          className={`px-1 rounded-xs transition-all ${highlightClass} ${
            isSelected ? 'ring-2 ring-slate-900 ring-offset-1' : ''
          }`}
        >
          {text.slice(sp.s, sp.e)}
        </mark>
      );
      cur = Math.max(cur, sp.e);
    });

    if (cur < text.length) {
      elements.push(<span key="tail">{text.slice(cur)}</span>);
    }

    return elements;
  };

  const draftText = draftType
    ? generateDraftDocument(draftType, {
        studentName: recordData.studentName,
        studentNo: recordData.studentNo,
        date: recordData.date,
        target: recordData.target,
        method: recordData.method,
        content: recordData.content,
        purpose: recordData.purpose,
        result: recordData.result,
        teacherName,
      })
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl max-w-3xl w-full max-h-[94vh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden pb-safe sm:pb-0">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-[#FAFBFB]">
          <div className="flex items-center gap-2.5">
            {level === 2 ? (
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
            ) : level === 1 ? (
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  교권 보호 위험 신호 심층 분석 보고
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-black ${
                    level === 2
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : level === 1
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  위험도: {LEVEL_NAMES[level]}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {recordData.studentName} 학생 · {recordData.target} {recordData.method} 상담 · {recordData.date}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-sm text-slate-800 leading-relaxed">
          {/* Level Summary Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col gap-1.5 ${
              level === 2
                ? 'bg-red-50/70 border-red-200 text-red-950'
                : level === 1
                ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">
                {level === 2
                  ? '🚨 관리자(교감·교장) 즉시 공유 및 교육활동 침해 대응 조치가 권장됩니다'
                  : level === 1
                  ? '⚠️ 교권침해 우려 신호 및 동일 사안 누적 주의가 필요합니다'
                  : '✅ 교권침해에 해당하는 뚜렷한 위험 신호가 감지되지 않았습니다'}
              </span>
              <span className="text-xs font-semibold">
                감지 신호 {result.signals.filter((s) => s.code !== 'escalate').length}건
              </span>
            </div>

            {result.escalation && (
              <p className="text-xs font-medium text-red-700 mt-1">
                ※ {result.escalation}
              </p>
            )}
          </div>

          {/* Detected Signal Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0E6B5C]" />
                감지된 핵심 위험 신호 (클릭 시 본문 강조)
              </h3>
              {selectedSignalCode && (
                <button
                  onClick={() => setSelectedSignalCode(null)}
                  className="text-[11px] text-slate-500 hover:underline"
                >
                  선택 해제
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {result.signals.length > 0 ? (
                result.signals.map((sig, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setSelectedSignalCode(selectedSignalCode === sig.code ? null : sig.code)
                    }
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      sig.level === 2
                        ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        : sig.level === 1
                        ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    } ${selectedSignalCode === sig.code ? 'ring-2 ring-slate-900 font-bold' : ''}`}
                  >
                    <span>{sig.label}</span>
                    <span className="text-[10px] opacity-70">[{LEVEL_NAMES[sig.level]}]</span>
                  </button>
                ))
              ) : (
                <span className="text-xs text-slate-400">감지된 위험 신호가 없습니다.</span>
              )}
            </div>
          </div>

          {/* Fact vs Emotion Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fact Card */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800">
                  있었던 사실 (객관적 증빙 기준)
                </span>
                <span className="text-[11px] text-slate-400">위험 판단 대상</span>
              </div>
              <div className="text-xs text-slate-800 leading-relaxed min-h-[70px]">
                {renderHighlightedFact()}
              </div>
            </div>

            {/* Emotion Card */}
            <div className="border border-dashed border-amber-200 rounded-xl p-4 bg-amber-50/40 space-y-2">
              <div className="flex items-center justify-between border-b border-amber-200/50 pb-2">
                <span className="text-xs font-bold text-amber-900">
                  선생님의 심경·감정 분리 보관
                </span>
                <span className="text-[11px] text-amber-700">판단 제외 (보호)</span>
              </div>
              <div className="text-xs text-amber-900/80 italic leading-relaxed min-h-[70px]">
                {result.emotion || '별도로 분리된 감정 표현이 없습니다.'}
              </div>
              <p className="text-[10px] text-amber-700">
                * 감정 표현은 교사의 심리 보호 대상이며 공식 법적 판단 요소에서는 자동 배제됩니다.
              </p>
            </div>
          </div>

          {/* Cumulative Reoccurrence & Trend Analysis */}
          {result.trend && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#0E6B5C]" />
                  누적 흐름 및 연락 간격 분석
                </h4>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white border border-slate-200">
                  추세: {result.trend.direction}
                </span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
                {result.trend.text.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actionable Advice Checklist */}
          {result.advice.length > 0 && (
            <div className="border-2 border-[#0E6B5C]/30 rounded-xl p-4 bg-[#F5F8F7] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#0E6B5C] flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4" />
                  교사 권장 대응 행동 지침
                </h4>
                <span className="text-[11px] text-slate-500">
                  완료된 항목을 체크해 두세요
                </span>
              </div>

              <div className="space-y-2">
                {result.advice.map((adv, idx) => (
                  <label
                    key={idx}
                    className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-slate-200 hover:border-[#0E6B5C] transition-colors cursor-pointer select-none text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={checkedAdvice.includes(idx)}
                      onChange={() => toggleAdvice(idx)}
                      className="mt-0.5 rounded text-[#0E6B5C] focus:ring-[#0E6B5C] accent-[#0E6B5C]"
                    />
                    <span
                      className={`leading-relaxed ${
                        checkedAdvice.includes(idx) ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {adv}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Relevant Legal Ground (Laws Database) */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#0E6B5C]" />
              관련 법령 및 교육부 고시 근거 ({result.laws.length}건)
            </h4>

            <div className="space-y-2">
              {result.laws.map((law) => {
                const isExp = expandedLaws[law.id];
                return (
                  <div
                    key={law.id}
                    className="border border-slate-100 rounded-lg bg-slate-50 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleLaw(law.id)}
                      className="w-full flex items-center justify-between p-2.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                      <span>{law.cite}</span>
                      {isExp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {isExp && (
                      <div className="p-3 pt-0 text-xs text-slate-600 bg-white border-t border-slate-100 space-y-2">
                        <p>{law.body}</p>
                        <a
                          href={law.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#0E6B5C] font-semibold hover:underline"
                        >
                          국가법령정보센터 원문 확인 <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Draft Documents Generator */}
          {level >= 1 && (
            <div className="border border-slate-200 rounded-xl p-4 bg-[#FAFBFB] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">
                  즉시 활용 가능한 행정·소통 문서 초안
                </h4>
                <span className="text-[11px] text-slate-500">
                  교사 감정을 배제하고 육하원칙 사실만 구성
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDraftType('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    draftType === 'admin'
                      ? 'bg-[#0E6B5C] text-white border-[#0E6B5C]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#0E6B5C]'
                  }`}
                >
                  관리자(교감·교장) 보고용 초안
                </button>

                {recordData.target === '학부모' && (
                  <button
                    type="button"
                    onClick={() => setDraftType('parent')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      draftType === 'parent'
                        ? 'bg-[#0E6B5C] text-white border-[#0E6B5C]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-[#0E6B5C]'
                    }`}
                  >
                    학부모 정중 안내 답장 초안
                  </button>
                )}

                {onOpenReport && (
                  <button
                    type="button"
                    onClick={() => onOpenReport(recordData.studentId, recordData.target)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:border-slate-400 text-slate-700 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    사실 경과서 (인쇄/PDF)
                  </button>
                )}

                {onOpenAdmissibility && (
                  <button
                    type="button"
                    onClick={() => onOpenAdmissibility(recordData)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#E3F3EF] border border-[#0E6B5C]/30 text-[#0E6B5C] hover:bg-[#CBE7E0] transition-colors"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    교보위 심의 적격성 시뮬레이션
                  </button>
                )}
              </div>

              {draftType && (
                <div className="space-y-2 mt-2">
                  <textarea
                    rows={8}
                    readOnly
                    value={draftText}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 leading-relaxed outline-none"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      * 발송 전 실제 학급 상황에 맞춰 세부 문구를 검토하세요.
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyDraft(draftText)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-semibold transition-colors"
                    >
                      {copiedDraft ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> 복사 완료
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> 클립보드 복사
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-[#FAFBFB] flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            * AI 분석은 교원의 의사결정을 돕는 참고자료이며 법적 최종 판단은 학교교권보호위원회 절차에 따릅니다.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              닫기
            </button>

            {onSaveRecord && !recordData.id && (
              <button
                onClick={() =>
                  onSaveRecord({
                    ...recordData,
                    done: checkedAdvice,
                  })
                }
                className="px-4 py-2 bg-[#0E6B5C] hover:bg-[#0A5448] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                상담 일지에 정식 저장
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
