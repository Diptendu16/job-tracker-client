import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import * as inviteApi from "../api/inviteApi";

export function InviteMembersButton() {
  const { workspace } = useAuth();
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!workspace || workspace.role !== "OWNER") return null;

  async function handleOpen() {
    setOpen(true);
    if (!link) {
      setLoading(true);
      try {
        const result = await inviteApi.createInvite(workspace!.id);
        setLink(result.link);
      } finally {
        setLoading(false);
      }
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-blue-400 hover:underline text-sm"
      >
        Invite Members
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-3">
              Invite Members
            </h2>
            {loading ? (
              <p className="text-gray-400">Generating link...</p>
            ) : (
              <>
                <p className="text-gray-400 text-sm mb-3">
                  Anyone with this link can join within 7 days.
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={link}
                    className="bg-gray-700 text-white p-2 rounded flex-1 text-sm"
                  />
                  <button
                    onClick={handleCopy}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:underline text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
