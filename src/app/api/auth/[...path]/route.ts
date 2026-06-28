import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");
  const url = `${API_BASE}/auth/${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const authorization = req.headers.get("authorization");
  if (authorization) headers["Authorization"] = authorization;

  const cookie = req.headers.get("cookie");
  if (cookie) headers["Cookie"] = cookie;

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
  }

  try {
    const res = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } else {
      const text = await res.text();
      return NextResponse.json(
        { error: `Upstream returned non-JSON (${res.status})`, detail: text.slice(0, 400) },
        { status: res.status },
      );
    }
  } catch (error: any) {
    console.error(`[auth proxy] ${req.method} /auth/${path} →`, error?.message);
    return NextResponse.json(
      { error: "Could not reach API server", detail: error?.message },
      { status: 502 },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
