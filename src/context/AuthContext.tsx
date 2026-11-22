import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import api from "../api/axios";
import * as workspaceApi from "../api/workspaceApi";
import type { WorkspaceSummary } from "../types/workspace";
import { connectSocket, disconnectSocket, getSocket } from "../socket/socket";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  workspace: WorkspaceSummary | null;
  workspaces: WorkspaceSummary[];
  loading: boolean;
  resyncKey: number;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => void;
  refreshWorkspaces: (activeId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  // Bumped after a reconnect + room re-join, so views know to refetch what they may have missed.
  const [resyncKey, setResyncKey] = useState(0);

  const currentRoomRef = useRef<string | null>(null);
  const hasConnectedRef = useRef(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Any request that comes back 401 mid-session fires this event (see api/axios.ts).
  // Clearing the user is enough: ProtectedRoute then redirects to /login on its own.
  useEffect(() => {
    const handleExpired = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("activeWorkspaceId");
      disconnectSocket();
      currentRoomRef.current = null;
      hasConnectedRef.current = false;
      setUser(null);
      setWorkspace(null);
      setWorkspaces([]);
    };

    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !workspace) return;

    const workspaceId = workspace.id;

    const joinRoom = (isReconnect: boolean) => {
      socket.emit(
        "workspace:join",
        workspaceId,
        (response: { success: boolean; message?: string }) => {
          if (!response.success) {
            console.error("Failed to join workspace room:", response.message);
            return;
          }
          currentRoomRef.current = workspaceId;
          // Only after the room is re-joined is it safe to refetch: nothing can slip through the gap.
          if (isReconnect) setResyncKey((k) => k + 1);
        },
      );
    };

    if (currentRoomRef.current && currentRoomRef.current !== workspaceId) {
      socket.emit("workspace:leave", currentRoomRef.current);
    }

    // Already connected: join now.
    if (socket.connected) {
      hasConnectedRef.current = true;
      joinRoom(false);
    }

    // "connect" fires on the first connection AND on every reconnect.
    // After a reconnect the server has forgotten our rooms, so we must join again.
    const onConnect = () => {
      const isReconnect = hasConnectedRef.current;
      hasConnectedRef.current = true;
      joinRoom(isReconnect);
    };
    socket.on("connect", onConnect);

    return () => {
      socket.off("connect", onConnect);
    };
  }, [workspace]);

  function pickActiveWorkspace(list: WorkspaceSummary[], preferredId?: string) {
    const savedId =
      preferredId ?? localStorage.getItem("activeWorkspaceId") ?? undefined;
    const preferred = savedId ? list.find((w) => w.id === savedId) : undefined;
    return preferred ?? list.find((w) => w.isPersonal) ?? list[0] ?? null;
  }

  async function loadWorkspaces(preferredId?: string) {
    const list = await workspaceApi.fetchMyWorkspaces();
    setWorkspaces(list);
    const active = pickActiveWorkspace(list, preferredId);
    setWorkspace(active);
    if (active) localStorage.setItem("activeWorkspaceId", active.id);
  }

  function initializeSocket() {
    const token = localStorage.getItem("token");
    if (token) connectSocket(token);
  }

  async function fetchCurrentUser() {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.data.user);
      initializeSocket();
      await loadWorkspaces();
    } catch {
      setUser(null);
      setWorkspace(null);
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.data.token);
    setUser(res.data.data.user);
    initializeSocket();
    await loadWorkspaces();
  }

  async function register(name: string, email: string, password: string) {
    const res = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("token", res.data.data.token);
    setUser(res.data.data.user);
    initializeSocket();
    await loadWorkspaces();
  }

  async function logout() {
    await api.post("/auth/logout");
    localStorage.removeItem("token");
    localStorage.removeItem("activeWorkspaceId");
    disconnectSocket();
    currentRoomRef.current = null;
    hasConnectedRef.current = false;
    setUser(null);
    setWorkspace(null);
    setWorkspaces([]);
  }

  function switchWorkspace(workspaceId: string) {
    const target = workspaces.find((w) => w.id === workspaceId);
    if (!target) return;
    setWorkspace(target);
    localStorage.setItem("activeWorkspaceId", target.id);
  }

  async function refreshWorkspaces(activeId?: string) {
    await loadWorkspaces(activeId);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        workspaces,
        loading,
        resyncKey,
        login,
        register,
        logout,
        switchWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
