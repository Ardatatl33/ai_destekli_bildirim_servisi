import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock3,
  Cpu,
  Play,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  TriangleAlert,
  Workflow,
  XCircle,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Header } from './components/Header'
import { Sidebar, type View } from './components/Sidebar'
import { Button, Card, ChannelBadge, EmptyState, Modal, StatusBadge } from './components/ui'
import { api, type Agent, type Job } from './lib/api'
import { cn, formatDate, formatRelative } from './lib/utils'
import './App.css'

const agentSchema = z.object({
  name: z.string().min(1, 'Agent adı zorunludur.').max(100, 'En fazla 100 karakter olabilir.'),
  channel: z.enum(['email', 'system']),
  prompt: z.string().min(1, 'Prompt zorunludur.'),
  is_active: z.boolean(),
})

const jobSchema = z.object({
  agent_id: z.number().positive('Bir agent seçin.'),
  recipient: z.string().min(1, 'Alıcı zorunludur.').max(320, 'E-posta adresi çok uzun.'),
  subject: z.string().min(1, 'Konu zorunludur.').max(255, 'Konu çok uzun.'),
  inputDataRaw: z.string().min(2, 'Bildirim verilerini JSON olarak girin.'),
})

type AgentForm = z.infer<typeof agentSchema>
type JobForm = z.infer<typeof jobSchema>

const viewCopy: Record<View, { title: string; subtitle: string }> = {
  dashboard: { title: 'Genel Bakış', subtitle: 'Bildirim operasyonlarınızı tek ekrandan izleyin.' },
  agents: { title: "Agent'lar", subtitle: 'AI bildirim üretim kurallarınızı yönetin.' },
  jobs: { title: 'Bildirim İşleri', subtitle: 'Kuyruktaki ve tamamlanan bildirimleri inceleyin.' },
  runner: { title: 'İşlem Merkezi', subtitle: 'Bekleyen işleri güvenli şekilde çalıştırın.' },
}

function App() {
  const [view, setView] = useState<View>('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, setDark] = useState(true)
  const [agentModalOpen, setAgentModalOpen] = useState(false)
  const [jobModalOpen, setJobModalOpen] = useState(false)

  const queryClient = useQueryClient()
  const agentsQuery = useQuery({ queryKey: ['agents'], queryFn: api.getAgents })
  const jobsQuery = useQuery({ queryKey: ['notification-jobs'], queryFn: api.getJobs, refetchInterval: 30000 })
  const healthQuery = useQuery({ queryKey: ['health'], queryFn: api.health, refetchInterval: 30000, retry: 1 })

  const runMutation = useMutation({
    mutationFn: api.runPendingJobs,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-jobs'] }),
  })

  const createAgentMutation = useMutation({
    mutationFn: api.createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      setAgentModalOpen(false)
    },
  })

  const createJobMutation = useMutation({
    mutationFn: api.createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-jobs'] })
      setJobModalOpen(false)
    },
  })

  const agents = agentsQuery.data ?? []
  const jobs = jobsQuery.data ?? []
  const copy = viewCopy[view]

  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !dark)
  }, [dark])

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar view={view} onViewChange={setView} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="min-w-0 flex-1">
          <Header title={copy.title} subtitle={copy.subtitle} isOnline={healthQuery.isSuccess} dark={dark} onThemeToggle={() => setDark((value) => !value)} onMenuOpen={() => setMenuOpen(true)} />

          <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
            {healthQuery.isError && <ApiNotice onRetry={() => healthQuery.refetch()} />}
            {view === 'dashboard' && <Dashboard agents={agents} jobs={jobs} loading={agentsQuery.isLoading || jobsQuery.isLoading} onRun={() => runMutation.mutate()} running={runMutation.isPending} onCreateJob={() => setJobModalOpen(true)} />}
            {view === 'agents' && <AgentsPage agents={agents} loading={agentsQuery.isLoading} onCreate={() => setAgentModalOpen(true)} onRefresh={() => agentsQuery.refetch()} />}
            {view === 'jobs' && <JobsPage jobs={jobs} agents={agents} loading={jobsQuery.isLoading} onCreate={() => setJobModalOpen(true)} onRefresh={() => jobsQuery.refetch()} />}
            {view === 'runner' && <RunnerPage jobs={jobs} result={runMutation.data} onRun={() => runMutation.mutate()} running={runMutation.isPending} error={runMutation.error} />}
          </div>
        </main>
      </div>

      {agentModalOpen && <AgentFormModal onClose={() => setAgentModalOpen(false)} onSubmit={(data) => createAgentMutation.mutate(data)} loading={createAgentMutation.isPending} error={createAgentMutation.error} />}
      {jobModalOpen && <JobFormModal agents={agents} onClose={() => setJobModalOpen(false)} onSubmit={(data) => createJobMutation.mutate(data)} loading={createJobMutation.isPending} error={createJobMutation.error} />}
    </div>
  )
}

