"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CollectionActionType = "contact" | "promise" | "escalate" | "note";

type ContactStatus = "CONTACT_ATTEMPTED" | "REACHED" | "NO_RESPONSE";

type ContactChannel =
  | "PHONE"
  | "WHATSAPP"
  | "SMS"
  | "EMAIL"
  | "IN_PERSON"
  | "SYSTEM";

type ContactOutcome =
  | "NO_ANSWER"
  | "CALLBACK_REQUESTED"
  | "PAID"
  | "PARTIAL_PAYMENT"
  | "PROMISED"
  | "REFUSED"
  | "INVALID_NUMBER"
  | "DISPUTED"
  | "INFO_UPDATED"
  | "OTHER";

type NextActionType =
  | "CALL"
  | "WHATSAPP"
  | "SMS"
  | "EMAIL"
  | "FOLLOW_UP"
  | "ESCALATE"
  | "NONE";

type CollectionStage =
  | "NONE"
  | "SOFT_COLLECTION"
  | "ESCALATED"
  | "RESOLVED"
  | null;

type CollectionResolutionStatus =
  | "OPEN"
  | "MONITORING"
  | "CURED"
  | "CLOSED"
  | null;

function humanizeCollectionStage(stage: CollectionStage) {
  if (!stage) return "-";

  const map: Record<Exclude<CollectionStage, null>, string> = {
    NONE: "None",
    SOFT_COLLECTION: "Soft collection",
    ESCALATED: "Escalated",
    RESOLVED: "Resolved",
  };

  return map[stage];
}

function humanizeResolutionStatus(status: CollectionResolutionStatus) {
  if (!status) return "-";

  const map: Record<Exclude<CollectionResolutionStatus, null>, string> = {
    OPEN: "Open",
    MONITORING: "Monitoring",
    CURED: "Cured",
    CLOSED: "Closed",
  };

  return map[status];
}

