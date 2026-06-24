import { NextResponse } from "next/server";
import { Agent37Error } from "@/lib/agent37";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

// Trim a user-supplied string and reject empty input with a 400 — the shared shape
// every create/rename handler needs.
export function requireTrimmed(value: string | null | undefined, message: string): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) throw new ApiError(400, "invalid_request", message);
  return trimmed;
}

function apiError(message: string, status = 400, code = "error") {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function handleError(e: unknown) {
  if (e instanceof ApiError || e instanceof Agent37Error) {
    return apiError(e.message, e.status, e.code);
  }
  console.error("[api]", e);
  return apiError("Internal server error", 500, "internal_error");
}

// Wraps a route handler so every thrown ApiError/Agent37Error becomes a clean JSON
// response and unexpected errors a 500 — instead of hand-copying try/catch into each
// handler. Use as: `export const POST = route(async (req, { params }) => { ... })`.
export function route<C = unknown>(
  handler: (request: Request, context: C) => Promise<Response>
): (request: Request, context: C) => Promise<Response> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (e) {
      return handleError(e);
    }
  };
}
