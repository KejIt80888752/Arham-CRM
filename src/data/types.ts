export type CompanyId =
  | 'signages' | 'displays' | 'digital' | 'led' | 'av' | 'tech' | 'space' | 'studio' | 'tensile'

export interface Company {
  id: CompanyId
  name: string
  short: string
  tagline: string
  color: string
  website: string
  services: string[]
}

export type Role = 'Group Admin' | 'Company Head' | 'Sales Manager' | 'Sales Executive' | 'Project Manager' | 'Service Engineer'

export interface User {
  id: string
  name: string
  role: Role
  companyId: CompanyId | 'group'
  phone: string
  email: string
}

export interface Customer {
  id: string
  name: string
  industry: string
  city: string
  contact: string
  phone: string
  email: string
  gstin: string
  ownerId: string
  createdAt: string
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Unqualified' | 'Converted'
export const LEAD_STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted']
export const LEAD_SOURCES = ['Website', 'WhatsApp', 'Referral', 'Walk-in', 'IndiaMART', 'JustDial', 'Exhibition', 'Cold Call', 'Existing Client'] as const

export interface Lead {
  id: string
  contact: string
  org: string
  phone: string
  email: string
  city: string
  source: string
  companyId: CompanyId
  service: string
  value: number
  status: LeadStatus
  ownerId: string
  createdAt: string
  notes: string
}

export type Stage = 'Enquiry' | 'Site Survey' | 'Design & Quote' | 'Negotiation' | 'Won' | 'Lost'
export const STAGES: Stage[] = ['Enquiry', 'Site Survey', 'Design & Quote', 'Negotiation', 'Won', 'Lost']
export const STAGE_PROB: Record<Stage, number> = {
  Enquiry: 10, 'Site Survey': 30, 'Design & Quote': 50, Negotiation: 75, Won: 100, Lost: 0,
}

export interface Deal {
  id: string
  title: string
  customerId: string
  companyId: CompanyId
  service: string
  value: number
  stage: Stage
  ownerId: string
  expectedClose: string
  createdAt: string
  closedAt?: string
}

export interface QuoteItem { desc: string; qty: number; rate: number }
export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected'

export interface Quote {
  id: string
  number: string
  customerId: string
  companyId: CompanyId
  dealId?: string
  items: QuoteItem[]
  gst: number
  status: QuoteStatus
  date: string
  validTill: string
  ownerId: string
}

export type ProjectStage = 'Design' | 'Production' | 'Dispatch' | 'Installation' | 'Handover'
export const PROJECT_STAGES: ProjectStage[] = ['Design', 'Production', 'Dispatch', 'Installation', 'Handover']

export interface Project {
  id: string
  name: string
  customerId: string
  companyId: CompanyId
  value: number
  invoiced: number
  received: number
  stage: ProjectStage
  startDate: string
  dueDate: string
  managerId: string
  site: string
}

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved'
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'

export interface Ticket {
  id: string
  number: string
  customerId: string
  companyId: CompanyId
  subject: string
  priority: Priority
  status: TicketStatus
  createdAt: string
  assigneeId: string
  amc: boolean
}

export type TaskType = 'Call' | 'Meeting' | 'Site Visit' | 'Email' | 'Follow-up'
export const TASK_TYPES: TaskType[] = ['Call', 'Meeting', 'Site Visit', 'Email', 'Follow-up']

export interface Task {
  id: string
  title: string
  type: TaskType
  due: string
  done: boolean
  ownerId: string
  companyId: CompanyId
  customerId?: string
}

export interface Activity {
  id: string
  at: string
  text: string
  companyId: CompanyId
  userId: string
  customerId?: string
  kind: 'lead' | 'deal' | 'quote' | 'project' | 'ticket' | 'task' | 'note'
}

export interface DB {
  customers: Customer[]
  leads: Lead[]
  deals: Deal[]
  quotes: Quote[]
  projects: Project[]
  tickets: Ticket[]
  tasks: Task[]
  activities: Activity[]
}
