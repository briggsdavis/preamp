import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

import { PageWrapper } from "@/components/site/PageWrapper";
import { SquiggleLine } from "@/components/site/SquiggleLine";

/** Shared white field styling used throughout the application form. */
const fieldClass =
  "w-full rounded-xl border-2 border-sand bg-white px-4 py-3 text-espresso placeholder:text-espresso/55 outline-none transition-colors focus:border-gold";

const labelClass = "mb-2 block font-semibold text-espresso";

const sectionTitleClass =
  "font-display text-4xl text-orange md:text-5xl";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** A labelled checkbox styled to match the retro form. */
function CheckBox({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex items-center gap-3 text-espresso">
      <input
        type="checkbox"
        name={name}
        className="h-5 w-5 rounded border-2 border-espresso/40 accent-orange"
      />
      <span className="font-medium">{label}</span>
    </label>
  );
}

/** A labelled radio styled to match the retro form. */
function Radio({
  name,
  value,
  label,
  required,
}: {
  name: string;
  value: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 text-espresso">
      <input
        type="radio"
        name={name}
        value={value}
        required={required}
        className="h-5 w-5 border-2 border-espresso/40 accent-orange"
      />
      <span className="font-medium">{label}</span>
    </label>
  );
}

/** One employer block for the Employment History section. */
function EmployerBlock({ index }: { index: number }) {
  return (
    <div className="space-y-5">
      <h4 className="font-groovy text-xl uppercase tracking-[0.15em] text-orange">
        Employer {index}
      </h4>
      <input
        name={`emp${index}Company`}
        placeholder="Company Name"
        className={fieldClass}
      />
      <input
        name={`emp${index}Phone`}
        placeholder="Employer Phone"
        className={fieldClass}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Start Date</label>
          <input
            type="datetime-local"
            name={`emp${index}Start`}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass}>End Date</label>
          <input
            type="datetime-local"
            name={`emp${index}End`}
            className={fieldClass}
          />
        </div>
      </div>
      <input
        name={`emp${index}Position`}
        placeholder="Position"
        className={fieldClass}
      />
      <div>
        <p className={labelClass}>May we contact?</p>
        <div className="flex gap-8">
          <Radio name={`emp${index}Contact`} value="yes" label="Yes" />
          <Radio name={`emp${index}Contact`} value="no" label="No" />
        </div>
      </div>
    </div>
  );
}

