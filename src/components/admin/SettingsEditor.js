'use client'

import { useState } from 'react'
import { useAdmin } from './context'
import styles from './admin.module.css'

const lines = (list) => (Array.isArray(list) ? list.join('\n') : '')
const toList = (text) => text.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)

export default function SettingsEditor() {
  return (
    <div className={styles.stack}>
      <GeneralSettings />
    </div>
  )
}

function GeneralSettings() {
  const { settings, call, notify, reloadRefs } = useAdmin()
  const [f, setF] = useState(() => ({
    ...settings,
    publicEmailsText: lines(settings.publicEmails),
    notifyEmailsText: lines(settings.notifyEmails),
  }))
  const [saving, setSaving] = useState(false)
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value })

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { publicEmailsText, notifyEmailsText, ...rest } = f
      await call('settings_save', {
        body: {
          settings: {
            ...rest,
            publicEmails: toList(publicEmailsText),
            notifyEmails: toList(notifyEmailsText),
            minNights: Number(f.minNights),
            paymentDueDays: Number(f.paymentDueDays),
          },
        },
      })
      await reloadRefs()
      notify('Settings saved')
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className={styles.card} onSubmit={save}>
      <h2 className={styles.cardTitle}>Contact & booking</h2>

      <fieldset className={styles.fieldset}>
        <legend>Booking contact</legend>
        <div className={styles.grid2}>
          <label className="field">
            <span className="field-label">Contact person (shown next to the phone number)</span>
            <input className="input" value={f.bookingContactName || ''} maxLength={120} placeholder="e.g. Helsy" onChange={set('bookingContactName')} />
          </label>
          <label className="field">
            <span className="field-label">Booking phone number</span>
            <input className="input" required value={f.bookingPhone || ''} maxLength={60} placeholder="+94 77 220 7705" onChange={set('bookingPhone')} />
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Email addresses (one per line)</legend>
        <div className={styles.grid2}>
          <label className="field">
            <span className="field-label">Shown on the website</span>
            <textarea className="input" rows={3} value={f.publicEmailsText} onChange={set('publicEmailsText')} />
          </label>
          <label className="field">
            <span className="field-label">Receive booking requests and messages</span>
            <textarea className="input" rows={3} required value={f.notifyEmailsText} onChange={set('notifyEmailsText')} />
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Stay details</legend>
        <label className="field">
          <span className="field-label">Breakfast notice (shown with every price)</span>
          <input className="input" value={f.breakfastNotice || ''} maxLength={200} onChange={set('breakfastNotice')} />
        </label>
        <div className={styles.grid3}>
          <label className="field">
            <span className="field-label">Check-in time</span>
            <input className="input" required value={f.checkIn || ''} maxLength={40} onChange={set('checkIn')} />
          </label>
          <label className="field">
            <span className="field-label">Check-out time</span>
            <input className="input" required value={f.checkOut || ''} maxLength={40} onChange={set('checkOut')} />
          </label>
          <label className="field">
            <span className="field-label">Minimum nights</span>
            <input className="input" type="number" min="1" max="60" required value={f.minNights ?? 1} onChange={set('minNights')} />
          </label>
        </div>
        <label className="field">
          <span className="field-label">Note shown before a guest sends a booking request</span>
          <textarea className="input" rows={2} maxLength={600} value={f.bookingNote || ''} onChange={set('bookingNote')} />
        </label>
        <label className="field">
          <span className="field-label">Currency</span>
          <input className={`input ${styles.selectSm}`} required value={f.currency || 'LKR'} maxLength={5} onChange={set('currency')} />
        </label>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Payments</legend>
        {settings.cardPayments === 'off' ? (
          <p className={styles.muted}>Card payments (PayHere): Off – add the PayHere keys to helsy-config.php to make them available.</p>
        ) : (
          <label className="checkbox">
            <input type="checkbox" checked={!!f.offerCardPayments} onChange={(e) => setF({ ...f, offerCardPayments: e.target.checked })} />
            Offer “Pay by card” (PayHere{settings.cardPayments === 'sandbox' ? ' – sandbox test mode, no real money' : ''})
          </label>
        )}
        <p className={styles.muted}>
          Bank transfer details are sent only to guests with a confirmed booking. Leave the account number empty to hide bank transfer.
        </p>
        <div className={styles.grid2}>
          <label className="field">
            <span className="field-label">Account name</span>
            <input className="input" value={f.bankAccountName || ''} maxLength={120} placeholder="e.g. The Helsy Bentota" onChange={set('bankAccountName')} />
          </label>
          <label className="field">
            <span className="field-label">Account number</span>
            <input className="input" value={f.bankAccountNumber || ''} maxLength={60} inputMode="numeric" onChange={set('bankAccountNumber')} />
          </label>
          <label className="field">
            <span className="field-label">Bank</span>
            <input className="input" value={f.bankName || ''} maxLength={120} placeholder="e.g. Bank of Ceylon" onChange={set('bankName')} />
          </label>
          <label className="field">
            <span className="field-label">Branch</span>
            <input className="input" value={f.bankBranch || ''} maxLength={120} placeholder="e.g. Bentota" onChange={set('bankBranch')} />
          </label>
          <label className="field">
            <span className="field-label">SWIFT code (for payments from abroad)</span>
            <input className="input" value={f.bankSwift || ''} maxLength={11} placeholder="e.g. BCEYLKLX" onChange={set('bankSwift')} />
          </label>
          <label className="field">
            <span className="field-label">Payment due (days before arrival)</span>
            <input className={`input ${styles.selectSm}`} type="number" min="0" max="90" value={f.paymentDueDays ?? 14} onChange={set('paymentDueDays')} />
            <span className={styles.muted}>Bookings made at shorter notice get 2 days to pay.</span>
          </label>
        </div>
        <label className="field">
          <span className="field-label">Note for guests (optional, shown under the bank details)</span>
          <textarea
            className="input"
            rows={2}
            maxLength={600}
            value={f.bankNote || ''}
            placeholder={'e.g. Paying from abroad? Send the exact LKR amount and choose "OUR" charges, or use Wise.'}
            onChange={set('bankNote')}
          />
        </label>
      </fieldset>

      <div className={styles.saveBar}>
        <button type="submit" className="btn btn-light" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  )
}
