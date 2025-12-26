
import { schemas } from "./sectionSchemas";
import { validateWithSchema } from "./validation";

/**
 * Auditoria determinística de inconsistências.
 * - Não inventa dados.
 * - Apenas aponta lacunas/contradições e sugere confirmação.
 * - Pode ser substituída/estendida por IA no futuro.
 */
export function runDeterministicAudit(applicationData) {
  const flags = [];
  const sectionOrder = [
  "personal",
  "nationality",
  "travel",
  "travelCompanions",
  "usHistory",
  "addressPhone",
  "passport",
  "family",
  "spouse",
  "workEducation",
  "security",
  "additionalInfo"
];

  for (const key of sectionOrder) {
    const schema = schemas[key];
    if (!schema) continue;
    const sectionData = applicationData?.[key];
    // In this project, sections are stored under "sections" sometimes; try both
    const actual = applicationData?.[key] ?? sectionData;

    if (!actual) {
      flags.push({ level: "error", code: "missing_section", section: key, message: "Seção ausente no cadastro (precisa ser preenchida)." });
      continue;
    }
    const { ok, errors } = validateWithSchema(schema, actual);
    if (!ok) {
      Object.entries(errors).forEach(([field, message]) => {
        flags.push({ level: "error", code: "missing_or_invalid", section: key, field, message });
      });
    }
  }

  // Cross-section checks (examples)
  try {
    const p = applicationData?.sections?.Section7Passport ?? applicationData?.Section7Passport;
    if (p?.passportIssueDate && p?.passportExpiryDate) {
      const iss = Date.parse(p.passportIssueDate);
      const exp = Date.parse(p.passportExpiryDate);
      if (!Number.isNaN(iss) && !Number.isNaN(exp) && exp <= iss) {
        flags.push({ level: "error", code: "passport_dates", section: "Section7Passport", field: "passportExpiryDate", message: "Validade do passaporte deve ser posterior à emissão." });
      }
    }
    const s1 = applicationData?.sections?.Section1Personal ?? applicationData?.Section1Personal;
    if (s1?.birthDate) {
      const b = Date.parse(s1.birthDate);
      if (!Number.isNaN(b) && b > Date.now()) {
        flags.push({ level: "error", code: "birth_in_future", section: "Section1Personal", field: "birthDate", message: "Data de nascimento não pode ser no futuro." });
      }
    }
  } catch (_) {
    // no-op
  }

  const hasErrors = flags.some(f => f.level === "error");
  return {
    qa_status: hasErrors ? "needs_fix" : "ok",
    flags,
  };
}
