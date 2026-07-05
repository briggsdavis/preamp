import { label, field } from "@/admin/ui";

/**
 * Optional start/end scheduling inputs shared by the announcement + pop-up
 * editors. Values are epoch ms; the inputs are `datetime-local` (visitor-local
 * wall-clock). Leaving both blank means "live as soon as it's turned on, until
 * turned off".
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** epoch ms → "YYYY-MM-DDTHH:mm" in local time (for datetime-local inputs). */
export function toLocalInput(ms?: number): string {
  if (ms == null) return "";
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** "YYYY-MM-DDTHH:mm" (local) → epoch ms, or undefined when blank/invalid. */
export function fromLocalInput(s: string): number | undefined {
  if (!s) return undefined;
  const ms = new Date(s).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

export type ScheduleStatus = "live" | "scheduled" | "ended" | "off";

/** Current schedule status of an entity, for the admin list badge. */
export function scheduleStatus(
  active: boolean,
  startsAt: number | undefined,
  endsAt: number | undefined,
  now: number = Date.now(),
): ScheduleStatus {
  if (!active) return "off";
  if (endsAt != null && now > endsAt) return "ended";
  if (startsAt != null && now < startsAt) return "scheduled";
  return "live";
}

export function StatusBadge({ status }: { status: ScheduleStatus }) {
  const styles: Record<ScheduleStatus, string> = {
    live: "bg-[#4a7c4e] text-cream",
    scheduled: "bg-gold text-espresso",
    ended: "bg-espresso/20 text-espresso/70",
    off: "bg-espresso/10 text-espresso/50",
  };
  const labels: Record<ScheduleStatus, string> = {
    live: "● Live",
    scheduled: "◷ Scheduled",
    ended: "Ended",
    off: "Off",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function ScheduleFields({
  startsAt,
  endsAt,
  onChange,
}: {
  startsAt?: number;
  endsAt?: number;
  onChange: (next: { startsAt?: number; endsAt?: number }) => void;
}) {
  const invalid =
    startsAt != null && endsAt != null && endsAt <= startsAt;
  return (
    <div>
      <label className={label}>Schedule (optional)</label>
      <p className="mb-2 text-xs text-espresso/55">
        Leave blank to go live as soon as it's turned on. Scheduling a new one
        for a later time automatically replaces the current one when its window
        opens.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <span className="mb-1 block text-xs font-semibold text-espresso/60">
            Starts
          </span>
          <input
            type="datetime-local"
            className={field}
            value={toLocalInput(startsAt)}
            onChange={(e) =>
              onChange({ startsAt: fromLocalInput(e.target.value), endsAt })
            }
          />
        </div>
        <div>
          <span className="mb-1 block text-xs font-semibold text-espresso/60">
            Ends
          </span>
          <input
            type="datetime-local"
            className={field}
            value={toLocalInput(endsAt)}
            onChange={(e) =>
              onChange({ startsAt, endsAt: fromLocalInput(e.target.value) })
            }
          />
        </div>
      </div>
      {invalid && (
        <p className="mt-1 text-xs font-semibold text-brick">
          The end time must be after the start time.
        </p>
      )}
    </div>
  );
}
