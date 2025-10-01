"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface LoadMoreProps {
  onLoadMore: () => void
  isLoading: boolean
}

export function LoadMore({ onLoadMore, isLoading }: LoadMoreProps) {
  return (
    <div className="flex justify-center py-6">
      <Button
        onClick={onLoadMore}
        disabled={isLoading}
        variant="outline"
        size="lg"
        className="min-w-[200px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          "Load More Domains"
        )}
      </Button>
    </div>
  )
}