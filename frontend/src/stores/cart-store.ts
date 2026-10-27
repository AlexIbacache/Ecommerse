'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  price: string;
  image: string | null;
  stock: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  syncItems: (
    results: {
      productId: number;
      price?: string;
      stock?: number;
      name?: string;
    }[],
  ) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

function clampQuantity(quantity: number, stock: number): number {
  return Math.min(Math.max(quantity, 1), Math.max(stock, 1));
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (current) => current.productId === item.productId,
          );

          if (existing) {
            return {
              items: state.items.map((current) =>
                current.productId === item.productId
                  ? {
                      ...current,
                      quantity: clampQuantity(current.quantity + quantity, item.stock),
                    }
                  : current,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { ...item, quantity: clampQuantity(quantity, item.stock) },
            ],
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),

      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: clampQuantity(quantity, item.stock) }
              : item,
          ),
        })),

      syncItems: (results) =>
        set((state) => ({
          items: state.items.map((item) => {
            const result = results.find(
              (current) => current.productId === item.productId,
            );

            if (!result) {
              return item;
            }

            return {
              ...item,
              price: result.price ?? item.price,
              stock: result.stock ?? item.stock,
              name: result.name ?? item.name,
            };
          }),
        })),

      clear: () => set({ items: [] }),

      total: () =>
        get().items.reduce(
          (sum, item) => sum + Number(item.price) * item.quantity,
          0,
        ),

      count: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { name: 'terral-cart' },
  ),
);
