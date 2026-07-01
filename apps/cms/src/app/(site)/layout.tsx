import type { Metadata } from 'next';
import { DM_Sans, Instrument_Serif, Literata } from 'next/font/google';
import type { ReactNode } from 'react';

import styles from './site-home.module.css';

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
  display: 'swap',
});

const body = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const reading = Literata({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-reading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Table Content OS — CMS',
  description:
    'Long-form content in Payload: book-like samples, comfortable reading, and slide editions of the same material.',
};

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${reading.variable}`}>
      <body className={styles.page}>
        <div className={styles.mesh} aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
