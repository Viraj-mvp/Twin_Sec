import { useState } from "react";
import { loginOperator, registerOperator } from "@/lib/api/auth.functions";
import { useOperator } from "@/contexts/OperatorContext";

interface SimulationAuthGateProps {
  isOpen: boolean;
  sector: string;
  onLoginSuccess: () => void;
  onRegisterSuccess: () => void;
  onContinueAsGuest: () => void;
}

type AuthView = "choice" | "login" | "register";

export function SimulationAuthGate({
  isOpen,
  sector,
  onLoginSuccess,
  onRegisterSuccess,
  onContinueAsGuest,
}: SimulationAuthGateProps) {
  const [view, setView] = useState<AuthView>("choice");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { refresh } = useOperator();

  // Sign-In form state
  const [callsignLogin, setCallsignLogin] = useState("");
  const [passwordLogin, setPasswordLogin] = useState("");

  // Register form state
  const [callsignRegister, setCallsignRegister] = useState("");
  const [emailRegister, setEmailRegister] = useState("");
  const [passwordRegister, setPasswordRegister] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginOperator({
        data: {
          email: callsignLogin.trim(),
          password: passwordLogin.trim(),
        },
      });
      refresh();
      onLoginSuccess();
    } catch (err: unknown) {
      setError(
        (err as Error)?.message || "Authentication failed. Invalid email/callsign or password.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const cleanCallsign = callsignRegister.trim();
    const cleanEmail = emailRegister.trim().toLowerCase();
    if (cleanCallsign.length < 3 || cleanCallsign.length > 20) {
      setError("Callsign must be 3-20 characters.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Valid email address is required.");
      return;
    }
    if (passwordRegister.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const generatedBadge = `OP-${Math.floor(1000 + Math.random() * 9000)}`;
      await registerOperator({
        data: {
          callsign: cleanCallsign,
          email: cleanEmail,
          badgeId: generatedBadge,
          clearance: "TS/SCI · RED LEVEL",
          password: passwordRegister.trim(),
        },
      });

      refresh();
      onRegisterSuccess();
    } catch (err: unknown) {
      setError((err as Error)?.message || "Operator registration failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const sectorName =
    sector === "power"
      ? "POWER SECTOR · HOLLOW"
      : sector === "water"
        ? "WATER SECTOR · BASIN"
        : sector === "oil-gas"
          ? "OIL & GAS · SEVENTH-BREATH"
          : sector === "manufacturing"
            ? "MANUFACTURING · MISFIRE"
            : sector === "port"
              ? "LOGISTICS · MANIFEST"
              : sector === "smart-building"
                ? "SMART BUILDING · STILL-AIR"
                : `${sector.toUpperCase()} SECTOR`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 select-none">
      <div className="bg-[#121214] border-3 border-black p-6 sm:p-8 w-full max-w-[560px] shadow-[8px_8px_0px_0px_#BFFF2E] relative font-mono text-[#F5F3E7]">
        {/* Choice view */}
        {view === "choice" && (
          <div className="flex flex-col gap-6">
            <div>
              <div className="inline-block bg-[#BFFF2E] text-black px-2.5 py-0.5 text-[10px] font-black uppercase border border-black shadow-[2px_2px_0px_0px_#000000] mb-2">
                ★ CTF AUTHENTICATION REQUIRED
              </div>
              <h2 className="display text-3xl text-[#F5F3E7] leading-none">
                LAUNCHING: {sectorName}
              </h2>
              <p className="mt-4 font-mono text-xs text-muted-foreground leading-relaxed">
                Authenticate your CTF key to save your training record and access the full debrief
                engine. Or continue as a guest.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a
                href={`/login?from=/simulation&sector=${sector}`}
                className="bg-[#BFFF2E] text-black border-2 border-black px-4 py-3.5 font-mono text-xs font-black hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform text-center flex items-center justify-center gap-1 shadow-[3px_3px_0px_0px_#F5F3E7]"
              >
                ▶ SIGN-IN PORTAL
              </a>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setView("register");
                }}
                className="bg-[#27272A] text-[#F5F3E7] border-2 border-black px-4 py-3.5 font-mono text-xs font-bold hover:bg-[#3F3F46] transition-colors text-center shadow-[3px_3px_0px_0px_#000000]"
              >
                + INITIALIZE PROFILE
              </button>
            </div>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-0.5 bg-black" />
              <span className="bg-[#27272A] text-[#BFFF2E] font-black px-2 py-0.5 text-[10px] border border-black">
                OR
              </span>
              <div className="flex-1 h-0.5 bg-black" />
            </div>

            <button
              type="button"
              onClick={onContinueAsGuest}
              className="border-2 border-black bg-[#09090B] p-4 text-left hover:bg-[#18181B] transition-colors group shadow-[3px_3px_0px_0px_#000000]"
            >
              <span className="mono-label block text-xs font-extrabold group-hover:text-[#BFFF2E] transition-colors">
                CONTINUE AS GUEST →
              </span>
              <span className="block text-[11px] text-muted-foreground font-mono mt-1">
                No score saved · Debrief watermarked · Replay link disabled
              </span>
            </button>
          </div>
        )}

        {/* Sign-In view */}
        {view === "login" && (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-6">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setView("choice");
              }}
              className="bg-[#27272A] text-[#F5F3E7] border border-black px-2 py-1 text-xs font-bold text-left hover:text-[#BFFF2E] transition-colors w-max shadow-[2px_2px_0px_0px_#000000]"
            >
              ← BACK TO GATE
            </button>

            <div>
              <span className="bg-[#BFFF2E] text-black px-2.5 py-0.5 text-[10px] font-black uppercase border border-black">
                OPERATOR SIGN-IN
              </span>
              <h2 className="display text-2xl mt-2 leading-none">LAUNCHING: {sectorName}</h2>
            </div>

            {error && (
              <div className="border-2 border-black bg-red-500/20 p-3 text-red-300 font-mono text-xs font-bold shadow-[3px_3px_0px_0px_#EF4444]">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mono-label block text-xs mb-1.5 font-bold uppercase text-[#F5F3E7]">
                  [root@twinsec-ctf ~]$ auth --user
                </label>
                <input
                  type="text"
                  disabled={loading}
                  value={callsignLogin}
                  onChange={(e) => setCallsignLogin(e.target.value)}
                  placeholder="operator@twinsec.io or CALLSIGN"
                  className="w-full bg-[#18181B] border-2 border-black px-3 py-2.5 outline-none focus:border-[#BFFF2E] font-mono text-xs text-[#BFFF2E] shadow-[3px_3px_0px_0px_#000000] disabled:opacity-50"
                  required
                />
              </div>
              <div>
                <label className="mono-label block text-xs mb-1.5 font-bold uppercase text-[#F5F3E7]">
                  [root@twinsec-ctf ~]$ auth --pass
                </label>
                <input
                  type="password"
                  disabled={loading}
                  value={passwordLogin}
                  onChange={(e) => setPasswordLogin(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#18181B] border-2 border-black px-3 py-2.5 outline-none focus:border-[#BFFF2E] font-mono text-xs text-[#BFFF2E] shadow-[3px_3px_0px_0px_#000000] disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#BFFF2E] text-black border-2 border-black px-4 py-3.5 mono-label text-xs font-black hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform disabled:opacity-50 shadow-[3px_3px_0px_0px_#F5F3E7]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-2 bg-black animate-ping rounded-full" />
                  AUTHENTICATING...
                </span>
              ) : (
                "AUTHENTICATE & LAUNCH →"
              )}
            </button>
          </form>
        )}

        {/* Register view */}
        {view === "register" && (
          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-6">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setView("choice");
              }}
              className="bg-[#27272A] text-[#F5F3E7] border border-black px-2 py-1 text-xs font-bold text-left hover:text-[#BFFF2E] transition-colors w-max shadow-[2px_2px_0px_0px_#000000]"
            >
              ← BACK TO GATE
            </button>

            <div>
              <span className="bg-[#F5F3E7] text-black px-2.5 py-0.5 text-[10px] font-black uppercase border border-black">
                REGISTER OPERATOR DOSSIER
              </span>
              <h2 className="display text-2xl mt-2 leading-none">LAUNCHING: {sectorName}</h2>
            </div>

            {error && (
              <div className="border-2 border-black bg-red-500/20 p-3 text-red-300 font-mono text-xs font-bold shadow-[3px_3px_0px_0px_#EF4444]">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mono-label block text-xs mb-1.5 font-bold uppercase text-[#F5F3E7]">
                  [root@twinsec-ctf ~]$ set --callsign
                </label>
                <input
                  type="text"
                  disabled={loading}
                  value={callsignRegister}
                  onChange={(e) => setCallsignRegister(e.target.value)}
                  maxLength={20}
                  placeholder="e.g. SPECTER_01"
                  className="w-full bg-[#18181B] border-2 border-black px-3 py-2.5 outline-none focus:border-[#BFFF2E] font-mono text-xs text-[#BFFF2E] shadow-[3px_3px_0px_0px_#000000] disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="mono-label block text-xs mb-1.5 font-bold uppercase text-[#F5F3E7]">
                  [root@twinsec-ctf ~]$ set --email
                </label>
                <input
                  type="email"
                  disabled={loading}
                  value={emailRegister}
                  onChange={(e) => setEmailRegister(e.target.value)}
                  placeholder="operator@facility.com"
                  className="w-full bg-[#18181B] border-2 border-black px-3 py-2.5 outline-none focus:border-[#BFFF2E] font-mono text-xs text-[#BFFF2E] shadow-[3px_3px_0px_0px_#000000] disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="mono-label block text-xs mb-1.5 font-bold uppercase text-[#F5F3E7]">
                  [root@twinsec-ctf ~]$ set --password
                </label>
                <input
                  type="password"
                  disabled={loading}
                  value={passwordRegister}
                  onChange={(e) => setPasswordRegister(e.target.value)}
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full bg-[#18181B] border-2 border-black px-3 py-2.5 outline-none focus:border-[#BFFF2E] font-mono text-xs text-[#BFFF2E] shadow-[3px_3px_0px_0px_#000000] disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#BFFF2E] text-black border-2 border-black px-4 py-3.5 mono-label text-xs font-black hover:-translate-x-0.5 hover:-translate-y-0.5 transition-transform disabled:opacity-50 shadow-[3px_3px_0px_0px_#F5F3E7]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-2 bg-black animate-ping rounded-full" />
                  AUTHENTICATING...
                </span>
              ) : (
                "REGISTER & LAUNCH →"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
