import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest){
  const form = await req.formData();
  const file = form.get("file") as File;
  const fd = new FormData();
  fd.set("file", file);
  const api = process.env.NEXT_PUBLIC_API_BASE!;
  const res = await fetch(`${api}/ingest/receipt`, { method: "POST", body: fd });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
