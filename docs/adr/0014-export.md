# ADR-0014 — Export CSV e Parquet nel browser, senza duckdb-wasm

Stato: Proposto

## Decisione

- **CSV** generato nel browser dai dati già filtrati (RPC `api.export_transactions`
  paginata): UTF-8 con BOM, separatore `;`, decimali con virgola opzionali
  (preimpostato "Excel italiano"), date ISO. Download con `Blob` + `<a download>`
  (funziona su Safari iOS: il file finisce in *File › Download*) e su Windows.
- **Parquet** con `hyparquet-writer` (JavaScript puro, ~decine di KB, caricato
  solo quando serve): tipi espliciti (date, decimal/double, string), compressione
  Snappy.

## Alternative considerate

- *duckdb-wasm*: diversi MB di WebAssembly da scaricare su iPhone e file wasm più
  grandi del limite per singolo asset statico su Workers (25 MiB) nelle build
  più complete; sproporzionato per scrivere un file. Scartata.
- *Export lato server (Edge Function)*: i dati passerebbero da un'altra parte e
  consumerebbero CPU limitata. Scartata.

## Conseguenze

- Nessun file di export è mai salvato lato server.
