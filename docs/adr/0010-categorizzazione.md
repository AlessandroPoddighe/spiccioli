# ADR-0010 — Categorizzazione materializzata con precedenze

Stato: Proposto

## Contesto

Regole modificabili da UI (pattern su causale/controparte/MCC), override per
singolo movimento con precedenza, categorie gerarchiche, giroconti esclusi.
Valutare N regole regex × M movimenti a ogni apertura della dashboard è inutile.

## Decisione

- Precedenza: override → giroconto → prima regola per `priority` → "Da
  categorizzare".
- Risultato materializzato in `core.transaction_categorization`, ricalcolato:
  - a fine sync per i movimenti nuovi/modificati;
  - per **tutti** i movimenti quando cambia una regola (RPC
    `api.save_rule` → `internal.recategorize()`; con poche migliaia di righe è
    nell'ordine dei millisecondi/secondi);
  - per il singolo movimento su override.
- Categorie a 2 livelli (es. *Casa › Bollette*) con `kind` che guida l'analisi
  (`expense`, `income`, `transfer`, `excluded`). Set iniziale di categorie in
  italiano creato da migrazione (dati di riferimento, nessun dato personale).
- Giroconti: riconosciuti in SQL (IBAN controparte tra i miei conti, oppure
  coppia speculare tra due miei conti entro 3 giorni); marcati e collegati tra
  loro.
- "Crea regola da questo movimento": l'RPC propone pattern e mostra in anteprima
  quanti e quali movimenti verrebbero toccati prima di salvare.

## Conseguenze

- La dashboard legge solo join semplici; il costo è spostato sulle scritture,
  che sono rare.
