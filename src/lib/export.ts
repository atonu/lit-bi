import Papa from "papaparse";
import type { QueryRow } from "@/app/actions/execute-query";

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------
// Uses PapaParse to convert the row array to a properly escaped CSV string,
// then triggers a browser download via a temporary anchor element.
// ---------------------------------------------------------------------------

export function exportToCsv(rows: QueryRow[], filename: string): void {
  const csv = Papa.unparse(rows, {
    header: true,
    quotes: true,
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename.replace(/[^a-z0-9_-]/gi, "_")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// PNG Export
// ---------------------------------------------------------------------------
// Captures a DOM element as a PNG using html2canvas. We load it dynamically
// to avoid SSR issues (html2canvas relies on browser APIs).
// ---------------------------------------------------------------------------

export async function exportToPng(
  elementId: string,
  filename: string
): Promise<void> {
  const { default: html2canvas } = await import("html2canvas");

  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`exportToPng: element with id "${elementId}" not found.`);
    return;
  }

  const canvas = await html2canvas(element, {
    backgroundColor: "#1a1a1a", // Dark background for export
    scale: 2, // Retina quality
    logging: false,
    useCORS: true,
  });

  const link = document.createElement("a");
  link.download = `${filename.replace(/[^a-z0-9_-]/gi, "_")}.png`;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
