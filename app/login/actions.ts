"use server";

import { redirect } from "next/navigation";
import { verifyCredentials, setSession } from "@/lib/auth";

export type LoginState = { error: string } | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Please enter username and password." };
  }

  if (!verifyCredentials(username, password)) {
    return { error: "Invalid username or password." };
  }

  await setSession();
  redirect("/");
}
