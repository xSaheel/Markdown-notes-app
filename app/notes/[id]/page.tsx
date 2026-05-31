import { notFound } from "next/navigation";
import { getNote } from "@/actions/notes";
import { NoteEditor } from "@/components/notes/NoteEditor";

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await getNote(id);

  if (!note) notFound();

  return (
    <NoteEditor
      noteId={note.id}
      initialTitle={note.title}
      initialContent={note.content}
    />
  );
}
