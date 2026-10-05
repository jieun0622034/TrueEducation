export type RiskLevel = 0 | 1 | 2; // 0: 낮음, 1: 주의, 2: 높음

export interface Student {
  id: number;
  name: string;
  cls: string; // e.g. "1-3"
  no: string;  // e.g. "10305" (5자리 학번)
  createdAt?: string;
}

export interface LawItem {
  id: string;
  cite: string;
  body: string;
  url: string;
}

export interface SignalSpan {
  s: number;
  e: number;
  level: RiskLevel;
  code: string;
}

export interface SignalItem {
  code: string;
  label: string;
  level: RiskLevel;
  laws: string[];
  quote?: string;
}

export interface TrendAnalysis {
  direction: '상승' | '완화' | '유지';
  intervals: number[];
  levels: RiskLevel[];
  text: string[];
}

export interface FlowItem {
  id: number;
  date: string;
  method: string;
  purpose: string;
  level: RiskLevel;
  snippet: string;
  related: boolean;
}

export interface AnalysisResult {
  level: RiskLevel;
  base: RiskLevel;
  escalation: string | null;
  signals: SignalItem[];
  spans: SignalSpan[];
  fact: string;
  emotion: string;
  laws: LawItem[];
  advice: string[];
  questions: string[];
  flow: FlowItem[];
  trend: TrendAnalysis | null;
  rep_n: number;
  alert: boolean;
  guard: {
    injection: string[];
    masked: number;
  };
  trace: string[];
  engine: string;
  summary?: string;
  // New Agent Competition Scoring & Admissibility
  admissibility?: {
    score: number; // 0~100
    grade: '접수 유력' | '보강 권고' | '주의 관찰';
    criteriaScores: {
      evidence: number;      // 증거 입증성 (0~30)
      statutory: number;     // 법령 부합도 (0~30)
      recurrence: number;    // 반복·지속성 (0~20)
      severity: number;      // 침해 중대성 (0~20)
    };
    checklists: { text: string; done: boolean; required: boolean }[];
    opinion: string;
  };
}

export interface AgentStepTrace {
  step: number;
  name: string;
  type: 'planning' | 'memory' | 'security' | 'tool' | 'reasoning' | 'evaluator';
  description: string;
  outputSnippet?: string;
  latencyMs: number;
  status: 'success' | 'warning' | 'active';
}

export interface LiveCoachingScenario {
  alertLevel: RiskLevel;
  violationSignal?: string;
  standardScript: string;
  legalBasis: string;
  actionGuidance: string;
}

export interface RoleplayMessage {
  sender: 'parent' | 'teacher' | 'agent';
  text: string;
  timestamp: string;
  feedback?: {
    score: number;
    tip: string;
    isAppropriate: boolean;
  };
}

export interface ConsultationRecord {
  id: number;
  studentId: number;
  name?: string;
  studentNo?: string;
  studentCls?: string;
  date: string;
  kind: '상담' | '일상';
  target: '학부모' | '학생' | '교사';
  method: '전화' | '문자' | '내방' | '화상';
  purpose: string;
  content: string;
  level: RiskLevel;
  result: AnalysisResult;
  done: number[]; // indices of completed advice
  version: number;
  memoId?: number;
  createdAt?: string;
}

export interface Memo {
  id: number;
  text: string;
  created: string; // ISO date-time string
  date: string;    // YYYY-MM-DD
  converted: boolean;
  recordId?: number;
  detectedStudentId?: number;
  detectedStudentName?: string;
  detectedTarget?: '학부모' | '학생' | '교사';
  detectedMethod?: '전화' | '문자' | '내방' | '화상';
  isAudio?: boolean;
}

export interface AlertNotification {
  recordId: number;
  studentId: number;
  name: string;
  target: string;
  level: RiskLevel;
  rep_n: number;
  leftAdviceCount: number;
  date: string;
  purpose: string;
}

export interface TriageOutput {
  status: 'saved' | 'review' | 'need_student';
  recordId?: number;
  draft?: {
    studentId?: number;
    date: string;
    kind: '상담' | '일상';
    target: '학부모' | '학생' | '교사';
    method: '전화' | '문자' | '내방' | '화상';
    purpose: string;
    content: string;
    memoId?: number;
  };
  analysis?: {
    studentId: number;
    name: string;
    no: string;
    date: string;
    kind: '상담' | '일상';
    target: '학부모' | '학생' | '교사';
    method: '전화' | '문자' | '내방' | '화상';
    purpose: string;
    content: string;
    level: RiskLevel;
    result: AnalysisResult;
  };
}
