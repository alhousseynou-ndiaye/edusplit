"use client";

import { useMemo, useState } from "react";

type ApplicantStatus =
  | "STUDENT"
  | "APPRENTICE"
  | "INTERN"
  | "EMPLOYEE"
  | "FREELANCER"
  | "OTHER";

type ProductType = "LAPTOP" | "SMARTPHONE" | "TABLET" | "ROUTER";

type FormState = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  country: string;

  applicantStatus: ApplicantStatus;
  schoolName: string;
  programName: string;
  studyLevel: string;
  employerName: string;

  estimatedMonthlyIncome: string;
  incomeSource: string;
  hasFamilySupport: boolean;
  familySupportAmount: string;

  hasGuarantor: boolean;
  guarantorFullName: string;
  guarantorRelationship: string;
  guarantorPhone: string;
  guarantorEmail: string;
  guarantorProfession: string;
  guarantorAddressLine: string;
  guarantorCity: string;
  guarantorSupportType: string;

  productName: string;
  productType: ProductType;
  productBrand: string;
  productModel: string;
  productPrice: string;
  availableDownPayment: string;
};

type FieldErrors = Record<string, string[]>;

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  email: "",
  addressLine: "",
  city: "",
  country: "Senegal",

  applicantStatus: "STUDENT",
  schoolName: "",
  programName: "",
  studyLevel: "",
  employerName: "",

  estimatedMonthlyIncome: "",
  incomeSource: "",
  hasFamilySupport: false,
  familySupportAmount: "",

  hasGuarantor: false,
  guarantorFullName: "",
  guarantorRelationship: "",
  guarantorPhone: "",
  guarantorEmail: "",
  guarantorProfession: "",
  guarantorAddressLine: "",
  guarantorCity: "",
  guarantorSupportType: "",

  productName: "",
  productType: "LAPTOP",
  productBrand: "",
  productModel: "",
  productPrice: "",
  availableDownPayment: "",
};

const MIN_PRICE = 180000;
const MAX_PRICE = 350000;
const MIN_DOWN_PAYMENT_RATE = 0.3;
const MAX_INITIAL_FINANCED_AMOUNT = 150000;

