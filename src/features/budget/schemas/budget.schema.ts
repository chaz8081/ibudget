import { z } from "zod";

export const budgetIncomeSchema = z.object({
  totalIncome: z.string().min(1, "Income is required"),
});

export type BudgetIncomeFormData = z.infer<typeof budgetIncomeSchema>;
