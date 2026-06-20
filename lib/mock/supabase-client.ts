/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  MOCK_SESSION,
  MOCK_USER,
  MOCK_USER_ID,
  createEmptyStore
} from "@/lib/mock/data"
function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `mock-${Date.now()}`
}

const demoLog = (action: string, detail?: string) => {
  if (detail) {
    console.log(`[Demo mode] ${action}: ${detail}`)
  } else {
    console.log(`[Demo mode] ${action}`)
  }
}

const globalStore =
  typeof globalThis !== "undefined"
    ? ((globalThis as any).__MOCK_SUPABASE_STORE ??=
        createEmptyStore())
    : createEmptyStore()

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function getNestedRelation(table: string): string | null {
  const map: Record<string, string> = {
    workspaces: "assistants",
    assistants: "workspaces",
    collections: "workspaces",
    files: "workspaces",
    presets: "workspaces",
    prompts: "workspaces",
    tools: "workspaces",
    models: "workspaces"
  }
  return map[table] ?? null
}

function attachNestedRows(row: any, selectStr: string, table: string) {
  const result = { ...row }
  const nestedMatches = selectStr.matchAll(/(\w+)\s*\(\*\)/g)

  for (const match of nestedMatches) {
    const relation = match[1]
    const store = globalStore[relation] as any[] | undefined
    if (!store) {
      result[relation] = []
      continue
    }

    if (table === "workspaces") {
      result[relation] = clone(store.filter(item => item.user_id === row.user_id))
    } else {
      result[relation] = clone(store)
    }
  }

  return result
}

type MockQueryResult = { data: any; error: any; count?: number | null }

class MockQueryBuilder implements PromiseLike<MockQueryResult> {
  private table: string
  private selectStr = "*"
  private filters: Array<{
    column: string
    value: unknown
    op: "eq" | "neq" | "lte" | "gte"
  }> = []
  private orderSpec: { column: string; ascending: boolean } | null = null
  private limitCount: number | null = null
  private mode: "select" | "insert" | "update" | "delete" | "upsert" = "select"
  private payload: any = null
  private upsertOptions: any = null
  private selectOptions: { count?: string; head?: boolean } | null = null
  private returnSingle = false
  private returnMaybeSingle = false

  constructor(table: string) {
    this.table = table
  }

  select(columns = "*", options?: { count?: string; head?: boolean }) {
    this.selectOptions = options ?? null
    if (this.mode === "insert" || this.mode === "update" || this.mode === "upsert") {
      this.selectStr = columns
    } else {
      this.mode = "select"
      this.selectStr = columns
    }
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value, op: "eq" })
    return this
  }

  neq(column: string, value: unknown) {
    this.filters.push({ column, value, op: "neq" })
    return this
  }

  lte(column: string, value: unknown) {
    this.filters.push({ column, value, op: "lte" })
    return this
  }

  gte(column: string, value: unknown) {
    this.filters.push({ column, value, op: "gte" })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderSpec = { column, ascending: options?.ascending ?? true }
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  insert(values: any) {
    this.mode = "insert"
    this.payload = values
    return this
  }

  update(values: any) {
    this.mode = "update"
    this.payload = values
    return this
  }

  upsert(values: any, options?: any) {
    this.mode = "upsert"
    this.payload = values
    this.upsertOptions = options
    return this
  }

  delete() {
    this.mode = "delete"
    return this
  }

  single() {
    this.returnSingle = true
    return this
  }

  maybeSingle() {
    this.returnMaybeSingle = true
    return this
  }

  then<TResult1 = MockQueryResult, TResult2 = never>(
    onfulfilled?:
      | ((value: MockQueryResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected)
  }

  private applyFilters(rows: any[]) {
    return rows.filter(row => {
      return this.filters.every(filter => {
        const cell = row?.[filter.column]
        if (filter.op === "eq") return cell === filter.value
        if (filter.op === "neq") return cell !== filter.value
        if (filter.op === "lte") return String(cell) <= String(filter.value)
        if (filter.op === "gte") return String(cell) >= String(filter.value)
        return true
      })
    })
  }

  private getTableRows() {
    if (!globalStore[this.table]) {
      globalStore[this.table] = []
    }
    return globalStore[this.table] as any[]
  }

  private execute(): MockQueryResult | Promise<MockQueryResult> {
    try {
      const rows = this.getTableRows()

      if (this.mode === "insert") {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload]
        const created = items.map(item => ({
          id: item.id ?? newId(),
          user_id: item.user_id ?? MOCK_USER_ID,
          created_at: item.created_at ?? new Date().toISOString(),
          updated_at: item.updated_at ?? new Date().toISOString(),
          ...item
        }))
        rows.push(...created)
        demoLog("insert", this.table)
        const data = this.returnSingle ? created[0] : created
        return { data: clone(data), error: null }
      }

      if (this.mode === "update") {
        const matched = this.applyFilters(rows)
        matched.forEach(row => Object.assign(row, this.payload, { updated_at: new Date().toISOString() }))
        demoLog("update", this.table)
        const data = this.returnSingle ? matched[0] ?? null : matched
        if (this.returnSingle && !data) {
          return { data: null, error: { message: "Row not found", code: "PGRST116" } }
        }
        return { data: clone(data), error: null }
      }

      if (this.mode === "upsert") {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload]
        const upserted: any[] = []
        for (const item of items) {
          const conflict = this.upsertOptions?.onConflict as string | undefined
          let existing: any = null
          if (conflict) {
            const keys = conflict.split(",").map(k => k.trim())
            existing = rows.find(row => keys.every(key => row[key] === item[key]))
          }
          if (existing) {
            Object.assign(existing, item, { updated_at: new Date().toISOString() })
            upserted.push(existing)
          } else {
            const created = {
              id: item.id ?? newId(),
              user_id: item.user_id ?? MOCK_USER_ID,
              created_at: item.created_at ?? new Date().toISOString(),
              updated_at: item.updated_at ?? new Date().toISOString(),
              ...item
            }
            rows.push(created)
            upserted.push(created)
          }
        }
        demoLog("upsert", this.table)
        return { data: clone(this.returnSingle ? upserted[0] : upserted), error: null }
      }

      if (this.mode === "delete") {
        const before = rows.length
        const remaining = rows.filter(row => !this.applyFilters([row]).length)
        globalStore[this.table] = remaining
        demoLog("delete", `${this.table} (${before - remaining.length} rows)`)
        return { data: null, error: null }
      }

      let filtered = this.applyFilters([...rows])

      if (this.orderSpec) {
        filtered.sort((a, b) => {
          const av = a[this.orderSpec!.column]
          const bv = b[this.orderSpec!.column]
          if (av === bv) return 0
          const cmp = av > bv ? 1 : -1
          return this.orderSpec!.ascending ? cmp : -cmp
        })
      }

      if (this.limitCount !== null) {
        filtered = filtered.slice(0, this.limitCount)
      }

      if (this.selectStr !== "*") {
        filtered = filtered.map(row => attachNestedRows(row, this.selectStr, this.table))
      }

      if (this.selectOptions?.count && this.selectOptions?.head) {
        return { data: null, error: null, count: filtered.length }
      }

      if (this.returnSingle) {
        if (filtered.length === 0) {
          return { data: null, error: { message: "Row not found", code: "PGRST116" } }
        }
        return { data: clone(filtered[0]), error: null }
      }

      if (this.returnMaybeSingle) {
        return { data: filtered[0] ? clone(filtered[0]) : null, error: null }
      }

      return { data: clone(filtered), error: null }
    } catch (error: any) {
      return { data: null, error: { message: error?.message ?? "Mock query failed" } }
    }
  }
}

