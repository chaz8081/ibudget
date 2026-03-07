import { generateId } from "@/utils/uuid";
import { DEFAULT_CATEGORIES } from "@/features/budget/schemas/envelope.schema";
import {
  HOUSEHOLDS_TABLE,
  HOUSEHOLD_MEMBERS_TABLE,
  PROFILES_TABLE,
  CATEGORIES_TABLE,
  BUDGETS_TABLE,
  ENVELOPE_ALLOCATIONS_TABLE,
  TRANSACTIONS_TABLE,
  RECURRING_TRANSACTIONS_TABLE,
} from "@/db/tables";
import type { AbstractPowerSyncDatabase } from "@powersync/react-native";

const ALLOCATIONS: Record<string, number> = {
  "Rent/Mortgage": 180000,
  Groceries: 60000,
  "Dining Out": 20000,
  Gas: 15000,
  "Car Payment": 35000,
  Electric: 12000,
  Water: 5000,
  Internet: 7000,
  Phone: 8500,
  "Health Insurance": 45000,
  "Emergency Fund": 50000,
  Entertainment: 10000,
  Clothing: 7500,
  "Personal Care": 5000,
  Subscriptions: 4000,
  "Giving/Charity": 10000,
  Miscellaneous: 7500,
};

interface SeedTransaction {
  categoryName: string;
  payee: string;
  description: string;
  amount: number;
  type: "expense" | "income";
  dayOffset: number; // days before today
}

const SEED_TRANSACTIONS: SeedTransaction[] = [
  // Income
  { categoryName: "Salary", payee: "Employer", description: "Paycheck", amount: 325000, type: "income", dayOffset: 15 },
  { categoryName: "Salary", payee: "Employer", description: "Paycheck", amount: 325000, type: "income", dayOffset: 1 },
  // Housing
  { categoryName: "Rent/Mortgage", payee: "Lakewood Apartments", description: "March rent", amount: 180000, type: "expense", dayOffset: 28 },
  // Groceries
  { categoryName: "Groceries", payee: "Costco", description: "Weekly groceries", amount: 15600, type: "expense", dayOffset: 21 },
  { categoryName: "Groceries", payee: "Trader Joe's", description: "Groceries", amount: 8750, type: "expense", dayOffset: 14 },
  { categoryName: "Groceries", payee: "Walmart", description: "Grocery run", amount: 11200, type: "expense", dayOffset: 7 },
  { categoryName: "Groceries", payee: "Aldi", description: "Quick shop", amount: 4500, type: "expense", dayOffset: 3 },
  // Dining
  { categoryName: "Dining Out", payee: "Chipotle", description: "Lunch", amount: 1250, type: "expense", dayOffset: 18 },
  { categoryName: "Dining Out", payee: "Pizza Hut", description: "Friday pizza night", amount: 3500, type: "expense", dayOffset: 10 },
  { categoryName: "Dining Out", payee: "Starbucks", description: "Coffee", amount: 650, type: "expense", dayOffset: 5 },
  // Transportation
  { categoryName: "Gas", payee: "Shell", description: "Fill up", amount: 5500, type: "expense", dayOffset: 20 },
  { categoryName: "Gas", payee: "BP", description: "Gas", amount: 4800, type: "expense", dayOffset: 8 },
  { categoryName: "Car Payment", payee: "Toyota Financial", description: "Car payment", amount: 35000, type: "expense", dayOffset: 25 },
  // Utilities
  { categoryName: "Electric", payee: "Duke Energy", description: "Electric bill", amount: 11500, type: "expense", dayOffset: 22 },
  { categoryName: "Water", payee: "City Water Dept", description: "Water bill", amount: 4800, type: "expense", dayOffset: 19 },
  { categoryName: "Internet", payee: "Spectrum", description: "Internet bill", amount: 6999, type: "expense", dayOffset: 17 },
  { categoryName: "Phone", payee: "T-Mobile", description: "Phone plan", amount: 8500, type: "expense", dayOffset: 16 },
  // Insurance
  { categoryName: "Health Insurance", payee: "Blue Cross", description: "Health insurance premium", amount: 45000, type: "expense", dayOffset: 26 },
  // Savings
  { categoryName: "Emergency Fund", payee: "Transfer", description: "Emergency fund contribution", amount: 50000, type: "expense", dayOffset: 2 },
  // Entertainment
  { categoryName: "Entertainment", payee: "AMC Theaters", description: "Movie night", amount: 3200, type: "expense", dayOffset: 12 },
  { categoryName: "Subscriptions", payee: "Netflix", description: "Monthly subscription", amount: 1599, type: "expense", dayOffset: 15 },
  { categoryName: "Subscriptions", payee: "Spotify", description: "Music subscription", amount: 1099, type: "expense", dayOffset: 15 },
  // Personal
  { categoryName: "Clothing", payee: "Target", description: "New shirts", amount: 4500, type: "expense", dayOffset: 9 },
  { categoryName: "Personal Care", payee: "Great Clips", description: "Haircut", amount: 2500, type: "expense", dayOffset: 6 },
  // Giving
  { categoryName: "Giving/Charity", payee: "Church", description: "Weekly tithe", amount: 5000, type: "expense", dayOffset: 11 },
];

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

