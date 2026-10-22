import { SettingsHub } from "@/features/settings/components/settings-hub";
import { INSTITUTION } from "@/lib/constants";

export const metadata = {
  title: "Pengaturan & Diagnostik Sistem",
  description: `Konfigurasi sistem, jejak audit, dan developer dashboard ${INSTITUTION.name}`,
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Pengaturan, Jejak Audit &amp; Diagnostik Sistem
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Konfigurasi jam operasional sekolah, riwayat mutasi data (audit log), serta diagnostik arsitektur dan runtime sistem SIAKAD.
        </p>
      </div>

      <SettingsHub />
    </div>
  );
}

