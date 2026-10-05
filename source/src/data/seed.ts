import { ConsultationRecord, Memo, Student } from '../types';
import { analyzeRecord } from '../utils/engine';

export const INITIAL_STUDENTS: Student[] = [
  { id: 1, name: '김철수', cls: '1-3', no: '10301' },
  { id: 2, name: '박영희', cls: '1-3', no: '10302' },
  { id: 3, name: '이민수', cls: '1-3', no: '10303' },
  { id: 4, name: '정수연', cls: '1-3', no: '10304' },
  { id: 5, name: '한지호', cls: '1-3', no: '10305' },
  { id: 6, name: '최미아', cls: '1-3', no: '10306' },
  { id: 7, name: '강하늘', cls: '1-3', no: '10307' },
];

export function generateSeedData(): {
  students: Student[];
  records: ConsultationRecord[];
  memos: Memo[];
  teacherName: string;
} {
  const students = [...INITIAL_STUDENTS];

  // Helper to format ISO date
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const daysAgo = (d: number) => {
    const target = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    return target.toISOString().slice(0, 10);
  };

  const rawSeedRecords: {
    id: number;
    studentId: number;
    date: string;
    kind: '상담' | '일상';
    target: '학부모' | '학생' | '교사';
    method: '전화' | '문자' | '내방' | '화상';
    purpose: string;
    content: string;
    done: number[];
  }[] = [
    {
      id: 1,
      studentId: 1,
      date: daysAgo(21),
      kind: '상담',
      target: '학부모',
      method: '문자',
      purpose: '준비물 문의',
      content: '오후 3시 준비물(색연필) 관련 문자가 왔다. 종류를 문의해서 답장했다.',
      done: [],
    },
    {
      id: 2,
      studentId: 1,
      date: daysAgo(7),
      kind: '상담',
      target: '학부모',
      method: '내방',
      purpose: '성적 이의 제기',
      content:
        '학부모가 성적 이의 제기를 위해 방문했다. 수행평가 점수를 올려 달라고 요청했다. 기준표로 설명했으나 언성을 높이며 항의했다. 갑자기 화를 내서 당황스러웠다.',
      done: [0],
    },
    {
      id: 3,
      studentId: 1,
      date: daysAgo(2),
      kind: '상담',
      target: '학부모',
      method: '전화',
      purpose: '숙제 면제 요구',
      content:
        '오후 9시 20분경 학부모에게 전화가 왔다. 숙제 양이 너무 많다며 아이 숙제를 면제해 달라고 요구했다. 거절하자 "선생님이 그렇게 가르치니 아이가 망가진다"고 말하며 언성을 높였다. 이전에도 비슷한 시간에 두 번 연락이 왔다. 통화는 약 15분 이어졌고, 내일 학교에 찾아오겠다고 했다. 갑자기 찾아오겠다는 말에 불안했다. 거절하기가 어려웠고 퇴근 후에도 계속 신경이 쓰인다.',
      done: [],
    },
    {
      id: 4,
      studentId: 2,
      date: daysAgo(3),
      kind: '상담',
      target: '학부모',
      method: '전화',
      purpose: '수행평가 일정 문의',
      content: '오후 8시에 학부모 전화가 왔다. 다음 주 수행평가 일정을 문의해서 세부 일정을 안내했다.',
      done: [],
    },
    {
      id: 5,
      studentId: 3,
      date: daysAgo(4),
      kind: '상담',
      target: '학생',
      method: '내방',
      purpose: '진로 상담',
      content: '학생이 진로 및 학업 고민으로 방과 후 찾아와 20분간 편안하게 면담을 진행했다.',
      done: [],
    },
    {
      id: 6,
      studentId: 4,
      date: daysAgo(1),
      kind: '상담',
      target: '학부모',
      method: '전화',
      purpose: '생활지도 항의',
      content:
        '학부모가 전화로 생활지도에 강하게 항의했다. 이 사안을 교육청에 정식 민원으로 넣겠다고 했고 "가만 안 두겠다"고 위협적인 어조로 말했다. 너무 떨리고 충격이었다.',
      done: [],
    },
    {
      id: 7,
      studentId: 5,
      date: daysAgo(15),
      kind: '일상',
      target: '학생',
      method: '내방',
      purpose: '준비물 확인',
      content: '학생이 미술 시간 준비물 지참 여부를 문의하러 교무실에 방문했다.',
      done: [],
    },
    {
      id: 8,
      studentId: 6,
      date: daysAgo(2),
      kind: '상담',
      target: '학부모',
      method: '문자',
      purpose: '자리 배치 변경 요청',
      content: '저녁 7시 반에 아이 시력이 안 좋다며 자리 배치를 앞줄로 바꿔 달라는 문자가 왔다. 사유를 확인했다.',
      done: [],
    },
  ];

  // Process raw records with analysis engine
  const records: ConsultationRecord[] = [];
  for (const raw of rawSeedRecords) {
    const stu = students.find((s) => s.id === raw.studentId)!;
    const existingSoFar = records.filter((r) => r.studentId === raw.studentId);
    const analysis = analyzeRecord(stu.id, raw.content, {
      target: raw.target,
      method: raw.method,
      date: raw.date,
      kind: raw.kind,
      purpose: raw.purpose,
      existingRecords: existingSoFar,
      currentRecordId: raw.id,
    });

    records.push({
      ...raw,
      name: stu.name,
      studentNo: stu.no,
      studentCls: stu.cls,
      level: analysis.level,
      result: analysis,
      version: 1,
    });
  }

  // Realistic memos for today!
  const memos: Memo[] = [
    {
      id: 101,
      text: '오늘 2교시 쉬는 시간에 한지호 학생이 독후감 숙제 제출 기한을 연장해달라고 찾아옴. 사유가 타당하여 내일까지로 조정해줌.',
      created: `${todayStr}T09:40:00`,
      date: todayStr,
      converted: false,
      detectedStudentId: 5,
      detectedStudentName: '한지호',
      detectedTarget: '학생',
      detectedMethod: '내방',
      isAudio: false,
    },
    {
      id: 102,
      text: '점심시간에 1학년 3반 김철수 학부모가 전화로 내일 오후에 학교로 직접 찾아오겠다고 재차 통보함. 목소리가 다소 격앙되어 있었음.',
      created: `${todayStr}T12:35:00`,
      date: todayStr,
      converted: false,
      detectedStudentId: 1,
      detectedStudentName: '김철수',
      detectedTarget: '학부모',
      detectedMethod: '전화',
      isAudio: true,
    },
    {
      id: 103,
      text: '방과후 박영희 학생 교우관계 상담 진행. 최근 모둠 활동에서 소외감을 느낀다고 하여 조 편성을 배려해주기로 함.',
      created: `${todayStr}T15:10:00`,
      date: todayStr,
      converted: true,
      recordId: 4,
      detectedStudentId: 2,
      detectedStudentName: '박영희',
      detectedTarget: '학생',
      detectedMethod: '내방',
      isAudio: false,
    },
  ];

  return {
    students,
    records,
    memos,
    teacherName: '김선생',
  };
}
