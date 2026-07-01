'use client';

import { usePathname } from 'next/navigation';

const STEPS = [
  { key: 'shipping', label: 'Shipping' },
  { key: 'payment', label: 'Payment' },
  { key: 'review', label: 'Review' },
  { key: 'confirmation', label: 'Done' },
] as const;

export default function CheckoutSteps() {
  const pathname = usePathname();
  const currentIndex = STEPS.findIndex((s) => pathname?.includes(s.key));

  return (
    <ol className="mb-10 flex items-center" aria-label="Checkout progress">
      {STEPS.map((step, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <li key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                aria-current={isCurrent ? 'step' : undefined}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  isComplete
                    ? 'bg-accent-500 text-white'
                    : isCurrent
                      ? 'bg-accent-500/15 text-accent-300 border border-accent-500/40'
                      : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                }`}
              >
                {isComplete ? '✓' : i + 1}
              </span>
              <span
                className={`text-sm font-medium ${
                  isCurrent ? 'text-neutral-50' : isComplete ? 'text-neutral-300' : 'text-neutral-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-3 h-px flex-1 ${isComplete ? 'bg-accent-500' : 'bg-neutral-800'}`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
