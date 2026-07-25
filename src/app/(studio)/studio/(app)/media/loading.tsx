import { SkeletonPageHead, SkeletonTable, LoadingAnnounce } from "@/components/studio/Skeleton";

export default function Loading() {
  return (
    <>
      <LoadingAnnounce label="Rasmlar yuklanmoqda" />
      <SkeletonPageHead />
      <SkeletonTable rows={6} cols={4} />
    </>
  );
}
