import { useState, useEffect } from "react";
import { type NeedsAttentionItem } from "../types/application";
import * as applicationApi from "../api/applicationApi";

interface Props {
  workspaceId: string;
  refreshKey: number;
  onItemClick: (item: NeedsAttentionItem["application"]) => void;
}

const reasonStyles: Record<string, string> = {
  "Deadline passed": "bg-red-500/20 text-red-300",
  "Deadline soon": "bg-orange-500/20 text-orange-300",
  "Follow-up due": "bg-yellow-500/20 text-yellow-300",
  "Stale (no activity)": "bg-gray-500/20 text-gray-300",
};

export function NeedsAttentionPanel({
  workspaceId,
  refreshKey,
  onItemClick,
}: Props) {
  const [items, setItems] = useState<NeedsAttentionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    load();
  }, [workspaceId, refreshKey]);

  async function load() {
    setLoading(true);
    try {
      const data = await applicationApi.fetchNeedsAttention(workspaceId);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  if (loading || items.length === 0) return null; 

  const visibleItems = expanded ? items : items.slice(0, 3);

  return (
    <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-yellow-300">
          ⚠ {items.length} application{items.length > 1 ? "s" : ""} need
          attention
        </h2>
        {items.length > 3 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-sm text-yellow-400 hover:underline"
          >
            {expanded ? "Show less" : `Show all ${items.length}`}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {visibleItems.map(({ application, reasons }) => (
          <div
            key={application._id}
            onClick={() => onItemClick(application)}
            className="bg-gray-800 rounded p-3 cursor-pointer hover:bg-gray-700 flex justify-between items-center"
          >
            <div>
              <p className="font-medium text-white text-sm">
                {application.company} — {application.role}
              </p>
              <div className="flex gap-2 mt-1">
                {reasons.map((reason) => (
                  <span
                    key={reason}
                    className={`text-xs px-2 py-0.5 rounded ${reasonStyles[reason] ?? "bg-gray-600 text-gray-300"}`}
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
