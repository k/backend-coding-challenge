
export const accumulateIds = (acc, val) => {
    let value = val
    while (value) {
        acc.push(value.id);
        value = value.next;
    }
    return acc;
};

export const insertInAVL = (avl, order) => {
    const price = order.price;
    if (avl.contains(price)) {
        let data = avl.find(price).data;
        while (data.next) {
            data = data.next
        }
        data.next = order;
    } else {
        avl.insert(price, order);
    }
}