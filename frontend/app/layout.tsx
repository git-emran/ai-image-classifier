import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI image Analysis",
  description: "Classify Image and Chat about it with Gemini",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Inject Firebase globals for client-side code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__firebase_config = ${process.env.NEXT_PUBLIC_FIREBASE_CONFIG || "{}"};
              window.__app_id = "${process.env.NEXT_PUBLIC_APP_ID || "default-app-id"}";
              window.__initial_auth_token = null;
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}

