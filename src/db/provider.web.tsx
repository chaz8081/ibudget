import "./web-polyfills";
import React, { useEffect, useState } from "react";
import { PowerSyncDatabase } from "@powersync/web";
import { PowerSyncContext } from "@powersync/react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AppSchema } from "./schema";

let dbInstance: PowerSyncDatabase | null = null;

function getDatabase(): PowerSyncDatabase {
  if (!dbInstance) {
    dbInstance = new PowerSyncDatabase({
      schema: AppSchema,
      database: { dbFilename: "ibudget.sqlite" },
      flags: { useWebWorker: false },
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
      db.disconnectAndClear().catch(() => {
        // Ignore errors if not connected
      });
    }
  }, [user, db]);

  if (!isReady) return null;

  return (
    <PowerSyncContext.Provider value={db}>
      {children}
    </PowerSyncContext.Provider>
  );
}
