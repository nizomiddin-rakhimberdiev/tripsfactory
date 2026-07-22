import { Link } from "@/i18n/navigation";

/**
 * A listing with no results is still a moment in the journey, not a dead end.
 * Give it the same card treatment as real content and always offer a way on.
 */
export function EmptyState({
  message,
  actionHref,
  actionLabel,
}: {
  message: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="tf-card mt-14 px-6 py-16 text-center">
      <p className="tf-headline mx-auto max-w-md text-2xl">{message}</p>
      <Link href={actionHref} className="tf-btn tf-btn-ghost mt-7">
        {actionLabel}
      </Link>
    </div>
  );
}