export default function ApplyPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isAcademicProfile = ["STUDENT", "APPRENTICE", "INTERN"].includes(
    form.applicantStatus
  );

  const productPrice = Number(form.productPrice || 0);
  const availableDownPayment = Number(form.availableDownPayment || 0);

  const financedAmount = useMemo(() => {
    return Math.max(productPrice - availableDownPayment, 0);
  }, [productPrice, availableDownPayment]);

  const minRequiredDownPayment = useMemo(() => {
    if (!productPrice) return 0;
    return Math.ceil(productPrice * MIN_DOWN_PAYMENT_RATE);
  }, [productPrice]);

  const completion = useMemo(() => {
    const requiredValues = [
      form.firstName,
      form.lastName,
      form.dateOfBirth,
      form.phone,
      form.addressLine,
      form.city,
      form.applicantStatus,
      form.productName,
      form.productType,
      form.productPrice,
      form.availableDownPayment,
      ...(isAcademicProfile ? [form.schoolName] : []),
      ...(form.hasGuarantor
        ? [form.guarantorFullName, form.guarantorRelationship, form.guarantorPhone]
        : []),
    ];

    const filled = requiredValues.filter((value) =>
      String(value ?? "").trim()
    ).length;

    return requiredValues.length === 0
      ? 0
      : Math.round((filled / requiredValues.length) * 100);
  }, [form, isAcademicProfile]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));

    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }

    setServerError(null);
    setSuccessMessage(null);
  }

  function addError(
    errors: FieldErrors,
    field: keyof FormState | string,
    message: string
  ) {
    if (!errors[field]) errors[field] = [];
    errors[field].push(message);
  }

  function validateForm(): FieldErrors {
    const errors: FieldErrors = {};

    if (!form.firstName.trim()) addError(errors, "firstName", "First name is required.");
    if (!form.lastName.trim()) addError(errors, "lastName", "Last name is required.");
    if (!form.dateOfBirth.trim()) addError(errors, "dateOfBirth", "Date of birth is required.");
    if (!form.phone.trim()) addError(errors, "phone", "Phone number is required.");
    if (!form.addressLine.trim()) addError(errors, "addressLine", "Address is required.");
    if (!form.city.trim()) addError(errors, "city", "City is required.");

    if (!form.applicantStatus) {
      addError(errors, "applicantStatus", "Applicant status is required.");
    }

    if (isAcademicProfile && !form.schoolName.trim()) {
      addError(
        errors,
        "schoolName",
        "School name is required for students, apprentices, and interns."
      );
    }

    if (!form.productName.trim()) addError(errors, "productName", "Product name is required.");
    if (!form.productType) addError(errors, "productType", "Product type is required.");

    if (!form.productPrice.trim()) {
      addError(errors, "productPrice", "Product price is required.");
    } else if (Number.isNaN(productPrice)) {
      addError(errors, "productPrice", "Product price must be a valid number.");
    } else {
      if (productPrice < MIN_PRICE) {
        addError(
          errors,
          "productPrice",
          `Product price must be at least ${MIN_PRICE.toLocaleString()} XOF.`
        );
      }
      if (productPrice > MAX_PRICE) {
        addError(
          errors,
          "productPrice",
          `Product price must not exceed ${MAX_PRICE.toLocaleString()} XOF.`
        );
      }
    }

    if (!form.availableDownPayment.trim()) {
      addError(errors, "availableDownPayment", "Available down payment is required.");
    } else if (Number.isNaN(availableDownPayment)) {
      addError(errors, "availableDownPayment", "Down payment must be a valid number.");
    } else {
      if (productPrice > 0 && availableDownPayment < minRequiredDownPayment) {
        addError(
          errors,
          "availableDownPayment",
          `Minimum required down payment is ${minRequiredDownPayment.toLocaleString()} XOF.`
        );
      }
      if (financedAmount > MAX_INITIAL_FINANCED_AMOUNT) {
        addError(
          errors,
          "availableDownPayment",
          `The financed amount cannot exceed ${MAX_INITIAL_FINANCED_AMOUNT.toLocaleString()} XOF for this first version.`
        );
      }
    }

    if (form.hasGuarantor) {
      if (!form.guarantorFullName.trim()) {
        addError(errors, "guarantorFullName", "Guarantor full name is required.");
      }
      if (!form.guarantorRelationship.trim()) {
        addError(errors, "guarantorRelationship", "Relationship to guarantor is required.");
      }
      if (!form.guarantorPhone.trim()) {
        addError(errors, "guarantorPhone", "Guarantor phone is required.");
      }
    }

    if (form.email.trim() && !isValidEmail(form.email.trim())) {
      addError(errors, "email", "Email format is invalid.");
    }

    if (form.guarantorEmail.trim() && !isValidEmail(form.guarantorEmail.trim())) {
      addError(errors, "guarantorEmail", "Guarantor email format is invalid.");
    }

    return errors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    const clientErrors = validateForm();

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setServerError("Please correct the highlighted fields before submitting.");
      setSubmitting(false);
      return;
    }

    setFieldErrors({});

    try {
      const payload = {
        ...form,
        dateOfBirth: new Date(form.dateOfBirth).toISOString(),
        estimatedMonthlyIncome: form.estimatedMonthlyIncome
          ? Number(form.estimatedMonthlyIncome)
          : undefined,
        familySupportAmount: form.familySupportAmount
          ? Number(form.familySupportAmount)
          : undefined,
        productPrice: Number(form.productPrice),
        availableDownPayment: Number(form.availableDownPayment),
      };

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json?.error || "Unable to submit application.");

        if (json?.details?.fieldErrors) {
          setFieldErrors(json.details.fieldErrors);
        }

        setSubmitting(false);
        return;
      }

      setSuccessMessage(
        `Application submitted successfully. Your file ID is ${json.applicationId}.`
      );
      setForm(initialForm);
      setFieldErrors({});
    } catch (error) {
      console.error(error);
      setServerError("Unexpected error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const missingRequiredCount = countMissingRequiredFields(form, isAcademicProfile);

  const readinessOk =
    financedAmount > 0 &&
    availableDownPayment >= minRequiredDownPayment &&
    financedAmount <= MAX_INITIAL_FINANCED_AMOUNT;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 xl:grid-cols-[1.7fr_0.9fr]">
          <div>
            <div className="mb-8">
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm">
                EduSplit Application
              </span>

              <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Get your productive device with a structured payment plan
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                Complete this form carefully. Required fields are marked with{" "}
                <span className="font-semibold text-red-600">*</span>. We use this
                information to assess eligibility, affordability, and support profile.
              </p>
            </div>

            <div className="mb-8 grid gap-4 md:grid-cols-3">
              <InfoCard
                title="Who is this for?"
                description="Students, apprentices, interns, and young professionals who need productive digital equipment."
              />
              <InfoCard
                title="What can be financed?"
                description="Laptops first. The product must be useful for studies, work, or income-generating activity."
              />
              <InfoCard
                title="How do we decide?"
                description="We look at your profile, your down payment, and any support information you provide."
              />
            </div>

            <div className="mb-8 grid gap-4 lg:grid-cols-[1.5fr_0.85fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Before you submit
                </h2>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
                  <li>• Required fields are marked with <span className="text-red-600">*</span>.</li>
                  <li>• Minimum down payment is <span className="font-semibold">30%</span> of the product price.</li>
                  <li>• The financed amount must stay under <span className="font-semibold">150,000 XOF</span> for this version.</li>
                  <li>• A guarantor is optional, but it can strengthen your file.</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-900 bg-slate-900 p-6 text-white shadow-sm">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Application readiness
                </h2>

                <p className="mt-4 text-sm text-slate-300">
                  Missing required fields:{" "}
                  <span className="font-semibold text-white">
                    {missingRequiredCount}
                  </span>
                </p>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Estimated financed amount</span>
                    <span className="font-semibold text-white">
                      {financedAmount.toLocaleString()} XOF
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Minimum down payment</span>
                    <span className="font-semibold text-white">
                      {minRequiredDownPayment.toLocaleString()} XOF
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Status</span>
                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        readinessOk
                          ? "bg-emerald-500/20 text-emerald-200"
                          : "bg-amber-500/20 text-amber-200",
                      ].join(" ")}
                    >
                      {readinessOk ? "Within initial policy" : "Needs adjustment"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {serverError && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
                {serverError}
              </div>
            )}

            {Object.keys(fieldErrors).length > 0 && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
                <p className="font-semibold">Please fix the following fields:</p>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {Object.entries(fieldErrors).map(([field, messages]) =>
                    messages?.map((message, index) => (
                      <li key={`${field}-${index}`}>
                        <strong>{toHumanLabel(field)}</strong>: {message}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 shadow-sm">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <SectionCard
                title="1. Personal information"
                description="We need basic identity and contact details to create and review your application."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Input
                    label="First name"
                    required
                    value={form.firstName}
                    onChange={(v) => updateField("firstName", v)}
                    error={fieldErrors.firstName?.[0]}
                    placeholder="Alhousseynou"
                  />
                  <Input
                    label="Last name"
                    required
                    value={form.lastName}
                    onChange={(v) => updateField("lastName", v)}
                    error={fieldErrors.lastName?.[0]}
                    placeholder="Ndiaye"
                  />
                  <Input
                    label="Date of birth"
                    required
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(v) => updateField("dateOfBirth", v)}
                    error={fieldErrors.dateOfBirth?.[0]}
                  />
                  <Input
                    label="Gender"
                    value={form.gender}
                    onChange={(v) => updateField("gender", v)}
                    placeholder="Optional"
                  />
                  <Input
                    label="Phone"
                    required
                    value={form.phone}
                    onChange={(v) => updateField("phone", v)}
                    error={fieldErrors.phone?.[0]}
                    placeholder="77 123 45 67"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => updateField("email", v)}
                    error={fieldErrors.email?.[0]}
                    placeholder="Optional"
                  />
                  <Input
                    label="Address"
                    required
                    value={form.addressLine}
                    onChange={(v) => updateField("addressLine", v)}
                    error={fieldErrors.addressLine?.[0]}
                    placeholder="Street, district, landmark..."
                  />
                  <Input
                    label="City"
                    required
                    value={form.city}
                    onChange={(v) => updateField("city", v)}
                    error={fieldErrors.city?.[0]}
                    placeholder="Dakar"
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="2. Academic / work status"
                description="This helps us understand your current situation and your ability to sustain the plan."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Select
                    label="Applicant status"
                    required
                    value={form.applicantStatus}
                    onChange={(v) => updateField("applicantStatus", v as ApplicantStatus)}
                    error={fieldErrors.applicantStatus?.[0]}
                    options={[
                      ["STUDENT", "Student"],
                      ["APPRENTICE", "Apprentice"],
                      ["INTERN", "Intern"],
                      ["EMPLOYEE", "Employee"],
                      ["FREELANCER", "Freelancer"],
                      ["OTHER", "Other"],
                    ]}
                  />
                  <Input
                    label="School name"
                    required={isAcademicProfile}
                    value={form.schoolName}
                    onChange={(v) => updateField("schoolName", v)}
                    error={fieldErrors.schoolName?.[0]}
                    placeholder={isAcademicProfile ? "Required for your status" : "Optional"}
                  />
                  <Input
                    label="Program name"
                    value={form.programName}
                    onChange={(v) => updateField("programName", v)}
                    placeholder="Optional"
                  />
                  <Input
                    label="Study level"
                    value={form.studyLevel}
                    onChange={(v) => updateField("studyLevel", v)}
                    placeholder="Optional"
                  />
                  <Input
                    label="Employer name"
                    value={form.employerName}
                    onChange={(v) => updateField("employerName", v)}
                    placeholder="Optional"
                  />
                  <Input
                    label="Estimated monthly income (XOF)"
                    type="number"
                    value={form.estimatedMonthlyIncome}
                    onChange={(v) => updateField("estimatedMonthlyIncome", v)}
                    placeholder="Optional"
                  />
                  <Input
                    label="Income source"
                    value={form.incomeSource}
                    onChange={(v) => updateField("incomeSource", v)}
                    placeholder="Salary, family support, freelance..."
                  />
                  <Input
                    label="Family support amount (XOF)"
                    type="number"
                    value={form.familySupportAmount}
                    onChange={(v) => updateField("familySupportAmount", v)}
                    placeholder="Optional"
                  />
                  <Checkbox
                    label="I receive family support"
                    checked={form.hasFamilySupport}
                    onChange={(checked) => updateField("hasFamilySupport", checked)}
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="3. Requested product"
                description="Tell us what you want to finance and how much you can pay upfront."
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Input
                    label="Product name"
                    required
                    value={form.productName}
                    onChange={(v) => updateField("productName", v)}
                    error={fieldErrors.productName?.[0]}
                    placeholder="HP ProBook 440"
                  />
                  <Select
                    label="Product type"
                    required
                    value={form.productType}
                    onChange={(v) => updateField("productType", v as ProductType)}
                    error={fieldErrors.productType?.[0]}
                    options={[
                      ["LAPTOP", "Laptop"],
                      ["SMARTPHONE", "Smartphone"],
                      ["TABLET", "Tablet"],
                      ["ROUTER", "Router"],
                    ]}
                  />
                  <Input
                    label="Brand"
                    value={form.productBrand}
                    onChange={(v) => updateField("productBrand", v)}
                    placeholder="Optional"
                  />
                  <Input
                    label="Model"
                    value={form.productModel}
                    onChange={(v) => updateField("productModel", v)}
                    placeholder="Optional"
                  />
                  <Input
                    label="Product price (XOF)"
                    required
                    type="number"
                    value={form.productPrice}
                    onChange={(v) => updateField("productPrice", v)}
                    error={fieldErrors.productPrice?.[0]}
                    placeholder="250000"
                  />
                  <Input
                    label="Available down payment (XOF)"
                    required
                    type="number"
                    value={form.availableDownPayment}
                    onChange={(v) => updateField("availableDownPayment", v)}
                    error={fieldErrors.availableDownPayment?.[0]}
                    placeholder="100000"
                  />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <MetricCard
                    label="Product price"
                    value={`${productPrice.toLocaleString()} XOF`}
                  />
                  <MetricCard
                    label="Down payment"
                    value={`${availableDownPayment.toLocaleString()} XOF`}
                  />
                  <MetricCard
                    label="Estimated financed amount"
                    value={`${financedAmount.toLocaleString()} XOF`}
                    accent
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="4. Support information"
                description="A guarantor is optional in this version, but it can improve the strength of your application."
              >
                <div className="mb-6">
                  <Checkbox
                    label="I have a guarantor"
                    checked={form.hasGuarantor}
                    onChange={(checked) => updateField("hasGuarantor", checked)}
                  />
                </div>

                {form.hasGuarantor ? (
                  <div className="grid gap-5 md:grid-cols-2">
                    <Input
                      label="Guarantor full name"
                      required
                      value={form.guarantorFullName}
                      onChange={(v) => updateField("guarantorFullName", v)}
                      error={fieldErrors.guarantorFullName?.[0]}
                      placeholder="Mamadou Ndiaye"
                    />
                    <Input
                      label="Relationship"
                      required
                      value={form.guarantorRelationship}
                      onChange={(v) => updateField("guarantorRelationship", v)}
                      error={fieldErrors.guarantorRelationship?.[0]}
                      placeholder="Father, mother, brother, uncle..."
                    />
                    <Input
                      label="Guarantor phone"
                      required
                      value={form.guarantorPhone}
                      onChange={(v) => updateField("guarantorPhone", v)}
                      error={fieldErrors.guarantorPhone?.[0]}
                      placeholder="77 111 22 33"
                    />
                    <Input
                      label="Guarantor email"
                      type="email"
                      value={form.guarantorEmail}
                      onChange={(v) => updateField("guarantorEmail", v)}
                      error={fieldErrors.guarantorEmail?.[0]}
                      placeholder="Optional"
                    />
                    <Input
                      label="Profession"
                      value={form.guarantorProfession}
                      onChange={(v) => updateField("guarantorProfession", v)}
                      placeholder="Optional"
                    />
                    <Input
                      label="Address"
                      value={form.guarantorAddressLine}
                      onChange={(v) => updateField("guarantorAddressLine", v)}
                      placeholder="Optional"
                    />
                    <Input
                      label="City"
                      value={form.guarantorCity}
                      onChange={(v) => updateField("guarantorCity", v)}
                      placeholder="Optional"
                    />
                    <Input
                      label="Support type"
                      value={form.guarantorSupportType}
                      onChange={(v) => updateField("guarantorSupportType", v)}
                      placeholder="Moral support, financial support..."
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    You can continue without a guarantor. Adding one may improve confidence in your file.
                  </div>
                )}
              </SectionCard>

              <div className="sticky bottom-4 z-10 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Ready to submit your application?
                    </p>
                    <p className="text-sm text-slate-600">
                      Make sure your required fields are complete and your information is accurate.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Submitting..." : "Submit application"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Application summary
              </h2>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Completion</span>
                  <span className="font-semibold text-slate-900">{completion}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 divide-y divide-slate-200">
                <SummaryRow
                  label="Applicant"
                  value={`${form.firstName || "-"} ${form.lastName || ""}`.trim() || "-"}
                />
                <SummaryRow
                  label="Profile"
                  value={humanizeApplicantStatus(form.applicantStatus)}
                />
                <SummaryRow
                  label="School"
                  value={form.schoolName || "Not provided"}
                />
                <SummaryRow
                  label="Device"
                  value={form.productName || "Not provided"}
                />
                <SummaryRow
                  label="Price"
                  value={productPrice ? `${productPrice.toLocaleString()} XOF` : "0 XOF"}
                />
                <SummaryRow
                  label="Down payment"
                  value={
                    availableDownPayment
                      ? `${availableDownPayment.toLocaleString()} XOF`
                      : "0 XOF"
                  }
                />
                <SummaryRow
                  label="To finance"
                  value={`${financedAmount.toLocaleString()} XOF`}
                />
                <SummaryRow
                  label="Guarantor"
                  value={form.hasGuarantor ? form.guarantorFullName || "Not provided" : "No guarantor"}
                />
              </div>

              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="text-sm font-semibold text-blue-900">
                  Tips to increase your chances
                </h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-blue-800">
                  <li>• Use a realistic product price.</li>
                  <li>• Increase your down payment if possible.</li>
                  <li>• Add support information that strengthens your file.</li>
                  <li>• Complete school information if you are a student.</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4",
        accent
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-slate-50 text-slate-900",
      ].join(" ")}
    >
      <p className={accent ? "text-sm text-slate-300" : "text-sm text-slate-500"}>
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  error?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-800">
        {label} {required && <span className="text-red-600">*</span>}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={[
          "w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition",
          "placeholder:text-slate-400 focus:ring-4",
          error
            ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100"
            : "border-slate-300 bg-white focus:border-slate-900 focus:ring-slate-100",
        ].join(" ")}
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  required = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-800">
        {label} {required && <span className="text-red-600">*</span>}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={[
          "w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-4",
          error
            ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100"
            : "border-slate-300 bg-white focus:border-slate-900 focus:ring-slate-100",
        ].join(" ")}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300"
      />
      {label}
    </label>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function toHumanLabel(field: string) {
  const labels: Record<string, string> = {
    firstName: "First name",
    lastName: "Last name",
    dateOfBirth: "Date of birth",
    phone: "Phone",
    email: "Email",
    addressLine: "Address",
    city: "City",
    applicantStatus: "Applicant status",
    schoolName: "School name",
    productName: "Product name",
    productType: "Product type",
    productPrice: "Product price",
    availableDownPayment: "Available down payment",
    guarantorFullName: "Guarantor full name",
    guarantorRelationship: "Relationship",
    guarantorPhone: "Guarantor phone",
    guarantorEmail: "Guarantor email",
  };

  return labels[field] || field;
}

function countMissingRequiredFields(form: FormState, isAcademicProfile: boolean) {
  const requiredValues = [
    form.firstName,
    form.lastName,
    form.dateOfBirth,
    form.phone,
    form.addressLine,
    form.city,
    form.applicantStatus,
    form.productName,
    form.productType,
    form.productPrice,
    form.availableDownPayment,
    ...(isAcademicProfile ? [form.schoolName] : []),
    ...(form.hasGuarantor
      ? [form.guarantorFullName, form.guarantorRelationship, form.guarantorPhone]
      : []),
  ];

  return requiredValues.filter((value) => !String(value ?? "").trim()).length;
}

function humanizeApplicantStatus(status: ApplicantStatus) {
  const map: Record<ApplicantStatus, string> = {
    STUDENT: "Student",
    APPRENTICE: "Apprentice",
    INTERN: "Intern",
    EMPLOYEE: "Employee",
    FREELANCER: "Freelancer",
    OTHER: "Other",
  };

  return map[status];
}