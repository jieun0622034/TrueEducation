import React, { useState } from 'react';
import { ConsultationRecord, Student } from '../types';
import {
  ArrowLeft,
  Edit2,
  FileText,
  Plus,
  Printer,
  Save,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { LEVEL_NAMES } from '../utils/engine';

interface StudentDetailViewProps {
  student: Student;
  records: ConsultationRecord[];
  onBack: () => void;
  onOpenRecord: (recordId: number) => void;
  onNewRecordForStudent: (studentId: number) => void;
  onOpenFactReport: (studentId: number, target: string) => void;
  onDeleteStudent: (studentId: number) => void;
  onUpdateStudent: (studentId: number, name: string, no: string) => void;
  onUpdateRecord: (
    recordId: number,
    fields: Pick<ConsultationRecord, 'date' | 'kind' | 'target' | 'method' | 'purpose' | 'content'>,
  ) => void;
}

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({
  student,
  records,
  onBack,
  onOpenRecord,
  onNewRecordForStudent,
  onOpenFactReport,
  onDeleteStudent,
  onUpdateStudent,
  onUpdateRecord,
}) => {
  const [activeTab, setActiveTab] = useState<'parent' | 'student' | 'teacher' | 'timeline'>('parent');
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [studentNameDraft, setStudentNameDraft] = useState(student.name);
  const [studentNoDraft, setStudentNoDraft] = useState(student.no);
  const [studentEditError, setStudentEditError] = useState('');
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [recordDraft, setRecordDraft] = useState<
    Pick<ConsultationRecord, 'date' | 'kind' | 'target' | 'method' | 'purpose' | 'content'> | null
  >(null);
  const [recordEditError, setRecordEditError] = useState('');

  const parentRecords = records.filter((r) => r.target === '학부모');
  const studentRecords = records.filter((r) => r.target === '학생');
  const teacherRecords = records.filter((r) => r.target === '교사');

  const maxRisk = records.reduce<0 | 1 | 2>((max, r) => (r.level > max ? r.level : max), 0);

  const handleDelete = () => {
    if (
      window.confirm(
        `${student.name} 학생 및 누적 상담 기록 ${records.length}건을 모두 삭제하시겠습니까? 되돌릴 수 없습니다.`
      )
    ) {
      onDeleteStudent(student.id);
      onBack();
    }
  };

  const startStudentEdit = () => {
    setStudentNameDraft(student.name);
    setStudentNoDraft(student.no);
    setStudentEditError('');
    setIsEditingStudent(true);
  };

  const handleStudentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = studentNameDraft.trim();
    const no = studentNoDraft.replace(/\D/g, '');
    if (!name) {
      setStudentEditError('학생 이름을 입력하세요.');
      return;
    }
    if (!/^[1-6]\d{4}$/.test(no)) {
      setStudentEditError('학번은 5자리 숫자로 입력하세요. (예: 10305)');
      return;
    }
    onUpdateStudent(student.id, name, no);
    setIsEditingStudent(false);
  };

  const startRecordEdit = (record: ConsultationRecord) => {
    setEditingRecordId(record.id);
    setRecordDraft({
      date: record.date,
      kind: record.kind,
      target: record.target,
      method: record.method,
      purpose: record.purpose,
      content: record.content,
    });
    setRecordEditError('');
  };

  const handleRecordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingRecordId === null || !recordDraft) return;
    if (!recordDraft.date || !recordDraft.purpose.trim() || !recordDraft.content.trim()) {
      setRecordEditError('날짜, 기록 제목, 내용을 모두 입력하세요.');
      return;
    }
    onUpdateRecord(editingRecordId, {
      ...recordDraft,
      purpose: recordDraft.purpose.trim(),
      content: recordDraft.content.trim(),
    });
    setEditingRecordId(null);
    setRecordDraft(null);
  };

  const currentList =
    activeTab === 'parent'
      ? parentRecords
      : activeTab === 'student'
      ? studentRecords
      : activeTab === 'teacher'
      ? teacherRecords
      : records;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200 pb-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          학생 명부로 돌아가기
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenFactReport(student.id, '학부모')}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">사실 경과서 출력 (PDF)</span>
            <span className="xs:hidden">경과서 출력</span>
          </button>

          <button
            onClick={() => onNewRecordForStudent(student.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0E6B5C] hover:bg-[#0A5448] text-white text-xs font-bold rounded-lg shadow-2xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />새 상담 기록
          </button>
        </div>
      </div>

      {/* Student Profile Card & Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Profile Card */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#E3F3EF] text-[#0E6B5C] flex items-center justify-center font-black text-2xl mx-auto shadow-inner">
            {student.name[0]}
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">{student.name}</h2>
            <p className="text-xs text-slate-500">
              {student.cls}반 · {Number.parseInt(student.no.slice(-2), 10) || student.no.slice(-2)}번
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              학번 {student.no}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-3 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">누적 상담 기록</span>
              <span className="font-bold text-slate-800">{records.length}건</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">최고 위험도</span>
              <span
                className={`font-black text-[11px] px-2 py-0.5 rounded-full ${
                  maxRisk === 2
                    ? 'bg-red-100 text-red-700'
                    : maxRisk === 1
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {LEVEL_NAMES[maxRisk]}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={startStudentEdit}
            className="w-full inline-flex items-center justify-center gap-1 text-[11px] text-[#0E6B5C] hover:bg-[#E3F3EF] p-2 rounded-lg transition-colors"
          >
            <Edit2 className="w-3 h-3" /> 학생 정보 수정
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="w-full inline-flex items-center justify-center gap-1 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            학생 정보 및 기록 삭제
          </button>
        </div>

        {/* Records View Area */}
        <div className="md:col-span-3 space-y-4">
          {/* Segmented Filter Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 pb-1 text-xs font-semibold overflow-x-auto no-scrollbar whitespace-nowrap">
            <button
              onClick={() => setActiveTab('parent')}
              className={`px-3 py-2 border-b-2 transition-colors shrink-0 ${
                activeTab === 'parent'
                  ? 'border-[#0E6B5C] text-[#0E6B5C]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              학부모 상담 ({parentRecords.length})
            </button>
            <button
              onClick={() => setActiveTab('student')}
              className={`px-3 py-2 border-b-2 transition-colors ${
                activeTab === 'student'
                  ? 'border-[#0E6B5C] text-[#0E6B5C]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              학생 상담 ({studentRecords.length})
            </button>
            <button
              onClick={() => setActiveTab('teacher')}
              className={`px-3 py-2 border-b-2 transition-colors ${
                activeTab === 'teacher'
                  ? 'border-[#0E6B5C] text-[#0E6B5C]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              교사 협의 ({teacherRecords.length})
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-2 border-b-2 transition-colors ${
                activeTab === 'timeline'
                  ? 'border-[#0E6B5C] text-[#0E6B5C]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
              전체 타임라인 ({records.length})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'timeline' ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-800">
                시계열 사건 및 위험도 변동 타임라인
              </h3>
              {records.length > 0 ? (
                <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                  {records
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((rec) => (
                      <div
                        key={rec.id}
                        onClick={() => onOpenRecord(rec.id)}
                        className="relative cursor-pointer group"
                      >
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                            rec.level === 2
                              ? 'bg-red-500'
                              : rec.level === 1
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />

                        <div className="bg-slate-50 group-hover:bg-[#E3F3EF]/40 border border-slate-200 rounded-xl p-3.5 transition-colors">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-800">
                              {rec.date} · {rec.target} ({rec.method})
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  rec.level === 2
                                    ? 'bg-red-100 text-red-800'
                                    : rec.level === 1
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {LEVEL_NAMES[rec.level]}
                              </span>
                              <button
                                type="button"
                                aria-label="상담 기록 수정"
                                title="상담 기록 수정"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  startRecordEdit(rec);
                                }}
                                className="p-1 text-slate-400 hover:text-[#0E6B5C] rounded-md hover:bg-[#E3F3EF]"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs font-medium text-slate-700 mt-1">
                            {rec.purpose || rec.kind}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                            {rec.content}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">기록이 없습니다.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {currentList.length > 0 ? (
                currentList.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => onOpenRecord(rec.id)}
                    className="bg-white border border-slate-200 hover:border-[#0E6B5C] rounded-xl p-4 shadow-xs hover:shadow-sm cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 group-hover:text-[#0E6B5C]">
                          {rec.purpose || `${rec.target} ${rec.method} 상담`}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{rec.date}</span>
                        <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {rec.method}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            rec.level === 2
                              ? 'bg-red-100 text-red-800'
                              : rec.level === 1
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {LEVEL_NAMES[rec.level]}
                        </span>
                        <button
                          type="button"
                          aria-label="상담 기록 수정"
                          title="상담 기록 수정"
                          onClick={(event) => {
                            event.stopPropagation();
                            startRecordEdit(rec);
                          }}
                          className="p-1 text-slate-400 hover:text-[#0E6B5C] rounded-md hover:bg-[#E3F3EF]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {rec.content}
                    </p>

                    {rec.result.signals.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rec.result.signals.slice(0, 3).map((sig, sidx) => (
                          <span
                            key={sidx}
                            className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded"
                          >
                            {sig.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white border border-dashed border-slate-200 rounded-xl p-8 text-center space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500">
                    해당 대상과의 상담·연락 기록이 없습니다.
                  </p>
                  <button
                    onClick={() => onNewRecordForStudent(student.id)}
                    className="inline-flex items-center gap-1 text-xs text-[#0E6B5C] font-bold hover:underline"
                  >
                    + 새 기록 작성하기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isEditingStudent && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
          <form
            onSubmit={handleStudentSubmit}
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">학생 정보 수정</h3>
                <p className="text-xs text-slate-500 mt-1">이름과 5자리 학번을 수정합니다.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingStudent(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">학생 이름</span>
              <input
                autoFocus
                value={studentNameDraft}
                onChange={(event) => setStudentNameDraft(event.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0E6B5C]"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">학번</span>
              <input
                inputMode="numeric"
                maxLength={5}
                value={studentNoDraft}
                onChange={(event) => setStudentNoDraft(event.target.value.replace(/\D/g, ''))}
                placeholder="예: 10305"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-[#0E6B5C]"
              />
            </label>
            {studentEditError && <p className="text-xs text-red-600">{studentEditError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingStudent(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                취소
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0E6B5C] hover:bg-[#0A5448] rounded-lg"
              >
                <Save className="w-3.5 h-3.5" /> 저장
              </button>
            </div>
          </form>
        </div>
      )}

      {editingRecordId !== null && recordDraft && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
          <form
            onSubmit={handleRecordSubmit}
            className="bg-white w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">상담 기록 수정</h3>
                <p className="text-xs text-slate-500 mt-1">저장 시 위험 신호 분석을 다시 계산합니다.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingRecordId(null);
                  setRecordDraft(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">기록 날짜</span>
                <input
                  type="date"
                  value={recordDraft.date}
                  onChange={(event) => setRecordDraft({ ...recordDraft, date: event.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0E6B5C]"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">기록 종류</span>
                <select
                  value={recordDraft.kind}
                  onChange={(event) =>
                    setRecordDraft({ ...recordDraft, kind: event.target.value as ConsultationRecord['kind'] })
                  }
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0E6B5C]"
                >
                  <option value="상담">상담</option>
                  <option value="일상">일상</option>
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">상담 대상</span>
                <select
                  value={recordDraft.target}
                  onChange={(event) =>
                    setRecordDraft({ ...recordDraft, target: event.target.value as ConsultationRecord['target'] })
                  }
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0E6B5C]"
                >
                  <option value="학부모">학부모</option>
                  <option value="학생">학생</option>
                  <option value="교사">교사</option>
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">연락 방법</span>
                <select
                  value={recordDraft.method}
                  onChange={(event) =>
                    setRecordDraft({ ...recordDraft, method: event.target.value as ConsultationRecord['method'] })
                  }
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0E6B5C]"
                >
                  <option value="전화">전화</option>
                  <option value="문자">문자</option>
                  <option value="내방">내방</option>
                  <option value="화상">화상</option>
                </select>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">기록 제목</span>
              <input
                value={recordDraft.purpose}
                onChange={(event) => setRecordDraft({ ...recordDraft, purpose: event.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#0E6B5C]"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">상담·사건 내용</span>
              <textarea
                rows={6}
                value={recordDraft.content}
                onChange={(event) => setRecordDraft({ ...recordDraft, content: event.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm leading-relaxed outline-none focus:border-[#0E6B5C] resize-y"
              />
            </label>
            {recordEditError && <p className="text-xs text-red-600">{recordEditError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setEditingRecordId(null);
                  setRecordDraft(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                취소
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0E6B5C] hover:bg-[#0A5448] rounded-lg"
              >
                <Save className="w-3.5 h-3.5" /> 저장 및 재분석
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
