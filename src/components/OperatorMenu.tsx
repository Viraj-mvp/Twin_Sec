import { useState } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LogIn,
  UserPlus,
  LogOut,
  LayoutDashboard,
  Radar,
  Settings2,
  ShieldCheck,
  Crosshair,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOperatorSession } from "@/lib/auth-store";
import { loginOperator, registerOperator } from "@/lib/api/auth.functions";
import { CyberMatrixTrigger } from "./CyberMatrixTrigger";

type AuthMode = "login" | "register";

function initials(callsign: string): string {
  const parts = callsign
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function OperatorMenu() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { session, refresh, logout } = useOperatorSession();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  // Form state
  const [callsign, setCallsign] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loggedIn = session.loggedIn;

  const resetForm = () => {
    setCallsign("");
    setEmail("");
    setPassword("");
    setError(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await loginOperator({ data: { email: callsign.trim(), password: password.trim() } });
      } else {
        await registerOperator({
          data: {
            callsign: callsign.trim(),
            email:
              email.trim() ||
              `${callsign
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "")}@facility.com`,
            password: password.trim(),
          },
        });
      }
      await refresh();
      resetForm();
      setOpen(false);
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate({ to: "/" });
  };

  const go = (to: string) => {
    setOpen(false);
    navigate({ to: to as never });
  };

  return null;
  function AuthView({
    mode,
    setMode,
    callsign,
    setCallsign,
    email,
    setEmail,
    password,
    setPassword,
    error,
    busy,
    onSubmit,
  }: {
    mode: AuthMode;
    setMode: (m: AuthMode) => void;
    callsign: string;
    setCallsign: (v: string) => void;
    email: string;
    setEmail: (v: string) => void;
    password: string;
    setPassword: (v: string) => void;
    error: string | null;
    busy: boolean;
    onSubmit: (e: React.FormEvent) => void;
  }) {
    return (
      <div>
        <div className="flex items-center justify-between border-b border-rule px-4 py-3">
          <div className="flex items-center gap-2">
            <Crosshair className="size-4 text-accent" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/70">
              TwinSec // Operator Access
            </span>
          </div>
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
        </div>

        <div className="grid grid-cols-2 gap-px bg-rule">
          <button
            onClick={() => setMode("login")}
            className={cn(
              "bg-card px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors",
              mode === "login" ? "text-accent" : "text-foreground/40 hover:text-foreground/70",
            )}
          >
            Sign-In
          </button>
          <button
            onClick={() => setMode("register")}
            className={cn(
              "bg-card px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors",
              mode === "register" ? "text-accent" : "text-foreground/40 hover:text-foreground/70",
            )}
          >
            Sign-Up
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 p-4">
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-foreground/50">
              Callsign
            </label>
            <input
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              placeholder="e.g. N. ARENS"
              autoComplete="username"
              required
              className="w-full border border-rule bg-black/40 px-3 py-2 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-foreground/50">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@facility.com"
                type="email"
                autoComplete="email"
                className="w-full border border-rule bg-black/40 px-3 py-2 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-foreground/50">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={mode === "register" ? 8 : undefined}
              className="w-full border border-rule bg-black/40 px-3 py-2 font-mono text-sm text-foreground outline-none transition-colors focus:border-accent"
            />
          </div>

          {error && (
            <div className="border-l-2 border-danger bg-danger/10 px-3 py-2 font-mono text-xs text-danger">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={busy}
            className="w-full bg-accent font-mono text-xs font-bold uppercase tracking-widest text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <span className="size-2 animate-ping rounded-full bg-accent-foreground" />
                Authenticating…
              </span>
            ) : mode === "login" ? (
              <>
                <LogIn className="size-4" /> Authenticate
              </>
            ) : (
              <>
                <UserPlus className="size-4" /> Initialize Operator
              </>
            )}
          </Button>
        </form>
      </div>
    );
  }

  function LoggedInView({
    callsign,
    badgeId,
    clearance,
    onNavigate,
    onLogout,
  }: {
    callsign: string;
    badgeId: string;
    clearance: string;
    onNavigate: (to: string) => void;
    onLogout: () => void;
  }) {
    const items = [
      { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
      { label: "Simulation Range", icon: Radar, to: "/simulation" },
      { label: "Settings", icon: Settings2, to: "/dashboard" },
    ];

    return (
      <div>
        <div className="flex items-center gap-3 border-b border-rule px-4 py-3">
          <Avatar className="size-11">
            <AvatarFallback className="bg-accent/15 font-mono text-sm text-accent">
              {initials(callsign)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-mono text-sm font-bold text-foreground">{callsign}</p>
            <p className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-accent/80">
              <ShieldCheck className="size-3" /> {clearance}
            </p>
          </div>
        </div>

        <div className="px-2 py-2">
          <p className="px-2 pb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/40">
            Badge {badgeId}
          </p>
          <div className="space-y-1">
            {items.map((it) => (
              <button
                key={it.label}
                onClick={() => onNavigate(it.to)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left font-mono text-xs text-foreground/80 transition-colors hover:bg-accent/10 hover:text-accent"
              >
                <it.icon className="size-4 text-foreground/50" />
                {it.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-rule p-2">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-md px-2 py-2 font-mono text-xs text-danger transition-colors hover:bg-danger/10"
          >
            <LogOut className="size-4" /> Terminate Session
          </button>
        </div>
      </div>
    );
  }
}
