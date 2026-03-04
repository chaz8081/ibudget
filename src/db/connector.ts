/**
 * SupabaseConnector — bridges PowerSync CRUD operations to Supabase.
 *
 * This file is a stub for now. When you're ready to enable sync:
 * 1. Set up Supabase project and update .env
 * 2. Set up PowerSync project and deploy sync-rules.yaml
 * 3. Uncomment and configure this connector
 * 4. Call db.connect(connector) in DatabaseProvider
 */

import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  UpdateType,
} from "@powersync/react-native";
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
