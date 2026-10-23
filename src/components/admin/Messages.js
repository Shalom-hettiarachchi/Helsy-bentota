'use client'

import { useCallback, useEffect, useState } from 'react'
import { LuArchive, LuInbox, LuMail, LuPhone, LuTrash2 } from 'react-icons/lu'
import { MESSAGE_TYPES, useAdmin } from './context'
import { Empty, Loading } from './ui'
import styles from './admin.module.css'

const TYPES = [['', 'All'], ...Object.entries(MESSAGE_TYPES)]

export default function Messages() {
  const { call, notify } = useAdmin()
  const [type, setType] = useState('')
  const [box, setBox] = useState('inbox')
  const [list, setList] = useState(null)
  const [open, setOpen] = useState(null)

  const load = useCallback(() => {
    setList(null)
    call('messages', { query: `type=${type}&status=${box}` })
      .then((d) => setList(d.messages))
      .catch((err) => {
        notify(err.message, 'error')
        setList([])
      })
  }, [call, notify, type, box])

  useEffect(load, [load])

  async function setStatus(m, status) {
    try {
      await call('message_update', { body: { id: m.id, status } })
      setList((l) => (box === 'inbox' && status === 'archived' ? l.filter((x) => x.id !== m.id) : l.map((x) => (x.id === m.id ? { ...x, status } : x))))
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  async function remove(m) {
    if (!window.confirm('Delete this message permanently?')) return
    try {
      await call('message_delete', { body: { id: m.id } })
      setList((l) => l.filter((x) => x.id !== m.id))
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  function toggle(m) {
    setOpen(open === m.id ? null : m.id)
    if (m.status === 'new') setStatus(m, 'read')
  }

  return (
    <div className={styles.stack}>
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist">
          {TYPES.map(([id, label]) => (
            <button key={id || 'all'} type="button" role="tab" aria-selected={type === id} className={type === id ? styles.tabActive : ''} onClick={() => setType(id)}>
              {label}
            </button>
          ))}
        </div>
        <div className={styles.tabs} role="tablist">
          <button type="button" role="tab" aria-selected={box === 'inbox'} className={box === 'inbox' ? styles.tabActive : ''} onClick={() => setBox('inbox')}>
            <LuInbox aria-hidden="true" /> Inbox
          </button>
          <button type="button" role="tab" aria-selected={box === 'archived'} className={box === 'archived' ? styles.tabActive : ''} onClick={() => setBox('archived')}>
            <LuArchive aria-hidden="true" /> Archived
          </button>
        </div>
      </div>

      {!list ? (
        <Loading />
      ) : list.length === 0 ? (
        <Empty>No messages here.</Empty>
      ) : (
        <ul className={styles.messages}>
          {list.map((m) => (
            <li key={m.id} className={`${styles.message} ${m.status === 'new' ? styles.unread : ''}`}>
              <button type="button" className={styles.messageHead} onClick={() => toggle(m)} aria-expanded={open === m.id}>
                <span className={styles.typeTag}>{MESSAGE_TYPES[m.type] || m.type}</span>
                <strong>{m.name}</strong>
                <span className={styles.messageSubject}>{m.subject}</span>
                <span className={styles.muted}>{m.createdAt.slice(0, 16)}</span>
              </button>
              {open === m.id && (
                <div className={styles.messageBody}>
                  <dl className={styles.details}>
                    {Object.entries(m.data).map(([k, v]) =>
                      v ? (
                        <div key={k}>
                          <dt>{k}</dt>
                          <dd>{v}</dd>
                        </div>
                      ) : null,
                    )}
                  </dl>
                  <div className={styles.inline}>
                    {m.email && (
                      <a className={`btn btn-light ${styles.btnSm}`} href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.subject)}`}>
                        <LuMail /> Reply
                      </a>
                    )}
                    {m.phone && (
                      <a className={`btn btn-outline ${styles.btnSm}`} href={`tel:${m.phone.replace(/[^\d+]/g, '')}`}>
                        <LuPhone /> Call
                      </a>
                    )}
                    <span className={styles.spacer} />
                    {m.status !== 'archived' ? (
                      <button type="button" className={styles.linkBtn} onClick={() => setStatus(m, 'archived')}>
                        <LuArchive aria-hidden="true" /> Archive
                      </button>
                    ) : (
                      <button type="button" className={styles.linkBtn} onClick={() => setStatus(m, 'read')}>
                        <LuInbox aria-hidden="true" /> Move to inbox
                      </button>
                    )}
                    <button type="button" className={styles.iconBtn} onClick={() => remove(m)} aria-label="Delete message">
                      <LuTrash2 />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
