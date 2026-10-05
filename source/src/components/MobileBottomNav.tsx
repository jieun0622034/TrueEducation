import React from 'react';
import { Home, Users, FileText, Edit3, PhoneCall, Info } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: 'home' | 'students' | 'records' | 'write' | 'about';
  onSelectTab: (tab: 'home' | 'students' | 'records' | 'write' | 'about') => void;
  onOpenLiveCopilot: () => void;
  highRiskCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenLiveCopilot,
  highRiskCount,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-[env(safe-area-inset-bottom,0px)] shadow-lg">
      <div className="grid grid-cols-6 items-center h-15 px-1">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            currentTab === 'home' ? 'text-[#0E6B5C]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">홈</span>
          {currentTab === 'home' && (
            <span className="w-1 h-1 rounded-full bg-[#0E6B5C] mt-0.5" />
          )}
        </button>

        {/* 2. Students */}
        <button
          type="button"
          onClick={() => onSelectTab('students')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            currentTab === 'students' ? 'text-[#0E6B5C]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">학생</span>
          {currentTab === 'students' && (
            <span className="w-1 h-1 rounded-full bg-[#0E6B5C] mt-0.5" />
          )}
        </button>

        {/* 3. Saved Records */}
        <button
          type="button"
          onClick={() => onSelectTab('records')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            currentTab === 'records' ? 'text-[#0E6B5C]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">기록 보기</span>
          {currentTab === 'records' && (
            <span className="w-1 h-1 rounded-full bg-[#0E6B5C] mt-0.5" />
          )}
        </button>

        {/* 3. Record Write */}
        <button
          type="button"
          onClick={() => onSelectTab('write')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            currentTab === 'write' ? 'text-[#0E6B5C]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-[#0E6B5C] text-white flex items-center justify-center shadow-xs">
            <Edit3 className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-[#0E6B5C] mt-0.5">기록</span>
        </button>

        {/* 4. Live Call Copilot (Golden Time trigger) */}
        <button
          type="button"
          onClick={onOpenLiveCopilot}
          className="flex flex-col items-center justify-center min-h-[44px] py-1 text-red-600 relative transition-colors"
        >
          <div className="relative">
            <PhoneCall className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
          </div>
          <span className="text-[10px] font-bold mt-1">통화코치</span>
        </button>

        {/* 5. Laws / About */}
        <button
          type="button"
          onClick={() => onSelectTab('about')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            currentTab === 'about' ? 'text-[#0E6B5C]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Info className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-1">법령</span>
          {currentTab === 'about' && (
            <span className="w-1 h-1 rounded-full bg-[#0E6B5C] mt-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
};
