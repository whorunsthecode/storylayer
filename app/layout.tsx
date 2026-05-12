import type { Metadata } from 'next';
import { Bricolage_Grotesque, Geist, Geist_Mono, Fraunces, Newsreader } from 'next/font/google';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  weight: ['300', '400', '500', '600'],
});
const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  style: ['normal', 'italic'],
});
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Storylayer',
  description: 'Tell your story through who is listening.',
};

function Atmosphere() {
  return (
    <div className="atmosphere" aria-hidden>
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="blob blob-4" />
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${geist.variable} ${geistMono.variable} ${fraunces.variable} ${newsreader.variable}`}
    >
      <body>
        <Atmosphere />
        <div className="page-content">{children}</div>
      </body>
    </html>
  );
}