function ApiNotice({ onRetry }: { onRetry: () => void }) {
  return <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Backend bağlantısı kurulamadı.</p><p className="mt-1 text-amber-200/70">FastAPI servisinin <span className="font-mono">127.0.0.1:8000</span> adresinde çalıştığından emin olun.</p></div></div><Button variant="secondary" size="sm" onClick={onRetry}><RefreshCw className="h-3.5 w-3.5" /> Tekrar dene</Button></div>
}

function Dashboard({ agents, jobs, loading, onRun, running, onCreateJob }: { agents: Agent[]; jobs: Job[]; loading: boolean; onRun: () => void; running: boolean; onCreateJob: () => void }) {
  const sent = jobs.filter((job) => job.status === 'sent').length
  const pending = jobs.filter((job) => job.status === 'pending').length
  const failed = jobs.filter((job) => job.status === 'failed').length
  const processing = jobs.filter((job) => job.status === 'processing').length

  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - index))
      return { key: date.toISOString().slice(0, 10), name: new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(date), gönderildi: 0, başarısız: 0 }
    })
    jobs.forEach((job) => {
      const day = days.find((item) => item.key === job.created_at.slice(0, 10))
      if (!day) return
      if (job.status === 'sent') day.gönderildi += 1
      if (job.status === 'failed') day.başarısız += 1
    })
    return days
  }, [jobs])

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 rounded-3xl border border-cyan-400/10 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.12),_transparent_38%),linear-gradient(110deg,_rgba(15,34,56,0.95),_rgba(10,16,31,0.95))] p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-2xl"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-300"><Sparkles className="h-3.5 w-3.5" /> Ollama ile yerel AI akışı</div><h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Bildirim operasyonları kontrol altında.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Agent'larınız mesajları üretir, job kuyruğu işleri takip eder ve işlem merkezi gönderimleri tek tıkla başlatır.</p></div>
      <div className="flex shrink-0 flex-wrap gap-3"><Button variant="secondary" onClick={onCreateJob}><Plus className="h-4 w-4" /> Yeni bildirim</Button><Button onClick={onRun} disabled={running || pending === 0}><Play className="h-4 w-4" /> {running ? 'Çalışıyor...' : 'Bekleyenleri çalıştır'}</Button></div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Toplam bildirim" value={loading ? '—' : jobs.length} detail="Tüm zamanlar" icon={Activity} color="cyan" />
      <MetricCard label="Başarıyla gönderildi" value={loading ? '—' : sent} detail="Tamamlanan işler" icon={CheckCircle2} color="emerald" />
      <MetricCard label="Bekleyen işler" value={loading ? '—' : pending} detail={`${processing} işleniyor`} icon={Clock3} color="amber" />
      <MetricCard label="Başarısız işler" value={loading ? '—' : failed} detail="İnceleme bekleyen" icon={XCircle} color="rose" />
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
      <Card className="p-5 sm:p-6"><SectionHeading title="Gönderim performansı" description="Son 7 gündeki job sonuçları" action={<span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-400">Canlı görünüm</span>} /><div className="mt-6 h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}><defs><linearGradient id="sentFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} /><stop offset="100%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient><linearGradient id="failedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fb7185" stopOpacity={0.25} /><stop offset="100%" stopColor="#fb7185" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#1e293b" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} /><Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#e2e8f0' }} /><Area type="monotone" dataKey="gönderildi" stroke="#22d3ee" strokeWidth={2} fill="url(#sentFill)" /><Area type="monotone" dataKey="başarısız" stroke="#fb7185" strokeWidth={2} fill="url(#failedFill)" /></AreaChart></ResponsiveContainer></div><div className="mt-2 flex gap-4 text-xs text-slate-500"><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-cyan-400" /> Gönderildi</span><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-rose-400" /> Başarısız</span></div></Card>
      <Card className="p-5 sm:p-6"><SectionHeading title="Aktif agent'lar" description={`${agents.length} agent tanımlı`} action={<button type="button" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">Yönet <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></button>} /><div className="mt-5 space-y-3">{agents.length === 0 ? <EmptyState title="Henüz agent yok" description="İlk agent'ınızı oluşturarak bildirim akışını başlatın." /> : agents.slice(0, 4).map((agent) => <AgentRow key={agent.id} agent={agent} />)}</div></Card>
    </div>

    <Card className="overflow-hidden"><SectionHeading title="Son bildirim işleri" description="En güncel API kayıtları" action={<span className="flex items-center gap-1 text-xs text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Otomatik yenilenir</span>} /><JobTable jobs={jobs.slice(-5).reverse()} compact /></Card>
  </div>
}

function MetricCard({ label, value, detail, icon: Icon, color }: { label: string; value: number | string; detail: string; icon: typeof Activity; color: 'cyan' | 'emerald' | 'amber' | 'rose' }) {
  const styles = { cyan: 'bg-cyan-400/10 text-cyan-300', emerald: 'bg-emerald-400/10 text-emerald-300', amber: 'bg-amber-400/10 text-amber-300', rose: 'bg-rose-400/10 text-rose-300' }
  return <Card className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-slate-400">{label}</p><p className="mt-3 text-3xl font-bold tracking-tight text-white">{value}</p><p className="mt-1 text-xs text-slate-600">{detail}</p></div><div className={cn('rounded-xl p-2.5', styles[color])}><Icon className="h-5 w-5" /></div></div></Card>
}

function SectionHeading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-white">{title}</h2><p className="mt-1 text-xs text-slate-500">{description}</p></div>{action}</div>
}

