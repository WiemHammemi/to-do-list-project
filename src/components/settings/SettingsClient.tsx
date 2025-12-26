"use client";

import TwoFASection from "@/components/settings/TwoFASection";
import ProfileSection from "@/components/settings/ProfileSection";
import UserAccountNav from "@/components/UserAccountNav";

export default function SettingsClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <UserAccountNav />
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        <TwoFASection />
        <ProfileSection />
      </main>
    </div>
  );
}
