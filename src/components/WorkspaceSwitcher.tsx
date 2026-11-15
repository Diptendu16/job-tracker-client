import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function WorkspaceSwitcher() {
  const { workspace, workspaces, switchWorkspace } = useAuth();
  const [open, setOpen] = useState(false);

  if (!workspace) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-sm flex items-center gap-2"
      >
        {workspace.name}
        <span className="text-gray-400">▾</span>
      </button>

      {open && (
        <div className="absolute mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg w-56 z-50">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => {
                switchWorkspace(ws.id);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${
                ws.id === workspace.id ? "text-blue-400" : "text-white"
              }`}
            >
              {ws.name}
              <span className="text-gray-500 text-xs block">
                {ws.role}
                {ws.isPersonal ? " · Personal" : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
