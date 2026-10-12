interface CardSummaryProps {
  title: string;
  value: number | string;
  description?: string;
  icon: React.ReactNode;
}

export default function CardSummary({ title, value, description, icon }: CardSummaryProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-widest uppercase text-slate-500">{title}</p>
          <p className="mt-1.5 text-3xl font-black tracking-tight text-slate-900 leading-none">{value}</p>
          {description && <p className="mt-2 text-[12px] font-medium leading-relaxed text-slate-600">{description}</p>}
        </div>
        <div className="shrink-0 rounded-2xl bg-slate-900 p-3.5 text-white shadow-sm">{icon}</div>
      </div>
    </div>
  );
}
