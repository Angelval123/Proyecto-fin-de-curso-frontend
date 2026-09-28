const cartKey = 'estore-cart';
const shippingLimit = 500;
const standardShipping = 15;
const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
const formatPrice = (price) => `S/ ${price.toLocaleString('es-PE')}`;
const subtotal = cart.reduce((total, product) => total + product.price * product.quantity, 0);
const shipping = subtotal >= shippingLimit || subtotal === 0 ? 0 : standardShipping;

const total = subtotal + shipping;
document.querySelector('#delivery-subtotal').textContent = formatPrice(subtotal);
document.querySelector('#delivery-shipping').textContent = shipping === 0 ? 'Gratis' : formatPrice(shipping);
document.querySelector('#delivery-total').textContent = formatPrice(total);
document.querySelectorAll('.cart-button span').forEach((counter) => {
  counter.textContent = cart.reduce((count, product) => count + product.quantity, 0);
});
document.querySelector('#delivery-items').innerHTML = cart.length
  ? cart.map((product) => `<p class="delivery-item"><span>${product.name} × ${product.quantity}</span><strong>${formatPrice(product.price * product.quantity)}</strong></p>`).join('')
  : '<p class="empty-summary">No hay productos en el carrito.</p>';

const deliveryForm = document.querySelector('#delivery-form');
deliveryForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const successMessage = document.querySelector('#form-success');
  successMessage.textContent = 'Datos guardados. Tu pedido está listo para coordinar la entrega.';
  successMessage.classList.add('is-visible');
});
