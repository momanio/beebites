import { useEffect, useState } from 'react'
import { ORDER_NOTE_MAX_LENGTH } from '../lib/cart'

const storageKey = 'beebites-order-note-v1'

function readOrderNote() {
  try {
    return localStorage.getItem(storageKey)?.slice(0, ORDER_NOTE_MAX_LENGTH) ?? ''
  } catch {
    return ''
  }
}

export function useOrderNote(count: number, ready: boolean) {
  const [orderNote, setOrderNote] = useState(readOrderNote)

  if (ready && count === 0 && orderNote) setOrderNote('')

  useEffect(() => {
    if (!ready) return
    try {
      if (count > 0 && orderNote.trim())
        localStorage.setItem(storageKey, orderNote)
      else
        localStorage.removeItem(storageKey)
    } catch {
      /* The note remains usable when storage is unavailable. */
    }
  }, [count, orderNote, ready])

  return { orderNote, setOrderNote }
}
