import { X, type LucideIcon } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { companyById } from '../data/companies'
import { USERS } from '../data/seed'
import type { CompanyId } from '../data/types'
import { initials } from '../lib/format'

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center" onMouseDown={onClose}>
      <div className={`card w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} my-8 animate-[pop_.15s_ease-out]`} onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-bold">{title}</h3>
          <button className="btn-ghost !p-1.5" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

const TONES: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-600', blue: 'bg-brand-50 text-brand-700', green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700', red: 'bg-rose-50 text-rose-700', violet: 'bg-violet-50 text-violet-700',
  cyan: 'bg-cyan-50 text-cyan-700',
}
export type Tone = keyof typeof TONES

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>{children}</span>
}

export const statusTone = (s: string): Tone => ({
  New: 'blue', Contacted: 'cyan', Qualified: 'violet', Unqualified: 'slate', Converted: 'green',
  Enquiry: 'slate', 'Site Survey': 'cyan', 'Design & Quote': 'blue', Negotiation: 'amber', Won: 'green', Lost: 'red',
  Draft: 'slate', Sent: 'blue', Accepted: 'green', Rejected: 'red',
  Open: 'red', 'In Progress': 'amber', Resolved: 'green',
  Low: 'slate', Medium: 'blue', High: 'amber', Critical: 'red',
  Design: 'violet', Production: 'blue', Dispatch: 'cyan', Installation: 'amber', Handover: 'green',
} as Record<string, Tone>)[s] ?? 'slate'

export function Status({ s }: { s: string }) {
  return <Badge tone={statusTone(s)}>{s}</Badge>
}

export function CompanyTag({ id, full }: { id: CompanyId; full?: boolean }) {
  const c = companyById(id)
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-bold" style={{ background: `${c.color}14`, color: c.color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
      {full ? c.name : c.short}
    </span>
  )
}

const AV_COLORS = ['#1d3fbf', '#5dbb46', '#e8590c', '#7c3aed', '#0891b2', '#dc2626', '#a16207', '#059669']
export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const c = AV_COLORS[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AV_COLORS.length]
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: c, fontSize: size * 0.38 }}>
      {initials(name)}
    </span>
  )
}

export function UserChip({ id }: { id: string }) {
  const u = USERS.find(x => x.id === id)
  if (!u) return null
  return <span className="inline-flex items-center gap-2"><Avatar name={u.name} size={22} /><span className="text-sm">{u.name}</span></span>
}

export function Stat({ label, value, sub, icon: Icon, color = '#1d3fbf', trend }: {
  label: string; value: string; sub?: string; icon: LucideIcon; color?: string; trend?: number
}) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">{label}</p>
        <span className="rounded-xl p-2" style={{ background: `${color}14`, color }}><Icon size={18} /></span>
      </div>
      <p className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl">{value}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
        {trend !== undefined && (
          <span className={`font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%</span>
        )}
        {sub && <span className="text-slate-400">{sub}</span>}
      </div>
    </div>
  )
}

export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return <label className={`block ${className}`}><span className="label">{label}</span>{children}</label>
}

export function Empty({ text }: { text: string }) {
  return <div className="px-4 py-12 text-center text-sm text-slate-400">{text}</div>
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string; count?: number }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
      {items.map(i => (
        <button key={i.id} onClick={() => onChange(i.id)}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${value === i.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          {i.label}
          {i.count !== undefined && <span className={`rounded-full px-1.5 text-[10px] ${value === i.id ? 'bg-brand-50 text-brand-700' : 'bg-slate-200 text-slate-500'}`}>{i.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Logo({ light }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 64 64">
        <rect width="64" height="64" rx="16" fill={light ? '#fff' : '#1d3fbf'} />
        <text x="30" y="45" fontFamily="Plus Jakarta Sans,Arial" fontWeight="800" fontSize="36" textAnchor="middle" fill={light ? '#1d3fbf' : '#fff'}>A</text>
        {[[50, 14], [55, 22], [46, 22], [52, 30]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.4" fill="#5dbb46" />)}
      </svg>
      <div className="leading-none">
        <div className="text-[17px] font-extrabold tracking-tight">
          <span className={light ? 'text-white' : 'text-brand-600'}>Arham</span><span className="text-leaf-500">World</span>
        </div>
        <div className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${light ? 'text-white/50' : 'text-slate-400'}`}>Group CRM</div>
      </div>
    </div>
  )
}
