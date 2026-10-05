import { ConsultationRecord, Memo, Student } from '../types';
import { generateSeedData } from '../data/seed';

const STORAGE_KEYS = {
  STUDENTS: 'chram_students_v1',
  RECORDS: 'chram_records_v1',
  MEMOS: 'chram_memos_v1',
  TEACHER: 'chram_teacher_name_v1',
  SEEDED: 'chram_seeded_v1',
  FEEDBACK: 'chram_feedback_v1',
};

export interface AppState {
  students: Student[];
  records: ConsultationRecord[];
  memos: Memo[];
  teacherName: string;
}

export function loadAppState(): AppState {
  if (typeof window === 'undefined') {
    return generateSeedData();
  }

  const isSeeded = localStorage.getItem(STORAGE_KEYS.SEEDED);
  if (!isSeeded) {
    const seed = generateSeedData();
    saveAppState(seed);
    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
    return seed;
  }

  try {
    const studentsStr = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    const recordsStr = localStorage.getItem(STORAGE_KEYS.RECORDS);
    const memosStr = localStorage.getItem(STORAGE_KEYS.MEMOS);
    const teacherName = localStorage.getItem(STORAGE_KEYS.TEACHER) || '김선생';

    const students: Student[] = studentsStr ? JSON.parse(studentsStr) : [];
    const records: ConsultationRecord[] = recordsStr ? JSON.parse(recordsStr) : [];
    const memos: Memo[] = memosStr ? JSON.parse(memosStr) : [];

    return {
      students,
      records,
      memos,
      teacherName,
    };
  } catch (err) {
    console.error('Failed to load storage state', err);
    return generateSeedData();
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(state.students));
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(state.records));
    localStorage.setItem(STORAGE_KEYS.MEMOS, JSON.stringify(state.memos));
    localStorage.setItem(STORAGE_KEYS.TEACHER, state.teacherName);
  } catch (err) {
    console.error('Failed to save storage state', err);
  }
}

export function resetToDemo(): AppState {
  const seed = generateSeedData();
  saveAppState(seed);
  return seed;
}

export function clearAllData(): AppState {
  const empty: AppState = {
    students: [],
    records: [],
    memos: [],
    teacherName: '',
  };
  saveAppState(empty);
  return empty;
}
