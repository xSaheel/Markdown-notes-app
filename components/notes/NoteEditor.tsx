"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { updateNote } from "@/actions/notes";
import { DeleteNoteButton } from "./DeleteNoteButton";

interface NoteEditorProps {
  noteId: string;
  initialTitle: string;
  initialContent: string;
}

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function NoteEditor({
  noteId,
  initialTitle,
  initialContent,
}: NoteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const isFirstRender = useRef(true);

  const debouncedTitle = useDebounce(title, 800);
  const debouncedContent = useDebounce(content, 800);

  const save = useCallback(
    async (t: string, c: string) => {
      setSaveStatus("saving");
      const result = await updateNote(noteId, { title: t, content: c });
      setSaveStatus(result.success ? "saved" : "error");
    },
    [noteId]
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    save(debouncedTitle, debouncedContent);
  }, [debouncedTitle, debouncedContent, save]);

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    setSaveStatus("unsaved");
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    setSaveStatus("unsaved");
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
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Back to dashboard"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <span className={`text-xs font-medium ${statusColor[saveStatus]}`}>
            {statusLabel[saveStatus]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab toggle for mobile */}
          <div className="flex rounded-md border border-gray-200 text-sm md:hidden">
            <button
              onClick={() => setActiveTab("write")}
              className={`px-3 py-1.5 rounded-l-md ${
                activeTab === "write"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Write
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 rounded-r-md ${
                activeTab === "preview"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              Preview
            </button>
          </div>

          <DeleteNoteButton noteId={noteId} />
        </div>
      </header>

      {/* Title */}
      <div className="border-b border-gray-100 px-6 py-4">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="w-full text-2xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none"
        />
      </div>

      {/* Editor area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor pane */}
        <div
          className={`flex flex-col ${
            activeTab === "preview" ? "hidden" : "flex"
          } md:flex w-full md:w-1/2 md:border-r md:border-gray-100`}
        >
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing in Markdown…&#10;&#10;# Heading&#10;**bold**, *italic*, `code`&#10;&#10;- List item"
            className="flex-1 resize-none px-6 py-4 font-mono text-sm text-gray-800 placeholder-gray-300 focus:outline-none"
            spellCheck={false}
          />
        </div>

        {/* Preview pane */}
        <div
          className={`${
            activeTab === "write" ? "hidden" : "block"
          } md:block w-full md:w-1/2 overflow-y-auto px-6 py-4`}
        >
          {content ? (
            <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-a:text-indigo-600">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              Preview will appear here as you write…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
