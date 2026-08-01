import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { getThreatActor, interrogateThreatActor } from "@features/mindhunter";
import { TwinSecLogo } from "@shared";

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
    <main className="min-h-screen bg-background text-foreground flex flex-col relative select-none">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="absolute inset-0 scanline opacity-40 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-rule bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <TwinSecLogo className="size-6" />
            <Link
              to="/threat-profiles"
              className="display text-xl tracking-wide hover:text-danger transition-colors"
            >
              TwinSec BAU
            </Link>
            <span className="mono-label hidden md:inline text-danger font-bold">
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
              className="bg-accent text-black border-2 border-accent px-4 py-2 font-bold shadow-comic-sm hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              LAUNCH SIMULATION ({actor.scenarioId.toUpperCase()}) →
            </Link>
          </div>
        </div>
      </header>

      {/* Profile Header & Tabs */}
      <section className="max-w-[1600px] mx-auto w-full px-6 lg:px-10 pt-8 pb-4 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-danger pb-4 gap-4">
          <div>
            <span className="mono-label text-danger font-bold">CLASSIFIED // FBI BAU PROFILE</span>
            <h1 className="display text-4xl sm:text-6xl mt-1">{actor.name}</h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              ORIGIN: {actor.origin} · ACTIVE SINCE: {actor.activeSince}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex border-2 border-rule font-mono text-xs bg-black">
            <button
              onClick={() => setActiveTab("dossier")}
              className={`px-5 py-2.5 font-bold transition-all ${
                activeTab === "dossier"
                  ? "bg-danger text-white border-b-2 border-danger"
                  : "bg-black text-muted-foreground hover:text-white"
              }`}
            >
              📄 BAU DOSSIER
            </button>
            <button
              onClick={() => setActiveTab("interrogation")}
              className={`px-5 py-2.5 font-bold transition-all ${
                activeTab === "interrogation"
                  ? "bg-danger text-white border-b-2 border-danger"
                  : "bg-black text-muted-foreground hover:text-white"
              }`}
            >
              🎙️ POST-CAPTURE INTERROGATION
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Pane */}
      <section className="max-w-[1600px] mx-auto w-full px-6 lg:px-10 py-6 flex-1 relative z-10">
        {activeTab === "dossier" ? (
          /* DOSSIER VIEW */
          <div className="grid grid-cols-12 gap-8 font-mono text-xs">
            {/* Left Column: Core Dossier Attributes */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="border-2 border-rule bg-card p-6 space-y-4 shadow-comic-dark">
                <span className="mono-label text-danger font-bold">// BEHAVIORAL PROFILE</span>
                <div className="space-y-3 divide-y-2 divide-rule">
                  <div className="pt-2">
                    <span className="text-muted-foreground block text-[10px]">PATIENCE LEVEL:</span>
                    <span className="text-foreground font-bold">
                      {actor.psychologicalProfile.patience}
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className="text-muted-foreground block text-[10px]">EGO STRUCTURE:</span>
                    <span className="text-foreground font-bold">
                      {actor.psychologicalProfile.ego}
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className="text-muted-foreground block text-[10px]">RISK TOLERANCE:</span>
                    <span className="text-foreground font-bold">
                      {actor.psychologicalProfile.riskTolerance}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-2 border-rule bg-card p-6 space-y-4 shadow-comic-dark">
                <span className="mono-label text-accent font-bold">// WHAT STOPS THEM</span>
                <ul className="space-y-2 list-disc list-inside text-foreground/80">
                  {actor.whatStopsThem.map((item, idx) => (
                    <li key={idx} className="leading-snug">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column: Key Insight & Operations */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="border-2 border-danger/60 bg-danger/5 p-6 space-y-3 shadow-comic-sm">
                <span className="mono-label text-danger font-bold">
                  THE KEY INSIGHT (MINDHUNTER BAU ANALYSIS)
                </span>
                <p className="font-serif italic text-lg text-foreground leading-relaxed">
                  "{actor.psychologicalProfile.keyInsight}"
                </p>
              </div>

              {/* Known Operations */}
              <div className="border-2 border-rule bg-card p-6 space-y-4 shadow-comic-dark">
                <span className="mono-label text-muted-foreground">// HISTORICAL OPERATIONS</span>
                <div className="space-y-4">
                  {actor.knownOperations.map((op, idx) => (
                    <div key={idx} className="border-b-2 border-rule pb-3 last:border-b-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-accent text-sm">{op.name}</span>
                        <span className="text-muted-foreground text-[10px]">{op.year}</span>
                      </div>
                      <p className="text-foreground/80 mt-1 text-xs">{op.impact}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Greatest Failure */}
              <div className="border-2 border-rule bg-card p-6 space-y-2 shadow-comic-dark">
                <span className="mono-label text-danger font-bold">
                  // GREATEST FAILURE / HOW THEY GOT CAUGHT
                </span>
                <p className="text-foreground/90 leading-relaxed">{actor.greatestFailure}</p>
              </div>
            </div>
          </div>
        ) : (
          /* INTERROGATION ROOM VIEW */
          <div className="border-2 border-danger bg-card p-6 space-y-6 font-mono text-xs shadow-comic-dark relative">
            {/* Top Bar: Rec Indicator */}
            <div className="flex items-center justify-between border-b-2 border-rule pb-4">
              <div className="flex items-center gap-3">
                <span className="size-2.5 bg-danger animate-pulse" />
                <span className="mono-label text-danger font-bold">
                  ● REC {formatRecTime(recordingSeconds)} // POST-ARREST INTERVIEW ROOM
                </span>
              </div>
              <span className="text-muted-foreground text-[10px]">
                SUBJECT: {actor.interviewContext.characterName}
              </span>
            </div>

            {/* Conversation Log Box */}
            <div className="h-[450px] overflow-y-auto space-y-4 p-4 bg-black border-2 border-rule scrollbar-none">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
                  <span className="text-2xl">🎙️</span>
                  <p className="font-bold text-foreground">INTERROGATION SESSION READY</p>
                  <p className="text-[10px] max-w-md">
                    Select a suggested question below or type a question to interview the captured
                    threat actor regarding motives and decisions.
                  </p>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col space-y-1 ${
                      m.sender === "interrogator" ? "items-end" : "items-start"
                    }`}
                  >
                    <span className="text-[9px] text-muted-foreground">
                      {m.sender === "interrogator" ? "SENIOR RESEARCHER" : actor.name} ·{" "}
                      {m.timestamp}
                    </span>
                    <div
                      className={`max-w-2xl p-4 leading-relaxed whitespace-pre-wrap ${
                        m.sender === "interrogator"
                          ? "bg-accent/15 border-2 border-accent text-accent font-bold shadow-comic-sm"
                          : "bg-danger/10 border-2 border-danger text-foreground shadow-comic-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex items-center gap-2 text-danger animate-pulse py-2 font-bold">
                  <span className="size-2 bg-danger" />
                  <span>{actor.name} IS RESPONDING...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggested Prompt Buttons */}
            <div className="space-y-2">
              <span className="mono-label text-[10px] text-muted-foreground">
                // SUGGESTED INTERROGATION PROMPTS
              </span>
              <div className="flex flex-wrap gap-2">
                {actor.interviewContext.suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAsk(q)}
                    disabled={isLoading}
                    className="border-2 border-rule hover:border-danger bg-black px-3 py-1.5 text-[11px] text-foreground/80 hover:text-danger transition-colors text-left cursor-pointer"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>

            {/* Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="flex border-2 border-danger bg-black"
            >
              <input
                type="text"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                disabled={isLoading}
                placeholder={`Ask ${actor.name} about motives, timing, or target choices...`}
                aria-label="Question for threat actor interrogation"
                className="flex-1 bg-transparent px-4 py-3 text-xs text-foreground focus:outline-none placeholder:text-muted-foreground font-mono"
              />
              <button
                type="submit"
                disabled={isLoading || !questionInput.trim()}
                className="bg-danger text-white px-6 font-bold text-xs uppercase hover:bg-danger/90 transition-colors disabled:opacity-30 cursor-pointer"
              >
                ASK →
              </button>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}
