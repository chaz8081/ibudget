import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  icon: z.string().optional(),
  color: z.string().optional(),
  categoryGroup: z.enum([
    "housing",
    "transportation",
    "food",
    "utilities",
    "insurance",
    "healthcare",
    "savings",
    "debt",
    "personal",
    "entertainment",
    "education",
    "giving",
    "other",
  ]),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

export const CATEGORY_GROUPS = [
  { value: "housing", label: "Housing" },
  { value: "transportation", label: "Transportation" },
  { value: "food", label: "Food" },
  { value: "utilities", label: "Utilities" },
  { value: "insurance", label: "Insurance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "savings", label: "Savings" },
  { value: "debt", label: "Debt" },
  { value: "personal", label: "Personal" },
  { value: "entertainment", label: "Entertainment" },
  { value: "education", label: "Education" },
  { value: "giving", label: "Giving" },
  { value: "other", label: "Other" },
] as const;

export const DEFAULT_CATEGORIES = [
  { name: "Rent/Mortgage", group: "housing", icon: "🏠" },
  { name: "Groceries", group: "food", icon: "🛒" },
  { name: "Dining Out", group: "food", icon: "🍽️" },
  { name: "Gas", group: "transportation", icon: "⛽" },
  { name: "Car Payment", group: "transportation", icon: "🚗" },
  { name: "Electric", group: "utilities", icon: "⚡" },
  { name: "Water", group: "utilities", icon: "💧" },
  { name: "Internet", group: "utilities", icon: "📡" },
  { name: "Phone", group: "utilities", icon: "📱" },
  { name: "Health Insurance", group: "insurance", icon: "🏥" },
  { name: "Emergency Fund", group: "savings", icon: "🏦" },
  { name: "Entertainment", group: "entertainment", icon: "🎬" },
  { name: "Clothing", group: "personal", icon: "👕" },
  { name: "Personal Care", group: "personal", icon: "💇" },
  { name: "Subscriptions", group: "entertainment", icon: "📺" },
  { name: "Giving/Charity", group: "giving", icon: "❤️" },
  { name: "Miscellaneous", group: "other", icon: "📦" },
];
