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
    Array<{ sender: "interrogator" | "actor"; text: string; timestamp: string; engine?: string }>
  >([]);
  const [questionInput, setQuestionInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

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
        {
          sender: "actor",
          text: res.reply,
          timestamp: res.timestamp,
          engine: res.engine,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "actor",
          text: '[RESEARCHER NOTE: Interview connection interrupted]\n\n"The session was interrupted. All operational discussions are subject to BAU review."',
          timestamp: new Date().toLocaleTimeString(),
          engine: "Connection Degraded",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (idx: number, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanDialogue = text.replace(/^\[RESEARCHER NOTE:[\s\S]*?\]\n*/i, "").replace(/"/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanDialogue);
    utterance.rate = 0.92;
    utterance.pitch = 0.82;
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  const handleClearSession = () => {
    if (typeof window !== "undefined" && speakingIdx !== null) {
      window.speechSynthesis.cancel();
    }
    setMessages([]);
    setSpeakingIdx(null);
  };

  const handleExportTranscript = () => {
    const lines = messages.map((m) => {
      const role = m.sender === "interrogator" ? "SENIOR RESEARCHER" : actor.name.toUpperCase();
      return `[${m.timestamp}] ${role}:\n${m.text}\n`;
    });
    const blob = new Blob(
      [
        `TWINSEC FBI BAU INTERROGATION TRANSCRIPT\nDOSSIER: ${actor.name}\nDATE: ${new Date().toLocaleDateString()}\n==================================================\n\n` +
          lines.join("\n"),
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interrogation_${actor.id}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseMessageText = (text: string) => {
    const match = text.match(/^\[RESEARCHER NOTE:\s*([\s\S]*?)\]\n*/i);
    if (match) {
      return {
        note: match[1].trim(),
        dialogue: text.replace(match[0], "").trim(),
      };
    }
    return { note: null, dialogue: text };
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
                    <dd className="font-bold text-lg mt-1">
                      {actor.psychologicalProfile.patience}
                    </dd>
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
                    <div
                      key={idx}
                      className="group border-2 border-transparent hover:border-ink p-4 transition-all"
                    >
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
            {/* Top Bar: Rec Indicator & Controls */}
            <div className="flex flex-wrap items-center justify-between border-b-4 border-ink p-4 bg-ink text-paper gap-4">
              <div className="flex items-center gap-4">
                <span className="size-3 bg-danger rounded-full animate-pulse shadow-[0_0_8px_#ef4444]" />
                <span className="mono-label text-danger tracking-widest font-bold text-xs md:text-sm">
                  REC {formatRecTime(recordingSeconds)} // INTERROGATION ROOM 4B
                </span>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                {messages.length > 0 && (
                  <>
                    <button
                      onClick={handleExportTranscript}
                      className="px-3 py-1 bg-paper/10 hover:bg-paper/20 border border-paper/30 text-paper transition-all cursor-pointer"
                      title="Download transcript"
                    >
                      💾 EXPORT LOG
                    </button>
                    <button
                      onClick={handleClearSession}
                      className="px-3 py-1 bg-danger/80 hover:bg-danger text-paper transition-all cursor-pointer font-bold"
                      title="Clear interrogation session"
                    >
                      CLEAR SESSION
                    </button>
                  </>
                )}
                <span className="mono-label text-paper/60 hidden sm:inline border-l border-paper/20 pl-3">
                  SUBJECT: {actor.interviewContext.characterName.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Conversation Log Box */}
            <div className="h-[550px] overflow-y-auto space-y-6 p-6 md:p-10 bg-[#f8f5f0] scrollbar-none font-mono">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-ink/50 space-y-4">
                  <div className="text-6xl mb-2 grayscale opacity-50">🎙️</div>
                  <p className="display text-3xl text-ink uppercase">
                    INTERROGATION SESSION ACTIVE
                  </p>
                  <p className="font-serif text-xl italic max-w-md">
                    Select a suggested prompt below or type your inquiry to interrogate{" "}
                    <strong className="text-ink">{actor.name}</strong> on motives, TTPs, or
                    failures.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 border border-ink/20 bg-paper text-xs font-mono text-ink/70 mt-2">
                    <span className="size-2 bg-emerald-500 rounded-full animate-ping" />
                    BAU MINDHUNTER MULTI-PROVIDER AI & DOSSIER ENGINE READY
                  </div>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const { note, dialogue } = parseMessageText(m.text);

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col space-y-2 ${
                        m.sender === "interrogator" ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="flex items-center gap-2 mono-label text-[10px] text-ink/50 px-1">
                        <span>
                          {m.sender === "interrogator"
                            ? "SENIOR RESEARCHER"
                            : actor.name.toUpperCase()}{" "}
                          · {m.timestamp}
                        </span>
                        {m.engine && (
                          <span className="bg-ink/10 px-2 py-0.5 rounded text-[9px] font-bold text-ink/70">
                            {m.engine}
                          </span>
                        )}
                      </div>

                      <div
                        className={`max-w-3xl border-2 transition-all relative ${
                          m.sender === "interrogator"
                            ? "bg-paper border-ink text-ink shadow-[4px_4px_0_0_#1a1a1a] p-5"
                            : "bg-ink border-ink text-paper shadow-[4px_4px_0_0_#ef4444] p-6 space-y-4"
                        }`}
                      >
                        {/* If actor reply has a BAU Researcher Note, render it as a styled badge */}
                        {m.sender === "actor" && note && (
                          <div className="bg-amber-400/20 border-l-4 border-amber-400 p-3 text-amber-200 text-xs font-mono tracking-wide leading-relaxed">
                            <span className="font-bold text-amber-300 block mb-1">
                              🔍 FBI BAU PSYCHOLOGICAL ASSESSMENT:
                            </span>
                            {note}
                          </div>
                        )}

                        <div className="leading-relaxed whitespace-pre-wrap text-sm md:text-base font-serif italic">
                          {m.sender === "actor" ? dialogue : m.text}
                        </div>

                        {/* Speech synthesis audio toggle button for subject answers */}
                        {m.sender === "actor" && (
                          <div className="pt-2 border-t border-paper/20 flex items-center justify-between text-xs font-mono">
                            <button
                              onClick={() => handleSpeak(idx, m.text)}
                              className="text-paper/70 hover:text-amber-400 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              {speakingIdx === idx ? (
                                <>
                                  <span className="size-2 bg-amber-400 rounded-full animate-ping" />
                                  <span>⏸️ PAUSE VOICE</span>
                                </>
                              ) : (
                                <>
                                  <span>🔊 PLAY AUDIO INTERVIEW</span>
                                </>
                              )}
                            </button>
                            <span className="text-[10px] text-paper/40 font-mono">
                              BAU TAPE RECORDING
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {isLoading && (
                <div className="flex items-center gap-3 text-danger animate-pulse py-4 font-bold mono-label">
                  <span className="size-2 bg-danger" />
                  <span>{actor.name.toUpperCase()} IS FORMULATING A RESPONSE...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input & Suggested Prompts Area */}
            <div className="border-t-4 border-ink p-6 md:p-8 bg-paper">
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="mono-label text-ink/50">// SUGGESTED INTERROGATION PROMPTS</span>
                  <span className="mono-label text-[10px] text-ink/40">CLICK TO TRANSMIT</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {actor.interviewContext.suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAsk(q)}
                      disabled={isLoading}
                      className="border-2 border-ink/30 hover:border-ink bg-transparent px-4 py-2.5 mono-label text-[11px] text-ink/80 hover:text-ink transition-all text-left cursor-pointer shadow-none hover:shadow-[2px_2px_0_0_#1a1a1a] hover:-translate-y-0.5"
                    >
                      "{q}"
                    </button>
                  ))}

                  {/* Extra tactical question triggers */}
                  <button
                    onClick={() =>
                      handleAsk(
                        `What security control or defense would have completely stopped your operation?`,
                      )
                    }
                    disabled={isLoading}
                    className="border-2 border-danger/40 hover:border-danger bg-danger/5 px-4 py-2.5 mono-label text-[11px] text-danger font-bold transition-all text-left cursor-pointer shadow-none hover:shadow-[2px_2px_0_0_#ef4444]"
                  >
                    🛡️ "What defense would have stopped you?"
                  </button>
                  <button
                    onClick={() =>
                      handleAsk(`Explain your biggest mistake and how law enforcement caught you.`)
                    }
                    disabled={isLoading}
                    className="border-2 border-danger/40 hover:border-danger bg-danger/5 px-4 py-2.5 mono-label text-[11px] text-danger font-bold transition-all text-left cursor-pointer shadow-none hover:shadow-[2px_2px_0_0_#ef4444]"
                  >
                    🚔 "How did you get caught?"
                  </button>
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
                  placeholder={`Interrogate ${actor.name} on motives, VPN credentials, SCADA setpoints, or failures...`}
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
