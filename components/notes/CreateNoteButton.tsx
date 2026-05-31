"use client";

import { useTransition } from "react";
import { createNote } from "@/actions/notes";
import { Button } from "@/components/ui/Button";

export function CreateNoteButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      loading={isPending}
      onClick={() => startTransition(() => createNote())}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      New note
    </Button>
  );
}
