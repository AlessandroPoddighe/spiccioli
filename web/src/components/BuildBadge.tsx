import { useConfig } from '../config-context'

const LABELS = { local: 'locale', dev: 'dev', prod: '' } as const

/** Mostra ambiente e versione deployata (in dev: PR e commit). */
export function BuildBadge() {
  const { appEnv, buildInfo } = useConfig()
  const label = LABELS[appEnv]
  return (
    <p className={`build-badge build-badge--${appEnv}`} data-testid="build-badge">
      {label && <strong>{label}</strong>} {buildInfo}
    </p>
  )
}
