import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCaseFile } from "@/data/case-files";
import { TwinSecLogo } from "@/components/TwinSecLogo";
import { CaseFileDetail as CaseFileDetailComponent } from "@/components/casefile/CaseFileDetail";

export const Route = createFileRoute("/case-files/$id")({
  head: ({ params }) => {
    const c = getCaseFile(params.id);
    return {
      meta: [
        {
          title: `TwinSec — ${c ? c.title : "Case File"} · Incident Analysis`,
        },
        {
          name: "description",
          content: `Declassified ICS case file narrative, MITRE ATT&CK mapping, and research citations for ${c?.title}.`,
        },
      ],
    };
  },
  component: CaseFileDetailView,
});

function CaseFileDetailView() {
  const { id } = Route.useParams();
  const caseData = getCaseFile(id);

  if (!caseData) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <p className="text-red-500 text-xl font-bold">CASE FILE NOT FOUND</p>
          <Link to="/case-files" className="text-accent underline text-xs">
            ← RETURN TO CASE FILES INDEX
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col relative select-none font-sans">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute inset-0 scanline opacity-45 pointer-events-none" />

      {/* Main Detail Container */}
      <section className="max-w-[1600px] mx-auto w-full px-6 lg:px-10 py-10 flex-1 relative z-10">
        <CaseFileDetailComponent caseFile={caseData} />
      </section>
    </main>
  );
}
