import "./globals.css";

export const metadata = {
  title: "FleetFlow",
  description: "FleetFlow operations portal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
