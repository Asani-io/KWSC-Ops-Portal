import type { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  iconBgColor?: string
  iconColor?: string
}

export default function StatsCard({
  title,
  value,
  icon,
  iconBgColor = 'bg-blue-100',
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`${iconBgColor} rounded-full p-3`}>
          <div className="w-8 h-8">
            {icon}
          </div>
        </div>
      </div>
    </div>
  )
}

