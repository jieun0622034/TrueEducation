import React from 'react';
import { Shield, Bell, User, BookOpen, Users, Edit3, Info, FileText } from 'lucide-react';

interface HeaderProps {
  currentTab: 'home' | 'students' | 'records' | 'write' | 'about';
  onSelectTab: (tab: 'home' | 'students' | 'records' | 'write' | 'about') => void;
  teacherName: string;
  onEditTeacherName: () => void;
  highRiskCount: number;
  cautionRiskCount: number;
  onOpenLiveCopilot: () => void;
  onOpenRoleplay: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  teacherName,
  onEditTeacherName,
  highRiskCount,
  cautionRiskCount,
  onOpenLiveCopilot,
  onOpenRoleplay,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <button
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2 group text-left"
        >
          <img
            src={`${(import.meta as any).env?.BASE_URL ?? "./"}chram_logo.png`}
            alt=""
            aria-hidden="true"
            className="w-10 h-10 object-contain shrink-0 transition-transform group-hover:scale-105"
          />
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-slate-900 leading-tight">
                  True Education
            </span>
            <span className="text-[10px] font-semibold text-[#0E6B5C] tracking-wide leading-none">
              교권 안심 상담 AI
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (Clean text with hover indicators - Hidden on mobile in favor of bottom tab bar) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              currentTab === 'home'
                ? 'bg-[#E3F3EF] text-[#0E6B5C]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>홈 대시보드</span>
          </button>

          <button
            onClick={() => onSelectTab('students')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              currentTab === 'students'
                ? 'bg-[#E3F3EF] text-[#0E6B5C]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>학생 목록</span>
          </button>

          <button
            onClick={() => onSelectTab('records')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              currentTab === 'records'
                ? 'bg-[#E3F3EF] text-[#0E6B5C]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>상담 기록</span>
          </button>

          <button
            onClick={() => onSelectTab('write')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              currentTab === 'write'
                ? 'bg-[#E3F3EF] text-[#0E6B5C]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>정식 기록 작성</span>
          </button>

          <button
            onClick={() => onSelectTab('about')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              currentTab === 'about'
                ? 'bg-[#E3F3EF] text-[#0E6B5C]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>법령·안내</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions & User Info */}
        <div className="flex items-center gap-2">
          {/* Live Copilot Quick Trigger */}
          <button
            onClick={onOpenLiveCopilot}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors shadow-2xs"
            title="통화 중 실시간 법적 고지 멘트 및 경보"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>실시간 통화 코치</span>
          </button>

          {/* Roleplay Sandbox Quick Trigger */}
          <button
            onClick={onOpenRoleplay}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs"
            title="가상 학부모 모의 상담 및 교권 방어 연습"
          >
            <span>모의 상담 훈련</span>
          </button>

          {/* Active Risk Indicators */}
          {(highRiskCount > 0 || cautionRiskCount > 0) && (
            <div className="hidden lg:flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>
                주의 {cautionRiskCount} · 높음 {highRiskCount}
              </span>
            </div>
          )}

          <button
            onClick={onEditTeacherName}
            className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
            title="선생님 성함 변경"
          >
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>{teacherName ? `${teacherName} 선생님` : '선생님 설정'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
