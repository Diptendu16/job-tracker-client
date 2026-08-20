import { useState, useEffect, FormEvent } from "react";
import type {
  Application,
  ApplicationFormData,
  ApplicationPlatform,
  ApplicationStatus,
} from "../types/application";

const PLATFORMS: ApplicationPlatform[] = [
  "INTERNSHALA",
  "LINKEDIN",
  "NAUKRI",
  "COMPANY_WEBSITE",
  "WELLFOUND",
  "REFERRAL",
  "CAMPUS_PLACEMENT",
  "OTHER",
];

const STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "OA",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationFormData) => Promise<void>;
  initialData?: Application | null;
}

const emptyForm: ApplicationFormData = {
  company: "",
  role: "",
  platform: "LINKEDIN",
  status: "APPLIED",
  appliedDate: new Date().toISOString().split("T")[0],
  deadline: "",
  oaDate: "",
  interviewDate: "",
  notes: "",
};

export function ApplicationModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: Props) {
  const [form, setForm] = useState<ApplicationFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        company: initialData.company,
        role: initialData.role,
        platform: initialData.platform,
        status: initialData.status,
        appliedDate: initialData.appliedDate.split("T")[0],
        deadline: initialData.deadline?.split("T")[0] ?? "",
        oaDate: initialData.oaDate?.split("T")[0] ?? "",
        interviewDate: initialData.interviewDate?.split("T")[0] ?? "",
        notes: initialData.notes ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch {
      setError("Something went wrong. Please check your inputs.");
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
              onChange={(e) =>
                setForm({
                  ...form,
                  platform: e.target.value as ApplicationPlatform,
                })
              }
              className="bg-gray-700 text-white p-2 rounded"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p.replace("_", " ")}
                </option>
              ))}
            </select>

            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as ApplicationStatus,
                })
              }
              className="bg-gray-700 text-white p-2 rounded"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-gray-400 text-sm">Applied Date</label>
            <input
              type="date"
              value={form.appliedDate}
              onChange={(e) =>
                setForm({ ...form, appliedDate: e.target.value })
              }
              className="bg-gray-700 text-white p-2 rounded w-full"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-gray-400 text-sm">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="bg-gray-700 text-white p-2 rounded w-full"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">OA Date</label>
              <input
                type="date"
                value={form.oaDate}
                onChange={(e) => setForm({ ...form, oaDate: e.target.value })}
                className="bg-gray-700 text-white p-2 rounded w-full"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Interview Date</label>
              <input
                type="date"
                value={form.interviewDate}
                onChange={(e) =>
                  setForm({ ...form, interviewDate: e.target.value })
                }
                className="bg-gray-700 text-white p-2 rounded w-full"
              />
            </div>
          </div>

          <textarea
            placeholder="Notes"
            value={form.notes}
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
