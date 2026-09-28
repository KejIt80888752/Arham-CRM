import { ArrowLeft, Copy, MessageCircle, Pencil, Plus, Printer, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CompanyTag, Empty, Field, PageHeader, Status, Tabs } from '../components/ui'
import { COMPANIES, GROUP, companyById } from '../data/companies'
import { USERS } from '../data/seed'
import type { CompanyId, Quote, QuoteItem, QuoteStatus } from '../data/types'
import { date, lakh, money, quoteTotals } from '../lib/format'
import { uid, useStore } from '../store'

const STATUSES: QuoteStatus[] = ['Draft', 'Sent', 'Accepted', 'Rejected']

export default function Quotes() {
  const { db, inScope } = useStore()
  const [tab, setTab] = useState<QuoteStatus | 'All'>('All')
  const [q, setQ] = useState('')
  const scoped = inScope(db.quotes)
  const rows = scoped.filter(x => tab === 'All' || x.status === tab)
    .filter(x => { const c = db.customers.find(c => c.id === x.customerId); return !q || `${x.number} ${c?.name}`.toLowerCase().includes(q.toLowerCase()) })
    .sort((a, b) => b.date.localeCompare(a.date))
  const sum = (s: QuoteStatus) => scoped.filter(x => x.status === s).reduce((a, x) => a + quoteTotals(x.items, x.gst).total, 0)

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Quotations" subtitle="GST-ready quotations on each company's letterhead — print, save as PDF or share on WhatsApp.">
        <Link to="/quotes/new" className="btn-primary"><Plus size={16} />New quotation</Link>
      </PageHeader>
      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATUSES.map(s => (
          <div key={s} className="card p-4"><div className="flex items-center justify-between"><Status s={s} /><span className="text-xs text-slate-400">{scoped.filter(x => x.status === s).length}</span></div><p className="mt-2 text-xl font-extrabold">{lakh(sum(s))}</p></div>
        ))}
      </div>
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <Tabs value={tab} onChange={setTab} items={[{ id: 'All' as const, label: 'All', count: scoped.length }, ...STATUSES.map(s => ({ id: s, label: s }))]} />
          <div className="relative ml-auto"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input !w-60 !pl-9" placeholder="Search number or customer" value={q} onChange={e => setQ(e.target.value)} /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/60"><tr><th className="th">Quote #</th><th className="th">Customer</th><th className="th">Company</th><th className="th">Amount (incl. GST)</th><th className="th">Date</th><th className="th">Valid till</th><th className="th">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(x => (
                <tr key={x.id} className="hover:bg-slate-50">
                  <td className="td"><Link to={`/quotes/${x.id}`} className="font-semibold text-brand-600">{x.number}</Link></td>
                  <td className="td">{db.customers.find(c => c.id === x.customerId)?.name}</td>
                  <td className="td"><CompanyTag id={x.companyId} /></td>
                  <td className="td font-bold">{money(quoteTotals(x.items, x.gst).total)}</td>
                  <td className="td">{date(x.date)}</td>
                  <td className="td">{date(x.validTill)}</td>
                  <td className="td"><Status s={x.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <Empty text="No quotations." />}
        </div>
      </div>
    </div>
  )
}

