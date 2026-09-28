import {
  ArrowUpRight, Briefcase, CalendarCheck, CheckCircle2, Circle, Hammer, IndianRupee, LifeBuoy, Sparkles, Target, UserPlus, Wallet,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COMPANIES, companyById } from '../data/companies'
import { USERS } from '../data/seed'
import { STAGES, STAGE_PROB, type CompanyId } from '../data/types'
import { ago, lakh, today } from '../lib/format'
import { useStore } from '../store'
import { Avatar, CompanyTag, Stat } from '../components/ui'

const DAY = 86400000
const inLast = (iso: string, days: number, offset = 0) => {
  const t = Date.now() - new Date(iso).getTime()
  return t >= offset * DAY && t < (offset + days) * DAY
}
const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : 0)

export function ChartTip({ active, payload, label, money = true }: { active?: boolean; payload?: { value: number; name: string; color?: string; payload?: { fill?: string } }[]; label?: string; money?: boolean }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-semibold text-slate-900">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-slate-600">
          <span className="h-2 w-2 rounded-full" style={{ background: p.payload?.fill ?? p.color }} />
          {p.name}: <b className="text-slate-900">{money ? lakh(p.value) : p.value}</b>
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { db, inScope, scope, setScope, user, update } = useStore()
  const leads = inScope(db.leads)
  const deals = inScope(db.deals)
  const projects = inScope(db.projects)
  const tickets = inScope(db.tickets)
  const tasks = inScope(db.tasks)
  const acts = inScope(db.activities)

  const won = deals.filter(d => d.stage === 'Won')
  const open = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost')
  const closed = deals.filter(d => d.stage === 'Won' || d.stage === 'Lost')
  const rev30 = won.filter(d => d.closedAt && inLast(d.closedAt, 30)).reduce((a, d) => a + d.value, 0)
  const revPrev = won.filter(d => d.closedAt && inLast(d.closedAt, 30, 30)).reduce((a, d) => a + d.value, 0)
  const pipe = open.reduce((a, d) => a + d.value, 0)
  const weighted = open.reduce((a, d) => a + (d.value * STAGE_PROB[d.stage]) / 100, 0)
  const newLeads = leads.filter(l => inLast(l.createdAt, 30)).length
  const prevLeads = leads.filter(l => inLast(l.createdAt, 30, 30)).length
  const winRate = closed.length ? Math.round((won.length / closed.length) * 100) : 0
  const activeProj = projects.filter(p => p.stage !== 'Handover').length
  const receivable = projects.reduce((a, p) => a + (p.invoiced - p.received), 0)
  const openTickets = tickets.filter(t => t.status !== 'Resolved')

  const trend = useMemo(() => {
    const out: { m: string; Revenue: number; Leads: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
      const key = d.toISOString().slice(0, 7)
      out.push({
        m: d.toLocaleDateString('en-IN', { month: 'short' }),
        Revenue: won.filter(x => x.closedAt?.slice(0, 7) === key).reduce((a, x) => a + x.value, 0),
        Leads: leads.filter(x => x.createdAt.slice(0, 7) === key).length,
      })
    }
    return out
  }, [won, leads])

  const byCompany = COMPANIES.map(c => ({
    c, name: c.short,
    Revenue: won.filter(d => d.companyId === c.id).reduce((a, d) => a + d.value, 0),
  })).sort((a, b) => b.Revenue - a.Revenue)

  const byService = useMemo(() => {
    const m = new Map<string, number>()
    won.forEach(d => m.set(d.service, (m.get(d.service) ?? 0) + d.value))
    return [...m.entries()].map(([name, Revenue]) => ({ name, Revenue })).sort((a, b) => b.Revenue - a.Revenue).slice(0, 8)
  }, [won])

  const byStage = STAGES.filter(s => s !== 'Won' && s !== 'Lost').map(s => ({
    stage: s, count: open.filter(d => d.stage === s).length, value: open.filter(d => d.stage === s).reduce((a, d) => a + d.value, 0),
  }))
  const maxStage = Math.max(...byStage.map(s => s.value), 1)

  const sources = useMemo(() => {
    const m = new Map<string, number>()
    leads.forEach(l => m.set(l.source, (m.get(l.source) ?? 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [leads])

  const dueTasks = tasks.filter(t => !t.done && t.due <= today()).sort((a, b) => a.due.localeCompare(b.due))
  const todays = dueTasks.slice(0, 6)

  // Cross-sell: customers active with only 1-2 divisions
  const crossSell = useMemo(() => {
    const rel: Record<string, Set<CompanyId>> = {}
    db.deals.filter(d => d.stage === 'Won').forEach(d => { (rel[d.customerId] ??= new Set()).add(d.companyId) })
    const suggest: Record<string, CompanyId[]> = {
      Retail: ['digital', 'displays', 'signages'], Hotels: ['av', 'led', 'space'], Education: ['tech', 'av', 'digital'],
      Healthcare: ['digital', 'tech', 'signages'], Automobile: ['led', 'signages', 'tensile'], Banking: ['digital', 'signages', 'space'],
      'Real Estate': ['tensile', 'signages', 'led'], 'Shopping Malls': ['led', 'digital', 'tensile'],
    }
    return db.customers.map(c => {
      const has = rel[c.id]
      if (!has || has.size > 2) return null
      const opts = (suggest[c.industry] ?? ['led', 'digital', 'studio']).filter(x => !has.has(x))
      if (!opts.length) return null
      return { c, has: [...has], next: opts[0] }
    }).filter(Boolean).slice(0, 5) as { c: typeof db.customers[number]; has: CompanyId[]; next: CompanyId }[]
  }, [db])

  const hello = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const accent = scope === 'all' ? '#1d3fbf' : companyById(scope).color
  const title = scope === 'all' ? 'Group Dashboard' : companyById(scope).name

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{hello}, {user?.name.split(' ')[0]} 👋</p>
          <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {scope === 'all' ? 'All 9 Arham World companies · live snapshot' : companyById(scope).tagline}
            {' · '}{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/reports" className="btn-outline">View reports</Link>
          <Link to="/pipeline" className="btn-primary">Open pipeline <ArrowUpRight size={16} /></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Revenue won · 30d" value={lakh(rev30)} trend={pct(rev30, revPrev)} sub="vs previous 30d" icon={IndianRupee} color="#1d3fbf" />
        <Stat label="Open pipeline" value={lakh(pipe)} sub={`${open.length} deals · weighted ${lakh(weighted)}`} icon={Briefcase} color="#7c3aed" />
        <Stat label="New leads · 30d" value={String(newLeads)} trend={pct(newLeads, prevLeads)} sub="vs previous 30d" icon={UserPlus} color="#0891b2" />
        <Stat label="Win rate" value={`${winRate}%`} sub={`${won.length} won of ${closed.length} closed`} icon={Target} color="#479c33" />
        <Stat label="Active projects" value={String(activeProj)} sub="design → installation" icon={Hammer} color="#e8590c" />
        <Stat label="Payment receivable" value={lakh(receivable)} sub="invoiced, not yet received" icon={Wallet} color="#a16207" />
        <Stat label="Open service tickets" value={String(openTickets.length)} sub={`${openTickets.filter(t => t.priority === 'Critical' || t.priority === 'High').length} high / critical`} icon={LifeBuoy} color="#dc2626" />
        <Stat label="Tasks due today" value={String(dueTasks.length)} sub="incl. overdue follow-ups" icon={CalendarCheck} color="#059669" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div><h3 className="font-bold">Revenue won</h3><p className="text-xs text-slate-500">Last 6 months · value of deals closed-won</p></div>
            <p className="text-lg font-extrabold">{lakh(trend.reduce((a, t) => a + t.Revenue, 0))}</p>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <AreaChart data={trend} margin={{ left: 0, right: 8, top: 14 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={accent} stopOpacity={0.22} /><stop offset="1" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tickFormatter={v => lakh(v)} tickLine={false} axisLine={false} width={64} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip content={<ChartTip />} cursor={{ stroke: '#cbd5e1' }} />
                <Area type="monotone" dataKey="Revenue" stroke={accent} strokeWidth={2} fill="url(#g1)" dot={{ r: 3.5, fill: accent, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold">Pipeline by stage</h3>
          <p className="text-xs text-slate-500">Open deals · {lakh(pipe)}</p>
          <div className="mt-5 space-y-4">
            {byStage.map(s => (
              <div key={s.stage}>
                <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{s.stage} <span className="text-slate-400">· {s.count}</span></span><span className="font-bold">{lakh(s.value)}</span></div>
                <div className="h-2.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${(s.value / maxStage) * 100}%`, opacity: 0.45 + STAGE_PROB[s.stage] / 150 }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Weighted forecast <b className="float-right text-sm text-slate-900">{lakh(weighted)}</b></div>
        </div>
      </div>

      {scope === 'all' && <Scorecard onPick={setScope} />}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <h3 className="font-bold">{scope === 'all' ? 'Revenue by company' : 'Revenue by service'}</h3>
          <p className="text-xs text-slate-500">All-time closed-won value</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              {scope === 'all' ? (
                <BarChart data={byCompany} margin={{ left: 0, right: 8, top: 14 }} barCategoryGap="28%">
                  <CartesianGrid vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis tickFormatter={v => lakh(v)} tickLine={false} axisLine={false} width={64} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="Revenue" radius={[4, 4, 0, 0]} maxBarSize={44}>
                    {byCompany.map(b => <Cell key={b.c.id} fill={b.c.color} />)}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart data={byService} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} stroke="#eef2f7" />
                  <XAxis type="number" tickFormatter={v => lakh(v)} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="name" width={150} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#475569' }} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="Revenue" radius={[0, 4, 4, 0]} maxBarSize={22} fill={companyById(scope).color} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold">Lead sources</h3>
          <p className="text-xs text-slate-500">{leads.length} leads in total</p>
          <div className="mt-5 space-y-3">
            {sources.map(([s, n]) => (
              <div key={s} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 truncate text-slate-600">{s}</span>
                <div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-full rounded-full bg-leaf-500" style={{ width: `${(n / sources[0][1]) * 100}%` }} /></div>
                <span className="w-8 text-right font-bold">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center justify-between"><h3 className="font-bold">Today's follow-ups</h3><Link to="/tasks" className="text-xs font-semibold text-brand-600">All tasks →</Link></div>
          <div className="mt-3 divide-y divide-slate-100">
            {todays.length === 0 && <p className="py-8 text-center text-sm text-slate-400">All caught up 🎉</p>}
            {todays.map(t => (
              <div key={t.id} className="flex items-start gap-3 py-2.5">
                <button onClick={() => update('tasks', t.id, { done: true })} className="mt-0.5 text-slate-300 hover:text-emerald-500"><Circle size={18} /></button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    <CompanyTag id={t.companyId} /> {t.type} · {t.due < today() ? <span className="font-semibold text-rose-600">Overdue</span> : 'Today'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold">Recent activity</h3>
          <div className="mt-3 space-y-3.5">
            {acts.slice(0, 7).map(a => {
              const u = USERS.find(x => x.id === a.userId)
              return (
                <div key={a.id} className="flex gap-3">
                  <Avatar name={u?.name ?? '?'} size={28} />
                  <div className="min-w-0">
                    <p className="text-sm leading-snug">{a.text}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-400"><CompanyTag id={a.companyId} />{u?.name} · {ago(a.at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2"><Sparkles size={16} className="text-amber-500" /><h3 className="font-bold">Cross-sell opportunities</h3></div>
          <p className="text-xs text-slate-500">Existing clients who can buy from another Arham company</p>
          <div className="mt-3 divide-y divide-slate-100">
            {crossSell.map(x => (
              <Link to={`/customers/${x.c.id}`} key={x.c.id} className="flex items-center gap-3 py-2.5 hover:opacity-80">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{x.c.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">Buys {x.has.map(h => <CompanyTag key={h} id={h} />)}</p>
                </div>
                <div className="text-right text-xs"><p className="text-slate-400">Pitch</p><CompanyTag id={x.next} /></div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {openTickets.some(t => t.priority === 'Critical') && (
        <div className="card flex flex-wrap items-center gap-4 border-rose-200 bg-rose-50/60 p-4">
          <LifeBuoy className="text-rose-600" />
          <p className="flex-1 text-sm"><b>{openTickets.filter(t => t.priority === 'Critical').length} critical service tickets</b> are open — clients under AMC are waiting.</p>
          <Link to="/service" className="btn-outline">Review tickets</Link>
        </div>
      )}
    </div>
  )
}

function Scorecard({ onPick }: { onPick: (c: CompanyId) => void }) {
  const { db } = useStore()
  const rows = COMPANIES.map(c => {
    const d = db.deals.filter(x => x.companyId === c.id)
    const open = d.filter(x => x.stage !== 'Won' && x.stage !== 'Lost')
    const won = d.filter(x => x.stage === 'Won')
    const closed = d.filter(x => x.stage === 'Won' || x.stage === 'Lost').length
    return {
      c,
      leads: db.leads.filter(x => x.companyId === c.id && x.status !== 'Converted' && x.status !== 'Unqualified').length,
      open: open.length, pipe: open.reduce((a, x) => a + x.value, 0),
      won: won.reduce((a, x) => a + x.value, 0), rate: closed ? Math.round((won.length / closed) * 100) : 0,
      proj: db.projects.filter(x => x.companyId === c.id && x.stage !== 'Handover').length,
      tickets: db.tickets.filter(x => x.companyId === c.id && x.status !== 'Resolved').length,
    }
  }).sort((a, b) => b.won - a.won)
  const max = Math.max(...rows.map(r => r.won))
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5">
        <div><h3 className="font-bold">Company scorecard</h3><p className="text-xs text-slate-500">All 9 divisions side by side · click a row to drill in</p></div>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full">
          <thead className="border-y border-slate-100 bg-slate-50/60">
            <tr><th className="th">Company</th><th className="th">Active leads</th><th className="th">Open deals</th><th className="th">Pipeline</th><th className="th">Revenue won</th><th className="th">Win rate</th><th className="th">Live projects</th><th className="th">Open tickets</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(r => (
              <tr key={r.c.id} onClick={() => onPick(r.c.id)} className="cursor-pointer hover:bg-slate-50">
                <td className="td"><span className="flex items-center gap-2.5 font-semibold text-slate-900"><span className="h-8 w-1.5 rounded-full" style={{ background: r.c.color }} />{r.c.name}</span></td>
                <td className="td">{r.leads}</td>
                <td className="td">{r.open}</td>
                <td className="td font-medium">{lakh(r.pipe)}</td>
                <td className="td">
                  <div className="flex items-center gap-2"><span className="w-20 font-bold text-slate-900">{lakh(r.won)}</span>
                    <div className="hidden h-1.5 w-24 rounded-full bg-slate-100 md:block"><div className="h-full rounded-full" style={{ width: `${(r.won / max) * 100}%`, background: r.c.color }} /></div></div>
                </td>
                <td className="td">{r.rate}%</td>
                <td className="td">{r.proj}</td>
                <td className="td">{r.tickets > 0 ? <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.tickets > 3 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{r.tickets} open</span> : <CheckCircle2 size={16} className="text-emerald-500" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
