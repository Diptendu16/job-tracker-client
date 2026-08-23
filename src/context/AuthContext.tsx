import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import api from "../api/axios";
interface User {
  id: string;
  name: string;
  email: string;
}
interface Workspace {
  id: string;
  name: string;
}
interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  async function fetchCurrentUser() {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.data.user);
      setWorkspace(mapWorkspace(res.data.data.workspace));
    } catch {
      setUser(null);
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  }

  function mapWorkspace(ws: any): Workspace | null {
    if (!ws) return null;
    return { id: ws.id, name: ws.name };
  }

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.data.token);
    setUser(res.data.data.user);
    setWorkspace(mapWorkspace(res.data.data.workspace));
  }

  async function register(name: string, email: string, password: string) {
    const res = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("token", res.data.data.token);
    setUser(res.data.data.user);
    setWorkspace(mapWorkspace(res.data.data.workspace));
  }

  async function logout() {
    await api.post("/auth/logout");
    localStorage.removeItem("token");
    setUser(null);
    setWorkspace(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, workspace, loading, login, register, logout }}
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
