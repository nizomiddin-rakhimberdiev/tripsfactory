/**
 * Where a tour is edited.
 *
 * The type is in the path — /studio/tours/group/4 — because a tour operator
 * thinks in group and private before they think in records, and a URL that
 * says which is being edited is worth more than a shorter one. The id still
 * identifies the tour; the type is a label the route validates and corrects.
 */
export const TOUR_TYPES = ["group", "private", "custom"] as const;
export type TourPathType = (typeof TOUR_TYPES)[number];

export function isTourType(value: string): value is TourPathType {
  return (TOUR_TYPES as readonly string[]).includes(value);
}

export function tourEditPath(type: string | null | undefined, id: number) {
  // An unknown type still has to lead somewhere; "group" is the default a new
  // tour is created with, and the page corrects the URL when it loads.
  const safe = type && isTourType(type) ? type : "group";
  return `/studio/tours/${safe}/${id}`;
}
