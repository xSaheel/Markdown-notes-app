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

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getNoteAccess(noteId: string, userId: string) {
  const note = await db.note.findFirst({
    where: {
      id: noteId,
      OR: [
        { userId },
        { collaborators: { some: { userId } } },
      ],
    },
    include: {
      collaborators: { where: { userId }, select: { permission: true } },
    },
  });

  if (!note) return null;

  const isOwner = note.userId === userId;
  const canEdit = isOwner || note.collaborators[0]?.permission === "EDIT";
  return { note, isOwner, canEdit };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createNote(): Promise<void> {
  const { userId } = await verifySession();

  const note = await db.note.create({
    data: { userId, title: "Untitled", content: "" },
  });

  revalidatePath("/dashboard");
  redirect(`/notes/${note.id}`);
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateNote(
  noteId: string,
  data: { title: string; content: string }
): Promise<NoteActionResult> {
  const { userId } = await verifySession();

  const result = noteSchema.safeParse(data);
  if (!result.success) return { success: false, error: "Invalid note data." };

  const access = await getNoteAccess(noteId, userId);
  if (!access?.canEdit) return { success: false, error: "No edit permission." };

  await db.note.update({
    where: { id: noteId },
    data: { title: result.data.title, content: result.data.content },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/notes/${noteId}`);

  return { success: true, noteId };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteNote(noteId: string): Promise<void> {
  const { userId } = await verifySession();

  const note = await db.note.findUnique({ where: { id: noteId } });
  if (!note || note.userId !== userId) return;

  await db.note.delete({ where: { id: noteId } });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getNotes() {
  const { userId } = await verifySession();

  const [owned, collaborated] = await Promise.all([
    db.note.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, content: true, createdAt: true, updatedAt: true },
    }),
    db.note.findMany({
      where: { collaborators: { some: { userId } } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, content: true, createdAt: true, updatedAt: true },
    }),
  ]);

  return [
    ...owned.map((n) => ({ ...n, isOwner: true })),
    ...collaborated.map((n) => ({ ...n, isOwner: false })),
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

// ─── Single note ──────────────────────────────────────────────────────────────

export async function getNote(noteId: string) {
  const { userId } = await verifySession();

  const access = await getNoteAccess(noteId, userId);
  if (!access) return null;

  const { note, isOwner, canEdit } = access;

  return {
    id: note.id,
    title: note.title,
    content: note.content,
    shareToken: note.shareToken,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    userId: note.userId,
    isOwner,
    canEdit,
  };
}

// ─── Public share note ────────────────────────────────────────────────────────

export async function getNoteByShareToken(token: string) {
  return db.note.findUnique({
    where: { shareToken: token },
    select: {
      id: true,
      title: true,
      content: true,
      updatedAt: true,
      user: { select: { name: true } },
    },
  });
}
