
import { z } from "zod";

export function validateWithSchema(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, errors: {}, parsed: result.data };

  const errors = {};
  for (const issue of result.error.issues) {
    const path = issue.path?.length ? issue.path.join(".") : "_global";
    // store first error per field
    if (!errors[path]) errors[path] = issue.message;
  }
  return { ok: false, errors, parsed: null };
}

// Convert field-path errors to the component's expected validation map (string keys)
export function toValidationMap(errors) {
  return errors || {};
}
