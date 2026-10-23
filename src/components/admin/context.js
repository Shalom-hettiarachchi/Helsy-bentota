'use client'

import { createContext, useContext } from 'react'

// Shared admin state: the signed-in admin, API caller, rooms, seasons,
// settings and the toast message.
export const AdminContext = createContext(null)

export function useAdmin() {
  return useContext(AdminContext)
}

export const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

export const MESSAGE_TYPES = {
  contact: 'Contact',
  care: 'Care enquiry',
  table: 'Table booking',
  order: "Pete's order",
}

// Fields the API expects when saving a booking
export function bookingPayload(b, changes = {}) {
  const keys = ['id', 'roomId', 'checkIn', 'checkOut', 'adults', 'children', 'extraBeds', 'name', 'email', 'phone',
    'country', 'arrivalTime', 'notes', 'adminNote', 'total', 'status']
  const out = {}
  for (const k of keys) out[k] = b[k]
  return { ...out, ...changes }
}
