"use client";

import { useState } from "react";
import { TopHeader } from "@/components/TopHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { HomeTab, type HomeTabData } from "@/components/tabs/HomeTab";
import { AnalyticsTab, type AnalyticsTabData } from "@/components/tabs/AnalyticsTab";
import { AddTab, type AddTabData } from "@/components/tabs/AddTab";
import { SettingsTab, type SettingsTabData } from "@/components/tabs/SettingsTab";

export type TabKey = "home" | "analytics" | "add" | "settings";

export type ShellData = {
  userEmail: string | null;
  notificationCount: number;
  home: HomeTabData;
  analytics: AnalyticsTabData;
  add: AddTabData;
  settings: SettingsTabData;
};

export function AppShell({ data, initialTab = "home" }: { data: ShellData; initialTab?: TabKey }) {
  const [tab, setTab] = useState<TabKey>(initialTab);

  return (
    <div className="min-h-screen bg-bg pb-28 text-ink">
      <TopHeader userEmail={data.userEmail} notificationCount={data.notificationCount} />
      <main className="mx-auto max-w-md px-4 pt-4">
        {tab === "home" && <HomeTab data={data.home} />}
        {tab === "analytics" && <AnalyticsTab data={data.analytics} />}
        {tab === "add" && <AddTab data={data.add} />}
        {tab === "settings" && <SettingsTab data={data.settings} />}
      </main>
      <MobileBottomNav active={tab} onChange={setTab} />
    </div>
  );
}
