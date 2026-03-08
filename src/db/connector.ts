/**
 * SupabaseConnector — bridges PowerSync CRUD operations to Supabase.
 * Handles credential fetching (Supabase JWT) and uploading local changes.
 */

import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  UpdateType,
} from "@powersync/common";
import { supabase } from "@/lib/supabase";
import { POWERSYNC_URL } from "@/lib/constants";

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Not authenticated");
    }

    return {
      endpoint: POWERSYNC_URL,
      token: session.access_token,
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    try {
      for (const op of transaction.crud) {
        await this.applyOperation(op);
      }
      await transaction.complete();
    } catch (error) {
      if (__DEV__) {
        console.error("Sync upload error:", error);
      }
      throw error;
    }
  }

  private async applyOperation(op: CrudEntry): Promise<void> {
    const table = supabase.from(op.table);

    switch (op.op) {
      case UpdateType.PUT: {
        const { error } = await table.upsert({ ...op.opData, id: op.id });
        if (error) throw error;
        break;
      }
      case UpdateType.PATCH: {
        const { error } = await table.update(op.opData!).eq("id", op.id);
        if (error) throw error;
        break;
      }
      case UpdateType.DELETE: {
        const { error } = await table.delete().eq("id", op.id);
        if (error) throw error;
        break;
      }
    }
  }
}
