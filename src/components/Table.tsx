import type { ReactNode } from 'react'

export interface TableColumn<T> {
  key: string
  header: string
  render?: (item: T) => ReactNode
  className?: string
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  emptyMessage?: string
  getRowKey: (item: T) => string
  onRowClick?: (item: T) => void
  isLoading?: boolean
  skeletonRows?: number
}

export default function Table<T>({ 
  columns, 
  data, 
  emptyMessage = 'No data found',
  getRowKey,
  onRowClick,
  isLoading = false,
  skeletonRows = 5
}: TableProps<T>) {
  // Show skeleton loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider ${
                      column.className || ''
                    }`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {Array.from({ length: skeletonRows }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="animate-pulse">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-5 ${
                        column.className?.includes('whitespace-nowrap') 
                          ? 'whitespace-nowrap' 
                          : ''
                      } ${column.className || ''}`}
                    >
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-shimmer"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-100">
        <div className="p-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider ${
                    column.className || ''
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((item, index) => (
              <tr 
                key={getRowKey(item)} 
                className={`
                  transition-all duration-200
                  hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/30
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
                  group
                `}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-5 transition-all duration-200 ${
                      column.className?.includes('whitespace-nowrap') 
                        ? 'whitespace-nowrap' 
                        : ''
                    } ${column.className || ''}`}
                  >
                    <div className="group-hover:translate-x-0.5 transition-transform duration-200">
                      {column.render ? column.render(item) : String((item as any)[column.key])}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
