"use client"

import { X, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Toast } from "@/hooks/use-toast-notifications"

interface ToastNotificationsProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export function ToastNotifications({ toasts, onRemove }: ToastNotificationsProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            max-w-sm w-full bg-white border rounded-lg shadow-lg p-4 flex items-start gap-3
            ${toast.type === "success" ? "border-green-200" : ""}
            ${toast.type === "error" ? "border-red-200" : ""}
            ${toast.type === "info" ? "border-blue-200" : ""}
          `}
        >
          <div className="flex-shrink-0">
            {toast.type === "success" && <CheckCircle className="w-5 h-5 text-green-600" />}
            {toast.type === "error" && <XCircle className="w-5 h-5 text-red-600" />}
            {toast.type === "info" && <AlertCircle className="w-5 h-5 text-blue-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`
              text-sm font-medium
              ${toast.type === "success" ? "text-green-900" : ""}
              ${toast.type === "error" ? "text-red-900" : ""}
              ${toast.type === "info" ? "text-blue-900" : ""}
            `}
            >
              {toast.title}
            </p>
            {toast.description && (
              <p
                className={`
                text-sm mt-1
                ${toast.type === "success" ? "text-green-700" : ""}
                ${toast.type === "error" ? "text-red-700" : ""}
                ${toast.type === "info" ? "text-blue-700" : ""}
              `}
              >
                {toast.description}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => onRemove(toast.id)} className="flex-shrink-0 h-auto p-1">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
