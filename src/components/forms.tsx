import { useState, type FormEvent } from 'react'
import { COMPANIES, companyById } from '../data/companies'
import { USERS } from '../data/seed'
import type { CompanyId, Customer, Deal, Lead, Priority, Stage, Task, TaskType, Ticket } from '../data/types'
import { LEAD_SOURCES, STAGES, TASK_TYPES } from '../data/types'
import { today } from '../lib/format'
import { uid, useStore } from '../store'
import { Field } from './ui'

const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

function useDefaultCompany(): CompanyId {
  const { scope, user } = useStore()
  if (scope !== 'all') return scope
  if (user && user.companyId !== 'group') return user.companyId
  return 'signages'
}

function CompanySelect({ value, onChange }: { value: CompanyId; onChange: (c: CompanyId) => void }) {
  return (
    <select className="input" value={value} onChange={e => onChange(e.target.value as CompanyId)}>
      {COMPANIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  )
}

function OwnerSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="input" value={value} onChange={e => onChange(e.target.value)}>
      {USERS.map(u => <option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}
    </select>
  )
}

function Actions({ onCancel, label }: { onCancel: () => void; label: string }) {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <button type="button" className="btn-outline" onClick={onCancel}>Cancel</button>
      <button className="btn-primary">{label}</button>
    </div>
  )
}

export function LeadForm({ onDone, initial }: { onDone: () => void; initial?: Lead }) {
  const { add, update, log, user } = useStore()
  const dc = useDefaultCompany()
  const [f, setF] = useState<Lead>(initial ?? {
    id: uid('l'), contact: '', org: '', phone: '', email: '', city: 'Bengaluru', source: 'WhatsApp',
    companyId: dc, service: companyById(dc).services[0], value: 100000, status: 'New',
    ownerId: user?.id ?? 'u1', createdAt: new Date().toISOString(), notes: '',
  })
  const set = <K extends keyof Lead>(k: K, v: Lead[K]) => setF(p => ({ ...p, [k]: v }))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (initial) update('leads', f.id, f)
    else { add('leads', f); log({ text: `New lead ${f.org} — ${f.service}`, companyId: f.companyId, kind: 'lead' }) }
    onDone()
  }
  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Contact name *"><input required className="input" value={f.contact} onChange={e => set('contact', e.target.value)} /></Field>
      <Field label="Organisation *"><input required className="input" value={f.org} onChange={e => set('org', e.target.value)} /></Field>
      <Field label="Phone *"><input required className="input" value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+91" /></Field>
      <Field label="Email"><input type="email" className="input" value={f.email} onChange={e => set('email', e.target.value)} /></Field>
      <Field label="Company (division)">
        <CompanySelect value={f.companyId} onChange={c => setF(p => ({ ...p, companyId: c, service: companyById(c).services[0] }))} />
      </Field>
      <Field label="Service interested">
        <select className="input" value={f.service} onChange={e => set('service', e.target.value)}>
          {companyById(f.companyId).services.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Source">
        <select className="input" value={f.source} onChange={e => set('source', e.target.value)}>
          {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Estimated value (₹)"><input type="number" min={0} className="input" value={f.value} onChange={e => set('value', +e.target.value)} /></Field>
      <Field label="City"><input className="input" value={f.city} onChange={e => set('city', e.target.value)} /></Field>
      <Field label="Assign to"><OwnerSelect value={f.ownerId} onChange={v => set('ownerId', v)} /></Field>
      <Field label="Notes" className="sm:col-span-2"><textarea rows={2} className="input" value={f.notes} onChange={e => set('notes', e.target.value)} /></Field>
      <div className="sm:col-span-2"><Actions onCancel={onDone} label={initial ? 'Save lead' : 'Create lead'} /></div>
    </form>
  )
}

