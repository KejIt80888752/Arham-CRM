import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { COMPANIES, GROUP } from '../data/companies'
import { USERS } from '../data/seed'
import { useStore } from '../store'
import { Avatar, Logo } from '../components/ui'

export default function Login() {
  const { login } = useStore()
  const demo = [USERS[0], USERS[1], USERS[2], USERS[3]]
  const [sel, setSel] = useState(demo[0].id)
  const submit = (e: FormEvent) => { e.preventDefault(); login(sel) }
  const u = USERS.find(x => x.id === sel)!

  return (
    <div className="grid min-h-full lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-leaf-500/20 blur-3xl" />
        <div className="relative"><Logo light /></div>
        <div className="relative mt-auto">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-leaf-500">{GROUP.subtitle}</p>
          <h1 className="mt-3 max-w-lg text-4xl font-extrabold leading-tight">One CRM for every Arham company.</h1>
          <p className="mt-4 max-w-md text-white/60">Leads, deals, quotations, installations and service — for all nine divisions — on a single dashboard.</p>
          <div className="mt-8 flex flex-wrap gap-2">
            {COMPANIES.map(c => (
              <span key={c.id} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: c.color }} />{c.name.replace('Arham ', '')}
              </span>
            ))}
          </div>
          <div className="mt-10 grid max-w-lg grid-cols-4 gap-4 border-t border-white/10 pt-6">
            {[[GROUP.stats.clients, 'Clients'], [GROUP.stats.offices, 'Offices'], [GROUP.stats.team, 'Team'], [GROUP.stats.plants, 'Plants']].map(([v, l]) => (
              <div key={l}><p className="text-2xl font-extrabold">{v}</p><p className="text-xs text-white/50">{l}</p></div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h2 className="text-2xl font-extrabold">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to the Arham World group CRM.</p>

          <p className="label mt-8">Sign in as (demo)</p>
          <div className="grid gap-2">
            {demo.map(d => (
              <button type="button" key={d.id} onClick={() => setSel(d.id)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${sel === d.id ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-100' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                <Avatar name={d.name} size={34} />
                <span><span className="block text-sm font-semibold">{d.name}</span><span className="block text-xs text-slate-500">{d.role}</span></span>
              </button>
            ))}
          </div>

          <label className="mt-5 block"><span className="label">Email</span><input className="input" value={u.email} readOnly /></label>
          <label className="mt-3 block"><span className="label">Password</span><input className="input" type="password" value="demo-password" readOnly /></label>

          <button className="btn-primary mt-6 w-full !py-3">Sign in <ArrowRight size={16} /></button>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400"><ShieldCheck size={14} /> Role-based access per company</p>
        </form>
      </div>
    </div>
  )
}
