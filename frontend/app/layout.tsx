import "./globals.css";
import "./logo-styles.css";

export const metadata = {
  title: "MAIN TMS",
  description: "Modern Transportation Management System",
  manifest: "/manifest.json",
  themeColor: "#00A3FF",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MAIN TMS"
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
