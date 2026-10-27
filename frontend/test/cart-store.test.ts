import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from '../src/stores/cart-store';

const base = {
  productId: 1,
  slug: 'producto-1',
  name: 'Producto 1',
  price: '10.00',
  image: null,
  stock: 5,
};

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe('cart store', () => {
  it('agrega un producto y calcula total y count', () => {
    useCartStore.getState().addItem(base, 2);
    const state = useCartStore.getState();

    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
    expect(state.total()).toBe(20);
    expect(state.count()).toBe(2);
  });

  it('acumula cantidad sin superar el stock', () => {
    useCartStore.getState().addItem(base, 3);
    useCartStore.getState().addItem(base, 3);

    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('setQuantity respeta mínimo 1 y máximo stock', () => {
    useCartStore.getState().addItem(base, 1);

    useCartStore.getState().setQuantity(1, 99);
    expect(useCartStore.getState().items[0].quantity).toBe(5);

    useCartStore.getState().setQuantity(1, 0);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it('elimina un producto y vacía el carrito', () => {
    useCartStore.getState().addItem(base, 2);
    useCartStore.getState().removeItem(1);
    expect(useCartStore.getState().items).toHaveLength(0);

    useCartStore.getState().addItem(base, 1);
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('sincroniza precio y stock desde la validación', () => {
    useCartStore.getState().addItem(base, 2);
    useCartStore.getState().syncItems([
      { productId: 1, price: '12.50', stock: 3, name: 'Producto actualizado' },
    ]);

    const item = useCartStore.getState().items[0];
    expect(item.price).toBe('12.50');
    expect(item.stock).toBe(3);
    expect(item.name).toBe('Producto actualizado');
    expect(useCartStore.getState().total()).toBe(25);
  });
});
