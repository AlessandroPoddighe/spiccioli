# ADR-0009 — Deduplica e transizione pending → booked

Stato: Proposto

## Contesto

Gli identificativi dei movimenti non sono garantiti: `entry_reference` è spesso
l'unico stabile, `transaction_id` può essere nullo, e i pending possono non avere
identificativi o averne di diversi una volta contabilizzati.

## Decisione

1. `dedup_key` per conto, in ordine: `'er:' || entry_reference` →
   `'ti:' || transaction_id` → `'h:' || sha256(campi stabili)`. Campi stabili:
   `booking_date` (o `value_date`/`transaction_date` se manca), importo
   normalizzato, valuta, `credit_debit_indicator`, IBAN e nome controparte
   normalizzati (maiuscolo, spazi compressi), causale normalizzata, **più
   l'ordinale** tra movimenti con lo stesso hash nella stessa risposta.
2. Upsert su `(account_id, dedup_key)`: un movimento già visto aggiorna
   `last_seen_run` e i campi mutabili; `raw_sha256` punta all'ultima versione.
3. **Pending effimeri**: un pending esiste finché la banca lo restituisce. A ogni
   sync che copre una finestra, i pending del conto in quella finestra non più
   restituiti ricevono `removed_at`. Mai `DELETE` fisico.
4. **Eredità dell'override**: un nuovo booked che corrisponde a un pending
   rimosso (stesso segno e importo, controparte compatibile, date entro 5 giorni,
   match univoco) ne eredita override e nota.
5. Funzione SQL pura e deterministica, coperta da test pgTAP con casi: id
   presenti, id assenti, movimenti identici nello stesso giorno, pending →
   booked con e senza id, pending annullato.

## Conseguenze

- Se una banca cambiasse il testo della causale di un booked già visto senza
  fornire id, si creerebbe un duplicato: un controllo in `mart` segnala coppie
  sospette (stesso conto, data, importo) per revisione manuale.
