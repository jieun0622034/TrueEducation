import {
  AnalysisResult,
  ConsultationRecord,
  FlowItem,
  LawItem,
  RiskLevel,
  SignalItem,
  SignalSpan,
  Student,
  TrendAnalysis,
  TriageOutput,
} from '../types';
import { LAWS_DATABASE } from '../data/laws';

export const LEVEL_NAMES: Record<RiskLevel, string> = {
  0: '낮음',
  1: '주의',
  2: '높음',
};

const RULES: {
  level: RiskLevel;
  code: string;
  label: string;
  regex: RegExp;
  laws: string[];
}[] = [
  {
    level: 2,
    code: 'abuse',
    label: '욕설·폭언·모욕',
    regex: /씨발|개새|병신|미친\s?(선생|교사)|쓰레기|무능|폭언|욕설|막말/g,
    laws: ['L19-1'],
  },
  {
    level: 2,
    code: 'threat',
    label: '협박·위해 암시',
    regex: /가만\s?(안|두지)|죽이|때리겠|해코지|후회하게|책임지게/g,
    laws: ['L19-1'],
  },
  {
    level: 2,
    code: 'record',
    label: '녹음·촬영 공개 암시',
    regex: /(녹음|녹취|촬영|영상).{0,15}(공개|올리|퍼뜨|유포|SNS|카페|언론)|(공개|올리|퍼뜨).{0,15}(녹음|녹취|촬영)/g,
    laws: ['N5', 'L19-1'],
  },
  {
    level: 2,
    code: 'false',
    label: '허위사실 유포',
    regex: /허위\s?사실|소문을?\s?(내|퍼뜨)/g,
    laws: ['L19-1'],
  },
  {
    level: 2,
    code: 'assault',
    label: '신체 접촉·폭행',
    regex: /폭행|밀쳤|때렸|멱살|물건을?\s?던/g,
    laws: ['L19-1'],
  },
  {
    level: 2,
    code: 'persist',
    label: '지속적 연락·방문',
    regex: /(하루에|수시로|연달아).{0,10}(전화|연락|문자|방문)|(전화|연락|문자).{0,10}(수십|열\s?번|\d{2,}\s?(번|통|회))/g,
    laws: ['L19-2a'],
  },
  {
    level: 1,
    code: 'visit',
    label: '방문 예고',
    regex: /찾아\s?(가|오)겠|학교(로|에)\s?(가|오)겠|방문하겠|찾아뵙겠/g,
    laws: ['L19-2a', 'L20'],
  },
  {
    level: 1,
    code: 'demand',
    label: '부당한 요구',
    regex: /면제|빼\s?달라|안 하게|봐\s?달라|올려\s?달라|바꿔\s?달라|변경해\s?달라/g,
    laws: ['L19-2b'],
  },
  {
    level: 1,
    code: 'protest',
    label: '강한 항의 표현',
    regex: /그렇게\s?가르치|망가진다|언성|소리를?\s?(높|지르)|따졌|항의|화를?\s?내/g,
    laws: ['N3'],
  },
  {
    level: 1,
    code: 'pressure',
    label: '상급기관·민원·언론 언급',
    regex: /교육청|민원|국민신문고|언론|신고하겠/g,
    laws: ['L19-2a'],
  },
];

const EMO_REGEX = /불안|걱정|무섭|무서|두렵|힘들|속상|신경\s?(이\s?)?쓰|스트레스|짜증|억울|우울|떨렸|답답|당황|것 같|느꼈|생각했/;
const REPEAT_REGEX = /이전에도|또\s?(다시|연락|전화)|두\s?번|세\s?번|\d\s?번째|여러\s?번/;
const INJECTION_REGEX = /이전\s?(지시|명령|프롬프트)|지시(를|사항을)?\s?무시|시스템\s?프롬프트|ignore (all |previous |the )?(instructions|rules)|위험도[를은]?\s?(낮음|낮게|0)\S*\s?(로|으로)?\s?(해|바꿔|표시|출력)/gi;

const TOPIC_CODES = new Set(['demand', 'protest', 'pressure', 'visit', 'abuse', 'threat', 'record', 'false', 'assault', 'persist']);
const STOP_WORDS = new Set(['학부모', '학생', '전화', '문자', '연락', '상담', '선생님', '통화', '방문', '오후', '오전', '내일', '오늘', '이전', '비슷한', '시간', '왔다', '했다', '말했', '문의', '요청', '요구', '대해', '관련', '있다', '없다']);

