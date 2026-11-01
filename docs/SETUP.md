# Spiccioli — Guida di configurazione (solo browser)

> **Stato: bozza (Fase 1).** Le sezioni 1 e 6.4–6.5 sono complete; le altre le
> seguiremo insieme nelle fasi indicate e verranno corrette mentre le esegui.
> I nomi dei menu sono stati verificati sulla documentazione ufficiale di
> ottobre 2026; dove un'interfaccia può differire leggermente è segnato con ⚠️.

Questa guida è pensata per chi **non ha mai usato Supabase né GitHub Actions** e
**non installa nulla sul PC**. Ogni passo si fa dal browser.

## Come leggere questa guida

- 🔒 **Segreto**: non va mai incollato in chat, email, issue, PR o nel codice.
  Va solo nel posto indicato (e, se serve conservarlo, nel tuo password manager).
- 🌐 **Pubblico**: può comparire nel codice o nell'app senza rischi.
- ✅ **Verifica**: come capire che il passo è riuscito.
- Quando un passo dice "scrivimelo", copia in chat **solo** valori 🌐.

Ti serve un **password manager** (quello di iCloud/Password di Apple, Bitwarden,
1Password…): ci salverai password del database, password dell'app, chiave
privata Enable Banking e token.

### Riepilogo dei valori

| Valore | Tipo | Dove lo trovi | Dove va |
|---|---|---|---|
| Project ref (dev/prod) | 🌐 | Supabase → Project Settings → General → *Project ID* | GitHub → Environment → variabile `SUPABASE_PROJECT_REF` |
| Project URL (dev/prod) | 🌐 | Supabase → pulsante **Connect** | GitHub → Environment → variabile `SUPABASE_URL` |
| Publishable key (dev/prod) | 🌐 | Supabase → Project Settings → **API Keys** (`sb_publishable_…`) | GitHub → Environment → variabile `SUPABASE_PUBLISHABLE_KEY` |
| Secret key (`sb_secret_…`) | 🔒 | Supabase → Project Settings → API Keys | **Da nessuna parte**: la usa solo Supabase, internamente |
| Password del database (dev/prod) | 🔒 | Scelta alla creazione del progetto | Password manager + GitHub → Environment → secret `SUPABASE_DB_PASSWORD` |
| Access token Supabase | 🔒 | Supabase → Account → Access Tokens | GitHub → Environment → secret `SUPABASE_ACCESS_TOKEN` |
| `app_id` Enable Banking (sandbox/production) | 🔒 | Nome del file `.pem` scaricato | Supabase → Edge Functions → Secrets → `EB_APP_ID` |
| Chiave privata Enable Banking (`.pem`) | 🔒🔒 | Scaricata dal browser alla registrazione | **Solo** Supabase → Edge Functions → Secrets → `EB_PRIVATE_KEY` + password manager |
| Health token (dev/prod) | 🔒 | Generato dal password manager | Supabase secret `HEALTH_TOKEN` + GitHub secret `HEALTH_TOKEN` |
| Cloudflare Account ID | 🌐 | Cloudflare → Workers & Pages → *Account Details* | GitHub → Environment → variabile `CLOUDFLARE_ACCOUNT_ID` |
| Cloudflare API token | 🔒 | Cloudflare → Account API tokens | GitHub → Environment → secret `CLOUDFLARE_API_TOKEN` |

---

## 1. Repository GitHub e collegamento a Claude Code ✔️ (già fatto)

Il repository `AlessandroPoddighe/spiccioli` esiste ed è **pubblico** (ADR-0003),
e l'app GitHub di Claude ha accesso in scrittura. Per ricontrollare:

1. Apri `https://github.com/AlessandroPoddighe/spiccioli` → **Settings** → **General**:
   in fondo, *Danger Zone*, la visibilità deve risultare **Public**.
2. Apri `https://github.com/settings/installations` → alla voce **Claude** →
   **Configure**: in *Repository access* deve comparire `spiccioli`.

✅ Claude riesce a fare push sul branch di lavoro (lo vedi nella pagina
*Branches* del repository).

Facoltativo: il branch `develop` non serve. Per cancellarlo: pagina del
repository → **Branches** → icona del cestino accanto a `develop`.

