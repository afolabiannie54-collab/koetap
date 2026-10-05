// Form validation rules, shared by every form so the messages read the same everywhere.
// A rule is a function (value, allValues) that returns an error message, or "" when the value is fine.
// A schema is { fieldName: [rule, rule, ...] }; the first failing rule for a field wins.
//
// These checks are for kind, instant feedback. The server still checks everything again.

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const text = (v) => String(v ?? "").trim();

export const rules = {
  required: (label) => (v) => (text(v) ? "" : `${label} is required`),

  email: () => (v) => (!text(v) || EMAIL.test(text(v)) ? "" : "Enter a valid email address, like name@example.com"),

  minLength: (n, label = "This") => (v) => (!v || String(v).length >= n ? "" : `${label} must be at least ${n} characters`),

  maxLength: (n, label = "This") => (v) => (String(v ?? "").length <= n ? "" : `${label} must be ${n} characters or fewer`),

  // A number that may be left empty (use required() as well to insist on it)
  number: ({ min, max, whole = false, label = "This" } = {}) => (v) => {
    if (text(v) === "") return "";
    const n = Number(v);
    if (!Number.isFinite(n)) return `${label} must be a number`;
    if (whole && !Number.isInteger(n)) return `${label} must be a whole number`;
    if (min !== undefined && n < min) return min === 0 ? `${label} can't be negative` : `${label} must be at least ${min}`;
    if (max !== undefined && n > max) return `${label} can't be more than ${max}`;
    return "";
  },

  hexColor: () => (v) => (!text(v) || HEX_COLOR.test(text(v)) ? "" : "Use a hex colour like #16A34A"),

  matches: (otherField, message) => (v, values) => (v === values[otherField] ? "" : message),
};

// The first error for each field that has one: { email: "Email is required", ... }
export function validateAll(values, schema) {
  const errors = {};
  for (const [field, list] of Object.entries(schema)) {
    for (const rule of list) {
      const message = rule(values[field], values);
      if (message) {
        errors[field] = message;
        break;
      }
    }
  }
  return errors;
}