function createStorageBucket() {
  return {
    upload: async (_path: string, _file: File | Blob, _opts?: any) => {
      demoLog("storage upload")
      return { data: { path: _path }, error: null }
    },
    remove: async (_paths: string[]) => {
      demoLog("storage remove")
      return { data: null, error: null }
    },
    download: async (_path: string) => {
      demoLog("storage download")
      return { data: new Blob(), error: null }
    },
    createSignedUrl: async (path: string, _expiresIn: number) => {
      return { data: { signedUrl: `/placeholder/${path}` }, error: null }
    },
    createSignedUrls: async (paths: string[], _expiresIn: number) => {
      return {
        data: paths.map(path => ({ path, signedUrl: `/placeholder/${path}` })),
        error: null
      }
    },
    getPublicUrl: (path: string) => ({
      data: { publicUrl: `/placeholder/${path}` }
    })
  }
}

export function createMockSupabaseClient() {
  const auth = {
    getSession: async () => ({ data: { session: MOCK_SESSION }, error: null }),
    getUser: async () => ({ data: { user: MOCK_USER }, error: null }),
    signInWithPassword: async (_credentials: any) => {
      demoLog("signInWithPassword")
      return { data: { session: MOCK_SESSION, user: MOCK_USER }, error: null }
    },
    signUp: async (_credentials: any) => {
      demoLog("signUp")
      return { data: { session: MOCK_SESSION, user: MOCK_USER }, error: null }
    },
    signOut: async () => {
      demoLog("signOut")
      return { error: null }
    },
    updateUser: async (attrs: any) => {
      demoLog("updateUser")
      return { data: { user: { ...MOCK_USER, ...attrs } }, error: null }
    },
    resetPasswordForEmail: async (_email: string) => {
      demoLog("resetPasswordForEmail")
      return { data: {}, error: null }
    },
    exchangeCodeForSession: async (_code: string) => {
      demoLog("exchangeCodeForSession")
      return { data: { session: MOCK_SESSION }, error: null }
    },
    admin: {
      getUserById: async (_id: string) => ({
        data: { user: MOCK_USER },
        error: null
      })
    }
  }

  const rpc = async (fn: string, _args?: any) => {
    demoLog("rpc", fn)
    return { data: true, error: null }
  }

  const from = (table: string) => new MockQueryBuilder(table)

  return {
    auth,
    from,
    schema: (_schema: string) => ({ from, rpc }),
    storage: {
      from: (_bucket: string) => createStorageBucket()
    },
    rpc,
    functions: {
      invoke: async (name: string, _options?: any) => {
        demoLog("functions.invoke", name)
        return { data: { success: true }, error: null }
      }
    }
  }
}

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>
