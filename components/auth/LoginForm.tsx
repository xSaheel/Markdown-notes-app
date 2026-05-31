"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthFormState } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    login,
    undefined
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        autoComplete="email"
        error={state?.errors?.email?.[0]}
        disabled={pending}
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="Password"
        placeholder="Your password"
        autoComplete="current-password"
        error={state?.errors?.password?.[0]}
        disabled={pending}
      />

      {state?.message && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.message}
        </p>
      )}

      <Button type="submit" loading={pending} size="lg" className="mt-2">
        Sign in
      </Button>

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
          Create one
        </Link>
      </p>
    </form>
  );
}
