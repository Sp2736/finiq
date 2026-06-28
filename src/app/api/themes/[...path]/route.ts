import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join("/");
  const url = `${API_BASE}/themes/${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Forward Authorization bearer token (used by apiClient for both staff and investors)
  const authorization = req.headers.get("authorization");
  if (authorization) headers["Authorization"] = authorization;

  // Forward cookies as well (belt-and-suspenders for server-side flows)
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

    // Try to parse as JSON; fall back to text for diagnostics
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
    console.error(`[themes proxy] ${req.method} /themes/${path} →`, error?.message);
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