---

## 2. Account e progetti Supabase *(Fase 2)*

### 2.1 Account

1. Vai su `https://supabase.com/dashboard` → **Sign in with GitHub** (così non
   hai un'altra password) e autorizza.
2. Alla prima apertura crea un'**organizzazione**: nome `Spiccioli`, tipo
   *Personal*, piano **Free**.

### 2.2 Creare i due progetti (ripeti due volte)

| | primo progetto | secondo progetto |
|---|---|---|
| Name | `spiccioli-dev` | `spiccioli-prod` |

1. **New project** → seleziona l'organizzazione `Spiccioli`.
2. **Project name**: come in tabella.
3. **Database Password**: premi **Generate a password**, poi copiala nel password
   manager con il titolo "Supabase spiccioli-dev — DB" (o `-prod`). 🔒
4. **Region**: area Europa → **Central EU (Frankfurt)**.
5. ⚠️ Se compaiono le opzioni di sicurezza (*Security options* / *Data API*):
   lascia **Enable Data API** attivo e **disattiva "Automatically expose new
   tables"**. Se non compaiono, va bene lo stesso: ci pensano le migrazioni.
6. **Create new project** e attendi ~2 minuti.

✅ La dashboard del progetto si apre e in alto compare il nome del progetto.

### 2.3 Dove trovare i valori

- **Project ref** 🌐: è la stringa di 20 lettere nell'indirizzo
  `https://supabase.com/dashboard/project/<ref>`; la trovi anche in
  **Project Settings → General → Project ID**.
- **Project URL** 🌐: `https://<ref>.supabase.co` (anche nel pulsante **Connect**
  in alto).
- **Publishable key** 🌐: **Project Settings → API Keys** → sezione *Publishable
  key* → copia il valore che inizia con `sb_publishable_`.
- **Secret key** 🔒: stessa pagina, *Secret keys*. **Non copiarla da nessuna
  parte**: le Edge Functions la ricevono automaticamente.
- **Password del database** 🔒: quella salvata al passo 2.2. Se la perdi:
  **Project Settings → Database → Reset database password** (poi aggiorna il
  secret su GitHub, §6).

👉 **Scrivimi in chat** i due *project ref* (sono pubblici).

---

## 3. Autenticazione *(Fase 2)*

Le impostazioni di Auth (registrazioni disattivate, MFA TOTP attiva, password
lunghe) sono **nel codice** (`supabase/config.toml`, ADR-0016) e vengono
applicate dal primo deploy. A te resta creare l'utente.

Per **ciascun** progetto (dev e prod):

1. **Authentication → Users → Add user → Create new user**.
2. Email: la tua. Password: generane una nuova dal password manager (almeno 12
   caratteri con maiuscole, minuscole e cifre) e salvala ("Spiccioli dev — login").
3. Spunta **Auto Confirm User** e premi **Create user**.

✅ L'utente compare nella lista *Users*.

Dopo il primo deploy (§8) verifica in **Authentication → Sign In / Providers**
che **Allow new users to sign up** risulti **disattivato**.

Al primo accesso l'app ti chiederà di **attivare l'autenticazione a due
fattori (TOTP)**: inquadra il QR con l'app **Password** di iPhone (o un'altra app
authenticator). Registra un **secondo fattore** su un altro dispositivo o nel
password manager: Supabase non fornisce codici di recupero (ADR-0005).

---

## 4. Applicazione Enable Banking *(Fase 3 per SANDBOX, Fase 7 per PRODUCTION)*

Per ora si registra solo l'applicazione **SANDBOX**, collegata al progetto **dev**.

1. Vai su `https://enablebanking.com/cp/applications` (Control Panel →
   **API applications**) ed entra con la tua email (link monouso).
2. Compila il modulo **Add a new application**:
   - **Environment**: *Sandbox*;
   - **Private key**: lascia l'opzione predefinita (*generata nel browser*);
   - **Application name**: `Spiccioli (dev)`;
   - **Redirect URLs**: `https://<REF-DEV>.supabase.co/functions/v1/eb-callback`
     (sostituisci `<REF-DEV>` con il project ref di dev);
   - ⚠️ eventuali altri campi (privacy policy, termini, email): in sandbox
     puoi indicare l'URL del repository GitHub e la tua email.
