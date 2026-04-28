import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "Panou organizator",
  description:
    "Administrare concursuri pentru organizatori și arbitri: concursuri, echipe, capturi și rezultate.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGate>
      <div className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-8 md:px-10 md:py-12">
        <header className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Panou organizator
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Interfață pentru organizatori și arbitri: configurezi concursuri,
            urmărești capturi și publici rezultate fără pași tehnici complicați.
          </p>
          <div className="mt-4">
            <AdminNav />
          </div>
        </header>
        {children}
      </div>
    </AdminGate>
  );
}
