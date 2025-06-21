"use client"

import { useState } from "react"

export type ToastType = "success" | "error" | "info"

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
}

export function useToastNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    setToasts((prev) => [...prev, newToast])

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id)
    }, 5000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const showSuccess = (title: string, description?: string) => {
    addToast({ type: "success", title, description })
  }

  const showError = (title: string, description?: string) => {
    addToast({ type: "error", title, description })
  }

  const showInfo = (title: string, description?: string) => {
    addToast({ type: "info", title, description })
  }

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
  }
}
