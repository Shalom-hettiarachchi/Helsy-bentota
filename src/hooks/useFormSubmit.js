'use client'

import { useCallback, useState } from 'react'
import { submitForm } from '@/lib/forms'
import useValidation from './useValidation'

// Shared state for the site's forms: field checks, sending flag, success notice, errors.
export default function useFormSubmit(type) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const validation = useValidation()

  async function handleSubmit(event, onSuccess) {
    event.preventDefault()
    const form = event.currentTarget
    setError('')
    if (!validation.validate(form)) return
    const data = Object.fromEntries(new FormData(form).entries())
    setSending(true)
    try {
      const res = await submitForm(type, data)
      if (!res.ok) throw new Error('Something went wrong. Please try again or call us.')
      form.reset()
      validation.clear()
      onSuccess?.()
      setSent(true)
    } catch (err) {
      if (!(err.data?.field && validation.showError(form, err.data.field, err.message))) setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const closeNotice = useCallback(() => setSent(false), [])

  return {
    sending,
    sent,
    error,
    handleSubmit,
    closeNotice,
    formProps: validation.formProps,
    fieldError: validation.error,
  }
}
