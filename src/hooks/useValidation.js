'use client'

import { useId, useState } from 'react'
import { FiAlertCircle } from 'react-icons/fi'

// Friendly form checks in place of the browser's "Please fill out this field"
// pop-ups. Fields keep their normal attributes (required, type="email", min,
// max…); this reads them and shows our own message under the field.
// A field can set its own wording with data-required="…".
//
//   const v = useValidation()
//   <form {...v.formProps} onSubmit={(e) => { e.preventDefault(); if (!v.validate(e.currentTarget)) return; … }}>
//     <input name="email" type="email" required />
//     {v.error('email')}
export default function useValidation() {
  const uid = useId()
  const [errors, setErrors] = useState({})
  const errorId = (name) => `${uid}-${name}-error`

  function setError(el, message) {
    if (message) {
      el.setAttribute('aria-invalid', 'true')
      el.setAttribute('aria-describedby', errorId(el.name))
    } else {
      el.removeAttribute('aria-invalid')
      el.removeAttribute('aria-describedby')
    }
    setErrors((prev) => (prev[el.name] === message ? prev : { ...prev, [el.name]: message }))
  }

  // Checks every field; shows all problems and moves to the first one.
  function validate(form) {
    let first = null
    for (const el of fields(form)) {
      const message = messageFor(el)
      setError(el, message)
      if (message && !first) first = el
    }
    if (first) {
      first.focus({ preventScroll: true })
      first.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return !first
  }

  // An error the server sent back for one field (e.g. "That email address doesn't look right")
  function showError(form, name, message) {
    const el = form?.elements.namedItem(name)
    if (!(el instanceof Element)) return false
    setError(el, message)
    el.focus()
    return true
  }

  function check(e, onlyIfFilled) {
    const el = e.target
    if (!el.name || !el.willValidate) return
    // Don't nag while someone is just tabbing past an empty field
    if (onlyIfFilled && !errors[el.name] && !el.value) return
    if (!onlyIfFilled && !errors[el.name]) return
    setError(el, messageFor(el))
  }

  function clear() {
    setErrors({})
  }

  function error(name) {
    const message = errors[name]
    if (!message) return null
    return (
      <span className="field-error" id={errorId(name)} aria-hidden="true">
        <FiAlertCircle />
        {message}
      </span>
    )
  }

  return {
    errors,
    validate,
    showError,
    clear,
    error,
    formProps: {
      noValidate: true,
      onBlur: (e) => check(e, true),
      onChange: (e) => check(e, false),
    },
  }
}

function fields(form) {
  return [...form.elements].filter((el) => el.name && el.willValidate && el.type !== 'hidden')
}

function labelFor(el) {
  const text = el.closest('.field')?.querySelector('.field-label')?.textContent || ''
  return text.replace(/\*/g, '').replace(/^your\s+/i, '').trim()
}

function formatTime(t) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}

export function messageFor(el) {
  const v = el.validity
  const value = (el.value || '').trim()

  if (v.valueMissing || (el.required && !value)) {
    if (el.dataset.required) return el.dataset.required
    if (el.type === 'email') return 'Please enter your email address'
    if (el.type === 'tel') return 'Please enter your phone number'
    if (el.type === 'date') return 'Please choose a date'
    if (el.type === 'time') return 'Please choose a time'
    if (el.tagName === 'SELECT') return 'Please choose an option'
    const label = labelFor(el)
    return label ? `Please enter your ${label.toLowerCase()}` : 'Please fill in this field'
  }
  if (!value) return ''

  if (el.type === 'email' && (v.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value))) {
    return 'Please check your email, e.g. name@example.com'
  }
  if (el.type === 'tel') {
    const digits = value.replace(/\D/g, '').length
    if (digits < 7 || digits > 15 || /[^\d\s()+\-.]/.test(value)) {
      return 'Please enter a full phone number, e.g. +94 77 123 4567'
    }
  }
  if (v.badInput) {
    if (el.type === 'number') return 'Please enter a number'
    return 'Please enter a valid value'
  }
  if (v.rangeUnderflow || v.rangeOverflow) {
    if (el.type === 'number') return `Please enter a number from ${el.min} to ${el.max}`
    if (el.type === 'date') return v.rangeUnderflow ? 'Please choose today or a later date' : 'Please choose an earlier date'
    if (el.type === 'time') return `Please choose a time between ${formatTime(el.min)} and ${formatTime(el.max)}`
  }
  if (v.stepMismatch && el.type === 'number') return 'Please enter a whole number'
  if (v.tooLong) return `Please keep this under ${el.maxLength} characters`
  if (!v.valid) return el.validationMessage
  return ''
}
