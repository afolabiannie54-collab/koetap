"use client";

import { useCallback, useState } from "react";
import { validateAll } from "@/lib/validate";

// Validation that feels helpful rather than naggy:
//   - a field shows its error after the person leaves it (blur), or after they try to submit;
//   - once a field is showing an error, it clears the moment the value becomes valid;
//   - submitting with problems moves focus to the first field that needs fixing;
//   - an error that came back from the server is tied to the value that caused it, so it disappears
//     as soon as that field is edited.
//
//   const { errors, onBlur, validate, setServerError } = useFormValidation(schema, form, { idPrefix: "p-" });
//   <FormField id="p-name" error={errors.name}>{(a11y) => <Input {...a11y} onBlur={onBlur("name")} />}</FormField>
//
// An input's id must be idPrefix + field name, so focus can find it.
export function useFormValidation(schema, values, { idPrefix = "" } = {}) {
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [server, setServer] = useState({}); // { field: { message, value } }

  const all = validateAll(values, schema);

  const errors = {};
  for (const field of Object.keys(all)) {
    if (submitted || touched[field]) errors[field] = all[field];
  }
  for (const [field, { message, value }] of Object.entries(server)) {
    // "form" is not a field: it is a message about the whole form, shown until the next attempt
    if (field === "form" || values[field] === value) errors[field] ??= message;
  }

  const onBlur = useCallback(
    (field) => () => setTouched((t) => (t[field] ? t : { ...t, [field]: true })),
    []
  );

  // Call on submit. Returns true when the form is fine to send.
  const validate = useCallback(() => {
    setSubmitted(true);
    setServer({});
    const first = Object.keys(all)[0];
    if (first) {
      document.getElementById(idPrefix + first)?.focus();
      return false;
    }
    return true;
  }, [all, idPrefix]);

  // Show a message the server sent back, against a field (or "form" for the whole form).
  const setServerError = useCallback(
    (field, message) => setServer({ [field]: { message, value: values[field] } }),
    [values]
  );

  return { errors, onBlur, validate, setServerError };
}
