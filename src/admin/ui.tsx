import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Shared field styling for admin forms. */
export const field =
  "w-full rounded-xl border-2 border-sand bg-white px-3 py-2 text-espresso placeholder:text-espresso/50 outline-none transition-colors focus:border-gold";

export const label = "mb-1 block text-sm font-semibold text-espresso/80";

/** Primary / secondary / danger button class helpers. */
export const btn = {
  primary:
    "rounded-full bg-brick px-5 py-2 font-semibold text-cream transition-colors hover:bg-maroon disabled:opacity-60",
  secondary:
    "rounded-full border-2 border-espresso/25 px-5 py-2 font-semibold text-espresso transition-colors hover:bg-espresso/5",
  danger:
    "rounded-full border-2 border-brick/40 px-4 py-2 text-sm font-semibold text-brick transition-colors hover:bg-brick/10",
  small:
    "rounded-full bg-espresso/10 px-3 py-1.5 text-sm font-semibold text-espresso transition-colors hover:bg-espresso/20",
};

/** A centered modal dialog portaled to <body>, closing on Escape / backdrop. */
export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-espresso/70 p-4 py-10 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full rounded-3xl bg-cream shadow-2xl ${
          wide ? "max-w-3xl" : "max-w-xl"
        }`}
      >
        <div className="flex items-center justify-between border-b-2 border-sand px-6 py-4">
          <h2 className="font-display text-2xl text-espresso">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-espresso/10 text-espresso transition-colors hover:bg-espresso/20"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/** Confirm-then-call helper for destructive buttons. */
export function confirmThen(message: string, fn: () => void) {
  if (window.confirm(message)) fn();
}
