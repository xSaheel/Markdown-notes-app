import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getNote } from "@/actions/notes";
import { getCollaborators } from "@/actions/collaboration";
import { NoteEditor } from "@/components/notes/NoteEditor";

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? "";

  const [note, collaborators] = await Promise.all([
    getNote(id),
    getCollaborators(id),
  ]);

  if (!note) notFound();

  return (
    <NoteEditor
      noteId={note.id}
      initialTitle={note.title}
      initialContent={note.content}
      initialUpdatedAt={note.updatedAt.toISOString()}
      isOwner={note.isOwner}
      canEdit={note.canEdit}
      currentUserId={userId}
      initialCollaborators={collaborators ?? []}
      initialShareToken={note.shareToken ?? null}
    />
  );
}
