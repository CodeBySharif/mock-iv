import { ReportScreen } from "@/features/report/ReportScreen";

type ReportPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function ReportPage({ params }: ReportPageProps) {
  const { sessionId } = await params;
  return <ReportScreen sessionId={sessionId} />;
}
