import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevMind - Document Intelligence & RAG',
  description:
    'Grounding semantic search and QA on uploaded documents via MongoDB Vector Search and LangChain.',
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png' }, { url: '/favicon.ico' }],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased font-sans"
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-white text-[#0d0d0d] font-sans selection:bg-neutral-200 selection:text-black"
      >
        {children}
      </body>
    </html>
  );
}
