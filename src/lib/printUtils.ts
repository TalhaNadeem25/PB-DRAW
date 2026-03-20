/**
 * Prints HTML content in a hidden iframe (avoids popup blockers).
 * The iframe is removed after the print dialog is closed.
 */
export function printHTML(html: string, title: string) {
  // Remove any existing print iframe
  const existing = document.getElementById("__print_frame__");
  if (existing) existing.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "__print_frame__";
  iframe.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`<!DOCTYPE html><html><head><title>${title}</title>${html}</head><body></body></html>`);
  doc.close();

  // Wait for content to load then print
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Print failed", e);
    }
    // Remove iframe after dialog closes
    iframe.contentWindow?.addEventListener("afterprint", () => iframe.remove());
    // Fallback removal in case afterprint doesn't fire
    setTimeout(() => iframe.remove(), 60_000);
  };
}
