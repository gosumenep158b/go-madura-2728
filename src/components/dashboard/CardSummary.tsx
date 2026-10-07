interface CardSummaryProps {
  title: string;
  value: number;
  description?: string;
  icon: React.ReactNode;
}

export default function CardSummary({ title, value, description, icon }: CardSummaryProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white border border-rose-200/60 shadow-sm">
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <p className="text-sm font-medium text-rose-800">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-rose-600">{value}</p>
          {description && (
            <p className="mt-1 text-sm text-rose-500/80">{description}</p>
          )}
        </div>
        <div className="rounded-full bg-rose-50 p-3 text-rose-600">
          {icon}
        </div>
      </div>
    </div>
  );
}