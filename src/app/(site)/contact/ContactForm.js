'use client'

import Notice from '@/components/Notice'
import useFormSubmit from '@/hooks/useFormSubmit'

// Used on the Contact page and (with type="care") on the Care page.
export default function ContactForm({ type = 'contact', defaultSubject = '', subjectOptions = null }) {
  const { sending, sent, error, handleSubmit, closeNotice, formProps, fieldError } = useFormSubmit(type)

  return (
    <>
      <form {...formProps} className="form-grid cols-2" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">
            Your Name <span className="req">*</span>
          </span>
          <input className="input" name="fname" type="text" placeholder="Your name" autoComplete="name" required maxLength={160} />
          {fieldError('fname')}
        </label>
        <label className="field">
          <span className="field-label">
            Email Address <span className="req">*</span>
          </span>
          <input className="input" name="email" type="email" placeholder="example@email.com" autoComplete="email" required maxLength={190} />
          {fieldError('email')}
        </label>
        <label className="field">
          <span className="field-label">Phone Number</span>
          <input className="input" name="phone" type="tel" inputMode="tel" placeholder="Optional" autoComplete="tel" maxLength={60} />
          {fieldError('phone')}
        </label>
        <label className="field">
          <span className="field-label">
            Subject <span className="req">*</span>
          </span>
          {subjectOptions ? (
            <select className="input" name="subject" defaultValue={subjectOptions[0]} required>
              {subjectOptions.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input className="input" name="subject" type="text" placeholder="What is it about?" defaultValue={defaultSubject} required maxLength={200} data-required="Please add a subject" />
          )}
          {fieldError('subject')}
        </label>
        <label className="field span-2">
          <span className="field-label">
            {type === 'care' ? 'Tell us a little about the care needed' : 'Comments / Questions'} <span className="req">*</span>
          </span>
          <textarea
            className="input"
            name="message"
            placeholder="Your message"
            required
            data-required={type === 'care' ? 'Please tell us a little about the care needed' : 'Please write your message'}
            maxLength={5000}
          />
          {fieldError('message')}
        </label>
        {/* Spam trap – hidden from people */}
        <label className="sr-only" aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <div className="span-2">
          <button className="btn btn-light btn-block" type="submit" disabled={sending}>
            {sending ? 'Sending…' : type === 'care' ? 'Send Enquiry' : 'Send Message'}
          </button>
        </div>
        {error && (
          <p className="form-error span-2" role="alert">
            {error}
          </p>
        )}
      </form>

      {sent && (
        <Notice
          title={type === 'care' ? 'Enquiry sent' : 'Message sent'}
          message="Thanks for getting in touch. We'll reply to your email soon."
          onClose={closeNotice}
        />
      )}
    </>
  )
}
