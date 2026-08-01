import { ShieldAlert, Terminal, Lock } from "lucide-react";

interface MitreTechnique {
  techniqueId: string;
  name: string;
  description: string;
}

interface MitreAttackMatrixProps {
  techniques: MitreTechnique[];
}

export function MitreAttackMatrix({ techniques }: MitreAttackMatrixProps) {
  return (
    <div className="bg-[#121214] border-3 border-black p-6 space-y-4 font-mono shadow-[6px_6px_0px_0px_#000000]">
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-5 text-[#BFFF2E]" />
          <h3 className="font-black text-sm uppercase tracking-wider text-[#F5F3E7]">
            MITRE ATT&CK FOR ICS MATRIX
          </h3>
        </div>
        <span className="bg-[#BFFF2E] text-black font-black text-[10px] px-2 py-0.5 border border-black uppercase">
          {techniques.length} TACTICS MAPPED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {techniques.map((t) => (
          <div
            key={t.techniqueId}
            className="bg-[#18181B] border-2 border-black p-3.5 space-y-1.5 shadow-[3px_3px_0px_0px_#000000]"
          >
            <div className="flex items-center justify-between">
              <span className="bg-[#27272A] text-[#BFFF2E] font-black text-[10px] px-2 py-0.5 border border-black">
                [{t.techniqueId}]
              </span>
              <span className="font-black text-xs text-[#F5F3E7] uppercase">{t.name}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{t.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
