async function getGreeting() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const response = await fetch(`${baseUrl}/api/greeting`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to fetch greeting");
  }

  return response.json();
}

export default async function Home() {
  const data = await getGreeting();

  return (
    <main style={{ padding: "2rem" }}>
      <h1>FleetFlow</h1>
      <p>{data.message}</p>
      <p>API Base URL: {process.env.NEXT_PUBLIC_API_BASE_URL}</p>
    </main>
  );
}
