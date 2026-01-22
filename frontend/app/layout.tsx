import "./globals.css";
import type { Metadata } from "next";
import { TopNav } from "./shared/TopNav";
import { Sidebar } from "./shared/Sidebar";

export const metadata: Metadata = {
  title: "FleetFlow Dispatch Portal",
  description: "Internal dispatch and POD management portal"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-display">
        <TopNav />
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
