import React from 'react'

export type Status = 'success' | 'warning' | 'error' | 'info'

export interface StatusBadgeProps {
  status: Status
  label?: string
}

const baseClass = 'status-badge inline-flex items-center px-2 py-0.5 rounded text-sm font-medium'

const statusClasses: Record<Status, string> = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800'
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const cls = `${baseClass} ${statusClasses[status] ?? statusClasses.info}`
  return <span className={cls}>{label ?? status}</span>
}
