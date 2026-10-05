import React, { useState } from 'react';
import { Student } from '../types';
import { UserPlus, Search, ChevronRight, Upload, X, Trash2 } from 'lucide-react';
import { LEVEL_NAMES } from '../utils/engine';

interface StudentListViewProps {
  students: Student[];
  onSelectStudent: (studentId: number) => void;
  onAddStudent: (name: string, no: string) => void;
  onBulkAddStudents: (bulkText: string) => { added: number; skipped: number };
  onDeleteStudent: (studentId: number) => void;
  getStudentRecordCount: (studentId: number) => number;
  getStudentHighestRisk: (studentId: number) => 0 | 1 | 2;
}

export const StudentListView: React.FC<StudentListViewProps> = ({
  students,
  onSelectStudent,
  onAddStudent,
  onBulkAddStudents,
  onDeleteStudent,
  getStudentRecordCount,
  getStudentHighestRisk,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Single add form state
  const [name, setName] = useState('');
  const [no, setNo] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Bulk add state
  const [bulkText, setBulkText] = useState('');
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  // Compute grade/class/num preview from 5 digits (e.g. 10305 -> 1학년 3반 5번)
  const computeClassPreview = (numStr: string) => {
    const clean = numStr.replace(/\D/g, '');
    const m = clean.match(/^([1-6])(\d{2})(\d{2})$/);
    if (m) {
      return `${parseInt(m[1], 10)}학년 ${parseInt(m[2], 10)}반 ${parseInt(m[3], 10)}번`;
    }
    return clean.length > 0 ? '5자리 숫자(예: 10305 → 1학년 3반 5번)' : '';
  };

  const getClassNumberLabel = (studentNo: string) => {
    const classNumber = Number.parseInt(studentNo.slice(-2), 10);
    return Number.isNaN(classNumber) ? `${studentNo.slice(-2)}번` : `${classNumber}번`;
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!name.trim()) {
      setAddError('학생 이름을 입력하세요');
      return;
    }
    const cleanNo = no.replace(/\D/g, '');
    if (!/^[1-6]\d{4}$/.test(cleanNo)) {
      setAddError('학번은 5자리 숫자로 입력하세요 (예: 10305)');
      return;
    }

    onAddStudent(name.trim(), cleanNo);
    setName('');
    setNo('');
    setShowAddModal(false);
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;
    const res = onBulkAddStudents(bulkText);
    setBulkResult(`총 ${res.added}명 추가 완료 (제외/형식오류 ${res.skipped}줄)`);
    setBulkText('');
    setTimeout(() => {
      setBulkResult(null);
      setShowBulkModal(false);
    }, 1500);
  };

  const filteredStudents = students.filter(
    (s) => s.name.includes(searchQuery) || s.no.includes(searchQuery) || s.cls.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">학급 학생 명부</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            등록된 학생별 상담 이력, 학부모 민원 누적 빈도 및 교권침해 위험 신호를 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            명렬표 일괄 등록
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0E6B5C] hover:bg-[#0A5448] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            + 학생 추가
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          placeholder="학생 이름, 학번 또는 학급으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0E6B5C] focus:ring-2 focus:ring-[#0E6B5C]/15"
        />
      </div>

      {/* Desktop Table (sm and up) & Clean Mobile Card List (< sm) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {/* 1. MOBILE CARD LIST (Only visible on phone screens < 640px) */}
        <div className="sm:hidden divide-y divide-slate-100">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((stu) => {
              const count = getStudentRecordCount(stu.id);
              const maxLevel = getStudentHighestRisk(stu.id);
              return (
                <div
                  key={stu.id}
                  onClick={() => onSelectStudent(stu.id)}
                  className="flex items-center justify-between p-3.5 active:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#E3F3EF] text-[#0E6B5C] font-black text-sm flex items-center justify-center shrink-0">
                      {stu.name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate">
                        {stu.name}
                      </div>
                      <div className="text-xs text-slate-500 whitespace-nowrap">
                        {stu.cls}반 · {getClassNumberLabel(stu.no)} ·{' '}
                        <span className="font-mono text-slate-400">학번 {stu.no}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                      기록 {count}건
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] whitespace-nowrap ${
                        maxLevel === 2
                          ? 'bg-red-100 text-red-700'
                          : maxLevel === 1
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {LEVEL_NAMES[maxLevel]}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-xs text-slate-400">
              {searchQuery ? '검색된 학생이 없습니다.' : '등록된 학생이 없습니다.'}
            </div>
          )}
        </div>

        {/* 2. DESKTOP TABLE (Preserved on sm and larger screens) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3 px-4 w-16">번호</th>
                <th className="py-3 px-4">학생 실명</th>
                <th className="py-3 px-4">학급 / 학번</th>
                <th className="py-3 px-4">기록</th>
                <th className="py-3 px-4">최고 위험도</th>
                <th className="py-3 px-4 text-right">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((stu, idx) => {
                  const count = getStudentRecordCount(stu.id);
                  const maxLevel = getStudentHighestRisk(stu.id);
                  return (
                    <tr
                      key={stu.id}
                      onClick={() => onSelectStudent(stu.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group min-h-[48px] whitespace-nowrap"
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-[#0E6B5C]">
                        {stu.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span>{stu.cls}반 {getClassNumberLabel(stu.no)} · </span>
                        <span className="font-mono text-slate-400 text-xs">
                          {stu.no}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">{count}건</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            maxLevel === 2
                              ? 'bg-red-100 text-red-700'
                              : maxLevel === 1
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {LEVEL_NAMES[maxLevel]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0E6B5C] inline-block" />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {searchQuery ? '검색된 학생이 없습니다.' : '등록된 학생이 없습니다.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 pb-safe sm:pb-6">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">새 학생 등록</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  학생 실명 *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 김철수"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0E6B5C]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  학번 (5자리 숫자) *
                </label>
                <input
                  type="text"
                  maxLength={5}
                  required
                  value={no}
                  onChange={(e) => setNo(e.target.value.replace(/\D/g, ''))}
                  placeholder="예: 10305 (1학년 3반 5번)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0E6B5C] font-mono"
                />
                <p className="text-[11px] text-[#0E6B5C] font-medium mt-1">
                  → {computeClassPreview(no)}
                </p>
              </div>

              {addError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
                  {addError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0E6B5C] hover:bg-[#0A5448] text-white font-bold rounded-lg shadow-sm"
                >
                  학생 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 pb-safe sm:pb-6">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                명렬표 일괄 등록 (엑셀/한글 복사 붙여넣기)
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              한 줄에 한 명씩 <b>학번, 이름</b> 순서로 입력하세요. 엑셀이나 한글 문서 표에서 복사하여 붙여넣으실 수 있습니다.
            </p>

            <form onSubmit={handleBulkSubmit} className="space-y-4 text-xs">
              <textarea
                rows={6}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="10301, 김철수&#10;10302, 박영희&#10;10303, 이민수"
                className="w-full p-3 font-mono bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0E6B5C]"
              />

              {bulkResult && (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  {bulkResult}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!bulkText.trim()}
                  className="px-4 py-2 bg-[#0E6B5C] hover:bg-[#0A5448] text-white font-bold rounded-lg shadow-sm disabled:opacity-40"
                >
                  일괄 등록 실행
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
