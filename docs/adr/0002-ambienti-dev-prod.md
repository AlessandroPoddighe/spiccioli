# ADR-0002 — Due progetti Supabase: dev (sandbox) e prod

Stato: Proposto

## Contesto

Il piano Free consente **2 progetti attivi** (il limite vale su tutte le
organizzazioni di cui sei Owner/Admin). Non esiste un ambiente locale sul PC.
Il Branching di Supabase (DB effimeri per PR) è a pagamento.

## Decisione

- **dev** (`spiccioli-dev`): Enable Banking **SANDBOX**; aggiornato a ogni PR
  dopo che tutti i check sono verdi: `supabase db push --include-all`,
  `supabase config push`, `supabase functions deploy --use-api`, deploy del
  Worker `spiccioli-dev`, commento nella PR con il link.
- **prod** (`spiccioli-prod`): Enable Banking **PRODUCTION** (modalità
  ristretta ai tuoi conti); aggiornato **solo** al merge su `main`.
- Entrambi in regione UE (Francoforte, `eu-central-1`).
- **Concorrenza**: `concurrency: { group: deploy-dev, cancel-in-progress: false }`
  → un solo deploy dev alla volta, in coda gli altri. L'ultima PR deployata vince;
  il badge in app dice quale.
- **Deriva di dev**: le migrazioni di una PR non mergiata restano applicate su
  dev. Il workflow manuale **`reset-dev`** esegue `supabase db reset --linked`
  su dev (solo dati sandbox) e riapplica le migrazioni di `main`.
  `--include-all` gestisce migrazioni con timestamp precedenti a quelle già
  applicate (due PR in parallelo).

## Alternative considerate

- *Un solo progetto + schemi per ambiente*: mescola sandbox e dati reali, Auth e
  secret condivisi. Scartata.
- *Dev aggiornato solo su un branch `develop`*: non permette di provare una PR
  prima del merge, requisito esplicito. Scartata. (Il branch `develop` esistente
  non viene usato; può essere cancellato.)

## Conseguenze

- Nessun terzo progetto possibile (es. per test di restore: il restore di prova
  si fa su dev, vedi ADR-0012).
- Entrambi i progetti vanno tenuti attivi (ADR-0013).
