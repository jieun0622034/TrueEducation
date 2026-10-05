import { buildHeuristicCallReply, buildLocalScenario } from './localAgent';

/**
 * 에이전트 API 호출 래퍼.
 *
 * - 기본(GitHub Pages 등 정적 배포): 서버 없이 브라우저 안의 규칙 기반 에이전트로 응답합니다.
 *   → API 키가 필요 없고, 키가 노출될 일도 없습니다.
 * - 선택: 빌드 시 VITE_API_BASE 를 지정하면(예: https://내서버주소) 그 서버의
 *   /api/gemini/* 엔드포인트(server.ts)를 먼저 호출하고, 실패하면 브라우저 로직으로 대체합니다.
 */
const API_BASE: string = ((import.meta as any).env?.VITE_API_BASE || '').replace(/\/$/, '');

function localResponse(path: string, body: any): Response {
  let data: any;
  if (path.endsWith('/call-simulate')) {
    const history = Array.isArray(body?.conversationHistory) ? body.conversationHistory : [];
    const role = ['parent', 'teacher', 'student', 'friend'].includes(body?.speakerRole)
      ? body.speakerRole
      : 'parent';
    const studentName =
      typeof body?.studentName === 'string' && body.studentName.trim() ? body.studentName.trim() : '김철수';
    data = {
      ...buildHeuristicCallReply(typeof body?.teacherInput === 'string' ? body.teacherInput : '', history, role, studentName),
      source: 'heuristic',
    };
  } else if (path.endsWith('/generate-scenario')) {
    data = { scenario: buildLocalScenario(body), source: 'heuristic' };
  } else {
    return new Response('{}', { status: 404 });
  }
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function agentFetch(path: string, init: RequestInit): Promise<Response> {
  let body: any = {};
  try {
    body = init.body ? JSON.parse(String(init.body)) : {};
  } catch {
    body = {};
  }
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}${path}`, init);
      if (res.ok) return res;
    } catch {
      /* 서버가 없으면 아래 로컬 에이전트로 대체 */
    }
  }
  return localResponse(path, body);
}
