import { column, Schema, TableV2 } from "@powersync/react-native";

const profiles = new TableV2({
  display_name: column.text,
  avatar_url: column.text,
  household_id: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const households = new TableV2({
  name: column.text,
  owner_id: column.text,
  invite_code: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const household_members = new TableV2(
  {
    household_id: column.text,
    user_id: column.text,
    role: column.text,
    joined_at: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { household: ["household_id"], user: ["user_id"] } }
);

const household_invites = new TableV2({
  household_id: column.text,
  invited_by: column.text,
  invited_email: column.text,
  role: column.text,
  status: column.text,
  expires_at: column.text,
  created_at: column.text,
  updated_at: column.text,
});

const categories = new TableV2(
  {
    household_id: column.text,
    name: column.text,
    icon: column.text,
    color: column.text,
    category_group: column.text,
    sort_order: column.integer,
    is_archived: column.integer, // SQLite: 0 or 1
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { household: ["household_id"] } }
);

const budgets = new TableV2(
  {
    user_id: column.text,
    household_id: column.text,
    month: column.integer,
    year: column.integer,
    total_income: column.integer, // cents
    notes: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      user_month: ["user_id", "year", "month"],
      household: ["household_id"],
    },
  }
);

const envelope_allocations = new TableV2(
  {
    budget_id: column.text,
    category_id: column.text,
    allocated_amount: column.integer, // cents
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { budget: ["budget_id"], category: ["category_id"] } }
);

const accounts = new TableV2(
  {
    user_id: column.text,
    household_id: column.text,
    name: column.text,
    account_type: column.text,
    balance: column.integer,
    institution_name: column.text,
    plaid_account_id: column.text,
    plaid_item_id: column.text,
    is_active: column.integer,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { user: ["user_id"], household: ["household_id"] } }
);

const transactions = new TableV2(
  {
    user_id: column.text,
    household_id: column.text,
    budget_id: column.text,
    category_id: column.text,
    account_id: column.text,
    transaction_type: column.text,
    amount: column.integer, // cents
    description: column.text,
    payee: column.text,
    transaction_date: column.text,
    is_cleared: column.integer,
    plaid_transaction_id: column.text,
    notes: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  {
    indexes: {
      user: ["user_id"],
      household: ["household_id"],
      budget: ["budget_id"],
      category: ["category_id"],
      date: ["transaction_date"],
    },
  }
);

export const AppSchema = new Schema({
  profiles,
  households,
  household_members,
  household_invites,
  categories,
  budgets,
  envelope_allocations,
  accounts,
  transactions,
});

export type Database = (typeof AppSchema)["types"];
