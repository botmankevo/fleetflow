export const metadata = {
  title: "FleetFlow",
  description: "FleetFlow full-stack starter"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
