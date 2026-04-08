"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  initialCompany?: string;
  initialVat?: string;
  initialAddress?: string;
  initialPostalCode?: string;
  initialCity?: string;
  initialCountry?: string;
  labels: {
    company: string;
    vat: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    save: string;
    saved: string;
    hint: string;
  };
};

export default function BillingInfoForm({
  initialCompany = "",
  initialVat = "",
  initialAddress = "",
  initialPostalCode = "",
  initialCity = "",
  initialCountry = "",
  labels,
}: Props) {
  const [company, setCompany] = useState(initialCompany);
  const [vat, setVat] = useState(initialVat);
  const [address, setAddress] = useState(initialAddress);
  const [postalCode, setPostalCode] = useState(initialPostalCode);
  const [city, setCity] = useState(initialCity);
  const [country, setCountry] = useState(initialCountry);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const supabase = createClient();
    await supabase.auth.updateUser({
      data: {
        billing_company: company.trim(),
        billing_vat: vat.trim(),
        billing_address: address.trim(),
        billing_postal_code: postalCode.trim(),
        billing_city: city.trim(),
        billing_country: country.trim(),
      },
    });

    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  const inputStyle: React.CSSProperties = {
    padding: "0.625rem 0.875rem",
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "0.75rem",
    color: "var(--color-text-primary)",
    fontSize: "0.875rem",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <p className="text-xs text-white/35 mb-2">{labels.hint}</p>

      <input
        type="text"
        value={company}
        onChange={(e) => { setCompany(e.target.value); setSuccess(false); }}
        placeholder={labels.company}
        style={inputStyle}
      />

      <input
        type="text"
        value={vat}
        onChange={(e) => { setVat(e.target.value); setSuccess(false); }}
        placeholder={labels.vat}
        style={inputStyle}
      />

      <input
        type="text"
        value={address}
        onChange={(e) => { setAddress(e.target.value); setSuccess(false); }}
        placeholder={labels.address}
        style={inputStyle}
      />

      <div className="grid grid-cols-3 gap-3">
        <input
          type="text"
          value={postalCode}
          onChange={(e) => { setPostalCode(e.target.value); setSuccess(false); }}
          placeholder={labels.postalCode}
          style={inputStyle}
        />
        <input
          type="text"
          value={city}
          onChange={(e) => { setCity(e.target.value); setSuccess(false); }}
          placeholder={labels.city}
          style={{ ...inputStyle, gridColumn: "span 2" }}
        />
      </div>

      <input
        type="text"
        value={country}
        onChange={(e) => { setCountry(e.target.value); setSuccess(false); }}
        placeholder={labels.country}
        style={inputStyle}
      />

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
