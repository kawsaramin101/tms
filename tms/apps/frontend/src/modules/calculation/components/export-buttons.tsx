"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { exportCsv, exportExcel } from "../utils";
import type { ExportTable } from "../types";

interface ExportButtonsProps {
  table: ExportTable;
  filename: string;
}

export function ExportButtons({ table, filename }: ExportButtonsProps) {
  const [error, setError] = useState<string | null>(null);

  function handleExport(format: "csv" | "excel") {
    setError(null);
    try {
      if (table.rows.length === 0) {
        setError("There is no report data to export.");
        return;
      }
      if (format === "csv") {
        exportCsv(table, filename);
      } else {
        exportExcel(table, filename);
      }
    } catch {
      setError("Export failed. Please try again.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleExport("csv")}
      >
        Export CSV
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleExport("excel")}
      >
        Export Excel
      </Button>
      {error ? <span className="text-sm text-destructive">{error}</span> : null}
    </div>
  );
}
