import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { SYSTEM_PROMPT, userMessage } from "@/lib/coach/prompt";
import { checkAndIncrement } from "@/lib/coach/usage";

export const runtime = "nodejs";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export async function POST(req: NextRequest) {
  const sb = createServerClient();
  const {
    data: { session },
  } = await sb.auth.getSession();
  const user = session?.user;
  if (!user) return new Response("Sign in to use the coach", { status: 401 });

  const { data: profile } = await sb
    .from("profiles")
    .select("is_pro")
    .eq("id", user.id)
    .maybeSingle();
  const gate = await checkAndIncrement(user.id, !!profile?.is_pro);
  if (!gate.ok)
    return new Response(
      "Daily AI limit reached. Upgrade to Pro for unlimited.",
      { status: 429 }
    );

  const body = (await req.json()) as { board: number[]; target: number };
  if (!Array.isArray(body.board) || body.board.length !== 81)
    return new Response("bad-request", { status: 400 });

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey)
    return new Response("[error] GOOGLE_API_KEY not set", { status: 500 });

  const ai = new GoogleGenAI({ apiKey });
  const encoder = new TextEncoder();
  const sse = new ReadableStream({
    async start(ctrl) {
      try {
        const stream = await ai.models.generateContentStream({
          model: GEMINI_MODEL,
          contents: userMessage(body.board, body.target),
          config: {
            systemInstruction: SYSTEM_PROMPT,
            maxOutputTokens: 400,
          },
        });
        for await (const chunk of stream) {
          const text = chunk.text;
          if (text) ctrl.enqueue(encoder.encode(text));
        }
      } catch (e) {
        console.error("[coach] gemini error:", e);
        const msg = e instanceof Error ? e.message : String(e);
        ctrl.enqueue(encoder.encode(`\n[error] ${msg}`));
      } finally {
        ctrl.close();
      }
    },
  });

  return new Response(sse, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
