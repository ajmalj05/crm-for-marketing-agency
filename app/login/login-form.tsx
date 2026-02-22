"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="login-btn min-h-[44px] h-11 w-full bg-gray-900 text-white hover:bg-gray-800 rounded-md font-medium disabled:opacity-70"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState<LoginState, FormData>(loginAction, null);

  return (
    <form action={formAction} className="login-form-spacing space-y-5">
      <div className="login-form-group space-y-2">
        <label htmlFor="username" className="text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          placeholder="Enter username"
          required
          className="login-input min-h-[44px] h-11 border border-gray-300 bg-white px-3 text-gray-900 rounded-md"
        />
      </div>
      <div className="login-form-group space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter password"
          required
          className="login-input min-h-[44px] h-11 border border-gray-300 bg-white px-3 text-gray-900 rounded-md"
        />
      </div>
      {state?.error && (
        <p className="login-error text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
