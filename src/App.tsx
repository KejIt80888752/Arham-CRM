import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Customers, { CustomerDetail } from './pages/Customers'
import Dashboard from './pages/Dashboard'
import { Companies, Reports, Team } from './pages/Group'
import Leads from './pages/Leads'
import Login from './pages/Login'
import { Projects, Service, Tasks } from './pages/Operations'
import Pipeline from './pages/Pipeline'
import Quotes, { QuoteEditor, QuoteView } from './pages/Quotes'
import { StoreProvider, useStore } from './store'

function Routed() {
  const { user } = useStore()
  if (!user) return <Login />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="quotes/new" element={<QuoteEditor />} />
        <Route path="quotes/:id" element={<QuoteView />} />
        <Route path="quotes/:id/edit" element={<QuoteEditor />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="projects" element={<Projects />} />
        <Route path="service" element={<Service />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="companies" element={<Companies />} />
        <Route path="reports" element={<Reports />} />
        <Route path="team" element={<Team />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routed />
      </HashRouter>
    </StoreProvider>
  )
}
