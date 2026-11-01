export function PlaceholderPage({ title, phase }: { title: string; phase: number }) {
  return (
    <section className="page">
      <h1 className="page__title">{title}</h1>
      <div className="card">
        <p>In arrivo nella Fase {phase}.</p>
      </div>
    </section>
  )
}