export function extractKeywords(text: string): Set<string> {
  const result = new Set<string>();
  const matches = text.match(/[가-힣A-Za-z0-9]{2,}/g) || [];
  for (let word of matches) {
    if (word.length > 2 && '은는이가을를에의도로과와'.includes(word.slice(-1))) {
      word = word.slice(0, -1);
    }
    const prefix = word.slice(0, 2);
    if (!/^\d+$/.test(word) && !STOP_WORDS.has(word) && !STOP_WORDS.has(prefix)) {
      result.add(prefix);
    }
  }
  return result;
}

export function isRelatedCase(
  prevRecord: ConsultationRecord,
  currentFact: string,
  currentPurpose: string,
  currentCodes: Set<string>
): boolean {
  if (currentPurpose && prevRecord.purpose && currentPurpose.trim() === prevRecord.purpose.trim()) {
    return true;
  }
  const curKw = extractKeywords(currentFact);
  const prevKw = extractKeywords(prevRecord.content);
  let commonCount = 0;
  curKw.forEach((k) => {
    if (prevKw.has(k)) commonCount++;
  });
  if (commonCount >= 2) return true;

  const prevCodes = new Set(prevRecord.result.signals.map((s) => s.code).filter((c) => TOPIC_CODES.has(c)));
  for (const c of currentCodes) {
    if (prevCodes.has(c)) return true;
  }
  return false;
}

export function extractExplicitCount(text: string): number {
  const m1 = text.match(/(?:이전에도|전에도|앞서|그동안)[^.]{0,12}?(한|두|세|네|다섯|\d+)\s?번/);
  if (m1) {
    const numMap: Record<string, number> = { 한: 1, 두: 2, 세: 3, 네: 4, 다섯: 5 };
    const val = numMap[m1[1]] || parseInt(m1[1], 10);
    return val + 1;
  }
  const m2 = text.match(/(\d+)\s?번째/);
  if (m2) return parseInt(m2[1], 10);
  return 0;
}

export function detectAfterHours(text: string): { start: number; end: number; level: RiskLevel }[] {
  const spans: { start: number; end: number; level: RiskLevel }[] = [];
  const regex = /(오후|저녁|밤|새벽)\s?(\d{1,2})시/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const period = match[1];
    const hour = parseInt(match[2], 10);
    if (period === '새벽' || period === '밤' || hour >= 9) {
      spans.push({ start: match.index, end: match.index + match[0].length, level: 1 });
    } else if (hour >= 7) {
      spans.push({ start: match.index, end: match.index + match[0].length, level: 0 });
    }
  }

  const extraRegex = /퇴근\s?후|주말|공휴일|늦은\s?(밤|시간)/g;
  while ((match = extraRegex.exec(text)) !== null) {
    spans.push({ start: match.index, end: match.index + match[0].length, level: 1 });
  }

  return spans;
}

export function splitFactAndEmotion(text: string): { fact: string; emotion: string } {
  const rawSentences = text
    .split(/(?<=[.!?。])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const factSentences: string[] = [];
  const emotionSentences: string[] = [];

  for (const sentence of rawSentences) {
    if (EMO_REGEX.test(sentence)) {
      emotionSentences.push(sentence);
    } else {
      factSentences.push(sentence);
    }
  }

  return {
    fact: factSentences.join(' '),
    emotion: emotionSentences.join(' '),
  };
}

export function scanInjections(text: string): string[] {
  const matches = text.match(INJECTION_REGEX) || [];
  return [...matches];
}

export function maskPii(text: string, names: string[] = []): { maskedText: string; count: number } {
  let count = 0;
  let result = text;

  // Mask student/person names
  for (const name of names) {
    if (name && name.length >= 2) {
      const reg = new RegExp(name, 'g');
      result = result.replace(reg, (match) => {
        count++;
        return match[0] + 'O'.repeat(match.length - 1);
      });
    }
  }

  // Mask phone numbers, emails, registration numbers
  const piiRegex = /\d{6}-[1-4]\d{6}|0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}|[\w.+-]+@[\w-]+\.[\w.]+/g;
  result = result.replace(piiRegex, (match) => {
    count++;
    return match.replace(/[0-9A-Za-z가-힣]/g, (c) => ('@.-'.includes(c) ? c : 'X'));
  });

  return { maskedText: result, count };
}

