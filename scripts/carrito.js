const cartKey = 'estore-cart';
const shippingLimit = 500;
const standardShipping = 15;

const getCart = () => JSON.parse(localStorage.getItem(cartKey) || '[]');
const formatPrice = (price) => `S/ ${price.toLocaleString('es-PE')}`;
const discountRates = {
  perifericos: 10,
  procesadores: 9,
  movilidad: 8,
  computacion: 7,
  componentes: 6,
  monitores: 5,
  'computadoras-escritorio': 4,
  'placas-madre': 3,
  'tarjetas-video': 2,
  camaras: 1
};

const getDiscounts = (cart) => {
  let totalDiscount = 0;
  const productDiscounts = new Map();

  cart.forEach((product) => {
    if (product.quantity <= 20) return;

    const percentage = discountRates[product.category] || 1;

    const discount = product.price * product.quantity * percentage / 100;
    totalDiscount += discount;
    productDiscounts.set(product.name, { percentage, discount });
  });

  return { totalDiscount, productDiscounts };
};

const renderCart = () => {
  const cartItems = document.querySelector('#cart-items');
  const cart = getCart();
  const subtotal = cart.reduce((total, product) => total + product.price * product.quantity, 0);
  const { totalDiscount, productDiscounts } = getDiscounts(cart);
  const shipping = subtotal >= shippingLimit || subtotal === 0 ? 0 : standardShipping;
  const total = subtotal - totalDiscount + shipping;

  document.querySelectorAll('.cart-button span').forEach((counter) => {
    counter.textContent = cart.reduce((count, product) => count + product.quantity, 0);
  });
  document.querySelector('#cart-subtotal').textContent = formatPrice(subtotal);
  document.querySelector('#cart-discount').textContent = totalDiscount > 0 ? `- ${formatPrice(totalDiscount)}` : formatPrice(0);
  document.querySelector('#cart-shipping').textContent = shipping === 0 ? 'Gratis' : formatPrice(shipping);
  document.querySelector('#cart-total').textContent = formatPrice(total);
  document.querySelector('#checkout-link').classList.toggle('is-disabled', cart.length === 0);

  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="empty-cart"><strong>Tu carrito está vacío</strong><p>Agrega productos desde el catálogo para continuar.</p><a class="btn btn-primary" href="productos.html">Ver productos</a></div>';
    return;
  }

  cartItems.innerHTML = cart.map((product) => `
    <article class="cart-item">
      <img src="${product.image}" alt="${product.name}">
      <div class="cart-item__info">
        <h2>${product.name}</h2>
        <p>${formatPrice(product.price)} por unidad${productDiscounts.has(product.name) ? ` · ${productDiscounts.get(product.name).percentage}% de descuento` : ''}</p>
        <span class="stock stock-good">${product.stock} disponibles</span>
      </div>
      <div class="quantity-control" aria-label="Cantidad de ${product.name}">
        <button data-action="decrease" data-name="${product.name}" aria-label="Disminuir cantidad">−</button>
        <strong>${product.quantity}</strong>
        <button data-action="increase" data-name="${product.name}" aria-label="Aumentar cantidad">+</button>
      </div>
      <strong class="cart-item__total">${formatPrice(product.price * product.quantity)}</strong>
      <button class="remove-button" data-action="remove" data-name="${product.name}" aria-label="Eliminar ${product.name}">Eliminar producto</button>
    </article>
  `).join('');
};

document.querySelector('#cart-items').addEventListener('click', (event) => {
  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;

  const cart = getCart();
  const product = cart.find((item) => item.name === actionButton.dataset.name);
  const action = actionButton.dataset.action;

  if (!product) {
    renderCart();
    return;
  }

  if (action === 'increase' && product.quantity < product.stock) product.quantity += 1;
  if (action === 'decrease' && product.quantity > 1) product.quantity -= 1;
  if (action === 'remove') cart.splice(cart.indexOf(product), 1);

  localStorage.setItem(cartKey, JSON.stringify(cart));
  renderCart();
});

renderCart();
