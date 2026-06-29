import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <span className="text-lg font-bold bg-gradient-to-r from-accent-400 to-accent2-400 bg-clip-text text-transparent">
              Dokkan
            </span>
            <p className="mt-2 max-w-xs text-sm text-neutral-400">
              A real-time electronics marketplace with live order tracking,
              built on NestJS microservices.
            </p>
          </div>

          <div className="flex gap-10">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-neutral-200">Shop</h3>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>
                  <Link href="/products" className="hover:text-neutral-100">
                    Catalog
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className="hover:text-neutral-100">
                    My Orders
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-neutral-200">Account</h3>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>
                  <Link href="/login" className="hover:text-neutral-100">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-800 pt-6 text-xs text-neutral-500">
          © {new Date().getFullYear()} Dokkan Electronics. All product imagery is placeholder content.
        </div>
      </div>
    </footer>
  );
}
