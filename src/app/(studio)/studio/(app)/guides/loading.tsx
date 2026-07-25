import { SkeletonPageHead, SkeletonTable, LoadingAnnounce } from "@/components/studio/Skeleton";

export default function Loading() {
  return (
    <>
      <LoadingAnnounce label="Qo'llanmalar yuklanmoqda" />
      <SkeletonPageHead />
      <SkeletonTable rows={4} cols={3} />
    </>
  );
}
