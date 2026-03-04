export type EnvelopeWithBalance = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  category_group: string;
  allocated: number; // cents
  spent: number; // cents
  remaining: number; // cents
};

export function calculateUnassigned(
  totalIncome: number,
  allocations: { allocated_amount: number }[]
): number {
  const totalAllocated = allocations.reduce(
    (sum, a) => sum + (a.allocated_amount ?? 0),
    0
  );
  return totalIncome - totalAllocated;
}

export function getEnvelopeStatus(
  allocated: number,
  spent: number
): "under" | "warning" | "over" {
  if (allocated === 0) return "under";
  const ratio = spent / allocated;
  if (ratio >= 1) return "over";
  if (ratio >= 0.8) return "warning";
  return "under";
}

export function getEnvelopeProgress(allocated: number, spent: number): number {
  if (allocated === 0) return 0;
  return Math.min(spent / allocated, 1);
}
