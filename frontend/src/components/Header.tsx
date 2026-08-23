import { Moon, Sun, Wifi, WifiOff } from 'lucide-react'

import { MobileMenuButton } from './Sidebar'

export function Header({ title, subtitle, isOnline, dark, onThemeToggle, onMenuOpen }: { title: string; subtitle: string; isOnline: boolean; dark: boolean; onThemeToggle: () => void; onMenuOpen: () => void }) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-slate-800/80 px-5 py-5 sm:px-8 lg:px-10">
      <div className="flex items-start gap-3">
        <MobileMenuButton onClick={onMenuOpen} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">AI Destekli Bildirim Servisi</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs sm:flex"><span className={isOnline ? 'text-emerald-300' : 'text-rose-300'}>{isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}</span><span className="text-slate-400">API {isOnline ? 'bağlı' : 'çevrimdışı'}</span><span className={isOnline ? 'h-1.5 w-1.5 rounded-full bg-emerald-400' : 'h-1.5 w-1.5 rounded-full bg-rose-400'} /></div>
        <button type="button" onClick={onThemeToggle} className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 transition hover:border-slate-700 hover:text-white" aria-label="Temayı değiştir">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
        <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-violet-500 text-sm font-bold text-slate-950 sm:flex">AT</div>
      </div>
    </header>
  )
}
