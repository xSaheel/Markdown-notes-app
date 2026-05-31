"use client";

import { useTransition } from "react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      loading={isPending}
      onClick={() => startTransition(() => logout())}
    >
      Sign out
    </Button>
  );
}
