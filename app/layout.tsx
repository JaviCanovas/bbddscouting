import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Sidebar from "./components/Sidebar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "BD SCOUTING",
  description: "Base de Datos de Scouting Deportivo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex bg-[#0f1117] text-white min-h-screen font-sans`}
      >
        <Sidebar />
        <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden relative pt-14 pb-16 md:pt-0 md:pb-0">
          {children}
        </main>
      </body>
    </html>
  );
}
