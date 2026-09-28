import { COMPANIES } from './companies'
import type {
  Activity, CompanyId, Customer, DB, Deal, Lead, LeadStatus, Priority, Project, ProjectStage,
  Quote, Stage, Task, TaskType, Ticket, TicketStatus, User,
} from './types'
import { LEAD_SOURCES } from './types'

let s = 20260928
const rnd = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 }
const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)]
const int = (a: number, b: number) => Math.floor(a + rnd() * (b - a + 1))
const round = (n: number, to = 5000) => Math.round(n / to) * to

const DAY = 86400000
const now = () => Date.now()
const daysAgo = (d: number) => new Date(now() - d * DAY - int(0, 8) * 3600000).toISOString()
const daysAhead = (d: number) => new Date(now() + d * DAY).toISOString()

export const USERS: User[] = [
  { id: 'u1', name: 'Jeeva Kumar', role: 'Group Admin', companyId: 'group', phone: '+91 99458 45678', email: 'jeeva@arhamworld.in' },
  { id: 'u2', name: 'Rahul Jain', role: 'Company Head', companyId: 'signages', phone: '+91 98450 11223', email: 'rahul@arhamsignages.com' },
  { id: 'u3', name: 'Priya Nair', role: 'Sales Manager', companyId: 'led', phone: '+91 98860 44120', email: 'priya@arhamled.com' },
  { id: 'u4', name: 'Arun Prakash', role: 'Sales Executive', companyId: 'av', phone: '+91 97410 55821', email: 'arun@arhamavsystems.com' },
  { id: 'u5', name: 'Sneha Reddy', role: 'Sales Executive', companyId: 'digital', phone: '+91 90080 77312', email: 'sneha@digitalsignages.in' },
  { id: 'u6', name: 'Mohammed Irfan', role: 'Project Manager', companyId: 'signages', phone: '+91 99020 33145', email: 'irfan@arhamworld.in' },
  { id: 'u7', name: 'Kavya Shetty', role: 'Sales Manager', companyId: 'space', phone: '+91 99807 34567', email: 'kavya@arhamspacedesign.com' },
  { id: 'u8', name: 'Vikram Rao', role: 'Service Engineer', companyId: 'led', phone: '+91 96320 12876', email: 'vikram@arhamled.com' },
  { id: 'u9', name: 'Divya Menon', role: 'Sales Executive', companyId: 'tech', phone: '+91 95380 66190', email: 'divya@arham-technologies.com' },
  { id: 'u10', name: 'Karthik S', role: 'Sales Executive', companyId: 'displays', phone: '+91 94481 20934', email: 'karthik@arhamdisplays.com' },
  { id: 'u11', name: 'Ananya Gupta', role: 'Sales Executive', companyId: 'studio', phone: '+91 93428 81570', email: 'ananya@arhamcreativestudio.com' },
  { id: 'u12', name: 'Suresh Babu', role: 'Project Manager', companyId: 'tensile', phone: '+91 91087 45623', email: 'suresh@arhamtensile.com' },
  { id: 'u13', name: 'Ravi Teja', role: 'Service Engineer', companyId: 'av', phone: '+91 90361 78214', email: 'ravi@arhamavsystems.com' },
]

const usersOf = (c: CompanyId) => {
  const u = USERS.filter(x => x.companyId === c)
  return u.length ? u : USERS.filter(x => x.companyId === 'group')
}

