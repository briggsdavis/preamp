export const CONTACT_TOPICS = [
  { value: "menu-inquiry", label: "Menu Inquiry" },
  { value: "vinyl-request", label: "Vinyl Request" },
  { value: "general", label: "General" },
] as const

export type ContactTopic = (typeof CONTACT_TOPICS)[number]["value"]

export function contactTopicLabel(value: string | undefined): string {
  return CONTACT_TOPICS.find((topic) => topic.value === value)?.label ?? "General"
}
