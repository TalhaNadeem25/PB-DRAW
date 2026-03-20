/**
 * Returns true on iOS Safari and iOS WKWebView (Capacitor).
 * iOS does not support iframe-based printing — window.open must be used instead.
 */
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPad on iOS 13+ reports as MacIntel with touch support
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Prints HTML content cross-platform.
 * - Desktop / Android: hidden iframe (no popup blocker issues)
 * - iOS / Safari:      window.open (iframe printing is broken on iOS)
 */
export function printHTML(html: string, title: string) {
  const fullDoc = `<!DOCTYPE html><html><head><title>${title}</title>${html}</html>`;

  if (isIOS()) {
    // iOS Safari doesn't fire print from iframes — open a new tab instead.
    const win = window.open("", "_blank");
    if (!win) {
      alert("Please allow pop-ups for this site to enable printing.");
      return;
    }
    win.document.write(fullDoc);
    win.document.close();
    // Give the page time to render before opening the print dialog
    setTimeout(() => {
      win.focus();
      win.print();
      // Don't auto-close — on iOS the user saves as PDF via the share sheet
      // after dismissing the print dialog, so let them close the tab manually.
    }, 400);
    return;
  }

  // Desktop / Android: hidden iframe avoids popup blockers entirely
  const existing = document.getElementById("__print_frame__");
  if (existing) existing.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "__print_frame__";
  iframe.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(fullDoc);
  doc.close();

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Print failed", e);
    }
    iframe.contentWindow?.addEventListener("afterprint", () => iframe.remove());
    // Fallback cleanup after 1 min in case afterprint doesn't fire
    setTimeout(() => iframe.remove(), 60_000);
  };
}
