import React from 'react';
import { ConsultationRecord, Student } from '../types';
import { ArrowLeft, Printer } from 'lucide-react';
import { LEVEL_NAMES } from '../utils/engine';

interface FactReportViewProps {
  student: Student;
  records: ConsultationRecord[];
  target: string;
  onBack: () => void;
}

export const FactReportView: React.FC<FactReportViewProps> = ({
  student,
  records,
  target,
  onBack,
}) => {
  const filteredRecords = records
    .filter((r) => r.target === target)
    .sort((a, b) => a.date.localeCompare(b.date));

  const highestRisk = filteredRecords.reduce<0 | 1 | 2>(
    (max, r) => (r.level > max ? r.level : max),
    0
  );

  const lawsMap = new Map<string, { cite: string; body: string }>();
  filteredRecords.forEach((r) => {
    r.result.laws.forEach((l) => lawsMap.set(l.id, { cite: l.cite, body: l.body }));
  });

  const startDate = filteredRecords.length ? filteredRecords[0].date : '-';
  const endDate = filteredRecords.length ? filteredRecords[filteredRecords.length - 1].date : '-';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar for Screen only */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          학생 상세로 돌아가기
        </button>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E6B5C] hover:bg-[#0A5448] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          인쇄 / PDF로 저장
        </button>
      </div>

      {/* Official Administrative Document Printable Container */}
      <div className="bg-white border border-slate-300 rounded-2xl p-4 sm:p-8 md:p-12 shadow-sm space-y-6 sm:space-y-8 text-slate-900 print:border-none print:shadow-none print:p-0">
        <div className="text-center border-b-2 border-slate-900 pb-5">
          <h1 className="text-2xl font-black tracking-tight">
            사 실 경 과 서
          </h1>
          <p className="text-sm font-semibold text-slate-600 mt-1">
            (교육활동 침해 의심 {target} 상담 및 연락 사실 확인서)
          </p>
        </div>

        {/* Student Meta Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div>
            <span className="text-slate-500 block">학생 실명</span>
            <span className="font-bold text-slate-800 text-sm">{student.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">학급 / 학번</span>
            <span className="font-semibold text-slate-800">
              {student.cls} ({student.no})
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">조사 대상 기간</span>
            <span className="font-semibold text-slate-800">
              {startDate} ~ {endDate}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">기록 건수 / 최고 위험도</span>
            <span className="font-bold text-slate-800">
              {filteredRecords.length}건 / [{LEVEL_NAMES[highestRisk]}]
            </span>
          </div>
        </div>

        {/* Chronological Table */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 border-l-4 border-[#0E6B5C] pl-2.5">
            1. 시계열 사실 경과 (교사 주관적 감정 제외)
          </h3>

          <div className="border border-slate-300 rounded-lg overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[600px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                  <th className="p-2.5 w-24 border-r border-slate-300">일자</th>
                  <th className="p-2.5 w-16 border-r border-slate-300">수단</th>
                  <th className="p-2.5 w-32 border-r border-slate-300">목적</th>
                  <th className="p-2.5 border-r border-slate-300">객관적 사실 (육하원칙)</th>
                  <th className="p-2.5 w-28 border-r border-slate-300">포착 신호</th>
                  <th className="p-2.5 w-16 text-center">위험도</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((r) => (
                    <tr key={r.id}>
                      <td className="p-2.5 border-r border-slate-200 font-mono">
                        {r.date}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">{r.method}</td>
                      <td className="p-2.5 border-r border-slate-200 font-medium">
                        {r.purpose || '-'}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 leading-relaxed whitespace-pre-wrap">
                        {r.result.fact || r.content}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">
                        {r.result.signals
                          .filter((s) => s.code !== 'escalate')
                          .map((s) => s.label)
                          .join(', ') || '-'}
                      </td>
                      <td className="p-2.5 text-center font-bold">
                        {LEVEL_NAMES[r.level]}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      해당 대상과의 기록이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legal Basis Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-900 border-l-4 border-[#0E6B5C] pl-2.5">
            2. 관련 법령 및 교육부 고시 근거
          </h3>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2 leading-relaxed">
            {lawsMap.size > 0 ? (
              Array.from(lawsMap.values()).map((l, i) => (
                <div key={i} className="space-y-0.5">
                  <span className="font-bold text-slate-800">· {l.cite}</span>
                  <p className="text-slate-600 pl-3">{l.body}</p>
                </div>
              ))
            ) : (
              <span className="text-slate-400">해당 법령 조항 없음</span>
            )}
          </div>
        </div>

        {/* Administrative Legal Notice */}
        <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-500 leading-relaxed space-y-1">
          <p>
            ※ 본 사실 경과서는 교원의 정당한 교육활동 보호를 위해 상담 일지 내용을 육하원칙 사실 위주로 자동 정리한 행정 참고 자료입니다.
          </p>
          <p>
            ※ 교원의 주관적 감정·추측은 제외되어 있으며, 최종 법적 조치는 관할 학교교권보호위원회 심의 및 교육청 절차에 따릅니다.
          </p>
          <p>
            ※ 학생 개인정보보호법에 의거하여 본 문서는 지정된 교권 보호 및 행정 절차 목적 외 무단 유출을 금합니다.
          </p>
        </div>
      </div>
    </div>
  );
};
