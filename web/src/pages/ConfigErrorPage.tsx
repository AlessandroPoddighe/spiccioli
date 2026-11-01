export function ConfigErrorPage({ missing }: { missing: string[] }) {
  return (
    <main className="center-screen">
      <div className="card">
        <h1 className="page__title">Configurazione mancante</h1>
        <p>Questo build non contiene le impostazioni necessarie:</p>
        <ul>
          {missing.map((m) => (
            <li key={m}>
              <code>{m}</code>
            </li>
          ))}
        </ul>
        <p>Controlla le variabili dell&apos;environment su GitHub (vedi docs/SETUP.md).</p>
      </div>
    </main>
  )
}
