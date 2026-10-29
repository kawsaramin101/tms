import { redirect } from "next/navigation";

/**
 * Keep the legacy navigation URL working while the reports UI lives under
 * the calculation section.
 */
export default function ReportsPage() {
  redirect("/calculation/reports");
}
