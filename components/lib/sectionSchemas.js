
import { z } from "zod";

/**
 * Schemas determinísticos (sem inferência) para validação.
 * Regra de ouro: nunca "completar" dados do cliente; apenas validar e pedir confirmação quando necessário.
 */

const nonEmpty = (msg = "Campo obrigatório") => z.string().trim().min(1, msg);
const dateISO = (msg = "Data inválida") =>
  z.string().trim().min(1, "Campo obrigatório").refine((v) => !Number.isNaN(Date.parse(v)), msg);

const yesNoBool = z.boolean(); // No DS-160 o usuário sempre responde Sim/Não. Aqui false = "Não" por padrão.

export const schemas = {
  personal: z.object({
    surnames: nonEmpty(),
    givenNames: nonEmpty(),
    hasOtherNames: z.boolean(),
    otherNames: z.array(z.object({
      surname: z.string().trim().optional(),
      givenName: z.string().trim().optional(),
    })).default([]),
    sex: nonEmpty(),
    maritalStatus: nonEmpty(),
    birthDate: dateISO(),
    birthCity: nonEmpty(),
    birthState: z.string().trim().optional(),
    birthCountry: nonEmpty(),
  }).superRefine((data, ctx) => {
    if (data.hasOtherNames) {
      const hasAtLeastOne = Array.isArray(data.otherNames) && data.otherNames.some(o => (o?.surname || "").trim() || (o?.givenName || "").trim());
      if (!hasAtLeastOne) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe ao menos um outro nome utilizado.", path: ["otherNames"] });
      }
    }
  }),

  nationality: z.object({
    nationality: nonEmpty(),
    hasOtherNationality: z.boolean(),
    otherNationalities: z.array(z.object({ nationality: z.string().trim().optional() })).default([]),
    nationalIdNumber: nonEmpty("Informe o documento nacional (ex.: CPF/RG)"),
    hasUSSocialSecurity: z.boolean(),
    usSocialSecurityNumber: z.string().trim().optional(),
    hasUSTaxpayerId: z.boolean(),
    usTaxpayerId: z.string().trim().optional(),
  }).superRefine((data, ctx) => {
    if (data.hasOtherNationality) {
      const ok = data.otherNationalities?.some(n => (n?.nationality || "").trim());
      if (!ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe a outra nacionalidade.", path: ["otherNationalities"] });
    }
    if (data.hasUSSocialSecurity && !(data.usSocialSecurityNumber || "").trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o SSN.", path: ["usSocialSecurityNumber"] });
    }
    if (data.hasUSTaxpayerId && !(data.usTaxpayerId || "").trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o ITIN/Taxpayer ID.", path: ["usTaxpayerId"] });
    }
  }),

  travel: z.object({
    specificPlans: z.boolean().optional(), // pode variar no fluxo; não travar aqui
    arrivalDate: dateISO(),
    arrivalFlight: z.string().trim().optional(),
    arrivalCity: nonEmpty(),
    departureDate: dateISO(),
    departureFlight: z.string().trim().optional(),
    departureCity: nonEmpty(),
    locationsToVisit: z.array(z.object({ location: nonEmpty("Informe ao menos um local/cidade") })).min(1),
    intendedStayDuration: nonEmpty(),
    intendedStayUnit: nonEmpty(),
    stayAddress: z.object({
      street1: nonEmpty(),
      street2: z.string().trim().optional(),
      city: nonEmpty(),
      state: nonEmpty(),
      zip: nonEmpty(),
    }),
    payer: z.object({
      entity: nonEmpty(), // SELF / OTHER_PERSON / COMPANY etc
      surnames: z.string().trim().optional(),
      givenNames: z.string().trim().optional(),
      phone: z.string().trim().optional(),
      email: z.string().trim().optional(),
      relationship: z.string().trim().optional(),
      addressSameAsApplicant: z.boolean().optional(),
      address: z.object({
        street1: z.string().trim().optional(),
        street2: z.string().trim().optional(),
        city: z.string().trim().optional(),
        state: z.string().trim().optional(),
        zip: z.string().trim().optional(),
      }).optional()
    })
  }).superRefine((data, ctx) => {
    const arr = Date.parse(data.arrivalDate);
    const dep = Date.parse(data.departureDate);
    if (!Number.isNaN(arr) && !Number.isNaN(dep) && dep < arr) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data de saída não pode ser anterior à data de chegada.", path: ["departureDate"] });
    }
    if (data.payer?.entity && data.payer.entity !== "SELF") {
      if (!(data.payer.surnames || "").trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o sobrenome do pagador.", path: ["payer","surnames"] });
      if (!(data.payer.givenNames || "").trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o nome do pagador.", path: ["payer","givenNames"] });
      if (!(data.payer.relationship || "").trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe a relação com o pagador.", path: ["payer","relationship"] });
    }
  }),

  travelCompanions: z.object({
    travelingWithOthers: z.boolean(),
    travelingGroupOrOrganization: z.boolean(),
    travelCompanions: z.array(z.object({
      surnames: z.string().trim().optional(),
      givenNames: z.string().trim().optional(),
      relationship: z.string().trim().optional(),
    })).default([]),
    groupName: z.string().trim().optional(),
  }).superRefine((data, ctx) => {
    if (data.travelingWithOthers && (!data.travelCompanions || data.travelCompanions.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe ao menos um acompanhante.", path: ["travelCompanions"] });
    }
    if (data.travelingGroupOrOrganization && !(data.groupName || "").trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o nome do grupo/organização.", path: ["groupName"] });
    }
  }),

  usHistory: z.object({
    hasBeenInUS: z.boolean(),
    previousVisits: z.array(z.object({
      arrivalDate: z.string().trim().optional(),
      lengthOfStay: z.string().trim().optional(),
      unit: z.string().trim().optional(),
    })).default([]),
    hasDriverLicense: z.boolean(),
    driverLicenses: z.array(z.object({
      number: z.string().trim().optional(),
      state: z.string().trim().optional(),
    })).default([]),
    hasUSVisa: z.boolean(),
    dateLastVisaIssued: z.string().trim().optional(),
    visaNumber: z.string().trim().optional(),
    visaNumberUnknown: z.boolean().optional(),
    sameCountryAsPassport: z.boolean(),
    visaIssuedCountry: z.string().trim().optional(),
    visaLostStolen: z.boolean(),
    visaLostStolenYear: z.string().trim().optional(),
    visaLostStolenExplanation: z.string().trim().optional(),
    hadUSVisaRefused: z.boolean(),
    visaRefusalExplanation: z.string().trim().optional(),
    hasImmigrationPetition: z.boolean(),
    immigrationPetitionExplanation: z.string().trim().optional(),
  }).superRefine((data, ctx) => {
    if (data.hasBeenInUS && (!data.previousVisits || data.previousVisits.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe ao menos uma visita anterior (mesmo aproximada).", path: ["previousVisits"] });
    }
    if (data.hasDriverLicense && (!data.driverLicenses || data.driverLicenses.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe a carteira/estado (se aplicável).", path: ["driverLicenses"] });
    }
    if (data.hasUSVisa) {
      if (!(data.dateLastVisaIssued || "").trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe a data de emissão do último visto.", path: ["dateLastVisaIssued"] });
      if (!data.visaNumberUnknown && !(data.visaNumber || "").trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o número do visto ou marque como desconhecido.", path: ["visaNumber"] });
      if (!data.sameCountryAsPassport && !(data.visaIssuedCountry || "").trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o país onde o visto foi emitido.", path: ["visaIssuedCountry"] });
    }
    if (data.visaLostStolen) {
      if (!(data.visaLostStolenYear || "").trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o ano.", path: ["visaLostStolenYear"] });
      if (!(data.visaLostStolenExplanation || "").trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Explique brevemente.", path: ["visaLostStolenExplanation"] });
    }
    if (data.hadUSVisaRefused && !(data.visaRefusalExplanation || "").trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Explique a negativa (se souber).", path: ["visaRefusalExplanation"] });
    }
    if (data.hasImmigrationPetition && !(data.immigrationPetitionExplanation || "").trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Explique a petição (se aplicável).", path: ["immigrationPetitionExplanation"] });
    }
  }),

  addressPhone: z.object({
    homeAddress: z.object({
      street1: nonEmpty(),
      street2: z.string().trim().optional(),
      city: nonEmpty(),
      state: nonEmpty(),
      zip: nonEmpty(),
      country: nonEmpty(),
    }),
    mailingAddressSameAsHome: z.boolean(),
    mailingAddress: z.object({
      street1: z.string().trim().optional(),
      street2: z.string().trim().optional(),
      city: z.string().trim().optional(),
      state: z.string().trim().optional(),
      zip: z.string().trim().optional(),
      country: z.string().trim().optional(),
    }).optional(),
    phone: z.object({
      primary: nonEmpty(),
      secondary: z.string().trim().optional(),
      work: z.string().trim().optional(),
    }),
    email: nonEmpty(),
    socialMedia: z.object({
      hasSocialMedia: z.boolean(),
      platforms: z.array(z.object({ platform: z.string().trim().optional(), handle: z.string().trim().optional() })).default([])
    }).optional(),
  }).superRefine((data, ctx) => {
    if (!data.mailingAddressSameAsHome) {
      const a = data.mailingAddress || {};
      const needed = ["street1","city","state","zip","country"];
      const missing = needed.filter(k => !(a[k] || "").trim());
      if (missing.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Preencha o endereço de correspondência completo.", path: ["mailingAddress"] });
    }
  }),

  passport: z.object({
    passportNumber: nonEmpty(),
    passportBookNumber: z.string().trim().optional(),
    passportBookNumberUnknown: z.boolean().optional(),
    passportIssueCity: nonEmpty(),
    passportIssueState: z.string().trim().optional(),
    passportIssueCountry: nonEmpty(),
    passportIssueDate: dateISO(),
    passportExpiryDate: dateISO(),
    hasOtherPassport: z.boolean(),
    otherPassports: z.array(z.object({
      passportNumber: z.string().trim().optional(),
      passportCountry: z.string().trim().optional(),
    })).default([]),
    hasLostPassport: z.boolean(),
    lostPassportExplanation: z.string().trim().optional(),
  }).superRefine((data, ctx) => {
    const iss = Date.parse(data.passportIssueDate);
    const exp = Date.parse(data.passportExpiryDate);
    if (!Number.isNaN(iss) && !Number.isNaN(exp) && exp <= iss) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A validade deve ser posterior à emissão.", path: ["passportExpiryDate"] });
    }
    if (data.hasOtherPassport) {
      const ok = data.otherPassports?.some(p => (p?.passportNumber || "").trim() && (p?.passportCountry || "").trim());
      if (!ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe os dados do outro passaporte.", path: ["otherPassports"] });
    }
    if (data.hasLostPassport && !(data.lostPassportExplanation || "").trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Explique a perda/roubo.", path: ["lostPassportExplanation"] });
    }
  }),

  family: z.object({
    fatherSurname: nonEmpty(),
    fatherGivenName: nonEmpty(),
    fatherBirthDate: z.string().trim().optional(),
    motherSurname: nonEmpty(),
    motherGivenName: nonEmpty(),
    motherBirthDate: z.string().trim().optional(),
    hasRelativesInUS: z.boolean(),
    relativesInUS: z.array(z.object({
      surname: z.string().trim().optional(),
      givenName: z.string().trim().optional(),
      relationship: z.string().trim().optional(),
      status: z.string().trim().optional(),
    })).default([]),
    spouseIsUSCitizen: z.boolean().optional(),
  }).superRefine((data, ctx) => {
    if (data.hasRelativesInUS && (!data.relativesInUS || data.relativesInUS.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe ao menos um familiar nos EUA.", path: ["relativesInUS"] });
    }
  }),

  spouse: z.object({
    spouseSurname: z.string().trim().optional(),
    spouseGivenName: z.string().trim().optional(),
    spouseBirthDate: z.string().trim().optional(),
    spouseNationality: z.string().trim().optional(),
    spouseBirthCity: z.string().trim().optional(),
    spouseBirthCountry: z.string().trim().optional(),
    spouseAddressSameAsApplicant: z.boolean().optional(),
    spouseAddress: z.object({
      street1: z.string().trim().optional(),
      street2: z.string().trim().optional(),
      city: z.string().trim().optional(),
      state: z.string().trim().optional(),
      zip: z.string().trim().optional(),
      country: z.string().trim().optional(),
    }).optional()
  }),

  workEducation: z.object({
    primaryOccupation: nonEmpty(),
    otherOccupationDetails: z.string().trim().optional(),
    employerName: z.string().trim().optional(),
    employerAddress: z.object({
      street1: z.string().trim().optional(),
      street2: z.string().trim().optional(),
      city: z.string().trim().optional(),
      state: z.string().trim().optional(),
      zip: z.string().trim().optional(),
      country: z.string().trim().optional(),
    }).optional(),
    monthlyIncome: z.string().trim().optional(),
    hasPreviousEmployment: z.boolean(),
    previousEmployments: z.array(z.object({
      employerName: z.string().trim().optional(),
      jobTitle: z.string().trim().optional(),
      startDate: z.string().trim().optional(),
      endDate: z.string().trim().optional(),
    })).default([]),
    attendedEducation: z.boolean(),
    educationInstitutions: z.array(z.object({
      institutionName: z.string().trim().optional(),
      startDate: z.string().trim().optional(),
      endDate: z.string().trim().optional(),
    })).default([]),
  }).superRefine((data, ctx) => {
    if (data.primaryOccupation === "OTHER" && !(data.otherOccupationDetails || "").trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Descreva a ocupação.", path: ["otherOccupationDetails"] });
    }
    if (data.hasPreviousEmployment && (!data.previousEmployments || data.previousEmployments.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe ao menos um emprego anterior.", path: ["previousEmployments"] });
    }
    if (data.attendedEducation && (!data.educationInstitutions || data.educationInstitutions.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe ao menos uma instituição.", path: ["educationInstitutions"] });
    }
  }),

  security: z.object({
    // many booleans + explanations; treat as required acknowledgement at Review
    q1_communicableDisease: yesNoBool,
    q1_communicableDisease_exp: z.string().trim().optional(),
    q2_disorder: yesNoBool,
    q2_disorder_exp: z.string().trim().optional(),
    q3_drugAbuser: yesNoBool,
    q3_drugAbuser_exp: z.string().trim().optional(),
    // ... keep rest optional but present; validation will be lenient here
  }).passthrough(),

  additionalInfo: z.any(), // no mandatory in base, but keep pass-through
};


export const SECTION_KEY_ALIASES = {
  Section1Personal: 'personal',
  Section2Nationality: 'nationality',
  Section3Travel: 'travel',
  Section4TravelCompanions: 'travelCompanions',
  Section5USHistory: 'usHistory',
  Section6AddressPhone: 'addressPhone',
  Section7Passport: 'passport',
  Section9Family: 'family',
  Section9aSpouse: 'spouse',
  Section10WorkEducation: 'workEducation',
  Section11Security: 'security',
  Section11aAdditionalInfo: 'additionalInfo',
};
