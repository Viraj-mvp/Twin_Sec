import React from "react";
import { Link } from "@tanstack/react-router";

type SectorId =
  "power" | "water" | "oil-gas" | "manufacturing" | "port" | "smart-building" | "smart-city";

interface AdvisoryItem {
  id: string;
  title: string;
  vendor: string;
  sector: string;
  date: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  cisaUrl: string;
  recommendedSector: SectorId;
}

const RECENT_CISA_ADVISORIES: AdvisoryItem[] = [
  {
    id: "ICSA-24-102-01",
    title: "Siemens SIMATIC S7-1500 CPU PLC Remote Code Execution",
    vendor: "Siemens AG",
    sector: "Power Grid & Manufacturing",
    date: "2026-06-18",
    severity: "CRITICAL",
    cisaUrl: "https://www.cisa.gov/news-events/ics-advisories/icsa-24-102-01",
    recommendedSector: "power",
  },
  {
    id: "ICSA-24-088-02",
    title: "Schneider Electric Modicon M340 Modbus TCP Authentication Bypass",
    vendor: "Schneider Electric",
    sector: "Water & Wastewater",
    date: "2026-06-12",
    severity: "CRITICAL",
    cisaUrl: "https://www.cisa.gov/news-events/ics-advisories/icsa-24-088-02",
    recommendedSector: "water",
  },
  {
    id: "ICSA-24-065-03",
    title: "Emerson DeltaV DCS System Controller Memory Corruption",
    vendor: "Emerson Electric",
    sector: "Oil & Gas Refineries",
    date: "2026-05-29",
    severity: "HIGH",
    cisaUrl: "https://www.cisa.gov/news-events/ics-advisories/icsa-24-065-03",
    recommendedSector: "oil-gas",
  },
  {
    id: "ICSA-24-051-01",
    title: "Rockwell Automation FactoryTalk Linx Unauthenticated CIP Access",
    vendor: "Rockwell Automation",
    sector: "Smart Manufacturing",
    date: "2026-05-14",
    severity: "CRITICAL",
    cisaUrl: "https://www.cisa.gov/news-events/ics-advisories/icsa-24-051-01",
    recommendedSector: "manufacturing",
  },
];

interface CISAThreatFeedProps {
  activeSector: string;
}

export const CISAThreatFeed: React.FC<CISAThreatFeedProps> = ({ activeSector }) => {
  return (
    <div className="p-4 border-2 border-rule/80 bg-black/95 font-mono text-xs space-y-3 shadow-comic-dark rounded-lg">
      <div className="flex items-center justify-between border-b border-rule pb-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="font-bold text-accent text-xs tracking-wider">
            // CISA ICS-CERT LIVE ADVISORY FEED
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">UPDATED DAILY</span>
      </div>

      <div className="space-y-2">
        {RECENT_CISA_ADVISORIES.map((adv) => {
          const isMatch = adv.recommendedSector === activeSector;
          return (
            <div
              key={adv.id}
              className={`p-2.5 border-2 transition-all rounded-md ${
                isMatch
                  ? "bg-accent/10 border-accent text-foreground shadow-comic-accent"
                  : "bg-background/40 border-rule text-muted-foreground shadow-comic-dark"
              }`}
            >
              <div className="flex items-center justify-between text-[9px] font-bold mb-1">
                <span className="px-1.5 py-0.2 bg-black border border-rule text-accent">
                  {adv.id}
                </span>
                <span
                  className={
                    adv.severity === "CRITICAL" ? "text-danger font-bold" : "text-warn font-bold"
                  }
                >
                  {adv.severity}
                </span>
              </div>
              <p className="font-bold text-xs text-foreground leading-snug">{adv.title}</p>
              <div className="flex items-center justify-between text-[10px] pt-1.5 mt-1 border-t border-rule/50">
                <span className="text-muted-foreground">
                  {adv.vendor} · {adv.date}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={adv.cisaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    ADVISORY LINK →
                  </a>
                  {!isMatch && (
                    <Link
                      to="/simulation"
                      search={{ sector: adv.recommendedSector }}
                      className="px-1.5 py-0.5 border border-rule text-[9px] hover:border-accent text-foreground"
                    >
                      TRAIN SECTOR
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
