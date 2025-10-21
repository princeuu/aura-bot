import { NextResponse, type NextRequest } from "next/server";
import { adminAuth } from "@/app/lib/firebase-admin";
import { db } from "@/app/lib/firestore";

export async function GET(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any
) {
  const { threadId } = (context?.params as { threadId: string }) ?? {
    threadId: "",
  };

  const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!idToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { uid } = await adminAuth.verifyIdToken(idToken);

  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("threads")
    .doc(threadId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .get();

  return NextResponse.json({ messages: snap.docs.map((d) => d.data()) });
}
