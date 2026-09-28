const params = new URLSearchParams(window.location.search);
const productName = params.get('name') || 'Producto';
const productCategory = params.get('category') || '';
const productPrice = Number(params.get('price') || 0);
const productImage = params.get('image') || window.getEStoreProductImage(productCategory, productName);
const productDescription = params.get('description') || 'Producto seleccionado de E-Store.';
const categoryLabels = {
  camaras: 'Cámaras web',
  computacion: 'Laptops',
  'computadoras-escritorio': 'Computadoras de escritorio',
  perifericos: 'Periféricos',
  componentes: 'Memorias RAM',
  'placas-madre': 'Placas madre',
  procesadores: 'Procesadores',
  monitores: 'Monitores',
  'tarjetas-video': 'Tarjetas de video',
  movilidad: 'Scooters'
};
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

const formatPrice = (price) => `S/ ${price.toLocaleString('es-PE')}`;
const brand = productName.split(' ')[0];
const model = productName.split(' ').slice(1).join(' ');
const detailImage = document.querySelector('#detail-image');

document.title = `${productName} | E-Store`;
document.querySelector('#detail-name').textContent = productName;
document.querySelector('#detail-brand').textContent = `Marca: ${brand} | Modelo: ${model || productName}`;
document.querySelector('#detail-category').textContent = categoryLabels[productCategory] || 'Producto tecnológico';
document.querySelector('#detail-description').textContent = productDescription;
document.querySelector('#detail-price').textContent = formatPrice(productPrice);
document.querySelector('#detail-discount').textContent = productCategory
  ? `${discountRates[productCategory] || 1}% de descuento desde 21 unidades en el carrito`
  : 'Descuento por volumen desde 21 unidades en el carrito';
detailImage.src = productImage;
detailImage.alt = productName;
detailImage.addEventListener('error', () => {
  detailImage.src = window.getEStoreProductImage(productCategory, productName);
}, { once: true });

const ratingStatus = document.querySelector('#rating-status');
let selectedRating = 0;

document.querySelectorAll('[data-rating]').forEach((button) => {
  button.addEventListener('click', () => {
    selectedRating = Number(button.dataset.rating);
    document.querySelectorAll('[data-rating]').forEach((star) => {
      const active = Number(star.dataset.rating) <= selectedRating;
      star.textContent = active ? '★' : '☆';
      star.setAttribute('aria-pressed', String(Number(star.dataset.rating) === selectedRating));
    });
    ratingStatus.textContent = `Tu calificación: ${selectedRating} de 5 estrellas.`;
  });
});

const detailBuyButton = document.querySelector('#detail-buy');
const detailCartKey = 'estore-cart';
const detailProductStock = 10;
const quantityModal = document.querySelector('#quantity-modal');
const quantityModalProduct = document.querySelector('#quantity-modal-product');
const quantityModalStock = document.querySelector('#quantity-modal-stock');
const quantityInput = document.querySelector('#quantity-input');
const confirmQuantity = document.querySelector('#confirm-quantity');

const updateDetailCartCount = () => {
  const cart = JSON.parse(localStorage.getItem(detailCartKey) || '[]');
  const count = cart.reduce((total, product) => total + product.quantity, 0);
  document.querySelectorAll('.cart-button span').forEach((counter) => {
    counter.textContent = count;
  });
};

const closeQuantityModal = () => {
  if (quantityModal) quantityModal.hidden = true;
};

const openQuantityModal = () => {
  quantityModalProduct.textContent = productName;
  quantityModalStock.textContent = `${detailProductStock} disponibles`;
  quantityInput.max = detailProductStock;
  quantityInput.value = 1;
  quantityModal.hidden = false;
  quantityInput.focus();
};

const addDetailProductToCart = (quantity) => {
  const cart = JSON.parse(localStorage.getItem(detailCartKey) || '[]');
  const product = cart.find((item) => item.name === productName);

  if (product) {
    product.quantity = Math.min(product.quantity + quantity, product.stock);
  } else {
    cart.push({
      name: productName,
      category: productCategory,
      price: productPrice,
      image: productImage,
      stock: detailProductStock,
      quantity
    });
  }

  localStorage.setItem(detailCartKey, JSON.stringify(cart));
  updateDetailCartCount();
  closeQuantityModal();
  detailBuyButton.textContent = 'Agregado al carrito';
  setTimeout(() => { detailBuyButton.textContent = 'Comprar este producto'; }, 1200);
};

detailBuyButton?.addEventListener('click', openQuantityModal);
document.querySelectorAll('[data-close-quantity-modal]').forEach((element) => {
  element.addEventListener('click', closeQuantityModal);
});
confirmQuantity?.addEventListener('click', () => {
  const quantity = Math.max(1, Math.min(Number(quantityInput.value) || 1, detailProductStock));
  addDetailProductToCart(quantity);
});
quantityInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') confirmQuantity.click();
  if (event.key === 'Escape') closeQuantityModal();
});
updateDetailCartCount();

const createRelatedCard = (card, imageIndex) => {
  const relatedName = card.dataset.name;
  const relatedImage = window.getEStoreProductImage(card.dataset.category, relatedName, imageIndex);
  const relatedParams = new URLSearchParams({
    name: relatedName,
    category: card.dataset.category,
    price: card.dataset.price,
    image: relatedImage,
    description: card.querySelector('p')?.textContent.trim() || ''
  });
  const article = document.createElement('article');
  article.className = 'product-card';
  article.innerHTML = `
    <img src="${relatedImage}" alt="${relatedName}">
    <div class="product-card__content">
      <h3></h3>
      <p></p>
      <div class="product-meta"><strong>${formatPrice(Number(card.dataset.price))}</strong><span>Ver ficha</span></div>
      <a class="btn btn-primary product-button" href="producto.html?${relatedParams.toString()}">Ver detalles</a>
    </div>
  `;
  article.querySelector('h3').textContent = relatedName;
  article.querySelector('p').textContent = card.querySelector('p')?.textContent.trim() || 'Producto relacionado.';
  return article;
};

fetch('productos.html')
  .then((response) => response.text())
  .then((html) => {
    const documentParser = new DOMParser().parseFromString(html, 'text/html');
    const relatedCards = [...documentParser.querySelectorAll('.product-card')]
      .filter((card) => card.dataset.category === productCategory && card.dataset.name !== productName)
      .slice(0, 4);
    const relatedGrid = document.querySelector('#related-grid');
    relatedCards.forEach((card, index) => relatedGrid.appendChild(createRelatedCard(card, index)));
    if (!relatedCards.length) relatedGrid.innerHTML = '<p class="catalog-status">No hay productos relacionados disponibles.</p>';
  })
  .catch(() => {
    document.querySelector('#related-grid').innerHTML = '<p class="catalog-status">No se pudieron cargar los productos relacionados.</p>';
  });
