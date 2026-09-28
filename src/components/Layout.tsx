import {
  BarChart3, Bell, Briefcase, Building2, CalendarCheck, ChevronDown, ClipboardList, FileText, Hammer,
  LayoutDashboard, LifeBuoy, LogOut, Menu, Plus, RotateCcw, Search, UserPlus, Users, UsersRound, X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { COMPANIES, companyById } from '../data/companies'
import { today } from '../lib/format'
import { useStore } from '../store'
import { DealForm, LeadForm, TaskForm, TicketForm, CustomerForm } from './forms'
import { Avatar, Logo, Modal } from './ui'

const NAV = [
  { group: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    group: 'Sales', items: [
      { to: '/leads', label: 'Leads', icon: UserPlus },
      { to: '/pipeline', label: 'Deals Pipeline', icon: Briefcase },
      { to: '/quotes', label: 'Quotations', icon: FileText },
      { to: '/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    group: 'Operations', items: [
      { to: '/projects', label: 'Projects & Installs', icon: Hammer },
      { to: '/service', label: 'Service & AMC', icon: LifeBuoy },
      { to: '/tasks', label: 'Tasks & Follow-ups', icon: CalendarCheck },
    ],
  },
  {
    group: 'Group', items: [
      { to: '/companies', label: 'Our Companies', icon: Building2 },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
      { to: '/team', label: 'Team', icon: UsersRound },
    ],
  },
]

type Quick = 'lead' | 'deal' | 'task' | 'ticket' | 'customer' | null

export default function Layout() {
  const { user, logout, scope, setScope, db, reset } = useStore()
  const [mobile, setMobile] = useState(false)
  const [quick, setQuick] = useState<Quick>(null)
  const loc = useLocation()
  useEffect(() => setMobile(false), [loc.pathname])

  const overdue = db.tasks.filter(t => !t.done && t.due <= today() && (scope === 'all' || t.companyId === scope)).length

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className={`no-print fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-900 text-white transition-transform lg:static lg:translate-x-0 ${mobile ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-5">
          <Logo light />
          <button className="text-white/60 lg:hidden" onClick={() => setMobile(false)}><X size={20} /></button>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {NAV.map(g => (
            <div key={g.group}>
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">{g.group}</p>
              {g.items.map(i => (
                <NavLink key={i.to} to={i.to} end={i.to === '/'}
                  className={({ isActive }) => `mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-white text-brand-900 shadow' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                  <i.icon size={17} />{i.label}
                  {i.to === '/tasks' && overdue > 0 && <span className="ml-auto rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{overdue}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="m-3 rounded-2xl bg-white/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Divisions</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {COMPANIES.map(c => (
              <button key={c.id} title={c.name} onClick={() => setScope(scope === c.id ? 'all' : c.id)}
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition ${scope === c.id ? 'ring-2 ring-white' : 'opacity-80 hover:opacity-100'}`}
                style={{ background: c.color }}>{c.short}</button>
            ))}
          </div>
        </div>
      </aside>
      {mobile && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setMobile(false)} />}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200/70 bg-white/85 px-4 py-3 backdrop-blur lg:px-8">
          <button className="btn-ghost !p-2 lg:hidden" onClick={() => setMobile(true)}><Menu size={20} /></button>
          <ScopeSwitcher />
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            <QuickAdd onPick={setQuick} />
            <NavLink to="/tasks" className="btn-ghost relative !p-2" title="Due & overdue tasks">
              <Bell size={19} />
              {overdue > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />}
            </NavLink>
            <UserMenu name={user!.name} role={user!.role} onLogout={logout} onReset={reset} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <Modal open={quick === 'lead'} onClose={() => setQuick(null)} title="New lead"><LeadForm onDone={() => setQuick(null)} /></Modal>
      <Modal open={quick === 'deal'} onClose={() => setQuick(null)} title="New deal"><DealForm onDone={() => setQuick(null)} /></Modal>
      <Modal open={quick === 'task'} onClose={() => setQuick(null)} title="New task / follow-up"><TaskForm onDone={() => setQuick(null)} /></Modal>
      <Modal open={quick === 'ticket'} onClose={() => setQuick(null)} title="New service request"><TicketForm onDone={() => setQuick(null)} /></Modal>
      <Modal open={quick === 'customer'} onClose={() => setQuick(null)} title="New customer"><CustomerForm onDone={() => setQuick(null)} /></Modal>
    </div>
  )
}

function useClickAway(cb: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [cb])
  return ref
}

function ScopeSwitcher() {
  const { scope, setScope } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useClickAway(() => setOpen(false))
  const cur = scope === 'all' ? null : companyById(scope)
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: cur?.color ?? 'conic-gradient(#1d3fbf,#5dbb46,#f08a24,#7c3aed,#1d3fbf)' }} />
        <span className="max-w-[9rem] truncate sm:max-w-none">{cur?.name ?? 'All Companies'}</span>
        <ChevronDown size={15} className="text-slate-400" />
      </button>
      {open && (
        <div className="card absolute left-0 top-12 z-30 w-72 p-1.5 shadow-xl">
          <button onClick={() => { setScope('all'); setOpen(false) }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${scope === 'all' ? 'bg-brand-50 font-semibold text-brand-700' : 'hover:bg-slate-50'}`}>
            <Building2 size={16} /> All Companies <span className="ml-auto text-[10px] font-bold text-slate-400">GROUP</span>
          </button>
          <div className="my-1 border-t border-slate-100" />
          {COMPANIES.map(c => (
            <button key={c.id} onClick={() => { setScope(c.id); setOpen(false) }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${scope === c.id ? 'bg-brand-50 font-semibold text-brand-700' : 'hover:bg-slate-50'}`}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />{c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function GlobalSearch() {
  const { db } = useStore()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const ref = useClickAway(() => setOpen(false))
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus() } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 2) return []
    const r: { label: string; sub: string; to: string; kind: string }[] = []
    db.customers.filter(c => `${c.name} ${c.contact} ${c.phone}`.toLowerCase().includes(s)).slice(0, 5)
      .forEach(c => r.push({ label: c.name, sub: `${c.contact} · ${c.city}`, to: `/customers/${c.id}`, kind: 'Customer' }))
    db.leads.filter(l => `${l.org} ${l.contact} ${l.phone}`.toLowerCase().includes(s)).slice(0, 4)
      .forEach(l => r.push({ label: l.org, sub: `${l.contact} · ${l.service}`, to: `/leads?open=${l.id}`, kind: 'Lead' }))
    db.deals.filter(d => d.title.toLowerCase().includes(s)).slice(0, 4)
      .forEach(d => r.push({ label: d.title, sub: d.stage, to: `/customers/${d.customerId}`, kind: 'Deal' }))
    db.quotes.filter(x => x.number.toLowerCase().includes(s)).slice(0, 3)
      .forEach(x => r.push({ label: x.number, sub: x.status, to: `/quotes/${x.id}`, kind: 'Quote' }))
    return r
  }, [q, db])
  return (
    <div ref={ref} className="relative hidden flex-1 md:block md:max-w-md">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input ref={inputRef} className="input !rounded-xl !bg-slate-50 !pl-9" placeholder="Search customers, leads, deals, quotes…"
        value={q} onChange={e => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} />
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 text-[10px] font-semibold text-slate-400">⌘K</kbd>
      {open && results.length > 0 && (
        <div className="card absolute left-0 right-0 top-12 z-30 max-h-96 overflow-y-auto p-1.5 shadow-xl">
          {results.map((r, i) => (
            <button key={i} onClick={() => { nav(r.to); setOpen(false); setQ('') }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50">
              <span className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">{r.kind}</span>
              <span className="min-w-0"><span className="block truncate text-sm font-semibold">{r.label}</span><span className="block truncate text-xs text-slate-500">{r.sub}</span></span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function QuickAdd({ onPick }: { onPick: (q: Quick) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useClickAway(() => setOpen(false))
  const items: { q: Quick; label: string; icon: typeof Plus }[] = [
    { q: 'lead', label: 'Lead', icon: UserPlus }, { q: 'deal', label: 'Deal', icon: Briefcase },
    { q: 'customer', label: 'Customer', icon: Users }, { q: 'task', label: 'Task / Follow-up', icon: ClipboardList },
    { q: 'ticket', label: 'Service request', icon: LifeBuoy },
  ]
  return (
    <div ref={ref} className="relative">
      <button className="btn-primary" onClick={() => setOpen(o => !o)}><Plus size={16} /><span className="hidden sm:inline">Create</span></button>
      {open && (
        <div className="card absolute right-0 top-12 z-30 w-56 p-1.5 shadow-xl">
          {items.map(i => (
            <button key={i.label} onClick={() => { onPick(i.q); setOpen(false) }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">
              <i.icon size={16} className="text-slate-400" />{i.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function UserMenu({ name, role, onLogout, onReset }: { name: string; role: string; onLogout: () => void; onReset: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useClickAway(() => setOpen(false))
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-slate-100">
        <Avatar name={name} size={32} />
        <span className="hidden text-left leading-tight xl:block"><span className="block text-sm font-semibold">{name}</span><span className="block text-[11px] text-slate-400">{role}</span></span>
      </button>
      {open && (
        <div className="card absolute right-0 top-12 z-30 w-56 p-1.5 shadow-xl">
          <button onClick={() => { if (confirm('Reset all demo data?')) onReset(); setOpen(false) }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">
            <RotateCcw size={16} className="text-slate-400" />Reset demo data
          </button>
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">
            <LogOut size={16} />Sign out
          </button>
        </div>
      )}
    </div>
  )
}