const ORGS: [string, string][] = [
  ['Sri Balaji Motors', 'Automobile'], ['Greenleaf Multispeciality Hospital', 'Healthcare'],
  ['Vidya Niketan Public School', 'Education'], ['Namma Kitchen Restaurants', 'Food & Beverages'],
  ['Skyline Tech Park', 'Real Estate'], ['Karnataka Co-op Bank', 'Banking'],
  ['Trendz Fashion Mall', 'Shopping Malls'], ['Orchid Grand Hotel', 'Hotels'],
  ['Prestige Logistics', 'Transportation'], ['Nova Diagnostics', 'Healthcare'],
  ['Brigade Fuel Station', 'Petroleum'], ['Zenith Software Labs', 'IT / Corporate'],
  ['Sparkle Jewellers', 'Retail'], ['Metro Furniture World', 'Retail'],
  ['Silver Oak International School', 'Education'], ['Hebbal Fitness Club', 'Fitness'],
  ['Royal Enfield Dealers – Yelahanka', 'Automobile'], ['Mysore Silk Emporium', 'Retail'],
  ['Cafe Coffee Corner', 'Food & Beverages'], ['Aster Heights Apartments', 'Real Estate'],
  ['Crescent Engineering College', 'Education'], ['BlueStone Pharma', 'Industries'],
  ['Galaxy Cinemas', 'Entertainment'], ['Lotus Wedding Convention', 'Hospitality'],
  ['Infinity Fintech NBFC', 'Banking'], ['Sai Ram Supermarket', 'Retail'],
  ['City Municipal Corporation', 'Government'], ['Vista Auto Showroom', 'Automobile'],
  ['Harmony Church Trust', 'Religious'], ['Techno Industrial Park', 'Industries'],
  ['Spice Route Hotels', 'Hotels'], ['Apollo Dental Care', 'Healthcare'],
  ['Bangalore Turf Club', 'Sports'], ['Urban Ladder Studio', 'Retail'],
  ['Emerald Builders', 'Real Estate'], ['Kids World Play School', 'Education'],
]
const CITIES = ['Bengaluru', 'Bengaluru', 'Bengaluru', 'Mysuru', 'Chennai', 'Hyderabad', 'Hubballi', 'Mangaluru', 'Coimbatore', 'Pune']
const FIRST = ['Ramesh', 'Suresh', 'Lakshmi', 'Anil', 'Deepa', 'Mahesh', 'Farhan', 'Joseph', 'Meera', 'Ganesh', 'Pooja', 'Naveen', 'Shalini', 'Harish', 'Rekha', 'Vinod', 'Sanjay', 'Nisha']
const LAST = ['Kumar', 'Rao', 'Iyer', 'Shetty', 'Gowda', 'Khan', 'Thomas', 'Reddy', 'Sharma', 'Pillai', 'Hegde', 'Naidu']
const person = () => `${pick(FIRST)} ${pick(LAST)}`
const phone = () => `+91 9${int(10000, 99999)} ${int(10000, 99999)}`
const slug = (x: string) => x.toLowerCase().replace(/[^a-z]+/g, '').slice(0, 12)

const VALUE_RANGE: Record<CompanyId, [number, number]> = {
  signages: [40000, 900000], displays: [25000, 400000], digital: [60000, 1200000],
  led: [300000, 4500000], av: [250000, 3500000], tech: [80000, 1500000],
  space: [500000, 6000000], studio: [20000, 350000], tensile: [150000, 2500000],
}
const val = (c: CompanyId) => round(int(...VALUE_RANGE[c]))