export default function CollectionActions({
  applicationId,
  hasCollectionCase,
  collectionStage,
  resolutionStatus,
}: {
  applicationId: string;
  hasCollectionCase: boolean;
  collectionStage: CollectionStage;
  resolutionStatus: CollectionResolutionStatus;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState<CollectionActionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [contactStatus, setContactStatus] =
    useState<ContactStatus>("REACHED");
  const [contactChannel, setContactChannel] =
    useState<ContactChannel>("PHONE");
  const [contactOutcome, setContactOutcome] =
    useState<ContactOutcome>("CALLBACK_REQUESTED");
  const [contactNote, setContactNote] = useState("");
  const [contactNextActionType, setContactNextActionType] =
    useState<NextActionType>("FOLLOW_UP");
  const [contactNextActionDate, setContactNextActionDate] = useState("");

  const [promiseDate, setPromiseDate] = useState("");
  const [promiseAmount, setPromiseAmount] = useState("");
  const [promiseChannel, setPromiseChannel] =
    useState<ContactChannel>("PHONE");
  const [promiseNote, setPromiseNote] = useState("");

  const [escalationNote, setEscalationNote] = useState("");
  const [escalationNextActionDate, setEscalationNextActionDate] = useState("");

  const [generalNote, setGeneralNote] = useState("");
  const [noteNextActionType, setNoteNextActionType] =
    useState<NextActionType>("FOLLOW_UP");
  const [noteNextActionDate, setNoteNextActionDate] = useState("");

  const isResolvedCase =
    collectionStage === "RESOLVED" || resolutionStatus === "CLOSED";

  const actionsDisabled = loading !== null || !hasCollectionCase || isResolvedCase;

  async function handleAction(
    action: CollectionActionType,
    url: string,
    payload: Record<string, unknown>,
    successMessage: string
  ) {
    if (actionsDisabled) {
      return;
    }

    setLoading(action);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.error || "Failed to process collection action.");
        setLoading(null);
        return;
      }

      setSuccess(successMessage);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function submitContact() {
    await handleAction(
      "contact",
      `/api/admin/applications/${applicationId}/collections/contact`,
      {
        contactStatus,
        channel: contactChannel,
        outcome: contactOutcome,
        note: contactNote,
        nextActionType: contactNextActionType,
        nextActionDate: contactNextActionDate || null,
      },
      "Collection contact activity recorded."
    );
  }

  async function submitPromise() {
    await handleAction(
      "promise",
      `/api/admin/applications/${applicationId}/collections/promise`,
      {
        promisedDate: promiseDate,
        promisedAmount: promiseAmount ? Number(promiseAmount) : null,
        channel: promiseChannel,
        note: promiseNote,
      },
      "Promise to pay recorded."
    );
  }

  async function submitEscalation() {
    await handleAction(
      "escalate",
      `/api/admin/applications/${applicationId}/collections/escalate`,
      {
        note: escalationNote,
        nextActionDate: escalationNextActionDate || null,
      },
      "Collection case escalated."
    );
  }

  async function submitNote() {
    await handleAction(
      "note",
      `/api/admin/applications/${applicationId}/collections/note`,
      {
        note: generalNote,
        nextActionType: noteNextActionType,
        nextActionDate: noteNextActionDate || null,
      },
      "Collection note saved."
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        Collection actions
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Record collection activity, capture promises to pay, escalate cases,
        and schedule the next operational action.
      </p>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <div className="flex flex-col gap-2">
          <div>
            <span className="text-slate-500">Collection case: </span>
            <span className="font-medium text-slate-900">
              {hasCollectionCase ? "Available" : "Not created yet"}
            </span>
          </div>

          {hasCollectionCase && (
            <>
              <div>
                <span className="text-slate-500">Stage: </span>
                <span className="font-medium text-slate-900">
                  {humanizeCollectionStage(collectionStage)}
                </span>
              </div>

              <div>
                <span className="text-slate-500">Resolution status: </span>
                <span className="font-medium text-slate-900">
                  {humanizeResolutionStatus(resolutionStatus)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {!hasCollectionCase && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          No collection case exists yet. A case is created automatically when an
          installment becomes late.
        </div>
      )}

      {hasCollectionCase && isResolvedCase && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          This collection case is resolved. New recovery actions are disabled.
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="mt-6 grid gap-6">
        <ActionCard
          title="Mark contacted"
          description="Store a contact attempt or successful contact and plan the next follow-up."
          disabled={actionsDisabled}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label>Contact status</Label>
              <Select
                value={contactStatus}
                onChange={(e) =>
                  setContactStatus(e.target.value as ContactStatus)
                }
                disabled={actionsDisabled}
              >
                <option value="CONTACT_ATTEMPTED">Contact attempted</option>
                <option value="REACHED">Reached</option>
                <option value="NO_RESPONSE">No response</option>
              </Select>
            </Field>

            <Field>
              <Label>Channel</Label>
              <Select
                value={contactChannel}
                onChange={(e) =>
                  setContactChannel(e.target.value as ContactChannel)
                }
                disabled={actionsDisabled}
              >
                <option value="PHONE">Phone</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="IN_PERSON">In person</option>
              </Select>
            </Field>

            <Field>
              <Label>Outcome</Label>
              <Select
                value={contactOutcome}
                onChange={(e) =>
                  setContactOutcome(e.target.value as ContactOutcome)
                }
                disabled={actionsDisabled}
              >
                <option value="CALLBACK_REQUESTED">Callback requested</option>
                <option value="NO_ANSWER">No answer</option>
                <option value="PROMISED">Promised</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL_PAYMENT">Partial payment</option>
                <option value="REFUSED">Refused</option>
                <option value="DISPUTED">Disputed</option>
                <option value="INFO_UPDATED">Info updated</option>
                <option value="INVALID_NUMBER">Invalid number</option>
                <option value="OTHER">Other</option>
              </Select>
            </Field>

            <Field>
              <Label>Next action type</Label>
              <Select
                value={contactNextActionType}
                onChange={(e) =>
                  setContactNextActionType(e.target.value as NextActionType)
                }
                disabled={actionsDisabled}
              >
                <option value="CALL">Call</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="ESCALATE">Escalate</option>
                <option value="NONE">None</option>
              </Select>
            </Field>

            <Field>
              <Label>Next action date</Label>
              <Input
                type="datetime-local"
                value={contactNextActionDate}
                onChange={(e) => setContactNextActionDate(e.target.value)}
                disabled={actionsDisabled}
              />
            </Field>
          </div>

          <Field className="mt-4">
            <Label>Note</Label>
            <Textarea
              rows={4}
              value={contactNote}
              onChange={(e) => setContactNote(e.target.value)}
              placeholder="Add what happened during the contact attempt..."
              disabled={actionsDisabled}
            />
          </Field>

          <div className="mt-4">
            <PrimaryButton onClick={submitContact} disabled={actionsDisabled}>
              {loading === "contact" ? "Saving..." : "Save contact activity"}
            </PrimaryButton>
          </div>
        </ActionCard>

        <ActionCard
          title="Promise to pay"
          description="Record a promised payment date and amount for follow-up."
          disabled={actionsDisabled}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label>Promised date</Label>
              <Input
                type="datetime-local"
                value={promiseDate}
                onChange={(e) => setPromiseDate(e.target.value)}
                disabled={actionsDisabled}
              />
            </Field>

            <Field>
              <Label>Promised amount (XOF)</Label>
              <Input
                type="number"
                min="0"
                value={promiseAmount}
                onChange={(e) => setPromiseAmount(e.target.value)}
                placeholder="50000"
                disabled={actionsDisabled}
              />
            </Field>

            <Field>
              <Label>Channel</Label>
              <Select
                value={promiseChannel}
                onChange={(e) =>
                  setPromiseChannel(e.target.value as ContactChannel)
                }
                disabled={actionsDisabled}
              >
                <option value="PHONE">Phone</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="IN_PERSON">In person</option>
              </Select>
            </Field>
          </div>

          <Field className="mt-4">
            <Label>Note</Label>
            <Textarea
              rows={4}
              value={promiseNote}
              onChange={(e) => setPromiseNote(e.target.value)}
              placeholder="Add details about the commitment made by the applicant..."
              disabled={actionsDisabled}
            />
          </Field>

          <div className="mt-4">
            <PrimaryButton onClick={submitPromise} disabled={actionsDisabled}>
              {loading === "promise" ? "Saving..." : "Save promise to pay"}
            </PrimaryButton>
          </div>
        </ActionCard>

        <ActionCard
          title="Escalate"
          description="Escalate the case when soft collection is no longer sufficient."
          disabled={actionsDisabled}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label>Next action date</Label>
              <Input
                type="datetime-local"
                value={escalationNextActionDate}
                onChange={(e) => setEscalationNextActionDate(e.target.value)}
                disabled={actionsDisabled}
              />
            </Field>
          </div>

          <Field className="mt-4">
            <Label>Escalation note</Label>
            <Textarea
              rows={4}
              value={escalationNote}
              onChange={(e) => setEscalationNote(e.target.value)}
              placeholder="Explain why the case is being escalated..."
              disabled={actionsDisabled}
            />
          </Field>

          <div className="mt-4">
            <button
              type="button"
              onClick={submitEscalation}
              disabled={actionsDisabled}
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
            >
              {loading === "escalate" ? "Saving..." : "Escalate case"}
            </button>
          </div>
        </ActionCard>

        <ActionCard
          title="Add note / schedule follow-up"
          description="Keep a clean audit trail and update the next operational step."
          disabled={actionsDisabled}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label>Next action type</Label>
              <Select
                value={noteNextActionType}
                onChange={(e) =>
                  setNoteNextActionType(e.target.value as NextActionType)
                }
                disabled={actionsDisabled}
              >
                <option value="CALL">Call</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="ESCALATE">Escalate</option>
                <option value="NONE">None</option>
              </Select>
            </Field>

            <Field>
              <Label>Next action date</Label>
              <Input
                type="datetime-local"
                value={noteNextActionDate}
                onChange={(e) => setNoteNextActionDate(e.target.value)}
                disabled={actionsDisabled}
              />
            </Field>
          </div>

          <Field className="mt-4">
            <Label>Note</Label>
            <Textarea
              rows={4}
              value={generalNote}
              onChange={(e) => setGeneralNote(e.target.value)}
              placeholder="Add an internal recovery note..."
              disabled={actionsDisabled}
            />
          </Field>

          <div className="mt-4">
            <PrimaryButton onClick={submitNote} disabled={actionsDisabled}>
              {loading === "note" ? "Saving..." : "Save note"}
            </PrimaryButton>
          </div>
        </ActionCard>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  children,
  disabled = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-slate-50 p-5 ${
        disabled ? "opacity-70" : ""
      }`}
    >
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-sm font-medium text-slate-800">
      {children}
    </label>
  );
}

function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${className}`}
    />
  );
}

function Select({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${className}`}
    >
      {children}
    </select>
  );
}

function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 ${className}`}
    />
  );
}

function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-2xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}