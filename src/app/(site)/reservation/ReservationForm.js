'use client'

import Notice from '@/components/Notice'
import useFormSubmit from '@/hooks/useFormSubmit'

const today = () => new Date().toISOString().slice(0, 10)

export default function ReservationForm() {
  const { sending, sent, error, handleSubmit, closeNotice } = useFormSubmit('reservation')

  return (
    <>
      <form className="form-grid cols-2" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">
            Your Name <span className="req">*</span>
          </span>
          <input className="input" name="name" type="text" placeholder="Name" autoComplete="name" required />
        </label>
        <label className="field">
          <span className="field-label">
            Phone Number <span className="req">*</span>
          </span>
          <input className="input" name="phone" type="tel" placeholder="Mobile" autoComplete="tel" inputMode="tel" required />
        </label>
        <label className="field">
          <span className="field-label">
            Email <span className="req">*</span>
          </span>
          <input className="input" name="email" type="email" placeholder="example@email.com" autoComplete="email" required />
        </label>
        <label className="field">
          <span className="field-label">
            No. of People <span className="req">*</span>
          </span>
          <input className="input" name="people" type="number" inputMode="numeric" placeholder="4" min="1" max="20" required />
        </label>
        <label className="field">
          <span className="field-label">
            Date <span className="req">*</span>
          </span>
          <input className="input" name="date" type="date" min={today()} required />
        </label>
        <label className="field">
          <span className="field-label">
            Time <span className="req">*</span>
          </span>
          <input className="input" name="time" type="time" min="08:00" max="21:00" required />
        </label>
        <div className="span-2">
          <button className="btn btn-light btn-block" type="submit" disabled={sending}>
            {sending ? 'Sending…' : 'Reserve A Table'}
          </button>
        </div>
        {error && <p className="form-error span-2">{error}</p>}
        <p className="form-note span-2">We’ll confirm your table by phone or email.</p>
      </form>

      {sent && (
        <Notice
          title="Request sent"
          message="Thank you! We'll confirm your table by email or phone shortly."
          onClose={closeNotice}
        />
      )}
    </>
  )
}
