import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { Modal, field, btn } from "@/admin/ui"

/**
 * Styled in-app replacements for the browser's native `confirm()` / `prompt()`
 * dialogs (the "site says…" popups). Provided once at the admin root; any
 * admin component can call `confirm`, `prompt`, or the `confirmThen` shortcut.
 */

type ConfirmOpts = {
  message: string
  title?: string
  confirmLabel?: string
}

type PromptOpts = {
  title: string
  message?: string
  defaultValue?: string
  placeholder?: string
  confirmLabel?: string
}

type Req =
  | {
      kind: "confirm"
      title: string
      message: string
      confirmLabel: string
      resolve: (v: boolean) => void
    }
  | {
      kind: "prompt"
      title: string
      message?: string
      placeholder?: string
      confirmLabel: string
      resolve: (v: string | null) => void
    }

type DialogApi = {
  confirm: (opts: ConfirmOpts) => Promise<boolean>
  prompt: (opts: PromptOpts) => Promise<string | null>
  /** Shortcut: run `fn` only if the user confirms. */
  confirmThen: (message: string, fn: () => void, opts?: ConfirmOpts) => void
}

const DialogContext = createContext<DialogApi | null>(null)

export function DialogProvider({ children }: { children: ReactNode }) {
  const [req, setReq] = useState<Req | null>(null)
  const [value, setValue] = useState("")

  const confirm = useCallback(
    (opts: ConfirmOpts) =>
      new Promise<boolean>((resolve) => {
        setReq({
          kind: "confirm",
          title: opts.title ?? "Please confirm",
          message: opts.message,
          confirmLabel: opts.confirmLabel ?? "Confirm",
          resolve,
        })
      }),
    [],
  )

  const prompt = useCallback(
    (opts: PromptOpts) =>
      new Promise<string | null>((resolve) => {
        setValue(opts.defaultValue ?? "")
        setReq({
          kind: "prompt",
          title: opts.title,
          message: opts.message,
          placeholder: opts.placeholder,
          confirmLabel: opts.confirmLabel ?? "Save",
          resolve,
        })
      }),
    [],
  )

  const confirmThen = useCallback(
    (message: string, fn: () => void, opts?: ConfirmOpts) => {
      void confirm({ ...opts, message }).then((ok) => {
        if (ok) fn()
      })
    },
    [confirm],
  )

  function finishConfirm(result: boolean) {
    if (req?.kind === "confirm") req.resolve(result)
    setReq(null)
  }

  function finishPrompt(result: string | null) {
    if (req?.kind === "prompt") req.resolve(result)
    setReq(null)
  }

  return (
    <DialogContext.Provider value={{ confirm, prompt, confirmThen }}>
      {children}
      {req?.kind === "confirm" && (
        <Modal title={req.title} onClose={() => finishConfirm(false)}>
          <p className="text-espresso/85">{req.message}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" className={btn.secondary} onClick={() => finishConfirm(false)}>
              Cancel
            </button>
            <button type="button" className={btn.primary} onClick={() => finishConfirm(true)}>
              {req.confirmLabel}
            </button>
          </div>
        </Modal>
      )}
      {req?.kind === "prompt" && (
        <Modal title={req.title} onClose={() => finishPrompt(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              finishPrompt(value.trim() ? value.trim() : null)
            }}
          >
            {req.message && <p className="mb-3 text-espresso/80">{req.message}</p>}
            <input
              autoFocus
              className={field}
              value={value}
              placeholder={req.placeholder}
              onChange={(e) => setValue(e.target.value)}
            />
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className={btn.secondary} onClick={() => finishPrompt(null)}>
                Cancel
              </button>
              <button type="submit" className={btn.primary}>
                {req.confirmLabel}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DialogContext.Provider>
  )
}

export function useDialogs(): DialogApi {
  const ctx = useContext(DialogContext)
  if (!ctx) {
    throw new Error("useDialogs must be used within a DialogProvider.")
  }
  return ctx
}