export function Hiring() {
  const submitHiring = useMutation(api.inquiries.submitHiring);
  const generateResumeUploadUrl = useMutation(
    api.inquiries.generateResumeUploadUrl,
  );
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const str = (name: string) => String(fd.get(name) ?? "").trim();

    setSending(true);
    setError(null);
    try {
      // Upload the resume (if provided) to Convex storage.
      let resumeStorageId: Id<"_storage"> | undefined;
      let resumeName: string | undefined;
      const resume = fd.get("resume");
      if (resume instanceof File && resume.size > 0) {
        const url = await generateResumeUploadUrl();
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": resume.type },
          body: resume,
        });
        if (!res.ok) throw new Error("resume upload failed");
        resumeStorageId = (
          (await res.json()) as { storageId: Id<"_storage"> }
        ).storageId;
        resumeName = resume.name;
      }

      // Per-day availability (AM/PM checkboxes).
      const availability: Record<string, string[]> = {};
      for (const day of DAYS) {
        const slots: string[] = [];
        if (fd.get(`avail-${day}-am`)) slots.push("AM");
        if (fd.get(`avail-${day}-pm`)) slots.push("PM");
        if (slots.length) availability[day] = slots;
      }

      // Employment history blocks.
      const employers = [1, 2]
        .map((i) => ({
          company: str(`emp${i}Company`),
          phone: str(`emp${i}Phone`),
          start: str(`emp${i}Start`),
          end: str(`emp${i}End`),
          position: str(`emp${i}Position`),
          mayContact: str(`emp${i}Contact`),
        }))
        .filter((emp) => emp.company);

      await submitHiring({
        firstName: str("firstName"),
        lastName: str("lastName"),
        email: str("email"),
        phone: str("phone"),
        city: str("city"),
        state: str("state"),
        position: str("position"),
        desiredSalary: str("salary"),
        hoursDesired: str("hours"),
        transportation: str("transportation"),
        resumeStorageId,
        resumeName,
        details: {
          address: {
            street: str("street"),
            street2: str("street2"),
            zip: str("zip"),
          },
          availability,
          restrictions: str("restrictions"),
          employers,
        },
      });
      setSent(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Something went wrong submitting your application. Try again.");
      setSending(false);
    }
  }

  return (
    <PageWrapper>
      {/* Hero banner - half the viewport */}
      <section className="relative flex h-[50vh] min-h-[360px] items-center justify-center overflow-hidden">
        <img
          src="/images/hiringBG.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-espresso/70 via-maroon/45 to-espresso/80" />
        <motion.h1
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          className="relative px-6 text-center font-display text-6xl text-cream drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)] md:text-8xl"
        >
          Join Our Team
        </motion.h1>
      </section>

      {/* Beige application section with squiggly line + beige form modal */}
      <section className="relative overflow-hidden bg-cream-deep py-20 md:py-28">
        <SquiggleLine side="left" rows={6} cornerRadius={120} marginY={120} />

        <div className="relative mx-auto max-w-3xl px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-[2rem] border-4 border-sand bg-cream p-7 shadow-2xl shadow-maroon/15 md:p-12"
          >
            <header className="text-center">
              <h2 className="font-display text-5xl text-orange md:text-6xl">
                Send Your Resume
              </h2>
              <p className="mt-4 text-lg text-espresso/80">
                Upload your resume and we will get back to you as soon as
                possible.
              </p>
            </header>

            {sent ? (
              <div className="py-16 text-center">
                <p className="font-display text-5xl text-orange">Thank You!</p>
                <p className="mt-4 text-lg text-espresso/80">
                  Your application is in. We'll be in touch soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-12 space-y-12">
                {/* Contact Info */}
                <div className="space-y-5">
                  <h3 className={sectionTitleClass}>Contact Info</h3>
                  <input
                    required
                    name="firstName"
                    placeholder="First Name (Required)"
                    className={fieldClass}
                  />
                  <input
                    required
                    name="lastName"
                    placeholder="Last Name (Required)"
                    className={fieldClass}
                  />
                  <input
                    required
                    name="street"
                    placeholder="Street Address (Required)"
                    className={fieldClass}
                  />
                  <input
                    name="street2"
                    placeholder="Street Address Line 2"
                    className={fieldClass}
                  />
                  <input
                    required
                    name="city"
                    placeholder="City (Required)"
                    className={fieldClass}
                  />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <input
                      required
                      name="state"
                      placeholder="State (Required)"
                      className={fieldClass}
                    />
                    <input
                      required
                      name="zip"
                      placeholder="Zip Code (Required)"
                      className={fieldClass}
                    />
                  </div>
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="Email Address (Required)"
                    className={fieldClass}
                  />
                  <div>
                    <input
                      required
                      type="tel"
                      name="phone"
                      placeholder="Phone Number (Required)"
                      pattern="[\(]?[0-9]{3}[\)]?[-\s]?[0-9]{3}[-\s]?[0-9]{4}"
                      className={fieldClass}
                    />
                    <p className="mt-2 text-sm text-espresso/60">
                      000-000-0000 or (000) 000-0000
                    </p>
                  </div>
                </div>

                {/* Job Details */}
                <div className="space-y-5">
                  <h3 className={sectionTitleClass}>Job Details</h3>
                  <div>
                    <label className={labelClass}>
                      What Position Are You Applying For? (Required)
                    </label>
                    <select
                      required
                      name="position"
                      defaultValue=""
                      className={fieldClass}
                    >
                      <option value="" disabled>
                        Select an option
                      </option>
                      <option value="barista">Barista</option>
                      <option value="shift-lead">Shift Lead</option>
                      <option value="kitchen">Kitchen / Food</option>
                      <option value="manager">Manager</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <input
                    required
                    name="salary"
                    placeholder="Desired Salary (Required)"
                    className={fieldClass}
                  />
                </div>

                {/* Availability */}
                <div className="space-y-6">
                  <h3 className={sectionTitleClass}>Availability</h3>
                  <input
                    required
                    name="hours"
                    placeholder="Number of Hours Desired (Required)"
                    className={fieldClass}
                  />
                  <div className="space-y-6">
                    {DAYS.map((day) => (
                      <div key={day}>
                        <p className="mb-3 font-semibold text-espresso">
                          {day} Availability (select all that apply)
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <CheckBox name={`avail-${day}-am`} label="AM" />
                          <CheckBox name={`avail-${day}-pm`} label="PM" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className={labelClass}>
                      Physical Restrictions (i.e. heavy lifting)
                    </label>
                    <textarea
                      name="restrictions"
                      rows={4}
                      className={`${fieldClass} resize-none`}
                    />
                  </div>
                  <div>
                    <p className={labelClass}>
                      Do you have your own transportation? (Required)
                    </p>
                    <div className="flex gap-8">
                      <Radio
                        name="transportation"
                        value="yes"
                        label="Yes"
                        required
                      />
                      <Radio name="transportation" value="no" label="No" />
                    </div>
                  </div>
                </div>

                {/* Employment History */}
                <div className="space-y-10">
                  <h3 className={sectionTitleClass}>Employment History</h3>
                  <EmployerBlock index={1} />
                  <EmployerBlock index={2} />
                </div>

                {/* Resume upload */}
                <div>
                  <label className={labelClass}>
                    Upload Your Resume (pdf, doc, docx, jpg, jpeg):
                  </label>
                  <input
                    type="file"
                    name="resume"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg"
                    className="w-full rounded-xl border-2 border-sand bg-white px-4 py-3 text-espresso file:mr-4 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:font-semibold file:text-espresso hover:file:bg-amber"
                  />
                </div>

                {error && (
                  <p className="text-center font-semibold text-maroon">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-full bg-orange px-7 py-4 text-lg font-semibold text-cream shadow-lg shadow-maroon/20 transition-all hover:-translate-y-1 hover:bg-terracotta disabled:opacity-60"
                >
                  {sending ? "Submitting…" : "Submit Application →"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </PageWrapper>
  );
}
