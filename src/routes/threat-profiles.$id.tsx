import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { getThreatActor } from "@/data/threat-actors";
import { interrogateThreatActor } from "@/lib/api/espionage.functions";
import { TwinSecLogo } from "@/components/TwinSecLogo";
import { useScrambleReveal } from "@/hooks/use-text-anim";

export const Route = createFileRoute("/threat-profiles/$id")({
  head: ({ params }) => {
    const actor = getThreatActor(params.id);
    return {
      meta: [
        {
          title: `TwinSec — ${actor ? actor.name : "Threat Profile"} · BAU Mindhunter Interrogation`,
        },
        {
          name: "description",
          content: `Behavioral dossier and post-arrest interrogation analysis for ${actor?.name}.`,
        },
      ],
    };
  },
  component: ThreatProfileDetail,
});

function ThreatProfileDetail() {
  const { id } = Route.useParams();
  const actor = getThreatActor(id);

  const [activeTab, setActiveTab] = useState<"dossier" | "interrogation">("dossier");
  const [messages, setMessages] = useState<
    Array<{ sender: "interrogator" | "actor"; text: string; timestamp: string }>
  >([]);
  const [questionInput, setQuestionInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrambleRef = useScrambleReveal<HTMLSpanElement>();

  useEffect(() => {
    const interval = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!actor) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <p className="text-red-500 text-xl font-bold">PROFILE DOSSIER NOT FOUND</p>
          <Link to="/threat-profiles" className="text-accent underline text-xs">
            ← RETURN TO THREAT PROFILES
          </Link>
        </div>
      </div>
    );
  }

  const formatRecTime = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleAsk = async (qText?: string) => {
    const query = qText || questionInput.trim();
    if (!query || isLoading) return;

    const userTime = new Date().toLocaleTimeString();
    const newMsgList = [
      ...messages,
      { sender: "interrogator" as const, text: query, timestamp: userTime },
    ];
    setMessages(newMsgList);
    setQuestionInput("");
    setIsLoading(true);

    try {
      const history = newMsgList.map((m) => ({ sender: m.sender, text: m.text }));
      const res = await interrogateThreatActor({
        data: {
          actorId: actor.id,
          actorName: actor.name,
          question: query,
          conversationHistory: history,
        },
      });

      setMessages((prev) => [
        ...prev,
        { sender: "actor", text: res.reply, timestamp: res.timestamp },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "actor",
          text: '[RESEARCHER NOTE: Interview connection lost]\n\n"The session was interrupted. All operational discussions are subject to review."',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper text-ink flex flex-col relative select-none font-sans">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute inset-0 scanline opacity-45 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <TwinSecLogo className="size-6 text-danger" />
            <Link
              to="/threat-profiles"
              className="display text-xl tracking-wide hover:text-danger transition-colors"
            >
              TwinSec BAU
            </Link>
            <span className="mono-label hidden md:inline text-danger font-bold pl-3 border-l border-ink/30">
              // DOSSIER: {actor.name}
            </span>
          </div>
          <div className="flex items-center gap-6 mono-label text-xs">
            <Link
              to="/simulation"
              search={{
                sector: actor.scenarioId as
                  | "power"
                  | "water"
                  | "oil-gas"
                  | "manufacturing"
                  | "port"
                  | "smart-building"
                  | "smart-city",
              }}
              className="bg-danger text-paper border-2 border-danger px-4 py-2 font-bold shadow-[4px_4px_0_0_#ef4444] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
            >
              LAUNCH SIMULATION ({actor.scenarioId.toUpperCase()}) →
            </Link>
          </div>
        </div>
      </header>

      {/* Profile Header */}
      <section className="mx-auto max-w-[1600px] w-full px-6 lg:px-10 py-16 lg:py-24 relative z-10 border-b border-ink/30">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8">
            <span ref={scrambleRef} className="mono-label text-danger tracking-widest uppercase">
              CLASSIFIED // FBI BAU PROFILE
            </span>
            <h1 className="display text-[14vw] md:text-[100px] leading-[0.82] mt-4 mb-8">
              {actor.name}
            </h1>
            <p className="font-serif italic text-2xl md:text-3xl text-ink/80 leading-snug max-w-3xl">
              "{actor.psychologicalProfile.keyInsight}"
            </p>
          </div>
          <div className="col-span-12 lg:col-span-4 flex flex-col justify-end lg:items-end">
            <div className="text-left lg:text-right mono-label space-y-2 mt-8 lg:mt-0">
              <p>
                <span className="text-ink/50">ORIGIN:</span> {actor.origin}
              </p>
              <p>
                <span className="text-ink/50">ACTIVE SINCE:</span> {actor.activeSince}
              </p>
              <p>
                <span className="text-ink/50">CLASSIFICATION:</span> {actor.classification}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mode Tabs */}
      <div className="mx-auto max-w-[1600px] w-full px-6 lg:px-10 mt-12 relative z-10">
        <div className="flex border-2 border-ink font-mono text-sm bg-paper w-fit">
          <button
            onClick={() => setActiveTab("dossier")}
            className={`px-8 py-4 font-bold transition-all uppercase tracking-widest ${
              activeTab === "dossier"
                ? "bg-ink text-paper border-b-4 border-ink"
                : "bg-paper text-ink/60 hover:text-ink hover:bg-ink/5 border-b-4 border-transparent"
            }`}
          >
            📄 BAU DOSSIER
          </button>
          <button
            onClick={() => setActiveTab("interrogation")}
            className={`px-8 py-4 font-bold transition-all uppercase tracking-widest border-l-2 border-ink ${
              activeTab === "interrogation"
                ? "bg-danger text-paper border-b-4 border-danger"
                : "bg-paper text-ink/60 hover:text-danger hover:bg-danger/5 border-b-4 border-transparent"
            }`}
          >
            🎙️ POST-CAPTURE INTERROGATION
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <section className="mx-auto max-w-[1600px] w-full px-6 lg:px-10 py-12 flex-1 relative z-10 mb-20">
        {activeTab === "dossier" ? (
          /* DOSSIER VIEW */
          <div className="grid grid-cols-12 gap-8 md:gap-12">
            {/* Left Column */}
            <div className="col-span-12 lg:col-span-4 space-y-12">
              <div>
                <p className="mono-label !text-ink/60 border-b border-ink/30 pb-2 mb-4">
                  // BEHAVIORAL PROFILE
                </p>
                <dl className="space-y-6 text-sm">
                  <div>
                    <dt className="mono-label !text-ink/50">PATIENCE LEVEL</dt>
                    <dd className="font-bold text-lg mt-1">{actor.psychologicalProfile.patience}</dd>
                  </div>
                  <div className="hairline !bg-ink/20" />
                  <div>
                    <dt className="mono-label !text-ink/50">EGO STRUCTURE</dt>
                    <dd className="font-bold text-lg mt-1">{actor.psychologicalProfile.ego}</dd>
                  </div>
                  <div className="hairline !bg-ink/20" />
                  <div>
                    <dt className="mono-label !text-ink/50">RISK TOLERANCE</dt>
                    <dd className="font-bold text-lg mt-1 text-danger">
                      {actor.psychologicalProfile.riskTolerance}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="border-2 border-ink p-8 shadow-brutal-ink bg-paper">
                <p className="mono-label text-danger mb-4">// WHAT STOPS THEM</p>
                <ul className="space-y-3 font-serif text-lg leading-snug">
                  {actor.whatStopsThem.map((item, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="text-danger select-none">■</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-12 lg:col-span-8 space-y-12">
              {/* Known Operations */}
              <div>
                <p className="mono-label !text-ink/60 border-b border-ink/30 pb-2 mb-6">
                  // HISTORICAL OPERATIONS
                </p>
                <div className="space-y-6">
                  {actor.knownOperations.map((op, idx) => (
                    <div key={idx} className="group border-2 border-transparent hover:border-ink p-4 transition-all">
                      <div className="flex justify-between items-baseline mb-2">
                        <h4 className="display text-3xl group-hover:text-danger transition-colors">
                          {op.name}
                        </h4>
                        <span className="mono-label !text-ink/50">{op.year}</span>
                      </div>
                      <p className="font-serif italic text-xl text-ink/80 leading-relaxed">
                        {op.impact}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Greatest Failure */}
              <div className="border-t-2 border-ink pt-12">
                <p className="mono-label text-danger mb-4">
                  // GREATEST FAILURE / HOW THEY GOT CAUGHT
                </p>
                <p className="font-serif text-2xl leading-relaxed text-ink/90 italic">
                  {actor.greatestFailure}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* INTERROGATION ROOM VIEW */
          <div className="border-4 border-ink bg-paper shadow-brutal-ink relative max-w-5xl">
            {/* Top Bar: Rec Indicator */}
            <div className="flex flex-wrap items-center justify-between border-b-4 border-ink p-4 bg-ink text-paper">
              <div className="flex items-center gap-4">
                <span className="size-3 bg-danger rounded-full animate-pulse shadow-[0_0_8px_#ef4444]" />
                <span className="mono-label text-danger tracking-widest font-bold">
                  REC {formatRecTime(recordingSeconds)} // POST-ARREST INTERVIEW
                </span>
              </div>
              <span className="mono-label text-paper/60">
                SUBJECT: {actor.interviewContext.characterName.toUpperCase()}
              </span>
            </div>

            {/* Conversation Log Box */}
            <div className="h-[550px] overflow-y-auto space-y-6 p-6 md:p-10 bg-[#f8f5f0] scrollbar-none font-mono">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-ink/50 space-y-4">
                  <div className="text-6xl mb-2 grayscale opacity-50">🎙️</div>
                  <p className="display text-3xl text-ink uppercase">SESSION READY</p>
                  <p className="font-serif text-xl italic max-w-md">
                    Select a suggested question below or type a query to interrogate the captured
                    threat actor.
                  </p>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col space-y-2 ${
                      m.sender === "interrogator" ? "items-end" : "items-start"
                    }`}
                  >
                    <span className="mono-label text-[10px] text-ink/50 px-1">
                      {m.sender === "interrogator" ? "SENIOR RESEARCHER" : actor.name.toUpperCase()} ·{" "}
                      {m.timestamp}
                    </span>
                    <div
                      className={`max-w-3xl p-5 leading-relaxed whitespace-pre-wrap text-sm md:text-base border-2 ${
                        m.sender === "interrogator"
                          ? "bg-paper border-ink text-ink shadow-[4px_4px_0_0_#1a1a1a]"
                          : "bg-ink border-ink text-paper shadow-[4px_4px_0_0_#ef4444]"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex items-center gap-3 text-danger animate-pulse py-4 font-bold mono-label">
                  <span className="size-2 bg-danger" />
                  <span>{actor.name.toUpperCase()} IS RESPONDING...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input & Suggested Prompts Area */}
            <div className="border-t-4 border-ink p-6 md:p-8 bg-paper">
              <div className="mb-6 space-y-3">
                <span className="mono-label text-ink/50">// SUGGESTED INTERROGATION PROMPTS</span>
                <div className="flex flex-wrap gap-3">
                  {actor.interviewContext.suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAsk(q)}
                      disabled={isLoading}
                      className="border-2 border-ink/30 hover:border-ink bg-transparent px-4 py-2 mono-label text-[11px] text-ink/70 hover:text-ink transition-all text-left cursor-pointer shadow-none hover:shadow-[2px_2px_0_0_#1a1a1a]"
                    >
                      "{q}"
                    </button>
                  ))}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAsk();
                }}
                className="flex border-4 border-ink shadow-[6px_6px_0_0_#1a1a1a]"
              >
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  disabled={isLoading}
                  placeholder={`Ask ${actor.name} about motives, timing, or target choices...`}
                  aria-label="Question for threat actor interrogation"
                  className="flex-1 bg-transparent px-6 py-4 text-sm md:text-base text-ink focus:outline-none placeholder:text-ink/40 font-mono"
                />
                <button
                  type="submit"
                  disabled={isLoading || !questionInput.trim()}
                  className="bg-danger text-paper px-8 md:px-12 font-bold display tracking-wider text-xl md:text-2xl hover:bg-danger/90 transition-colors disabled:opacity-30 cursor-pointer border-l-4 border-ink flex items-center justify-center"
                >
                  ASK
                </button>
              </form>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
