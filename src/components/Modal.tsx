import type { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl'
  headerActions?: ReactNode
}

export default function Modal({ isOpen, onClose, title, children, headerActions }: ModalProps) {
  if (!isOpen) return null

  // const sizeClasses = {
  //   sm: 'max-w-sm',
  //   md: 'max-w-md',
  //   lg: 'max-w-lg',
  //   xl: 'max-w-xl',
  //   '2xl': 'max-w-2xl',
  //   '4xl': 'max-w-4xl',
  //   '5xl': 'max-w-5xl',
  // }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="flex items-center space-x-3">
          {headerActions}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-80px)] overflow-y-auto p-6">
        {children}
      </div>
    </div>
  )
}

