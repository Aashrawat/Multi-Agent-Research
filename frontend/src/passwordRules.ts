export const MIN_PASSWORD_LENGTH = 12;

export interface PasswordCheck {
  label: string;
  ok: boolean;
}

/** Sign-up password policy (mirrors the backend): 12+ chars, 1 uppercase, 1 symbol. */
export function checkPassword(password: string): PasswordCheck[] {
  return [
    { label: `At least ${MIN_PASSWORD_LENGTH} characters`, ok: password.length >= MIN_PASSWORD_LENGTH },
    { label: "At least 1 uppercase letter", ok: /\p{Lu}/u.test(password) },
    { label: "At least 1 symbol (e.g. ! @ # $ %)", ok: /[^\p{L}\p{N}\s]/u.test(password) },
  ];
}

export const passwordIsValid = (password: string): boolean => checkPassword(password).every((c) => c.ok);
