import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent-400">404</p>
      <h1 className="mt-3 text-3xl font-bold text-neutral-50 sm:text-4xl">Page not found</h1>
      <p className="mt-3 max-w-sm text-neutral-400">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Button href="/">Back home</Button>
        <Button href="/products" variant="secondary">
          Browse catalog
        </Button>
      </div>
    </main>
  );
}
