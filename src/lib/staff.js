const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// bcrypt only uses the first 72 bytes, so longer passwords would silently be cut short.
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

// Validates cashier fields from a request body. Only known fields are read, so role,
// businessId and storeId in the body can never reach the database.
// With partial: true only the supplied fields are checked (an empty password means "unchanged").
// Errors carry the offending field name so the form can show them inline.
export function parseStaffInput(body, { partial = false } = {}) {
  const data = {};
  const fail = (field, error) => ({ error, field });

  if (!partial || body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return fail("name", "Full name is required");
    data.name = name;
  }

  if (!partial || body.email !== undefined) {
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) return fail("email", "Email is required");
    if (!EMAIL.test(email)) return fail("email", "Enter a valid email address");
    data.email = email;
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!partial || password !== "") {
    if (!password) return fail("password", "Password is required");
    if (password.length < PASSWORD_MIN) {
      return fail("password", `Password must be at least ${PASSWORD_MIN} characters`);
    }
    if (password.length > PASSWORD_MAX) {
      return fail("password", `Password must be at most ${PASSWORD_MAX} characters`);
    }
    data.password = password;
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") return fail("isActive", "Invalid isActive");
    data.isActive = body.isActive;
  }

  return { data };
}

// Plain, JSON-safe cashier. Built field by field so a password hash can never leak.
export function serializeStaff(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    isActive: user.isActive !== false,
    storeId: user.storeId?.toString() ?? null,
    createdAt: user.createdAt,
  };
}
