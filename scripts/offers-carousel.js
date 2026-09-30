const offersTrack = document.querySelector('#offers-roulette-track');
const offersViewport = document.querySelector('.offers-roulette__viewport');
const offersToggle = document.querySelector('[data-offers-toggle]');

const discountedCategories = [
  { key: 'perifericos', label: 'Periféricos', discount: 10 },
  { key: 'procesadores', label: 'Procesadores', discount: 9 },
  { key: 'movilidad', label: 'Movilidad', discount: 8 },
  { key: 'computacion', label: 'Laptops', discount: 7 },
  { key: 'componentes', label: 'Componentes', discount: 6 },
  { key: 'monitores', label: 'Monitores', discount: 5 },
  { key: 'computadoras-escritorio', label: 'Computadoras de escritorio', discount: 4 },
  { key: 'placas-madre', label: 'Placas madre', discount: 3 },
  { key: 'tarjetas-video', label: 'Tarjetas de video', discount: 2 },
  { key: 'camaras', label: 'Cámaras web', discount: 1 }
];

const createOfferCard = (productCard, category) => {
  const { name, category: productCategory, price } = productCard.dataset;
  const image = window.getEStoreProductImage(productCategory, name);
  const description = productCard.querySelector('p')?.textContent.trim() || '';
  const detailParams = new URLSearchParams({
    name, category: productCategory, price, image: image.startsWith('data:') ? '' : image, description
  });
  const article = document.createElement('article');
  article.className = 'product-card offers-roulette__card';

  const badge = document.createElement('span');
  badge.className = 'badge badge-sale';
  badge.textContent = `${category.discount}% desde 21 unidades`;

  const productImage = document.createElement('img');
  productImage.src = image;
  productImage.alt = name;
  productImage.loading = 'lazy';

  const content = document.createElement('div');
  content.className = 'product-card__content';
  const categoryLabel = document.createElement('p');
  categoryLabel.className = 'offers-roulette__category';
  categoryLabel.textContent = category.label;
  const title = document.createElement('h3');
  title.textContent = name;
  const meta = document.createElement('div');
  meta.className = 'product-meta';
  const priceLabel = document.createElement('strong');
  priceLabel.textContent = `S/ ${Number(price).toLocaleString('es-PE')}`;
  const discountLabel = document.createElement('span');
  discountLabel.textContent = `-${category.discount}%`;
  meta.append(priceLabel, discountLabel);

  const detailLink = document.createElement('a');
  detailLink.className = 'btn btn-primary product-button';
  detailLink.href = `producto.html?${detailParams.toString()}`;
  detailLink.textContent = 'Ver producto';
  content.append(categoryLabel, title, meta, detailLink);
  article.append(badge, productImage, content);
  return article;
};

if (offersTrack && offersViewport && offersToggle) {
  fetch('productos.html')
    .then((response) => {
      if (!response.ok) throw new Error('No se pudo cargar el catálogo.');
      return response.text();
    })
    .then((html) => {
      const catalog = new DOMParser().parseFromString(html, 'text/html');
      window.EStoreCatalog?.apply(catalog);
      const catalogProducts = [...catalog.querySelectorAll('.product-card[data-category]')];
      const group = document.createElement('div');
      group.className = 'offers-roulette__group';
      group.setAttribute('role', 'list');

      discountedCategories.forEach((category) => {
        const product = catalogProducts.find((card) => card.dataset.category === category.key);
        if (!product) return;
        const offerCard = createOfferCard(product, category);
        offerCard.setAttribute('role', 'listitem');
        group.appendChild(offerCard);
      });

      if (!group.childElementCount) throw new Error('No hay productos para mostrar.');
      const repeatedGroup = group.cloneNode(true);
      repeatedGroup.setAttribute('aria-hidden', 'true');
      repeatedGroup.inert = true;
      offersTrack.replaceChildren(group, repeatedGroup);
    })
    .catch(() => {
      const message = document.createElement('p');
      message.className = 'catalog-status';
      message.textContent = 'No se pudieron cargar las ofertas.';
      offersTrack.replaceChildren(message);
    });

  offersToggle.addEventListener('click', () => {
    const isPaused = offersToggle.getAttribute('aria-pressed') !== 'true';
    offersToggle.setAttribute('aria-pressed', String(isPaused));
    offersToggle.setAttribute('aria-label', isPaused ? 'Reanudar ofertas' : 'Pausar ofertas');
    offersToggle.title = isPaused ? 'Reanudar movimiento' : 'Pausar movimiento';
    offersToggle.querySelector('[data-toggle-icon]').textContent = isPaused ? '▶' : 'Ⅱ';
    offersToggle.querySelector('[data-toggle-label]').textContent = isPaused ? 'Reanudar' : 'Pausar';
    offersViewport.classList.toggle('is-paused', isPaused);
  });
}