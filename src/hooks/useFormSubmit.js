'use client'

import { useCallback, useState } from 'react'
import { submitForm } from '@/lib/forms'

// Shared state for the site's forms: sending flag, success notice, errors.
export default function useFormSubmit(type) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event, onSuccess) {
    event.preventDefault()
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())
    setSending(true)
    setError('')
    try {
      const res = await submitForm(type, data)
      if (!res.ok) throw new Error('Something went wrong. Please try again or call us.')
      form.reset()
      onSuccess?.()
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const closeNotice = useCallback(() => setSent(false), [])

  return { sending, sent, error, handleSubmit, closeNotice }
}
