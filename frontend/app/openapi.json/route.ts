import { NextRequest } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";

export async function GET(req: NextRequest) {
  const url = `${BACKEND_URL}/openapi.json${req.nextUrl.search}`;
  const res = await fetch(url, { headers: req.headers });
  return new Response(res.body, { status: res.status, headers: res.headers });
}
