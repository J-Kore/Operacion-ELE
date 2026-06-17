/**
 * ele-api-client.ts
 * ──────────────────────────────────────────────────────────────
 * Cliente tipado para ELE-API, pensado para usarse DESDE EL SERVIDOR
 * de Next.js (rutas app/api/.../route.ts o Server Actions).
 *
 * NO importar este módulo en componentes de cliente: maneja tokens
 * que no deben llegar al navegador.
 *
 * Uso básico:
 *   import { EleApiClient } from '@/lib/ele-api-client'
 *   const api = new EleApiClient()
 *   await api.login(email, password)          // guarda los tokens en memoria
 *   const { data } = await api.getLevels()     // ya autenticado
 *
 * Para persistir la sesión entre peticiones (recomendado en prod), ver
 * la nota sobre `setTokens` / `getTokens` al final.
 * ──────────────────────────────────────────────────────────────
 */

// ─── Tipos del contrato ───────────────────────────────────────

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2'
export type Skill     = 'CE' | 'CO' | 'EE' | 'EO'
export type InventoryComponent =
  | 'grammar' | 'vocabulary' | 'pragmatics' | 'culture' | 'phonetics' | 'spelling'

export interface TokenResponse {
  accessToken:  string
  tokenType:    'bearer'
  expiresIn:    number   // segundos
  refreshToken: string
}

export interface CurriculumLevel {
  id:            string          // "A1.1" … "B2.8"
  cefrLevel:     CefrLevel
  sublevelIndex: number
  name:          string
  approxHours:   number
  passThreshold: number          // [0–1]
  nextLevelId:   string | null
  description:   string | null
  createdAt:     string          // ISO 8601
  updatedAt:     string
}

export interface Inventory {
  id:          string
  levelId:     string
  component:   InventoryComponent
  subtype:     string
  description: string
  content:     Record<string, unknown> | null  // jsonb libre
  createdAt:   string
  updatedAt:   string
}

export interface Activity {
  id:               string
  levelId:          string
  skill:            Skill
  activityType:     string
  estimatedMinutes: number
  difficulty:       string
  content:          Record<string, unknown>   // forma depende de skill/type
  rubric:           Record<string, unknown>
  mediaId:          string | null
  isGenerated:      boolean
  createdAt:        string
  updatedAt:        string
}

export interface SkillScore {
  score:    number   // [0–1]
  skill:    Skill
  feedback: {
    summary:        string
    criteriaScores: Record<string, number>   // claves varían por destreza
  }
}

export interface UserLevel {
  userId:        string
  levelId:       string
  status:        'active' | 'passed' | 'blocked'
  scoreCE:       number | null
  scoreCO:       number | null
  scoreEE:       number | null
  scoreEO:       number | null
  overallScore:  number | null
  sessionsCount: number
  startedAt:     string
}

export interface UserProgress {
  userId:           string
  currentLevel:     UserLevel | null
  levelsCompleted:  string[]
  inventoryMastery: Array<{
    userId:       string
    inventoryId:  string
    masteryScore: number
    component:    InventoryComponent
    subtype:      string
  }>
  streak: { currentDays: number; longestDays: number }
}

export interface ListResponse<T> {
  data:  T[]
  total: number
}

/** Forma de `response` que espera /submit, según la destreza. */
export type SubmitResponse =
  | { answers: number[] }   // CE / CO con preguntas (índices elegidos)
  | { text: string }        // EE, EO, o CO tipo dictation (texto)

/** Error normalizado que lanza el cliente. */
export class EleApiError extends Error {
  constructor(
    public status: number,
    public code:   string | undefined,
    message:       string,
  ) {
    super(message)
    this.name = 'EleApiError'
  }
}

// ─── Cliente ──────────────────────────────────────────────────

const BASE_URL =
  process.env.ELE_API_URL ?? 'https://silabos-ele-api-production.up.railway.app'

export class EleApiClient {
  private accessToken:  string | null = null
  private refreshToken: string | null = null

  constructor(private baseUrl: string = BASE_URL) {}

