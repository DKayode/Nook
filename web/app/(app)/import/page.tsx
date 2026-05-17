import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CsvImporter } from "@/components/CsvImporter";

export default async function ImportPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const accounts = await prisma.bankAccount.findMany({
    where: { userId },
    select: { id: true, name: true, currency: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="px-5 pt-12 lg:pt-0">
      <h1 className="text-2xl font-semibold">Import CSV</h1>
      <p className="mt-1 text-sm text-muted">
        Drop any bank&apos;s CSV — comma, semicolon, or tab delimited. We&apos;ll auto-detect the columns;
        you can correct any of them before importing.
      </p>

      <div className="mt-6">
        <CsvImporter accounts={accounts} />
      </div>
    </main>
  );
}