3. Premi **Register**. Il browser scarica un file
   `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pem`: **il nome del file è l'`app_id`**.
4. Conserva la chiave: apri il file `.pem` con **Blocco note** (tasto destro →
   *Apri con* → *Blocco note*), copia tutto e salvalo nel password manager come
   nota sicura "Enable Banking sandbox — chiave privata", insieme all'`app_id`.
5. Dopo il §5, **elimina il file** dalla cartella *Download* e svuota il cestino.

✅ L'applicazione compare nell'elenco *API applications* con ambiente *Sandbox*.

⚠️ La chiave privata **non va mai** su GitHub, in chat o in email. Se finisse
per errore da qualche parte: in Control Panel genera una nuova chiave e aggiorna
il secret (§5).

---

## 5. Secret delle Edge Functions *(Fase 2–3)*

Per il progetto **dev** (e più avanti, con i valori di produzione, per **prod**):

1. Dashboard Supabase del progetto → **Edge Functions → Secrets**.
2. Aggiungi (pulsante **Add another** per più righe, poi **Save**):

| Key | Value |
|---|---|
| `EB_APP_ID` | l'`app_id` (nome del file `.pem` senza estensione) |
| `EB_PRIVATE_KEY` | **tutto** il contenuto del file `.pem`, dalla riga `-----BEGIN` alla riga `-----END` comprese |
| `HEALTH_TOKEN` | una stringa casuale di 40 caratteri (lettere e cifre) generata dal password manager; salvala, servirà anche su GitHub |

**PEM multilinea.** Incolla il contenuto così com'è: se il campo unisce le righe
o le trasforma in spazi va bene lo stesso, il codice ricostruisce la chiave
(ADR-0011). Non aggiungere virgolette.

✅ La riga compare nell'elenco con il valore mascherato. Dopo il deploy, la
function `health` riporta `private_key_configured: true` (verifica nel §8).

---

## 6. GitHub: segreti, Environments, protezioni *(6.1–6.3 Fase 2; 6.4–6.5 subito)*

### 6.1 Access token Supabase (uno per ambiente) 🔒

1. Supabase → avatar in alto a destra → **Account preferences → Access Tokens**
   (`https://supabase.com/dashboard/account/tokens`) → **Generate new token**.
2. Nome `github-actions-dev`; **limita il token al solo progetto `spiccioli-dev`**
   e concedi solo i permessi elencati qui sotto. ⚠️ L'elenco esatto viene
   confermato in Fase 2 provando il primo deploy.
3. Copia subito il token (inizia con `sbp_`): non verrà più mostrato.
4. Ripeti per `github-actions-prod` limitato a `spiccioli-prod`.

Permessi necessari ai comandi usati dai workflow (`link`, `db push`,
`config push`, `functions deploy`, `secrets set`): *Project Settings*, *API
Keys*, *API Key Secrets* (Read); *Database config*, *Auth config*, *Data API
config*, *Storage config* (Read/Write); *Edge Functions* e *Edge Function
Secrets* (Write).

### 6.2 Environments `dev` e `production`

1. Repository → **Settings** → **Environments** → **New environment** → nome
   `dev` → **Configure environment**.
2. Sezione **Environment secrets** → **Add secret**, una per riga:

   | Nome | Valore |
   |---|---|
   | `SUPABASE_ACCESS_TOKEN` | token `github-actions-dev` (§6.1) |
   | `SUPABASE_DB_PASSWORD` | password DB di dev (§2.2) |
   | `HEALTH_TOKEN` | lo stesso del §5 per dev |
   | `CLOUDFLARE_API_TOKEN` | §7 |

3. Sezione **Environment variables** → **Add variable**:

   | Nome | Valore |
   |---|---|
   | `SUPABASE_PROJECT_REF` | ref di dev |
   | `SUPABASE_URL` | `https://<ref-dev>.supabase.co` |
   | `SUPABASE_PUBLISHABLE_KEY` | publishable key di dev |
   | `CLOUDFLARE_ACCOUNT_ID` | §7 |

