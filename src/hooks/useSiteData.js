'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { defaultSiteData } from '@/data/defaults'

// Live rooms, rates, menu and contact details from the admin panel. Pages
// render the built-in defaults first (so the HTML is complete for Google),
// then swap in the live data once it has loaded. Fetched once per visit.
let cache = null
let pending = null

export function loadSiteData() {
  if (cache) return Promise.resolve(cache)
  pending ??= api('site.php')
    .then((d) => (cache = { settings: d.settings, rooms: d.rooms, seasons: d.seasons, menu: d.menu }))
    .catch(() => {
      pending = null
      return null
    })
  return pending
}

export function refreshSiteData() {
  cache = null
  pending = null
}

export default function useSiteData() {
  const [state, setState] = useState({ data: defaultSiteData, live: false })

  useEffect(() => {
    let alive = true
    loadSiteData().then((d) => {
      if (alive && d) setState({ data: d, live: true })
    })
    return () => {
      alive = false
    }
  }, [])

  return { ...state.data, live: state.live }
}
