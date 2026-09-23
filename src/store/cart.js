import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCart = create(
  persist(
    (set) => ({
      items: [], // { id, name, price, quantity }
      add: (product) =>
        set((s) => {
          const found = s.items.find((i) => i.id === product.id)
          if (found) {
            return { items: s.items.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)) }
          }
          return { items: [...s.items, { id: product.id, name: product.name, price: product.price, quantity: 1 }] }
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'campusconnect-cart' }
  )
)
