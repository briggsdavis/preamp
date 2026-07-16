import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";

import { LoadingEditor, useCmsEditor } from "@/admin/CmsEditorKit";
import { useUpload } from "@/admin/useUpload";
import {
  InlineEditingProvider,
  preventCanvasInteraction,
} from "@/components/cms/InlineEditing";
import { GlobalContentProvider } from "@/lib/siteContent";
import { CmsContentPreviewProvider, type CmsKey } from "@/lib/siteContent";

const HomePage = lazy(() =>
  import("@/pages/Home").then((module) => ({ default: module.Home })),
);
const AboutPage = lazy(() =>
  import("@/pages/About").then((module) => ({ default: module.About })),
);
const ColdBrewPage = lazy(() =>
  import("@/pages/ColdBrew").then((module) => ({ default: module.ColdBrew })),
);

type PageKey = Exclude<CmsKey, "global">;

function setAtPath<T>(source: T, path: string, value: unknown): T {
  const copy = structuredClone(source);
  const parts = path.split(".");
  let cursor = copy as Record<string, unknown>;
  for (const part of parts.slice(0, -1)) {
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts.at(-1)!] = value;
  return copy;
}

function CanvasToolbar({
  canUndo,
  canRedo,
  dirty,
  saving,
  savedAt,
  error,
  onUndo,
  onRedo,
  onSave,
}: {
  canUndo: boolean;
  canRedo: boolean;
  dirty: boolean;
  saving: boolean;
  savedAt: number | null;
  error: string | null;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
}) {
  const status = error
    ? error
    : saving
      ? "Saving..."
      : dirty
        ? "Unsaved changes"
        : savedAt
          ? "Changes saved"
          : "Up to date";

  return (
    <div className="sticky top-0 z-[120] flex min-h-16 items-center justify-end gap-2 border-b-2 border-sand bg-cream px-4 py-2 shadow-sm">
      <button
        type="button"
        title="Undo"
        aria-label="Undo"
        disabled={!canUndo}
        onClick={onUndo}
        className="h-10 rounded-md border-2 border-sand px-3 text-sm font-semibold text-espresso transition-none hover:border-gold disabled:cursor-not-allowed disabled:opacity-30"
      >
        Undo
      </button>
      <button
        type="button"
        title="Redo"
        aria-label="Redo"
        disabled={!canRedo}
        onClick={onRedo}
        className="h-10 rounded-md border-2 border-sand px-3 text-sm font-semibold text-espresso transition-none hover:border-gold disabled:cursor-not-allowed disabled:opacity-30"
      >
        Redo
      </button>
      <span
        className={`ml-2 min-w-32 text-right text-xs font-semibold ${
          error ? "text-brick" : "text-espresso/60"
        }`}
      >
        {status}
      </span>
      <button
        type="button"
        disabled={!dirty || saving}
        onClick={onSave}
        className={`ml-2 min-w-36 rounded-md px-5 py-2.5 text-sm font-semibold transition-none ${
          dirty && !saving
            ? "bg-brick text-cream hover:bg-maroon"
            : "cursor-not-allowed bg-espresso/15 text-espresso/40"
        }`}
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function PageCanvasEditor({ cmsKey }: { cmsKey: PageKey }) {
  const editor = useCmsEditor(cmsKey);
  const uploadImage = useUpload();
  const contentRef = useRef(editor.content);
  const transactionRef = useRef<typeof editor.content | null>(null);
  const pastRef = useRef<Array<typeof editor.content>>([]);
  const futureRef = useRef<Array<typeof editor.content>>([]);
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });

  useEffect(() => {
    contentRef.current = editor.content;
  }, [editor.content]);

  if (!editor.ready) return <LoadingEditor />;

  function refresh() {
    setHistory({
      canUndo: pastRef.current.length > 0 || transactionRef.current !== null,
      canRedo: futureRef.current.length > 0,
    });
  }

  function applyContent(next: typeof editor.content) {
    contentRef.current = next;
    editor.setContent(next);
  }

  function beginTransaction() {
    if (!transactionRef.current) {
      transactionRef.current = structuredClone(contentRef.current);
      refresh();
    }
  }

  function commitTransaction() {
    const previous = transactionRef.current;
    transactionRef.current = null;
    if (previous && JSON.stringify(previous) !== JSON.stringify(contentRef.current)) {
      pastRef.current.push(previous);
      futureRef.current = [];
    }
    refresh();
  }

  function updateValue(path: string, value: unknown) {
    applyContent(setAtPath(contentRef.current, path, value));
  }

  function replaceValue(path: string, value: unknown) {
    commitTransaction();
    const previous = structuredClone(contentRef.current);
    const next = setAtPath(contentRef.current, path, value);
    if (JSON.stringify(previous) === JSON.stringify(next)) return;
    pastRef.current.push(previous);
    futureRef.current = [];
    applyContent(next);
    refresh();
  }

  function undo() {
    commitTransaction();
    const previous = pastRef.current.pop();
    if (!previous) return;
    futureRef.current.unshift(structuredClone(contentRef.current));
    applyContent(previous);
    refresh();
  }

  function redo() {
    commitTransaction();
    const next = futureRef.current.shift();
    if (!next) return;
    pastRef.current.push(structuredClone(contentRef.current));
    applyContent(next);
    refresh();
  }

  const Page = cmsKey === "home" ? HomePage : cmsKey === "about" ? AboutPage : ColdBrewPage;

  return (
    <div className="min-w-0 bg-cream-deep">
      <CanvasToolbar
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        dirty={editor.dirty}
        saving={editor.saving}
        savedAt={editor.savedAt}
        error={editor.error}
        onUndo={undo}
        onRedo={redo}
        onSave={() => {
          commitTransaction();
          void editor.save();
        }}
      />
      <div
        className="cms-page-canvas min-h-[calc(100vh-4rem)] overflow-hidden bg-cream"
        onClickCapture={preventCanvasInteraction}
      >
        <MotionConfig reducedMotion="always" transition={{ duration: 0 }}>
          <GlobalContentProvider>
            <CmsContentPreviewProvider cmsKey={cmsKey} content={editor.content}>
              <InlineEditingProvider
                value={{
                  beginTransaction,
                  commitTransaction,
                  replaceValue,
                  updateValue,
                  uploadImage,
                }}
              >
                <Suspense fallback={<div className="min-h-screen bg-cream" />}>
                  <Page />
                </Suspense>
              </InlineEditingProvider>
            </CmsContentPreviewProvider>
          </GlobalContentProvider>
        </MotionConfig>
      </div>
    </div>
  );
}

export function HomeEditor() {
  return <PageCanvasEditor cmsKey="home" />;
}

export function AboutEditor() {
  return <PageCanvasEditor cmsKey="about" />;
}

export function ColdBrewEditor() {
  return <PageCanvasEditor cmsKey="cold-brew" />;
}
