import { type NextRequest } from "next/server";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude/client";

// JD 분석 결과 타입
interface JdAnalysisResult {
  keywords: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  summary: string;
}

// JD 분석 시스템 프롬프트 — 반드시 JSON만 반환하도록 지시
const JD_ANALYSIS_SYSTEM_PROMPT =
  '당신은 채용공고(JD) 분석 전문가입니다. 입력된 JD를 분석해 다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):\n{"keywords":[...],"requiredSkills":[...],"preferredSkills":[...],"summary":"한 줄 요약"}';

// POST /api/analyze-jd
// Body: { jdText: string }
// Response: JSON { keywords: string[], requiredSkills: string[], preferredSkills: string[], summary: string }
export async function POST(request: NextRequest) {
  // API 키 미설정 시 즉시 에러 반환
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "CONFIGURATION_ERROR", message: "API 키가 설정되지 않았습니다" },
      { status: 500 }
    );
  }

  let jdText: string;

  try {
    const body = await request.json();
    jdText = body.jdText;
  } catch {
    return Response.json(
      { error: "INVALID_JSON", message: "요청 본문을 파싱할 수 없습니다" },
      { status: 400 }
    );
  }

  // jdText 유효성 검사
  if (typeof jdText !== "string" || jdText.trim().length === 0) {
    return Response.json(
      { error: "INVALID_REQUEST", message: "jdText가 비어있거나 유효하지 않습니다" },
      { status: 400 }
    );
  }

  // 과도하게 긴 입력 차단 (약 50,000자 제한)
  if (jdText.length > 50000) {
    return Response.json(
      { error: "INPUT_TOO_LONG", message: "JD 텍스트가 너무 깁니다 (최대 50,000자)" },
      { status: 400 }
    );
  }

  try {
    // JD 분석 — 스트리밍 없이 단일 응답으로 처리
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: JD_ANALYSIS_SYSTEM_PROMPT,
      messages: [{ role: "user", content: jdText.trim() }],
    });

    // 응답에서 텍스트 블록 추출
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return Response.json(
        { error: "EMPTY_RESPONSE", message: "Claude 응답이 비어있습니다" },
        { status: 500 }
      );
    }

    // JSON 파싱 — 실패 시 PARSE_ERROR 반환
    let result: JdAnalysisResult;
    try {
      result = JSON.parse(textBlock.text) as JdAnalysisResult;
    } catch {
      return Response.json(
        {
          error: "PARSE_ERROR",
          message: "Claude 응답을 JSON으로 파싱할 수 없습니다",
        },
        { status: 500 }
      );
    }

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "분석 중 오류가 발생했습니다";
    return Response.json(
      { error: "API_ERROR", message },
      { status: 500 }
    );
  }
}
