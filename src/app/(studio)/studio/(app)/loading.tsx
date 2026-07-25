import { SkeletonPageHead, SkeletonStats, LoadingAnnounce } from "@/components/studio/Skeleton";

export default function Loading() {
  return (
    <>
      <LoadingAnnounce label="Boshqaruv paneli yuklanmoqda" />
      <SkeletonPageHead />
      <SkeletonStats />
    </>
  );
}
