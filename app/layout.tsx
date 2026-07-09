import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Worth the Ticket? Studio Dashboard",
  description: "A private content operating system for movie reviews."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
