import { ArrowLeft, Briefcase, CalendarPlus, Download, LifeBuoy, Mail, MapPin, MessageCircle, Pencil, Phone, Plus, Search } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CustomerForm, DealForm, TaskForm, TicketForm } from '../components/forms'
import { Avatar, CompanyTag, Empty, Modal, PageHeader, Status, Tabs, UserChip } from '../components/ui'
import { COMPANIES } from '../data/companies'
import { USERS } from '../data/seed'
import type { CompanyId } from '../data/types'
import { ago, date, downloadCSV, lakh, quoteTotals, shortDate } from '../lib/format'
import { useStore } from '../store'
import { DealDetail } from './Pipeline'

export default function Customers() {
  const { db, scope } = useStore()
  const [q, setQ] = useState('')
  const [ind, setInd] = useState('')
  const [creating, setCreating] = useState(false)

  const rows = useMemo(() => db.customers.map(c => {
    const deals = db.deals.filter(d => d.customerId === c.id)
    const divs = [...new Set(deals.filter(d => d.stage === 'Won').map(d => d.companyId))] as CompanyId[]
    return {
      c, divs, all: [...new Set(deals.map(d => d.companyId))],
      revenue: deals.filter(d => d.stage === 'Won').reduce((a, d) => a + d.value, 0),
      open: deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost').length,
    }
  })
    .filter(r => scope === 'all' || r.all.includes(scope))
    .filter(r => !ind || r.c.industry === ind)
    .filter(r => !q || `${r.c.name} ${r.c.contact} ${r.c.phone} ${r.c.city}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.revenue - a.revenue), [db, scope, q, ind])

  const industries = [...new Set(db.customers.map(c => c.industry))].sort()

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Customers" subtitle="One shared customer master for the whole group — see which Arham companies each client buys from.">
        <button className="btn-outline" onClick={() => downloadCSV('arham-customers', rows.map(r => ({ Name: r.c.name, Contact: r.c.contact, Phone: r.c.phone, Email: r.c.email, City: r.c.city, Industry: r.c.industry, GSTIN: r.c.gstin, Revenue: r.revenue })))}><Download size={16} />Export</button>
        <button className="btn-primary" onClick={() => setCreating(true)}><Plus size={16} />New customer</button>
      </PageHeader>
      <div className="card">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input !w-64 !pl-9" placeholder="Search customers" value={q} onChange={e => setQ(e.target.value)} /></div>
          <select className="input !w-48" value={ind} onChange={e => setInd(e.target.value)}><option value="">All industries</option>{industries.map(i => <option key={i}>{i}</option>)}</select>
          <span className="ml-auto self-center text-sm text-slate-500">{rows.length} customers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/60"><tr><th className="th">Customer</th><th className="th">Industry</th><th className="th">Buys from</th><th className="th">Lifetime revenue</th><th className="th">Open deals</th><th className="th">Account owner</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(r => (
                <tr key={r.c.id} className="hover:bg-slate-50">
                  <td className="td"><Link to={`/customers/${r.c.id}`} className="flex items-center gap-3"><Avatar name={r.c.name} size={34} /><span><span className="block font-semibold text-slate-900 hover:text-brand-600">{r.c.name}</span><span className="block text-xs text-slate-500">{r.c.contact} · {r.c.city}</span></span></Link></td>
                  <td className="td">{r.c.industry}</td>
                  <td className="td"><div className="flex flex-wrap gap-1">{r.divs.length ? r.divs.map(d => <CompanyTag key={d} id={d} />) : <span className="text-xs text-slate-400">Prospect</span>}</div></td>
                  <td className="td font-bold">{lakh(r.revenue)}</td>
                  <td className="td">{r.open}</td>
                  <td className="td"><UserChip id={r.c.ownerId} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <Empty text="No customers found." />}
        </div>
      </div>
      <Modal open={creating} onClose={() => setCreating(false)} title="New customer"><CustomerForm onDone={() => setCreating(false)} /></Modal>
    </div>
  )
}

type Tab = 'deals' | 'quotes' | 'projects' | 'tickets' | 'tasks' | 'activity'

export function CustomerDetail() {
  const { id } = useParams()
  const { db, update } = useStore()
  const [tab, setTab] = useState<Tab>('deals')
  const [modal, setModal] = useState<'edit' | 'deal' | 'task' | 'ticket' | null>(null)
  const [dealId, setDealId] = useState<string | null>(null)
  const c = db.customers.find(x => x.id === id)
  if (!c) return <Empty text="Customer not found." />

  const deals = db.deals.filter(d => d.customerId === c.id)
  const quotes = db.quotes.filter(d => d.customerId === c.id)
  const projects = db.projects.filter(d => d.customerId === c.id)
  const tickets = db.tickets.filter(d => d.customerId === c.id)
  const tasks = db.tasks.filter(d => d.customerId === c.id)
  const acts = db.activities.filter(d => d.customerId === c.id)
  const revenue = deals.filter(d => d.stage === 'Won').reduce((a, d) => a + d.value, 0)
  const pipe = deals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost').reduce((a, d) => a + d.value, 0)
  const due = projects.reduce((a, p) => a + p.invoiced - p.received, 0)
  const won = new Set(deals.filter(d => d.stage === 'Won').map(d => d.companyId))
  const engaged = new Set(deals.map(d => d.companyId))
  const deal = db.deals.find(d => d.id === dealId)

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <Link to="/customers" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"><ArrowLeft size={16} />Customers</Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={c.name} size={60} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight">{c.name}</h1>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><MapPin size={14} />{c.city}</span>
              <span className="flex items-center gap-1.5"><Phone size={14} />{c.phone}</span>
              <span className="flex items-center gap-1.5"><Mail size={14} />{c.email}</span>
              <span>{c.industry}</span>
              {c.gstin && <span className="font-mono text-xs">GSTIN {c.gstin}</span>}
            </div>
            <p className="mt-2 text-sm">Contact: <b>{c.contact}</b> · Owner: {USERS.find(u => u.id === c.ownerId)?.name} · Client since {date(c.createdAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="btn-outline" href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><MessageCircle size={16} className="text-emerald-600" />WhatsApp</a>
            <button className="btn-outline" onClick={() => setModal('edit')}><Pencil size={16} />Edit</button>
            <button className="btn-outline" onClick={() => setModal('task')}><CalendarPlus size={16} />Task</button>
            <button className="btn-outline" onClick={() => setModal('ticket')}><LifeBuoy size={16} />Ticket</button>
            <button className="btn-primary" onClick={() => setModal('deal')}><Briefcase size={16} />New deal</button>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 md:grid-cols-4">
          {[['Lifetime revenue', lakh(revenue)], ['Open pipeline', lakh(pipe)], ['Payment due', lakh(due)], ['Open tickets', String(tickets.filter(t => t.status !== 'Resolved').length)]].map(([k, v]) => (
            <div key={k}><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{k}</p><p className="mt-1 text-xl font-extrabold">{v}</p></div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold">Relationship across Arham companies</h3>
        <p className="text-xs text-slate-500">Green = active client · Blue = in discussion · Grey = cross-sell opportunity</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-9">
          {COMPANIES.map(co => {
            const st = won.has(co.id) ? 'won' : engaged.has(co.id) ? 'open' : 'none'
            return (
              <div key={co.id} className={`rounded-xl border p-3 text-center ${st === 'won' ? 'border-emerald-200 bg-emerald-50' : st === 'open' ? 'border-brand-200 bg-brand-50' : 'border-dashed border-slate-200'}`}>
                <div className="mx-auto h-1.5 w-8 rounded-full" style={{ background: co.color, opacity: st === 'none' ? 0.3 : 1 }} />
                <p className={`mt-2 text-xs font-bold ${st === 'none' ? 'text-slate-400' : 'text-slate-800'}`}>{co.name.replace('Arham ', '')}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase text-slate-400">{st === 'won' ? 'Client' : st === 'open' ? 'In talks' : 'Pitch'}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="border-b border-slate-100 p-4">
          <Tabs value={tab} onChange={setTab} items={[
            { id: 'deals', label: 'Deals', count: deals.length }, { id: 'quotes', label: 'Quotations', count: quotes.length },
            { id: 'projects', label: 'Projects', count: projects.length }, { id: 'tickets', label: 'Service', count: tickets.length },
            { id: 'tasks', label: 'Tasks', count: tasks.length }, { id: 'activity', label: 'Timeline', count: acts.length },
          ]} />
        </div>
        <div className="overflow-x-auto">
          {tab === 'deals' && <List empty={!deals.length} head={['Deal', 'Company', 'Stage', 'Value', 'Close']}>
            {deals.map(d => <tr key={d.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setDealId(d.id)}><td className="td font-semibold">{d.service}</td><td className="td"><CompanyTag id={d.companyId} /></td><td className="td"><Status s={d.stage} /></td><td className="td font-bold">{lakh(d.value)}</td><td className="td">{shortDate(d.closedAt ?? d.expectedClose)}</td></tr>)}
          </List>}
          {tab === 'quotes' && <List empty={!quotes.length} head={['Number', 'Company', 'Status', 'Amount', 'Date']}>
            {quotes.map(q => <tr key={q.id} className="hover:bg-slate-50"><td className="td"><Link className="font-semibold text-brand-600" to={`/quotes/${q.id}`}>{q.number}</Link></td><td className="td"><CompanyTag id={q.companyId} /></td><td className="td"><Status s={q.status} /></td><td className="td font-bold">{lakh(quoteTotals(q.items, q.gst).total)}</td><td className="td">{date(q.date)}</td></tr>)}
          </List>}
          {tab === 'projects' && <List empty={!projects.length} head={['Project', 'Company', 'Stage', 'Value', 'Received']}>
            {projects.map(p => <tr key={p.id}><td className="td font-semibold">{p.name}</td><td className="td"><CompanyTag id={p.companyId} /></td><td className="td"><Status s={p.stage} /></td><td className="td font-bold">{lakh(p.value)}</td><td className="td">{lakh(p.received)} / {lakh(p.invoiced)}</td></tr>)}
          </List>}
          {tab === 'tickets' && <List empty={!tickets.length} head={['Ticket', 'Issue', 'Company', 'Priority', 'Status']}>
            {tickets.map(t => <tr key={t.id}><td className="td font-semibold">{t.number}</td><td className="td">{t.subject}</td><td className="td"><CompanyTag id={t.companyId} /></td><td className="td"><Status s={t.priority} /></td><td className="td"><Status s={t.status} /></td></tr>)}
          </List>}
          {tab === 'tasks' && <List empty={!tasks.length} head={['', 'Task', 'Type', 'Due', 'Owner']}>
            {tasks.map(t => <tr key={t.id}><td className="td w-8"><input type="checkbox" checked={t.done} onChange={e => update('tasks', t.id, { done: e.target.checked })} /></td><td className={`td ${t.done ? 'text-slate-400 line-through' : 'font-medium'}`}>{t.title}</td><td className="td">{t.type}</td><td className="td">{shortDate(t.due)}</td><td className="td"><UserChip id={t.ownerId} /></td></tr>)}
          </List>}
          {tab === 'activity' && (acts.length ? (
            <ol className="space-y-4 p-5">
              {acts.map(a => <li key={a.id} className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" /><div><p className="text-sm">{a.text}</p><p className="text-xs text-slate-400">{ago(a.at)} · {USERS.find(u => u.id === a.userId)?.name}</p></div></li>)}
            </ol>
          ) : <Empty text="No activity yet." />)}
        </div>
      </div>

      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit customer"><CustomerForm initial={c} onDone={() => setModal(null)} /></Modal>
      <Modal open={modal === 'deal'} onClose={() => setModal(null)} title="New deal"><DealForm customerId={c.id} onDone={() => setModal(null)} /></Modal>
      <Modal open={modal === 'task'} onClose={() => setModal(null)} title="New task"><TaskForm customerId={c.id} onDone={() => setModal(null)} /></Modal>
      <Modal open={modal === 'ticket'} onClose={() => setModal(null)} title="New service request"><TicketForm customerId={c.id} onDone={() => setModal(null)} /></Modal>
      {deal && <DealDetail deal={deal} onClose={() => setDealId(null)} />}
    </div>
  )
}

function List({ head, children, empty }: { head: string[]; children: ReactNode; empty: boolean }) {
  if (empty) return <Empty text="Nothing here yet." />
  return (
    <table className="w-full">
      <thead className="bg-slate-50/60"><tr>{head.map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">{children}</tbody>
    </table>
  )
}
