import { AdminGate } from "@/components/admin/AdminGate";
import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGate>
      <div className="mx-auto w-full max-w-7xl flex-1 px-3 py-6 sm:px-4">
        <header className="mb-6 border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Panou organizator
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Acces complet pentru administratori și organizatori de concurs.
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
