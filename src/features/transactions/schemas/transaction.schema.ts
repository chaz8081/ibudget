import { z } from "zod";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const transactionSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  payee: z.string().max(200).optional(),
  amount: z.string().min(1, "Amount is required"),
  categoryId: z.string().min(1, "Category is required"),
  transactionType: z.enum(["expense", "income"]),
  transactionDate: z
    .string()
    .min(1, "Date is required")
    .regex(DATE_REGEX, "Date must be YYYY-MM-DD format")
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, "Invalid date"),
  notes: z.string().max(1000).optional(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