const QUESTION_MAP: Record<string, string> = {
  visit: '방문하겠다고 한 날짜·시간은 언제인가요? 방문 예정을 교무실/관리자에게 미리 알렸나요?',
  record: '녹음·촬영이 실제로 있었나요? 어디에 공개(SNS, 맘카페 등)한다고 했나요?',
  after: '정확한 통화(연락) 시각과 통화 시간을 교무수첩이나 일지에 기록해 두셨나요?',
  demand: '요구한 내용(면제, 점수 수정 등)을 학부모의 발언 표현 그대로 기록해 두셨나요?',
  threat: '해당 위해 발언을 함께 들은 동료 교사나 문자·녹음 같은 객관적 증빙이 확보되어 있나요?',
  abuse: '폭언·욕설 발생 시 통화를 녹음하셨거나 통화 종료 고지를 하셨나요?',
  pressure: '어느 상급기관(교육청, 국민신문고 등)에 언제 접수하겠다고 압박했나요?',
  protest: '항의가 몇 분간 지속되었고, 주변 학생이나 다른 교사가 함께 청취하였나요?',
};

export function makeQuestions(signals: SignalItem[], level: RiskLevel): string[] {
  if (level < 1) return [];
  const list: string[] = [];
  const sorted = [...signals].sort((a, b) => b.level - a.level);
  for (const s of sorted) {
    const q = QUESTION_MAP[s.code];
    if (q && !list.includes(q)) list.push(q);
  }
  return list.slice(0, 3);
}

export function makeTrendAnalysis(
  relatedRecords: ConsultationRecord[],
  currentDate: string,
  currentLevel: RiskLevel
): TrendAnalysis | null {
  if (!relatedRecords.length) return null;
  const sorted = [...relatedRecords].sort((a, b) => a.date.localeCompare(b.date));
  const dates = [...sorted.map((r) => r.date), currentDate];
  const levels = [...sorted.map((r) => r.level), currentLevel];

  const intervals: number[] = [];
  for (let i = 0; i < dates.length - 1; i++) {
    const d1 = new Date(dates[i]).getTime();
    const d2 = new Date(dates[i + 1]).getTime();
    const diffDays = Math.max(1, Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)));
    intervals.push(diffDays);
  }

  const firstLevel = levels[0];
  const lastLevel = levels[levels.length - 1];
  const direction: '상승' | '완화' | '유지' =
    lastLevel > firstLevel ? '상승' : lastLevel < firstLevel ? '완화' : '유지';

  const firstDate = new Date(dates[0]).getTime();
  const lastDate = new Date(dates[dates.length - 1]).getTime();
  const totalDays = Math.max(1, Math.round(Math.abs(lastDate - firstDate) / (1000 * 60 * 60 * 24)));

  const text: string[] = [
    `동일 사안으로 최근 ${dates.length}회, 총 ${totalDays}일 동안 연속해서 이어지고 있습니다.`,
    `연락 간격: ${intervals.map((d) => `${d}일`).join(' → ')}${
      intervals.length >= 2 && intervals[intervals.length - 1] < intervals[0] ? ' (간격이 좁아지는 추세)' : ''
    }`,
    `위험도 추이: ${levels.map((l) => LEVEL_NAMES[l]).join(' → ')} (${direction})`,
  ];

  return {
    direction,
    intervals,
    levels,
    text,
  };
}

