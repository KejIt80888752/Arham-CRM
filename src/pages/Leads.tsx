import { ArrowRightLeft, Download, MessageCircle, Pencil, Phone, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LeadForm } from '../components/forms'
import { CompanyTag, Empty, Field, Modal, PageHeader, Status, Tabs, UserChip } from '../components/ui'
import { companyById } from '../data/companies'
import { LEAD_SOURCES, LEAD_STATUSES, type Lead, type LeadStatus } from '../data/types'
import { ago, date, downloadCSV, lakh } from '../lib/format'
import { uid, useStore } from '../store'

export default function Leads() {
  const { db, inScope, update } = useStore()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<LeadStatus | 'All'>('All')
  const [q, setQ] = useState('')
  const [src, setSrc] = useState('')
  const [creating, setCreating] = useState(false)
  const openId = params.get('open')
  const open = db.leads.find(l => l.id === openId)

  const scoped = inScope(db.leads)
  const rows = useMemo(() => scoped
    .filter(l => tab === 'All' || l.status === tab)
    .filter(l => !src || l.source === src)
    .filter(l => !q || `${l.org} ${l.contact} ${l.phone} ${l.service} ${l.city}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [scoped, tab, src, q])

  const exp = () => downloadCSV('arham-leads', rows.map(l => ({
    Organisation: l.org, Contact: l.contact, Phone: l.phone, Email: l.email, City: l.city,
    Company: companyById(l.companyId).name, Service: l.service, Value: l.value, Source: l.source, Status: l.status, Created: date(l.createdAt),
  })))

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Leads" subtitle="Every enquiry from WhatsApp, website, IndiaMART, referrals and walk-ins — across all companies.">
        <button className="btn-outline" onClick={exp}><Download size={16} />Export</button>
        <button className="btn-primary" onClick={() => setCreating(true)}><Plus size={16} />New lead</button>
      </PageHeader>

      <div className="card">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <Tabs value={tab} onChange={setTab} items={[
            { id: 'All' as const, label: 'All', count: scoped.length },
            ...LEAD_STATUSES.map(s => ({ id: s, label: s, count: scoped.filter(l => l.status === s).length })),
          ]} />
          <div className="ml-auto flex flex-wrap gap-2">
            <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input !w-56 !pl-9" placeholder="Search leads" value={q} onChange={e => setQ(e.target.value)} /></div>
            <select className="input !w-40" value={src} onChange={e => setSrc(e.target.value)}>
              <option value="">All sources</option>{LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/60"><tr>
              <th className="th">Lead</th><th className="th">Company</th><th className="th">Interested in</th><th className="th">Value</th>
              <th className="th">Source</th><th className="th">Status</th><th className="th">Owner</th><th className="th">Created</th><th className="th"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(l => (
                <tr key={l.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setParams({ open: l.id })}>
                  <td className="td"><p className="font-semibold text-slate-900">{l.org}</p><p className="text-xs text-slate-500">{l.contact} · {l.city}</p></td>
                  <td className="td"><CompanyTag id={l.companyId} /></td>
                  <td className="td">{l.service}</td>
                  <td className="td font-semibold">{lakh(l.value)}</td>
                  <td className="td">{l.source}</td>
                  <td className="td" onClick={e => e.stopPropagation()}>
                    <select value={l.status} onChange={e => update('leads', l.id, { status: e.target.value as LeadStatus })}
                      className="cursor-pointer rounded-lg border-0 bg-transparent text-xs font-semibold outline-none">
                      {LEAD_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="td"><UserChip id={l.ownerId} /></td>
                  <td className="td text-slate-500">{ago(l.createdAt)}</td>
                  <td className="td" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <a href={`tel:${l.phone}`} className="btn-ghost !p-1.5" title="Call"><Phone size={15} /></a>
                      <a href={`https://wa.me/${l.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn-ghost !p-1.5 text-emerald-600" title="WhatsApp"><MessageCircle size={15} /></a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <Empty text="No leads match these filters." />}
        </div>
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="New lead"><LeadForm onDone={() => setCreating(false)} /></Modal>
      {open && <LeadDetail lead={open} onClose={() => setParams({})} />}
    </div>
  )
}

function LeadDetail({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { db, add, update, remove, log } = useStore()
  const nav = useNavigate()
  const [editing, setEditing] = useState(false)
  const [converting, setConverting] = useState(false)
  const existing = db.customers.find(c => c.name.toLowerCase() === lead.org.toLowerCase())
  const [value, setValue] = useState(lead.value)

  const convert = () => {
    let customerId = existing?.id
    if (!customerId) {
      customerId = uid('c')
      add('customers', {
        id: customerId, name: lead.org, industry: 'Retail', city: lead.city, contact: lead.contact, phone: lead.phone,
        email: lead.email, gstin: '', ownerId: lead.ownerId, createdAt: new Date().toISOString(),
      })
    }
    add('deals', {
      id: uid('d'), title: `${lead.service} – ${lead.org}`, customerId, companyId: lead.companyId, service: lead.service,
      value, stage: 'Site Survey', ownerId: lead.ownerId, expectedClose: new Date(Date.now() + 30 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    })
    update('leads', lead.id, { status: 'Converted' })
    log({ text: `Lead converted to deal: ${lead.org} (${lead.service})`, companyId: lead.companyId, customerId, kind: 'deal' })
    onClose()
    nav('/pipeline')
  }

  return (
    <Modal open onClose={onClose} title={editing ? 'Edit lead' : lead.org} wide={!editing}>
      {editing ? <LeadForm initial={lead} onDone={() => setEditing(false)} /> : (
        <div>
          <div className="flex flex-wrap items-center gap-2"><CompanyTag id={lead.companyId} full /><Status s={lead.status} /><span className="text-xs text-slate-400">Created {date(lead.createdAt)} · {lead.source}</span></div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[['Contact', lead.contact], ['Phone', lead.phone], ['Email', lead.email || '—'], ['City', lead.city], ['Interested in', lead.service], ['Est. value', lakh(lead.value)]].map(([k, v]) => (
              <div key={k}><p className="label">{k}</p><p className="text-sm font-medium">{v}</p></div>
            ))}
            <div><p className="label">Owner</p><UserChip id={lead.ownerId} /></div>
          </div>
          {lead.notes && <div className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">📝 {lead.notes}</div>}

          {converting && (
            <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50 p-4">
              <p className="text-sm font-semibold text-brand-900">Convert to deal</p>
              <p className="mt-1 text-xs text-brand-700">{existing ? `Will link to existing customer “${existing.name}”.` : 'A new customer account will be created.'} Deal starts at “Site Survey”.</p>
              <div className="mt-3 flex items-end gap-3">
                <Field label="Deal value (₹)" className="flex-1"><input type="number" className="input" value={value} onChange={e => setValue(+e.target.value)} /></Field>
                <button className="btn-primary" onClick={convert}>Confirm & open pipeline</button>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-4">
            <button className="btn-ghost text-rose-600" onClick={() => { if (confirm('Delete this lead?')) { remove('leads', lead.id); onClose() } }}><Trash2 size={16} />Delete</button>
            <div className="flex flex-wrap gap-2">
              <a className="btn-outline" href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><MessageCircle size={16} className="text-emerald-600" />WhatsApp</a>
              <button className="btn-outline" onClick={() => setEditing(true)}><Pencil size={16} />Edit</button>
              {lead.status !== 'Converted' && <button className="btn-primary" onClick={() => setConverting(true)}><ArrowRightLeft size={16} />Convert to deal</button>}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