export function QuoteEditor() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { db, add, update, log, user, scope } = useStore()
  const existing = db.quotes.find(q => q.id === id)
  const deal = db.deals.find(d => d.id === params.get('deal'))

  const [f, setF] = useState<Quote>(() => {
    if (existing) return existing
    const companyId: CompanyId = deal?.companyId ?? (scope !== 'all' ? scope : 'led')
    const co = companyById(companyId)
    const n = db.quotes.filter(q => q.companyId === companyId).length + 101
    return {
      id: uid('q'), number: `AW/${co.short}/26-27/${String(n).padStart(4, '0')}`, customerId: deal?.customerId ?? db.customers[0].id,
      companyId, dealId: deal?.id, gst: 18, status: 'Draft', date: new Date().toISOString(),
      validTill: new Date(Date.now() + 30 * 86400000).toISOString(), ownerId: user?.id ?? 'u1',
      items: [
        { desc: deal?.service ?? co.services[0], qty: 1, rate: deal ? Math.round(deal.value * 0.94) : 100000 },
        { desc: 'Installation & Commissioning', qty: 1, rate: deal ? Math.round(deal.value * 0.06) : 8000 },
      ],
    }
  })
  const set = <K extends keyof Quote>(k: K, v: Quote[K]) => setF(p => ({ ...p, [k]: v }))
  const setItem = (i: number, patch: Partial<QuoteItem>) => set('items', f.items.map((it, j) => j === i ? { ...it, ...patch } : it))
  const t = quoteTotals(f.items, f.gst)
  const co = companyById(f.companyId)

  const save = () => {
    if (existing) update('quotes', f.id, f)
    else { add('quotes', f); log({ text: `Quotation ${f.number} created (${lakh(t.total)})`, companyId: f.companyId, customerId: f.customerId, kind: 'quote' }) }
    nav(`/quotes/${f.id}`)
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/quotes" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"><ArrowLeft size={16} />Quotations</Link>
      <PageHeader title={existing ? `Edit ${f.number}` : 'New quotation'} subtitle={deal ? `For deal: ${deal.title}` : undefined}>
        <button className="btn-primary" onClick={save}>Save quotation</button>
      </PageHeader>
      <div className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Company (letterhead)">
          <select className="input" value={f.companyId} onChange={e => {
            const c = companyById(e.target.value as CompanyId)
            setF(p => ({ ...p, companyId: c.id, number: p.number.replace(/AW\/[A-Z]+\//, `AW/${c.short}/`) }))
          }}>{COMPANIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </Field>
        <Field label="Customer" className="lg:col-span-2">
          <select className="input" value={f.customerId} onChange={e => set('customerId', e.target.value)}>{db.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </Field>
        <Field label="Quote number"><input className="input" value={f.number} onChange={e => set('number', e.target.value)} /></Field>
        <Field label="Date"><input type="date" className="input" value={f.date.slice(0, 10)} onChange={e => set('date', new Date(e.target.value).toISOString())} /></Field>
        <Field label="Valid till"><input type="date" className="input" value={f.validTill.slice(0, 10)} onChange={e => set('validTill', new Date(e.target.value).toISOString())} /></Field>
        <Field label="GST %"><select className="input" value={f.gst} onChange={e => set('gst', +e.target.value)}>{[0, 5, 12, 18, 28].map(g => <option key={g} value={g}>{g}%</option>)}</select></Field>
        <Field label="Status"><select className="input" value={f.status} onChange={e => set('status', e.target.value as QuoteStatus)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></Field>
      </div>

      <div className="card mt-4 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50/60"><tr><th className="th w-8">#</th><th className="th">Description</th><th className="th w-24">Qty</th><th className="th w-40">Rate (₹)</th><th className="th w-36 text-right">Amount</th><th className="th w-10"></th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {f.items.map((it, i) => (
              <tr key={i}>
                <td className="td text-slate-400">{i + 1}</td>
                <td className="px-2 py-2"><input list="svc" className="input" value={it.desc} onChange={e => setItem(i, { desc: e.target.value })} /></td>
                <td className="px-2 py-2"><input type="number" min={1} className="input" value={it.qty} onChange={e => setItem(i, { qty: +e.target.value })} /></td>
                <td className="px-2 py-2"><input type="number" min={0} className="input" value={it.rate} onChange={e => setItem(i, { rate: +e.target.value })} /></td>
                <td className="td text-right font-semibold">{money(it.qty * it.rate)}</td>
                <td className="px-2"><button className="btn-ghost !p-1.5 text-slate-400 hover:text-rose-600" onClick={() => set('items', f.items.filter((_, j) => j !== i))}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <datalist id="svc">{co.services.map(s => <option key={s} value={s} />)}</datalist>
        <div className="flex flex-wrap items-start justify-between gap-4 border-t border-slate-100 p-4">
          <button className="btn-outline" onClick={() => set('items', [...f.items, { desc: '', qty: 1, rate: 0 }])}><Plus size={16} />Add line item</button>
          <div className="w-72 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Sub-total</span><span className="font-semibold">{money(t.sub)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">GST @ {f.gst}%</span><span className="font-semibold">{money(t.tax)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base"><span className="font-bold">Grand total</span><span className="font-extrabold">{money(t.total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

const words = (n: number): string => {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const two = (x: number) => x < 20 ? a[x] : `${b[Math.floor(x / 10)]} ${a[x % 10]}`.trim()
  const three = (x: number) => x >= 100 ? `${a[Math.floor(x / 100)]} Hundred ${two(x % 100)}`.trim() : two(x)
  n = Math.round(n)
  if (n === 0) return 'Zero'
  const parts: string[] = []
  const cr = Math.floor(n / 1e7); n %= 1e7
  const lk = Math.floor(n / 1e5); n %= 1e5
  const th = Math.floor(n / 1e3); n %= 1e3
  if (cr) parts.push(`${three(cr)} Crore`)
  if (lk) parts.push(`${two(lk)} Lakh`)
  if (th) parts.push(`${two(th)} Thousand`)
  if (n) parts.push(three(n))
  return parts.join(' ')
}

export function QuoteView() {
  const { id } = useParams()
  const nav = useNavigate()
  const { db, update, add, log } = useStore()
  const q = db.quotes.find(x => x.id === id)
  const t = useMemo(() => q ? quoteTotals(q.items, q.gst) : null, [q])
  if (!q || !t) return <Empty text="Quotation not found." />
  const co = companyById(q.companyId)
  const c = db.customers.find(x => x.id === q.customerId)!
  const owner = USERS.find(u => u.id === q.ownerId)

  const setStatus = (s: QuoteStatus) => {
    update('quotes', q.id, { status: s })
    log({ text: `Quotation ${q.number} marked ${s}`, companyId: q.companyId, customerId: q.customerId, kind: 'quote' })
  }
  const duplicate = () => {
    const nq = { ...q, id: uid('q'), number: `${q.number}-R1`, status: 'Draft' as const, date: new Date().toISOString() }
    add('quotes', nq); nav(`/quotes/${nq.id}/edit`)
  }
  const wa = `https://wa.me/${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Dear ${c.contact},\n\nPlease find our quotation ${q.number} from ${co.name} for ${money(t.total)} (incl. GST).\n\nRegards,\n${owner?.name ?? ''}\n${co.name}`)}`

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <Link to="/quotes" className="mr-auto inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"><ArrowLeft size={16} />Quotations</Link>
        <select className="input !w-36" value={q.status} onChange={e => setStatus(e.target.value as QuoteStatus)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
        <button className="btn-outline" onClick={duplicate}><Copy size={16} />Revise</button>
        <Link to={`/quotes/${q.id}/edit`} className="btn-outline"><Pencil size={16} />Edit</Link>
        <a href={wa} target="_blank" rel="noreferrer" className="btn-outline"><MessageCircle size={16} className="text-emerald-600" />Share</a>
        <button className="btn-primary" onClick={() => window.print()}><Printer size={16} />Print / PDF</button>
      </div>

      <div className="card print-area overflow-hidden">
        <div className="h-2" style={{ background: `linear-gradient(90deg, #1d3fbf, ${co.color}, #5dbb46)` }} />
        <div className="p-8 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-2xl font-extrabold" style={{ color: co.color }}>{co.name}</p>
              <p className="text-xs italic text-slate-500">{co.tagline}</p>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-500">A unit of {GROUP.name} {GROUP.subtitle}<br />{GROUP.address}<br />{GROUP.phone} · {co.website}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">QUOTATION</p>
              <p className="mt-2 text-sm font-semibold">{q.number}</p>
              <p className="text-xs text-slate-500">Date: {date(q.date)}<br />Valid till: {date(q.validTill)}</p>
              <div className="no-print mt-2"><Status s={q.status} /></div>
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quotation for</p>
            <p className="mt-1 font-bold">{c.name}</p>
            <p className="text-sm text-slate-600">Kind Attn: {c.contact} · {c.phone}<br />{c.city}{c.gstin && ` · GSTIN: ${c.gstin}`}</p>
          </div>

          <table className="mt-8 w-full text-sm">
            <thead><tr className="border-b-2 border-slate-900 text-left text-xs uppercase tracking-wider"><th className="py-2 pr-2">#</th><th className="py-2">Description</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Rate</th><th className="py-2 text-right">Amount</th></tr></thead>
            <tbody>
              {q.items.map((it, i) => (
                <tr key={i} className="border-b border-slate-100"><td className="py-3 pr-2 text-slate-400">{i + 1}</td><td className="py-3 font-medium">{it.desc}</td><td className="py-3 text-right">{it.qty}</td><td className="py-3 text-right">{money(it.rate)}</td><td className="py-3 text-right font-semibold">{money(it.qty * it.rate)}</td></tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex flex-wrap justify-between gap-6">
            <p className="max-w-sm text-xs text-slate-500"><b className="text-slate-700">Amount in words:</b><br />Rupees {words(t.total)} Only</p>
            <div className="w-72 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Sub-total</span><span>{money(t.sub)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">CGST @ {q.gst / 2}%</span><span>{money(t.tax / 2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">SGST @ {q.gst / 2}%</span><span>{money(t.tax / 2)}</span></div>
              <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-base font-extrabold"><span>Grand total</span><span>{money(t.total)}</span></div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:grid-cols-2">
            <div>
              <p className="mb-1 font-bold text-slate-700">Terms & conditions</p>
              <ol className="list-decimal space-y-0.5 pl-4">
                <li>50% advance with PO, balance before dispatch.</li>
                <li>Delivery: 2–3 weeks from design approval.</li>
                <li>Warranty: 1 year on-site; AMC available thereafter.</li>
                <li>Civil / electrical work at site by client unless specified.</li>
              </ol>
            </div>
            <div className="text-right">
              <p>For <b className="text-slate-700">{co.name}</b></p>
              <p className="mt-12 font-semibold text-slate-700">{owner?.name}</p>
              <p>{owner?.role} · {owner?.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
