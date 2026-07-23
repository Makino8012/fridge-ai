import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton({ title }: { title: string }) {
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur md:px-8">
        <h1 className="text-lg font-semibold">{title}</h1>
        <Skeleton className="size-9 rounded-full" />
      </header>
      <div className="space-y-4 px-4 pt-2 md:px-0">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    </>
  );
}
