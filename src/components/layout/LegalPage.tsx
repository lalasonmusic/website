type Props = {
  title: string;
  children: React.ReactNode;
};

export default function LegalPage({ title, children }: Props) {
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "4rem 1.5rem" }}>
      <h1 style={{ fontWeight: 800, fontSize: "2rem", marginBottom: "2rem" }}>{title}</h1>
      <div
        style={{
          color: "var(--color-text-secondary)",
          lineHeight: 1.8,
          fontSize: "0.9375rem",
        }}
      >
        {children}
      </div>
    </div>
  );
}
