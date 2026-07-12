import type { Metadata } from "next";
import { Toaster } from "sonner";
import QueryProvider from "@/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "GajrajConsole",
  description: "Manager admin panel for Gajraj Paithani",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div className="fixed inset-0 bg-linear-to-b from-[#d8d9db] to-[#b1bfda] -z-10" />
        <QueryProvider>{children}</QueryProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
