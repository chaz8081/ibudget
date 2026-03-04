import { useCallback } from "react";
import { useQuery, usePowerSync } from "@powersync/react";
import * as Crypto from "expo-crypto";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { generateId } from "@/utils/uuid";
import {
  HOUSEHOLDS_TABLE,
  HOUSEHOLD_MEMBERS_TABLE,
  PROFILES_TABLE,
} from "@/db/tables";

type HouseholdRow = {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string | null;
};

export function useHousehold() {
  const db = usePowerSync();
  const { user } = useAuth();

  // Get the user's current household via household_members
  const { data: memberships, isLoading } = useQuery<{
    household_id: string;
    role: string;
  }>(
    `SELECT household_id, role FROM ${HOUSEHOLD_MEMBERS_TABLE} WHERE user_id = ? LIMIT 1`,
    [user?.id ?? ""]
  );

  const householdId = memberships?.[0]?.household_id ?? null;
  const userRole = memberships?.[0]?.role ?? null;

  const { data: households } = useQuery<HouseholdRow>(
    householdId
      ? `SELECT * FROM ${HOUSEHOLDS_TABLE} WHERE id = ?`
      : "SELECT 1 WHERE 0",
    householdId ? [householdId] : []
  );

  const household = households?.[0] ?? null;

  const createHousehold = useCallback(
    async (name: string) => {
      if (!user) return;
      const now = new Date().toISOString();
      const householdId = generateId();
      const memberId = generateId();
      // Cryptographically secure invite code: 16 random bytes -> 32 hex chars
      const inviteCode = Array.from(
        Crypto.getRandomBytes(16),
        (b) => b.toString(16).padStart(2, "0")
      ).join("");

      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `INSERT INTO ${HOUSEHOLDS_TABLE} (id, name, owner_id, invite_code, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [householdId, name, user.id, inviteCode, now, now]
        );

        await tx.execute(
          `INSERT INTO ${HOUSEHOLD_MEMBERS_TABLE} (id, household_id, user_id, role, joined_at, created_at, updated_at)
           VALUES (?, ?, ?, 'owner', ?, ?, ?)`,
          [memberId, householdId, user.id, now, now, now]
        );

        // Update profile with household_id
        await tx.execute(
          `UPDATE ${PROFILES_TABLE} SET household_id = ?, updated_at = ? WHERE id = ?`,
          [householdId, now, user.id]
        );
      });

      return householdId;
    },
    [db, user]
  );

  const joinHousehold = useCallback(
    async (inviteCode: string) => {
      if (!user) return;

      const trimmedCode = inviteCode.trim();
      if (!trimmedCode) throw new Error("Invite code is required");

      const results = await db.getAll<{ id: string }>(
        `SELECT id FROM ${HOUSEHOLDS_TABLE} WHERE invite_code = ?`,
        [trimmedCode]
      );

      if (results.length === 0) {
        throw new Error("Invalid invite code");
      }

      const targetHouseholdId = results[0].id;

      // Check if already a member
      const existing = await db.getAll<{ id: string }>(
        `SELECT id FROM ${HOUSEHOLD_MEMBERS_TABLE} WHERE household_id = ? AND user_id = ?`,
        [targetHouseholdId, user.id]
      );
      if (existing.length > 0) {
        throw new Error("You are already a member of this household");
      }

      const now = new Date().toISOString();
      const memberId = generateId();

      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `INSERT INTO ${HOUSEHOLD_MEMBERS_TABLE} (id, household_id, user_id, role, joined_at, created_at, updated_at)
           VALUES (?, ?, ?, 'member', ?, ?, ?)`,
          [memberId, targetHouseholdId, user.id, now, now, now]
        );

        await tx.execute(
          `UPDATE ${PROFILES_TABLE} SET household_id = ?, updated_at = ? WHERE id = ?`,
          [targetHouseholdId, now, user.id]
        );
      });

      return targetHouseholdId;
    },
    [db, user]
  );

  return {
    household,
    householdId,
    userRole,
    isLoading,
    createHousehold,
    joinHousehold,
  };
}
