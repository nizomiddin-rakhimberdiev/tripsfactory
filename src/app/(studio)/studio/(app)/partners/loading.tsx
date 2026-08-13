import { SkeletonPageHead, SkeletonTable, LoadingAnnounce } from "@/components/studio/Skeleton";

export default function Loading() {
  return (
    <>
      <LoadingAnnounce label="Hamkorlar yuklanmoqda" />
      <SkeletonPageHead />
      <SkeletonTable rows={5} cols={8} />
    </>
  );
}
