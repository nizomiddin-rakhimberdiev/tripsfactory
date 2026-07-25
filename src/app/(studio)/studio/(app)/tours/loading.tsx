import { SkeletonPageHead, SkeletonTable, LoadingAnnounce } from "@/components/studio/Skeleton";

export default function Loading() {
  return (
    <>
      <LoadingAnnounce label="Turlar yuklanmoqda" />
      <SkeletonPageHead />
      <SkeletonTable rows={7} cols={6} />
    </>
  );
}
