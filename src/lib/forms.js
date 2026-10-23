// Form submission: contact, care enquiries, table reservations and orders go
// to /api/message.php, which saves them to the admin inbox and emails them.
import { api } from './api'

export async function submitForm(type, data) {
  await api('message.php', { method: 'POST', body: { type, ...data } })
  return { ok: true }
}
