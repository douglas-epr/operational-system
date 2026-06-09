/**
 * Per-block paginating PDF exporter for the Sandbox Planner.
 *
 * Walks a rendered preview surface block-by-block, captures each block to its
 * own canvas via html2canvas, and places blocks on the PDF page, starting a new
 * page when the next block wouldn't fit. This keeps paragraphs, list items,
 * table rows, and headings intact at page boundaries — unlike the previous
 * single-canvas tile slicing that bisected text.
 *
 * For a single block that is itself taller than one usable page, we scan the
 * canvas pixels for a horizontal near-white band and slice there (falls back
 * to a centre cut only if no band is found in the lower 30% of the page).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ExportOptions {
  /** An already-rendered, hex-styled preview surface (no oklch colors). */
  source: HTMLElement;
  /** Final filename, must include ".pdf". */
  filename: string;
  /** Page margin in mm (default 12). */
  pageMarginMm?: number;
  /** Vertical gap in mm placed after each block (default 2). */
  blockGapMm?: number;
  /** CSS selector used to enumerate top-level blocks. */
  blockSelector?: string;
}

const DEFAULT_BLOCK_SELECTOR =
  "h1,h2,h3,h4,h5,h6,p,ul,ol,blockquote,table,hr,img,figure,pre,.keep-together,.prd-section,.report-section";

/**
 * Walks a source element and returns only the outermost matching blocks —
 * i.e. if a block contains a nested matching block, only the parent is kept.
 * This prevents double-rendering nested content.
 */
function collectTopLevelBlocks(
  source: HTMLElement,
  selector: string
): HTMLElement[] {
  const matches = Array.from(
    source.querySelectorAll(selector)
  ) as HTMLElement[];
  const kept: HTMLElement[] = [];
  for (const el of matches) {
    let isNested = false;
    for (const parent of kept) {
      if (parent.contains(el)) {
        isNested = true;
        break;
      }
    }
    if (!isNested) kept.push(el);
  }
  return kept;
}

/**
 * Scan the bottom-up pixels of a canvas for a horizontal near-white band
 * (all pixels in a row ≥ ~245 RGB) at least `minBandHeightPx` tall, located
 * above `maxSliceY`. Returns the pixel row at which to slice (splitting the
 * canvas into a top half that fits on the page and a bottom half that flows
 * onto the next). Returns null if no suitable band is found.
 */
