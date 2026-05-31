"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthFormState } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signup,
    undefined
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        id="name"
        name="name"
        label="Name"
        placeholder="Your name"
        autoComplete="name"
        error={state?.errors?.name?.[0]}
        disabled={pending}
      />

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
        placeholder="Min. 8 characters"
        autoComplete="new-password"
        error={state?.errors?.password?.[0]}
        disabled={pending}
      />

      {state?.message && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.message}
        </p>
      )}

      <Button type="submit" loading={pending} size="lg" className="mt-2">
        Create account
      </Button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </p>
    </form>
  );
}
