import { createFileRoute, Link } from "@tanstack/react-router";
import { getCaseFile } from "@features/case-files";
import { TwinSecLogo } from "@shared";
import { CaseFileDetail as CaseFileDetailComponent } from "@/components/casefile";

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

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-rule bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <TwinSecLogo className="size-6" />
            <Link
              to="/case-files"
              className="display text-xl tracking-wide hover:text-accent transition-colors"
            >
              TwinSec Case Files
            </Link>
            <span className="mono-label hidden md:inline text-accent">// {caseData.title}</span>
          </div>
          <div className="flex items-center gap-6 mono-label text-xs">
            <Link
              to="/simulation"
              search={{
                sector: caseData.scenarioId as
                  | "power"
                  | "water"
                  | "oil-gas"
                  | "manufacturing"
                  | "port"
                  | "smart-building"
                  | "smart-city",
              }}
              className="bg-accent text-black font-black px-3.5 py-1.5 hover:bg-[#BFFF2E] transition-colors border border-black shadow-[2px_2px_0px_0px_#000000]"
            >
              SIMULATE THIS ATTACK ⚡
            </Link>
          </div>
        </div>
      </header>

      {/* Main Detail Container */}
      <section className="max-w-[1600px] mx-auto w-full px-6 lg:px-10 py-10 flex-1 relative z-10">
        <CaseFileDetailComponent caseFile={caseData} />
      </section>
    </main>
  );
}