export function CustomerForm({ onDone, initial, onCreated }: { onDone: () => void; initial?: Customer; onCreated?: (c: Customer) => void }) {
  const { add, update, user } = useStore()
  const [f, setF] = useState<Customer>(initial ?? {
    id: uid('c'), name: '', industry: 'Retail', city: 'Bengaluru', contact: '', phone: '', email: '', gstin: '',
    ownerId: user?.id ?? 'u1', createdAt: new Date().toISOString(),
  })
  const set = <K extends keyof Customer>(k: K, v: Customer[K]) => setF(p => ({ ...p, [k]: v }))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (initial) update('customers', f.id, f); else { add('customers', f); onCreated?.(f) }
    onDone()
  }
  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Company / Organisation *" className="sm:col-span-2"><input required className="input" value={f.name} onChange={e => set('name', e.target.value)} /></Field>
      <Field label="Contact person *"><input required className="input" value={f.contact} onChange={e => set('contact', e.target.value)} /></Field>
      <Field label="Phone *"><input required className="input" value={f.phone} onChange={e => set('phone', e.target.value)} /></Field>
      <Field label="Email"><input type="email" className="input" value={f.email} onChange={e => set('email', e.target.value)} /></Field>
      <Field label="Industry">
        <select className="input" value={f.industry} onChange={e => set('industry', e.target.value)}>
          {['Automobile', 'Banking', 'Education', 'Entertainment', 'Fitness', 'Food & Beverages', 'Government', 'Healthcare', 'Hospitality', 'Hotels', 'Industries', 'IT / Corporate', 'Petroleum', 'Real Estate', 'Religious', 'Retail', 'Shopping Malls', 'Sports', 'Transportation'].map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="City"><input className="input" value={f.city} onChange={e => set('city', e.target.value)} /></Field>
      <Field label="GSTIN"><input className="input uppercase" value={f.gstin} onChange={e => set('gstin', e.target.value.toUpperCase())} /></Field>
      <Field label="Account owner" className="sm:col-span-2"><OwnerSelect value={f.ownerId} onChange={v => set('ownerId', v)} /></Field>
      <div className="sm:col-span-2"><Actions onCancel={onDone} label={initial ? 'Save customer' : 'Create customer'} /></div>
    </form>
  )
}

export function DealForm({ onDone, initial, customerId }: { onDone: () => void; initial?: Deal; customerId?: string }) {
  const { db, add, update, log, user } = useStore()
  const dc = useDefaultCompany()
  const [f, setF] = useState<Deal>(initial ?? {
    id: uid('d'), title: '', customerId: customerId ?? db.customers[0]?.id ?? '', companyId: dc,
    service: companyById(dc).services[0], value: 250000, stage: 'Enquiry', ownerId: user?.id ?? 'u1',
    expectedClose: inDays(30), createdAt: new Date().toISOString(),
  })
  const set = <K extends keyof Deal>(k: K, v: Deal[K]) => setF(p => ({ ...p, [k]: v }))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const cust = db.customers.find(c => c.id === f.customerId)
    const d = { ...f, title: f.title || `${f.service} – ${cust?.name ?? ''}` }
    if (initial) update('deals', d.id, d)
    else { add('deals', d); log({ text: `New deal: ${d.title}`, companyId: d.companyId, customerId: d.customerId, kind: 'deal' }) }
    onDone()
  }
  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Customer *" className="sm:col-span-2">
        <select required className="input" value={f.customerId} onChange={e => set('customerId', e.target.value)}>
          {db.customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.city}</option>)}
        </select>
      </Field>
      <Field label="Company (division)">
        <CompanySelect value={f.companyId} onChange={c => setF(p => ({ ...p, companyId: c, service: companyById(c).services[0] }))} />
      </Field>
      <Field label="Service / Product">
        <select className="input" value={f.service} onChange={e => set('service', e.target.value)}>
          {companyById(f.companyId).services.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Deal title" className="sm:col-span-2"><input className="input" value={f.title} placeholder="Auto: Service – Customer" onChange={e => set('title', e.target.value)} /></Field>
      <Field label="Deal value (₹)"><input type="number" min={0} className="input" value={f.value} onChange={e => set('value', +e.target.value)} /></Field>
      <Field label="Stage">
        <select className="input" value={f.stage} onChange={e => set('stage', e.target.value as Stage)}>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Expected close"><input type="date" className="input" value={f.expectedClose.slice(0, 10)} onChange={e => set('expectedClose', e.target.value)} /></Field>
      <Field label="Owner"><OwnerSelect value={f.ownerId} onChange={v => set('ownerId', v)} /></Field>
      <div className="sm:col-span-2"><Actions onCancel={onDone} label={initial ? 'Save deal' : 'Create deal'} /></div>
    </form>
  )
}

