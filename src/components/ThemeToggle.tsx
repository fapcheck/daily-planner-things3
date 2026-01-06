import { useState, useEffect } from 'react';
import { Moon, Sun, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    
    // Start transition
    setIsTransitioning(true);
    
    // Add transition class to document
    document.documentElement.classList.add('theme-transitioning');
    
    // Change theme
    setTheme(newTheme);
    
    // Remove transition class after animation
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
      setIsTransitioning(false);
    }, 500);
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleThemeChange}
      disabled={isTransitioning}
      className={cn(
        "h-8 w-8 relative overflow-hidden",
        isTransitioning && "pointer-events-none"
      )}
    >
      {isTransitioning ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <>
          <Sun className={cn(
            "h-4 w-4 transition-all duration-300",
            resolvedTheme === 'dark' 
              ? "rotate-90 scale-0 opacity-0" 
              : "rotate-0 scale-100 opacity-100"
          )} />
          <Moon className={cn(
            "absolute h-4 w-4 transition-all duration-300",
            resolvedTheme === 'dark' 
              ? "rotate-0 scale-100 opacity-100" 
              : "-rotate-90 scale-0 opacity-0"
          )} />
        </>
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
