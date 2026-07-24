/**
 * Tiny CSV builder + download helper for the analytics exports. Everything is
 * client-side: build a string from rows and trigger a browser download.
 */

type Cell = string | number | boolean | null | undefined
type Row = Record<string, Cell>

/** Quote a single cell per RFC 4180 (wrap + double any inner quotes). */
function cell(value: Cell): string {
  if (value === null || value === undefined) return ""
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Serialize rows to CSV. Columns come from `headers` (if given) or the union of
 * keys across rows, preserving first-seen order.
 */
export function toCsv(rows: Row[], headers?: string[]): string {
  const cols =
    headers ??
    rows.reduce<string[]>((acc, r) => {
      for (const k of Object.keys(r)) if (!acc.includes(k)) acc.push(k)
      return acc
    }, [])
  const lines = [cols.map(cell).join(",")]
  for (const r of rows) lines.push(cols.map((c) => cell(r[c])).join(","))
  return lines.join("\r\n")
}

/** Trigger a browser download of `text` as `filename`. */
export function downloadText(
  filename: string,
  text: string,
  mime = "text/csv;charset=utf-8",
): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Give the download a tick before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Build a CSV from rows and download it. */
export function downloadCsv(filename: string, rows: Row[], headers?: string[]): void {
  downloadText(filename, toCsv(rows, headers))
}
