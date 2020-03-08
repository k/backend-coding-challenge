import Exchange from '../lib';

test('Can an order book be persisted and synced', () => {
    const x = new Exchange();

    const b1 = x.buy(3, 3);
    const b2 = x.buy(4, 2);
    const b3 = x.buy(2, 2);
    const s1 = x.sell(1, 5)
    const s2 = x.sell(2, 4);

    x.persist('./data.json');

    const loaded = new Exchange();
    loaded.sync('./data.json');

    expect(x.getQuantityAtPrice(2)).toBe(loaded.getQuantityAtPrice(2));
    expect(x.getQuantityAtPrice(3)).toBe(loaded.getQuantityAtPrice(3));
    expect(x.getQuantityAtPrice(4)).toBe(loaded.getQuantityAtPrice(4));
    expect(x.getQuantityAtPrice(5)).toBe(loaded.getQuantityAtPrice(5));
});

test('Can fill buys with sell orders', () => {
    const x = new Exchange();

    const { id: b1 } = x.buy(4, 3);
    const { id: b2 } = x.buy(9, 3);
    expect(x.getQuantityAtPrice(3)).toBe(13);
    const { id: s1 } = x.sell(11, 3)
    expect(x.getOrder(b1).executedQuantity).toBe(4);
    expect(x.getOrder(b2).executedQuantity).toBe(7);
    const { id: s2 } = x.sell(2, 2)
    expect(x.getQuantityAtPrice(3)).toBe(0);
    expect(x.getOrder(b2).executedQuantity).toBe(9);
    expect(x.getOrder(s1).executedQuantity).toBe(11);
    expect(x.getOrder(s2).executedQuantity).toBe(2);
})

test('Can fill sells with buy orders', () => {
    const x = new Exchange();

    const { id: s1 } = x.sell(6, 9)
    const { id: s2 } = x.sell(3, 4)
    const { id: s3 } = x.sell(3, 9)
    expect(x.getQuantityAtPrice(9)).toBe(9);
    const { id: b1 } = x.buy(4, 3);
    expect(x.getOrder(b1).executedQuantity).toBe(0);
    const { id: b2 } = x.buy(10, 9);
    expect(x.getOrder(b2).executedQuantity).toBe(10);
    expect(x.getQuantityAtPrice(9)).toBe(3);
    expect(x.getOrder(s1).executedQuantity).toBe(6);
    expect(x.getOrder(s2).executedQuantity).toBe(3);
    expect(x.getOrder(s3).executedQuantity).toBe(1);
})