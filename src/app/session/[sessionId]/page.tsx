import { SessionRoom } from "@/features/session/SessionRoom";

type SessionPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function SessionPage({ params }: SessionPageProps) {
  const { sessionId } = await params;
  return <SessionRoom sessionId={sessionId} />;
}
