export interface ScoreState {
  t: number;
  mttd: number | null;
  mttr: number | null;
  mwShed: number;
  choices: Record<string, "ACT" | "DEFER" | "MISS">;
  isolatedNodes: Set<string> | string[];
  patchedNodes: Set<string> | string[];
  hintCount: number;
  pausedSeconds?: number;
}

export function calculateLiveScore(state: Partial<ScoreState>): number {
  let score = 0;

  // 1. DETECTION SPEED (max 25 pts)
  if (state.mttd !== null && state.mttd !== undefined) {
    if (state.mttd <= 30) score += 25;
    else if (state.mttd <= 60) score += 20;
    else if (state.mttd <= 120) score += 15;
    else if (state.mttd <= 300) score += 10;
  }

  // 2. RESPONSE EFFECTIVENESS (max 25 pts)
  if (state.choices) {
    const choiceValues = Object.values(state.choices);
    choiceValues.forEach((choice) => {
      if (choice === "ACT") score += 10;
      else if (choice === "DEFER") score += 5;
    });
  }

  // 3. DAMAGE LIMITATION (max 30 pts)
  const mw = state.mwShed || 0;
  if (mw === 0) score += 30;
  else if (mw <= 100) score += 20;
  else if (mw <= 500) score += 10;

  // 4. PROACTIVE ACTIONS (max 10 pts)
  const isolatedCount =
    state.isolatedNodes instanceof Set
      ? state.isolatedNodes.size
      : Array.isArray(state.isolatedNodes)
        ? state.isolatedNodes.length
        : 0;

  const patchedCount =
    state.patchedNodes instanceof Set
      ? state.patchedNodes.size
      : Array.isArray(state.patchedNodes)
        ? state.patchedNodes.length
        : 0;

  const proactivePoints = Math.min(10, isolatedCount * 3 + patchedCount * 2);
  score += proactivePoints;

  // 5. PENALTIES
  const hintPenalties = (state.hintCount || 0) * 5;
  const pausePenalties = Math.min(10, Math.floor((state.pausedSeconds || 0) / 60) * 2);

  score -= hintPenalties;
  score -= pausePenalties;

  return Math.max(0, Math.min(100, score));
}
