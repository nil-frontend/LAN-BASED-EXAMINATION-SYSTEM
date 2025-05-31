
import React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { sun, moon } from 'lucide-react';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-full justify-start"
    >
      {theme === 'dark' ? (
        <>
          <sun className="h-4 w-4 mr-2" />
          Light Mode
        </>
      ) : (
        <>
          <moon className="h-4 w-4 mr-2" />
          Dark Mode
        </>
      )}
    </Button>
  );
};

export default ThemeToggle;
