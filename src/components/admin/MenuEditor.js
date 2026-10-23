'use client'

import { useEffect, useState } from 'react'
import { LuArrowDown, LuArrowUp, LuEye, LuEyeOff, LuPlus, LuTrash2 } from 'react-icons/lu'
import { refreshSiteData } from '@/hooks/useSiteData'
import { useAdmin } from './context'
import { Loading } from './ui'
import styles from './admin.module.css'

function move(list, i, dir) {
  const j = i + dir
  if (j < 0 || j >= list.length) return list
  const next = [...list]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

let uid = 0
const key = () => `k${++uid}`

export default function MenuEditor() {
  const { call, notify, settings } = useAdmin()
  const [menu, setMenu] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    call('menu')
      .then((d) => setMenu(d.menu.map((c) => ({ ...c, _k: key(), items: c.items.map((i) => ({ ...i, _k: key() })) }))))
      .catch((err) => notify(err.message, 'error'))
  }, [call, notify])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return
    const warn = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const change = (next) => {
    setMenu(next)
    setDirty(true)
  }
  const setCat = (ci, patch) => change(menu.map((c, i) => (i === ci ? { ...c, ...patch } : c)))
  const setItem = (ci, ii, patch) => setCat(ci, { items: menu[ci].items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) })

  async function save() {
    setSaving(true)
    try {
      const d = await call('menu_save', { body: { menu } })
      setMenu(d.menu.map((c) => ({ ...c, _k: key(), items: c.items.map((i) => ({ ...i, _k: key() })) })))
      setDirty(false)
      refreshSiteData()
      notify('Menu saved – the website shows the new menu now')
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!menu) return <Loading />

  return (
    <div className={styles.stack}>
      <p className={styles.muted}>
        Prices are in {settings.currency || 'LKR'} – type just the number (e.g. 2,650). Hidden sections and dishes stay saved but don’t show on the
        website.
      </p>

      {menu.map((c, ci) => (
        <section key={c._k} className={`${styles.card} ${c.visible ? '' : styles.hiddenCard}`}>
          <div className={styles.catHead}>
            <input
              className={`input ${styles.catName}`}
              value={c.name}
              placeholder="Section name"
              aria-label="Section name"
              onChange={(e) => setCat(ci, { name: e.target.value })}
            />
            <div className={styles.photoActions}>
              <button type="button" className={styles.iconBtn} onClick={() => setCat(ci, { visible: !c.visible })} aria-label={c.visible ? 'Hide section' : 'Show section'} title={c.visible ? 'Hide section' : 'Show section'}>
                {c.visible ? <LuEye /> : <LuEyeOff />}
              </button>
              <button type="button" className={styles.iconBtn} onClick={() => change(move(menu, ci, -1))} disabled={ci === 0} aria-label="Move section up">
                <LuArrowUp />
              </button>
              <button type="button" className={styles.iconBtn} onClick={() => change(move(menu, ci, 1))} disabled={ci === menu.length - 1} aria-label="Move section down">
                <LuArrowDown />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => window.confirm(`Delete the whole "${c.name}" section?`) && change(menu.filter((_, i) => i !== ci))}
                aria-label="Delete section"
              >
                <LuTrash2 />
              </button>
            </div>
          </div>
          <input
            className="input"
            value={c.note}
            placeholder="Note under the heading, e.g. “Served with chips or mash” (optional)"
            aria-label="Section note"
            onChange={(e) => setCat(ci, { note: e.target.value })}
          />

          <ul className={styles.items}>
            {c.items.map((it, ii) => (
              <li key={it._k} className={`${styles.itemRow} ${it.visible ? '' : styles.hiddenItem}`}>
                <input className="input" value={it.name} placeholder="Dish" aria-label="Dish name" onChange={(e) => setItem(ci, ii, { name: e.target.value })} />
                <input className="input" value={it.description} placeholder="Description (optional)" aria-label="Description" onChange={(e) => setItem(ci, ii, { description: e.target.value })} />
                <input className={`input ${styles.priceInput}`} value={it.price} placeholder="Price" aria-label="Price" onChange={(e) => setItem(ci, ii, { price: e.target.value })} />
                <div className={styles.photoActions}>
                  <button type="button" className={styles.iconBtn} onClick={() => setItem(ci, ii, { visible: !it.visible })} aria-label={it.visible ? 'Hide dish' : 'Show dish'} title={it.visible ? 'Hide dish' : 'Show dish'}>
                    {it.visible ? <LuEye /> : <LuEyeOff />}
                  </button>
                  <button type="button" className={styles.iconBtn} onClick={() => setCat(ci, { items: move(c.items, ii, -1) })} disabled={ii === 0} aria-label="Move up">
                    <LuArrowUp />
                  </button>
                  <button type="button" className={styles.iconBtn} onClick={() => setCat(ci, { items: move(c.items, ii, 1) })} disabled={ii === c.items.length - 1} aria-label="Move down">
                    <LuArrowDown />
                  </button>
                  <button type="button" className={styles.iconBtn} onClick={() => setCat(ci, { items: c.items.filter((_, j) => j !== ii) })} aria-label="Delete dish">
                    <LuTrash2 />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => setCat(ci, { items: [...c.items, { _k: key(), name: '', description: '', price: '', visible: true }] })}
          >
            <LuPlus aria-hidden="true" /> Add dish
          </button>
        </section>
      ))}

      <div className={`${styles.saveBar} ${styles.sticky}`}>
        <button
          type="button"
          className={`btn btn-outline ${styles.btnSm}`}
          onClick={() => change([...menu, { _k: key(), name: 'New section', note: '', visible: true, items: [] }])}
        >
          <LuPlus /> Add section
        </button>
        <span className={styles.spacer} />
        {dirty && <span className={styles.muted}>Unsaved changes</span>}
        <button type="button" className="btn btn-light" onClick={save} disabled={saving || !dirty}>
          {saving ? 'Saving…' : 'Save menu'}
        </button>
      </div>
    </div>
  )
}
