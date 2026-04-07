"use client";

import { createClient } from "@/lib/supabase/client";

type Props = {
  label: string;
  locale: string;
};

export default function LogoutButton({ label, locale }: Props) {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}`;
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-white/25 hover:text-red-400 transition-colors underline underline-offset-2 cursor-pointer"
      style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit" }}
    >
      {label}
    </button>
  );
}
