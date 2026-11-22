import { useState, useEffect, type SubmitEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { type ResumeVersion } from "../types/resumeVersion";
import * as resumeVersionApi from "../api/resumeVersionApi";
import axios from "axios";

export default function ResumeVersions() {
  const { workspace } = useAuth();
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (workspace) loadVersions();
  }, [workspace]);

  async function loadVersions() {
    if (!workspace) return;
    setLoading(true);
    try {
      const data = await resumeVersionApi.fetchResumeVersions(workspace.id);
      setVersions(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!workspace) return;
    setError("");
    try {
      await resumeVersionApi.createResumeVersion(workspace.id, {
        name,
        url,
        notes,
      });
      setName("");
      setUrl("");
      setNotes("");
      await loadVersions();
    } catch {
      setError("Could not create resume version. Check your inputs.");
    }
  }

  async function handleDelete(id: string) {
    if (!workspace) return;
    if (!confirm("Delete this resume version?")) return;
    setDeleteError("");
    try {
      await resumeVersionApi.deleteResumeVersion(workspace.id, id);
      await loadVersions();
    } catch (err) {
      setDeleteError(
        axios.isAxiosError(err) &&
          typeof err.response?.data?.message === "string"
          ? err.response.data.message
          : "Could not delete this resume version.",
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Resume Versions</h1>
        <Link to="/" className="text-blue-400 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 rounded-lg p-4 mb-6 space-y-3"
      >
        <h2 className="font-semibold text-gray-300">Add New Version</h2>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <input
          placeholder="Name (e.g. Frontend Resume v3)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-gray-700 p-2 rounded w-full"
          required
        />
        <input
          placeholder="Link to file (optional — Drive, Dropbox, etc.)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="bg-gray-700 p-2 rounded w-full"
        />
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="bg-gray-700 p-2 rounded w-full"
          rows={2}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold"
        >
          Add Version
        </button>
      </form>

      {deleteError && (
        <p className="text-red-400 text-sm mb-3">{deleteError}</p>
      )}

      <div className="bg-gray-800 rounded-lg divide-y divide-gray-700">
        {loading ? (
          <p className="p-4 text-gray-400">Loading...</p>
        ) : versions.length === 0 ? (
          <p className="p-4 text-gray-400">No resume versions yet.</p>
        ) : (
          versions.map((v) => (
            <div key={v._id} className="p-4 flex justify-between items-start">
              <div>
                <p className="font-semibold">{v.name}</p>
                {v.url && (
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-sm hover:underline"
                  >
                    View file
                  </a>
                )}
                {v.notes && (
                  <p className="text-gray-400 text-sm mt-1">{v.notes}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(v._id)}
                className="text-red-400 hover:underline text-sm"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