export function buildSeed(): DB {
  s = 20260928
  const customers: Customer[] = ORGS.map(([name, industry], i) => {
    const contact = person()
    return {
      id: `c${i + 1}`, name, industry, city: pick(CITIES), contact, phone: phone(),
      email: `${slug(contact.split(' ')[0])}@${slug(name)}.in`,
      gstin: `29${String.fromCharCode(65 + int(0, 25))}${String.fromCharCode(65 + int(0, 25))}PC${int(1000, 9999)}${String.fromCharCode(65 + int(0, 25))}1Z${int(1, 9)}`,
      ownerId: pick(USERS).id, createdAt: daysAgo(int(60, 700)),
    }
  })

  const activities: Activity[] = []
  let aid = 1
  const log = (a: Omit<Activity, 'id'>) => activities.push({ id: `a${aid++}`, ...a })

  // Leads
  const leadStatuses: LeadStatus[] = ['New', 'New', 'New', 'Contacted', 'Contacted', 'Qualified', 'Qualified', 'Unqualified', 'Converted']
  const leads: Lead[] = []
  for (let i = 0; i < 72; i++) {
    const co = pick(COMPANIES)
    const [org] = rnd() < 0.3 ? pick(ORGS) : [`${pick(['Shree', 'New', 'Global', 'Royal', 'Smart', 'Prime', 'Elite', 'Star'])} ${pick(['Traders', 'Enterprises', 'Mart', 'Clinic', 'Academy', 'Towers', 'Foods', 'Motors', 'Textiles', 'Hospital'])}`]
    const contact = person()
    const created = int(0, 120)
    const status = created < 4 ? 'New' : pick(leadStatuses)
    const owner = pick(usersOf(co.id))
    leads.push({
      id: `l${i + 1}`, contact, org, phone: phone(), email: `${slug(contact)}@gmail.com`,
      city: pick(CITIES), source: pick(LEAD_SOURCES), companyId: co.id, service: pick(co.services),
      value: val(co.id), status, ownerId: owner.id, createdAt: daysAgo(created),
      notes: pick(['Wants site visit this week', 'Requested quotation on WhatsApp', 'Budget approval pending', 'Comparing with 2 vendors', 'Needs installation before festival season', '']),
    })
    if (created < 20) log({ at: daysAgo(created), text: `New lead ${org} — ${co.name} (${pick(co.services)})`, companyId: co.id, userId: owner.id, kind: 'lead' })
  }

  // Deals
  const stageMix: Stage[] = ['Enquiry', 'Enquiry', 'Site Survey', 'Site Survey', 'Design & Quote', 'Design & Quote', 'Negotiation', 'Won', 'Won', 'Won', 'Lost']
  const deals: Deal[] = []
  for (let i = 0; i < 90; i++) {
    const co = COMPANIES[i % COMPANIES.length]
    const cust = pick(customers)
    const stage = pick(stageMix)
    const isClosed = stage === 'Won' || stage === 'Lost'
    // closed deals skew recent so the revenue trend shows healthy growth
    const closed = isClosed ? Math.floor(175 * Math.pow(rnd(), 1.5)) : undefined
    const created = closed !== undefined ? closed + int(10, 45) : int(3, 90)
    const owner = pick(usersOf(co.id))
    const service = pick(co.services)
    deals.push({
      id: `d${i + 1}`, title: `${service} – ${cust.name.split(' ').slice(0, 2).join(' ')}`,
      customerId: cust.id, companyId: co.id, service, value: val(co.id), stage, ownerId: owner.id,
      expectedClose: daysAhead(int(3, 60)), createdAt: daysAgo(created),
      closedAt: closed !== undefined ? daysAgo(closed) : undefined,
    })
  }
  deals.filter(d => d.closedAt && d.stage === 'Won').forEach(d => {
    const ago = (now() - new Date(d.closedAt!).getTime()) / DAY
    if (ago < 25) log({ at: d.closedAt!, text: `Deal won: ${d.title}`, companyId: d.companyId, userId: d.ownerId, customerId: d.customerId, kind: 'deal' })
  })

  // Quotes
  const quotes: Quote[] = []
  deals.filter(d => ['Design & Quote', 'Negotiation', 'Won', 'Lost'].includes(d.stage)).slice(0, 40).forEach((d, i) => {
    const co = COMPANIES.find(c => c.id === d.companyId)!
    const n = int(1, 3)
    const items = Array.from({ length: n }, (_, k) => {
      const qty = int(1, 6)
      return { desc: k === 0 ? d.service : pick(co.services), qty, rate: round(d.value / n / qty, 500) }
    })
    items.push({ desc: 'Installation & Commissioning', qty: 1, rate: round(d.value * 0.06, 500) })
    const status = d.stage === 'Won' ? 'Accepted' : d.stage === 'Lost' ? 'Rejected' : d.stage === 'Negotiation' ? 'Sent' : pick(['Draft', 'Sent'] as const)
    const date = daysAgo(int(2, 60))
    quotes.push({
      id: `q${i + 1}`, number: `AW/${co.short}/26-27/${String(101 + i).padStart(4, '0')}`,
      customerId: d.customerId, companyId: d.companyId, dealId: d.id, items, gst: 18, status,
      date, validTill: new Date(new Date(date).getTime() + 30 * DAY).toISOString(), ownerId: d.ownerId,
    })
  })

  // Projects (from won deals)
  const pstages: ProjectStage[] = ['Design', 'Production', 'Production', 'Dispatch', 'Installation', 'Installation', 'Handover']
  const projects: Project[] = deals.filter(d => d.stage === 'Won').slice(0, 26).map((d, i) => {
    const stage = pick(pstages)
    const inv = stage === 'Handover' ? d.value : stage === 'Installation' ? d.value * 0.7 : d.value * 0.4
    const rec = stage === 'Handover' ? inv * pick([1, 1, 0.8]) : inv * pick([0.5, 0.75, 1])
    const cust = customers.find(c => c.id === d.customerId)!
    const pm = USERS.filter(u => u.role === 'Project Manager')
    return {
      id: `p${i + 1}`, name: d.title, customerId: d.customerId, companyId: d.companyId, value: d.value,
      invoiced: round(inv, 1000), received: round(rec, 1000), stage,
      startDate: d.closedAt ?? d.createdAt, dueDate: daysAhead(int(-6, 45)),
      managerId: pick(pm).id, site: `${cust.name}, ${cust.city}`,
    }
  })

  // Tickets
  const subjects: Record<CompanyId, string[]> = {
    led: ['Dead pixels on module row 4', 'Video wall not powering on', 'Controller sync issue', 'Brightness uneven after rain'],
    av: ['Mic feedback in boardroom', 'VC camera not detected', 'Amplifier overheating', 'Projector colour issue'],
    digital: ['Kiosk touch not responding', 'CMS content not updating', 'Screen flickering'],
    signages: ['Letter LED fused', 'Glow sign light off', 'Hoarding flex torn'],
    tech: ['RFID reader offline', 'Attendance sync failure', 'Parking boom barrier stuck'],
    displays: ['Standee base damaged', 'Kiosk lock broken'],
    space: ['Ceiling panel loose', 'Workstation drawer jam'],
    studio: ['Revision request for brand kit'],
    tensile: ['Fabric sagging after storm', 'Rust on column base'],
  }
  const tstatus: TicketStatus[] = ['Open', 'Open', 'In Progress', 'Resolved', 'Resolved']
  const prio: Priority[] = ['Low', 'Medium', 'Medium', 'High', 'Critical']
  const tickets: Ticket[] = Array.from({ length: 34 }, (_, i) => {
    const co = pick(['led', 'led', 'av', 'av', 'digital', 'signages', 'tech', 'tensile', 'space', 'displays'] as CompanyId[])
    const eng = USERS.filter(u => u.role === 'Service Engineer')
    const t: Ticket = {
      id: `t${i + 1}`, number: `SR-${2600 + i}`, customerId: pick(customers).id, companyId: co,
      subject: pick(subjects[co]), priority: pick(prio), status: pick(tstatus), createdAt: daysAgo(int(0, 40)),
      assigneeId: pick(eng).id, amc: rnd() < 0.55,
    }
    return t
  })
  tickets.filter(t => t.status !== 'Resolved').slice(0, 6).forEach(t =>
    log({ at: t.createdAt, text: `Service request ${t.number}: ${t.subject}`, companyId: t.companyId, userId: t.assigneeId, customerId: t.customerId, kind: 'ticket' }))

  // Tasks
  const ttypes: TaskType[] = ['Call', 'Meeting', 'Site Visit', 'Email', 'Follow-up']
  const tasks: Task[] = Array.from({ length: 40 }, (_, i) => {
    const d = pick(deals.filter(x => !['Won', 'Lost'].includes(x.stage)))
    const type = pick(ttypes)
    const cust = customers.find(c => c.id === d.customerId)!
    const title = {
      Call: `Call ${cust.contact} regarding ${d.service}`,
      Meeting: `Meeting with ${cust.name}`,
      'Site Visit': `Site survey at ${cust.name}`,
      Email: `Send revised quote to ${cust.name}`,
      'Follow-up': `Follow up payment / PO – ${cust.name}`,
    }[type]
    const off = int(-4, 10)
    return {
      id: `k${i + 1}`, title, type, due: new Date(now() + off * DAY).toISOString().slice(0, 10),
      done: off < 0 ? rnd() < 0.6 : false, ownerId: d.ownerId, companyId: d.companyId, customerId: d.customerId,
    }
  })

  activities.sort((a, b) => b.at.localeCompare(a.at))
  return { customers, leads, deals, quotes, projects, tickets, tasks, activities }
}
