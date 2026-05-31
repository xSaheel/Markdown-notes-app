import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const PRESENCE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: noteId } = await params;
  const userId = session.user.id;

  const note = await db.note.findFirst({
    where: {
      id: noteId,
      OR: [
        { userId },
        { collaborators: { some: { userId } } },
      ],
    },
    select: { id: true, title: true, content: true, updatedAt: true },
  });

  if (!note) return Response.json({ error: "Not found" }, { status: 404 });

  const since = new Date(Date.now() - PRESENCE_TTL_MS);
  const presence = await db.notePresence.findMany({
    where: { noteId, updatedAt: { gte: since } },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return Response.json({ note, presence });
}
