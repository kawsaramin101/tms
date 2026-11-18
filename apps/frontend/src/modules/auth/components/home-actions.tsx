"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../hooks/use-auth";

export function HomeActions() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <Button size="lg" asChild>
        <Link href="/transactions">
          Go to dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button size="lg" asChild>
        <Link href="/register">
          Get started
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
      <Button size="lg" variant="outline" asChild>
        <Link href="/login">Log in</Link>
      </Button>
    </>
  );
}
