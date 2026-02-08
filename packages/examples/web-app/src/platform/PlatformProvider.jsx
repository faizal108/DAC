import { useEffect, useState } from "react";
import { PlatformContext } from "./PlatformContext";

import { ConfigService } from "@dac/core-config";
import { AuthService } from "@dac/core-auth";
import { LocalProvider } from "@dac/core-auth/Providers/LocalProvider";

export function PlatformProvider({ children }) {
  const [platform, setPlatform] = useState(null);

  useEffect(() => {
    async function init() {
      const config = new ConfigService();
      await config.load();

      const auth = new AuthService(new LocalProvider());
      await auth.load();

      setPlatform({ config, auth });
    }

    init();
  }, []);

  if (!platform) {
    return <div>Loading platform…</div>;
  }

  return (
    <PlatformContext.Provider value={platform}>
      {children}
    </PlatformContext.Provider>
  );
}
