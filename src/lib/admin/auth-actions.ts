"use server";

import { redirect } from "next/navigation";
import { createAdminSession, destroyAdminSession, verifyAdminPassword } from "@/lib/admin/auth";

export async function loginAction(formData: FormData): Promise<void> {
  const password = String(formData.get("password") ?? "");
  if (!verifyAdminPassword(password)) {
    redirect("/admin/login?error=1");
  }
  await createAdminSession();
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}
