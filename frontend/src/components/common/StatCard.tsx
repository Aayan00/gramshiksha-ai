import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  variant?: 'blue' | 'emerald' | 'amber' | 'purple' | 'slate'
  badge?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'blue',
  badge,
}) => {
  const colorMap = {
    blue: 'bg-sky-50 text-sky-700 border-sky-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  }

  const iconBgMap = {
    blue: 'bg-sky-600 text-white shadow-sky-200',
    emerald: 'bg-emerald-600 text-white shadow-emerald-200',
    amber: 'bg-amber-500 text-white shadow-amber-200',
    purple: 'bg-purple-600 text-white shadow-purple-200',
    slate: 'bg-slate-700 text-white shadow-slate-200',
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${iconBgMap[variant]}`}>
          {icon}
        </div>
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
          {badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${colorMap[variant]}`}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
