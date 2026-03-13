import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EduSplit",
  description: "Structured installment financing for productive student equipment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}