export async function seedDemoData(
  db: AbstractPowerSyncDatabase,
  userId: string
): Promise<void> {
  const now = new Date().toISOString();
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const householdId = generateId();
  const budgetId = generateId();

  await db.writeTransaction(async (tx) => {
    // 1. Household
    await tx.execute(
      `INSERT INTO ${HOUSEHOLDS_TABLE} (id, name, owner_id, invite_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [householdId, "Demo Family", userId, "DEMO123", now, now]
    );

    // 2. Household membership
    await tx.execute(
      `INSERT INTO ${HOUSEHOLD_MEMBERS_TABLE} (id, household_id, user_id, role, joined_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), householdId, userId, "owner", now, now, now]
    );

    // 3. Update profile with household_id
    await tx.execute(
      `UPDATE ${PROFILES_TABLE} SET household_id = ?, updated_at = ? WHERE id = ?`,
      [householdId, now, userId]
    );

    // 4. Categories
    const categoryIds: Record<string, string> = {};
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const cat = DEFAULT_CATEGORIES[i];
      const id = generateId();
      categoryIds[cat.name] = id;
      await tx.execute(
        `INSERT INTO ${CATEGORIES_TABLE} (id, household_id, name, icon, color, category_group, sort_order, is_archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, householdId, cat.name, cat.icon, null, cat.group, i, 0, now, now]
      );
    }

    // 5. Budget
    await tx.execute(
      `INSERT INTO ${BUDGETS_TABLE} (id, user_id, household_id, month, year, total_income, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [budgetId, userId, householdId, month, year, 650000, null, now, now]
    );

    // 6. Envelope allocations
    for (const [name, amount] of Object.entries(ALLOCATIONS)) {
      const catId = categoryIds[name];
      if (!catId) continue;
      await tx.execute(
        `INSERT INTO ${ENVELOPE_ALLOCATIONS_TABLE} (id, budget_id, category_id, allocated_amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [generateId(), budgetId, catId, amount, now, now]
      );
    }

    // 7. Transactions
    for (const txn of SEED_TRANSACTIONS) {
      const catId = categoryIds[txn.categoryName];
      if (!catId) continue;
      await tx.execute(
        `INSERT INTO ${TRANSACTIONS_TABLE} (id, user_id, household_id, budget_id, category_id, account_id, transaction_type, amount, description, payee, transaction_date, is_cleared, plaid_transaction_id, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId(), userId, householdId, budgetId, catId, null,
          txn.type, txn.amount, txn.description, txn.payee,
          dateStr(txn.dayOffset), 1, null, null, now, now,
        ]
      );
    }

    // 8. Recurring transactions
    const recurringItems = [
      {
        categoryName: "Rent/Mortgage",
        payee: "Lakewood Apartments",
        description: "Monthly rent",
        amount: 180000,
        frequency: "monthly",
        interval: 1,
        type: "expense" as const,
      },
      {
        categoryName: "Subscriptions",
        payee: "Netflix",
        description: "Netflix subscription",
        amount: 1599,
        frequency: "monthly",
        interval: 1,
        type: "expense" as const,
      },
      {
        categoryName: "Personal Care",
        payee: "Planet Fitness",
        description: "Gym membership",
        amount: 2499,
        frequency: "biweekly",
        interval: 1,
        type: "expense" as const,
      },
    ];

    const nextMonth = new Date(year, month, 1).toISOString().split("T")[0];
    for (const rec of recurringItems) {
      const catId = categoryIds[rec.categoryName];
      if (!catId) continue;
      await tx.execute(
        `INSERT INTO ${RECURRING_TRANSACTIONS_TABLE} (id, user_id, household_id, category_id, amount, description, payee, frequency, interval, start_date, end_date, next_occurrence_date, is_enabled, transaction_type, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId(), userId, householdId, catId,
          rec.amount, rec.description, rec.payee,
          rec.frequency, rec.interval,
          dateStr(28), null, nextMonth,
          1, rec.type, null, now, now,
        ]
      );
    }
  });
}
