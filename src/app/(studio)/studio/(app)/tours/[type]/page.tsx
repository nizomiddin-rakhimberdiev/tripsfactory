import { notFound, redirect } from "next/navigation";
import { getPayloadClient } from "@/lib/studio/auth";
import { isTourType, tourEditPath } from "@/lib/studio/tour-path";

export const dynamic = "force-dynamic";

/**
 * One segment after /studio/tours, which is either of two things.
 *
 * A number is an old link — /studio/tours/4, the shape every tour had before
 * the type moved into the path, and what the Payload admin's preview and any
 * bookmark still point at. It is looked up and sent to its typed home rather
 * than 404ing.
 *
 * A type — group, private, custom — is somebody reaching for "show me the
 * group tours", so it becomes the list with that filter applied. The filter
 * lives in the query string, which is the one place a filtered view can be
 * bookmarked and shared.
 */
export default async function TourTypeSegment({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  if (isTourType(type)) redirect(`/studio/tours?type=${type}`);

  const id = Number(type);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const payload = await getPayloadClient();
  const tour = await payload
    .findByID({ collection: "tours", id, depth: 0, locale: "en" })
    .catch(() => null);
  if (!tour) notFound();

  redirect(tourEditPath(tour.type, tour.id));
}
