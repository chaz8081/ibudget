import React, { useEffect, useState } from "react";
import { PowerSyncDatabase } from "@powersync/react-native";
import { PowerSyncContext } from "@powersync/react";
import { OPSqliteOpenFactory } from "@powersync/op-sqlite";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AppSchema } from "./schema";

let dbInstance: PowerSyncDatabase | null = null;

function getDatabase(): PowerSyncDatabase {
  if (!dbInstance) {
    const factory = new OPSqliteOpenFactory({ dbFilename: "ibudget.sqlite" });
    dbInstance = new PowerSyncDatabase({
      schema: AppSchema,
      database: factory,
    });
  }
  return dbInstance;
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [db] = useState(getDatabase);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    db.init().then(() => setIsReady(true));
  }, [db]);

  useEffect(() => {
    if (!user) {
      // When user signs out, disconnect and clear local data
      db.disconnectAndClear().catch(() => {
        // Ignore errors if not connected
      });
    }
    // When Supabase is configured, add: db.connect(connector) here
  }, [user, db]);

  if (!isReady) return null;

  return (
    <PowerSyncContext.Provider value={db}>
      {children}
    </PowerSyncContext.Provider>
  );
}
