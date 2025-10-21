import { NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebase-admin";
import { db } from "@/app/lib/firestore";

export async function POST(req: Request) {
  const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!idToken) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { uid } = await adminAuth.verifyIdToken(idToken);

  const { title = "New Chat" } = await req.json();
  const ref = db.collection("users").doc(uid).collection("threads").doc();
  await ref.set({ title, createdAt: new Date() });
  return NextResponse.json({ threadId: ref.id });
}

export async function GET(req: Request) {
  const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!idToken) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { uid } = await adminAuth.verifyIdToken(idToken);

  const snap = await db.collection("users").doc(uid).collection("threads")
    .orderBy("createdAt", "desc").limit(50).get();
  const threads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ threads });
}