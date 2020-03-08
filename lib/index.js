import fs from 'fs';
import AVLTree from 'avl';
import { v4 as uuidv4 } from 'uuid';
import { insertInAVL, accumulateIds } from './helpers';

class Exchange {
  constructor() {
      this.bids = new AVLTree();
      this.asks = new AVLTree();
      this.orders = {};
  }

  // {
  //     id: "The order id",
  //     isBuyOrder: "Boolean whether its a buy order or not",
  //     quantity: "Number of scoops to buy",
  //     price: "The price for the bid or ask",
  //     executedQuantity: "Number that have been bought",
  //     next: "The next order in the linked list"
  // }
  _createOrder(quantity, price, isBuyOrder) {
      const order =  {
          id: uuidv4(),
          executedQuantity: 0,
          isBuyOrder,
          price,
          quantity,
      };
      this.orders[order.id] = order;
      return order;
  }

  buy(quantity, price) {
      const order = this._createOrder(quantity, price, true)
      if (!this.asks.isEmpty()) {
          let minPrice = this.asks.min();
          while (price >= minPrice && order.executedQuantity < order.quantity) {
              let data = this.asks.find(minPrice).data;
              while (data && order.executedQuantity < order.quantity) {
                  let buyToFill = order.quantity - order.executedQuantity;
                  let sellToFill = data.quantity - data.executedQuantity;
                  if (sellToFill <= buyToFill) {
                      data.executedQuantity = data.quantity;
                      order.executedQuantity += sellToFill;
                      this.asks.remove(minPrice);
                      if (data.next) {
                          this.asks.insert(minPrice, data.next)
                          data.next = undefined;
                      }
                  } else {
                      order.executedQuantity = order.quantity;
                      data.executedQuantity += buyToFill;
                  }
                  data = data.next;
              }
              minPrice = this.asks.min();
          }
      }
      if (order.executedQuantity < order.quantity) {
          insertInAVL(this.bids, order);
      }
      return order;
  }

  sell(quantity, price) {
      const order = this._createOrder(quantity, price, false)
      if (!this.bids.isEmpty()) {
          let maxPrice = this.bids.max();
          while (price <= maxPrice && order.executedQuantity < order.quantity) {
              let data = this.bids.find(maxPrice).data;
              while (data && order.executedQuantity < order.quantity) {
                  let sellToFill = order.quantity - order.executedQuantity;
                  let buyToFill = data.quantity - data.executedQuantity;
                  if (buyToFill <= sellToFill) {
                      data.executedQuantity = data.quantity;
                      order.executedQuantity += buyToFill;
                      this.bids.remove(maxPrice);
                      if (data.next) {
                          this.bids.insert(maxPrice, data.next)
                          data.next = undefined;
                      }
                  } else {
                      order.executedQuantity = order.quantity;
                      data.executedQuantity += sellToFill;
                  }
                  data = data.next
              }
              maxPrice = this.bids.max();
          }
      }
      if (order.executedQuantity < order.quantity) {
          insertInAVL(this.asks, order);
      }
      return order;
  }

  getQuantityAtPrice(price) {
      let count = 0;
      if (this.bids.contains(price)) {
          let data = this.bids.find(price).data;
          while (data) {
              count += data.quantity;
              data = data.next
          }
      }
      if (this.asks.contains(price)) {
          let data = this.asks.find(price).data;
          while (data) {
              count += data.quantity;
              data = data.next
          }
      }
      return count;
  }

  getOrder(id) {
      return this.orders[id];
  }

  /* Serialization format:
     {
         bids: keys,
         asks: keys,
         orders: JSON,
     }
  */
  _serialize() {
      const obj =  {
          bids: this.bids.values().reduce(accumulateIds, []),
          asks: this.asks.values().reduce(accumulateIds, []),
          orders: this.orders,
      };
      return JSON.stringify(obj);
  }

  persist(filename) {
    fs.writeFileSync(filename, this._serialize());
  }

  _deserialize(jsonString) {
      const { bids, asks, orders } = JSON.parse(jsonString);
      this.orders = orders;
      bids.forEach(bid => {
          let order = orders[bid];
          order.next = undefined
          insertInAVL(this.bids, order);
      });
      asks.forEach(ask => {
          let order = orders[ask];
          order.next = undefined
          insertInAVL(this.asks, order);
      });
  }

  sync(filename) {
    const buff = fs.readFileSync(filename);
    this._deserialize(buff);
  }
}

export default Exchange;
