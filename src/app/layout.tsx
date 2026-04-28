import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lyra-competition-tracker.ro";
const normalizedSiteUrl = rawSiteUrl.startsWith("http")
  ? rawSiteUrl
  : `https://${rawSiteUrl}`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(normalizedSiteUrl),
  title: {
    default: "Lyra Tracker - Concursuri de pescuit",
    template: "%s | Lyra Tracker",
  },
  description:
    "Platformă în limba română pentru organizatori, arbitri și participanți: clasamente live, sectoare, cântăriri și rezultate în timp real.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Lyra Tracker - Concursuri de pescuit",
    description:
      "Urmărește și organizează concursuri de pescuit cu interfață simplă, clară și rapidă pentru orice utilizator.",
    url: "/",
    type: "website",
    locale: "ro_RO",
    siteName: "Lyra Tracker",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Lyra Tracker - clasamente live pentru concursuri de pescuit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lyra Tracker - Concursuri de pescuit",
    description:
      "Clasamente live, sectoare și capturi într-o platformă modernă, în limba română.",
    images: ["/twitter-image"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('lyra-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=t?t==='dark':d;document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`,
          }}
        />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
