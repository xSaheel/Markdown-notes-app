import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getNoteByShareToken } from "@/actions/notes";
import { formatDate } from "@/lib/utils";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const note = await getNoteByShareToken(token);

  if (!note) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header bar */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <span className="font-semibold text-gray-800">Markdown Notes</span>
        </div>
        <Link
          href="/login"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Sign in to take notes
        </Link>
      </div>

      {/* Note content */}
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <div className="mb-6 border-b border-gray-100 pb-5">
          <h1 className="text-3xl font-bold text-gray-900">{note.title || "Untitled"}</h1>
          <p className="mt-2 text-sm text-gray-500">
            By {note.user.name ?? "Unknown"} · Last updated {formatDate(note.updatedAt)}
          </p>
          <span className="mt-3 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
            View only
          </span>
        </div>

        {note.content ? (
          <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-a:text-indigo-600">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">This note has no content yet.</p>
        )}
      </div>
    </div>
  );
}
