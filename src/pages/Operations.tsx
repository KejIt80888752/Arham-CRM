import { Check, IndianRupee, MapPin, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TaskForm, TicketForm } from '../components/forms'
import { CompanyTag, Empty, Field, Modal, PageHeader, Stat, Status, Tabs, UserChip } from '../components/ui'
import { USERS } from '../data/seed'
import { PROJECT_STAGES, type Project, type TaskType, type TicketStatus } from '../data/types'
import { ago, date, lakh, money, shortDate, today } from '../lib/format'
import { useStore } from '../store'
import { AlertTriangle, CalendarClock, Clock3, Hammer, LifeBuoy, ShieldCheck, Wallet } from 'lucide-react'

/* ───────────────────────── Projects ───────────────────────── */

export function Projects() {
  const { db, inScope, update, log } = useStore()
  const [tab, setTab] = useState<'active' | 'all' | 'Handover'>('active')
  const [pay, setPay] = useState<Project | null>(null)
  const [amt, setAmt] = useState(0)
  const all = inScope(db.projects)
  const rows = all.filter(p => tab === 'all' || (tab === 'active' ? p.stage !== 'Handover' : p.stage === 'Handover'))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const recv = all.reduce((a, p) => a + p.invoiced - p.received, 0)
  const late = all.filter(p => p.stage !== 'Handover' && new Date(p.dueDate) < new Date()).length

  const advance = (p: Project) => {
    const i = PROJECT_STAGES.indexOf(p.stage)
    if (i >= PROJECT_STAGES.length - 1) return
    const next = PROJECT_STAGES[i + 1]
    update('projects', p.id, { stage: next })
    log({ text: `${p.name} → ${next}`, companyId: p.companyId, customerId: p.customerId, kind: 'project' })
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Projects & Installations" subtitle="Every won order tracked from design → production → dispatch → installation → handover, with billing." />
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Live projects" value={String(all.filter(p => p.stage !== 'Handover').length)} icon={Hammer} color="#e8590c" />
        <Stat label="Order book value" value={lakh(all.filter(p => p.stage !== 'Handover').reduce((a, p) => a + p.value, 0))} icon={IndianRupee} color="#1d3fbf" />
        <Stat label="Receivable" value={lakh(recv)} sub="invoiced − received" icon={Wallet} color="#a16207" />
        <Stat label="Past due date" value={String(late)} sub="need attention" icon={AlertTriangle} color="#dc2626" />
      </div>

      <div className="card">
        <div className="border-b border-slate-100 p-4">
          <Tabs value={tab} onChange={setTab} items={[{ id: 'active', label: 'In progress' }, { id: 'Handover', label: 'Handed over' }, { id: 'all', label: 'All' }]} />
        </div>
        <div className="divide-y divide-slate-100">
          {rows.map(p => {
            const idx = PROJECT_STAGES.indexOf(p.stage)
            const c = db.customers.find(x => x.id === p.customerId)
            const overdue = p.stage !== 'Handover' && new Date(p.dueDate) < new Date()
            return (
              <div key={p.id} className="grid gap-4 p-4 lg:grid-cols-[1.4fr_2fr_1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><CompanyTag id={p.companyId} /><span className="text-xs text-slate-400">{lakh(p.value)}</span></div>
                  <p className="mt-1 truncate font-semibold">{p.name}</p>
                  <Link to={`/customers/${p.customerId}`} className="flex items-center gap-1 truncate text-xs text-slate-500 hover:text-brand-600"><MapPin size={12} />{c?.name}, {c?.city}</Link>
                </div>
                <div>
                  <div className="flex items-center">
                    {PROJECT_STAGES.map((s, i) => (
                      <div key={s} className="flex flex-1 items-center last:flex-none">
                        <div title={s} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${i < idx ? 'bg-leaf-500 text-white' : i === idx ? 'bg-brand-600 text-white ring-4 ring-brand-100' : 'bg-slate-100 text-slate-400'}`}>
                          {i < idx ? <Check size={12} /> : i + 1}
                        </div>
                        {i < PROJECT_STAGES.length - 1 && <div className={`h-0.5 flex-1 ${i < idx ? 'bg-leaf-500' : 'bg-slate-200'}`} />}
                      </div>
                    ))}
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {PROJECT_STAGES.map(s => <span key={s} className={s === p.stage ? 'text-brand-700' : ''}>{s}</span>)}
                  </div>
                </div>
                <div className="text-sm">
                  <p className={overdue ? 'font-semibold text-rose-600' : 'text-slate-600'}>Due {shortDate(p.dueDate)}{overdue && ' · late'}</p>
                  <p className="text-xs text-slate-500">Received {lakh(p.received)} of {lakh(p.invoiced || p.value)}</p>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100"><div className="h-full rounded-full bg-leaf-500" style={{ width: `${Math.min(100, (p.received / p.value) * 100)}%` }} /></div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-outline !px-2.5" onClick={() => { setPay(p); setAmt(Math.max(0, p.value - p.received)) }}><IndianRupee size={15} />Payment</button>
                  {p.stage !== 'Handover' && <button className="btn-primary !px-3" onClick={() => advance(p)}>Next stage</button>}
                </div>
              </div>
            )
          })}
          {!rows.length && <Empty text="No projects here." />}
        </div>
      </div>

      <Modal open={!!pay} onClose={() => setPay(null)} title="Record payment">
        {pay && (
          <div>
            <p className="text-sm text-slate-600">{pay.name}</p>
            <div className="mt-3 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3 text-center text-sm">
              <div><p className="label">Order value</p><b>{money(pay.value)}</b></div>
              <div><p className="label">Received</p><b>{money(pay.received)}</b></div>
              <div><p className="label">Balance</p><b className="text-rose-600">{money(pay.value - pay.received)}</b></div>
            </div>
            <Field label="Amount received (₹)" className="mt-4"><input type="number" className="input" value={amt} onChange={e => setAmt(+e.target.value)} /></Field>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setPay(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => {
                const received = pay.received + amt
                update('projects', pay.id, { received, invoiced: Math.max(pay.invoiced, received) })
                log({ text: `Payment ${lakh(amt)} received — ${pay.name}`, companyId: pay.companyId, customerId: pay.customerId, kind: 'project' })
                setPay(null)
              }}>Save payment</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ───────────────────────── Service & AMC ───────────────────────── */

export function Service() {
  const { db, inScope, update, log } = useStore()
  const [tab, setTab] = useState<TicketStatus | 'All'>('Open')
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)
  const all = inScope(db.tickets)
  const rows = all.filter(t => tab === 'All' || t.status === tab)
    .filter(t => !q || `${t.number} ${t.subject} ${db.customers.find(c => c.id === t.customerId)?.name}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const engineers = USERS.filter(u => u.role === 'Service Engineer')

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Service & AMC" subtitle="After-sales service requests for LED walls, AV systems, kiosks, signages and more.">
        <button className="btn-primary" onClick={() => setCreating(true)}><Plus size={16} />New ticket</button>
      </PageHeader>
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Open" value={String(all.filter(t => t.status === 'Open').length)} icon={LifeBuoy} color="#dc2626" />
        <Stat label="In progress" value={String(all.filter(t => t.status === 'In Progress').length)} icon={Clock3} color="#f59e0b" />
        <Stat label="Resolved" value={String(all.filter(t => t.status === 'Resolved').length)} icon={Check} color="#479c33" />
        <Stat label="Under AMC" value={`${all.length ? Math.round((all.filter(t => t.amc).length / all.length) * 100) : 0}%`} sub="of all tickets" icon={ShieldCheck} color="#1d3fbf" />
      </div>
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <Tabs value={tab} onChange={setTab} items={(['Open', 'In Progress', 'Resolved', 'All'] as const).map(s => ({ id: s, label: s, count: s === 'All' ? all.length : all.filter(t => t.status === s).length }))} />
          <div className="relative ml-auto"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input !w-60 !pl-9" placeholder="Search tickets" value={q} onChange={e => setQ(e.target.value)} /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/60"><tr><th className="th">Ticket</th><th className="th">Customer</th><th className="th">Company</th><th className="th">Priority</th><th className="th">Coverage</th><th className="th">Engineer</th><th className="th">Raised</th><th className="th">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(t => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="td"><p className="font-semibold text-slate-900">{t.subject}</p><p className="text-xs text-slate-400">{t.number}</p></td>
                  <td className="td"><Link className="hover:text-brand-600" to={`/customers/${t.customerId}`}>{db.customers.find(c => c.id === t.customerId)?.name}</Link></td>
                  <td className="td"><CompanyTag id={t.companyId} /></td>
                  <td className="td"><Status s={t.priority} /></td>
                  <td className="td">{t.amc ? <span className="text-xs font-semibold text-brand-700">AMC / Warranty</span> : <span className="text-xs text-slate-500">Chargeable</span>}</td>
                  <td className="td">
                    <select className="rounded-lg border-0 bg-transparent text-sm outline-none" value={t.assigneeId} onChange={e => update('tickets', t.id, { assigneeId: e.target.value })}>
                      {engineers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </td>
                  <td className="td text-slate-500">{ago(t.createdAt)}</td>
                  <td className="td">
                    <select value={t.status} onChange={e => { update('tickets', t.id, { status: e.target.value as TicketStatus }); log({ text: `${t.number} → ${e.target.value}`, companyId: t.companyId, customerId: t.customerId, kind: 'ticket' }) }}
                      className={`rounded-lg px-2 py-1 text-xs font-semibold outline-none ${t.status === 'Open' ? 'bg-rose-50 text-rose-700' : t.status === 'In Progress' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {['Open', 'In Progress', 'Resolved'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <Empty text="No tickets." />}
        </div>
      </div>
      <Modal open={creating} onClose={() => setCreating(false)} title="New service request"><TicketForm onDone={() => setCreating(false)} /></Modal>
    </div>
  )
}

/* ───────────────────────── Tasks ───────────────────────── */

const TYPE_ICON: Record<TaskType, string> = { Call: '📞', Meeting: '🤝', 'Site Visit': '📍', Email: '✉️', 'Follow-up': '🔁' }

export function Tasks() {
  const { db, inScope, update, user } = useStore()
  const [mine, setMine] = useState(false)
  const [creating, setCreating] = useState(false)
  const all = inScope(db.tasks).filter(t => !mine || t.ownerId === user?.id)
  const t0 = today()
  const groups = [
    { k: 'Overdue', list: all.filter(t => !t.done && t.due < t0), tone: 'text-rose-600', icon: AlertTriangle },
    { k: 'Today', list: all.filter(t => !t.done && t.due === t0), tone: 'text-brand-600', icon: CalendarClock },
    { k: 'Upcoming', list: all.filter(t => !t.done && t.due > t0), tone: 'text-slate-700', icon: Clock3 },
    { k: 'Completed', list: all.filter(t => t.done), tone: 'text-emerald-600', icon: Check },
  ]
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Tasks & Follow-ups" subtitle="Calls, meetings, site visits and payment follow-ups for the whole sales team.">
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={mine} onChange={e => setMine(e.target.checked)} />Only mine</label>
        <button className="btn-primary" onClick={() => setCreating(true)}><Plus size={16} />New task</button>
      </PageHeader>
      <div className="space-y-5">
        {groups.map(g => (
          <div key={g.k} className="card">
            <div className={`flex items-center gap-2 border-b border-slate-100 px-5 py-3 font-bold ${g.tone}`}><g.icon size={16} />{g.k}<span className="rounded-full bg-slate-100 px-2 text-xs text-slate-500">{g.list.length}</span></div>
            {g.list.length === 0 ? <Empty text="Nothing here." /> : (
              <div className="divide-y divide-slate-100">
                {g.list.sort((a, b) => a.due.localeCompare(b.due)).slice(0, g.k === 'Completed' ? 8 : 50).map(t => (
                  <div key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={t.done} onChange={e => update('tasks', t.id, { done: e.target.checked })} />
                    <span className="text-lg">{TYPE_ICON[t.type]}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${t.done ? 'text-slate-400 line-through' : ''}`}>{t.title}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500"><CompanyTag id={t.companyId} />{t.type} · {date(t.due)}</p>
                    </div>
                    <UserChip id={t.ownerId} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <Modal open={creating} onClose={() => setCreating(false)} title="New task / follow-up"><TaskForm onDone={() => setCreating(false)} /></Modal>
    </div>
  )
}
