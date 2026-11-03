import type { VariantProps } from "class-variance-authority";
import { Badge, badgeVariants } from "@/components/ui/badge";

type BadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>["variant"]
>;

interface StatusBadgeProps {
  value: string;
}

function variantFor(status: string): BadgeVariant {
  switch (status) {
    case "APPROVED":
    case "PAID":
    case "COMPLETED":
    case "ACTIVE":
    case "Matched":
      return "default";
    case "PENDING":
    case "SUBMITTED":
    case "VERIFIED":
    case "Partially Settled":
    case "Unpaid":
      return "secondary";
    case "REJECTED":
    case "CANCELLED":
    case "Cancelled":
    case "Amount Mismatch":
      return "destructive";
    default:
      return "outline";
  }
}

export function StatusBadge({ value }: StatusBadgeProps) {
  return <Badge variant={variantFor(value)}>{value}</Badge>;
}
