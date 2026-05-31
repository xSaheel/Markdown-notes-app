"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

const noteSchema = z.object({
  title: z.string().min(1).max(255).default("Untitled"),
  content: z.string().default(""),
});

export type NoteActionResult =
  | { success: true; noteId: string }
  | { success: false; error: string };

export async function createNote(): Promise<void> {
  const { userId } = await verifySession();

  const note = await db.note.create({
    data: { userId, title: "Untitled", content: "" },
  });

  revalidatePath("/dashboard");
  redirect(`/notes/${note.id}`);
}

export async function updateNote(
  noteId: string,
  data: { title: string; content: string }
): Promise<NoteActionResult> {
  const { userId } = await verifySession();

  const result = noteSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: "Invalid note data." };
  }

  const note = await db.note.findUnique({ where: { id: noteId } });
  if (!note || note.userId !== userId) {
    return { success: false, error: "Note not found." };
  }

  await db.note.update({
    where: { id: noteId },
    data: { title: result.data.title, content: result.data.content },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/notes/${noteId}`);

  return { success: true, noteId };
}

export async function deleteNote(noteId: string): Promise<void> {
  const { userId } = await verifySession();

  const note = await db.note.findUnique({ where: { id: noteId } });
  if (!note || note.userId !== userId) return;

  await db.note.delete({ where: { id: noteId } });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function getNotes() {
  const { userId } = await verifySession();

  return db.note.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getNote(noteId: string) {
  const { userId } = await verifySession();

  const note = await db.note.findUnique({
    where: { id: noteId },
    select: {
      id: true,
      title: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
    },
  });

  if (!note || note.userId !== userId) return null;

  return note;
}
