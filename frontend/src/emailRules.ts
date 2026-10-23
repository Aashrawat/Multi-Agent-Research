/** Only these email domains may sign up / sign in (mirrors the backend). */
export const ALLOWED_EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com"];

export const ALLOWED_EMAIL_HINT = ALLOWED_EMAIL_DOMAINS.map((d) => `@${d}`).join(", ");

export function emailDomainIsAllowed(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at < 1) return false;
  return ALLOWED_EMAIL_DOMAINS.includes(email.slice(at + 1).trim().toLowerCase());
}