export function TaskForm({ onDone, customerId }: { onDone: () => void; customerId?: string }) {
  const { db, add, log, user } = useStore()
  const dc = useDefaultCompany()
  const [f, setF] = useState<Task>({
    id: uid('k'), title: '', type: 'Call', due: today(), done: false, ownerId: user?.id ?? 'u1', companyId: dc, customerId,
  })
  const set = <K extends keyof Task>(k: K, v: Task[K]) => setF(p => ({ ...p, [k]: v }))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    add('tasks', f)
    log({ text: `Task scheduled: ${f.title}`, companyId: f.companyId, customerId: f.customerId, kind: 'task' })
    onDone()
  }
  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Task *" className="sm:col-span-2"><input required className="input" value={f.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Site survey at Orchid Grand Hotel" /></Field>
      <Field label="Type">
        <select className="input" value={f.type} onChange={e => set('type', e.target.value as TaskType)}>
          {TASK_TYPES.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Due date"><input type="date" className="input" value={f.due} onChange={e => set('due', e.target.value)} /></Field>
      <Field label="Company"><CompanySelect value={f.companyId} onChange={c => set('companyId', c)} /></Field>
      <Field label="Customer">
        <select className="input" value={f.customerId ?? ''} onChange={e => set('customerId', e.target.value || undefined)}>
          <option value="">—</option>
          {db.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Assign to" className="sm:col-span-2"><OwnerSelect value={f.ownerId} onChange={v => set('ownerId', v)} /></Field>
      <div className="sm:col-span-2"><Actions onCancel={onDone} label="Add task" /></div>
    </form>
  )
}

export function TicketForm({ onDone, customerId }: { onDone: () => void; customerId?: string }) {
  const { db, add, log } = useStore()
  const dc = useDefaultCompany()
  const engineers = USERS.filter(u => u.role === 'Service Engineer')
  const [f, setF] = useState<Ticket>({
    id: uid('t'), number: `SR-${2600 + db.tickets.length + 1}`, customerId: customerId ?? db.customers[0]?.id ?? '',
    companyId: dc, subject: '', priority: 'Medium', status: 'Open', createdAt: new Date().toISOString(),
    assigneeId: engineers[0].id, amc: true,
  })
  const set = <K extends keyof Ticket>(k: K, v: Ticket[K]) => setF(p => ({ ...p, [k]: v }))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    add('tickets', f)
    log({ text: `Service request ${f.number}: ${f.subject}`, companyId: f.companyId, customerId: f.customerId, kind: 'ticket' })
    onDone()
  }
  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Customer *" className="sm:col-span-2">
        <select className="input" value={f.customerId} onChange={e => set('customerId', e.target.value)}>
          {db.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Issue *" className="sm:col-span-2"><input required className="input" value={f.subject} onChange={e => set('subject', e.target.value)} placeholder="e.g. Dead pixels on LED wall" /></Field>
      <Field label="Company"><CompanySelect value={f.companyId} onChange={c => set('companyId', c)} /></Field>
      <Field label="Priority">
        <select className="input" value={f.priority} onChange={e => set('priority', e.target.value as Priority)}>
          {['Low', 'Medium', 'High', 'Critical'].map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Assign engineer">
        <select className="input" value={f.assigneeId} onChange={e => set('assigneeId', e.target.value)}>
          {engineers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </Field>
      <Field label="Coverage">
        <select className="input" value={f.amc ? 'amc' : 'paid'} onChange={e => set('amc', e.target.value === 'amc')}>
          <option value="amc">Under AMC / Warranty</option><option value="paid">Chargeable</option>
        </select>
      </Field>
      <div className="sm:col-span-2"><Actions onCancel={onDone} label="Raise ticket" /></div>
    </form>
  )
}
