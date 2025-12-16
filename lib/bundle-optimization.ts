/**
 * Bundle Optimization Utilities
 *
 * Use these functions to dynamically import heavy libraries
 * only when needed, reducing initial bundle size.
 */

/**
 * Dynamically import jsPDF for PDF generation
 * Usage: const { generatePDF } = await import("./bundle-optimization");
 *        const pdf = await generatePDF();
 */
export async function generatePDF() {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;

  return {
    jsPDF,
    autoTable,
  };
}

/**
 * Dynamically import xlsx for Excel operations
 * Usage: const { loadExcel } = await import("./bundle-optimization");
 *        const XLSX = await loadExcel();
 */
export async function loadExcel() {
  const XLSX = await import("xlsx");
  return XLSX;
}

/**
 * Dynamically import TipTap editor (heavy rich text editor)
 * Usage: const { loadTipTap } = await import("./bundle-optimization");
 *        const editor = await loadTipTap();
 */
export async function loadTipTap() {
  const [
    { useEditor },
    { StarterKit },
    { Color },
    { Highlight },
    { TextAlign },
    { TextStyle },
    { Underline },
  ] = await Promise.all([
    import("@tiptap/react"),
    import("@tiptap/starter-kit"),
    import("@tiptap/extension-color"),
    import("@tiptap/extension-highlight"),
    import("@tiptap/extension-text-align"),
    import("@tiptap/extension-text-style"),
    import("@tiptap/extension-underline"),
  ]);

  return {
    useEditor,
    StarterKit,
    Color,
    Highlight,
    TextAlign,
    TextStyle,
    Underline,
  };
}
