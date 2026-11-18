import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCaseFile } from "@/data/case-files";
import { TwinSecLogo } from "@/components/branding/TwinSecLogo";
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
  loader: ({ params }) => {
    const caseData = getCaseFile(params.id);
    if (!caseData) throw notFound();
    return { caseData };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 font-mono select-none">
      <div className="max-w-md w-full border-3 border-black bg-[#121214] p-8 text-center shadow-[8px_8px_0px_0px_#EF4444]">
        <span className="bg-[#EF4444] text-white font-black text-xs px-2.5 py-0.5 border border-black inline-block uppercase tracking-wider mb-3">
          404 · CASE FILE NOT FOUND
        </span>
        <h1 className="text-3xl font-black text-[#F5F3E7] tracking-tight uppercase">
          Incident Unresolved
        </h1>
        <p className="mt-2 text-xs text-foreground/60 leading-relaxed">
          The requested historical ICS cyber incident record does not exist in the TwinSec
          declassified repository.
        </p>
        <div className="mt-6">
          <Link
            to="/case-files"
            className="inline-flex min-h-[44px] items-center justify-center bg-[#BFFF2E] text-black border-2 border-black px-6 py-2 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000000] hover:bg-lime-300 transition-all cursor-pointer"
          >
            ← Return to Case Files
          </Link>
        </div>
      </div>
    </div>
  ),
  component: CaseFileDetailView,
});

function CaseFileDetailView() {
  const { id } = Route.useParams();
  const caseData = getCaseFile(id)!;

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
