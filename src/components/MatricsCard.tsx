import type { ReactNode } from 'react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  iconBgColor?: string
  iconColor?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export default function StatsCard({
  title,
  value,
  icon,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
  trend,
}: StatsCardProps) {
  return (
    <div className="group relative bg-white rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden card-hover border border-gray-100">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
            <div className="flex items-end space-x-2 mt-3">
              <p className="text-4xl font-bold text-gray-900">{value}</p>
              {trend && (
                <div className={`flex items-center space-x-1 pb-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                  trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  <svg 
                    className={`w-3 h-3 ${trend.isPositive ? '' : 'transform rotate-180'}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                  </svg>
                  <span>{trend.value}%</span>
                </div>
              )}
            </div>
          </div>
          
          <div className={`${iconBgColor} rounded-2xl p-4 shadow-soft group-hover:scale-110 transition-transform duration-300`}>
            <div className={`w-7 h-7 ${iconColor}`}>
              {icon}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </div>
  )
}
