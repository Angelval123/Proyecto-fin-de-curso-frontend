const params = new URLSearchParams(window.location.search);
const productName = params.get('name') || 'Producto';
const productCategory = params.get('category') || '';
const productPrice = Number(params.get('price') || 0);
const productImage = params.get('image') || 'assets/product-3.svg';
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
  detailImage.src = 'assets/product-3.svg';
}, { once: true });

document.querySelectorAll('.cart-button span').forEach((counter) => {
  const cart = JSON.parse(localStorage.getItem('estore-cart') || '[]');
  counter.textContent = cart.reduce((total, product) => total + product.quantity, 0);
});

const createRelatedCard = (card) => {
  const relatedName = card.dataset.name;
  const relatedParams = new URLSearchParams({
    name: relatedName,
    category: card.dataset.category,
    price: card.dataset.price,
    image: card.querySelector('img')?.getAttribute('src') || 'assets/product-3.svg',
    description: card.querySelector('p')?.textContent.trim() || ''
  });
  const article = document.createElement('article');
  article.className = 'product-card';
  article.innerHTML = `
    <img src="${card.querySelector('img')?.getAttribute('src') || 'assets/product-3.svg'}" alt="">
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
    relatedCards.forEach((card) => relatedGrid.appendChild(createRelatedCard(card)));
    if (!relatedCards.length) relatedGrid.innerHTML = '<p class="catalog-status">No hay productos relacionados disponibles.</p>';
  })
  .catch(() => {
    document.querySelector('#related-grid').innerHTML = '<p class="catalog-status">No se pudieron cargar los productos relacionados.</p>';
  });
