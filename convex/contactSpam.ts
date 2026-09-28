type ContactFields = {
  firstName: string
  lastName: string
  email: string
  message: string
}

/** Conservative signals for the random strings seen in contact spam. */
export function contactSpamScore({ firstName, lastName, email, message }: ContactFields): number {
  const text = message.trim()
  let score = 0

  if (/^[A-Za-z]{18,}$/.test(text)) score += 2
  if ((text.slice(1).match(/[A-Z]/g)?.length ?? 0) >= 4) score += 2
  if (
    /[bcdfghjklmnpqrstvwxyz]{4,}/i.test(firstName) &&
    /[bcdfghjklmnpqrstvwxyz]{4,}/i.test(lastName)
  )
    score += 1

  const localPart = email.split("@", 1)[0]
  if ((localPart.match(/\./g)?.length ?? 0) >= 4 && /\d/.test(localPart)) score += 1

  return score
}

export function isContactSpam(fields: ContactFields & { spam?: boolean }): boolean {
  return fields.spam ?? contactSpamScore(fields) >= 4
}
