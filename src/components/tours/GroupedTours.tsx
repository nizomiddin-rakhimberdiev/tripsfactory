import { Link } from "@/i18n/navigation";
import { TourCard } from "@/components/tours/TourCard";
import type { CountryGroup } from "@/lib/content/group-tours";

/**
 * The catalogue, read the way the operator sells it: destination, then type.
 *
 * A flat grid of seventy tours asks the visitor to do the sorting — they
 * arrive knowing where they want to go and whether they want their own guide
 * or a group, and a wall of cards answers neither question. Grouping puts both
 * answers in the headings.
 *
 * Rendered from `groupTours`, so the home page and the Journeys page cannot
 * fall out of agreement about what order things come in.
 */
export function GroupedTours({
  groups,
  typeLabels,
  /** Shown on a type row when it was capped — links to the full list. */
  moreLabel,
}: {
  groups: CountryGroup[];
  typeLabels: Record<string, string>;
  moreLabel?: string;
}) {
  return (
    <div className="space-y-20">
      {groups.map((group) => (
        <section key={group.countrySlug}>
          {/* The destination names the section; the type names the row. Two
              levels of heading rather than one so a screen reader can skip a
              country wholesale. */}
          <h2 className="tf-display tf-display-2 mb-10">{group.countryName}</h2>

          <div className="space-y-14">
            {group.types.map(({ type, tours }) => (
              <div key={type}>
                <div className="mb-6 flex items-end justify-between gap-6">
                  <h3 className="tf-eyebrow text-primary">
                    {typeLabels[type] ?? type}
                  </h3>
                  {moreLabel && (
                    <Link
                      href={
                        type === "group" || type === "private"
                          ? `/tours/${type}`
                          : "/tours"
                      }
                      className="tf-link shrink-0 text-sm"
                    >
                      {moreLabel}
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-3">
                  {tours.map((tour) => (
                    <TourCard key={tour.slug} tour={tour} headingLevel={4} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
