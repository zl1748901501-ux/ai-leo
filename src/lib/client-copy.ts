"use client";

function copyWithFallback(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("fallback copy failed");
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error("copy timeout")), timeoutMs);
    }),
  ]);
}

export async function copyText(text: string, timeoutMs = 1200) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await withTimeout(navigator.clipboard.writeText(text), timeoutMs);
      return;
    } catch {
      copyWithFallback(text);
      return;
    }
  }

  copyWithFallback(text);
}
