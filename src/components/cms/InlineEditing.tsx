/* eslint-disable react-refresh/only-export-components */
import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import type { CmsImage } from "@/lib/siteContent";

type InlineEditingContextValue = {
  beginTransaction: () => void;
  commitTransaction: () => void;
  replaceValue: (path: string, value: unknown) => void;
  updateValue: (path: string, value: unknown) => void;
  uploadImage: (file: File) => Promise<CmsImage["storageId"]>;
};

const InlineEditingContext = createContext<InlineEditingContextValue | null>(null);

export function InlineEditingProvider({
  value,
  children,
}: {
  value: InlineEditingContextValue;
  children: ReactNode;
}) {
  return (
    <InlineEditingContext.Provider value={value}>
      {children}
    </InlineEditingContext.Provider>
  );
}

export function useInlineEditingMode() {
  return useContext(InlineEditingContext) !== null;
}

export function EditableText({
  path,
  value,
}: {
  path: string;
  value: string;
}) {
  const editing = useContext(InlineEditingContext);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!editing || document.activeElement === ref.current) return;
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [editing, value]);

  if (!editing) return <>{value}</>;

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      tabIndex={0}
      title="Edit text"
      className="cms-editable-text inline-block min-h-[1em] min-w-8 max-w-full cursor-text rounded-sm outline-none"
      onFocus={editing.beginTransaction}
      onInput={(event) =>
        editing.updateValue(path, event.currentTarget.textContent ?? "")
      }
      onBlur={editing.commitTransaction}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      onPaste={(event) => {
        event.preventDefault();
        document.execCommand(
          "insertText",
          false,
          event.clipboardData.getData("text/plain").replace(/\s*\n+\s*/g, " "),
        );
      }}
    >
      {value}
    </span>
  );
}

export function EditableImage({
  path,
  value,
  ratio,
  className = "",
  children,
}: {
  path: string;
  value: CmsImage;
  ratio: string;
  className?: string;
  children: ReactElement<{ className?: string }>;
}) {
  const editing = useContext(InlineEditingContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!editing || !isValidElement(children)) return children;

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    try {
      const storageId = await editing.uploadImage(file);
      editing.replaceValue(path, {
        storageId,
        url: URL.createObjectURL(file),
        alt: value.alt,
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <span className={`group/cms-image relative block ${className}`} data-cms-control>
      {cloneElement(children, {
        className: `${children.props.className ?? ""} pointer-events-none`,
      })}
      <button
        type="button"
        title="Replace image"
        aria-label={`Replace image, recommended aspect ratio ${ratio}`}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="absolute inset-0 z-30 cursor-pointer border-2 border-transparent bg-transparent transition-none hover:border-gold hover:bg-espresso/15 focus-visible:border-gold focus-visible:outline-none"
      >
        <span className="absolute right-3 top-3 rounded bg-espresso/85 px-2.5 py-1 text-xs font-bold text-cream shadow-md">
          {uploading ? "Uploading" : ratio}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(event) => void onFile(event)}
      />
    </span>
  );
}

type LinkValue = { label: string; href: string };

export function EditableLink({
  path,
  value,
  children,
}: {
  path: string;
  value: LinkValue;
  children: ReactElement<{ onClick?: (event: MouseEvent<HTMLElement>) => void }>;
}) {
  const editing = useContext(InlineEditingContext);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });

  function close() {
    if (!open || !editing) return;
    setOpen(false);
    editing.commitTransaction();
  }

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  });

  if (!editing || !isValidElement(children)) return children;
  const activeEditing = editing;

  function openEditor(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const width = 320;
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    const preferredTop = rect.bottom + 10;
    const top = preferredTop + 190 < window.innerHeight
      ? preferredTop
      : Math.max(12, rect.top - 190);
    setPosition({ left, top });
    if (!open) activeEditing.beginTransaction();
    setOpen(true);
  }

  return (
    <span ref={anchorRef} className="inline-block" data-cms-control>
      {cloneElement(children, { onClick: openEditor })}
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Edit button"
            className="fixed z-[200] w-80 rounded-lg border-2 border-sand bg-cream p-4 text-left text-espresso shadow-2xl"
            style={position}
            data-cms-control
          >
            <label className="block text-xs font-bold uppercase text-espresso/60">
              Button text
              <input
                autoFocus
                value={value.label}
                onChange={(event) => editing.updateValue(`${path}.label`, event.target.value)}
                className="mt-1.5 w-full rounded-md border-2 border-sand bg-white px-3 py-2 text-sm font-normal text-espresso outline-none focus:border-gold"
              />
            </label>
            <label className="mt-3 block text-xs font-bold uppercase text-espresso/60">
              Destination
              <input
                value={value.href}
                placeholder="/contact or https://..."
                onChange={(event) => editing.updateValue(`${path}.href`, event.target.value)}
                className="mt-1.5 w-full rounded-md border-2 border-sand bg-white px-3 py-2 text-sm font-normal text-espresso outline-none focus:border-gold"
              />
            </label>
            <button
              type="button"
              onClick={close}
              className="mt-4 w-full rounded-md bg-espresso px-4 py-2 text-sm font-semibold text-cream"
            >
              Done
            </button>
          </div>,
          document.body,
        )}
    </span>
  );
}

export function preventCanvasInteraction(event: MouseEvent<HTMLElement>) {
  const target = event.target as HTMLElement;
  if (target.closest("[data-cms-control], .cms-editable-text")) return;
  if (target.closest("a, button, input, textarea, select, iframe")) {
    event.preventDefault();
    event.stopPropagation();
  }
}
