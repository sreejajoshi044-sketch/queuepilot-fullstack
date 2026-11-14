
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  background: string;
};

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  background,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <div className={`rounded-xl p-3 ${background}`}>
          <Icon size={22} className={color} />
        </div>
      </div>

      <h2 className="mt-5 text-3xl font-bold text-slate-900">
        {value}
      </h2>
    </div>
  );
}

export default StatCard;
