import { Bot, LayoutDashboard, Mail, Menu, PlayCircle, Radio, Settings2, X } from 'lucide-react'

import { cn } from '../lib/utils'

export type View = 'dashboard' | 'agents' | 'jobs' | 'runner'

const menuItems = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'agents' as const, label: "Agent'lar", icon: Bot },
  { id: 'jobs' as const, label: 'Bildirim İşleri', icon: Mail },
  { id: 'runner' as const, label: 'İşlem Merkezi', icon: PlayCircle },
]

export function Sidebar({ view, onViewChange, open, onClose }: { view: View; onViewChange: (view: View) => void; open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <button className="fixed inset-0 z-30 bg-slate-950/70 lg:hidden" onClick={onClose} aria-label="Menüyü kapat" />}
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-[274px] flex-col border-r border-slate-800 bg-[#07111f] px-4 py-5 transition-transform duration-200 lg:static lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between px-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-lg shadow-cyan-500/20">
              <Radio className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <p className="font-bold tracking-tight text-white">NotifyAI</p>
              <p className="text-[11px] text-slate-500">Bildirim platformu</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white lg:hidden" aria-label="Menüyü kapat">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-10 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">Çalışma alanı</div>
        <nav className="mt-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = view === item.id
            return (
              <button key={item.id} type="button" onClick={() => { onViewChange(item.id); onClose() }} className={cn('group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition', active ? 'bg-cyan-400/10 text-cyan-300 shadow-inner shadow-cyan-400/5' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white')}>
                <Icon className={cn('h-[18px] w-[18px]', active ? 'text-cyan-300' : 'text-slate-500 group-hover:text-slate-300')} />
                {item.label}
                {item.id === 'jobs' && <span className="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">API</span>}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/10 to-cyan-400/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-violet-200"><Bot className="h-4 w-4" /><span className="text-xs font-semibold">Yerel AI aktif</span></div>
            <p className="text-xs leading-5 text-slate-500">Ollama ile mesajlarınız kendi bilgisayarınızda üretilir.</p>
          </div>
          <div className="flex items-center gap-3 px-3 text-xs text-slate-600"><Settings2 className="h-4 w-4" /> Sistem ayarları <span className="ml-auto">v0.1.0</span></div>
        </div>
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-300 lg:hidden" aria-label="Menüyü aç"><Menu className="h-5 w-5" /></button>
}