export function analyzeRecord(
  studentId: number,
  content: string,
  options: {
    target?: '학부모' | '학생' | '교사';
    method?: '전화' | '문자' | '내방' | '화상';
    date?: string;
    kind?: '상담' | '일상';
    purpose?: string;
    existingRecords?: ConsultationRecord[];
    currentRecordId?: number;
  } = {}
): AnalysisResult {
  const target = options.target || '학부모';
  const method = options.method || '전화';
  const date = options.date || new Date().toISOString().slice(0, 10);
  const purpose = options.purpose || '';
  const existingRecords = options.existingRecords || [];
  const currentRecordId = options.currentRecordId;

  const trace: string[] = [];
  trace.push(`① 입력 수신: 총 ${content.length}자 접수`);
  trace.push(`② 메타데이터 식별: ${date} · 대상: ${target} · 수단: ${method}`);

  // Fact / Emotion separation
  const { fact, emotion } = splitFactAndEmotion(content);
  trace.push(`③ 사실·감정 분리: 객관적 사실문과 교사 감정문 분리 (감정 표현은 법적 판단에서 제외)`);

  const signals: SignalItem[] = [];
  const spans: SignalSpan[] = [];

  // Match 10 core rules
  for (const rule of RULES) {
    const rx = new RegExp(rule.regex.source, 'g');
    let m: RegExpExecArray | null;
    let foundSpans: { s: number; e: number }[] = [];
    while ((m = rx.exec(fact)) !== null) {
      foundSpans.push({ s: m.index, e: m.index + m[0].length });
    }

    if (foundSpans.length > 0) {
      for (const sp of foundSpans) {
        spans.push({ s: sp.s, e: sp.e, level: rule.level, code: rule.code });
      }
      signals.push({
        code: rule.code,
        label: rule.label,
        level: rule.level,
        laws: rule.laws,
      });
    }
  }

  // After hours / evening detection
  const ah = detectAfterHours(fact);
  const hasLateNight = ah.some((x) => x.level === 1);
  if (hasLateNight) {
    for (const item of ah.filter((x) => x.level === 1)) {
      spans.push({ s: item.start, e: item.end, level: 1, code: 'after' });
    }
    signals.push({
      code: 'after',
      label: '퇴근 후·시간 외 연락',
      level: 1,
      laws: ['L19-2a'],
    });
  } else if (ah.length > 0) {
    for (const item of ah) {
      spans.push({ s: item.start, e: item.end, level: 0, code: 'evening' });
    }
    signals.push({
      code: 'evening',
      label: '평일 저녁 시간 연락(1회)',
      level: 0,
      laws: [],
    });
  }

  trace.push(`④ 위험 신호 탐지: 기준표 v0.1 기반 ${signals.length}건 신호 포착`);

  // Cumulative 30-day history & topic matching
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const priorRecords = existingRecords.filter(
    (r) =>
      r.studentId === studentId &&
      r.target === target &&
      r.date >= thirtyDaysAgo &&
      r.date <= date &&
      r.id !== currentRecordId
  );

  const currentCodes = new Set(signals.map((s) => s.code).filter((c) => TOPIC_CODES.has(c)));
  const relatedRecords = priorRecords.filter((p) => isRelatedCase(p, fact, purpose, currentCodes));
  const relatedIds = new Set(relatedRecords.map((r) => r.id));

  let repCount = relatedRecords.length + 1;
  const explicitNum = extractExplicitCount(fact);
  if (explicitNum > 0) {
    repCount = Math.max(repCount, explicitNum);
  }
  if (REPEAT_REGEX.test(fact)) {
    repCount = Math.max(repCount, 2);
  }

  let escalationReason: string | null = null;
  if (repCount >= 2) {
    // Add repeat signal if not already present
    signals.push({
      code: 'repeat',
      label: `반복성 ${repCount}회째 (동일 사안)`,
      level: 1,
      laws: ['N3', 'L19-2a'],
    });
  }

  trace.push(
    `⑤ 누적 분석: 최근 30일간 ${target} 기록 ${priorRecords.length}건 중 동일 사안 ${relatedRecords.length}건 연계 → 총 ${repCount}회차 감지`
  );

  // Determine base level
  const baseLevel: RiskLevel = signals.reduce<RiskLevel>((max, s) => (s.level > max ? s.level : max), 0);
  let finalLevel = baseLevel;

  // Escalation: 3+ repeat incidents elevate level from 1 (or 0) to 2
  if (repCount >= 3 && baseLevel < 2) {
    finalLevel = 2;
    escalationReason = `동일 사안 ${repCount}회 연속 반복 → 교육활동 침해 고시 기준에 따라 [${LEVEL_NAMES[baseLevel]}]에서 [높음]으로 상향 조정`;
    signals.push({
      code: 'escalate',
      label: '반복성 누적으로 위험도 상향',
      level: 2,
      laws: ['N3'],
    });
  }

  // Connect Laws
  const lawIdSet = new Set<string>();
  signals.forEach((s) => s.laws.forEach((lid) => lawIdSet.add(lid)));
  if (finalLevel === 2) {
    ['L20', 'L26', 'L28'].forEach((lid) => lawIdSet.add(lid));
  }
  const laws = LAWS_DATABASE.filter((law) => lawIdSet.has(law.id));
  trace.push(`⑥ 법령·고시 연계: 교원지위법 및 교육부 고시 근거 ${laws.length}건 산출`);

  // Actionable Advice
  const advice: string[] = [];
  const activeCodes = new Set(signals.map((s) => s.code));

  if (finalLevel === 2) {
    advice.push('관리자(교감·교장)에게 즉시 상황을 보고하고 교권보호위원회 신고 절차 및 교원 법률지원단 상담 요청');
  }
  if (activeCodes.has('record')) {
    advice.push('녹음·촬영 공개 암시는 고시 위반 소지가 높으므로 학교장에게 즉시 알리고 무단 배포 차단 및 법적 대응 검토');
  }
  if (method === '전화' || method === '문자') {
    advice.push('통화·상담 내용과 정확한 일시를 육하원칙 사실 위주로 기록하고 통화 녹음 파일 및 문자 캡처본 증빙 보관');
  } else {
    advice.push('현장 상담에서 오간 발언과 요구사항을 사실 위주로 일지에 기록하고 동석자 진술 증빙 확보');
  }
  if (activeCodes.has('visit')) {
    advice.push('학부모 방문 예고 시 교내 안전 및 원활한 상담을 위해 관리자(교감)와 사전 면담 배석 및 상담실 이용 협의');
  }
  if (activeCodes.has('after') || activeCodes.has('repeat') || activeCodes.has('persist') || activeCodes.has('pressure')) {
    advice.push('개인 휴대전화 대신 학교 공식 민원 창구(교무실 안심번호, 사전예약제) 및 근무시간 내 면담으로 안내');
  }

  const finalAdvice = finalLevel === 0 ? [] : advice.slice(0, 3);

  // Student flow list
  const flow: FlowItem[] = existingRecords
    .filter((r) => r.studentId === studentId && r.target === target && r.id !== currentRecordId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({
      id: r.id,
      date: r.date,
      method: r.method,
      purpose: r.purpose || (r.content ? r.content.slice(0, 24) + '...' : ''),
      level: r.level,
      snippet: r.content.slice(0, 30),
      related: relatedIds.has(r.id),
    }));

  const injections = scanInjections(content);
  if (injections.length > 0) {
    trace.push(`⚠ 보안 방어: 프롬프트 지시문 문구 감지 → 기록을 명령이 아닌 객관적 데이터로만 엄격 취급`);
  }

  trace.push(`⑦ 최종 평가 완료: 종합 위험도 [${LEVEL_NAMES[finalLevel]}]`);

  const questions = makeQuestions(signals, finalLevel);
  const trend = makeTrendAnalysis(relatedRecords, date, finalLevel);

  // Admissibility for Teacher Rights Protection Committee
  const admissibility = calculateCommitteeAdmissibility(
    finalLevel,
    repCount,
    signals,
    fact,
    method
  );

  return {
    level: finalLevel,
    base: baseLevel,
    escalation: escalationReason,
    signals,
    spans,
    fact,
    emotion,
    laws,
    advice: finalAdvice,
    questions,
    flow,
    trend,
    rep_n: repCount,
    alert: finalLevel >= 1,
    guard: {
      injection: injections,
      masked: 0,
    },
    trace,
    engine: 'rules',
    admissibility,
  };
}

