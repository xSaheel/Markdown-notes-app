"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { updateNote } from "@/actions/notes";
import { pingPresence } from "@/actions/collaboration";
import { DeleteNoteButton } from "./DeleteNoteButton";
import { CollaboratorAvatars } from "./CollaboratorAvatars";
import { ShareModal } from "./ShareModal";

interface Collaborator {
  id: string;
  userId: string;
  permission: string;
  user: { id: string; name: string | null; email: string };
}

interface Presence {
  user: { id: string; name: string | null; email: string };
}

interface NoteEditorProps {
  noteId: string;
  initialTitle: string;
  initialContent: string;
  initialUpdatedAt: string;
  isOwner: boolean;
  canEdit: boolean;
  currentUserId: string;
  initialCollaborators: Collaborator[];
  initialShareToken: string | null;
}

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function NoteEditor({
  noteId,
  initialTitle,
  initialContent,
  initialUpdatedAt,
  isOwner,
  canEdit,
  currentUserId,
  initialCollaborators,
  initialShareToken,
}: NoteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [showShare, setShowShare] = useState(false);
  const [presence, setPresence] = useState<Presence[]>([]);
  const [staleContent, setStaleContent] = useState<{
    title: string;
    content: string;
  } | null>(null);

  const lastSyncedAt = useRef(new Date(initialUpdatedAt));
  const isFirstRender = useRef(true);
  const saveStatusRef = useRef<SaveStatus>("saved");

  const debouncedTitle = useDebounce(title, 800);
  const debouncedContent = useDebounce(content, 800);

  // Keep saveStatusRef in sync so the polling closure can read it
  useEffect(() => {
    saveStatusRef.current = saveStatus;
  }, [saveStatus]);

  // Autosave
  const save = useCallback(
    async (t: string, c: string) => {
      setSaveStatus("saving");
      const result = await updateNote(noteId, { title: t, content: c });
      if (result.success) {
        lastSyncedAt.current = new Date();
        setSaveStatus("saved");
      } else {
        setSaveStatus("error");
      }
    },
    [noteId]
  );

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (canEdit) save(debouncedTitle, debouncedContent);
  }, [debouncedTitle, debouncedContent, save, canEdit]);

  // Presence ping every 30s
  useEffect(() => {
    pingPresence(noteId);
    const t = setInterval(() => pingPresence(noteId), 30_000);
    return () => clearInterval(t);
  }, [noteId]);

  // Polling: sync note + presence every 5s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/notes/${noteId}/sync`);
        if (!res.ok) return;
        const { note, presence: p } = await res.json();

        setPresence(p ?? []);

        const remoteUpdatedAt = new Date(note.updatedAt);
        if (remoteUpdatedAt <= lastSyncedAt.current) return;

        // Someone else edited
        if (saveStatusRef.current === "saved") {
          // Safe to auto-merge — no local unsaved changes
          setTitle(note.title);
          setContent(note.content);
          lastSyncedAt.current = remoteUpdatedAt;
          setStaleContent(null);
        } else {
          // We have unsaved changes — surface a banner instead
          setStaleContent({ title: note.title, content: note.content });
        }
      } catch {
        // ignore network errors silently
      }
    };

    const interval = setInterval(poll, 5_000);
    return () => clearInterval(interval);
  }, [noteId]);

  function applyRemote() {
    if (!staleContent) return;
    setTitle(staleContent.title);
    setContent(staleContent.content);
    lastSyncedAt.current = new Date();
    setSaveStatus("saved");
    setStaleContent(null);
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    setSaveStatus("unsaved");
    setStaleContent(null);
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    setSaveStatus("unsaved");
    setStaleContent(null);
  }

  const statusLabel: Record<SaveStatus, string> = {
    saved: "All changes saved",
    saving: "Saving…",
    unsaved: "Unsaved changes",
    error: "Failed to save",
  };
  const statusColor: Record<SaveStatus, string> = {
    saved: "text-green-600",
    saving: "text-gray-500",
    unsaved: "text-amber-500",
    error: "text-red-600",
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Stale banner */}
      {staleContent && (
        <div className="flex items-center justify-between bg-amber-50 px-4 py-2 text-sm text-amber-800 border-b border-amber-200">
          <span>Someone else edited this note.</span>
          <div className="flex gap-3">
            <button
              onClick={applyRemote}
              className="font-medium underline hover:no-underline"
            >
              Load their version
            </button>
            <button
              onClick={() => setStaleContent(null)}
              className="text-amber-600 hover:text-amber-800"
            >
              Keep mine
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Back"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          {canEdit && (
            <span className={`text-xs font-medium ${statusColor[saveStatus]}`}>
              {statusLabel[saveStatus]}
            </span>
          )}
          {!canEdit && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
              View only
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <CollaboratorAvatars presence={presence} currentUserId={currentUserId} />

          {/* Tab toggle (mobile) */}
          <div className="flex rounded-md border border-gray-200 text-sm md:hidden">
            <button
              onClick={() => setActiveTab("write")}
              className={`px-3 py-1.5 rounded-l-md ${activeTab === "write" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Write
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 rounded-r-md ${activeTab === "preview" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Preview
            </button>
          </div>

          {/* Share button */}
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Share
          </button>

          {isOwner && <DeleteNoteButton noteId={noteId} />}
        </div>
      </header>

      {/* Title */}
      <div className="border-b border-gray-100 px-6 py-4">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          readOnly={!canEdit}
          className="w-full text-2xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none disabled:cursor-default"
        />
      </div>

      {/* Editor area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Write pane */}
        <div
          className={`flex flex-col ${activeTab === "preview" ? "hidden" : "flex"} md:flex w-full md:w-1/2 md:border-r md:border-gray-100`}
        >
          <textarea
            value={content}
            onChange={handleContentChange}
            readOnly={!canEdit}
            placeholder={canEdit ? "Start writing in Markdown…\n\n# Heading\n**bold**, *italic*, `code`\n\n- List item" : ""}
            className="flex-1 resize-none px-6 py-4 font-mono text-sm text-gray-800 placeholder-gray-300 focus:outline-none"
            spellCheck={false}
          />
        </div>

        {/* Preview pane */}
        <div
          className={`${activeTab === "write" ? "hidden" : "block"} md:block w-full md:w-1/2 overflow-y-auto px-6 py-4`}
        >
          {content ? (
            <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-a:text-indigo-600">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Preview will appear here as you write…</p>
          )}
        </div>
      </div>

      {/* Share modal */}
      {showShare && (
        <ShareModal
          noteId={noteId}
          isOwner={isOwner}
          initialCollaborators={initialCollaborators}
          initialShareToken={initialShareToken}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
