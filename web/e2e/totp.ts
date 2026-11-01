import { createHmac } from 'node:crypto'

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, '').replace(/\s/g, '').toUpperCase()
  let bits = ''
  for (const char of clean) {
    const value = BASE32.indexOf(char)
    if (value < 0) throw new Error(`Carattere base32 non valido: ${char}`)
    bits += value.toString(2).padStart(5, '0')
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(bytes)
}

/** Codice TOTP (RFC 6238, SHA-1, 30 s, 6 cifre) per i test e2e. */
export function totp(secret: string, timeMs = Date.now()): string {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(timeMs / 1000 / 30)))
  const hmac = createHmac('sha1', base32Decode(secret)).update(counter).digest()
  const offset = (hmac[hmac.length - 1] ?? 0) & 0x0f
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff
  return (binary % 1_000_000).toString().padStart(6, '0')
}

/** Attende un codice diverso da quello già usato (i codici non sono riutilizzabili). */
export async function freshTotp(secret: string, used: string): Promise<string> {
  for (;;) {
    const code = totp(secret)
    if (code !== used) return code
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}
