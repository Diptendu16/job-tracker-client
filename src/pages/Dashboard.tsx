import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type {
  Application,
  ApplicationFilters,
  Pagination as PaginationType,
} from "../types/application";
import * as applicationApi from "../api/applicationApi";
import { useSocketEvent } from "../hooks/useSocketEvent";
import { ApplicationModal } from "../components/ApplicationModal";
import { Pagination } from "../components/Pagination";
import { StatusBadge } from "../components/StatusBadge";
import { KanbanBoard } from "../components/KanbanBoard";
import { NeedsAttentionPanel } from "../components/NeedsAttentionPanel";
import { WorkspaceSwitcher } from "../components/WorkspaceSwitcher";
import { InviteMembersButton } from "../components/InviteMembersButton";
import { ActivityFeed } from "../components/ActivityFeed";
import { formatDateOnly } from "../utils/dates";

export default function Dashboard() {
  const { user, workspace, logout, resyncKey } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [filters, setFilters] = useState<ApplicationFilters>({
    page: 1,
    sortBy: "createdAt",
    order: "desc",
  });
  const [companySearch, setCompanySearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [view, setView] = useState<"table" | "board">("table");
  const [activityOpen, setActivityOpen] = useState(false);

  // Local changes (modal, drag) refresh the board AND the panel.
  // Remote changes patch the board directly, so only the panel and table are refetched for them.
  const [boardRefreshKey, setBoardRefreshKey] = useState(0);
  const [panelRefreshKey, setPanelRefreshKey] = useState(0);

  const remoteRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // `silent` skips the "Loading..." row, so live updates don't flash the table.
  const loadApplications = useCallback(
    async (silent = false) => {
      if (!workspace) return;
      if (!silent) setLoading(true);
      try {
        const result = await applicationApi.fetchApplications(
          workspace.id,
          filters,
        );
        setApplications(result.applications);
        setPagination(result.pagination);
      } catch {
        console.error("Failed to load applications");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [workspace, filters],
  );

  // Always points at the latest loadApplications, for use inside timers.
  const loadApplicationsRef = useRef(loadApplications);
  useEffect(() => {
    loadApplicationsRef.current = loadApplications;
  }, [loadApplications]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    if (view === "table") {
      loadApplications();
    }
  }, [view, loadApplications]);

  // After a reconnect, refetch the table silently (the board and panel pick up resyncKey via their keys).
  useEffect(() => {
    if (resyncKey > 0) loadApplicationsRef.current(true);
  }, [resyncKey]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((f) => ({
        ...f,
        company: companySearch || undefined,
        page: 1,
      }));
    }, 400);
    return () => clearTimeout(timeout);
  }, [companySearch]);

  useEffect(() => {
    return () => {
      if (remoteRefreshTimer.current) clearTimeout(remoteRefreshTimer.current);
    };
  }, []);

  // A burst of events (e.g. someone dragging several cards) causes one refetch, not many.
  function scheduleRemoteRefresh() {
    if (remoteRefreshTimer.current) clearTimeout(remoteRefreshTimer.current);
    remoteRefreshTimer.current = setTimeout(() => {
      loadApplicationsRef.current(true);
      setPanelRefreshKey((k) => k + 1);
    }, 400);
  }

  function handleRemoteChange(payload: { workspaceId: string }) {
    if (payload.workspaceId === workspace?.id) scheduleRemoteRefresh();
  }

  useSocketEvent<{ workspaceId: string }>(
    "application.created",
    handleRemoteChange,
  );
  useSocketEvent<{ workspaceId: string }>(
    "application.updated",
    handleRemoteChange,
  );
  useSocketEvent<{ workspaceId: string }>(
    "application.deleted",
    handleRemoteChange,
  );

  async function refreshAllData() {
    await loadApplications();
    setBoardRefreshKey((k) => k + 1);
    setPanelRefreshKey((k) => k + 1);
  }

  function openCreateModal() {
    setEditingApp(null);
    setModalOpen(true);
  }

  function openEditModal(app: Application) {
    setEditingApp(app);
    setModalOpen(true);
  }

  async function handleSubmit(data: any) {
    if (!workspace) return;
    if (editingApp) {
      await applicationApi.updateApplication(
        workspace.id,
        editingApp._id,
        data,
      );
    } else {
      await applicationApi.createApplication(workspace.id, data);
    }
    await refreshAllData();
  }

  async function handleDelete(id: string) {
    if (!workspace) return;
    if (!confirm("Delete this application?")) return;
    await applicationApi.deleteApplication(workspace.id, id);
    await refreshAllData();
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
          <WorkspaceSwitcher />
        </div>
        <div className="flex gap-4 items-center">
          <InviteMembersButton />
          <Link
            to="/resume-versions"
            className="text-blue-400 hover:underline text-sm"
          >
            Resume Versions
          </Link>
          <Link
            to="/analytics"
            className="text-blue-400 hover:underline text-sm"
          >
            Analytics
          </Link>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold"
          >
            Logout
          </button>
        </div>
      </div>

      {workspace && (
        <NeedsAttentionPanel
          key={workspace.id}
          workspaceId={workspace.id}
          refreshKey={panelRefreshKey + resyncKey}
          onItemClick={openEditModal}
        />
      )}

      <div className="flex gap-2 mb-4 items-center">
        <button
          onClick={() => setView("table")}
          className={`px-3 py-1 rounded text-sm ${view === "table" ? "bg-blue-600" : "bg-gray-700"}`}
        >
          Table
        </button>
        <button
          onClick={() => setView("board")}
          className={`px-3 py-1 rounded text-sm ${view === "board" ? "bg-blue-600" : "bg-gray-700"}`}
        >
          Board
        </button>
        <button
          onClick={() => setActivityOpen((o) => !o)}
          className={`ml-auto px-3 py-1 rounded text-sm ${activityOpen ? "bg-blue-600" : "bg-gray-700"}`}
        >
          Activity
        </button>
      </div>

      {activityOpen && workspace && (
        <ActivityFeed
          key={workspace.id}
          workspaceId={workspace.id}
          refreshKey={resyncKey}
        />
      )}

      {view === "table" && (
        <>
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            <input
              placeholder="Search by company..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              className="bg-gray-800 p-2 rounded flex-1 min-w-50"
            />

            <select
              value={filters.status ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  status: (e.target.value || undefined) as any,
                  page: 1,
                }))
              }
              className="bg-gray-800 p-2 rounded"
            >
              <option value="">All statuses</option>
              <option value="APPLIED">Applied</option>
              <option value="OA">OA</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OFFER">Offer</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold ml-auto"
            >
              + New Application
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-700 text-gray-300 text-sm">
                <tr>
                  <th className="p-3">Company</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Platform</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Applied</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-400">
                      No applications yet. Add your first one.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app._id} className="border-t border-gray-700">
                      <td className="p-3 font-medium">{app.company}</td>
                      <td className="p-3 text-gray-300">{app.role}</td>
                      <td className="p-3 text-gray-400 text-sm">
                        {app.platform.replace("_", " ")}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="p-3 text-gray-400 text-sm">
                        {formatDateOnly(app.appliedDate)}
                      </td>
                      <td className="p-3 space-x-2">
                        <button
                          onClick={() => openEditModal(app)}
                          className="text-blue-400 hover:underline text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(app._id)}
                          className="text-red-400 hover:underline text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && (
            <Pagination
              pagination={pagination}
              onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
            />
          )}
        </>
      )}

      {view === "board" && workspace && (
        <KanbanBoard
          key={workspace.id}
          workspaceId={workspace.id}
          onCardClick={openEditModal}
          refreshKey={boardRefreshKey + resyncKey}
          onStatusUpdated={refreshAllData}
        />
      )}

      <ApplicationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingApp}
        workspaceId={workspace?.id ?? ""}
      />
    </div>
  );
}
