/* ============================================================
   Hono environment types — typed context variables.
   ============================================================ */

export interface AppEnv {
  Variables: {
    userId: string
    email: string
    requestId?: string
  }
}
