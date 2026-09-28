import { ArrowUpRight, Download, Globe, Mail, Phone } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Avatar, Badge, CompanyTag, PageHeader, Tabs } from '../components/ui'
import { COMPANIES, GROUP, companyById } from '../data/companies'
import { USERS } from '../data/seed'
import type { CompanyId } from '../data/types'
import { downloadCSV, lakh } from '../lib/format'
import { useStore } from '../store'
import { ChartTip } from './Dashboard'

/* ───────────────────────── Companies ───────────────────────── */

export function Companies() {
  const { db, setScope } = useStore()
  const nav = useNavigate()
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Our Companies" subtitle={`${GROUP.name} ${GROUP.subtitle} — ${COMPANIES.length} companies, one CRM.`} />
      <div className="card mb-6 flex flex-wrap items-center gap-6 bg-gradient-to-r from-brand-900 to-brand-700 p-6 text-white">
        <div className="flex-1">
          <p className="text-xl font-extrabold">Arham<span className="text-leaf-500">World</span> <span className="text-sm font-medium text-white/60">{GROUP.subtitle}</span></p>
          <p className="mt-1 text-sm text-white/70">3D Designing · Branding · Digital Signages · LED Signages · LED Video Walls · AV · Interiors</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-white/60"><Globe size={13} />{GROUP.website} · {GROUP.phone}</p>
        </div>
        {[[GROUP.stats.clients, 'Clients'], [GROUP.stats.offices, 'Offices'], [GROUP.stats.team, 'Team members'], [GROUP.stats.plants, 'Mfg. plants']].map(([v, l]) => (
          <div key={l} className="text-center"><p className="text-2xl font-extrabold">{v}</p><p className="text-xs text-white/60">{l}</p></div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {COMPANIES.map(c => {
          const deals = db.deals.filter(d => d.companyId === c.id)
          const won = deals.filter(d => d.stage === 'Won').reduce((a, d) => a + d.value, 0)
          const open = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost').reduce((a, d) => a + d.value, 0)
          const team = USERS.filter(u => u.companyId === c.id)
          return (
            <div key={c.id} className="card flex flex-col overflow-hidden">
              <div className="h-1.5" style={{ background: c.color }} />
              <div className="flex-1 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-extrabold" style={{ color: c.color }}>{c.name}</p>
                    <p className="text-xs italic text-slate-500">{c.tagline}</p>
                  </div>
                  <a href={`https://${c.website}`} target="_blank" rel="noreferrer" className="btn-ghost !p-1.5" title={c.website}><Globe size={16} /></a>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {c.services.map(s => <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{s}</span>)}
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                  <div><p className="text-[10px] font-bold uppercase text-slate-400">Won</p><p className="font-extrabold">{lakh(won)}</p></div>
                  <div><p className="text-[10px] font-bold uppercase text-slate-400">Pipeline</p><p className="font-extrabold">{lakh(open)}</p></div>
                  <div><p className="text-[10px] font-bold uppercase text-slate-400">Team</p><p className="font-extrabold">{team.length || '—'}</p></div>
                </div>
              </div>
              <button onClick={() => { setScope(c.id); nav('/') }} className="flex items-center justify-center gap-1.5 border-t border-slate-100 py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50">
                Open {c.short} dashboard <ArrowUpRight size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ───────────────────────── Reports ───────────────────────── */

export function Reports() {
  const { db, inScope, scope } = useStore()
  const [range, setRange] = useState<'30' | '90' | '365'>('90')
  const since = Date.now() - +range * 86400000
  const leads = inScope(db.leads).filter(l => +new Date(l.createdAt) >= since)
  const deals = inScope(db.deals).filter(d => +new Date(d.createdAt) >= since)
  const won = inScope(db.deals).filter(d => d.stage === 'Won' && d.closedAt && +new Date(d.closedAt) >= since)

  const funnel = [
    { k: 'Leads', v: leads.length },
    { k: 'Qualified / converted', v: leads.filter(l => l.status === 'Qualified' || l.status === 'Converted').length },
    { k: 'Deals created', v: deals.length },
    { k: 'Quoted', v: deals.filter(d => ['Design & Quote', 'Negotiation', 'Won', 'Lost'].includes(d.stage)).length },
    { k: 'Won', v: won.length },
  ]

  const people = useMemo(() => USERS.map(u => {
    const mine = won.filter(d => d.ownerId === u.id)
    return { u, deals: mine.length, value: mine.reduce((a, d) => a + d.value, 0), open: inScope(db.deals).filter(d => d.ownerId === u.id && d.stage !== 'Won' && d.stage !== 'Lost').length }
  }).filter(x => x.deals || x.open).sort((a, b) => b.value - a.value), [won, db, inScope])

  const monthly = useMemo(() => {
    const out: Record<string, string | number>[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
      const key = d.toISOString().slice(0, 7)
      const row: Record<string, string | number> = { m: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) }
      COMPANIES.forEach(c => { row[c.short] = db.deals.filter(x => x.companyId === c.id && x.stage === 'Won' && x.closedAt?.slice(0, 7) === key).reduce((a, x) => a + x.value, 0) })
      out.push(row)
    }
    return out
  }, [db])

  const lost = inScope(db.deals).filter(d => d.stage === 'Lost')
  const byInd = useMemo(() => {
    const m = new Map<string, number>()
    won.forEach(d => { const ind = db.customers.find(c => c.id === d.customerId)?.industry ?? 'Other'; m.set(ind, (m.get(ind) ?? 0) + d.value) })
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [won, db])

  const cols: CompanyId[] = scope === 'all' ? COMPANIES.map(c => c.id) : [scope]

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <PageHeader title="Reports" subtitle={scope === 'all' ? 'Group-wide sales performance' : companyById(scope).name}>
        <Tabs value={range} onChange={setRange} items={[{ id: '30', label: '30 days' }, { id: '90', label: '90 days' }, { id: '365', label: '1 year' }]} />
        <button className="btn-outline" onClick={() => downloadCSV('arham-won-deals', won.map(d => ({ Deal: d.title, Company: companyById(d.companyId).name, Customer: db.customers.find(c => c.id === d.customerId)?.name, Value: d.value, Owner: USERS.find(u => u.id === d.ownerId)?.name, Closed: d.closedAt?.slice(0, 10) })))}><Download size={16} />Export won deals</button>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-bold">Sales funnel</h3>
          <p className="text-xs text-slate-500">Last {range} days</p>
          <div className="mt-5 space-y-2">
            {funnel.map((f, i) => (
              <div key={f.k} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-sm text-slate-600">{f.k}</span>
                <div className="h-9 flex-1">
                  <div className="flex h-full items-center rounded-lg bg-brand-600 px-3 text-sm font-bold text-white" style={{ width: `${Math.max(8, (f.v / Math.max(funnel[0].v, 1)) * 100)}%`, opacity: 1 - i * 0.14 }}>{f.v}</div>
                </div>
                <span className="w-12 text-right text-xs text-slate-400">{i ? `${Math.round((f.v / Math.max(funnel[i - 1].v, 1)) * 100)}%` : ''}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold">Top performers</h3>
          <p className="text-xs text-slate-500">Revenue won · last {range} days</p>
          <div className="mt-4 divide-y divide-slate-100">
            {people.slice(0, 7).map((p, i) => (
              <div key={p.u.id} className="flex items-center gap-3 py-2.5">
                <span className="w-5 text-sm font-bold text-slate-300">{i + 1}</span>
                <Avatar name={p.u.name} size={30} />
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{p.u.name}</p><p className="text-xs text-slate-500">{p.deals} won · {p.open} open</p></div>
                <span className="font-extrabold">{lakh(p.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold">Monthly revenue by company</h3>
        <p className="text-xs text-slate-500">Closed-won value, stacked</p>
        <div className="mt-3 flex flex-wrap gap-3">{cols.map(id => { const c = companyById(id); return <span key={id} className="flex items-center gap-1.5 text-xs text-slate-600"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} />{c.name.replace('Arham ', '')}</span> })}</div>
        <div className="mt-3 h-80">
          <ResponsiveContainer>
            <BarChart data={monthly} margin={{ left: 0, right: 8, top: 8 }} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tickFormatter={v => lakh(v)} tickLine={false} axisLine={false} width={64} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip content={<ChartTip />} cursor={{ fill: '#f1f5f9' }} />
              {cols.map((id, i) => { const c = companyById(id); return <Bar key={id} dataKey={c.short} name={c.name} stackId="a" fill={c.color} stroke="#fff" strokeWidth={1} radius={i === cols.length - 1 ? [4, 4, 0, 0] : 0} maxBarSize={56} /> })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-bold">Revenue by industry</h3>
          <div className="mt-4 space-y-3">
            {byInd.map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 text-sm">
                <span className="w-32 shrink-0 truncate text-slate-600">{k}</span>
                <div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${(v / byInd[0][1]) * 100}%` }} /></div>
                <span className="w-16 text-right font-bold">{lakh(v)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-bold">Lost deals</h3>
          <p className="text-xs text-slate-500">{lost.length} deals · {lakh(lost.reduce((a, d) => a + d.value, 0))} lost value</p>
          <div className="mt-3 divide-y divide-slate-100">
            {lost.slice(0, 6).map(d => (
              <div key={d.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate"><CompanyTag id={d.companyId} /> <span className="ml-1">{d.title}</span></span>
                <span className="font-semibold text-rose-600">{lakh(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── Team ───────────────────────── */

export function Team() {
  const { db } = useStore()
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Team" subtitle="Users and roles across the group. Company heads see their company; group admins see everything." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {USERS.map(u => {
          const won = db.deals.filter(d => d.ownerId === u.id && d.stage === 'Won').reduce((a, d) => a + d.value, 0)
          const open = db.deals.filter(d => d.ownerId === u.id && d.stage !== 'Won' && d.stage !== 'Lost').length
          const tasks = db.tasks.filter(t => t.ownerId === u.id && !t.done).length
          return (
            <div key={u.id} className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar name={u.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{u.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone={u.role === 'Group Admin' ? 'violet' : u.role === 'Company Head' ? 'blue' : u.role.includes('Service') ? 'amber' : 'slate'}>{u.role}</Badge>
                    {u.companyId === 'group' ? <Badge tone="green">All companies</Badge> : <CompanyTag id={u.companyId} />}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-xs text-slate-500">
                <p className="flex items-center gap-2"><Phone size={13} />{u.phone}</p>
                <p className="flex items-center gap-2"><Mail size={13} />{u.email}</p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                <div><p className="text-[10px] font-bold uppercase text-slate-400">Won</p><p className="text-sm font-extrabold">{lakh(won)}</p></div>
                <div><p className="text-[10px] font-bold uppercase text-slate-400">Open deals</p><p className="text-sm font-extrabold">{open}</p></div>
                <div><p className="text-[10px] font-bold uppercase text-slate-400">Pending tasks</p><p className="text-sm font-extrabold">{tasks}</p></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
