import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  title?: string
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message, title }])
    setTimeout(() => {
      removeToast(id)
    }, 4500)
  }, [removeToast])

  const success = useCallback((msg: string, title?: string) => showToast(msg, 'success', title), [showToast])
  const error = useCallback((msg: string, title?: string) => showToast(msg, 'error', title), [showToast])
  const warning = useCallback((msg: string, title?: string) => showToast(msg, 'warning', title), [showToast])
  const info = useCallback((msg: string, title?: string) => showToast(msg, 'info', title), [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
            error: <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
            info: <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />,
          }
          const bgColors = {
            success: 'bg-emerald-50 border-emerald-200 text-emerald-950',
            error: 'bg-rose-50 border-rose-200 text-rose-950',
            warning: 'bg-amber-50 border-amber-200 text-amber-950',
            info: 'bg-sky-50 border-sky-200 text-sky-950',
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 ${bgColors[t.type]}`}
            >
              {icons[t.type]}
              <div className="flex-1 text-sm">
                {t.title && <div className="font-semibold">{t.title}</div>}
                <div>{t.message}</div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