function AgentRow({ agent }: { agent: Agent }) {
  return <div className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/30 p-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300"><Bot className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-200">{agent.name}</p><p className="mt-0.5 truncate text-xs text-slate-500">{agent.prompt}</p></div><ChannelBadge channel={agent.channel} /></div>
}

function AgentsPage({ agents, loading, onCreate, onRefresh }: { agents: Agent[]; loading: boolean; onCreate: () => void; onRefresh: () => void }) {
  return <div className="space-y-6"><PageActions eyebrow="Agent yönetimi" title="Mesaj üretim ekiplerinizi yönetin" description="Her agent farklı kanal ve prompt kurallarıyla çalışır." primaryLabel="Yeni agent" onPrimary={onCreate} onRefresh={onRefresh} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{loading ? <LoadingCards count={3} /> : agents.length === 0 ? <div className="md:col-span-2 xl:col-span-3"><Card><EmptyState title="Henüz agent oluşturulmamış" description="Kısa ve profesyonel bildirimler üretmek için ilk agent'ınızı ekleyin." /></Card></div> : agents.map((agent) => <AgentCard key={agent.id} agent={agent} />)}</div></div>
}

function AgentCard({ agent }: { agent: Agent }) {
  return <Card className="flex flex-col p-5"><div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400/20 to-cyan-400/10 text-violet-300"><Bot className="h-5 w-5" /></div><span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', agent.is_active ? 'bg-emerald-400/10 text-emerald-300' : 'bg-slate-800 text-slate-500')}>{agent.is_active ? 'Aktif' : 'Pasif'}</span></div><h3 className="mt-5 font-semibold text-white">{agent.name}</h3><p className="mt-2 line-clamp-3 min-h-[66px] text-sm leading-6 text-slate-500">{agent.prompt}</p><div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4"><ChannelBadge channel={agent.channel} /><span className="text-xs text-slate-600">ID #{agent.id}</span></div></Card>
}

