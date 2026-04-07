"use client";

type Props = {
  locale: string;
  memberLabel: string;
};

export default function UserMenu({ locale, memberLabel }: Props) {
  return (
    <a
      href={`/${locale}/membre`}
      style={{
        padding: "0.5rem 1.25rem",
        backgroundColor: "var(--color-accent)",
        color: "var(--color-accent-text)",
        fontWeight: 600,
        fontSize: "0.875rem",
        borderRadius: "var(--radius-full)",
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      {memberLabel}
    </a>
  );
}
