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
// Uses html-to-image which correctly captures the full element including
// mixed SVG/HTML content, CSS custom properties, and the complete chart
// (axes, legend, title bar — not just the inner SVG plot area).
// ---------------------------------------------------------------------------

/** Walk all SVG elements and bake computed styles as explicit attributes. */
function bakeSvgStyles(originalSvg: SVGElement, clonedSvg: SVGElement): void {
  const origNodes = [originalSvg, ...Array.from(originalSvg.querySelectorAll("*"))];
  const cloneNodes = [clonedSvg, ...Array.from(clonedSvg.querySelectorAll("*"))];

  for (let i = 0; i < origNodes.length; i++) {
    const origEl = origNodes[i];
    const cloneEl = cloneNodes[i];
    const computed = getComputedStyle(origEl);

    // Bake essential SVG styling properties
    const propsToBake = [
      "fill", "stroke", "stroke-width", "stroke-dasharray", "opacity",
      "font-family", "font-size", "font-weight", "text-anchor", "color"
    ];

    for (const prop of propsToBake) {
      const val = computed.getPropertyValue(prop);
      // Don't bake default transparent/none values to keep payload small
      if (val && val !== "none" && val !== "rgba(0, 0, 0, 0)") {
        cloneEl.setAttribute(prop, val);
      }
    }
  }
}

export async function exportToPng(
  elementId: string,
  filename: string
): Promise<void> {
  const container = document.getElementById(elementId);
  if (!container) {
    console.error(`exportToPng: element with id "${elementId}" not found.`);
    return;
  }

  const safe = filename.replace(/[^a-z0-9_-]/gi, "_");

  // Inline CSS vars on all Recharts SVGs before capture so html-to-image
  // sees real color values rather than var(--color-*) tokens.
  const rechartssvgs = container.querySelectorAll<SVGElement>("svg.recharts-surface");
  for (const svg of rechartssvgs) {
    bakeSvgStyles(svg, svg); // mutate in-place temporarily — html-to-image clones internally
  }

  try {
    // html-to-image captures the whole element: header, chart, legend, axes.
    // It handles CSS variables and mixed SVG+HTML content correctly.
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(container, {
      backgroundColor: "#0f0f0f",
      pixelRatio: 2, // retina quality
      skipFonts: false,
      // Ensure the full rendered size is captured
      width: container.offsetWidth,
      height: container.offsetHeight,
    });
    triggerDownload(dataUrl, safe);
  } catch (err) {
    console.error("exportToPng: html-to-image failed, falling back to html2canvas", err);
    // Last-resort fallback
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(container, {
      backgroundColor: "#0f0f0f",
      scale: 2,
      logging: false,
      useCORS: true,
    });
    triggerDownload(canvas.toDataURL("image/png"), safe);
  }
}

function triggerDownload(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