function JobsPage({ jobs, agents, loading, onCreate, onRefresh }: { jobs: Job[]; agents: Agent[]; loading: boolean; onCreate: () => void; onRefresh: () => void }) {
  const agentMap = new Map(agents.map((agent) => [agent.id, agent]))
  return <div className="space-y-6"><PageActions eyebrow="Bildirim kuyruğu" title="Tüm işleri tek tabloda takip edin" description="Pending, processing, sent ve failed durumlarını izleyin." primaryLabel="Yeni iş oluştur" onPrimary={onCreate} onRefresh={onRefresh} /><Card className="overflow-hidden\"><div className="border-b border-slate-800 px-5 py-4\"><div className="flex items-center justify-between\"><div><h2 className="font-semibold text-white">Bildirim kayıtları</h2><p className="mt-1 text-xs text-slate-500">{jobs.length} toplam kayıt</p></div><div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex"><Workflow className="h-4 w-4" /> API verisi</div></div></div>{loading ? <LoadingRows /> : <JobTable jobs={jobs.slice().reverse()} agentMap={agentMap} />}</Card></div>
}

function JobTable({ jobs, agentMap, compact = false }: { jobs: Job[]; agentMap?: Map<number, Agent>; compact?: boolean }) {
  if (jobs.length === 0) return <EmptyState title="Henüz bildirim işi yok" description="Yeni bir iş oluşturarak AI bildirim akışını deneyin." />
  return <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left"><thead><tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-600"><th className="px-5 py-3 font-semibold">İş / Alıcı</th><th className="px-5 py-3 font-semibold">Agent</th><th className="px-5 py-3 font-semibold">Kanal</th><th className="px-5 py-3 font-semibold">Durum</th><th className="px-5 py-3 font-semibold">Tarih</th></tr></thead><tbody>{jobs.map((job) => <tr key={job.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/20"><td className="px-5 py-4"><p className="max-w-[230px] truncate text-sm font-semibold text-slate-200">{job.subject}</p><p className="mt-1 max-w-[230px] truncate text-xs text-slate-500">{job.recipient}</p></td><td className="px-5 py-4 text-xs text-slate-400">{agentMap?.get(job.agent_id)?.name || `Agent #${job.agent_id}`}</td><td className="px-5 py-4"><ChannelBadge channel={agentMap?.get(job.agent_id)?.channel ?? 'email'} /></td><td className="px-5 py-4"><StatusBadge status={job.status} /></td><td className="px-5 py-4 text-xs text-slate-500">{compact ? formatRelative(job.created_at) : formatDate(job.created_at)}</td></tr>)}</tbody></table></div>
}

function RunnerPage({ jobs, result, onRun, running, error }: { jobs: Job[]; result?: { processed_count: number; sent_count: number; failed_count: number }; onRun: () => void; running: boolean; error: Error | null }) {
  const pending = jobs.filter((job) => job.status === 'pending')
  return <div className="space-y-6"><div className="rounded-3xl border border-violet-400/15 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.18),_transparent_40%),linear-gradient(120deg,_rgba(28,23,58,0.95),_rgba(10,16,31,0.95))] p-6 sm:p-8"><div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/15 text-violet-300"><Cpu className="h-6 w-6" /></div><h2 className="text-2xl font-bold text-white">Bekleyen işleri çalıştır</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">İşlemci, pending durumundaki her job için Ollama'dan metin üretir ve seçilen kanala göre gönderim sürecini tamamlar.</p></div><Button size="lg" onClick={onRun} disabled={running || pending.length === 0}>{running ? <><RefreshCw className="h-4 w-4 animate-spin" /> İşleniyor...</> : <><Play className="h-4 w-4" /> {pending.length} işi çalıştır</>}</Button></div></div><div className="grid gap-4 md:grid-cols-3"><RunnerMetric icon={Clock3} label="Bekleyen" value={pending.length} color="amber" /><RunnerMetric icon={Send} label="Son çalıştırmada gönderilen" value={result?.sent_count ?? '—'} color="emerald" /><RunnerMetric icon={XCircle} label="Son çalıştırmada hata" value={result?.failed_count ?? '—'} color="rose" /></div>{error && <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200"><p className="font-semibold">İşlem tamamlanamadı.</p><p className="mt-1 text-rose-200/70">{error.message}</p></div>}{result && !error && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200"><p className="font-semibold">Bekleyen işler işlendi.</p><p className="mt-1 text-emerald-200/70">{result.processed_count} iş işlendi, {result.sent_count} gönderildi, {result.failed_count} hata oluştu.</p></div>}<Card className="overflow-hidden\"><SectionHeading title="İşlem sırası" description="Runner'ın bir sonraki çalıştırmada ele alacağı kayıtlar" /><div className="mt-4">{pending.length === 0 ? <EmptyState title="Kuyruk boş" description="Çalıştırılmayı bekleyen job bulunmuyor." /> : <JobTable jobs={pending} compact />}</div></Card></div>
}

function RunnerMetric({ icon: Icon, label, value, color }: { icon: typeof Clock3; label: string; value: number | string; color: 'amber' | 'emerald' | 'rose' }) {
  const styles = { amber: 'text-amber-300 bg-amber-400/10', emerald: 'text-emerald-300 bg-emerald-400/10', rose: 'text-rose-300 bg-rose-400/10' }
  return <Card className="flex items-center gap-4 p-5"><div className={cn('rounded-xl p-3', styles[color])}><Icon className="h-5 w-5" /></div><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p></div></Card>
}

function PageActions({ eyebrow, title, description, primaryLabel, onPrimary, onRefresh }: { eyebrow: string; title: string; description: string; primaryLabel: string; onPrimary: () => void; onRefresh: () => void }) {
  return <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">{eyebrow}</p><h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">{title}</h2><p className="mt-2 text-sm text-slate-500">{description}</p></div><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={onRefresh}><RefreshCw className="h-3.5 w-3.5" /> Yenile</Button><Button size="sm" onClick={onPrimary}><Plus className="h-3.5 w-3.5" /> {primaryLabel}</Button></div></div>
}

function LoadingCards({ count }: { count: number }) { return <>{Array.from({ length: count }, (_, index) => <Card key={index} className="h-48 animate-pulse bg-slate-900/60" />)}</> }
function LoadingRows() { return <div className="space-y-3 p-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-800/70" />)}</div> }

function AgentFormModal({ onClose, onSubmit, loading, error }: { onClose: () => void; onSubmit: (data: AgentForm) => void; loading: boolean; error: Error | null }) {
  const form = useForm<AgentForm>({ resolver: zodResolver(agentSchema), defaultValues: { name: '', channel: 'email', prompt: 'Müşteriye kısa, doğal ve profesyonel bir bildirim hazırla.', is_active: true } })
  return <Modal title="Yeni agent oluştur" description="Agent, AI mesajının tonunu ve gönderim kanalını belirler." onClose={onClose}><form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}><FormField label="Agent adı" error={form.formState.errors.name?.message}><input className="form-input" placeholder="Kargo Bildirim Agent'ı" {...form.register('name')} /></FormField><FormField label="Bildirim kanalı" error={form.formState.errors.channel?.message}><select className="form-input" {...form.register('channel')}><option value="email">E-posta</option><option value="system">Sistem</option></select></FormField><FormField label="AI prompt'u" error={form.formState.errors.prompt?.message}><textarea className="form-input min-h-28 resize-y" placeholder="Müşteriye kısa ve profesyonel bir bildirim hazırla." {...form.register('prompt')} /></FormField><label className="flex items-center gap-3 text-sm text-slate-300"><input type="checkbox" className="h-4 w-4 accent-cyan-400" {...form.register('is_active')} /> Agent aktif olarak oluşturulsun</label>{error && <FormError message={error.message} />}<div className="flex justify-end gap-2 border-t border-slate-800 pt-4"><Button type="button" variant="ghost" onClick={onClose}>Vazgeç</Button><Button type="submit" disabled={loading}>{loading ? 'Kaydediliyor...' : 'Agent oluştur'}</Button></div></form></Modal>
}

