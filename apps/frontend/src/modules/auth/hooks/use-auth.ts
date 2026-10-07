"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { getMe } from "../api";
import type { UserDto } from "../types";

export function useAuth() {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      Promise.resolve().then(() => setLoading(false));
      return;
    }
    getMe(token)
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
