import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface WeeklyData {
  name: string
  Approved: number
  Rejected: number
}

interface WeeklyPerformanceChartProps {
  data: WeeklyData[]
  title?: string
}

export default function WeeklyPerformanceChart({ data, title = 'Weekly Performance' }: WeeklyPerformanceChartProps) {
  return (
    <>
      <style>{`
        /* Completely remove all recharts filters and shadows */
        .weekly-chart-no-filter,
        .weekly-chart-no-filter *,
        .weekly-chart-no-filter svg,
        .weekly-chart-no-filter svg *,
        .weekly-chart-no-filter .recharts-wrapper,
        .weekly-chart-no-filter .recharts-wrapper *,
        .weekly-chart-no-filter .recharts-surface,
        .weekly-chart-no-filter .recharts-surface *,
        .weekly-chart-no-filter .recharts-bar,
        .weekly-chart-no-filter .recharts-bar *,
        .weekly-chart-no-filter .recharts-layer,
        .weekly-chart-no-filter .recharts-layer * {
          filter: none !important;
          -webkit-filter: none !important;
        }
      `}</style>
      <div className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300 border border-gray-100 weekly-chart-no-filter">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barGap={8} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
              }}
              cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
            />
            <Legend 
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px',
                fontWeight: 500,
              }}
            />
            <Bar 
              dataKey="Approved" 
              fill="url(#gradientGreen)" 
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            />
            <Bar 
              dataKey="Rejected" 
              fill="url(#gradientRed)"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            />
            <defs>
              <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                <stop offset="100%" stopColor="#dc2626" stopOpacity={0.8} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}
