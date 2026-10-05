import React from 'react';
import { Shield, BookOpen, Lock, Sparkles, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import { LAWS_DATABASE } from '../data/laws';

interface AboutViewProps {
  studentsCount: number;
  recordsCount: number;
  memosCount: number;
  onResetDemo: () => void;
  onClearAll: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({
  studentsCount,
  recordsCount,
  memosCount,
  onResetDemo,
  onClearAll,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          True Education 서비스 소개 및 법령 근거
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          교사가 안심하고 교육에 전념할 수 있도록 상담 기록을 분석하고 법령 조항과 보호 조치를 안내합니다.
        </p>
      </div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core Mission */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#0E6B5C]">
            <Shield className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-900">True Education의 핵심 가치</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            개별적으로는 애매한 학부모의 시간 외 연락이나 반복적 항의, 감정 섞인 언사를 교사가 혼자 삭이지 않고, 
            객관적인 기록 데이터로 축적하여 <b>교원지위법</b> 및 <b>교육부 고시</b>에 따른 위험 신호를 사전에 명확히 감지합니다.
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
            <li><b>사실과 감정 자동 분리</b>: 교사의 심경을 보호하고 법적 객관성 유지</li>
            <li><b>30일 누적 빈도 추적</b>: 3회 이상 동일 사안 반복 시 위험도 상향</li>
            <li><b>실시간 음성 기록</b>: 통화 직후 구두로 즉시 남기는 빠른 메모 지원</li>
            <li><b>원클릭 행정 지원</b>: 관리자 보고서, 학부모 안내문, 사실 경과서 PDF 출력</li>
          </ul>
        </div>

        {/* Security & Privacy */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#0E6B5C]">
            <Lock className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-900">개인정보 보호 및 안전장치</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            모든 상담 기록 및 학생 명부는 사용자의 기기 내부(Local Storage)에 안전하게 격리되어 보관됩니다.
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
            <li><b>PII 마스킹</b>: 학생 실명, 전화번호, 이메일 등의 식별 정보 자동 보호</li>
            <li><b>프롬프트 주입 방어</b>: 기록문 속 악의적 지시문을 객관적 데이터로만 엄격 취급</li>
            <li><b>오프라인 영구 저장</b>: 새로고침 후에도 작성된 기록과 메모가 그대로 보존됨</li>
          </ul>
        </div>
      </div>

      {/* Laws Database Viewer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-800">
          <BookOpen className="w-4 h-4 text-[#0E6B5C]" />
          <h3 className="text-sm font-bold">탑재된 대한민국 교권 보호 법령 및 고시 기준</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LAWS_DATABASE.map((law) => (
            <div
              key={law.id}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{law.cite}</span>
                <a
                  href={law.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#0E6B5C] hover:underline inline-flex items-center gap-0.5 text-[11px]"
                >
                  원문 <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <p className="text-slate-600 leading-relaxed">{law.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Management Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">데이터 저장 상태 및 관리</h3>

        <div className="flex items-center gap-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            학생 <span className="font-bold text-slate-900">{studentsCount}명</span>
          </div>
          <div>·</div>
          <div>
            기록 <span className="font-bold text-slate-900">{recordsCount}건</span>
          </div>
          <div>·</div>
          <div>
            메모 <span className="font-bold text-slate-900">{memosCount}건</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => {
              if (window.confirm('기본 데모 데이터(학생 7명 및 최근 30일 상담 기록)로 초기화하시겠습니까?')) {
                onResetDemo();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            데모 데이터 재설정
          </button>

          <button
            onClick={() => {
              if (window.confirm('모든 학생과 상담 기록, 메모를 영구 삭제하시겠습니까?')) {
                onClearAll();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            전체 데이터 비우기
          </button>
        </div>
      </div>
    </div>
  );
};