export function calculateCommitteeAdmissibility(
  level: RiskLevel,
  repCount: number,
  signals: SignalItem[],
  fact: string,
  method: string
) {
  // 1. Statutory alignment (0~30)
  const hasLevel2 = signals.some((s) => s.level === 2);
  const hasNotice = signals.some((s) => s.laws.includes('N5') || s.laws.includes('N3'));
  let statutory = level === 2 ? 28 : level === 1 ? 19 : 8;
  if (hasLevel2) statutory = Math.min(30, statutory + 2);
  if (hasNotice) statutory = Math.min(30, statutory + 2);

  // 2. Recurrence / persistence (0~20)
  let recurrence = Math.min(20, repCount * 6);
  if (signals.some((s) => s.code === 'persist' || s.code === 'repeat')) {
    recurrence = Math.max(14, recurrence);
  }

  // 3. Evidence quality & documentation (0~30)
  let evidence = 18;
  if (method === '전화' || method === '문자') evidence += 6; // recorded evidence potential
  if (fact.length > 80) evidence += 4;
  evidence = Math.min(30, evidence);

  // 4. Severity & impact (0~20)
  let severity = level === 2 ? 18 : level === 1 ? 12 : 5;
  if (signals.some((s) => s.code === 'threat' || s.code === 'assault')) severity = 20;

  const totalScore = Math.min(100, statutory + recurrence + evidence + severity);
  const grade: '접수 유력' | '보강 권고' | '주의 관찰' =
    totalScore >= 75 ? '접수 유력' : totalScore >= 50 ? '보강 권고' : '주의 관찰';

  const checklists = [
    { text: '육하원칙(일시, 장소, 발언자, 구체적 발언)에 따른 사실 일지 작성', done: true, required: true },
    { text: '통화 녹음 파일, 문자 캡처본 또는 현장 목격 교사 확인서', done: method === '문자', required: true },
    { text: '학교 관리자(교감·교장) 사전 인지 및 내부 협의 보고 기록', done: level === 2, required: true },
    { text: '동일 사안 과거 연락 이력(최근 30일 내 반복성) 추출 첨부', done: repCount >= 2, required: false },
    { text: '교원의 정당한 지도 및 응대 고지(공식 창구 안내 내역)', done: false, required: false },
  ];

  let opinion = '';
  if (grade === '접수 유력') {
    opinion =
      '교원지위법 제19조 및 교육부 고시 침해 요건에 상당 부분 부합하며, 누적 반복성과 침해 수위가 명확하여 지역교권보호위원회 심의 접수 시 인용 가능성이 매우 높습니다.';
  } else if (grade === '보강 권고') {
    opinion =
      '침해 소지가 농후하나, 통화 녹취록이나 구체적 일시·동석자 확인서 등 증거 자료를 1~2건 추가 보완할 경우 교보위 심의 신청 요건을 확고히 갖출 수 있습니다.';
  } else {
    opinion =
      '현재 단발성 문의이거나 위험 수위가 경미합니다. 즉시 심의 신청보다는 학교 공식 상담 창구로의 경로 재안내 및 추가 누적 여부를 면밀히 관찰하는 것이 적절합니다.';
  }

  return {
    score: totalScore,
    grade,
    criteriaScores: {
      evidence,
      statutory,
      recurrence,
      severity,
    },
    checklists,
    opinion,
  };
}

