"use client";

import { useState } from "react";

type TabKey = "player" | "account" | "billing";

type Props = {
  labels: {
    player: string;
    account: string;
    billing: string;
  };
  playerSection: React.ReactNode;
  accountSection: React.ReactNode;
  billingSection: React.ReactNode;
};

export default function BoutiqueDashboardTabs({
  labels,
  playerSection,
  accountSection,
  billingSection,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("player");

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "player", label: labels.player, icon: "🎵" },
    { key: "account", label: labels.account, icon: "👤" },
    { key: "billing", label: labels.billing, icon: "🧾" },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs nav */}
      <div
        style={{
          display: "flex",
          gap: "0.375rem",
          padding: "0.375rem",
          borderRadius: 14,
          backgroundColor: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                borderRadius: 10,
                border: "none",
                background: isActive
                  ? "linear-gradient(135deg, var(--color-accent) 0%, #e8961a 100%)"
                  : "transparent",
                color: isActive ? "var(--color-accent-text)" : "rgba(255,255,255,0.6)",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "all 0.2s",
                boxShadow: isActive ? "0 4px 14px rgba(245,166,35,0.25)" : "none",
              }}
            >
              <span style={{ fontSize: "1rem" }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content — keep all mounted to preserve player state */}
      <div style={{ display: activeTab === "player" ? "block" : "none" }}>
        {playerSection}
      </div>
      <div style={{ display: activeTab === "account" ? "block" : "none" }}>
        {accountSection}
      </div>
      <div style={{ display: activeTab === "billing" ? "block" : "none" }}>
        {billingSection}
      </div>
    </div>
  );
}
