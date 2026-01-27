import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = `http://backend:8000/openapi.json${req.nextUrl.search}`;
  const res = await fetch(url, { headers: req.headers });

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
}
