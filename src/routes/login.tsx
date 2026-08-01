import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  User,
  ShieldAlert,
  Terminal,
  Zap,
  Lock,
  ArrowRight,
  ShieldCheck,
  FolderLock,
} from "lucide-react";
import { loginOperator } from "@/lib/api/auth.functions";
import { saveLocalSession, useOperatorSession } from "@/lib/auth-store";
import { useOperator } from "@/contexts/OperatorContext";
import { TwinSecLogo } from "@/components/TwinSecLogo";
import { CyberNetworkCanvas } from "@/components/CyberNetworkCanvas";
import { CyberRadarCanvas } from "@/components/CyberRadarCanvas";
import { log } from "@/lib/logger";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { from?: string; mode?: string } => ({
    from: typeof search.from === "string" ? search.from : undefined,
    mode:
      typeof search.mode === "string" && (search.mode === "signup" || search.mode === "register")
        ? "signup"
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "TwinSec — Operator Sign-In & Tactical Gateway" },
      {
        name: "description",
        content:
          "Authenticate operator credentials or initialize a new cyber-physical range profile via Neural Access.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: "/login" });
  const { from } = searchParams;
  const { session, loading: sessionLoading } = useOperatorSession();
  const { operator, loading: operatorLoading, refresh } = useOperator();

  const loading = sessionLoading || operatorLoading;
  const activeSession = operator?.loggedIn ? operator : session;

  const [isRegister, setIsRegister] = useState(searchParams.mode === "signup");

  // Sign-In Form State
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // UX & Security States
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Redirect ONLY when loading is finished AND session is authenticated.
  useEffect(() => {
    if (!loading && activeSession.loggedIn) {
      const dest =
        from && typeof from === "string" && !from.includes("/login") && !from.includes("/signup")
          ? from
          : "/dashboard";
      navigate({ to: dest as never });
    }
  }, [loading, activeSession.loggedIn, navigate, from]);

  // Handle Caps Lock detection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState("CapsLock"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanIdent = loginIdentifier.trim();
    const cleanPassword = loginPassword.trim();

    if (!cleanIdent) {
      setErrorMsg("Email address or callsign is required.");
      return;
    }
    if (!cleanPassword) {
      setErrorMsg("Operator sequence password is required.");
      return;
    }

    setIsAuthorizing(true);
    try {
      const authSession = await loginOperator({
        data: {
          email: cleanIdent,
          password: cleanPassword,
        },
      });

      saveLocalSession({
        callsign: authSession.operator.callsign,
        badgeId: authSession.operator.badgeId || "OP-0000",
        clearance: authSession.operator.clearance || "TS/SCI · RED LEVEL",
        loggedIn: true,
      });

      await refresh();
      const dest =
        from && typeof from === "string" && !from.includes("/login") && !from.includes("/signup")
          ? from
          : "/dashboard";
      navigate({ to: dest as never });
    } catch (err: unknown) {
      log.error("Sign-in authentication error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Authentication transaction failed.");
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#09090B] text-black flex items-center justify-center relative p-3 sm:p-4 lg:p-6 select-none overflow-hidden font-mono">
      {/* 60fps Interactive Radar Canvas Background */}
      <CyberRadarCanvas className="opacity-60" />
      <CyberNetworkCanvas className="opacity-30" />
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none z-0" />
      <div className="absolute inset-0 scanline opacity-30 pointer-events-none z-0" />

      {/* CLASSIFIED DOSSIER FOLDER CARD (BONE CREAM PAPER THEME) */}
      <main className="relative z-10 w-full max-w-4xl max-h-[92vh] bg-[#F5F3E7] border-4 border-black shadow-[12px_12px_0px_0px_#000000] p-4 sm:p-5 lg:p-8 space-y-4 overflow-y-auto flex flex-col justify-between">
        {/* Top Folder Tab Header & Stamped Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-3 border-black pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: "/signup", search: { from } as never })}
              className="bg-black text-[#F5F3E7] hover:bg-[#BFFF2E] hover:text-black transition-colors px-3 py-1.5 font-mono text-[11px] font-black uppercase border-2 border-black flex items-center gap-2 shadow-[2px_2px_0px_0px_#000000] cursor-pointer"
            >
              <User className="size-3.5" />
              <span>NEW OPERATOR? SIGN-UP HERE →</span>
            </button>
          </div>

          {/* Rotated Stamped Security Badges */}
          <div className="flex items-center gap-2">
            <span className="bg-[#BFFF2E] text-black font-black text-[10px] uppercase px-2.5 py-0.5 border border-black shadow-[2px_2px_0px_0px_#000000] transform -rotate-1">
              ★ AUTHENTICATION GATEWAY
            </span>
            <span className="bg-black text-[#BFFF2E] font-black text-[10px] uppercase px-2.5 py-0.5 border border-black shadow-[2px_2px_0px_0px_#000000] transform rotate-1">
              RESTRICTED // LEVEL 4
            </span>
          </div>
        </div>

        {/* Dossier Header & Visible TwinSec Logo */}
        <div className="space-y-1.5">
          <div>
            <TwinSecLogo showWordmark variant="light" size={38} />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Terminal className="size-7 text-black shrink-0" />
            <h1 className="display text-2xl sm:text-3xl lg:text-4xl text-black uppercase tracking-wide leading-none">
              OPERATOR SIGN-IN
            </h1>
          </div>
        </div>

        {/* Error Callout */}
        {errorMsg && (
          <div className="border-3 border-black bg-red-500/20 p-3.5 font-mono text-xs text-red-900 font-bold flex items-start gap-3 shadow-[3px_3px_0px_0px_#EF4444]">
            <ShieldAlert className="size-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="block font-black text-xs uppercase tracking-wider">
                AUTHENTICATION ERROR
              </span>
              <span className="text-[11px] font-bold">{errorMsg}</span>
            </div>
          </div>
        )}

        {/* HIGH-CONTRAST PAPER DOSSIER FORM */}
        <form autoComplete="off" onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="bg-white border-3 border-black p-4 space-y-3 shadow-[4px_4px_0px_0px_#000000]">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <span className="bg-black text-[#F5F3E7] font-black text-[10px] uppercase tracking-widest px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_#000000]">
                01 // CREDENTIAL AUTHENTICATION
              </span>
              <Lock className="size-3.5 text-black" />
            </div>

            {/* Callsign / Email Input */}
            <div className="space-y-1">
              <label
                htmlFor="login-ident"
                className="mono-label block text-[9px] font-black text-black uppercase"
              >
                OPERATOR CALLSIGN / EMAIL ADDRESS *
              </label>
              <div className="relative">
                <input
                  id="login-ident"
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. SPECTER_01 OR operator@twinsec.io"
                  required
                  disabled={isAuthorizing}
                  className="w-full border-3 border-black bg-[#F5F3E7] px-3 py-2.5 font-mono text-xs text-black font-extrabold placeholder:text-zinc-500 outline-none focus:border-black focus:bg-amber-100/50 transition-colors shadow-[2px_2px_0px_0px_#000000] disabled:opacity-50"
                />
                <User className="absolute right-3 top-2.5 size-4 text-black/70 pointer-events-none" />
              </div>
            </div>

            {/* Password Sequence Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-pwd"
                  className="mono-label block text-[9px] font-black text-black uppercase"
                >
                  SEQUENCE KEY (PASSWORD) *
                </label>
                {capsLockActive && (
                  <span className="bg-amber-400 text-black font-black text-[9px] px-1.5 py-0.5 border border-black shadow-[1px_1px_0px_0px_#000000]">
                    ⚠️ CAPS LOCK ON
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="login-pwd"
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••••••"
                  required
                  disabled={isAuthorizing}
                  className="w-full border-3 border-black bg-[#F5F3E7] px-3 py-2.5 pr-9 font-mono text-xs text-black font-extrabold placeholder:text-zinc-500 outline-none focus:border-black focus:bg-amber-100/50 transition-colors shadow-[2px_2px_0px_0px_#000000] disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-black/70 hover:text-black transition-colors cursor-pointer"
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Remember Token Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-mono text-[10px] text-zinc-800 hover:text-black font-bold">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#BFFF2E] size-4 bg-white border-2 border-black cursor-pointer"
                />
                <span className="uppercase font-black text-black">PERSIST SESSION TOKEN</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  setErrorMsg(
                    "Recovery protocol: Contact administrator or re-register with authorized callsign.",
                  )
                }
                className="font-mono text-[9px] text-black font-extrabold hover:underline uppercase tracking-wider bg-[#BFFF2E] px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_#000000]"
              >
                RECOVERY?
              </button>
            </div>
          </div>

          {/* High-Contrast Acid Lime Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isAuthorizing}
              className="w-full bg-[#BFFF2E] text-black border-3 border-black py-3 font-mono text-xs font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_#000000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-0 active:translate-y-0 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAuthorizing ? (
                <>
                  <span className="size-3 bg-black animate-ping" />
                  <span>AUTHENTICATING TRANSACTION...</span>
                </>
              ) : (
                <>
                  <Zap className="size-4 text-black fill-black" />
                  <span>AUTHENTICATE OPERATOR SIGN-IN →</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t-3 border-black pt-3 font-mono text-[10px] text-zinc-700 font-bold">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="hover:text-black uppercase tracking-wider transition-colors font-black flex items-center gap-1"
          >
            ← RETURN TO LANDING
          </button>
          <span className="bg-black text-[#F5F3E7] px-2 py-0.5 border border-black font-black">
            TWINSEC v1
          </span>
        </footer>
      </main>
    </div>
  );
}
