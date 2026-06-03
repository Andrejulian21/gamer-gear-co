import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Unbounded } from 'next/font/google';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-body',
  weight: '100 900',
  display: 'swap',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-mono',
  weight: '100 900',
  display: 'swap',
});

const unbounded = Unbounded({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700', '900'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Gamer Gear Colombia — Perifericos gamer en Colombia',
  description:
    'Tienda online de perifericos gamer en Colombia: mouse, teclados, audifonos y mas de Razer, Logitech G, Corsair, HyperX y Redragon. Pago con PSE, Nequi y Bancolombia.',
  keywords: [
    'gamer',
    'perifericos',
    'Colombia',
    'mouse gaming',
    'teclado mecanico',
    'audifonos gamer',
    'Razer',
    'Logitech',
  ],
  authors: [{ name: 'Gamer Gear Colombia' }],
  openGraph: {
    title: 'Gamer Gear Colombia — Perifericos gamer en Colombia',
    description:
      'Los mejores perifericos gamer en Colombia. Envios a todo el pais y pago con PSE, Nequi y Bancolombia.',
    locale: 'es_CO',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${unbounded.variable} ${geistSans.variable} ${geistMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
