import { AlertCircle } from 'lucide-react';
import { Media27Logo } from '@/components/27MediaLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex gap-2 items-start rounded-field bg-negative-500/12 px-3.5 py-3 text-[13px] font-semibold text-negative-400">
      <AlertCircle className="w-4 h-4 mt-px flex-none" />
      <span>{children}</span>
    </p>
  );
}

export function AuthFrame({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col px-4 sm:px-6 py-5">
      <header className="flex items-center justify-between">
        <Media27Logo size="sm" showSubtitle={false} />
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-[400px]">
          <h1 className="text-display">{title}</h1>
          <p className="text-caption mt-2 mb-6">{description}</p>
          <div className="card p-6">{children}</div>
        </div>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-faint">
        <span>© {new Date().getFullYear()} 27 Media Agency</span>
        <a href="https://www.27mediaagency.com" target="_blank" rel="noreferrer" className="hover:text-fg">
          27mediaagency.com
        </a>
      </footer>
    </div>
  );
}
