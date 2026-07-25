import { SkeletonPageHead, SkeletonTable, LoadingAnnounce } from "@/components/studio/Skeleton";

export default function Loading() {
  return (
    <>
      <LoadingAnnounce label="So'rovlar yuklanmoqda" />
      <SkeletonPageHead />
      <SkeletonTable rows={8} cols={5} />
    </>
  );
}
