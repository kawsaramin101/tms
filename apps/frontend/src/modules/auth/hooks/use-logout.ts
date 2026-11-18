"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "../api";
import { clearToken, getToken } from "@/lib/auth";

export function useLogout() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    const token = getToken();
    if (token) {
      try {
        await logout(token);
      } catch {
        // Best-effort audit call; clear locally regardless.
      }
    }

    clearToken();
    router.push("/login");
  }

  return { logout: handleLogout, loggingOut };
}
