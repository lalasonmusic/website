export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-poppins)",
          fontWeight: 800,
          fontSize: "2.5rem",
          color: "var(--color-text-primary)",
        }}
      >
        Lalason
      </h1>
      <p style={{ color: "var(--color-accent)" }}>
        Migration en cours — Phase A setup ✓
      </p>
    </main>
  );
}
