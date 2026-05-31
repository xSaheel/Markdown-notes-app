import type { Metadata } from "next";
import { getNotes } from "@/actions/notes";
import { NoteCard } from "@/components/notes/NoteCard";
import { CreateNoteButton } from "@/components/notes/CreateNoteButton";

export const metadata: Metadata = { title: "Dashboard — Markdown Notes" };

export default async function DashboardPage() {
  const notes = await getNotes();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Notes</h1>
          <p className="mt-1 text-sm text-gray-500">
            {notes.length === 0
              ? "No notes yet"
              : `${notes.length} note${notes.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <CreateNoteButton />
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50">
            <svg className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900">No notes yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first note to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              id={note.id}
              title={note.title}
              content={note.content}
              updatedAt={note.updatedAt}
              isOwner={note.isOwner}
            />
          ))}
        </div>
      )}
    </main>
  );
}