function findWhiteBandSlicePoint(
  canvas: HTMLCanvasElement,
  maxSliceY: number,
  minBandHeightPx = 4
): number | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  try {
    const { width, height } = canvas;
    const startY = Math.min(maxSliceY, height - 1);
    const floorY = Math.max(0, Math.floor(height * 0.3));
    const sampleStep = Math.max(1, Math.floor(width / 80)); // sample ~80 columns per row
    let img: ImageData;
    try {
      img = ctx.getImageData(0, 0, width, height);
    } catch {
      return null;
    }
    const data = img.data;
    const rowIsWhite = (y: number) => {
      for (let x = 0; x < width; x += sampleStep) {
        const i = (y * width + x) * 4;
        const r = data[i]!;
        const g = data[i + 1]!;
        const b = data[i + 2]!;
        const a = data[i + 3]!;
        if (a < 10) continue; // transparent counts as white
        if (r < 245 || g < 245 || b < 245) return false;
      }
      return true;
    };
    // Walk upward from startY, looking for a band ≥ minBandHeightPx tall.
    let bandBottom = -1;
    let bandTop = -1;
    for (let y = startY; y >= floorY; y--) {
      if (rowIsWhite(y)) {
        if (bandBottom === -1) bandBottom = y;
        bandTop = y;
        if (bandBottom - bandTop + 1 >= minBandHeightPx) {
          // Slice at the middle of the band for symmetry.
          return Math.floor((bandTop + bandBottom) / 2);
        }
      } else {
        bandBottom = -1;
        bandTop = -1;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Copy a horizontal strip of a source canvas into a fresh canvas. */
function sliceCanvas(
  src: HTMLCanvasElement,
  yStart: number,
  yEnd: number
): HTMLCanvasElement {
  const slice = document.createElement("canvas");
  slice.width = src.width;
  slice.height = Math.max(1, yEnd - yStart);
  const sctx = slice.getContext("2d");
  if (sctx) {
    sctx.fillStyle = "#ffffff";
    sctx.fillRect(0, 0, slice.width, slice.height);
    sctx.drawImage(
      src,
      0,
      yStart,
      src.width,
      slice.height,
      0,
      0,
      src.width,
      slice.height
    );
  }
  return slice;
}

/**
 * Export an element to a paginated A4 PDF without bisecting any block-level
 * element at a page boundary.
 */
export async function exportElementToPdf(opts: ExportOptions): Promise<void> {
  const {
    source,
    filename,
    pageMarginMm = 12,
    blockGapMm = 2,
    blockSelector = DEFAULT_BLOCK_SELECTOR,
  } = opts;

  // Dynamic imports so the bundles stay client-only and tree-shake in SSR.
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const contentW = pageW - 2 * pageMarginMm;
  const usableH = pageH - 2 * pageMarginMm;

  const sourceWidthPx = source.offsetWidth || source.clientWidth || 800;
  // 1 mm = pxPerMm px in the source (before html2canvas scale).
  const pxPerMm = sourceWidthPx / contentW;

  const blocks = collectTopLevelBlocks(source, blockSelector);
  if (blocks.length === 0) {
    blocks.push(source);
  }

  const SCALE = 2;
  let cursorY = pageMarginMm;
  let isFirstImage = true;

  const addCanvasToPdf = async (canvas: HTMLCanvasElement) => {
    // Canvas was rendered at SCALE — divide by SCALE to convert to mm.
    let hMm = canvas.height / SCALE / pxPerMm;

    // Block fits on current page.
    if (cursorY + hMm <= pageH - pageMarginMm) {
      if (!isFirstImage || cursorY > pageMarginMm) {
        // normal flow
      }
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      pdf.addImage(imgData, "JPEG", pageMarginMm, cursorY, contentW, hMm);
      cursorY += hMm + blockGapMm;
      isFirstImage = false;
      return;
    }

    // Block doesn't fit on current page. Start a new page unless we're
    // already at the top of a blank page.
    if (cursorY > pageMarginMm) {
      pdf.addPage();
      cursorY = pageMarginMm;
    }

    // Block fits on a fresh page.
    if (hMm <= usableH) {
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      pdf.addImage(imgData, "JPEG", pageMarginMm, cursorY, contentW, hMm);
      cursorY += hMm + blockGapMm;
      isFirstImage = false;
      return;
    }

    // Block is taller than a page — slice at a white band close to the page
    // break, recurse on the remainder.
    const pagePx = usableH * pxPerMm * SCALE;
    const slicePoint = findWhiteBandSlicePoint(canvas, Math.floor(pagePx));
    const cut =
      slicePoint ?? Math.min(Math.floor(pagePx), canvas.height - 1);
    const top = sliceCanvas(canvas, 0, cut);
    const bottom = sliceCanvas(canvas, cut, canvas.height);
    const topMm = top.height / SCALE / pxPerMm;
    const topData = top.toDataURL("image/jpeg", 0.92);
    pdf.addImage(topData, "JPEG", pageMarginMm, cursorY, contentW, topMm);
    pdf.addPage();
    cursorY = pageMarginMm;
    await addCanvasToPdf(bottom);
  };

  for (const block of blocks) {
    // Skip empty blocks (no text, no children with size).
    const rect = block.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;

    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(block as any, {
        scale: SCALE,
        backgroundColor: "#ffffff",
        useCORS: true,
        windowWidth: sourceWidthPx,
        logging: false,
      });
    } catch (err) {
      console.error("exportElementToPdf: html2canvas failed for block", err);
      continue;
    }

    await addCanvasToPdf(canvas);
  }

  pdf.save(filename);
}
