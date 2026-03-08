import React, { useEffect, useRef, useState } from "react";
import { PowerSyncDatabase } from "@powersync/react-native";
import { PowerSyncContext } from "@powersync/react";
import { OPSqliteOpenFactory } from "@powersync/op-sqlite";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AppSchema } from "./schema";
import { SupabaseConnector } from "./connector";
import { POWERSYNC_URL } from "@/lib/constants";

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

const isLocalAuth = process.env.EXPO_PUBLIC_AUTH_PROVIDER === "local";

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
      // Connect to PowerSync when using real Supabase auth
      if (!isLocalAuth && POWERSYNC_URL) {
        const connector = new SupabaseConnector();
        db.connect(connector);
      }
    } else if (hadUser.current) {
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
