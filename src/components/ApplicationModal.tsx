import { useState, useEffect, type FormEvent } from "react";
import axios from "axios";
import type {
  Application,
  ApplicationFormData,
  ApplicationPlatform,
  ApplicationStatus,
} from "../types/application";
import type { ResumeVersion } from "../types/resumeVersion";
import * as resumeVersionApi from "../api/resumeVersionApi";
import { todayLocalInputValue, toDateInputValue } from "../utils/dates";

const PLATFORMS: ApplicationPlatform[] = [
  "INTERNSHALA", "LINKEDIN", "NAUKRI", "COMPANY_WEBSITE",
  "WELLFOUND", "REFERRAL", "CAMPUS_PLACEMENT", "OTHER",
];

const STATUSES: ApplicationStatus[] = ["APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED"];

// Fields the server lets you remove by sending null
const CLEARABLE_KEYS = ["deadline", "oaDate", "interviewDate", "followUpDate", "resumeVersion"] as const;

type Payload = Record<string, unknown>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Payload) => Promise<void>;
  initialData?: Application | null;
  workspaceId: string;
}

// A function (not a constant) so "today" is computed when the modal opens, not when the app loads
function makeEmptyForm(): ApplicationFormData {
  return {
    company: "",
    role: "",
    platform: "LINKEDIN",
    status: "APPLIED",
    appliedDate: todayLocalInputValue(),
    deadline: "",
    oaDate: "",
    interviewDate: "",
    followUpDate: "",
    notes: "",
    resumeVersion: "",
  };
}

function formFromApplication(app: Application): ApplicationFormData {
  return {
    company: app.company,
    role: app.role,
    platform: app.platform,
    status: app.status,
    appliedDate: toDateInputValue(app.appliedDate),
    deadline: toDateInputValue(app.deadline),
    oaDate: toDateInputValue(app.oaDate),
    interviewDate: toDateInputValue(app.interviewDate),
    followUpDate: toDateInputValue(app.followUpDate),
    notes: app.notes ?? "",
    resumeVersion: app.resumeVersion ?? "",
  };
}

// Create: send everything except blank optional fields
function buildCreatePayload(form: ApplicationFormData): Payload {
  const payload: Payload = { ...form };
  for (const key of CLEARABLE_KEYS) {
    if (payload[key] === "") delete payload[key];
  }
  if (payload.notes === "") delete payload.notes;
  return payload;
}

// Edit: send ONLY the fields the user changed. Anything they didn't touch (like a status a
// teammate just changed) is left alone. A date or resume that was emptied becomes null,
// which tells the server to remove it.
function buildEditPayload(form: ApplicationFormData, baseline: ApplicationFormData): Payload {
  const payload: Payload = {};
  for (const key of Object.keys(form) as (keyof ApplicationFormData)[]) {
    if (form[key] === baseline[key]) continue;
    const isClearable = (CLEARABLE_KEYS as readonly string[]).includes(key);
    payload[key] = isClearable && form[key] === "" ? null : form[key];
  }
  return payload;
}

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return data.errors
        .map((e: { field: string; message: string }) => `${e.field}: ${e.message}`)
        .join(", ");
    }
    if (typeof data?.message === "string") return data.message;
  }
  return "Something went wrong. Please check your inputs.";
}

export function ApplicationModal({ isOpen, onClose, onSubmit, initialData, workspaceId }: Props) {
  const [form, setForm] = useState<ApplicationFormData>(makeEmptyForm);
  const [baseline, setBaseline] = useState<ApplicationFormData>(makeEmptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resumeVersions, setResumeVersions] = useState<ResumeVersion[]>([]);

  useEffect(() => {
    if (isOpen && workspaceId) {
      resumeVersionApi
        .fetchResumeVersions(workspaceId)
        .then(setResumeVersions)
        .catch(() => setResumeVersions([]));
    }
  }, [isOpen, workspaceId]);

  useEffect(() => {
    const next = initialData ? formFromApplication(initialData) : makeEmptyForm();
    setForm(next);
    setBaseline(next); // what the form looked like when it opened, to detect changes
    setError("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const payload = initialData ? buildEditPayload(form, baseline) : buildCreatePayload(form);

    // Nothing changed: no request, no activity entry
    if (initialData && Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">
          {initialData ? "Edit Application" : "New Application"}
        </h2>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="bg-gray-700 text-white p-2 rounded"
              required
            />
            <input
              placeholder="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="bg-gray-700 text-white p-2 rounded"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value as ApplicationPlatform })}
              className="bg-gray-700 text-white p-2 rounded"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p.replace("_", " ")}</option>
              ))}
            </select>

            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ApplicationStatus })}
              className="bg-gray-700 text-white p-2 rounded"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-gray-400 text-sm">Applied Date</label>
            <input
              type="date"
              value={form.appliedDate}
              onChange={(e) => setForm({ ...form, appliedDate: e.target.value })}
              className="bg-gray-700 text-white p-2 rounded w-full"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-sm">Deadline</label>
              <input
                type="date"
                value={form.deadline ?? ""}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="bg-gray-700 text-white p-2 rounded w-full"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">OA Date</label>
              <input
                type="date"
                value={form.oaDate ?? ""}
                onChange={(e) => setForm({ ...form, oaDate: e.target.value })}
                className="bg-gray-700 text-white p-2 rounded w-full"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Interview Date</label>
              <input
                type="date"
                value={form.interviewDate ?? ""}
                onChange={(e) => setForm({ ...form, interviewDate: e.target.value })}
                className="bg-gray-700 text-white p-2 rounded w-full"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Follow-up Date</label>
              <input
                type="date"
                value={form.followUpDate ?? ""}
                onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                className="bg-gray-700 text-white p-2 rounded w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm">Resume Version (optional)</label>
            <select
              value={form.resumeVersion ?? ""}
              onChange={(e) => setForm({ ...form, resumeVersion: e.target.value })}
              className="bg-gray-700 text-white p-2 rounded w-full"
            >
              <option value="">None</option>
              {resumeVersions.map((v) => (
                <option key={v._id} value={v._id}>{v.name}</option>
              ))}
            </select>
          </div>

          <textarea
            placeholder="Notes"
            value={form.notes ?? ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="bg-gray-700 text-white p-2 rounded w-full"
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {submitting ? "Saving..." : initialData ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}