import { useQuery } from "@powersync/react";
import { HOUSEHOLD_MEMBERS_TABLE, PROFILES_TABLE } from "@/db/tables";

type MemberRow = {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  display_name: string;
  avatar_url: string | null;
};

export function useHouseholdMembers(householdId: string | null) {
  const { data: members, isLoading } = useQuery<MemberRow>(
    householdId
      ? `SELECT hm.id, hm.user_id, hm.role, hm.joined_at,
                p.display_name, p.avatar_url
         FROM ${HOUSEHOLD_MEMBERS_TABLE} hm
         LEFT JOIN ${PROFILES_TABLE} p ON p.id = hm.user_id
         WHERE hm.household_id = ?
         ORDER BY hm.role, p.display_name`
      : "SELECT 1 WHERE 0",
    householdId ? [householdId] : []
  );

  return {
    members: members ?? [],
    isLoading,
  };
}
