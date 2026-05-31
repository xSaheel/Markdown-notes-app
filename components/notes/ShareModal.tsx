"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  inviteCollaborator,
  removeCollaborator,
  updateCollaboratorPermission,
  generateShareLink,
  revokeShareLink,
} from "@/actions/collaboration";
import { Button } from "@/components/ui/Button";

interface Collaborator {
  id: string;
  userId: string;
  permission: string;
  user: { id: string; name: string | null; email: string };
}

interface ShareModalProps {
  noteId: string;
  isOwner: boolean;
  initialCollaborators: Collaborator[];
  initialShareToken: string | null;
  onClose: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="shrink-0 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function ShareModal({
  noteId,
  isOwner,
  initialCollaborators,
  initialShareToken,
  onClose,
}: ShareModalProps) {
  const [collaborators, setCollaborators] = useState(initialCollaborators);
  const [shareToken, setShareToken] = useState(initialShareToken);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleInvite(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await inviteCollaborator(noteId, formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setCollaborators((prev) => {
        const existing = prev.findIndex((c) => c.userId === result.data.id);
        const updated = {
          id: `${noteId}-${result.data.id}`,
          userId: result.data.id,
          permission: result.data.permission,
          user: { id: result.data.id, name: result.data.name, email: result.data.email },
        };
        if (existing >= 0) {
          return prev.map((c, i) => (i === existing ? updated : c));
        }
        return [...prev, updated];
      });
      formRef.current?.reset();
    });
  }

  function handleRemove(collaboratorUserId: string) {
    startTransition(async () => {
      await removeCollaborator(noteId, collaboratorUserId);
      setCollaborators((prev) => prev.filter((c) => c.userId !== collaboratorUserId));
    });
  }

  function handlePermChange(collaboratorUserId: string, permission: "VIEW" | "EDIT") {
    startTransition(async () => {
      await updateCollaboratorPermission(noteId, collaboratorUserId, permission);
      setCollaborators((prev) =>
        prev.map((c) => (c.userId === collaboratorUserId ? { ...c, permission } : c))
      );
    });
  }

  function handleGenerateLink() {
    startTransition(async () => {
      const result = await generateShareLink(noteId);
      if (result.success) setShareToken(result.data);
    });
  }

  function handleRevokeLink() {
    startTransition(async () => {
      await revokeShareLink(noteId);
      setShareToken(null);
    });
  }

  const shareUrl = shareToken
    ? `${window.location.origin}/share/${shareToken}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Share note</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Invite form */}
        {isOwner && (
          <form ref={formRef} action={handleInvite} className="mb-5">
            <p className="mb-2 text-sm font-medium text-gray-700">Invite people</p>
            <div className="flex gap-2">
              <input
                name="email"
                type="email"
                required
                placeholder="colleague@example.com"
                className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <select
                name="permission"
                className="rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="EDIT">Can edit</option>
                <option value="VIEW">Can view</option>
              </select>
              <Button type="submit" size="sm" loading={isPending}>
                Add
              </Button>
            </div>
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
          </form>
        )}

        {/* People with access */}
        <div className="mb-5">
          <p className="mb-2 text-sm font-medium text-gray-700">People with access</p>
          <ul className="space-y-2">
            {collaborators.length === 0 && (
              <li className="text-sm text-gray-400">No collaborators yet.</li>
            )}
            {collaborators.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {c.user.name ?? c.user.email}
                  </p>
                  {c.user.name && (
                    <p className="truncate text-xs text-gray-500">{c.user.email}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {isOwner ? (
                    <>
                      <select
                        value={c.permission}
                        disabled={isPending}
                        onChange={(e) =>
                          handlePermChange(c.userId, e.target.value as "VIEW" | "EDIT")
                        }
                        className="rounded border border-gray-200 px-1.5 py-1 text-xs text-gray-600"
                      >
                        <option value="EDIT">Can edit</option>
                        <option value="VIEW">Can view</option>
                      </select>
                      <button
                        onClick={() => handleRemove(c.userId)}
                        disabled={isPending}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        title="Remove"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {c.permission === "EDIT" ? "Can edit" : "Can view"}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Share link */}
        {isOwner && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Share link</p>
            {shareUrl ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-xs text-gray-600">
                    {shareUrl}
                  </span>
                  <CopyButton text={shareUrl} />
                </div>
                <p className="text-xs text-gray-500">
                  Anyone with this link can <strong>view</strong> the note.
                </p>
                <button
                  onClick={handleRevokeLink}
                  disabled={isPending}
                  className="text-xs text-red-500 hover:underline"
                >
                  Disable link
                </button>
              </div>
            ) : (
              <div>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={isPending}
                  onClick={handleGenerateLink}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  Create share link
                </Button>
                <p className="mt-1.5 text-xs text-gray-500">
                  Creates a read-only link anyone can open without logging in.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