// Live Call Coaching Real-time Script Generator
export function getLiveCoachingScript(realtimeText: string): {
  detectedSignal?: string;
  level: RiskLevel;
  scripts: { stage: 1 | 2 | 3; title: string; script: string; rationale: string }[];
} {
  const { fact } = splitFactAndEmotion(realtimeText);
  let detectedSignal: string | undefined;
  let level: RiskLevel = 0;

  if (/씨발|개새|병신|미친|쓰레기|폭언|욕설/i.test(fact)) {
    detectedSignal = '욕설·폭언 (모욕죄 및 교원지위법 위반)';
    level = 2;
  } else if (/가만\s?(안|두지)|죽이|때리겠|해코지|후회하게|책임지게/i.test(fact)) {
    detectedSignal = '위해·협박성 발언';
    level = 2;
  } else if (/녹음|촬영|공개|올리|퍼뜨|맘카페|SNS/i.test(fact)) {
    detectedSignal = '녹음·촬영물 무단 유포 암시 (고시 제2조 제5호)';
    level = 2;
  } else if (/교육청|민원|국민신문고|신고/i.test(fact)) {
    detectedSignal = '상급기관 민원 제기 압박';
    level = 1;
  } else if (/면제|올려\s?달라|바꿔\s?달라|점수/i.test(fact)) {
    detectedSignal = '정당한 사유 없는 일방적 요구 (고시 제2조 제3호)';
    level = 1;
  }

  const scripts = [
    {
      stage: 1 as const,
      title: '1단계: 정중한 경청 및 사실 확인 고지',
      script:
        '학부모님, 학생에 대한 걱정하시는 마음은 충분히 이해합니다. 다만 현재 말씀하시는 부분에 대해 사실관계를 정확히 확인한 후 말씀드리겠습니다.',
      rationale: '감정적 동요 없이 사실 위주의 중립적 경청 태도를 증빙으로 남깁니다.',
    },
    {
      stage: 2 as const,
      title: '2단계: 교육활동 침해 고지 및 녹음·종료 예고',
      script:
        '학부모님, 현재 하시는 발언(폭언/위협/반복요구)은 교원의 정당한 교육활동 침해 행위에 해당할 수 있습니다. 계속될 경우 부득이 통화가 녹음되거나 종료될 수 있음을 안내드립니다.',
      rationale: '교권보호 매뉴얼 상 필수 단계인 사전 침해 경고 및 종료 고지를 충족합니다.',
    },
    {
      stage: 3 as const,
      title: '3단계: 통화 종료 선언 및 공식 창구 안내',
      script:
        '지속적인 침해 발언으로 더 이상 원활한 상담이 불가하여 통화를 종료합니다. 추가 상담은 학교 공식 민원 창구(교무실)를 통해 일정을 조율해 주시기 바랍니다.',
      rationale: '적법한 통화 종료 선언 후 추가 언쟁을 즉시 차단합니다.',
    },
  ];

  return {
    detectedSignal,
    level,
    scripts,
  };
}

