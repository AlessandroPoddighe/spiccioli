# ADR-0012 — Backup cifrati con `age` via GitHub Actions

Stato: Proposto

## Contesto

Il piano Free non ha backup giornalieri; Supabase raccomanda `supabase db dump`
e copie off-site. Vincoli: niente dump in chiaro in artifact o repository,
scaricabile dal browser, nessun tool sul PC.

## Decisione

- Workflow `backup` (schedulato giornaliero + manuale), environment `production`:
  `supabase db dump` (schema `raw`, `core`, auth users esclusi) → compressione →
  **cifratura asimmetrica con `age`** verso una **chiave pubblica**
  (`BACKUP_AGE_RECIPIENT`, variabile non segreta). Il runner **non possiede la
  chiave per decifrare**: un workflow compromesso non può leggere i backup.
- Destinazione:
  - opzione A di ADR-0003 (repo pubblico): commit del file `.sql.gz.age` in un
    **repository privato separato** `spiccioli-backups` (token con permesso
    *Contents: write* solo su quel repo); retention: ultimi 30 giornalieri +
    12 mensili (pulizia nello stesso workflow, storia git compattata);
  - opzione B (repo privato): artifact del workflow con retention 90 giorni.
- **Chiave privata `age`**: generata **nel browser** in una pagina dell'app
  (`age-encryption`, implementazione JS ufficiale di Filippo Valsorda), mostrata
  una volta e salvata da te nel password manager. Mai inviata a server.
- **Restore** (dal browser): workflow manuale `restore` che riceve il nome del
  backup; la chiave privata viene incollata come secret temporaneo
  dell'environment, il workflow decifra e ripristina (prova consigliata su
  **dev**), poi il secret si cancella. In alternativa la pagina dell'app decifra
  il file localmente e permette di scaricare l'SQL in chiaro (solo se lo chiedi).

## Conseguenze

- Prova di restore trimestrale su dev documentata in OPERATIONS.md.
- I dati di Auth non sono nel backup: l'utente si ricrea a mano (1 minuto).
