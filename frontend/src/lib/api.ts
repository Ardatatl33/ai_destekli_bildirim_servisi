export type Channel = 'email' | 'system'
export type JobStatus = 'pending' | 'processing' | 'sent' | 'failed'

export type Agent = {
  id: number
  name: string
  channel: Channel
  prompt: string
  is_active: boolean
}

export type Job = {
  id: number
  agent_id: number
  recipient: string
  subject: string
  input_data: Record<string, unknown>
  status: JobStatus
  ai_output: string | null
  error_message: string | null
  created_at: string
  sent_at: string | null
}

export type RunResult = {
  message: string
  processed_count: number
  sent_count: number
  failed_count: number
}

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const apiBaseUrl = import.meta.env.DEV && configuredApiBaseUrl === 'http://127.0.0.1:8000'
  ? '/api'
  : configuredApiBaseUrl

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!response.ok) {
    let detail = `API isteği başarısız oldu (${response.status}).`
    try {
      const body = await response.json()
      detail = body.detail || detail
    } catch {
      // JSON olmayan hata cevaplarında genel mesajı koruyoruz.
    }
    throw new Error(detail)
  }

  return response.json() as Promise<T>
}

export const api = {
  health: () => request<{ durum: string }>('/health'),
  getAgents: () => request<Agent[]>('/agents'),
  createAgent: (payload: Omit<Agent, 'id'>) =>
    request<Agent>('/agents', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getJobs: () => request<Job[]>('/notification-jobs'),
  createJob: (payload: {
    agent_id: number
    recipient: string
    subject: string
    input_data: Record<string, unknown>
  }) =>
    request<Job>('/notification-jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  runPendingJobs: () =>
    request<RunResult>('/run-pending-jobs', { method: 'POST' }),
}
