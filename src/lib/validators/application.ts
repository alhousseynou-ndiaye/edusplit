import { z } from "zod";

const phoneRegex = /^[0-9+\s()-]{8,20}$/;

export const applicantStatusEnum = z.enum([
  "STUDENT",
  "APPRENTICE",
  "INTERN",
  "EMPLOYEE",
  "FREELANCER",
  "OTHER",
]);

export const productTypeEnum = z.enum([
  "LAPTOP",
  "SMARTPHONE",
  "TABLET",
  "ROUTER",
]);

export const createApplicationSchema = z
  .object({
    firstName: z.string().trim().min(2).max(100),
    lastName: z.string().trim().min(2).max(100),
    dateOfBirth: z.string().datetime(),
    gender: z.string().trim().max(30).optional().or(z.literal("")),
    phone: z.string().trim().regex(phoneRegex, "Phone number is invalid"),
    email: z.string().email().optional().or(z.literal("")),
    addressLine: z.string().trim().min(5).max(255),
    city: z.string().trim().min(2).max(100),
    country: z.string().trim().min(2).max(100).default("Senegal"),

    applicantStatus: applicantStatusEnum,
    schoolName: z.string().trim().max(255).optional().or(z.literal("")),
    programName: z.string().trim().max(255).optional().or(z.literal("")),
    studyLevel: z.string().trim().max(100).optional().or(z.literal("")),
    employerName: z.string().trim().max(255).optional().or(z.literal("")),

    estimatedMonthlyIncome: z.coerce.number().int().min(0).optional(),
    incomeSource: z.string().trim().max(255).optional().or(z.literal("")),
    hasFamilySupport: z.boolean().default(false),
    familySupportAmount: z.coerce.number().int().min(0).optional(),

    hasGuarantor: z.boolean().default(false),
    guarantorFullName: z.string().trim().max(150).optional().or(z.literal("")),
    guarantorRelationship: z.string().trim().max(100).optional().or(z.literal("")),
    guarantorPhone: z
      .string()
      .trim()
      .regex(phoneRegex, "Guarantor phone is invalid")
      .optional()
      .or(z.literal("")),
    guarantorEmail: z.string().email().optional().or(z.literal("")),
    guarantorProfession: z.string().trim().max(150).optional().or(z.literal("")),
    guarantorAddressLine: z.string().trim().max(255).optional().or(z.literal("")),
    guarantorCity: z.string().trim().max(100).optional().or(z.literal("")),
    guarantorSupportType: z.string().trim().max(100).optional().or(z.literal("")),

    productName: z.string().trim().min(2).max(255),
    productType: productTypeEnum.default("LAPTOP"),
    productBrand: z.string().trim().max(100).optional().or(z.literal("")),
    productModel: z.string().trim().max(100).optional().or(z.literal("")),
    productPrice: z.coerce.number().int().min(180000).max(350000),
    availableDownPayment: z.coerce.number().int().min(0),
  })
  .superRefine((data, ctx) => {
    const minDownPayment = Math.ceil(data.productPrice * 0.3);

    if (data.availableDownPayment < minDownPayment) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["availableDownPayment"],
        message: `Minimum down payment is ${minDownPayment} XOF`,
      });
    }

    const financedAmount = data.productPrice - data.availableDownPayment;

    if (financedAmount > 150000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["availableDownPayment"],
        message:
          "Financed amount cannot exceed 150000 XOF for the first version",
      });
    }

    if (
      ["STUDENT", "APPRENTICE", "INTERN"].includes(data.applicantStatus) &&
      !data.schoolName
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["schoolName"],
        message: "School name is required for this applicant status",
      });
    }

    if (data.hasFamilySupport && !data.familySupportAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["familySupportAmount"],
        message:
          "Family support amount is required when family support is enabled",
      });
    }

    if (data.hasGuarantor) {
      if (!data.guarantorFullName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["guarantorFullName"],
          message: "Guarantor full name is required",
        });
      }

      if (!data.guarantorRelationship) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["guarantorRelationship"],
          message: "Guarantor relationship is required",
        });
      }

      if (!data.guarantorPhone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["guarantorPhone"],
          message: "Guarantor phone is required",
        });
      }
    }
  });

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;