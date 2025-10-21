import ChatClient from "./ChatClient";

export default async function Page({
  params,
}: {
  // Next 15: params is async in server components
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  return <ChatClient threadId={threadId} />;
}
