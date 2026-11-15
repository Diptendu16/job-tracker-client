import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as inviteApi from "../api/inviteApi";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading, refreshWorkspaces } = useAuth();
  const navigate = useNavigate();

  const [details, setDetails] = useState<{ workspaceName: string } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);

  const loadDetails = useCallback(async () => {
    if (!token) return;
    try {
      const result = await inviteApi.fetchInviteDetails(token);
      setDetails(result);
    } catch {
      setError("This invite link is invalid or has expired.");
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading && token) {
      loadDetails();
    }
  }, [authLoading, token, loadDetails]);

  async function handleAccept() {
    if (!token) return;
    setAccepting(true);
    try {
      const joinedWorkspace = await inviteApi.acceptInvite(token);
      await refreshWorkspaces(joinedWorkspace.id);
      navigate("/");
    } catch {
      setError("Could not join this workspace. Please try again.");
      setAccepting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="bg-gray-800 p-8 rounded-lg text-center max-w-sm">
          <p className="mb-4">You need to log in to accept this invite.</p>
          <Link to="/login" className="text-blue-400 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg text-center max-w-sm">
        {error && <p className="text-red-400 mb-4">{error}</p>}
        {!error && details && (
          <>
            <p className="mb-4">
              You've been invited to join{" "}
              <span className="font-semibold">{details.workspaceName}</span>
            </p>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold disabled:opacity-50"
            >
              {accepting ? "Joining..." : "Accept Invite"}
            </button>
          </>
        )}
        {!error && !details && <p>Loading invite...</p>}
      </div>
    </div>
  );
}
