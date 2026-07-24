import { Resend } from "@convex-dev/resend"
import { components } from "./_generated/api"
import type { MutationCtx } from "./_generated/server"

const resend = new Resend(components.resend, { testMode: false })

function requireEnv(name: string): string {
  const runtime = globalThis as {
    process?: { env?: Record<string, string | undefined> }
  }
  const value = runtime.process?.env?.[name]?.trim()
  if (!value) throw new Error(`${name} is not set`)
  return value
}

function emailConfig(): { from: string; to: string } {
  return {
    from: requireEnv("RESEND_FROM_EMAIL"),
    to: requireEnv("SUBMISSION_NOTIFICATION_EMAIL"),
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function row(label: string, value: string): string {
  return `<tr><th align="left" style="padding:6px 16px 6px 0;vertical-align:top">${escapeHtml(label)}</th><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`
}

function resumeRow(name: string, url: string): string {
  return `<tr><th align="left" style="padding:6px 16px 6px 0;vertical-align:top">Resume</th><td style="padding:6px 0"><a href="${escapeHtml(url)}">${escapeHtml(name)}</a></td></tr>`
}

function emailHtml(title: string, rows: string[], message?: string): string {
  const messageBlock = message
    ? `<h2 style="font-size:16px;margin:24px 0 8px">Message</h2><div style="white-space:pre-wrap">${escapeHtml(message)}</div>`
    : ""

  return `<div style="color:#231f20;font-family:Arial,sans-serif;font-size:15px;line-height:1.5"><h1 style="font-size:22px;margin:0 0 16px">${escapeHtml(title)}</h1><table style="border-collapse:collapse">${rows.join("")}</table>${messageBlock}</div>`
}

type ContactSubmission = {
  firstName: string
  lastName: string
  email: string
  phone: string
  topic: "menu-inquiry" | "vinyl-request" | "general"
  message: string
}

const CONTACT_TOPIC_LABELS: Record<ContactSubmission["topic"], string> = {
  "menu-inquiry": "Menu Inquiry",
  "vinyl-request": "Vinyl Request",
  general: "General",
}

export async function sendContactNotification(
  ctx: MutationCtx,
  submission: ContactSubmission,
): Promise<void> {
  const name = oneLine(`${submission.firstName} ${submission.lastName}`)
  const config = emailConfig()
  const topic = CONTACT_TOPIC_LABELS[submission.topic]

  await resend.sendEmail(ctx, {
    ...config,
    replyTo: [submission.email],
    subject: `New inquiry from ${name}`,
    text: [
      "New contact inquiry",
      "",
      `Name: ${name}`,
      `Email: ${submission.email}`,
      `Phone: ${submission.phone}`,
      `Topic: ${topic}`,
      "",
      "Message:",
      submission.message,
    ].join("\n"),
    html: emailHtml(
      "New contact inquiry",
      [
        row("Name", name),
        row("Email", submission.email),
        row("Phone", submission.phone),
        row("Topic", topic),
      ],
      submission.message,
    ),
  })
}

type HiringSubmission = {
  name: string
  email: string
  phone: string
  coffeeExperience: string
  availability: string[]
  favoriteCoffeeShop: string
  favoriteRecord: string
  resumeName?: string
}

export async function sendHiringNotification(
  ctx: MutationCtx,
  submission: HiringSubmission,
  resumeUrl: string | null,
): Promise<void> {
  const name = oneLine(submission.name)
  const config = emailConfig()
  let resume = "Not provided"
  let resumeHtml = row("Resume", resume)
  if (resumeUrl) {
    if (!submission.resumeName) {
      throw new Error("A resume URL requires a resume file name")
    }
    resume = `${submission.resumeName}: ${resumeUrl}`
    resumeHtml = resumeRow(submission.resumeName, resumeUrl)
  }

  await resend.sendEmail(ctx, {
    ...config,
    replyTo: [submission.email],
    subject: `New job application from ${name}`,
    text: [
      "New job application",
      "",
      `Name: ${name}`,
      `Email: ${submission.email}`,
      `Phone: ${submission.phone}`,
      `Coffee experience: ${submission.coffeeExperience}`,
      `Availability: ${submission.availability.join(", ")}`,
      `Favorite coffee shop: ${submission.favoriteCoffeeShop}`,
      `Favorite record: ${submission.favoriteRecord}`,
      `Resume: ${resume}`,
    ].join("\n"),
    html: emailHtml("New job application", [
      row("Name", name),
      row("Email", submission.email),
      row("Phone", submission.phone),
      row("Coffee experience", submission.coffeeExperience),
      row("Availability", submission.availability.join(", ")),
      row("Favorite coffee shop", submission.favoriteCoffeeShop),
      row("Favorite record", submission.favoriteRecord),
      resumeHtml,
    ]),
  })
}
