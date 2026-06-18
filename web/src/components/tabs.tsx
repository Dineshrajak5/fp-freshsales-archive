"use client";

import { useState, ReactNode } from "react";

type Tab = {
  id: string;
  label: string;
  count?: number;
  content: ReactNode;
};

export function Tabs({ tabs, defaultTab }: { tabs: Tab[]; defaultTab?: string }) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div className="border-b border-line mb-4">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                tab.id === active
                  ? "border-coral text-coral"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-1.5 text-xs ${
                    tab.id === active ? "text-coral" : "text-ink-soft"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div>{activeTab?.content}</div>
    </div>
  );
}
