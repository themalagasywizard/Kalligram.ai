import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
