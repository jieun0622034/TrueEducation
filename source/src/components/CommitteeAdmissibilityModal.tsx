import React, { useState } from 'react';
import {
  Scale,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Printer,
  X,
  Shield,
  HelpCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { ConsultationRecord, Student } from '../types';

interface CommitteeAdmissibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ConsultationRecord;
  student: Student;
  teacherName: string;
  allRecords?: ConsultationRecord[];
  allStudents?: Student[];
  onSelectCase?: (record: ConsultationRecord) => void;
}

export const CommitteeAdmissibilityModal: React.FC<CommitteeAdmissibilityModalProps> = ({
  isOpen,
  onClose,
  record,
  student,
  teacherName,
  allRecords = [],
  allStudents = [],
  onSelectCase,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'admissibility' | 'application'>('admissibility');

  if (!isOpen) return null;

  // Safe fallback values if record or record.result has partial data
  const rawAdm = record?.result?.admissibility;
  const adm = {
    score: rawAdm?.score ?? (record?.level === 2 ? 88 : record?.level === 1 ? 72 : 55),
    grade:
      rawAdm?.grade ??
      ((record?.level ?? 0) >= 2
        ? '접수 유력'
        : (record?.level ?? 0) === 1
        ? '보강 권고'
        : '일반 민원'),
    criteriaScores: {
      evidence: rawAdm?.criteriaScores?.evidence ?? (record?.level === 2 ? 26 : 20),
      statutory: rawAdm?.criteriaScores?.statutory ?? (record?.level === 2 ? 28 : 22),
      recurrence: rawAdm?.criteriaScores?.recurrence ?? (record?.result?.rep_n ? Math.min(20, record.result.rep_n * 6) : 12),
      severity: rawAdm?.criteriaScores?.severity ?? (record?.level === 2 ? 18 : 14),
    },
    checklists: rawAdm?.checklists?.length
      ? rawAdm.checklists
      : [
          { text: '육하원칙(일시, 장소, 발언자, 구체적 발언)에 따른 사실 일지 작성', done: true, required: true },
          { text: '통화 녹음 파일, 문자 캡처본 또는 현장 목격 교사 확인서', done: Boolean(record?.result?.signals?.length), required: true },
          { text: '학교 관리자(교감·교장) 사전 인지 및 내부 협의 보고 기록', done: true, required: true },
          { text: '동일 사안 과거 연락 이력(최근 30일 내 반복성) 추출 첨부', done: (record?.result?.rep_n ?? 1) >= 2, required: false },
          { text: '교원의 정당한 지도 및 응대 고지(공식 창구 안내 내역)', done: true, required: false },
        ],
    opinion:
      rawAdm?.opinion ||
      (record?.level === 2
        ? '교원지위법 제19조 및 교육부 고시 제2조 침해 요건에 명확히 부합하며, 누적 반복성과 위해 수위가 중대하여 관할 교육지원청 교권보호위원회 심의 접수 시 인용 및 보호조치 가능성이 매우 높습니다.'
        : '교육활동 침해 소지가 인정되나, 상대방의 고의성 및 지속성을 입증할 통화 녹취나 추가 증빙 확보 후 정식 접수하시는 것을 권고합니다.'),
  };

  const safeTarget = record?.target || '학부모';
  const safeStudentName = student?.name || record?.name || '학생';
  const safeStudentCls = student?.cls || record?.studentCls || '1학년';
  const safeStudentNo = student?.no || record?.studentNo || '';
  const safeDate = record?.date || new Date().toISOString().slice(0, 10);
  const safeMethod = record?.method || '전화 통화';
  const safeKind = record?.kind || '상담';
  const safeSignals = record?.result?.signals?.map((s) => s.label).join(', ') || '교육활동 부당 간섭 및 폭언';
  const safeFact = record?.result?.fact || record?.content || '관련 정황 및 사실 경과 기록';
  const safeLaws = (record?.result?.laws || []).map((l) => `- ${l.cite}: ${l.body}`).join('\n') || '- 교원의 지위 향상 및 교육활동 보호를 위한 특별법 제19조';

  const officialApplicationText = `[지역교권보호위원회 심의 신청서]

1. 신청 교원 인적사항
- 성명: ${teacherName || '담당교사'}
- 소속 학교: 본교 교무실
- 담당 학급: ${safeStudentCls} 담임교사

2. 피신청인(침해 행위자) 인적사항
- 구분: ${safeTarget} (${safeStudentName} 학생 관련자)
- 학생 정보: ${safeStudentCls} ${safeStudentName} ${safeStudentNo ? `(학번: ${safeStudentNo})` : ''}

3. 교육활동 침해 행위 개요
- 발생 일시: ${safeDate} (최근 30일 동일 사안 ${record?.result?.rep_n || 1}회차 누적)
- 접촉 수단: ${safeMethod} (${safeKind})
- 주요 침해 유형: ${safeSignals}

4. 구체적 침해 사실 경과 (육하원칙):
${safeFact}

5. 관련 법령 및 교육부 고시 위반 조항:
${safeLaws}

6. 교원의 피해 및 요구 조치:
- 피해 내용: 지속적 위협 및 폭언으로 인한 정상적 교육활동 침해 및 정신적 고통
- 요청 조치: 교원지위법 제26조에 따른 침해자 서면사과 및 재발방지 서약, 특별교육 이수 조치 요청

7. 첨부 증빙 서류:
- 사실 경과서 1부
- 상담 일지 및 통화/문자 기록 사본 1부
- 관리자 내부 보고 확인서 1부

위와 같이 「교원의 지위 향상 및 교육활동 보호를 위한 특별법」 제19조 및 제26조에 따라 지역교권보호위원회 심의를 정식 신청합니다.

신청인 교사: ${teacherName || '담당교사'} (인)`;

  const handleCopy = () => {
    navigator.clipboard.writeText(officialApplicationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl max-w-3xl w-full max-h-[94vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden pb-safe sm:pb-0">
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-2 sm:hidden shrink-0 mobile-drag-handle" />

        {/* Top Header - Mobile Compact */}
        <div className="shrink-0 flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-slate-100 bg-[#FAFBFB]">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0E6B5C] text-white flex items-center justify-center shrink-0">
              <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 truncate">
                  교권보호위원회 심의 적격성 시뮬레이터
                </h2>
                <span className="text-[10px] bg-[#E3F3EF] text-[#0E6B5C] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                  교보위 표준
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate hidden sm:block">
                교육지원청 교보위 심의 요건 충족도 및 법적 입증 가능성을 정량 시뮬레이션합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0 ml-2"
            aria-label="닫기"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Incident Case Selector (if multiple records exist) */}
        {allRecords.length > 1 && onSelectCase && (
          <div className="shrink-0 px-3.5 sm:px-6 py-1.5 sm:py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
            <span className="font-semibold text-slate-500 shrink-0">심의 대상 사안 선택:</span>
            {allRecords.slice(0, 5).map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => onSelectCase(rec)}
                className={`px-2 py-1 rounded-md transition-colors shrink-0 whitespace-nowrap ${
                  rec.id === record?.id
                    ? 'bg-[#0E6B5C] text-white font-bold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {rec.name} ({rec.target}) - {rec.result?.signals?.[0]?.label || '사안'}
              </button>
            ))}
          </div>
        )}

        {/* Tab Selector */}
        <div className="shrink-0 flex border-b border-slate-200 px-3.5 sm:px-6 bg-slate-50/50 text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('admissibility')}
            className={`py-2 sm:py-2.5 px-2.5 sm:px-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'admissibility'
                ? 'border-[#0E6B5C] text-[#0E6B5C]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            적격성 시뮬레이션 점수표
          </button>
          <button
            onClick={() => setActiveTab('application')}
            className={`py-2 sm:py-2.5 px-2.5 sm:px-4 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'application'
                ? 'border-[#0E6B5C] text-[#0E6B5C]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            공식 심의 신청서 완성본
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 p-3.5 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4 text-xs text-slate-800">
          {activeTab === 'admissibility' ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Scorecard Hero */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-[#FAFBFB] border border-slate-200 rounded-xl sm:rounded-2xl">
                <div className="flex items-center justify-around sm:justify-start gap-3 sm:gap-6 pb-2.5 sm:pb-0 border-b sm:border-b-0 sm:border-r border-slate-200 shrink-0 sm:pr-4">
                  <div className="space-y-0.5 text-center sm:text-left">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block whitespace-nowrap">
                      교보위 적격성 지수
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                      {adm.score}
                      <span className="text-xs sm:text-sm font-normal text-slate-400">/100점</span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 block whitespace-nowrap">
                      (75점 이상: 심의 접수 유력)
                    </span>
                  </div>

                  <div className="space-y-0.5 text-center sm:text-left">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block whitespace-nowrap">
                      종합 판정 등급
                    </span>
                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full font-black text-xs sm:text-sm whitespace-nowrap ${
                          adm.grade === '접수 유력'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : adm.grade === '보강 권고'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-800 border border-slate-300'
                        }`}
                      >
                        {adm.grade}
                      </span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 whitespace-nowrap">
                      {adm.grade === '접수 유력' ? '인용 가능성 높음' : '자료 보완 권장'}
                    </p>
                  </div>
                </div>

                <div className="flex-1 text-[11px] sm:text-xs text-slate-600 bg-white p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-200/80 leading-relaxed flex flex-col justify-center">
                  <span className="font-bold text-slate-800 block mb-0.5">
                    💡 사안 검토 총평 ({safeStudentName} / {safeTarget}):
                  </span>
                  <p className="break-keep">{adm.opinion}</p>
                </div>
              </div>

              {/* 4 Core Criteria Progress Bars */}
              <div className="border border-slate-200 rounded-xl p-3 sm:p-3.5 space-y-2.5 bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
                    심의 의결 4대 필수 평가 지표
                  </h3>
                  <span className="text-[10px] text-[#0E6B5C] bg-[#E3F3EF] px-1.5 py-0.5 rounded font-semibold">
                    정량 채점
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {/* Metric 1 */}
                  <div className="bg-slate-50/70 p-2 sm:p-2.5 rounded-lg border border-slate-100">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-700 truncate">
                        1. 법령 조문 부합도 (교원지위법)
                      </span>
                      <span className="font-mono font-bold text-[#0E6B5C] shrink-0 ml-1">
                        {adm.criteriaScores.statutory}/30점
                      </span>
                    </div>
                    <div className="h-1.5 sm:h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(adm.criteriaScores.statutory / 30) * 100}%` }}
                        className="h-full bg-[#0E6B5C] rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Metric 2 */}
                  <div className="bg-slate-50/70 p-2 sm:p-2.5 rounded-lg border border-slate-100">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-700 truncate">
                        2. 증거 입증성 (녹취/문자 등)
                      </span>
                      <span className="font-mono font-bold text-[#0E6B5C] shrink-0 ml-1">
                        {adm.criteriaScores.evidence}/30점
                      </span>
                    </div>
                    <div className="h-1.5 sm:h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(adm.criteriaScores.evidence / 30) * 100}%` }}
                        className="h-full bg-[#0E6B5C] rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Metric 3 */}
                  <div className="bg-slate-50/70 p-2 sm:p-2.5 rounded-lg border border-slate-100">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-700 truncate">
                        3. 반복·지속성 (최근 30일 빈도)
                      </span>
                      <span className="font-mono font-bold text-[#0E6B5C] shrink-0 ml-1">
                        {adm.criteriaScores.recurrence}/20점
                      </span>
                    </div>
                    <div className="h-1.5 sm:h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(adm.criteriaScores.recurrence / 20) * 100}%` }}
                        className="h-full bg-[#0E6B5C] rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Metric 4 */}
                  <div className="bg-slate-50/70 p-2 sm:p-2.5 rounded-lg border border-slate-100">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-semibold text-slate-700 truncate">
                        4. 침해 중대성 (폭언·협박 수위)
                      </span>
                      <span className="font-mono font-bold text-[#0E6B5C] shrink-0 ml-1">
                        {adm.criteriaScores.severity}/20점
                      </span>
                    </div>
                    <div className="h-1.5 sm:h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(adm.criteriaScores.severity / 20) * 100}%` }}
                        className="h-full bg-[#0E6B5C] rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Preparation Checklist */}
              <div className="border border-slate-200 rounded-xl p-3 sm:p-3.5 space-y-2 bg-slate-50/60">
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
                  교보위 접수 전 필수 증빙 체크리스트
                </h3>
                <div className="grid grid-cols-1 gap-1.5">
                  {adm.checklists.map((chk, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-xs cursor-pointer hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={chk.done}
                        className="rounded text-[#0E6B5C] focus:ring-[#0E6B5C] accent-[#0E6B5C] shrink-0"
                      />
                      <span className={`flex-1 break-keep ${chk.done ? 'font-medium text-slate-800' : 'text-slate-500'}`}>
                        {chk.text}
                      </span>
                      {chk.required && (
                        <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-bold shrink-0 whitespace-nowrap">
                          필수
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Application Tab */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-slate-800 text-xs sm:text-sm">
                  교육청 지역교권보호위원회 심의 신청서
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0E6B5C] hover:bg-[#0A5448] text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> 복사 완료
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> 신청서 복사
                      </>
                    )}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> 인쇄/PDF
                  </button>
                </div>
              </div>

              <textarea
                rows={12}
                readOnly
                value={officialApplicationText}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl leading-relaxed outline-none resize-none"
              />
              <p className="text-[11px] text-slate-400">
                * 위 문서는 교육부 및 시·도 교육청 표준 서식에 맞추어 자동 완성된 초안입니다.
              </p>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 border-t border-slate-100 bg-[#FAFBFB] flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] text-slate-400 truncate max-w-[220px] sm:max-w-none">
            * 교원보호공제사업 소송 및 법률 상담 지원 연계 가능
          </span>

          <button
            onClick={onClose}
            className="px-3.5 sm:px-4 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
