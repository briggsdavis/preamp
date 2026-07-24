import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { useMutation } from "convex/react"
import { motion } from "motion/react"
import { useState, type FormEvent } from "react"
import { PageWrapper } from "@/components/site/page-wrapper"
import { SquiggleLine } from "@/components/site/squiggle-line"

/** Shared white field styling used throughout the application form. */
const fieldClass =
  "w-full rounded-xl border-2 border-sand bg-white px-4 py-3 text-espresso placeholder:text-espresso/55 outline-none transition-colors focus:border-gold"

const labelClass = "mb-2 block font-semibold text-espresso"

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
  )
}

/** A labelled radio styled to match the retro form. */
function Radio({
  name,
  value,
  label,
  required,
}: {
  name: string
  value: string
  label: string
  required?: boolean
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
  )
}

export function Hiring() {
  const submitHiring = useMutation(api.inquiries.submitHiring)
  const generateResumeUploadUrl = useMutation(api.inquiries.generateResumeUploadUrl)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const str = (name: string) => String(fd.get(name) ?? "").trim()

    setSending(true)
    setError(null)
    try {
      // Upload the resume (if provided) to Convex storage.
      let resumeStorageId: Id<"_storage"> | undefined
      let resumeName: string | undefined
      const resume = fd.get("resume")
      if (resume instanceof File && resume.size > 0) {
        const url = await generateResumeUploadUrl()
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": resume.type },
          body: resume,
        })
        if (!res.ok) throw new Error("resume upload failed")
        resumeStorageId = ((await res.json()) as { storageId: Id<"_storage"> }).storageId
        resumeName = resume.name
      }

      // Part-Time / Full-Time checkboxes.
      const availability: string[] = []
      if (fd.get("avail-part")) availability.push("Part-Time")
      if (fd.get("avail-full")) availability.push("Full-Time")

      await submitHiring({
        name: str("name"),
        email: str("email"),
        phone: str("phone"),
        coffeeExperience: str("coffeeExperience"),
        availability,
        favoriteCoffeeShop: str("favoriteCoffeeShop"),
        favoriteRecord: str("favoriteRecord"),
        resumeStorageId,
        resumeName,
      })
      setSent(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setError("Something went wrong submitting your application. Try again.")
      setSending(false)
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

        <div className="relative mx-auto max-w-2xl px-5 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-[2rem] border-4 border-sand bg-cream p-7 shadow-2xl shadow-maroon/15 md:p-12"
          >
            <header className="text-center">
              <h2 className="font-display text-5xl text-orange md:text-6xl">Send Your Resume</h2>
              <p className="mt-4 text-lg text-espresso/80">
                Keep it short and sweet - tell us who you are, drop your resume, and we'll be in
                touch.
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
              <form onSubmit={handleSubmit} className="mt-10 space-y-6">
                <div>
                  <label className={labelClass} htmlFor="name">
                    Full Name
                  </label>
                  <input
                    id="name"
                    required
                    name="name"
                    placeholder="Your full name"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    required
                    type="email"
                    name="email"
                    placeholder="you@email.com"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="phone">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    required
                    type="tel"
                    name="phone"
                    placeholder="(000) 000-0000"
                    pattern="[\(]?[0-9]{3}[\)]?[-\s]?[0-9]{3}[-\s]?[0-9]{4}"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Resume Upload</label>
                  <input
                    type="file"
                    name="resume"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg"
                    className="w-full rounded-xl border-2 border-sand bg-white px-4 py-3 text-espresso file:mr-4 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:font-semibold file:text-espresso hover:file:bg-amber"
                  />
                  <p className="mt-2 text-sm text-espresso/60">pdf, doc, docx, jpg, or jpeg</p>
                </div>

                <div>
                  <p className={labelClass}>Do you have coffee experience?</p>
                  <div className="flex gap-8">
                    <Radio name="coffeeExperience" value="yes" label="Yes" required />
                    <Radio name="coffeeExperience" value="no" label="No" />
                  </div>
                </div>

                <div>
                  <p className={labelClass}>Availability</p>
                  <div className="flex flex-wrap gap-8">
                    <CheckBox name="avail-part" label="Part-Time" />
                    <CheckBox name="avail-full" label="Full-Time" />
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="favoriteCoffeeShop">
                    Favorite Coffee Shop
                  </label>
                  <input
                    id="favoriteCoffeeShop"
                    name="favoriteCoffeeShop"
                    placeholder="Where do you love to grab a cup?"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="favoriteRecord">
                    Favorite Record
                  </label>
                  <input
                    id="favoriteRecord"
                    name="favoriteRecord"
                    placeholder="What's spinning on your turntable?"
                    className={fieldClass}
                  />
                </div>

                {error && <p className="text-center font-semibold text-maroon">{error}</p>}
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
  )
}