4. Ripeti per **`production`** con i valori di prod, e in più:
   **Deployment branches and tags** → **Selected branches and tags** →
   **Add deployment branch or tag rule** → *Ref type* **Branch**, nome `main` →
   **Add rule**. Così i segreti di produzione sono usabili **solo** dai workflow
   che girano su `main`.

✅ In **Settings → Environments** vedi `dev` e `production`; `production` mostra
"1 branch rule".

### 6.3 Protezione di `main` (ruleset) — *dopo il primo run della CI*

I nomi dei controlli richiesti esistono solo dopo che la CI è girata almeno una
volta sulla PR della Fase 1.

1. Repository → **Settings** → **Rules** → **Rulesets** → **New ruleset** →
   **New branch ruleset**.
2. **Ruleset name**: `protezione-main`; **Enforcement status**: **Active**.
3. **Bypass list**: lascia vuoto.
4. **Target branches** → **Add a target** → **Include default branch**.
5. In **Branch protections** spunta:
   - **Restrict deletions**;
   - **Require a pull request before merging** (approvazioni richieste: **0**,
     perché sei l'unico revisore);
   - **Require status checks to pass** → **Add checks** e aggiungi i cinque
     controlli della CI: `Frontend (lint, typecheck, test, build)`,
     `Edge Functions (fmt, lint, check, test)`,
     `Database (migrazioni su DB pulito, pgTAP, esposizione API)`,
     `E2E Playwright (iPhone WebKit + desktop Chromium)`,
     `Sicurezza (segreti nel codice, migrazioni distruttive)`;
     spunta anche **Require branches to be up to date before merging**;
   - **Block force pushes**.
6. **Create**.

✅ Nella PR, il pulsante di merge resta grigio finché i controlli non sono verdi.

### 6.4 Impostazioni di GitHub Actions — *da fare subito*

1. Repository → **Settings** → **Actions** → **General**.
2. **Approval for running fork pull request workflows from contributors** →
   **Require approval for all external contributors** → **Save**.
3. **Workflow permissions** → **Read repository contents and packages
   permissions** (accesso in sola lettura) e lascia **non spuntato**
   *Allow GitHub Actions to create and approve pull requests* → **Save**.

✅ Le due sezioni mostrano le scelte salvate.

### 6.5 Secret scanning e push protection — *da fare subito*

1. Repository → **Settings** → nella barra laterale, sezione *Security and
   quality*, **Advanced Security**.
2. Accanto a **Secret Protection** premi **Enable** (se non è già attivo).
3. Nella sezione *Secret Protection*, accanto a **Push protection**, premi
   **Enable**.

✅ Entrambe le voci risultano *Enabled*. Da ora GitHub blocca qualunque push che
contenga un segreto riconoscibile.

---

## 7. Hosting del frontend: Cloudflare *(Fase 2)*

1. Vai su `https://dash.cloudflare.com/sign-up` e crea un account gratuito
   (email + password dal password manager; nessuna carta richiesta).
2. **Sottodominio workers.dev**: menu **Workers & Pages** → accanto a **Your
   subdomain** premi **Change** (o *Set up*) e scegli un nome, es. `poddighe`.
   Gli indirizzi dell'app saranno:
   - prod: `https://spiccioli.<sottodominio>.workers.dev`
   - dev: `https://spiccioli-dev.<sottodominio>.workers.dev`
3. **Account ID** 🌐: in **Workers & Pages**, riquadro **Account Details** →
   pulsante copia accanto ad **Account ID**.
4. **API token** 🔒: **Account API tokens** (`https://dash.cloudflare.com/?to=/:account/api-tokens`)
   → **Create Token** → in *Permission policies* scegli il modello **Edit
   Cloudflare Workers** → limita *Account Resources* al tuo account → crea e
   copia il token.
5. Inserisci Account ID e token negli Environments `dev` e `production` (§6.2).

👉 **Scrivimi in chat** il sottodominio scelto (è pubblico).

✅ In **Workers & Pages** vedi il sottodominio configurato.

---

## 8. Primo deploy e verifica end-to-end *(Fase 2)*

1. Fai il merge della PR della Fase 2 (pulsante **Merge pull request**).
2. Repository → tab **Actions** → workflow **Deploy produzione**: i job
   *Migrazioni*, *Edge Functions*, *Frontend* diventano verdi in sequenza.
3. **Da PC**: apri `https://spiccioli.<sottodominio>.workers.dev` → accedi con
   email e password di prod → attiva il TOTP → arrivi alla Home.
4. **Da iPhone**: apri lo stesso indirizzo in **Safari** → accedi → pulsante
   **Condividi** (quadrato con freccia) → **Aggiungi alla schermata Home** →
   **Aggiungi**. Apri l'icona *Spiccioli*: l'app si apre a tutto schermo.

✅ In fondo alla pagina il badge mostra la versione; su iPhone la barra di stato
non copre l'intestazione.

---

## 9. Provare una PR su dev prima del merge *(dalla Fase 2)*

1. Apri la PR su GitHub e attendi che i controlli diventino verdi.
2. Il job **Deploy dev** pubblica la PR sull'ambiente dev e aggiunge un
   commento con il link `https://spiccioli-dev.<sottodominio>.workers.dev`.
3. Apri il link da PC e/o iPhone (credenziali di **dev**). Il badge in basso
   deve mostrare `dev PR #<numero> · <commit>`: se mostra un'altra PR, un'altra
   PR è stata deployata dopo; rilancia il job dalla tab *Checks* della tua PR.
4. Se una PR abbandonata ha lasciato dev "sporco": tab **Actions** → workflow
   **Reset dev** → **Run workflow** (cancella solo i dati finti di sandbox).

---

## 10. Passaggio da SANDBOX a PRODUCTION *(Fase 7)*

Bozza, da completare in Fase 7:

1. Enable Banking Control Panel → **API applications** → nuova applicazione con
   **Environment: Production**, redirect URL
   `https://<REF-PROD>.supabase.co/functions/v1/eb-callback`.
2. Attivazione **ristretta**: collega i tuoi conti dal Control Panel (in questa
   modalità termini e privacy non vengono verificati e l'app vede solo i conti
   collegati). ⚠️ Nomi esatti dei pulsanti da confermare in Fase 7.
3. Inserisci `EB_APP_ID` ed `EB_PRIVATE_KEY` della production nei secret del
   progetto **prod** (§5).
4. Dall'app di prod: **Banche → Collega banca**.

---

## 11. Troubleshooting

### Leggere i log di GitHub Actions
Repository → tab **Actions** → clic sull'esecuzione (rossa ✗) → clic sul job
rosso → espandi lo step fallito. Per riprovare: **Re-run jobs** in alto a
destra → **Re-run failed jobs**.

### Leggere i log di Supabase
- **Edge Functions** → seleziona la function → tab **Logs** (errori) e
  **Invocations** (chiamate). I log non contengono mai IBAN, importi o
  descrizioni: sono redatti dal codice.
- **Logs & Analytics** (barra laterale) per API, Auth e Postgres.

### Problemi probabili

| Sintomo | Causa probabile | Soluzione |
|---|---|---|
| L'app mostra "Configurazione mancante" | Variabili dell'Environment GitHub mancanti | Controlla §6.2 e rilancia il deploy |
| Login: "Email o password non corretti" | Utente creato nell'altro progetto (dev/prod) | §3 per il progetto giusto |
| Deploy fallisce su `supabase link` / `config push` con *permission denied* | Token Supabase senza i permessi necessari | Rigenera il token con i permessi del §6.1 |
| Deploy fallisce con *password authentication failed* | Password DB errata nel secret | Reset password (§2.3) e aggiorna `SUPABASE_DB_PASSWORD` |
| Il progetto non risponde / dashboard "Paused" | Pausa per inattività (piano Free) | Dashboard → progetto → **Resume project**; vedi OPERATIONS.md |
| Enable Banking: *Redirect URI not allowed* | Redirect URL diverso da quello registrato | §4: deve essere esattamente `https://<ref>.supabase.co/functions/v1/eb-callback` |
| `health` dice `private_key_configured: false` | Secret mancante o nel progetto sbagliato | §5 |
| Su iPhone l'app non si aggiorna | Service worker con la versione precedente | Tocca **Aggiorna** sull'avviso "Nuova versione disponibile", oppure chiudi e riapri l'app |
