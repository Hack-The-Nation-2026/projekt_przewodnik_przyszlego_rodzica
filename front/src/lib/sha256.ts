/**
 * Odcisk pliku liczony w przeglądarce.
 *
 * Dzięki temu PDF z danymi o zdrowiu nie opuszcza urządzenia. Do backendu idzie
 * wyłącznie SHA-256, a ten nie pozwala odtworzyć treści dokumentu.
 */
export async function sha256Hex(file: File) {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      'Ta przeglądarka nie liczy odcisku pliku. Otwórz stronę przez HTTPS albo na localhost.',
    )
  }
  const buffer = await file.arrayBuffer()
  const digest = await globalThis.crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}