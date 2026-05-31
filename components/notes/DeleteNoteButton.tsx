"use client";

import { useTransition } from "react";
import { deleteNote } from "@/actions/notes";
import { Button } from "@/components/ui/Button";

export function DeleteNoteButton({ noteId }: { noteId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this note? This cannot be undone.")) return;
    startTransition(() => deleteNote(noteId));
  }

  return (
    <Button
      variant="danger"
      size="sm"
      loading={isPending}
      onClick={handleDelete}
    >
      Delete
    </Button>
  );
}
