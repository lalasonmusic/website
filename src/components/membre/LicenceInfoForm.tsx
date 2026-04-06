"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  initialFirstName?: string;
  initialLastName?: string;
  initialAddress?: string;
  labels: {
    firstName: string;
    lastName: string;
    address: string;
    save: string;
    saved: string;
    hint: string;
  };
};

export default function LicenceInfoForm({
  initialFirstName = "",
  initialLastName = "",
  initialAddress = "",
  labels,
}: Props) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [address, setAddress] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const hasChanged =
    firstName !== initialFirstName ||
    lastName !== initialLastName ||
    address !== initialAddress;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const supabase = createClient();
    await supabase.auth.updateUser({
      data: {
        licence_first_name: firstName.trim(),
        licence_last_name: lastName.trim(),
        licence_address: address.trim(),
      },
    });

    setLoading(false);
    setSuccess(true);
  }

  const inputStyle = {
    padding: "0.625rem 0.875rem",
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "0.75rem",
    color: "var(--color-text-primary)",
    fontSize: "0.875rem",
    fontFamily: "inherit",
    width: "100%",
  };

  return (
    <form onSubmit={handleSave} className="space-y-3">
      {!initialFirstName && !initialLastName && (
        <p className="text-xs text-white/35 mb-1">{labels.hint}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          value={firstName}
          onChange={(e) => { setFirstName(e.target.value); setSuccess(false); }}
          placeholder={labels.firstName}
          style={inputStyle}
        />
        <input
          type="text"
          value={lastName}
          onChange={(e) => { setLastName(e.target.value); setSuccess(false); }}
          placeholder={labels.lastName}
          style={inputStyle}
        />
      </div>

      <input
        type="text"
        value={address}
        onChange={(e) => { setAddress(e.target.value); setSuccess(false); }}
        placeholder={labels.address}
        style={inputStyle}
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || (!hasChanged && !(!initialFirstName && firstName))}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer
            disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {loading ? "..." : labels.save}
        </button>
        {success && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {labels.saved}
          </span>
        )}
      </div>
    </form>
  );
}
