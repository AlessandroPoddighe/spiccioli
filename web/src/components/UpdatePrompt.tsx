import { useRegisterSW } from 'virtual:pwa-register/react'

/** Avvisa quando è disponibile una nuova versione dell'app (service worker). */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="toast" role="status">
      <span>Nuova versione disponibile.</span>
      <button
        type="button"
        className="button button--primary"
        onClick={() => {
          void updateServiceWorker(true)
        }}
      >
        Aggiorna
      </button>
      <button
        type="button"
        className="button button--ghost"
        onClick={() => {
          setNeedRefresh(false)
        }}
      >
        Più tardi
      </button>
    </div>
  )
}
