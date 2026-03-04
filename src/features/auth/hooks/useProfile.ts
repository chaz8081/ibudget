import { useEffect } from "react";
import { usePowerSync, useQuery } from "@powersync/react";
import { useAuth } from "./useAuth";
import { PROFILES_TABLE } from "@/db/tables";

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  household_id: string | null;
};

/**
 * Ensures a profile row exists in the local DB for the current user.
 * In local-only mode, Supabase triggers don't run, so we create it here.
 */
export function useProfile() {
  const db = usePowerSync();
  const { user } = useAuth();

  const { data: profiles } = useQuery<ProfileRow>(
    user ? `SELECT * FROM ${PROFILES_TABLE} WHERE id = ?` : "SELECT 1 WHERE 0",
    user ? [user.id] : []
  );

  const profile = profiles?.[0] ?? null;

  useEffect(() => {
    if (!user) return;
    if (profile) return; // Already exists

    const now = new Date().toISOString();
    db.execute(
      `INSERT OR IGNORE INTO ${PROFILES_TABLE} (id, display_name, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
      [user.id, user.displayName ?? user.email ?? "", now, now]
    );
  }, [user, profile, db]);

  return { profile };
}