  /** Inyecta tokens ya obtenidos (p. ej. recuperados de cookie/sesión). */
  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken  = accessToken
    this.refreshToken = refreshToken
  }

  /** Devuelve los tokens actuales para que TÚ los persistas (cookie httpOnly). */
  getTokens() {
    return { accessToken: this.accessToken, refreshToken: this.refreshToken }
  }

  // ── Auth ──────────────────────────────────────────────────

  /** POST /v1/auth/token — login. Guarda los tokens en el cliente. */
  async login(email: string, password: string): Promise<TokenResponse> {
    const tokens = await this.raw<TokenResponse>('POST', '/v1/auth/token', {
      body: { email, password },
      auth: false,
    })
    this.accessToken  = tokens.accessToken
    this.refreshToken = tokens.refreshToken
    return tokens
  }

  /** POST /v1/auth/refresh — renueva (rota) los tokens. */
  async refresh(): Promise<TokenResponse> {
    if (!this.refreshToken) throw new EleApiError(401, 'NO_REFRESH', 'No hay refresh token.')
    const tokens = await this.raw<TokenResponse>('POST', '/v1/auth/refresh', {
      body: { refreshToken: this.refreshToken },
      auth: false,
    })
    this.accessToken  = tokens.accessToken
    this.refreshToken = tokens.refreshToken
    return tokens
  }

  // ── Currículo ─────────────────────────────────────────────

  /** GET /v1/curriculum/levels — lista subniveles. */
  getLevels(cefrLevel?: CefrLevel) {
    const qs = cefrLevel ? `?cefrLevel=${cefrLevel}` : ''
    return this.request<ListResponse<CurriculumLevel>>('GET', `/v1/curriculum/levels${qs}`)
  }

  /** GET /v1/curriculum/levels/:id — detalle de un subnivel. */
  getLevel(levelId: string) {
    return this.request<CurriculumLevel>('GET', `/v1/curriculum/levels/${levelId}`)
  }

  /** GET /v1/curriculum/levels/:id/inventories — inventarios del subnivel. */
  getInventories(levelId: string, component?: InventoryComponent) {
    const qs = component ? `?component=${component}` : ''
    return this.request<ListResponse<Inventory>>(
      'GET', `/v1/curriculum/levels/${levelId}/inventories${qs}`,
    )
  }

  // ── Actividades ───────────────────────────────────────────

  /** GET /v1/activities — lista actividades con filtros. */
  listActivities(filters: {
    levelId?: string; skill?: Skill; activityType?: string
    limit?: number; offset?: number
  } = {}) {
    const qs = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]),
    ).toString()
    return this.request<ListResponse<Activity>>('GET', `/v1/activities${qs ? `?${qs}` : ''}`)
  }

  /** GET /v1/activities/:id — detalle de una actividad. */
  getActivity(activityId: string) {
    return this.request<Activity>('GET', `/v1/activities/${activityId}`)
  }

  /**
   * POST /v1/activities/:id/submit — evalúa la respuesta del estudiante.
   * `response` debe coincidir con la destreza (ver tipo SubmitResponse).
   */
  submitActivity(
    activityId: string,
    userId:     string,
    response:   SubmitResponse,
    durationSeconds?: number,
  ) {
    return this.request<SkillScore>('POST', `/v1/activities/${activityId}/submit`, {
      body: { userId, response, durationSeconds },
    })
  }

  // ── Progreso ──────────────────────────────────────────────

  /** GET /v1/users/:userId/progress — progreso completo. */
  getProgress(userId: string) {
    return this.request<UserProgress>('GET', `/v1/users/${userId}/progress`)
  }

  /** GET /v1/users/:userId/progress/:levelId — progreso en un subnivel. */
  getLevelProgress(userId: string, levelId: string) {
    return this.request<UserLevel>('GET', `/v1/users/${userId}/progress/${levelId}`)
  }

  // ── Núcleo: petición con refresh automático ───────────────

  /**
   * Hace una petición autenticada. Si recibe 401, intenta refrescar UNA vez
   * y reintenta. Si el refresh también falla, propaga el error 401.
   */
  private async request<T>(
    method: string, path: string, opts: { body?: unknown } = {},
  ): Promise<T> {
    try {
      return await this.raw<T>(method, path, { ...opts, auth: true })
    } catch (err) {
      if (err instanceof EleApiError && err.status === 401 && this.refreshToken) {
        await this.refresh()                       // renueva tokens
        return this.raw<T>(method, path, { ...opts, auth: true })  // reintenta
      }
      throw err
    }
  }

  /** Petición HTTP cruda. No reintenta. */
  private async raw<T>(
    method: string, path: string,
    opts: { body?: unknown; auth?: boolean } = {},
  ): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (opts.auth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store',   // datos siempre frescos en el servidor de Next
    })

    // Parseo defensivo: algunos errores pueden no traer JSON
    const text = await res.text()
    const json = text ? JSON.parse(text) : null

    if (!res.ok) {
      throw new EleApiError(
        res.status,
        json?.code,
        json?.message ?? `Error ${res.status} en ${path}`,
      )
    }
    return json as T
  }
}
