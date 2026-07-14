"use client";

import { useParams } from "next/navigation";
import { SplitFarmView } from "@/components/SplitFarmView";

export default function AssetDetailRoute() {
  const params = useParams<{ id: string }>();
  return <SplitFarmView initialAssetId={params.id} />;
}
