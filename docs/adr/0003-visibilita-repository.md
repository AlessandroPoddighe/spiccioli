# ADR-0003 — Repository pubblico vs privato sul piano GitHub Free

Stato: **Decisione richiesta all'utente**

## Contesto

Hai chiesto un repository **privato** e, allo stesso tempo, **protezione di
`main`**, **GitHub Environments** (`dev`, `production`) per isolare i secret e
**secret scanning** attivo, a **costo zero**. Sul piano **GitHub Free** per
account personali queste funzioni **non sono disponibili sui repository privati**
(documentazione GitHub):

| Funzione | Repo pubblico (Free) | Repo privato (Free) |
|---|---|---|
| Branch protection / rulesets | ✅ | ❌ (serve GitHub Pro) |
| Environments con secret e restrizione ai branch | ✅ | ❌ (serve GitHub Pro) |
| Secret scanning + push protection | ✅ | ❌ (prodotto a pagamento) |
| Minuti GitHub Actions | illimitati | 2.000/mese |
| Artifact (backup cifrati) scaricabili | da qualunque utente GitHub loggato | solo da te |

Nota: il repository `AlessandroPoddighe/spiccioli` oggi è **pubblico**.

## Opzioni

### A — Repository pubblico (raccomandata)

Il codice non contiene segreti né dati (requisito già non negoziabile); URL e
publishable key di Supabase sono comunque pubblici nel bundle del frontend.
Ottieni gratis tutte le protezioni richieste. Misure aggiuntive:

- log di CI mai con dati reali (i test usano solo fixture sintetiche; i deploy
  non stampano dati);
- i backup cifrati **non** vanno negli artifact (sarebbero scaricabili da altri,
  pur cifrati) ma in un **secondo repository privato** `spiccioli-backups`
  (vedi ADR-0012), dove il limite di minuti non conta perché lì non gira CI;
- PR da fork disabilitate per i workflow con secret (default di GitHub per i
  secret; in più i job di deploy richiedono `github.event.pull_request.head.repo.full_name == github.repository`).

### B — Repository privato, con compensazioni gratuite

- **Niente Environments**: secret a livello di repository con prefissi
  `DEV_`/`PROD_`; i job prod girano solo con `github.ref == 'refs/heads/main'`.
  Limite: un workflow modificato in una PR **potrebbe** leggere i secret prod.
  Le PR le apro io (l'agente): l'isolamento "i secret di produzione non passano
  dal tuo ambiente" diventa una convenzione, non un vincolo tecnico.
- **Niente protezione di `main`**: sostituita da disciplina (merge solo da PR)
  e da un workflow che segnala push diretti. Non impedisce nulla.
- **Secret scanning**: sostituito da `gitleaks` in CI e prima di ogni commit
  nell'ambiente dell'agente.
- Budget di 2.000 minuti/mese: sufficiente (~15 min per PR) ma va sorvegliato.

### C — Repository privato + GitHub Pro (~4 $/mese)

Tutto disponibile, ma viola il vincolo "costo zero".

## Raccomandazione

**A**. Il valore di un repo privato qui è basso (nessun segreto, nessun dato),
mentre le tre protezioni perse con B sono proprio quelle che hai chiesto per la
sicurezza dei dati di produzione.

## Conseguenze

Dipendono dalla scelta; SETUP.md e i workflow verranno scritti per l'opzione
approvata.