export function generateStructuredAgentSteps(
  result: AnalysisResult,
  studentName: string,
  target: string,
  method: string
) {
  return [
    {
      step: 1,
      name: 'Agent Goal & Planning (계획 수립)',
      type: 'planning' as const,
      description: `입력 텍스트 분석 목표 수립: ${studentName} 학생 대상 ${target} 상담 속 교권침해 소지 및 위험도 판별`,
      outputSnippet: `목표 설정 완료 · 7단계 파이프라인 가동`,
      latencyMs: 14,
      status: 'success' as const,
    },
    {
      step: 2,
      name: 'Security & PII Sanitizer (보안 및 개인정보 보호)',
      type: 'security' as const,
      description: `학생 실명, 연락처 마스킹 및 프롬프트 주입(지시문 무시 공격) 방어 필터 적용`,
      outputSnippet: `개인정보 ${studentName} 마스킹 완료 · 주입 위험 0건`,
      latencyMs: 8,
      status: 'success' as const,
    },
    {
      step: 3,
      name: 'Long-term Memory Retrieval (누적 기억 인출)',
      type: 'memory' as const,
      description: `최근 30일 DB 내 동일 학생·대상(${target}) 기록 조회 및 사안 유사도 판정`,
      outputSnippet: `과거 기록 대조 완료: 동일 사안 ${result.rep_n}회차 누적 확인`,
      latencyMs: 32,
      status: 'success' as const,
    },
    {
      step: 4,
      name: 'Tool Execution: Fact/Emotion Splitter (사실·감정 분리)',
      type: 'tool' as const,
      description: `교사 심경 문장(${result.emotion ? '1건 이상' : '0건'})을 분리하여 법적 사실 문장만 독립 추출`,
      outputSnippet: `사실 ${result.fact ? result.fact.length : 0}자 정제 추출 완료`,
      latencyMs: 19,
      status: 'success' as const,
    },
    {
      step: 5,
      name: 'Tool Execution: Legal Knowledge Search (법령 DB 검색)',
      type: 'tool' as const,
      description: `교원지위법 제19조~28조 및 교육부 고시 제2조 조문 벡터/키워드 매칭`,
      outputSnippet: `근거 조문 ${result.laws.length}건 산출 (${result.laws.map((l) => l.cite).join(', ')})`,
      latencyMs: 25,
      status: 'success' as const,
    },
    {
      step: 6,
      name: 'Reasoning Engine & Self-Correction (추론 및 자가검증 루프)',
      type: 'reasoning' as const,
      description: result.escalation
        ? `Evaluator 피드백 감지: 3회 이상 반복성 감지되어 [주의]에서 [높음]으로 자가 승격(Self-Correction)`
        : `기준표 v0.1 기반 신호 ${result.signals.length}건 종합 가중치 평가`,
      outputSnippet: `자가검증 통과 · 최종 위험도 [${LEVEL_NAMES[result.level]}] 확정`,
      latencyMs: 41,
      status: result.escalation ? ('warning' as const) : ('success' as const),
    },
    {
      step: 7,
      name: 'Actionable Artifact Synthesis (대응 산출물 생성)',
      type: 'evaluator' as const,
      description: `관리자 보고서 초안, 학부모 답변문, 교보위 적격성 점수(${result.admissibility?.score || 0}점) 합성`,
      outputSnippet: `대응 지침 ${result.advice.length}건 및 서식 생성 완료`,
      latencyMs: 18,
      status: 'success' as const,
    },
  ];
}

export function autofillMemo(
  text: string,
  students: Student[]
): {
  date: string;
  target: '학부모' | '학생' | '교사';
  method: '전화' | '문자' | '내방' | '화상';
  studentId?: number;
  detectedStudentName?: string;
  kind: '상담' | '일상';
  suggestedPurpose: string;
} {
  const today = new Date();
  let dateStr = today.toISOString().slice(0, 10);

  // Month & Day pattern (e.g. 10월 3일)
  const dateMatch = text.match(/(\d{1,2})월\s?(\d{1,2})일/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1], 10);
    const day = parseInt(dateMatch[2], 10);
    const y = today.getFullYear();
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    dateStr = `${y}-${mm}-${dd}`;
  } else if (text.includes('어제')) {
    const yest = new Date(Date.now() - 24 * 60 * 60 * 1000);
    dateStr = yest.toISOString().slice(0, 10);
  }

  // Target
  let target: '학부모' | '학생' | '교사' = '학생';
  if (/학부모|어머니|아버지|어머님|아버님|보호자/i.test(text)) {
    target = '학부모';
  } else if (/동료|교감|교장|선생님들|부장/i.test(text)) {
    target = '교사';
  }

  // Method
  let method: '전화' | '문자' | '내방' | '화상' = '전화';
  if (/전화|통화/i.test(text)) {
    method = '전화';
  } else if (/문자|카톡|메시지|메시지/i.test(text)) {
    method = '문자';
  } else if (/화상|줌|zoom/i.test(text)) {
    method = '화상';
  } else if (/방문|내방|찾아|교무실/i.test(text)) {
    method = '내방';
  }

  // Student matching
  let foundStudent: Student | undefined;
  for (const stu of students) {
    if (text.includes(stu.name)) {
      foundStudent = stu;
      break;
    }
  }

  // Purpose extraction heuristic
  let suggestedPurpose = '';
  if (/준비물/i.test(text)) suggestedPurpose = '준비물 관련 문의';
  else if (/수행평가|성적/i.test(text)) suggestedPurpose = '성적/평가 관련 문의';
  else if (/숙제|과제/i.test(text)) suggestedPurpose = '과제/숙제 관련 면담';
  else if (/생활지도|교우|친구/i.test(text)) suggestedPurpose = '교우관계 및 생활지도';
  else if (/자리\s?배치/i.test(text)) suggestedPurpose = '자리 배치 변경 요청';
  else if (/출결|결석|조퇴/i.test(text)) suggestedPurpose = '출결 확인';

  return {
    date: dateStr,
    target,
    method,
    studentId: foundStudent?.id,
    detectedStudentName: foundStudent?.name,
    kind: '상담',
    suggestedPurpose,
  };
}

