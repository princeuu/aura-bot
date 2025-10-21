import { NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebase-admin";
import { db } from "@/app/lib/firestore";

export async function GET(req: Request, { params }: { params: { threadId: string } }) {
  const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!idToken) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { uid } = await adminAuth.verifyIdToken(idToken);

  const snap = await db.collection("users").doc(uid)
    .collection("threads").doc(params.threadId)
    .collection("messages").orderBy("createdAt", "asc").get();

  return NextResponse.json({ messages: snap.docs.map(d => d.data()) });
}