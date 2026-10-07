"use client";

import { useRouter } from "next/navigation";
import { logout } from "../api";
import { clearToken, getToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
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

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      Log out
    </Button>
  );
}
