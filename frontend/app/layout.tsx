import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { RootShell } from "./components/RootShell";

export const metadata: Metadata = {
  title: "MyChatApp",
  description: "Modern chat experience"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <RootShell>{children}</RootShell>
        </Providers>
      </body>
    </html>
  );
}
