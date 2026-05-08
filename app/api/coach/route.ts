import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { SYSTEM_PROMPT, userMessage } from "@/lib/coach/prompt";
import { checkAndIncrement } from "@/lib/coach/usage";

export const runtime = "nodejs";

const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey)
    return new Response("[error] GROQ_API_KEY not set", { status: 500 });

  const upstream = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 400,
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage(body.board, body.target) },
        ],
      }),
    }
  );

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error("[coach] groq error:", upstream.status, detail);
    return new Response(`[error] ${upstream.status} ${detail}`, { status: 502 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const sse = new ReadableStream({
    async start(ctrl) {
      const reader = upstream.body!.getReader();
      let buf = "";
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") return;
            try {
              const json = JSON.parse(payload);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) ctrl.enqueue(encoder.encode(delta));
            } catch {}
          }
        }
      } catch (e) {
        console.error("[coach] stream error:", e);
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
