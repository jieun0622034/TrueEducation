import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

// Initialize Google GenAI client if GEMINI_API_KEY is available
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

function buildHeuristicCallReply(
  teacherInput: string,
  conversationHistory: any[],
  speakerRole = 'parent',
  studentName = '김철수',
) {
  const turnIndex = Math.max(
    0,
    conversationHistory.filter((message) => message?.sender === 'teacher').length - 1,
  );
  const usesFormalProcess = /공식|절차|규정|기준|교무실|서면|면담|관리자|교감|일정/.test(
    teacherInput,
  );
  const showsEmpathy = /이해|공감|죄송|유감|걱정|확인해|살펴보|도와/.test(teacherInput);
  const pushesBack = /아니|그건|말도 안|어쩌|그만|왜|불가능|안 됩니다|못|틀렸|책임|요구/.test(
    teacherInput,
  );
  const givenName = studentName.length > 2 ? studentName.slice(1) : studentName;
  const lastCharCode = givenName.charCodeAt(givenName.length - 1) - 0xac00;
  const hasFinalConsonant = lastCharCode >= 0 && lastCharCode <= 11171 && lastCharCode % 28 !== 0;
  const subjectName = `${givenName}${hasFinalConsonant ? '이가' : '가'}`;
  const roleReplies: Record<string, string[]> = {
    teacher: [
      `선생님, ${studentName} 학생이 말씀한 부분을 기준표와 기록에 비춰 함께 확인해 보시죠. 억울하다고 느낀 지점도 조금 더 살펴보면 좋겠습니다.`,
      `선생님, ${studentName} 학생 입장도 확인하고 적용 기준과 사실관계를 차분히 정리해 보겠습니다.`,
      `선생님, 바로 결론을 내리기보다 ${studentName} 학생 관련 내용을 먼저 확인한 뒤 필요한 절차를 함께 안내하면 좋겠습니다.`,
    ],
    student: [
      '제가 말한 상황을 먼저 확인해 주셨으면 좋겠어요. 어떤 기준으로 판단하셨는지도 알고 싶어요.',
      '저는 아직 납득이 잘 안 돼요. 제 입장도 기록에 남기고 다시 설명해 주실 수 있나요?',
      '제가 원하는 건 무조건 바꿔 달라는 게 아니라, 왜 그렇게 됐는지 정확히 듣는 거예요.',
    ],
    friend: [
      `철수가 그 일 때문에 계속 속상해해요. 철수 얘기도 한번 직접 들어봐 주시면 안 될까요?`,
      `제가 옆에서 봤을 때도 철수가 많이 힘들어했어요. 있었던 일을 다시 확인해 주셨으면 해요.`,
      `철수가 혼자 말하기 어려워해서 제가 먼저 말씀드리는 거예요. 철수 입장도 꼭 들어주세요.`,
    ],
  };
  const parentReplies = usesFormalProcess
    ? [
        `공식 절차로 확인하겠다는 말씀이시죠. 저희 ${givenName}가 겪은 일과 학교의 확인 결과를 빠짐없이 알려주세요.`,
        `상담 일정을 잡는 건 알겠습니다. 저희 ${givenName}가 어떤 일을 겪었는지 구체적으로 확인해 주세요.`,
      ]
    : showsEmpathy
      ? [
          `제 걱정을 알아주셔서 감사해요. 저희 ${givenName} 상황을 확인하신 뒤 다시 설명해 주세요.`,
          `저희 ${givenName} 이야기도 차분히 들어주신다니 다행이에요. 확인 결과를 기다리겠습니다.`,
        ]
      : pushesBack
        ? [
            `아니, 제 말을 다르게 받아들이신 것 같아요. 제가 문제 삼는 건 저희 ${givenName}에게 있었던 일입니다.`,
            `그렇게만 답하시면 답답하죠. 저희 ${givenName} 상황을 어떻게 확인하실 건지 구체적으로 말씀해 주세요.`,
            `선생님 입장만 말씀하지 마시고 저희 ${givenName} 이야기부터 제대로 확인해 주세요.`,
          ]
        : [
            `저희 ${givenName}에게 있었던 일을 학교에서 어떻게 확인하실 건가요? 일정과 절차를 알려주세요.`,
            `저희 ${givenName}가 불이익을 받지 않도록 어떤 조치를 하실 수 있는지 듣고 싶어요.`,
            `제가 말씀드린 내용을 제대로 이해하셨는지 확인하고 싶어요. 저희 ${givenName} 상황을 다시 정리해 주세요.`,
          ];

  const replyOptions = usesFormalProcess
    ? [
        '정식 절차로 확인하겠다는 말씀이시죠. 그럼 제가 요청한 내용과 학교의 확인 결과를 서면으로 받아보고 싶습니다.',
        '교무실에서 상담하는 건 알겠습니다. 방문 전에 가능한 시간을 정하고, 오늘 말씀드린 사안도 빠짐없이 확인해 주세요.',
        '기준에 따라 처리하신다면 그 기준이 무엇인지 구체적으로 설명해 주세요. 확인한 내용도 기록으로 남겨주시기 바랍니다.',
        '일정을 잡아 상담하겠습니다. 다만 제 아이 입장에서 어떤 조치가 가능한지 담당자와 함께 이야기하고 싶습니다.',
      ]
    : showsEmpathy
      ? [
          '제 걱정을 알아주시는 건 알겠습니다. 아이가 학교에서 어떻게 지내는지 확인한 뒤 다시 이야기 나눠요.',
          '들어주셔서 감사합니다. 제가 감정적으로 말한 부분은 일단 접어두고, 아이 상황부터 차근차근 확인하고 싶어요.',
          '선생님 말씀처럼 사실관계를 먼저 확인해 보죠. 다만 아이에게 어떤 일이 있었는지는 꼭 자세히 알려주세요.',
          '아이를 걱정하는 마음이 앞섰던 것 같습니다. 학교에서 확인하신 내용을 안내해 주시면 그다음에 상의하겠습니다.',
        ]
      : pushesBack
        ? [
            '아니, 제 말을 다르게 받아들이신 것 같은데요. 제가 문제 삼는 건 아이에게 있었던 일에 대한 설명입니다.',
            '그렇게만 답하시면 답답합니다. 왜 그런 판단을 하셨는지 구체적인 근거를 듣고 싶어요.',
            '제 요청을 바로 어렵다고만 하지 마시고, 가능한 대안이 있는지 먼저 확인해 주세요.',
            '선생님 입장만 말씀하시는 것처럼 들립니다. 아이와 저희가 겪은 상황도 함께 살펴봐 주셨으면 합니다.',
          ]
        : [
            '제가 말씀드린 상황을 학교에서는 어떻게 확인하실 건가요? 확인 절차와 예상 일정을 알려주세요.',
            '아이에게 불이익이 생기지 않도록 어떤 조치를 하실 수 있는지 구체적으로 듣고 싶습니다.',
            '지금 바로 결론을 내리기 어렵다면, 언제 어떤 방식으로 답변을 받을 수 있는지 알려주세요.',
            '제가 전달한 내용을 정확히 이해하셨는지 확인하고 싶습니다. 학교에서 확인할 항목을 정리해 주시겠어요?',
          ];
  const scriptOptions = usesFormalProcess
    ? [
        '요청하신 내용을 기록하고, 확인 가능한 사실과 적용 기준을 정리해 공식 상담에서 안내드리겠습니다.',
        '방문 상담은 관리자와 일정을 조율해 진행하고, 확인 결과는 학교의 정식 절차에 따라 전달드리겠습니다.',
      ]
    : showsEmpathy
      ? [
          '걱정되시는 점은 이해합니다. 우선 학생과 관련 교원을 통해 사실관계를 확인한 뒤 안내드리겠습니다.',
          '염려하시는 부분을 빠짐없이 기록하겠습니다. 확인이 필요한 내용과 답변 일정을 정리해 다시 연락드리겠습니다.',
        ]
      : [
          '말씀하신 내용은 기록해 두고, 확인된 사실과 학교의 처리 기준을 바탕으로 차분히 안내드리겠습니다.',
          '서로 정확히 확인할 수 있도록 사안을 항목별로 정리하고, 필요한 경우 관리자와 함께 공식 상담을 진행하겠습니다.',
        ];

  const parentReply = speakerRole === 'parent'
    ? parentReplies[turnIndex % parentReplies.length]
    : (roleReplies[speakerRole] || roleReplies.parent)[turnIndex % (roleReplies[speakerRole] || roleReplies.parent).length];
  return {
    parentReply,
    copilot: {
      detectedThreat: /교육청|맘카페|고소|신고|유포|찾아가/.test(parentReply)
        ? '상급기관 민원 제기 또는 압박성 표현'
        : undefined,
      suggestedScript: scriptOptions[turnIndex % scriptOptions.length],
      legalNotice: '교원지위법 제19조 (교육활동 보호)',
    },
  };
}

