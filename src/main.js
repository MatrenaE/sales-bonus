/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  // purchase — это одна из записей в поле items из чека в data.purchase_records
  // _product — это продукт из коллекции data.products
  let { discount, sale_price, quantity } = purchase;
  discount = 1 - purchase.discount / 100;
  const seller_revenue = sale_price * quantity * discount;
  return seller_revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const { profit } = seller;
  if (index === 0) {
    return profit * (15 / 100);
  } else if (index === 1 || index === 2) {
    return profit * (10 / 100);
  } else if (index === total - 1) {
    return 0;
  } else {
    // Для всех остальных
    return profit * (5 / 100);
  }
  // После этого мы можем рассчитать бонус — это дополнительные деньги,
  // которые составляют определённый процент от прибыли. Для этого умножаем прибыль
  // на процент бонуса (например, если бонус 10%, то умножаем на 0,1
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */

function analyzeSalesData(data, options) {
  if (!data) {
    throw new Error("Data is undefined");
  }
  if (!Array.isArray(data.sellers) || data.sellers.length === 0) {
    throw new Error("data.sellers is empty or undefined");
  }
  if (!Array.isArray(data.products) || data.products.length === 0) {
    throw new Error("data.products is empty or undefined");
  }
  if (
    !Array.isArray(data.purchase_records) ||
    data.purchase_records.length === 0
  ) {
    throw new Error("data.purchase_records is empty or undefined");
  }

  const { calculateRevenue, calculateBonus } = options;
  if (!(typeof options === "object")) {
    throw new Error("Options is not object");
  }
  if (
    !(typeof calculateRevenue === "function") ||
    !(typeof calculateBonus === "function")
  ) {
    throw new Error("calculateRevenue or calculateBonus is not a function");
  }

  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  const sellerIndex = Object.fromEntries(
    sellerStats.map((seller) => [seller.id, seller])
  ); // Ключом будет id, значением — запись из sellerStats

  const productIndex = Object.fromEntries(
    data.products.map((product) => [product.sku, product])
  ); // Ключом будет sku, значением — запись из data.products

  data.purchase_records.forEach((record) => {
    // Чек
    const seller = sellerIndex[record.seller_id]; // Продавец
    seller.sales_count += 1; // Увеличить количество продаж
    seller.revenue += record.total_amount; // Увеличить общую сумму всех продаж

    // Расчёт прибыли для каждого товара
    record.items.forEach((item) => {
      const product = productIndex[item.sku]; // Товар
      // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
      const cost = product.purchase_price * item.quantity;
      // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
      const revenue = calculateRevenue(item, product);
      seller.profit += revenue - cost;

      // Посчитать прибыль: выручка минус себестоимость
      // Увеличить общую накопленную прибыль (profit) у продавца

      // Учёт количества проданных товаров
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += 1;
      // По артикулу товара увеличить его проданное количество у продавца
    });
  });

  // Сортируем продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit);

  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller);

    seller.top_products = Object.entries(seller.products_sold).map(
      (product, index) => {
        return { sku: product[0], quantity: product[1] };
      }
    );

    seller.top_products = seller.top_products.sort((a, b) => {
      const [keyA] = Object.keys(a);
      const [keyB] = Object.keys(b);
      return b[keyB] - a[keyA];
    });

    seller.top_products = seller.top_products.slice(0, 10);
  });

  return sellerStats.map((seller) => ({
    seller_id: seller.id, // Строка, идентификатор продавца
    name: seller.name, // Строка, имя продавца
    revenue: +seller.revenue.toFixed(2), // Число с двумя знаками после точки, выручка продавца
    profit: +seller.profit.toFixed(2), // Число с двумя знаками после точки, прибыль продавца
    sales_count: seller.sales_count, // Целое число, количество продаж продавца
    top_products: seller.top_products, // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
    bonus: +seller.bonus.toFixed(2), // Число с двумя знаками после точки, бонус продавца
  }));
}
