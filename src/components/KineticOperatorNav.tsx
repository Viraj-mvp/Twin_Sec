import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "@tanstack/react-router";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LogIn,
  UserPlus,
  LogOut,
  LayoutDashboard,
  Target,
  Shield,
  Cpu,
  BookOpen,
  FileText,
  Search,
  Key,
  ShieldCheck,
  Terminal,
  Activity,
  Zap,
  Radio,
  Clock,
  Sparkles,
} from "lucide-react";
import { CyberMatrixTrigger } from "./CyberMatrixTrigger";
import { useOperatorSession, saveLocalSession } from "@/lib/auth-store";
import { useOperator } from "@/contexts/OperatorContext";
import { loginOperator, registerOperator } from "@/lib/api/auth.functions";
import { log } from "@/lib/logger";

function initials(name: string): string {
  const parts = name.trim().split(/[\s_-]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function KineticOperatorNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading: sessionLoading } = useOperatorSession();
  const { operator, loading: operatorLoading, logout } = useOperator();

  const activeSession = operator?.loggedIn ? operator : session;
  const loggedIn = activeSession.loggedIn;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  // Inline Auth Form State
  const [callsign, setCallsign] = useState("");
  const [email, setEmail] = useState("");
  const [clearance, setClearance] = useState("TS/SCI · RED LEVEL");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimatingRef = useRef(false);

  const go = useCallback(
    (to: string) => {
      closeMenu();
      navigate({ to: to as never });
    },
    [navigate],
  );

  // Keyboard Shortcuts (1-5 hotkeys, ESC close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside an input/textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "Escape" && isMenuOpen) {
        closeMenu();
        return;
      }

      if (!isMenuOpen) return;

      if (e.key === "1") {
        go("/login");
      } else if (e.key === "2") {
        go("/simulation");
      } else if (e.key === "3") {
        go("/threat-profiles");
      } else if (e.key === "4") {
        go("/twin-engine");
      } else if (e.key === "5") {
        go("/training-ledger");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen, go]);

  // GSAP Menu Animations
  const openMenu = () => {
    if (isAnimatingRef.current || !containerRef.current) return;
    isAnimatingRef.current = true;
    setIsMenuOpen(true);
    setFilterQuery("");

    const wrapper = containerRef.current.querySelector<HTMLElement>(".nav-overlay-wrapper");
    const overlay = containerRef.current.querySelector<HTMLElement>(".overlay");
    const menuContent = containerRef.current.querySelector<HTMLElement>(".menu-content");
    const listItems = containerRef.current.querySelectorAll<HTMLElement>(".menu-list-item");
    const fadeEls = containerRef.current.querySelectorAll<HTMLElement>("[data-menu-fade]");

    if (!wrapper || !menuContent) return;

    wrapper.dataset.nav = "open";
    wrapper.classList.remove("hidden");

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;
      },
    });

    tl.set(menuContent, { xPercent: 100 })
      .set(overlay, { opacity: 0 })
      .set(listItems, { y: 30, opacity: 0 })
      .set(fadeEls, { opacity: 0, y: 15 })
      .to(overlay, { opacity: 1, duration: 0.3, ease: "power2.out" })
      .to(menuContent, { xPercent: 0, duration: 0.45, ease: "power3.out" }, "<")
      .to(
        listItems,
        { y: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: "power2.out" },
        "-=0.2",
      )
      .to(fadeEls, { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" }, "-=0.3");
  };

  const closeMenu = () => {
    if (isAnimatingRef.current || !containerRef.current) return;
    isAnimatingRef.current = true;

    const wrapper = containerRef.current.querySelector<HTMLElement>(".nav-overlay-wrapper");
    const overlay = containerRef.current.querySelector<HTMLElement>(".overlay");
    const menuContent = containerRef.current.querySelector<HTMLElement>(".menu-content");

    if (!wrapper || !menuContent) return;

    const tl = gsap.timeline({
      onComplete: () => {
        wrapper.dataset.nav = "closed";
        wrapper.classList.add("hidden");
        setIsMenuOpen(false);
        setAuthOpen(false);
        isAnimatingRef.current = false;
      },
    });

    tl.to(menuContent, { xPercent: 100, duration: 0.35, ease: "power3.in" }).to(
      overlay,
      { opacity: 0, duration: 0.25, ease: "power2.in" },
      "<",
    );
  };

  const toggleMenu = () => {
    if (isMenuOpen) closeMenu();
    else openMenu();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      saveLocalSession({
        callsign: "GUEST",
        badgeId: "0000",
        clearance: "UNCLASSIFIED",
        loggedIn: false,
      });
    }
    closeMenu();
    navigate({ to: "/" });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (mode === "login") {
        const cleanCallsign = callsign.trim();
        const cleanPassword = password.trim();

        if (!cleanCallsign || !cleanPassword) {
          setError("Callsign & password required.");
          setBusy(false);
          return;
        }

        const res = await loginOperator({
          data: { email: cleanCallsign, password: cleanPassword },
        });

        saveLocalSession({
          callsign: res.operator.callsign,
          badgeId: res.operator.badgeId || "OP-0000",
          clearance: res.operator.clearance || "TS/SCI · RED LEVEL",
          loggedIn: true,
        });

        closeMenu();
        navigate({ to: "/dashboard" });
      } else {
        const cleanCallsign = callsign.trim();
        const cleanEmail = email.trim();
        const cleanPassword = password.trim();

        if (!cleanCallsign || !cleanEmail || !cleanPassword) {
          setError("All fields required.");
          setBusy(false);
          return;
        }

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

        closeMenu();
        navigate({ to: "/dashboard" });
      }
    } catch (err: unknown) {
      log.error("Auth submit error:", err);
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  // Base Menu Navigation Links — Ordered by Core Product Flow
  const allMenuItems = [
    {
      hotkey: "1",
      label: "HOME DECK",
      sub: "ATTACK SURFACE & FIELD MANUAL",
      to: "/",
      icon: Activity,
    },
    {
      hotkey: "2",
      label: "TWIN ENGINE",
      sub: "DIGITAL TWIN SECTOR INDEX",
      to: "/twin-engine",
      icon: Cpu,
    },
    {
      hotkey: "3",
      label: "SIMULATION RANGE",
      sub: "LIVE SCADA SCENARIO & REPLAY",
      to: "/simulation?sector=power",
      icon: Target,
    },
    {
      hotkey: "4",
      label: loggedIn ? "OPERATOR DASHBOARD" : "OPERATOR SIGN-IN",
      sub: loggedIn ? "COMMAND DECK & DRILL HISTORY" : "AUTHENTICATION DOSSIER GATEWAY",
      to: loggedIn ? "/dashboard" : "/login",
      icon: loggedIn ? LayoutDashboard : LogIn,
    },
    {
      hotkey: "5",
      label: "THREAT INTEL & BRIEFINGS",
      sub: "FBI BAU MINDHUNTER & FIELD REPORTS",
      to: "/threat-profiles",
      icon: Shield,
    },
  ];

  // Filtered menu items based on quick search
  const filteredMenuItems = filterQuery.trim()
    ? allMenuItems.filter(
        (it) =>
          it.label.toLowerCase().includes(filterQuery.toLowerCase()) ||
          it.sub.toLowerCase().includes(filterQuery.toLowerCase()),
      )
    : allMenuItems;

  const isSimulation = location.pathname === "/simulation";

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 35);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const hasTopBarRoute =
    location.pathname === "/" ||
    location.pathname === "/twin-engine" ||
    location.pathname.startsWith("/simulation");

  return (
    <div ref={containerRef}>
      {/* Positioned Tactical Menu Trigger Button */}
      <CyberMatrixTrigger
        isOpen={isMenuOpen}
        callsign={loggedIn ? activeSession.callsign : undefined}
        badgeId={loggedIn ? activeSession.badgeId : undefined}
        label="TACTICAL MENU"
        onClick={toggleMenu}
        className={cn(
          "nav-close-btn fixed z-[100] transition-all duration-200",
          hasTopBarRoute && !scrolled
            ? "top-[52px] sm:top-[56px] right-4 md:right-6"
            : "top-3 md:top-4 right-4 md:right-6",
        )}
      />

      {/* FULLSCREEN DUAL-DECK TACTICAL HUD CONSOLE OVERLAY */}
      <section className="fullscreen-menu-container">
        <div
          data-nav="closed"
          className="nav-overlay-wrapper fixed inset-0 z-[80] hidden select-none"
        >
          {/* Backdrop Blur */}
          <div
            className="overlay absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            onClick={closeMenu}
          />

          {/* DUAL DECK MENU DRAWER (max-w-4xl wide console) */}
          <nav className="menu-content fixed top-0 right-0 bottom-0 w-full max-w-4xl bg-[#09090B] border-l-4 border-black text-[#F5F3E7] font-mono flex flex-col justify-between p-6 sm:p-8 lg:p-10 overflow-y-auto z-10 shadow-[0_0_90px_rgba(0,0,0,0.95)]">
            {/* MENU HEADER WITH COMMAND FILTER SEARCH BAR & HOTKEY PROMPT */}
            <div className="space-y-4 border-b-3 border-black pb-5" data-menu-fade>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="bg-[#BFFF2E] text-black px-2.5 py-0.5 font-mono text-[10px] font-black uppercase border border-black shadow-[2px_2px_0px_0px_#000000]">
                    ★ TACTICAL CONSOLE HUD
                  </span>
                  <span className="bg-[#27272A] text-[#BFFF2E] px-2 py-0.5 text-[9px] font-black uppercase border border-black hidden sm:inline-block">
                    KEYS [1-5] QUICK JUMP
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase flex items-center gap-1.5 bg-[#18181B] px-2 py-1 border border-black">
                  <span className="size-1.5 bg-[#BFFF2E] rounded-full animate-ping" />
                  PRESS [ESC] TO CLOSE
                </span>
              </div>

              {/* Command Filter Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="SEARCH COMMAND / ROUTE... (e.g. SIMULATION, THREAT, DOSSIER)"
                  className="w-full bg-[#18181B] border-2 border-black text-[#F5F3E7] font-mono text-xs px-3.5 py-2.5 pl-9 placeholder:text-zinc-500 outline-none focus:border-[#BFFF2E] transition-colors shadow-[3px_3px_0px_0px_#000000]"
                />
                <Search className="absolute left-3 top-3 size-4 text-zinc-400 pointer-events-none" />
                {filterQuery && (
                  <button
                    onClick={() => setFilterQuery("")}
                    className="absolute right-3 top-2.5 text-xs text-[#BFFF2E] hover:underline"
                  >
                    CLEAR
                  </button>
                )}
              </div>
            </div>

            {/* DUAL DECK MAIN BODY */}
            <div className="my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT DECK: KINETIC NAVIGATION LINKS WITH HOTKEY BADGES */}
              <div className="lg:col-span-7 space-y-3">
                <span className="block font-mono text-[10px] font-black text-[#BFFF2E] uppercase tracking-widest pb-1 border-b border-zinc-800">
                  SYSTEM NAVIGATION INDEX
                </span>

                <ul className="menu-list space-y-3">
                  {filteredMenuItems.map((it) => (
                    <li key={it.label} className="menu-list-item">
                      <button
                        onClick={() => go(it.to)}
                        className="w-full text-left bg-[#121214] hover:bg-[#18181B] border-2 border-black p-3.5 flex items-center justify-between transition-all shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#BFFF2E] hover:-translate-x-0.5 hover:-translate-y-0.5 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5">
                          {/* Monospaced Key Badge */}
                          <span className="bg-[#27272A] group-hover:bg-[#BFFF2E] group-hover:text-black text-[#BFFF2E] font-mono font-black text-[11px] px-2 py-1 border border-black shadow-[1px_1px_0px_0px_#000000]">
                            [{it.hotkey}]
                          </span>
                          <it.icon className="size-5 text-[#BFFF2E] shrink-0" />
                          <div>
                            <span className="block font-mono text-base font-black uppercase text-[#F5F3E7] group-hover:text-[#BFFF2E] transition-colors">
                              {it.label}
                            </span>
                            <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                              {it.sub}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground group-hover:text-[#BFFF2E] group-hover:translate-x-1 transition-transform">
                          →
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* RIGHT DECK: OPERATOR DOSSIER CARD & LIVE SCADA RANGE TELEMETRY HUD */}
              <div className="lg:col-span-5 space-y-4">
                {/* 01 // OPERATOR CLEARANCE DOSSIER CARD */}
                <div
                  className="bg-[#F5F3E7] text-black border-3 border-black p-4 space-y-3 shadow-[6px_6px_0px_0px_#BFFF2E]"
                  data-menu-fade
                >
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <span className="font-mono font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                      <ShieldCheck className="size-3.5 text-black" />
                      OPERATOR DOSSIER
                    </span>
                    <span className="bg-black text-[#BFFF2E] text-[9px] font-black px-1.5 py-0.5 border border-black uppercase shadow-[1px_1px_0px_0px_#000000]">
                      {loggedIn ? "AUTHENTICATED" : "GUEST"}
                    </span>
                  </div>

                  {loggedIn ? (
                    <div className="space-y-2 font-mono text-xs">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 rounded-none border-2 border-black">
                          <AvatarFallback className="bg-black text-[#BFFF2E] font-black text-xs">
                            {initials(activeSession.callsign)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="block font-black text-sm text-black">
                            {activeSession.callsign}
                          </span>
                          <span className="block text-[10px] text-zinc-700 font-bold">
                            BADGE ID: {activeSession.badgeId}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white border-2 border-black p-2 text-[10px] font-bold text-black flex items-center justify-between">
                        <span>CLEARANCE:</span>
                        <span className="bg-black text-[#BFFF2E] px-1.5 py-0.5 font-black">
                          {activeSession.clearance}
                        </span>
                      </div>

                      <button
                        onClick={handleLogout}
                        className="w-full bg-red-500 text-white font-black text-xs py-2 border-2 border-black shadow-[2px_2px_0px_0px_#000000] hover:bg-red-600 cursor-pointer uppercase flex items-center justify-center gap-1.5"
                      >
                        <LogOut className="size-3.5" />
                        <span>TERMINATE SESSION (SIGN-OUT)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 font-mono text-xs">
                      <p className="text-[10px] font-bold text-zinc-800 leading-snug">
                        UNAUTHENTICATED GUEST SESSION. ACCESS RESTRICTED TO PUBLIC TELEMETRY.
                      </p>
                      <button
                        onClick={() => go("/login")}
                        className="w-full bg-[#BFFF2E] text-black font-black text-xs py-2.5 border-2 border-black shadow-[2px_2px_0px_0px_#000000] hover:bg-lime-300 cursor-pointer uppercase flex items-center justify-center gap-1.5"
                      >
                        <Zap className="size-4 fill-black" />
                        <span>SIGN-IN OPERATOR DOSSIER →</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 02 // LIVE SCADA RANGE TELEMETRY HUD */}
                <div
                  className="bg-[#121214] border-3 border-black p-4 space-y-3 shadow-[6px_6px_0px_0px_#000000]"
                  data-menu-fade
                >
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <span className="font-mono text-[#F5F3E7] font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                      <Radio className="size-3.5 text-[#BFFF2E] animate-pulse" />
                      RANGE TELEMETRY HUD
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-black px-1.5 py-0.5">
                      DEFCON 2
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    <div className="border border-black bg-[#18181B] p-2">
                      <span className="block text-[8px] text-zinc-400 font-bold uppercase">
                        OT SECTORS
                      </span>
                      <span className="font-black text-[#BFFF2E] text-xs">7 ONLINE</span>
                    </div>
                    <div className="border border-black bg-[#18181B] p-2">
                      <span className="block text-[8px] text-zinc-400 font-bold uppercase">
                        LATENCY
                      </span>
                      <span className="font-black text-[#F5F3E7] text-xs">&lt; 1.8 MS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER BAR */}
            <div
              className="border-t-3 border-black pt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] text-muted-foreground font-mono"
              data-menu-fade
            >
              <div className="flex items-center gap-3">
                <span className="text-[#BFFF2E] font-black uppercase">TWINSEC OPERATOR HUD v1</span>
                <span>•</span>
                <span>NEURAL RANGE MATRIX</span>
              </div>
              <button
                onClick={closeMenu}
                className="text-[#BFFF2E] hover:underline font-bold uppercase"
              >
                CLOSE MENU [ESC] →
              </button>
            </div>
          </nav>
        </div>
      </section>
    </div>
  );
}
