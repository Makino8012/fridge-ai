import { ThemeToggle } from '@/components/layout/theme-toggle';

export function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/50 bg-background/80 px-4 py-3.5 backdrop-blur-xl md:px-8">
      <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      <ThemeToggle />
    </header>
  );
}
