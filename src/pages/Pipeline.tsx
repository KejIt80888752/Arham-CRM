import { CalendarDays, FilePlus2, Plus, Trophy } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DealForm } from '../components/forms'
import { Avatar, CompanyTag, Modal, PageHeader, Status } from '../components/ui'
import { USERS } from '../data/seed'
import { STAGES, STAGE_PROB, type Deal, type Stage } from '../data/types'
import { lakh, shortDate } from '../lib/format'
import { uid, useStore } from '../store'

const STAGE_COLOR: Record<Stage, string> = {
  Enquiry: '#94a3b8', 'Site Survey': '#0891b2', 'Design & Quote': '#2f55d4', Negotiation: '#f59e0b', Won: '#479c33', Lost: '#e11d48',
}

export function useMoveDeal() {
  const { db, update, add, log } = useStore()
  return (d: Deal, stage: Stage) => {
    if (d.stage === stage) return
    const closing = stage === 'Won' || stage === 'Lost'
    update('deals', d.id, { stage, closedAt: closing ? new Date().toISOString() : undefined })
    log({ text: `${d.title} moved to ${stage}`, companyId: d.companyId, customerId: d.customerId, kind: 'deal' })
    if (stage === 'Won' && !db.projects.some(p => p.name === d.title && p.customerId === d.customerId)) {
      const cust = db.customers.find(c => c.id === d.customerId)
      add('projects', {
        id: uid('p'), name: d.title, customerId: d.customerId, companyId: d.companyId, value: d.value, invoiced: 0, received: 0,
        stage: 'Design', startDate: new Date().toISOString(), dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        managerId: USERS.find(u => u.role === 'Project Manager')!.id, site: cust ? `${cust.name}, ${cust.city}` : '',
      })
    }
  }
}

export default function Pipeline() {
  const { db, inScope } = useStore()
  const move = useMoveDeal()
  const [drag, setDrag] = useState<string | null>(null)
  const [over, setOver] = useState<Stage | null>(null)
  const [creating, setCreating] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [owner, setOwner] = useState('')
  const [showClosed, setShowClosed] = useState(true)

  const deals = inScope(db.deals).filter(d => !owner || d.ownerId === owner)
  const cols = showClosed ? STAGES : STAGES.filter(s => s !== 'Won' && s !== 'Lost')
  const open = db.deals.find(d => d.id === openId)

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Deals Pipeline" subtitle="Drag cards between stages. Marking a deal Won automatically creates an installation project.">
        <select className="input !w-48" value={owner} onChange={e => setOwner(e.target.value)}>
          <option value="">All owners</option>{USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={showClosed} onChange={e => setShowClosed(e.target.checked)} />Show closed</label>
        <button className="btn-primary" onClick={() => setCreating(true)}><Plus size={16} />New deal</button>
      </PageHeader>

      <div className="-mx-4 flex flex-1 gap-4 overflow-x-auto px-4 pb-4 lg:-mx-8 lg:px-8">
        {cols.map(stage => {
          const list = deals.filter(d => d.stage === stage).sort((a, b) => b.value - a.value)
          const total = list.reduce((a, d) => a + d.value, 0)
          return (
            <div key={stage}
              onDragOver={e => { e.preventDefault(); setOver(stage) }}
              onDragLeave={() => setOver(null)}
              onDrop={() => { const d = db.deals.find(x => x.id === drag); if (d) move(d, stage); setDrag(null); setOver(null) }}
              className={`flex w-72 shrink-0 flex-col rounded-2xl bg-slate-100/70 transition ${over === stage ? 'ring-2 ring-brand-500 ring-offset-2' : ''}`}>
              <div className="px-3 pb-2 pt-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: STAGE_COLOR[stage] }} />
                  <h3 className="text-sm font-bold">{stage}</h3>
                  <span className="rounded-full bg-white px-2 text-xs font-bold text-slate-500">{list.length}</span>
                  <span className="ml-auto text-xs font-semibold text-slate-400">{STAGE_PROB[stage]}%</span>
                </div>
                <p className="mt-1 text-lg font-extrabold">{lakh(total)}</p>
              </div>
              <div className="max-h-[calc(100vh-290px)] flex-1 space-y-2 overflow-y-auto px-2 pb-2">
                {list.map(d => {
                  const c = db.customers.find(x => x.id === d.customerId)
                  const u = USERS.find(x => x.id === d.ownerId)
                  const late = stage !== 'Won' && stage !== 'Lost' && new Date(d.expectedClose) < new Date()
                  return (
                    <div key={d.id} draggable onDragStart={() => setDrag(d.id)} onDragEnd={() => setDrag(null)} onClick={() => setOpenId(d.id)}
                      className={`cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing ${drag === d.id ? 'opacity-40' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <CompanyTag id={d.companyId} />
                        <span className="text-sm font-extrabold">{lakh(d.value)}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-snug">{d.service}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{c?.name}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`flex items-center gap-1 text-[11px] font-medium ${late ? 'text-rose-600' : 'text-slate-400'}`}><CalendarDays size={12} />{shortDate(d.closedAt ?? d.expectedClose)}</span>
                        {u && <Avatar name={u.name} size={22} />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="New deal"><DealForm onDone={() => setCreating(false)} /></Modal>
      {open && <DealDetail deal={open} onClose={() => setOpenId(null)} />}
    </div>
  )
}

export function DealDetail({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const { db } = useStore()
  const move = useMoveDeal()
  const nav = useNavigate()
  const [editing, setEditing] = useState(false)
  const c = db.customers.find(x => x.id === deal.customerId)
  const quotes = db.quotes.filter(q => q.dealId === deal.id)
  return (
    <Modal open onClose={onClose} title={editing ? 'Edit deal' : deal.title} wide={!editing}>
      {editing ? <DealForm initial={deal} onDone={() => setEditing(false)} /> : (
        <div>
          <div className="flex flex-wrap items-center gap-2"><CompanyTag id={deal.companyId} full /><Status s={deal.stage} /></div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div><p className="label">Value</p><p className="text-lg font-extrabold">{lakh(deal.value)}</p></div>
            <div><p className="label">Customer</p><Link to={`/customers/${deal.customerId}`} className="text-sm font-semibold text-brand-600">{c?.name}</Link></div>
            <div><p className="label">Expected close</p><p className="text-sm font-medium">{shortDate(deal.expectedClose)}</p></div>
            <div><p className="label">Owner</p><p className="text-sm font-medium">{USERS.find(u => u.id === deal.ownerId)?.name}</p></div>
          </div>

          <p className="label mt-6">Move stage</p>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map(s => (
              <button key={s} onClick={() => move(deal, s)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${deal.stage === s ? 'border-transparent text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                style={deal.stage === s ? { background: STAGE_COLOR[s] } : undefined}>{s}</button>
            ))}
          </div>

          <p className="label mt-6">Quotations</p>
          {quotes.length ? (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {quotes.map(q => (
                <Link key={q.id} to={`/quotes/${q.id}`} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50">
                  <span className="font-semibold">{q.number}</span><Status s={q.status} />
                </Link>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">No quotation yet.</p>}

          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <button className="btn-outline" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn-outline" onClick={() => nav(`/quotes/new?deal=${deal.id}`)}><FilePlus2 size={16} />Create quotation</button>
            {deal.stage !== 'Won' && <button className="btn-primary !bg-leaf-600 hover:!bg-leaf-500" onClick={() => { move(deal, 'Won'); onClose() }}><Trophy size={16} />Mark as Won</button>}
          </div>
        </div>
      )}
    </Modal>
  )
}
