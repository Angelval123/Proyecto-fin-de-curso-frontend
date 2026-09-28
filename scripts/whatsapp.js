const WHATSAPP_NUMBER = '51970878849';
const WHATSAPP_MESSAGE = 'Hola, necesito asesoría para elegir un producto.';

const whatsappLink = document.createElement('a');
const encodedMessage = encodeURIComponent(WHATSAPP_MESSAGE);

whatsappLink.className = 'whatsapp-advisor';
whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
whatsappLink.target = '_blank';
whatsappLink.rel = 'noopener noreferrer';
whatsappLink.setAttribute('aria-label', 'Hablar con un asesor por WhatsApp');
whatsappLink.innerHTML = `
  <span class="whatsapp-advisor__label">¿Necesitas ayuda?</span>
  <span class="whatsapp-advisor__icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" role="img">
      <path d="M20.5 3.5A11.8 11.8 0 0 0 12.08 0C5.55 0 .24 5.3.24 11.83c0 2.08.54 4.1 1.58 5.88L.14 24l6.43-1.64a11.8 11.8 0 0 0 5.51 1.37h.01c6.53 0 11.84-5.31 11.84-11.84 0-3.16-1.23-6.13-3.43-8.39Zm-8.42 18.2h-.01a9.82 9.82 0 0 1-5.01-1.37l-.36-.21-3.82.98 1.02-3.72-.23-.38a9.83 9.83 0 1 1 8.41 4.7Zm5.39-7.37c-.3-.15-1.77-.87-2.05-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.28-.47-2.44-1.5-.9-.8-1.51-1.78-1.69-2.08-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.63.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.56-.34Z"/>
    </svg>
  </span>
`;

document.body.appendChild(whatsappLink);

const savedCart = JSON.parse(localStorage.getItem('estore-cart') || '[]');
const cartCount = savedCart.reduce((total, product) => total + product.quantity, 0);
document.querySelectorAll('.cart-button span').forEach((counter) => {
  counter.textContent = cartCount;
});
