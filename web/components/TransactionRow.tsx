import { CategoryPicker } from "@/components/CategoryPicker";

type Props = {
  id: string;
  merchant: string;
  category: string | null;
  amountCents: number;
  currency: string;
  postedAt: Date;
  categories: string[];
};

export function TransactionRow({ id, merchant, category, amountCents, currency, postedAt, categories }: Props) {
  const negative = amountCents < 0;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-medium">{merchant}</div>
        <div className="mt-1 text-xs text-muted">{postedAt.toLocaleDateString()}</div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span className={negative ? "font-medium" : "font-medium text-emerald-400"}>
          {new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amountCents / 100)}
        </span>
        <CategoryPicker transactionId={id} current={category} options={categories} />
      </div>
    </div>
  );
}
