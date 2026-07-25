import { SkeletonPageHead, SkeletonTable, LoadingAnnounce } from "@/components/studio/Skeleton";

export default function Loading() {
  return (
    <>
      <LoadingAnnounce label="Davlatlar yuklanmoqda" />
      <SkeletonPageHead />
      <SkeletonTable rows={5} cols={4} />
    </>
  );
}
