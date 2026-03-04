import { useMemo } from "react";
import type { EnvelopeWithBalance } from "../utils/budget-calculations";

export function useAssignIncome(
  totalIncome: number,
  envelopes: EnvelopeWithBalance[]
) {
  const totalAllocated = useMemo(
    () => envelopes.reduce((sum, e) => sum + e.allocated, 0),
    [envelopes]
  );

  const unassigned = totalIncome - totalAllocated;
  const totalSpent = useMemo(
    () => envelopes.reduce((sum, e) => sum + e.spent, 0),
    [envelopes]
  );
  const totalRemaining = totalIncome - totalSpent;

  return {
    totalAllocated,
    totalSpent,
    totalRemaining,
    unassigned,
  };
}
