export interface RegisterEffectOptions {
  scheduler?: ((fn: () => void) => void) | null
  lazy?: boolean
}
