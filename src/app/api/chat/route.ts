import { NextResponse } from "next/server";

function generateSessionId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

type N8nPayload = Record<string, unknown>; // a generic object for webhook JSON

// GET /api/chat?message=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const message = searchParams.get("message") || "";

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const target = `${process.env.N8N_BASE_URL}${process.env.N8N_WEBHOOK_PATH}?message=${encodeURIComponent(
    message
  )}`;

  try {
    const n8nRes = await fetch(target, { method: "GET" });
    const text = await n8nRes.text();

    console.log("N8N Response:", text); // Debug log

    // Try JSON first; fall back to plain text
    let payload: N8nPayload;
    try {
      payload = JSON.parse(text) as N8nPayload;
    } catch {
      // If not JSON, send the raw text as the reply
      payload = { reply: text || "No response content" };
    }

    // Forward the exact response
    return NextResponse.json(payload, {
      status: n8nRes.ok ? 200 : n8nRes.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: "Failed to reach n8n", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}

// POST /api/chat  with { message }
export async function POST(req: Request) {
  const body: Record<string, unknown> = await req.json().catch(() => ({}));
  const message = body?.message?.toString?.() || "";
  const sessionId = body?.sessionId?.toString?.() || generateSessionId();

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // Your n8n webhook is GET, so we forward as query param
  const target = `${process.env.N8N_BASE_URL}${process.env.N8N_WEBHOOK_PATH}?message=${encodeURIComponent(
    message
  )}&sessionId=${encodeURIComponent(sessionId)}`;

  try {
    const n8nRes = await fetch(target, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!n8nRes.ok) {
      console.error("N8N Error:", {
        status: n8nRes.status,
        statusText: n8nRes.statusText,
        headers: Object.fromEntries(n8nRes.headers.entries()),
      });
    }

    const text = await n8nRes.text();

    let payload: N8nPayload;
    try {
      payload = JSON.parse(text) as N8nPayload;
    } catch {
      payload = { reply: text || "OK" };
    }

    return NextResponse.json(payload, {
      status: n8nRes.ok ? 200 : n8nRes.status,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: "Failed to reach n8n", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}
