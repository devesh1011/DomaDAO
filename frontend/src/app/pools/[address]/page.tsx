"use client"

import { useParams } from "next/navigation"
import { PoolDetailView } from "@/components/pools/pool-detail-view"

export default function PoolDetailPage() {
  const params = useParams()
  const poolAddress = params.address as string

  return <PoolDetailView poolAddress={poolAddress} />
}
