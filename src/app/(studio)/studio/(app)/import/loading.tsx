import { SkeletonPageHead, LoadingAnnounce } from "@/components/studio/Skeleton";

export default function Loading() {
  return (
    <>
      <LoadingAnnounce label="Import sahifasi yuklanmoqda" />
      <SkeletonPageHead />
    </>
  );
}
