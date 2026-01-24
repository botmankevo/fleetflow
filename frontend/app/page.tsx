export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "24px",
        background: "#0f172a",
        color: "#f8fafc",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", margin: 0 }}>FleetFlow</h1>
      <p style={{ maxWidth: "560px", textAlign: "center", margin: 0 }}>
        The FleetFlow frontend is now ready to build. Connect your backend services to
        begin managing routes, loads, and driver activity.
      </p>
    </main>
  );
}
