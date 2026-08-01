import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import React, { useState } from "react";
import {
  ShieldCheck,
  UserPlus,
  ArrowLeft,
  AlertCircle,
  Key,
  FolderLock,
  Stamp,
  Shuffle,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { registerOperator, saveLocalSession, useOperator } from "@features/auth";
import { TwinSecLogo } from "@/components/TwinSecLogo";
import { CyberNetworkCanvas } from "@/components/CyberNetworkCanvas";
import { log } from "@/lib/logger";
import { CyberRadarCanvas } from "@/components/CyberRadarCanvas";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): { from?: string } => ({
    from: typeof search.from === "string" ? search.from : undefined,
  }),
  head: () => ({
    meta: [
      { title: "TwinSec — Classified Operator Dossier Registration" },
      {
        name: "description",
        content:
          "Initialize a new encrypted TwinSec operator dossier and assign security clearance level.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: "/signup" });
  const { from } = searchParams;
  const { refresh } = useOperator();

  // Dossier Registration Form State
  const [callsign, setCallsign] = useState("");
  const [email, setEmail] = useState("");
  const [clearance, setClearance] = useState("TS/SCI · RED LEVEL");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate Random Tactical Callsign
  const generateRandomCallsign = () => {
    const prefixes = [
      "CYBER",
      "SPECTER",
      "APEX",
      "NEXUS",
      "ZERO",
      "DELTA",
      "GHOST",
      "VORTEX",
      "SCADA",
    ];
    const suffixes = ["01", "09", "44", "77", "99", "X", "PRIME", "VIPER", "GRID"];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    setCallsign(`${randomPrefix}_${randomSuffix}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCallsign = callsign.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanCallsign) {
      setErrorMsg("Callsign is required for dossier initialization.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("A valid operator email address is required.");
      return;
    }
    if (cleanPassword.length < 6) {
      setErrorMsg("Password sequence key must be at least 6 characters.");
      return;
    }
    if (confirmPassword.trim() !== cleanPassword) {
      setErrorMsg("Sequence key confirmation mismatch. Verify keys.");
      return;
    }

    setIsSubmitting(true);
    try {
      const assignedBadge = `OP-${Math.floor(1000 + Math.random() * 9000)}`;
      const regRes = await registerOperator({
        data: {
          callsign: cleanCallsign,
          email: cleanEmail,
          badgeId: assignedBadge,
          clearance,
          password: cleanPassword,
        },
      });

      saveLocalSession({
        callsign: regRes.operator.callsign,
        badgeId: regRes.operator.badgeId || "OP-0000",
        clearance: regRes.operator.clearance || "TS/SCI · RED LEVEL",
        loggedIn: true,
      });

      await refresh();
      const dest =
        from && typeof from === "string" && !from.includes("/login") && !from.includes("/signup")
          ? from
          : "/dashboard";
      navigate({ to: dest as never });
    } catch (err: unknown) {
      log.error("Dossier registration failed:", err);
      setErrorMsg(err instanceof Error ? err.message : "Operator dossier registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#09090B] text-black flex items-center justify-center relative p-3 sm:p-4 lg:p-6 select-none overflow-hidden font-mono">
      {/* Interactive 60fps SCADA Cyber Radar Background (0 KB download) */}
      <CyberRadarCanvas className="opacity-60" />
      <CyberNetworkCanvas className="opacity-30" />
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none z-0" />
      <div className="absolute inset-0 scanline opacity-30 pointer-events-none z-0" />

      {/* CLASSIFIED DOSSIER FOLDER CARD */}
      <main className="relative z-10 w-full max-w-4xl max-h-[92vh] bg-[#F5F3E7] border-4 border-black shadow-[12px_12px_0px_0px_#000000] p-4 sm:p-5 lg:p-8 space-y-4 overflow-y-auto flex flex-col justify-between">
        {/* Top Folder Tab Header & Stamped Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-3 border-black pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: "/login", search: { from } as never })}
              className="bg-black text-[#F5F3E7] hover:bg-[#BFFF2E] hover:text-black transition-colors px-3 py-1.5 font-mono text-[11px] font-black uppercase border-2 border-black flex items-center gap-2 shadow-[2px_2px_0px_0px_#000000] cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span>SIGN-IN HERE →</span>
            </button>
          </div>

          {/* Rotated Stamped Security Badge */}
          <div className="flex items-center gap-2">
            <span className="bg-[#F59E0B] text-black font-black text-[10px] uppercase px-2.5 py-0.5 border border-black shadow-[2px_2px_0px_0px_#000000] transform -rotate-1">
              ★ CLASSIFIED DOSSIER FILE
            </span>
            <span className="bg-red-500 text-white font-black text-[10px] uppercase px-2.5 py-0.5 border border-black shadow-[2px_2px_0px_0px_#000000] transform rotate-1">
              RESTRICTED // LEVEL 4
            </span>
          </div>
        </div>

        {/* Dossier Header & Prominent Logo */}
        <div className="space-y-1.5">
          <div>
            <TwinSecLogo showWordmark variant="light" size={38} />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <FolderLock className="size-7 text-black shrink-0" />
            <h1 className="display text-2xl sm:text-3xl lg:text-4xl text-black uppercase tracking-wide leading-none">
              INITIALIZE OPERATOR DOSSIER
            </h1>
          </div>
        </div>

        {/* Registration Error Notification */}
        {errorMsg && (
          <div className="border-3 border-black bg-red-500/20 p-4 font-mono text-xs text-red-900 font-bold flex items-start gap-3 shadow-[4px_4px_0px_0px_#EF4444]">
            <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="block font-black text-xs uppercase tracking-wider">
                DOSSIER REGISTRATION ERROR
              </span>
              <span className="text-[11px] font-bold">{errorMsg}</span>
            </div>
          </div>
        )}

        {/* CLASSIFIED DOSSIER FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Operator Credentials */}
            <div className="space-y-3 bg-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000000]">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <span className="bg-black text-[#F5F3E7] font-black text-[10px] uppercase tracking-widest px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_#000000]">
                  01 // CREDENTIAL SPECIFICATIONS
                </span>
                <Stamp className="size-3.5 text-black" />
              </div>

              {/* Callsign Input with Randomizer */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="signup-cs"
                    className="mono-label block text-[9px] font-black text-black uppercase"
                  >
                    OPERATOR CALLSIGN *
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomCallsign}
                    className="font-mono text-[9px] font-black bg-[#BFFF2E] text-black px-1.5 py-0.5 border border-black uppercase shadow-[1px_1px_0px_0px_#000000] hover:bg-lime-400 cursor-pointer flex items-center gap-1"
                  >
                    <Shuffle className="size-2.5" />
                    GENERATE ⚡
                  </button>
                </div>
                <input
                  id="signup-cs"
                  type="text"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  placeholder="e.g. CYBER_VIPER_09"
                  required
                  disabled={isSubmitting}
                  className="w-full border-3 border-black bg-[#F5F3E7] px-3 py-2.5 font-mono text-xs text-black font-extrabold placeholder:text-zinc-500 outline-none focus:border-black focus:bg-amber-100/50 transition-colors shadow-[2px_2px_0px_0px_#000000] disabled:opacity-50"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label
                  htmlFor="signup-email"
                  className="mono-label block text-[9px] font-black text-black uppercase"
                >
                  REGISTRAR EMAIL ADDRESS *
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@twinsec.io"
                  required
                  disabled={isSubmitting}
                  className="w-full border-3 border-black bg-[#F5F3E7] px-3 py-2.5 font-mono text-xs text-black font-extrabold placeholder:text-zinc-500 outline-none focus:border-black focus:bg-amber-100/50 transition-colors shadow-[2px_2px_0px_0px_#000000] disabled:opacity-50"
                />
              </div>

              {/* Security Clearance Selection */}
              <div className="space-y-1">
                <label
                  htmlFor="signup-clearance"
                  className="mono-label block text-[9px] font-black text-black uppercase"
                >
                  SECURITY CLEARANCE LEVEL
                </label>
                <select
                  id="signup-clearance"
                  value={clearance}
                  onChange={(e) => setClearance(e.target.value)}
                  className="w-full border-3 border-black bg-[#F5F3E7] px-3 py-2.5 font-mono text-xs text-black font-extrabold outline-none focus:border-black cursor-pointer transition-colors shadow-[2px_2px_0px_0px_#000000]"
                >
                  <option value="TS/SCI · RED LEVEL">TS/SCI · RED LEVEL (FULL OT RANGE)</option>
                  <option value="SECRET · BLUE LEVEL">SECRET · BLUE LEVEL (SIMULATOR ONLY)</option>
                  <option value="UNRESTRICTED">UNRESTRICTED (OBSERVER MODE)</option>
                </select>
              </div>
            </div>

            {/* Right Column: Key Hardening */}
            <div className="space-y-3 bg-white border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000000]">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <span className="bg-[#F59E0B] text-black font-black text-[10px] uppercase tracking-widest px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_#000000]">
                  02 // KEY HARDENING
                </span>
                <Key className="size-3.5 text-black" />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label
                  htmlFor="signup-pwd"
                  className="mono-label block text-[9px] font-black text-black uppercase"
                >
                  SEQUENCE KEY (PASSWORD) *
                </label>
                <input
                  id="signup-pwd"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={6}
                  disabled={isSubmitting}
                  className="w-full border-3 border-black bg-[#F5F3E7] px-3 py-2.5 font-mono text-xs text-black font-extrabold placeholder:text-zinc-500 outline-none focus:border-black focus:bg-amber-100/50 transition-colors shadow-[2px_2px_0px_0px_#000000] disabled:opacity-50"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label
                  htmlFor="signup-confirm"
                  className="mono-label block text-[9px] font-black text-black uppercase"
                >
                  CONFIRM SEQUENCE KEY *
                </label>
                <input
                  id="signup-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={isSubmitting}
                  className="w-full border-3 border-black bg-[#F5F3E7] px-3 py-2.5 font-mono text-xs text-black font-extrabold placeholder:text-zinc-500 outline-none focus:border-black focus:bg-amber-100/50 transition-colors shadow-[2px_2px_0px_0px_#000000] disabled:opacity-50"
                />
              </div>

              {/* Key Entropy Meter */}
              <div className="bg-[#F5F3E7] border-2 border-black p-2 space-y-1">
                <div className="flex items-center justify-between text-[9px] font-black uppercase">
                  <span>KEY ENTROPY SCORE</span>
                  <span
                    className={
                      password.length >= 8
                        ? "text-emerald-700 font-extrabold"
                        : "text-amber-700 font-extrabold"
                    }
                  >
                    {password.length >= 8 ? "OPTIMAL HARDENING" : "MINIMUM 6 CHARS"}
                  </span>
                </div>
                <div className="h-1.5 bg-white border border-black overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-300 ${
                      password.length >= 10
                        ? "w-full bg-emerald-500"
                        : password.length >= 6
                          ? "w-2/3 bg-amber-400"
                          : "w-1/3 bg-red-400"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* High-Contrast Warning Amber Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#F59E0B] text-black border-3 border-black py-3 font-mono text-xs font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_#000000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-0 active:translate-y-0 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="size-3 bg-black animate-ping" />
                  <span>COMMITTING DOSSIER TRANSACTION...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 text-black" />
                  <span>INITIALIZE OPERATOR DOSSIER &amp; GRANT CLEARANCE →</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t-3 border-black pt-4 font-mono text-[10px] text-zinc-700 font-bold">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="hover:text-black uppercase tracking-wider transition-colors font-black flex items-center gap-1"
          >
            ← RETURN TO LANDING
          </button>
          <span className="bg-black text-[#F5F3E7] px-2 py-0.5 border border-black font-black">
            CLASSIFIED // TWINSEC v1
          </span>
        </footer>
      </main>
    </div>
  );
}
