"use client";

interface Presence {
  user: { id: string; name: string | null; email: string };
}

function initials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

function colorFor(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function CollaboratorAvatars({
  presence,
  currentUserId,
}: {
  presence: Presence[];
  currentUserId: string;
}) {
  const others = presence.filter((p) => p.user.id !== currentUserId);
  if (others.length === 0) return null;

  const visible = others.slice(0, 4);
  const overflow = others.length - visible.length;

  return (
    <div className="flex items-center gap-1" title="People viewing this note">
      <div className="flex -space-x-2">
        {visible.map(({ user }) => (
          <div
            key={user.id}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-white ${colorFor(user.id)}`}
            title={user.name ?? user.email}
          >
            {initials(user.name, user.email)}
          </div>
        ))}
        {overflow > 0 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600 ring-2 ring-white">
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}
