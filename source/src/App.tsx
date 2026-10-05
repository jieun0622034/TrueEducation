import React, { useState, useEffect } from 'react';
import {
  Student,
  Memo,
  ConsultationRecord,
  AnalysisResult,
  AlertNotification,
} from './types';
import { loadAppState, saveAppState, resetToDemo, clearAllData } from './utils/storage';
import {
  analyzeRecord,
  autofillMemo,
  triageMemo,
  LEVEL_NAMES,
} from './utils/engine';
import { Header } from './components/Header';
import { QuickMemoCard } from './components/QuickMemoCard';
import { TodayMemosSection } from './components/TodayMemosSection';
import { AnalysisModal } from './components/AnalysisModal';
import { StudentListView } from './components/StudentListView';
import { RecordListView } from './components/RecordListView';
import { StudentDetailView } from './components/StudentDetailView';
import { RecordFormView } from './components/RecordFormView';
import { FactReportView } from './components/FactReportView';
import { AboutView } from './components/AboutView';
import { TeacherNameModal } from './components/TeacherNameModal';
import { LiveCallCopilotModal } from './components/LiveCallCopilotModal';
import { CommitteeAdmissibilityModal } from './components/CommitteeAdmissibilityModal';
import { RoleplaySimulatorModal } from './components/RoleplaySimulatorModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import {
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  PhoneCall,
  Scale,
  Bot,
} from 'lucide-react';

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<ConsultationRecord[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [teacherName, setTeacherName] = useState<string>('김선생');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Navigation & View State
  const [currentTab, setCurrentTab] = useState<'home' | 'students' | 'records' | 'write' | 'about'>('home');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [factReportConfig, setFactReportConfig] = useState<{ studentId: number; target: string } | null>(null);

  // Analysis Modal State
  const [analysisModalData, setAnalysisModalData] = useState<any | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);

  // Teacher Name Modal State
  const [showTeacherModal, setShowTeacherModal] = useState<boolean>(false);

  // Killer Feature Modals State
  const [showLiveCopilot, setShowLiveCopilot] = useState<boolean>(false);
  const [showCommitteeModal, setShowCommitteeModal] = useState<boolean>(false);
  const [committeeTargetRecord, setCommitteeTargetRecord] = useState<any | null>(null);
  const [showRoleplayModal, setShowRoleplayModal] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Load initial state from LocalStorage
  useEffect(() => {
    const data = loadAppState();
    setStudents(data.students);
    setRecords(data.records);
    setMemos(data.memos);
    setTeacherName(data.teacherName || '김선생');
    setIsLoaded(true);
  }, []);

  // Save state on changes
  useEffect(() => {
    if (!isLoaded) return;
    saveAppState({
      students,
      records,
      memos,
      teacherName,
    });
  }, [students, records, memos, teacherName, isLoaded]);

  // Derived statistics
  const highRiskCount = records.filter((r) => r.level === 2).length;
  const cautionRiskCount = records.filter((r) => r.level === 1).length;

  // Active alerts (records within last 14 days with remaining advice items)
  const todayTime = new Date().getTime();
  const activeAlerts: AlertNotification[] = records
    .filter((r) => {
      const recTime = new Date(r.date).getTime();
      const diffDays = (todayTime - recTime) / (1000 * 60 * 60 * 24);
      return r.level >= 1 && diffDays <= 14;
    })
    .map((r) => {
      const leftCount = r.result.advice.length - (r.done?.length || 0);
      return {
        recordId: r.id,
        studentId: r.studentId,
        name: r.name || '학생',
        target: r.target,
        level: r.level,
        rep_n: r.result.rep_n,
        leftAdviceCount: Math.max(0, leftCount),
        date: r.date,
        purpose: r.purpose || `${r.target} 상담`,
      };
    })
    .filter((a) => a.leftAdviceCount > 0)
    .slice(0, 3);

  // Handlers for Memos
  const handleSaveMemoOnly = (text: string) => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const auto = autofillMemo(text, students);

    const newMemo: Memo = {
      id: Date.now(),
      text,
      created: today.toISOString(),
      date: todayStr,
      converted: false,
      detectedStudentId: auto.studentId,
      detectedStudentName: auto.detectedStudentName,
      detectedTarget: auto.target,
      detectedMethod: auto.method,
      isAudio: false,
    };

    setMemos((prev) => [newMemo, ...prev]);
    showToast('메모가 오늘의 기록에 저장되었습니다.');
  };

  const handleAgentTriage = (text: string) => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const memoId = Date.now();
    const auto = autofillMemo(text, students);

    const newMemo: Memo = {
      id: memoId,
      text,
      created: today.toISOString(),
      date: todayStr,
      converted: false,
      detectedStudentId: auto.studentId,
      detectedStudentName: auto.detectedStudentName,
      detectedTarget: auto.target,
      detectedMethod: auto.method,
      isAudio: false,
    };

    setMemos((prev) => [newMemo, ...prev]);

    // Run triage logic
    const triage = triageMemo(text, memoId, students, records);

    if (triage.status === 'need_student') {
      showToast('메모에서 학생 이름을 찾지 못했습니다. 학생을 선택해주세요.');
      setSelectedStudentId(null);
      setCurrentTab('write');
      return;
    }

    if (triage.status === 'saved') {
      // Risk is 0 (safe) -> automatically save to formal records as well!
      const stu = students.find((s) => s.id === auto.studentId)!;
      const analysis = analyzeRecord(stu.id, text, {
        target: auto.target,
        method: auto.method,
        date: auto.date,
        kind: auto.kind,
        purpose: auto.suggestedPurpose,
        existingRecords: records,
      });

      const newRecord: ConsultationRecord = {
        id: Date.now() + 1,
        studentId: stu.id,
        name: stu.name,
        studentNo: stu.no,
        studentCls: stu.cls,
        date: auto.date,
        kind: auto.kind,
        target: auto.target,
        method: auto.method,
        purpose: auto.suggestedPurpose || '일상 상담 및 문의',
        content: text,
        level: 0,
        result: analysis,
        done: [],
        version: 1,
        memoId,
      };

      setRecords((prev) => [newRecord, ...prev]);
      setMemos((prev) =>
        prev.map((m) =>
          m.id === memoId ? { ...m, converted: true, recordId: newRecord.id } : m
        )
      );

      showToast(`위험 신호가 없어 [안전] 기록으로 자동 저장되었습니다 (${stu.name}).`);
    } else if (triage.status === 'review' && triage.analysis) {
      // Risk is 1 or 2 -> prompt teacher to review detailed analysis modal
      setAnalysisModalData({
        ...triage.analysis,
        studentName: triage.analysis.name,
        studentNo: triage.analysis.no,
        memoId,
      });
      setShowAnalysisModal(true);
      showToast('교권 보호 위험 신호가 감지되었습니다. 분석 결과를 확인하세요.');
    }
  };

  const handleConvertMemo = (memo: Memo) => {
    const auto = autofillMemo(memo.text, students);
    const stu = memo.detectedStudentId
      ? students.find((s) => s.id === memo.detectedStudentId)
      : auto.studentId
      ? students.find((s) => s.id === auto.studentId)
      : students[0];

    if (!stu) {
      showToast('먼저 학생을 등록하거나 선택해 주세요.');
      setCurrentTab('students');
      return;
    }

    const analysis = analyzeRecord(stu.id, memo.text, {
      target: memo.detectedTarget || auto.target,
      method: memo.detectedMethod || auto.method,
      date: memo.date,
      kind: '상담',
      purpose: auto.suggestedPurpose,
      existingRecords: records,
    });

    setAnalysisModalData({
      studentId: stu.id,
      studentName: stu.name,
      studentNo: stu.no,
      studentCls: stu.cls,
      date: memo.date,
      kind: '상담',
      target: memo.detectedTarget || auto.target,
      method: memo.detectedMethod || auto.method,
      purpose: auto.suggestedPurpose,
      content: memo.text,
      level: analysis.level,
      result: analysis,
      memoId: memo.id,
    });
    setShowAnalysisModal(true);
  };

  const handleDeleteMemo = (memoId: number) => {
    setMemos((prev) => prev.filter((m) => m.id !== memoId));
    showToast('메모를 삭제했습니다.');
  };

  const handleOpenRecord = (recordId: number) => {
    const rec = records.find((r) => r.id === recordId);
    if (!rec) return;

    setAnalysisModalData({
      id: rec.id,
      studentId: rec.studentId,
      studentName: rec.name || '학생',
      studentNo: rec.studentNo,
      studentCls: rec.studentCls,
      date: rec.date,
      kind: rec.kind,
      target: rec.target,
      method: rec.method,
      purpose: rec.purpose,
      content: rec.content,
      level: rec.level,
      result: rec.result,
      done: rec.done,
      memoId: rec.memoId,
    });
    setShowAnalysisModal(true);
  };

  const handleSaveModalRecord = (data: any) => {
    const newRecordId = Date.now();
    const newRecord: ConsultationRecord = {
      id: newRecordId,
      studentId: data.studentId,
      name: data.studentName,
      studentNo: data.studentNo,
      studentCls: data.studentCls,
      date: data.date,
      kind: data.kind,
      target: data.target,
      method: data.method,
      purpose: data.purpose || `${data.target} 상담`,
      content: data.content,
      level: data.level,
      result: data.result,
      done: data.done || [],
      version: 1,
      memoId: data.memoId,
    };

    setRecords((prev) => [newRecord, ...prev]);

    if (data.memoId) {
      setMemos((prev) =>
        prev.map((m) =>
          m.id === data.memoId ? { ...m, converted: true, recordId: newRecordId } : m
        )
      );
    }

    setShowAnalysisModal(false);
    showToast('상담 일지에 정식 저장되었습니다.');
  };

  // Student CRUD handlers
  const handleAddStudent = (name: string, no: string) => {
    const m = no.match(/^([1-6])(\d{2})(\d{2})$/);
    const cls = m ? `${parseInt(m[1], 10)}-${parseInt(m[2], 10)}` : '1-1';
    const newStudent: Student = {
      id: Date.now(),
      name,
      no,
      cls,
      createdAt: new Date().toISOString(),
    };
    setStudents((prev) => [...prev, newStudent]);
    showToast(`${name} 학생이 등록되었습니다.`);
  };

  const handleBulkAddStudents = (bulkText: string) => {
    const lines = bulkText.split('\n');
    let added = 0;
    let skipped = 0;
    const newStudents: Student[] = [];

    lines.forEach((line) => {
      const parts = line.split(/[,\t]/).map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const noPart = parts.find((p) => /^\d{5}$/.test(p));
        const namePart = parts.find((p) => !/^\d+$/.test(p));

        if (noPart && namePart) {
          const m = noPart.match(/^([1-6])(\d{2})(\d{2})$/);
          const cls = m ? `${parseInt(m[1], 10)}-${parseInt(m[2], 10)}` : '1-1';
          newStudents.push({
            id: Date.now() + Math.random(),
            name: namePart,
            no: noPart,
            cls,
          });
          added++;
          return;
        }
      }
      if (line.trim()) skipped++;
    });

    if (newStudents.length > 0) {
      setStudents((prev) => [...prev, ...newStudents]);
    }

    return { added, skipped };
  };

  const handleDeleteStudent = (studentId: number) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setRecords((prev) => prev.filter((r) => r.studentId !== studentId));
    showToast('학생 및 연관 기록이 삭제되었습니다.');
  };

  const handleUpdateStudent = (studentId: number, name: string, no: string) => {
    const match = no.match(/^([1-6])(\d{2})(\d{2})$/);
    if (!match) return;
    const cls = `${Number.parseInt(match[1], 10)}-${Number.parseInt(match[2], 10)}`;

    setStudents((prev) => prev.map((student) =>
      student.id === studentId ? { ...student, name, no, cls } : student
    ));
    setRecords((prev) => prev.map((record) =>
      record.studentId === studentId
        ? { ...record, name, studentNo: no, studentCls: cls }
        : record
    ));
    setMemos((prev) => prev.map((memo) =>
      memo.detectedStudentId === studentId ? { ...memo, detectedStudentName: name } : memo
    ));
    setAnalysisModalData((prev: any) =>
      prev?.studentId === studentId
        ? { ...prev, studentName: name, studentNo: no, studentCls: cls }
        : prev
    );
    showToast(`${name} 학생 정보가 수정되었습니다.`);
  };

  const handleUpdateStudentRecord = (
    recordId: number,
    fields: Pick<ConsultationRecord, 'date' | 'kind' | 'target' | 'method' | 'purpose' | 'content'>,
  ) => {
    const currentRecord = records.find((record) => record.id === recordId);
    if (!currentRecord) return;

    const result = analyzeRecord(currentRecord.studentId, fields.content, {
      target: fields.target,
      method: fields.method,
      date: fields.date,
      kind: fields.kind,
      purpose: fields.purpose,
      existingRecords: records,
      currentRecordId: recordId,
    });
    const updatedRecord: ConsultationRecord = {
      ...currentRecord,
      ...fields,
      level: result.level,
      result,
      done: [],
    };

    setRecords((prev) => prev.map((record) => record.id === recordId ? updatedRecord : record));
    if (currentRecord.memoId) {
      setMemos((prev) => prev.map((memo) =>
        memo.id === currentRecord.memoId
          ? {
              ...memo,
              text: fields.content,
              date: fields.date,
              detectedTarget: fields.target,
              detectedMethod: fields.method,
            }
          : memo
      ));
    }
    setAnalysisModalData((prev: any) =>
      prev?.id === recordId
        ? {
            ...prev,
            ...updatedRecord,
            studentName: currentRecord.name || '학생',
            studentNo: currentRecord.studentNo,
            studentCls: currentRecord.studentCls,
          }
        : prev
    );
    showToast('상담 기록을 수정하고 위험도 분석을 다시 계산했습니다.');
  };

  // Manual Record Creator handler
  const handleManualRecordAnalysis = (data: any) => {
    const analysis = analyzeRecord(data.studentId, data.content, {
      target: data.target,
      method: data.method,
      date: data.date,
      kind: data.kind,
      purpose: data.purpose,
      existingRecords: records,
    });

    setAnalysisModalData({
      ...data,
      level: analysis.level,
      result: analysis,
    });
    setShowAnalysisModal(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col font-sans text-slate-800">
      {/* 3-Zone Standard Top Navigation */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setSelectedStudentId(null);
          setFactReportConfig(null);
        }}
        teacherName={teacherName}
        onEditTeacherName={() => setShowTeacherModal(true)}
        highRiskCount={highRiskCount}
        cautionRiskCount={cautionRiskCount}
        onOpenLiveCopilot={() => setShowLiveCopilot(true)}
        onOpenRoleplay={() => setShowRoleplayModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 md:pb-6 space-y-4 sm:space-y-6">
        {/* VIEW 1: FACT PROGRESS REPORT (PDF) */}
        {factReportConfig ? (
          (() => {
            const stu = students.find((s) => s.id === factReportConfig.studentId);
            if (!stu) return null;
            return (
              <FactReportView
                student={stu}
                records={records.filter((r) => r.studentId === stu.id)}
                target={factReportConfig.target}
                onBack={() => setFactReportConfig(null)}
              />
            );
          })()
        ) : selectedStudentId ? (
          /* VIEW 2: STUDENT DETAIL TIMELINE */
          (() => {
            const stu = students.find((s) => s.id === selectedStudentId);
            if (!stu) return null;
            return (
              <StudentDetailView
                student={stu}
                records={records.filter((r) => r.studentId === stu.id)}
                onBack={() => setSelectedStudentId(null)}
                onOpenRecord={handleOpenRecord}
                onNewRecordForStudent={(sid) => {
                  setSelectedStudentId(null);
                  setCurrentTab('write');
                }}
                onOpenFactReport={(sid, target) => {
                  setFactReportConfig({ studentId: sid, target });
                }}
                onDeleteStudent={handleDeleteStudent}
                onUpdateStudent={handleUpdateStudent}
                onUpdateRecord={handleUpdateStudentRecord}
              />
            );
          })()
        ) : currentTab === 'records' ? (
          <RecordListView records={records} onOpenRecord={handleOpenRecord} />
        ) : currentTab === 'students' ? (
          /* VIEW 3: STUDENT ROSTER */
          <StudentListView
            students={students}
            onSelectStudent={(sid) => setSelectedStudentId(sid)}
            onAddStudent={handleAddStudent}
            onBulkAddStudents={handleBulkAddStudents}
            onDeleteStudent={handleDeleteStudent}
            getStudentRecordCount={(sid) => records.filter((r) => r.studentId === sid).length}
            getStudentHighestRisk={(sid) =>
              records
                .filter((r) => r.studentId === sid)
                .reduce<0 | 1 | 2>((max, r) => (r.level > max ? r.level : max), 0)
            }
          />
        ) : currentTab === 'write' ? (
          /* VIEW 4: DETAILED RECORD WRITER */
          <RecordFormView
            students={students}
            onBack={() => setCurrentTab('home')}
            onSubmitAnalysis={handleManualRecordAnalysis}
          />
        ) : currentTab === 'about' ? (
          /* VIEW 5: ABOUT & LAWS DATABASE */
          <AboutView
            studentsCount={students.length}
            recordsCount={records.length}
            memosCount={memos.length}
            onResetDemo={() => {
              const reset = resetToDemo();
              setStudents(reset.students);
              setRecords(reset.records);
              setMemos(reset.memos);
              setTeacherName(reset.teacherName);
              showToast('데모 데이터로 초기화되었습니다.');
            }}
            onClearAll={() => {
              const empty = clearAllData();
              setStudents(empty.students);
              setRecords(empty.records);
              setMemos(empty.memos);
              setTeacherName('');
              showToast('모든 데이터가 삭제되었습니다.');
            }}
          />
        ) : (
          /* VIEW 6: HOME DASHBOARD (Quick Memo on Top, Today's Memos All Included, Alerts) */
          <div className="space-y-4 sm:space-y-6">
            {/* 1. TOP POSITION: QUICK MEMO STATION */}
            <QuickMemoCard
              students={students}
              onSaveMemoOnly={handleSaveMemoOnly}
              onAgentTriage={handleAgentTriage}
            />

            {/* 🌟 2. KILLER FEATURES HUB */}
            {/* 2-A. MOBILE COMPACT 3-BUTTON DOCK (Only on phone screens < 640px) */}
            <div className="sm:hidden grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setShowLiveCopilot(true)}
                className="p-2.5 bg-white active:bg-red-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1.5 shadow-2xs text-center"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 whitespace-nowrap">
                  실시간 통화코치
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetRec = records.find((r) => r.level >= 1) || records[0];
                  if (targetRec) setCommitteeTargetRecord(targetRec);
                  setShowCommitteeModal(true);
                }}
                className="p-2.5 bg-white active:bg-emerald-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1.5 shadow-2xs text-center"
              >
                <div className="w-8 h-8 rounded-lg bg-[#E3F3EF] text-[#0E6B5C] flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 whitespace-nowrap">
                  교보위 적격성
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowRoleplayModal(true)}
                className="p-2.5 bg-white active:bg-indigo-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1.5 shadow-2xs text-center"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 whitespace-nowrap">
                  AI 모의훈련
                </span>
              </button>
            </div>

            {/* 2-B. DESKTOP 3 KILLER CARDS (Preserved 100% on sm and larger screens) */}
            <div className="hidden sm:block bg-gradient-to-r from-[#E3F3EF]/60 via-white to-indigo-50/50 border border-[#0E6B5C]/20 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#0E6B5C]" />
                  <span>True Education Agent 3대 실전 교권보호 솔루션</span>
                </span>
                <span className="text-[11px] text-[#0E6B5C] font-semibold">
                  원클릭 즉시 실행
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Killer Card 1: Live Copilot */}
                <button
                  type="button"
                  onClick={() => setShowLiveCopilot(true)}
                  className="p-3 bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-300 rounded-xl text-left transition-all group shadow-2xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
                      <PhoneCall className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                      골든타임 코치
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-700">
                      실시간 통화·상담 코치
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      폭언·맘카페 협박 감지 시 지금 바로 읽을 3단계 표준 법적 대본 즉시 제시
                    </p>
                  </div>
                </button>

                {/* Killer Card 2: Committee Simulator */}
                <button
                  type="button"
                  onClick={() => {
                    const targetRec = records.find((r) => r.level >= 1) || records[0];
                    if (targetRec) {
                      setCommitteeTargetRecord(targetRec);
                    }
                    setShowCommitteeModal(true);
                  }}
                  className="p-3 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-[#0E6B5C] rounded-xl text-left transition-all group shadow-2xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-lg bg-[#E3F3EF] text-[#0E6B5C] flex items-center justify-center font-bold">
                      <Scale className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[10px] font-bold text-[#0E6B5C] bg-[#E3F3EF] px-2 py-0.5 rounded-full">
                      정량 채점
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0E6B5C]">
                      교보위 심의 적격성 시뮬레이터
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      4대 지표 입증 가능성 지수 산출 및 교육청 공식 심의 신청서 1초 드래프트
                    </p>
                  </div>
                </button>

                {/* Killer Card 3: Roleplay Sandbox */}
                <button
                  type="button"
                  onClick={() => setShowRoleplayModal(true)}
                  className="p-3 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all group shadow-2xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                      <Bot className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      실전 방어 훈련
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">
                      AI 모의 학부모 방어 훈련
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      실제 악성 민원 상황 모의 연습 및 교사 감정 침착성·법적 고지 실시간 피드백
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* 3. ACTIVE RISK REMINDERS & RECENT 7-DAY SUMMARY */}
            {/* 3-A. MOBILE STREAMLINED RISK & ALERT CARD (Only on < md screens) */}
            <div className="md:hidden bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-[#0E6B5C] shrink-0" />
                  <span>최근 7일 위험 현황 & 선제 알림</span>
                </div>
                <div className="text-xs font-extrabold whitespace-nowrap">
                  {highRiskCount > 0 || cautionRiskCount > 0 ? (
                    <span>
                      높음 <span className="text-red-600">{highRiskCount}</span> · 주의{' '}
                      <span className="text-amber-600">{cautionRiskCount}</span>
                    </span>
                  ) : (
                    <span className="text-emerald-700">특이 위험 없음</span>
                  )}
                </div>
              </div>

              {activeAlerts.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  {activeAlerts.slice(0, 2).map((alt) => (
                    <button
                      key={alt.recordId}
                      type="button"
                      onClick={() => handleOpenRecord(alt.recordId)}
                      className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 active:border-[#0E6B5C] bg-[#FAFBFB] text-left"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            alt.level === 2 ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                        />
                        <span className="font-bold text-xs text-slate-900 whitespace-nowrap shrink-0">
                          {alt.name}({alt.target})
                        </span>
                        <span className="text-xs text-slate-500 truncate">
                          · {alt.purpose}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[11px] font-bold text-[#0E6B5C] bg-[#E3F3EF] px-2 py-0.5 rounded-full whitespace-nowrap">
                          대응 {alt.leftAdviceCount}건
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3-B. DESKTOP 3-COLUMN RISK & ALERTS (Preserved 100% on md and larger screens) */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Daily Alert Summary Pill */}
              <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold text-slate-500">최근 7일 위험도 현황</span>
                  <span className="text-[11px] text-slate-400">교권 보호 기준</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      {highRiskCount > 0 || cautionRiskCount > 0 ? (
                        <span>
                          높음 <span className="text-red-600">{highRiskCount}</span> · 주의{' '}
                          <span className="text-amber-600">{cautionRiskCount}</span>
                        </span>
                      ) : (
                        <span className="text-emerald-700 text-lg">특이 위험 없음</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      총 {records.length}건의 누적 상담 일지 기반
                    </p>
                  </div>

                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      highRiskCount > 0
                        ? 'bg-red-50 text-red-600'
                        : cautionRiskCount > 0
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {highRiskCount > 0 ? (
                      <ShieldAlert className="w-6 h-6" />
                    ) : cautionRiskCount > 0 ? (
                      <AlertTriangle className="w-6 h-6" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6" />
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pt-1">
                  * 3회 이상 동일 사안 반복 시 위험도가 자동으로 상향됩니다.
                </div>
              </div>

              {/* Actionable Follow-up Alerts */}
              <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-[#0E6B5C]" />
                    <span>Agent 선제 알림 (후속 대응이 남은 최근 기록)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">최근 14일 기준</span>
                </div>

                {activeAlerts.length > 0 ? (
                  <div className="space-y-2">
                    {activeAlerts.map((alt) => (
                      <button
                        key={alt.recordId}
                        type="button"
                        onClick={() => handleOpenRecord(alt.recordId)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-[#0E6B5C] bg-[#FAFBFB] hover:bg-[#E3F3EF]/30 text-left transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              alt.level === 2 ? 'bg-red-500' : 'bg-amber-500'
                            }`}
                          />
                          <span className="font-bold text-xs text-slate-900 group-hover:text-[#0E6B5C]">
                            {alt.name} ({alt.target})
                          </span>
                          <span className="text-xs text-slate-500">· {alt.purpose}</span>
                          <span className="text-[11px] text-slate-400">
                            동일 사안 {alt.rep_n}회차
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#0E6B5C] bg-[#E3F3EF] px-2 py-0.5 rounded-full">
                            대응 {alt.leftAdviceCount}건 남음
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0E6B5C]" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400">
                    현재 추가로 확인이 필요한 미완료 위험 대응 과제가 없습니다.
                  </div>
                )}

                <div className="text-[11px] text-slate-400">
                  행동 지침을 완료하시면 알림이 자동으로 해제됩니다.
                </div>
              </div>
            </div>

            {/* 4. TODAY'S MEMOS HUB (All Memos from Today) */}
            <TodayMemosSection
              memos={memos}
              students={students}
              onConvertMemo={handleConvertMemo}
              onDeleteMemo={handleDeleteMemo}
              onOpenRecord={handleOpenRecord}
            />

          </div>
        )}
      </main>

      {/* Analysis Inspector Modal */}
      {showAnalysisModal && analysisModalData && (
        <AnalysisModal
          isOpen={showAnalysisModal}
          onClose={() => setShowAnalysisModal(false)}
          recordData={analysisModalData}
          onSaveRecord={handleSaveModalRecord}
          onOpenReport={(sid, target) => {
            setShowAnalysisModal(false);
            setFactReportConfig({ studentId: sid, target });
          }}
          onOpenAdmissibility={(data) => {
            setShowAnalysisModal(false);
            setCommitteeTargetRecord(data);
            setShowCommitteeModal(true);
          }}
          teacherName={teacherName}
        />
      )}

      {/* Teacher Name Settings Modal */}
      <TeacherNameModal
        isOpen={showTeacherModal}
        onClose={() => setShowTeacherModal(false)}
        currentName={teacherName}
        onSaveName={(name) => {
          setTeacherName(name);
          showToast(`선생님 호칭이 '${name}'으로 저장되었습니다.`);
        }}
      />

      {/* 🌟 KILLER MODAL 1: Live Call Copilot (Golden-Time Assistant) */}
      <LiveCallCopilotModal
        isOpen={showLiveCopilot}
        onClose={() => setShowLiveCopilot(false)}
        onSendToMemo={(transcript) => {
          handleSaveMemoOnly(transcript);
          showToast('통화 내용이 오늘의 메모에 안전하게 등록되었습니다.');
        }}
      />

      {/* 🌟 KILLER MODAL 2: Committee Admissibility Simulator & Application Generator */}
      {showCommitteeModal && (
        (() => {
          const activeRec =
            committeeTargetRecord ||
            records.find((r) => r.level >= 1) ||
            records[0] || {
              id: 9999,
              studentId: students[0]?.id || 1,
              name: students[0]?.name || '김철수',
              studentNo: students[0]?.no || '10301',
              studentCls: students[0]?.cls || '1-3',
              date: new Date().toISOString().slice(0, 10),
              kind: '상담',
              target: '학부모',
              method: '전화 통화',
              purpose: '수행평가 감점 항의 및 폭언',
              content: '수행평가 감점에 대해 강하게 항의하며 맘카페 및 교육청에 유포하겠다고 협박함.',
              level: 2,
              done: [],
              version: 1,
            };
          const stu =
            students.find((s) => s.id === activeRec.studentId) ||
            students[0] || { id: 1, name: '김철수', cls: '1-3', no: '10301' };

          return (
            <CommitteeAdmissibilityModal
              isOpen={showCommitteeModal}
              onClose={() => setShowCommitteeModal(false)}
              record={activeRec}
              student={stu}
              teacherName={teacherName}
              allRecords={records}
              allStudents={students}
              onSelectCase={(rec) => setCommitteeTargetRecord(rec)}
            />
          );
        })()
      )}

      {/* 🌟 KILLER MODAL 3: AI Roleplay Defense Simulation Sandbox */}
      <RoleplaySimulatorModal
        isOpen={showRoleplayModal}
        onClose={() => setShowRoleplayModal(false)}
        teacherName={teacherName}
        students={students}
      />

      {/* Floating Toast Notification (Above mobile bottom nav) */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Fixed Bottom Navigation Bar (Pattern 1) */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setSelectedStudentId(null);
          setFactReportConfig(null);
        }}
        onOpenLiveCopilot={() => setShowLiveCopilot(true)}
        highRiskCount={highRiskCount}
      />

      {/* Minimal Academic Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400 hidden md:block">
        <p>
          True Education · 교사 상담 기록 및 교권침해 분석 AI (교원지위법 및 교육활동 보호 지침 준수)
        </p>
      </footer>
    </div>
  );
}
