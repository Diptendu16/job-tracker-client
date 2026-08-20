import type { Pagination as PaginationType } from "../types/application";

interface Props {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: Props) {
  const { page, totalPages, total } = pagination;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 text-gray-400 text-sm">
      <span>{total} total applications</span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 rounded bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-600"
        >
          Previous
        </button>
        <span className="px-3 py-1">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 rounded bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-600"
        >
          Next
        </button>
      </div>
    </div>
  );
}
