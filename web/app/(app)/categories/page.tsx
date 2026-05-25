import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CategoryForm } from "@/components/CategoryForm";
import { DeleteCategoryButton } from "@/components/DeleteCategoryButton";
import {
  BUILTIN_CATEGORY_ICONS,
  DEFAULT_CATEGORY_ICON,
} from "@/lib/categoryIcons";

// Mirror of the ALLOWED list in api/app/categorize.py — kept here only for display.
const BUILTIN = ["Income", "Food", "Transport", "Bills", "Shopping", "Uncategorized"];

export default async function CategoriesPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const custom = await prisma.customCategory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="px-5 pt-12 lg:pt-0">
      <h1 className="text-2xl font-semibold">Categories</h1>
      <p className="mt-1 text-sm text-muted">
        Defaults are intentionally minimal. Anything that doesn&apos;t fit becomes
        <span className="px-1">Uncategorized</span> — add a custom category for it and
        re-assign those transactions from the Activity page.
      </p>

      <div className="mt-6">
        <CategoryForm />
      </div>

      {custom.length > 0 && (
        <section className="mt-8">
          <div className="mb-2 text-xs uppercase tracking-wide text-muted">Yours</div>
          <ul className="space-y-2">
            {custom.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
                <span className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden="true">
                    {c.icon ?? DEFAULT_CATEGORY_ICON}
                  </span>
                  <span>{c.name}</span>
                </span>
                <DeleteCategoryButton id={c.id} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <div className="mb-2 text-xs uppercase tracking-wide text-muted">Built-in</div>
        <ul className="flex flex-wrap gap-2">
          {BUILTIN.map((c) => (
            <li
              key={c}
              className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-muted ring-1 ring-border"
            >
              <span aria-hidden="true">{BUILTIN_CATEGORY_ICONS[c] ?? DEFAULT_CATEGORY_ICON}</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
