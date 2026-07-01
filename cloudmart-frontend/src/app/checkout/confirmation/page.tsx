import Link from "next/link";
import Button from "@/components/ui/Button";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  return (
    <div className="flex flex-col items-center rounded-xl border border-neutral-800 bg-neutral-900 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
        <svg className="h-7 w-7 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="mt-5 text-2xl font-bold text-neutral-50">Order placed!</h1>
      <p className="mt-2 max-w-sm text-neutral-400">
        {orderId
          ? `Order #${orderId.substring(0, 8)}… is confirmed. You'll get real-time status updates as it moves.`
          : "Your order is confirmed. You'll get real-time status updates as it moves."}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {orderId && (
          <Button href={`/orders/${orderId}`} variant="secondary">
            View order
          </Button>
        )}
        <Button href="/products">Continue shopping</Button>
      </div>

      <Link href="/orders" className="mt-6 text-sm text-accent-400 hover:text-accent-300">
        Go to my orders →
      </Link>
    </div>
  );
}
