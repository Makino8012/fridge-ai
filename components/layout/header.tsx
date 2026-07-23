import { ThemeToggle } from '@/components/layout/theme-toggle';

export function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-8">
      <h1 className="text-lg font-semibold">{title}</h1>
      <ThemeToggle />
    </header>
  );
}