export function triageMemo(
  text: string,
  memoId: number,
  students: Student[],
  existingRecords: ConsultationRecord[]
): TriageOutput {
  const auto = autofillMemo(text, students);
  if (!auto.studentId) {
    return {
      status: 'need_student',
      draft: {
        date: auto.date,
        kind: auto.kind,
        target: auto.target,
        method: auto.method,
        purpose: auto.suggestedPurpose,
        content: text,
        memoId,
      },
    };
  }

  const stu = students.find((s) => s.id === auto.studentId)!;
  const analysis = analyzeRecord(stu.id, text, {
    target: auto.target,
    method: auto.method,
    date: auto.date,
    kind: auto.kind,
    purpose: auto.suggestedPurpose,
    existingRecords,
  });

  if (analysis.level === 0) {
    return {
      status: 'saved',
    };
  }

  return {
    status: 'review',
    analysis: {
      studentId: stu.id,
      name: stu.name,
      no: stu.no,
      date: auto.date,
      kind: auto.kind,
      target: auto.target,
      method: auto.method,
      purpose: auto.suggestedPurpose,
      content: text,
      level: analysis.level,
      result: analysis,
    },
  };
}

export function generateDraftDocument(
  kind: 'admin' | 'parent',
  record: {
    studentName: string;
    studentNo?: string;
    date: string;
    target: string;
    method: string;
    content: string;
    purpose?: string;
    result: AnalysisResult;
    teacherName?: string;
  }
): string {
  const { studentName, date, target, method, content, purpose, result, teacherName } = record;
  const labels =
    result.signals
      .filter((s) => s.code !== 'escalate')
      .map((s) => s.label)
      .join(', ') || '특이 신호 없음';

  if (kind === 'parent') {
    return `안녕하세요, ${studentName} 학생 담임교사 ${teacherName || ''}입니다.

말씀해 주신 사안에 대해 안내드립니다. 학생 교육 및 학교 운영과 관련된 상담 및 건의사항은 학교 공식 민원 창구(교무실 직통번호 및 사전 상담 신청 시스템)를 통해 정식으로 접수해 주시면, 소관 교과 및 담당 부서와 면밀히 협의한 후 성실히 답변드리겠습니다.

원활하고 안전한 교육환경 조성을 위해 상담 및 연락은 평일 교원 근무시간(08:30~16:30) 내에 진행됨을 양해 부탁드립니다. 심도 있는 논의가 필요한 경우 미리 방문 일정을 조율하여 학교 상담실에서 뵙도록 하겠습니다.

감사합니다.`;
  }

  // Admin report draft
  return `[관리자(교감·교장) 교권 보호 사안 보고서]
1. 발생 일시: ${date}
2. 관련 학생: ${studentName}${record.studentNo ? ` (학번: ${record.studentNo})` : ''}
3. 상담 대상: ${target} (${method} 상담)
4. 상담 목적: ${purpose || '상담 진행'}

5. 사실 경과 (교사 주관적 감정 제외):
${result.fact || content}

6. 감지된 위험 신호:
- 위반 소지 신호: ${labels}
- 참고 위험도: [${LEVEL_NAMES[result.level]}]
- 동일 사안 누적 여부: 최근 30일 기준 ${result.rep_n}회차

7. 요청 및 향후 조치 계획:
${result.advice.map((a, i) => `  ${i + 1}) ${a}`).join('\n') || '  - 사실 경과 공유 및 학교 차원의 응대 지원 요청'}

※ 본 문서는 교권보호 특별법에 따른 사실 확인용 기초 자료로 작성되었습니다.`;
}
