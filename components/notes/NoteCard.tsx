import Link from "next/link";
import { formatRelativeDate, truncate } from "@/lib/utils";

interface NoteCardProps {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
  isOwner: boolean;
}

export function NoteCard({ id, title, content, updatedAt, isOwner }: NoteCardProps) {
  const preview = content
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*|__|\*|_|`|~~|>/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();

  return (
    <Link
      href={`/notes/${id}`}
      className="group flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 font-semibold text-gray-900 group-hover:text-indigo-600">
          {title || "Untitled"}
        </h3>
        {!isOwner && (
          <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
            Shared
          </span>
        )}
      </div>
      <p className="line-clamp-3 flex-1 text-sm text-gray-500">
        {truncate(preview || "No content yet…", 150)}
      </p>
      <p className="mt-1 text-xs text-gray-400">{formatRelativeDate(updatedAt)}</p>
    </Link>
  );
}
