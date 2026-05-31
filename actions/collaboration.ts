"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

export type CollabResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Access helpers ──────────────────────────────────────────────────────────

async function requireNoteAccess(noteId: string, userId: string) {
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
  const permission = isOwner ? "EDIT" : (note.collaborators[0]?.permission ?? "VIEW");
  return { note, isOwner, permission } as const;
}

// ─── Invite ──────────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  email: z.email(),
  permission: z.enum(["VIEW", "EDIT"]),
});

export async function inviteCollaborator(
  noteId: string,
  formData: FormData
): Promise<CollabResult<{ id: string; name: string | null; email: string; permission: string }>> {
  const { userId } = await verifySession();

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    permission: formData.get("permission"),
  });
  if (!parsed.success) return { success: false, error: "Invalid input." };

  const access = await requireNoteAccess(noteId, userId);
  if (!access?.isOwner) return { success: false, error: "Only the owner can invite collaborators." };

  const { email, permission } = parsed.data;

  if (access.note.userId === userId) {
    const ownerEmail = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (ownerEmail?.email === email) return { success: false, error: "You already own this note." };
  }

  const invitee = await db.user.findUnique({ where: { email }, select: { id: true, name: true, email: true } });
  if (!invitee) return { success: false, error: "No account found with that email." };

  await db.noteCollaborator.upsert({
    where: { noteId_userId: { noteId, userId: invitee.id } },
    create: { noteId, userId: invitee.id, permission },
    update: { permission },
  });

  revalidatePath(`/notes/${noteId}`);
  revalidatePath("/dashboard");

  return { success: true, data: { ...invitee, permission } };
}

// ─── Remove collaborator ──────────────────────────────────────────────────────

export async function removeCollaborator(
  noteId: string,
  collaboratorUserId: string
): Promise<CollabResult> {
  const { userId } = await verifySession();

  const access = await requireNoteAccess(noteId, userId);
  if (!access) return { success: false, error: "Note not found." };

  const isSelf = collaboratorUserId === userId;
  if (!access.isOwner && !isSelf) {
    return { success: false, error: "Not authorised." };
  }

  await db.noteCollaborator.deleteMany({
    where: { noteId, userId: collaboratorUserId },
  });

  revalidatePath(`/notes/${noteId}`);
  revalidatePath("/dashboard");

  return { success: true, data: undefined };
}

// ─── Update permission ────────────────────────────────────────────────────────

export async function updateCollaboratorPermission(
  noteId: string,
  collaboratorUserId: string,
  permission: "VIEW" | "EDIT"
): Promise<CollabResult> {
  const { userId } = await verifySession();

  const access = await requireNoteAccess(noteId, userId);
  if (!access?.isOwner) return { success: false, error: "Only the owner can change permissions." };

  await db.noteCollaborator.updateMany({
    where: { noteId, userId: collaboratorUserId },
    data: { permission },
  });

  revalidatePath(`/notes/${noteId}`);
  return { success: true, data: undefined };
}

// ─── Share link ───────────────────────────────────────────────────────────────

export async function generateShareLink(noteId: string): Promise<CollabResult<string>> {
  const { userId } = await verifySession();

  const note = await db.note.findUnique({ where: { id: noteId } });
  if (!note || note.userId !== userId) {
    return { success: false, error: "Only the owner can create share links." };
  }

  const token = crypto.randomUUID();
  await db.note.update({ where: { id: noteId }, data: { shareToken: token } });

  revalidatePath(`/notes/${noteId}`);
  return { success: true, data: token };
}

export async function revokeShareLink(noteId: string): Promise<CollabResult> {
  const { userId } = await verifySession();

  const note = await db.note.findUnique({ where: { id: noteId } });
  if (!note || note.userId !== userId) {
    return { success: false, error: "Only the owner can revoke share links." };
  }

  await db.note.update({ where: { id: noteId }, data: { shareToken: null } });

  revalidatePath(`/notes/${noteId}`);
  return { success: true, data: undefined };
}

// ─── Collaborators list ───────────────────────────────────────────────────────

export async function getCollaborators(noteId: string) {
  const { userId } = await verifySession();

  const access = await requireNoteAccess(noteId, userId);
  if (!access) return null;

  return db.noteCollaborator.findMany({
    where: { noteId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
}

// ─── Presence ─────────────────────────────────────────────────────────────────

export async function pingPresence(noteId: string): Promise<void> {
  const { userId } = await verifySession();

  const access = await requireNoteAccess(noteId, userId);
  if (!access) return;

  await db.notePresence.upsert({
    where: { noteId_userId: { noteId, userId } },
    create: { noteId, userId },
    update: {},
  });
}
