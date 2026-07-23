import { loginAction } from "@/lib/admin/auth-actions";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Admin sign in</h1>
      <form action={loginAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm text-ink-muted">
          Password
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="h-11 rounded-lg border border-border bg-surface px-3 text-ink transition-colors duration-200 ease-out focus:border-royal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-royal-100"
          />
        </label>
        {error && <p className="text-sm text-red-600">Incorrect password.</p>}
        <button
          type="submit"
          className="h-11 cursor-pointer rounded-lg bg-royal-700 px-4 text-sm font-medium text-white transition-colors duration-200 ease-out hover:bg-royal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
