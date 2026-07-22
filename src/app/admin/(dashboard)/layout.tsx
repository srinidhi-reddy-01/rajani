import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminSessionValid } from "@/lib/admin/auth";
import { logoutAction } from "@/lib/admin/auth-actions";

const navLinkClass =
  "rounded-sm text-royal-100 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminSessionValid())) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <header className="bg-royal-700">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-lg font-semibold text-white">Catering Admin</span>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin" className={navLinkClass}>
                Pipeline
              </Link>
              <Link href="/admin/enquiries" className={navLinkClass}>
                Enquiries
              </Link>
              <Link href="/admin/tasting" className={navLinkClass}>
                Tasting requests
              </Link>
              <Link href="/admin/match-requests" className={navLinkClass}>
                Match requests
              </Link>
            </nav>
          </div>
          <form action={logoutAction}>
            <button type="submit" className={`cursor-pointer text-sm ${navLinkClass}`}>
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
