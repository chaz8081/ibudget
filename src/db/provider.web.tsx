import "./web-polyfills";
import React, { useEffect, useRef, useState } from "react";
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
  const hadUser = useRef(false);

  useEffect(() => {
    db.init().then(() => setIsReady(true));
  }, [db]);

  useEffect(() => {
    if (user) {
      hadUser.current = true;
    } else if (hadUser.current) {
      // Only clear when the user was signed in and then signed out,
      // not during initial load when user is momentarily null
      hadUser.current = false;
      db.disconnectAndClear().catch(() => {});
    }
  }, [user, db]);

  if (!isReady) return null;

  return (
    <PowerSyncContext.Provider value={db}>
      {children}
    </PowerSyncContext.Provider>
  );
}