// Endpoint 1: Interactive Real-Time Call Turn Simulator
app.post('/api/gemini/call-simulate', async (req, res) => {
  const { scenario, teacherInput, conversationHistory = [] } = req.body;
  const speakerRole = ['parent', 'teacher', 'student', 'friend'].includes(req.body.speakerRole)
    ? req.body.speakerRole
    : 'parent';
  const studentName = typeof req.body.studentName === 'string' && req.body.studentName.trim()
    ? req.body.studentName.trim()
    : '김철수';
  const studentGivenName = studentName.length > 2 ? studentName.slice(1) : studentName;
  const roleName = speakerRole === 'parent'
    ? '학부모'
    : speakerRole === 'teacher'
      ? '선생님'
      : speakerRole === 'student'
        ? '학생 본인'
        : '학생의 친구';
  const history = Array.isArray(conversationHistory) ? conversationHistory : [];
  const teacherText = typeof teacherInput === 'string' ? teacherInput : '';

  if (!ai) {
    const fallback = buildHeuristicCallReply(teacherText, history, speakerRole, studentName);
    return res.json({
      ...fallback,
      source: 'heuristic',
    });
  }

  try {
    const prompt = `당신은 학교 상담 역할극에서 '${roleName}' 역할을 맡은 사람입니다. 끝까지 지정된 역할의 관점과 말투로 답하세요.
상황 시나리오: ${scenario || '학생 성적 및 생활지도 항의'}
  대상 학생 이름: ${studentName}
최근 대화 내역:
  ${history.map((m: any) => `${m.sender === 'teacher' ? '상대방(교사)' : roleName}: ${m.text}`).join('\n')}
  상대방의 최근 발언: "${teacherText}"

요청 사항:
  1. ${roleName} 입장에서 현실감 있는 다음 한마디(1~2문장)를 답변하세요. 화자가 학부모면 '저희 ${studentGivenName}가'처럼 가족 호칭을, 선생님이면 '${studentName} 학생'을, 학생이면 '제가/저는'을, 친구면 학생 이름만 자연스럽게 사용하세요.
  2. 학부모 역할은 교사의 공식 절차 안내에 따라 감정이 누그러지거나 거부에 따라 격앙될 수 있습니다. 다른 역할도 시나리오와 자신의 관점에 일관되게 반응하세요.
  3. 교사의 Copilot을 위한 침해 신호 분석 및 추천 답변(1문장)도 함께 제공하세요.
  4. 시나리오의 추가 요청은 말투와 상황에 자연스럽게 녹이되, 요청 자체를 설명하거나 그대로 되풀이하지 마세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "parentReply": "지정 역할 화자의 실제 대화 답변 (1~2문장)",
  "detectedThreat": "감지된 침해 신호 요약 또는 없음",
  "suggestedScript": "교사가 지금 읽어야 할 가장 적절한 표준 방어 대본 (1문장)",
  "legalNotice": "관련 교원지위법 또는 교육부 고시 근거"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      parentReply: parsed.parentReply || buildHeuristicCallReply(teacherText, history, speakerRole, studentName).parentReply,
      source: 'gemini',
      copilot: {
        detectedThreat: parsed.detectedThreat,
        suggestedScript: parsed.suggestedScript,
        legalNotice: parsed.legalNotice,
      },
    });
  } catch (err: any) {
    console.error('Call simulate error:', err);
    const fallback = buildHeuristicCallReply(teacherText, history, speakerRole, studentName);
    return res.json({
      ...fallback,
      source: 'fallback',
    });
  }
});

// Endpoint 2: Scenario Architect Agent (새로운 맞춤형 모의 상담 시나리오 생성)
app.post('/api/gemini/generate-scenario', async (req, res) => {
  const { studentName, gradeLevel, callerRole, issueCategory, customPrompt, difficulty } = req.body;
  const name = typeof studentName === 'string' && studentName.trim() ? studentName.trim() : '김철수';
  const role = ['parent', 'teacher', 'student', 'friend'].includes(callerRole) ? callerRole : 'parent';
  const category = typeof issueCategory === 'string' && issueCategory.trim()
    ? issueCategory.trim()
    : '수행평가 성적 이의 및 폭언';
  const extraContext = typeof customPrompt === 'string' ? customPrompt.trim() : '';
  const givenName = name.length > 2 ? name.slice(1) : name;
  const lastCharCode = givenName.charCodeAt(givenName.length - 1) - 0xac00;
  const hasFinalConsonant = lastCharCode >= 0 && lastCharCode <= 11171 && lastCharCode % 28 !== 0;
  const subjectName = `${givenName}${hasFinalConsonant ? '이가' : '가'}`;
  const roleName = role === 'parent'
    ? '학부모'
    : role === 'teacher'
      ? '선생님'
      : role === 'student'
        ? '학생 본인'
        : '학생의 친구';
  const scenarioSubject = role === 'parent'
    ? `${name} 학생 학부모`
    : role === 'teacher'
      ? `${name} 학생의 선생님`
      : role === 'student'
        ? `${name} 학생`
        : `${name} 학생의 친구`;
  const isVisit = /방문|찾아오|교무실|내방/.test(category);
  const isScore = /성적|수행평가|점수|채점/.test(category);
  const isViolence = /학교폭력|학폭|가해|피해/.test(category);
  const isOnline = /맘카페|유포|녹음|촬영|민원|교육청|고소/.test(category);
  const isAfterHours = /야간|밤|퇴근|시간 외|늦은/.test(category);
  const isGuidance = /생활지도|훈육|지도|숙제|준비물/.test(category);
  const intensity = /최고|고위험|위해|폭언|난동/.test(String(difficulty || ''));

  let initialUtterance: string;
  let persona: string;
  let expectedKeywords: string[];
  let rubricTips: string;

  if (isScore) {
    initialUtterance = role === 'parent'
      ? `선생님, 저희 ${givenName}가 이번 수행평가 점수 때문에 너무 속상해해요. 채점 기준이 납득되지 않으니 다시 확인해 주세요.${intensity ? ' 이대로 넘어가지 않고 정식으로 문제 제기하겠습니다.' : ''}`
      : role === 'teacher'
        ? `선생님, ${name} 학생의 수행평가 점수에 이의가 있다고 합니다. 채점 기준과 학생이 억울해하는 부분을 함께 확인해 보면 좋겠습니다.`
        : role === 'student'
          ? '선생님, 제가 이번 수행평가에서 받은 점수가 납득되지 않아요. 채점 기준을 다시 확인해 주실 수 있나요?'
          : `선생님, ${subjectName} 이번 수행평가 점수 때문에 많이 속상해해요. 채점 기준을 다시 확인해 주실 수 있을까요?`;
    persona = role === 'parent'
      ? '평가 결과에 강한 불만을 느끼며 재채점과 빠른 답변을 요구하는 학부모'
      : role === 'teacher'
        ? '채점 기준을 설명하고 학생의 이의 제기를 차분히 확인하는 교사'
        : role === 'student'
          ? '자신의 수행평가 점수와 채점 기준에 이의를 제기하는 학생'
          : '친구의 평가 결과가 부당하다고 느껴 대신 걱정을 전하는 학생';
    expectedKeywords = ['채점 기준', '재확인', '이의 신청'];
    rubricTips = '평가관리규정과 공식 이의신청 절차를 안내하고, 채점 근거와 상담 내용을 기록할 것';
  } else if (isViolence) {
    initialUtterance = role === 'parent'
      ? `선생님, 저희 ${givenName}가 학교폭력 가해 학생으로 지목됐다는 말을 들었습니다. 무슨 근거인지 설명해 주세요.${intensity ? ' 아이에게 불이익이 생기면 정식으로 문제를 제기하겠습니다.' : ''}`
      : role === 'teacher'
        ? `선생님, ${name} 학생 관련 학교폭력 사안에서 확인이 필요한 내용이 있습니다. 사실관계와 처리 절차를 함께 살펴보면 좋겠습니다.`
        : role === 'student'
          ? '선생님, 제가 학교폭력 가해자로 지목됐다는 말을 들었어요. 무슨 일인지 설명을 듣고 제 이야기도 하고 싶어요.'
          : `선생님, ${subjectName} 학교폭력 가해자로 지목됐다고 들었어요. 제가 아는 상황도 말씀드리고 싶어요.`;
    persona = role === 'parent'
      ? '자녀가 학교폭력 사안에 연루된 사실에 충격을 받고 즉각적인 해명을 요구하는 학부모'
      : role === 'teacher'
        ? '학교폭력 사안의 사실 확인과 절차를 안내하는 교사'
        : role === 'student'
          ? '학교폭력 사안에서 자신의 입장을 설명하려는 학생'
          : '친구가 학교폭력 사안에 연루되어 걱정하는 학생';
    expectedKeywords = ['사실 확인', '절차 안내', '비밀 보호'];
    rubricTips = '확인되지 않은 사실을 단정하지 말고 학교폭력 처리 절차와 비밀 유지 원칙을 안내할 것';
  } else if (isOnline) {
    initialUtterance = role === 'parent'
      ? `선생님, 저희 ${givenName} 일로 있었던 일을 그냥 넘길 수 없습니다. 오늘 안에 납득할 답을 주세요. 아니면 교육청에 민원을 넣고 이 일을 알리겠습니다!`
      : role === 'teacher'
        ? `선생님, ${name} 학생 관련해 교육청 민원과 온라인 게시 이야기가 나왔습니다. 경위를 확인하고 공식 절차에 맞춰 대응하면 좋겠습니다.`
        : role === 'student'
          ? '선생님, 제가 겪은 일을 아무도 제대로 들어주지 않는 것 같아요. 계속 이러면 교육청에 알리고 온라인에도 글을 올릴 거예요.'
          : `선생님, ${subjectName} 겪은 일을 알리고 싶다고 해요. 무슨 일이 있었는지 제대로 들어주셨으면 좋겠어요.`;
    persona = role === 'parent'
      ? '온라인 게시와 상급기관 민원을 언급하며 강하게 항의하는 학부모'
      : role === 'teacher'
        ? '온라인 게시와 민원 가능성을 확인하고 공식 절차를 안내하는 교사'
        : role === 'student'
          ? '자신이 겪은 일을 알리겠다며 강하게 항의하는 학생'
          : '친구의 문제를 대신 알리고 도움을 구하려는 학생';
    expectedKeywords = ['민원', '공개', '기록'];
    rubricTips = '위협에 맞대응하지 말고 발언과 통화 시각을 기록한 뒤 관리자와 공식 대응을 협의할 것';
  } else if (isAfterHours) {
    initialUtterance = role === 'parent'
      ? `늦은 시간 죄송하지만 저희 ${givenName} 문제로 꼭 말씀드려야겠어요. 지금 바로 설명해 주세요.${intensity ? ' 내일 아침 학교에 찾아가 교장 선생님께 직접 이야기하겠습니다.' : ''}`
      : role === 'teacher'
        ? `선생님, 늦은 시간 죄송합니다. ${name} 학생 관련 연락이 와서 우선 상황을 공유드립니다. 안전과 사실관계부터 확인하면 좋겠습니다.`
        : role === 'student'
          ? '선생님, 늦은 시간에 죄송해요. 제가 오늘 있었던 일 때문에 너무 걱정돼서 지금 말씀드리고 싶어요.'
          : `선생님, 늦은 시간에 죄송해요. ${subjectName} 오늘 일 때문에 많이 힘들어해서 걱정돼 연락드렸어요.`;
    persona = role === 'parent'
      ? '근무시간 외 연락에도 즉시 답변을 요구하며 감정적으로 항의하는 학부모'
      : role === 'teacher'
        ? '늦은 시간 연락을 받고 학생의 안전과 상담 절차를 확인하는 교사'
        : role === 'student'
          ? '늦은 시간 걱정되는 일을 교사에게 털어놓는 학생'
          : '늦은 시간 힘들어하는 친구를 걱정해 교사에게 연락하는 학생';
    expectedKeywords = ['근무시간', '공식 상담', '관리자 동석'];
    rubricTips = '근무시간 외 연락 기준을 차분히 알리고 공식 상담 시간과 학교 연락 창구를 안내할 것';
  } else if (isVisit) {
    initialUtterance = role === 'parent'
      ? `선생님, 저희 ${givenName} 일로 직접 만나야겠습니다. 지금 학교로 가고 있으니 교무실에서 설명해 주세요.${intensity ? ' 관리자도 같이 나오시라고 전해 주세요.' : ''}`
      : role === 'teacher'
        ? `선생님, ${name} 학생 보호자께서 학교 방문을 원하십니다. 안전한 상담을 위해 관리자와 일정을 조율해 공식 절차로 안내하겠습니다.`
        : role === 'student'
          ? '선생님, 제가 겪은 일에 대해 직접 이야기하고 싶어요. 지금 상담할 수 있을까요?'
          : `선생님, ${subjectName} 직접 이야기하고 싶어 해요. 제가 같이 가도 될까요?`;
    persona = role === 'parent'
      ? '사전 일정 조율 없이 학교 방문을 예고하며 즉각적인 대면 해명을 요구하는 학부모'
      : role === 'teacher'
        ? '학생에게 공식 상담 일정을 안내하고 안전한 면담을 조율하는 교사'
        : role === 'student'
          ? '교사와 직접 만나 자신의 문제를 이야기하고 싶은 학생'
          : '친구의 면담에 동행하고 싶어 하는 학생';
    expectedKeywords = ['방문 일정', '관리자 동석', '공식 상담'];
    rubricTips = '즉석 단독 면담은 피하고 관리자와 일정을 조율해 공식 상담으로 진행할 것';
  } else if (isGuidance) {
    initialUtterance = role === 'parent'
      ? `선생님, 저희 ${givenName}가 학교에서 있었던 일로 많이 속상해해요. 무슨 일이었는지 설명해 주시고 아이 이야기도 들어주세요.${intensity ? ' 계속 이런 식이면 정식으로 문제를 제기하겠습니다.' : ''}`
      : role === 'teacher'
        ? `선생님, ${name} 학생이 오늘 생활지도 과정에서 많이 속상해했다고 합니다. 학생 이야기도 듣고 지도 경위를 함께 확인해 보면 좋겠습니다.`
        : role === 'student'
          ? '선생님, 제가 오늘 지도받은 일이 너무 속상했어요. 제 이야기도 들어주셨으면 좋겠어요.'
          : `선생님, ${subjectName} 오늘 생활지도 때문에 속상해해요. 무슨 일이 있었는지 한번 들어봐 주시면 안 될까요?`;
    persona = role === 'parent'
      ? '자녀의 생활지도나 학교생활에 염려가 있어 구체적인 설명과 조정을 요구하는 학부모'
      : role === 'teacher'
        ? '학생의 이야기를 듣고 생활지도 경위와 지원 방안을 함께 살펴보는 교사'
        : role === 'student'
          ? '생활지도 과정에서 속상함을 느껴 교사에게 자신의 입장을 말하는 학생'
          : '친구의 속상한 상황을 걱정해 교사에게 도움을 요청하는 학생';
    expectedKeywords = ['학생 의견', '지도 경위', '지원 방안'];
    rubricTips = '학생과 교사의 설명을 각각 확인하고, 관찰 사실과 교육적 조치 및 후속 계획을 안내할 것';
  } else {
    initialUtterance = role === 'parent'
      ? `선생님, 저희 ${givenName}와 관련해 ${category} 문제로 연락드렸어요. 학교에서 어떻게 확인하실 건지 구체적으로 말씀해 주세요.${intensity ? ' 이번에는 그냥 넘어가지 않겠습니다.' : ''}`
      : role === 'teacher'
        ? `선생님, ${name} 학생의 ${category}와 관련해 확인이 필요합니다. 학생 상황과 학교의 지원 방안을 함께 살펴보면 좋겠습니다.`
        : role === 'student'
          ? `선생님, 제가 ${category} 문제로 할 말이 있어요. 제 상황을 먼저 들어주실 수 있나요?`
          : `선생님, ${subjectName} ${category} 때문에 걱정하고 있어요. 제가 대신 말씀드려도 될까요?`;
    persona = role === 'parent'
      ? '자녀 관련 사안에 구체적인 설명과 학교의 처리 계획을 요구하는 학부모'
      : role === 'teacher'
        ? '학생의 이야기를 듣고 필요한 절차와 지원을 설명하는 교사'
        : role === 'student'
          ? '자신의 상황을 설명하고 도움을 구하려는 학생'
          : '친구를 걱정해 교사에게 상황을 전하는 학생';
    expectedKeywords = ['사실 확인', '처리 절차', '후속 안내'];
    rubricTips = '요구사항을 정확히 기록하고 확인 가능한 사실 및 정식 상담 절차를 중심으로 안내할 것';
  }

  const asksForBadMood = /기분.{0,8}(좋지|안 좋|나쁘|상해)|화가 나|짜증|불쾌|격앙|화난/.test(extraContext);
  const asksForParentMood = asksForBadMood && /학부모|부모님|엄마|아빠|보호자/.test(extraContext);
  if (asksForBadMood && role === 'parent') {
    initialUtterance = initialUtterance.replace(/^선생님,?\s*/, '선생님, 도대체 ').replace(/요\.?$/, '요. 정말 답답하네요.');
    if (!initialUtterance.startsWith('선생님, 도대체')) initialUtterance = `하… ${initialUtterance}`;
  } else if (asksForBadMood && role === 'teacher') {
    initialUtterance = `선생님, 학부모님께서 이번 일로 많이 속상해하시는 것 같습니다. ${name} 학생 상황과 사실관계를 차분히 확인해 보면 좋겠습니다.`;
  } else if (asksForBadMood && role === 'student') {
    initialUtterance = asksForParentMood
      ? '선생님, 저희 엄마가 이 일로 많이 속상해하시고 화가 나셨어요. 저도 걱정돼서 무슨 상황인지 알고 싶어요.'
      : `선생님, 제가 ${category} 때문에 지금 너무 속상하고 화가 나요. 제 이야기를 먼저 들어주세요.`;
  } else if (asksForBadMood && role === 'friend') {
    initialUtterance = asksForParentMood
      ? `선생님, ${givenName}네 엄마가 이 일로 많이 속상해하신다고 들었어요. ${givenName}도 걱정돼서 말씀드려요.`
      : `선생님, ${subjectName} 지금 너무 속상해 보여요. 오늘 있었던 일 때문에 많이 힘들어해서 말씀드려요.`;
  }
  const asksForCalmTone = /차분|침착|흥분하지|감정적이지 않/.test(extraContext);
  const asksForWorry = /걱정|불안|두렵|염려/.test(extraContext);
  let contextualUtterance = initialUtterance;
  if (extraContext && !asksForBadMood) {
    if (role === 'parent' && asksForCalmTone) {
      contextualUtterance = initialUtterance.replace(/!+/g, '.').replace(/당장|도대체/g, '우선');
    } else if (role === 'student' && asksForWorry) {
      contextualUtterance = initialUtterance.replace(/^선생님, /, '선생님, 제가 조금 걱정돼서요. ');
    } else if (role === 'friend' && asksForWorry) {
      contextualUtterance = initialUtterance.replace(/^선생님, /, `선생님, ${subjectName} 걱정돼서 제가 같이 왔어요. `);
    }
  }
  const fallbackScenario = {
    id: `gen-${Date.now()}`,
    title: `${scenarioSubject} · ${category} 상담`,
    difficulty: difficulty || '고위험',
    parentInitial: contextualUtterance,
    persona,
    expectedKeywords,
    rubricTips,
  };

  if (!ai) {
    return res.json({
      scenario: fallbackScenario,
      source: 'heuristic',
    });
  }

  try {
    const prompt = `당신은 대한민국 학교 상담 상황을 설계하는 AI Agent 'Scenario Architect'입니다.
교사가 학교 현장에서 겪을 수 있는 현실적인 맞춤형 상담 시나리오를 1건 생성하세요.

입력 조건:
- 대상 학생: ${studentName || '김철수'}
- 학년/학급: ${gradeLevel || '중학교 2학년'}
- 실제 발화자 역할: ${roleName} (${role})
- 사안 분야: ${issueCategory || '수행평가 성적 이의 및 폭언 협박'}
- 훈련 난이도: ${difficulty || '고위험 (주의~높음)'}
- 상황·말투 연출 요청: ${extraContext || '사안에 어울리는 현실적인 말투'}

중요한 작성 규칙:
1. 화자는 반드시 지정된 역할로 말하세요. 학부모는 '저희 철수가/저희 철수가요' 또는 '철수가'처럼 가족 호칭을 자연스럽게 쓰고, 선생님 역할은 다른 교사와 대화하므로 상대를 반드시 '선생님'이라고 부르고 학생을 '김철수 학생'처럼 지칭하세요. 선생님 역할 대사에서 상대를 '네/너'라고 부르거나 학생에게 직접 말하듯 쓰지 마세요. 학생 본인은 '제가/저는'이라고 말하고, 친구는 학생 이름만 자연스럽게 부르세요. 추가 요청이 부모의 감정에 관한 내용이고 화자가 학생이면 '저희 엄마가/아빠가/부모님이'처럼 학생의 관점에서 말하세요. 예시 학생 이름이 김철수라면 이름을 부를 때 '철수'를 활용하세요.
2. 추가 요청은 요청 문장을 그대로 읊거나 '기분이 좋지 않으니'처럼 설명하지 마세요. 감정·성격 요청은 어휘, 말투, 문장 길이와 어조로 드러내고, 상황 설정 요청은 대화 중 관련 사실이나 요구로 녹여 쓰세요.
3. parentInitial은 해당 화자가 실제 통화에서 첫마디로 할 법한 1~3문장으로 작성하세요. 메타 설명이나 시나리오 지시문은 발화에 넣지 마세요.

반드시 아래 JSON 형식으로 응답하세요:
{
  "id": "gen-${Date.now()}",
  "title": "상황을 요약하는 짧은 제목",
  "difficulty": "요청 난이도에 맞는 난이도",
  "parentInitial": "지정된 역할 화자가 실제로 말하는 첫 발화",
  "persona": "화자의 배경 및 성향 설명",
  "expectedKeywords": ["위반 키워드 1", "키워드 2"],
  "rubricTips": "이 시나리오에서 교사가 반드시 지켜야 할 법적 방어 수칙 1~2가지"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      scenario: parsed.title && parsed.parentInitial ? parsed : fallbackScenario,
      source: 'gemini',
    });
  } catch (err: any) {
    console.error('Scenario generation error:', err);
    return res.json({
      scenario: fallbackScenario,
      source: 'fallback',
    });
  }
});

// Setup Vite middlewares for SSR/dev server
async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(port, '0.0.0.0', () => {
    console.log(`True Education dev server running at http://localhost:${port}`);
  });
}

startServer();
