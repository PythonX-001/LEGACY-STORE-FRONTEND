import './globals.css';
import { Michroma, Space_Grotesk } from 'next/font/google';

const display = Michroma({ weight: '400', subsets: ['latin'], variable: '--fd' });
const body = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--fb' });

export const metadata = {
  title: 'LEGACY — Wear what outlasts you',
  description: 'Heavyweight streetwear. Limited runs, worldwide shipping.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050507',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}