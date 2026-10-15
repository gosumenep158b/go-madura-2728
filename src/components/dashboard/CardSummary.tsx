interface CardSummaryProps {
  title: string;
  value: number | string;
  description?: string;
  icon: React.ReactNode;
}

export default function CardSummary({ title, value, description, icon }: CardSummaryProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1.5 text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 leading-none whitespace-nowrap dark:text-slate-50">{value}</p>
          {description && <p className="mt-2 text-[12px] font-medium leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>}
        </div>
        <div className="shrink-0 rounded-2xl bg-slate-900 p-3.5 text-white shadow-sm dark:bg-slate-700">{icon}</div>
      </div>
    </div>
  );
}
