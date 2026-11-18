"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getServerTokenSnapshot,
  getTokenSnapshot,
  subscribeToAuth,
} from "@/lib/auth";
import { getMe } from "../api";
import type { UserDto } from "../types";

export function useAuth() {
  const token = useSyncExternalStore(
    subscribeToAuth,
    getTokenSnapshot,
    getServerTokenSnapshot,
  );
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(() => {
      if (!active) return;

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      getMe(token)
        .then((nextUser) => {
          if (active) setUser(nextUser);
        })
        .catch(() => {
          if (active) setUser(null);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });

    return () => {
      active = false;
    };
  }, [token]);

  return { user, loading, token, isAuthenticated: token !== null };
}
