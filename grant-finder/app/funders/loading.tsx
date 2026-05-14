import { Skeleton } from '@/components/ui/skeleton'

export default function FundersLoading() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-8 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-lg" />)}
      </div>
    </div>
  )
}
