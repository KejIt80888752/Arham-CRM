import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { buildSeed, USERS } from './data/seed'
import type { Activity, CompanyId, DB, User } from './data/types'

const KEY = 'arham-crm-db-v2'
const SESSION = 'arham-crm-user'

type Coll = keyof DB
type Item<K extends Coll> = DB[K][number]

interface Store {
  db: DB
  scope: CompanyId | 'all'
  setScope: (s: CompanyId | 'all') => void
  user: User | null
  login: (id: string) => void
  logout: () => void
  add: <K extends Coll>(k: K, item: Item<K>) => void
  update: <K extends Coll>(k: K, id: string, patch: Partial<Item<K>>) => void
  remove: <K extends Coll>(k: K, id: string) => void
  log: (a: Omit<Activity, 'id' | 'at' | 'userId'>) => void
  reset: () => void
  inScope: <T extends { companyId: CompanyId }>(list: T[]) => T[]
}

const Ctx = createContext<Store | null>(null)

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return buildSeed()
}

export const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load)
  const [scope, setScope] = useState<CompanyId | 'all'>('all')
  const [userId, setUserId] = useState<string | null>(() => {
    try { return localStorage.getItem(SESSION) } catch { return null }
  })

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* ignore */ }
  }, [db])

  const user = USERS.find(u => u.id === userId) ?? null

  const store = useMemo<Store>(() => ({
    db, scope, setScope, user,
    login: id => { setUserId(id); try { localStorage.setItem(SESSION, id) } catch { /* ignore */ } },
    logout: () => { setUserId(null); try { localStorage.removeItem(SESSION) } catch { /* ignore */ } },
    add: (k, item) => setDb(d => ({ ...d, [k]: [item, ...d[k]] })),
    update: (k, id, patch) => setDb(d => ({ ...d, [k]: (d[k] as { id: string }[]).map(x => x.id === id ? { ...x, ...patch } : x) })),
    remove: (k, id) => setDb(d => ({ ...d, [k]: (d[k] as { id: string }[]).filter(x => x.id !== id) })),
    log: a => setDb(d => ({
      ...d,
      activities: [{ id: uid('a'), at: new Date().toISOString(), userId: userId ?? 'u1', ...a }, ...d.activities],
    })),
    reset: () => setDb(buildSeed()),
    inScope: list => scope === 'all' ? list : list.filter(x => x.companyId === scope),
  }), [db, scope, user, userId])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider missing')
  return s
}