function JobFormModal({ agents, onClose, onSubmit, loading, error }: { agents: Agent[]; onClose: () => void; onSubmit: (data: { agent_id: number; recipient: string; subject: string; input_data: Record<string, unknown> }) => void; loading: boolean; error: Error | null }) {
  const form = useForm<JobForm>({ resolver: zodResolver(jobSchema), defaultValues: { agent_id: agents[0]?.id ?? 0, recipient: '', subject: 'Siparişiniz hakkında bilgilendirme', inputDataRaw: '{\\n  "customer_name": "Ahmet",\\n  "order_id": "12345",\\n  "status": "Kargoya verildi"\\n}' } })
  useEffect(() => { if (!form.getValues('agent_id') && agents[0]) form.setValue('agent_id', agents[0].id) }, [agents, form])
  const submit = (data: JobForm) => { try { const input_data = JSON.parse(data.inputDataRaw) as Record<string, unknown>; onSubmit({ agent_id: data.agent_id, recipient: data.recipient, subject: data.subject, input_data }) } catch { form.setError('inputDataRaw', { message: 'Geçerli bir JSON nesnesi girin.' }) } }
  return <Modal title="Yeni bildirim işi" description="İşi kuyruğa ekleyin; işlem merkezinden Ollama ve seçilen kanal ile çalıştırabilirsiniz." onClose={onClose}><form className="space-y-4" onSubmit={form.handleSubmit(submit)}><FormField label="Bildirim agent'ı" error={form.formState.errors.agent_id?.message}>{agents.length === 0 ? <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">Önce en az bir agent oluşturmalısınız.</div> : <select className="form-input" {...form.register('agent_id', { valueAsNumber: true })}><option value="">Agent seçin</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} · {agent.channel === 'email' ? 'E-posta' : 'Sistem'}</option>)}</select>}</FormField><FormField label="Alıcı" error={form.formState.errors.recipient?.message}><input className="form-input" type="email" placeholder="musteri@example.com" {...form.register('recipient')} /></FormField><FormField label="Konu" error={form.formState.errors.subject?.message}><input className="form-input" placeholder="Siparişiniz kargoya verildi" {...form.register('subject')} /></FormField><FormField label="Bildirim verileri · JSON" error={form.formState.errors.inputDataRaw?.message}><textarea className="form-input min-h-40 resize-y font-mono text-xs leading-6" {...form.register('inputDataRaw')} /></FormField>{error && <FormError message={error.message} />}<div className="flex justify-end gap-2 border-t border-slate-800 pt-4"><Button type="button" variant="ghost" onClick={onClose}>Vazgeç</Button><Button type="submit" disabled={loading || agents.length === 0}>{loading ? 'Kuyruğa ekleniyor...' : 'İşi kuyruğa ekle'}</Button></div></form></Modal>
}

function FormField({ label, error, children }: { label: string; error?: string; children: ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-300">{label}</span>{children}{error && <span className="mt-1.5 block text-xs text-rose-300">{error}</span>}</label> }
function FormError({ message }: { message: string }) { return <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{message}</div> }

export default App
