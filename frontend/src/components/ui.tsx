import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { X } from 'lucide-react'

import { cn } from '../lib/utils'
import type { JobStatus } from '../lib/api'

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-cyan-400 text-slate-950 hover:bg-cyan-300',
        variant === 'secondary' && 'border border-slate-700 bg-slate-800 text-slate-100 hover:border-slate-600 hover:bg-slate-700',
        variant === 'ghost' && 'text-slate-400 hover:bg-slate-800 hover:text-white',
        variant === 'danger' && 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25',
        size === 'sm' && 'px-3 py-2 text-xs',
        size === 'md' && 'px-4 py-2.5 text-sm',
        size === 'lg' && 'px-5 py-3 text-sm',
        className,
      )}
      {...props}
    />
  )
}

export function Card({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <section className={cn('rounded-2xl border border-slate-800/80 bg-slate-900/80 shadow-xl shadow-slate-950/20', className)}>
      {children}
    </section>
  )
}

export function StatusBadge({ status }: { status: JobStatus }) {
  const styles: Record<JobStatus, string> = {
    pending: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
    processing: 'border-blue-400/20 bg-blue-400/10 text-blue-300',
    sent: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    failed: 'border-rose-400/20 bg-rose-400/10 text-rose-300',
  }

  const labels: Record<JobStatus, string> = {
    pending: 'Bekliyor',
    processing: 'İşleniyor',
    sent: 'Gönderildi',
    failed: 'Başarısız',
  }

  return <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', styles[status])}>{labels[status]}</span>
}

export function ChannelBadge({ channel }: { channel: 'email' | 'system' }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/70 px-2.5 py-1 text-xs font-medium text-slate-300">
      <span className={cn('h-1.5 w-1.5 rounded-full', channel === 'email' ? 'bg-violet-400' : 'bg-cyan-400')} />
      {channel === 'email' ? 'E-posta' : 'Sistem'}
    </span>
  )
}

export function Modal({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/50 sm:max-w-xl sm:rounded-3xl sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            {description && <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Pencereyi kapat">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-xl">⌁</div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
}
