// Cambios del catálogo hechos desde el panel de trabajador (admin.html).
// productos.html sigue siendo el catálogo base; aquí se guardan solo las diferencias:
// productos editados, productos nuevos y productos eliminados.
(() => {
  const storageKey = 'estore-catalog-changes';

  const categoryLabels = {
    camaras: 'Cámaras',
    computacion: 'Computación',
    'computadoras-escritorio': 'Computadoras de escritorio',
    perifericos: 'Periféricos',
    componentes: 'Componentes',
    'placas-madre': 'Placas madre',
    procesadores: 'Procesadores',
    monitores: 'Monitores',
    'tarjetas-video': 'Tarjetas de video',
    movilidad: 'Movilidad'
  };

  const emptyChanges = () => ({ edited: {}, added: [], removed: [] });

  const readChanges = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!saved) return emptyChanges();
      return {
        edited: saved.edited || {},
        added: Array.isArray(saved.added) ? saved.added : [],
        removed: Array.isArray(saved.removed) ? saved.removed : []
      };
    } catch {
      return emptyChanges();
    }
  };

  let cachedImages = null;

  const saveChanges = (changes) => {
    localStorage.setItem(storageKey, JSON.stringify(changes));
    cachedImages = null;
  };

  const defaultStock = (category, price) => {
    if (['movilidad', 'procesadores'].includes(category)) return 50;
    if (price <= 250) return 300;
    if (price <= 700) return 150;
    if (price <= 1500) return 100;
    if (price <= 3000) return 60;
    if (price <= 5000) return 40;
    return 30;
  };

  const formatPrice = (price) => `S/ ${Number(price).toLocaleString('es-PE', {
    minimumFractionDigits: Number(price) % 1 ? 2 : 0,
    maximumFractionDigits: 2
  })}`;

  const fillCard = (card, product) => {
    card.dataset.name = product.name;
    card.dataset.category = product.category;
    card.dataset.price = String(product.price);
    card.dataset.adminStock = String(product.stock);
    const image = card.querySelector('img');
    if (image) image.alt = product.name;
    const title = card.querySelector('h3');
    if (title) title.textContent = product.name;
    const description = card.querySelector('.product-card__content p');
    if (description) description.textContent = product.description;
    const price = card.querySelector('.product-meta strong');
    if (price) price.textContent = formatPrice(product.price);
  };

  const createCard = (product, ownerDocument) => {
    const card = ownerDocument.createElement('article');
    card.className = 'product-card';
    card.dataset.id = product.id;
    card.innerHTML = `
      <img src="assets/principal.jpg" alt="">
      <div class="product-card__content">
        <h3></h3>
        <p></p>
        <div class="product-meta">
          <strong></strong>
          <span class="stock stock-medium"></span>
        </div>
        <button class="btn btn-primary product-button">Comprar</button>
      </div>
    `;
    fillCard(card, product);
    return card;
  };

  // Aplica los cambios guardados sobre las tarjetas de productos.html.
  // Sirve tanto para la página real como para un documento obtenido con fetch + DOMParser.
  const apply = (root = document) => {
    const grid = root.querySelector('#catalog-grid');
    if (!grid) return;
    const changes = readChanges();

    grid.querySelectorAll('.product-card[data-name]').forEach((card) => {
      const id = card.dataset.id || card.dataset.name;
      card.dataset.id = id;
      if (changes.removed.includes(id)) {
        card.remove();
        return;
      }
      if (changes.edited[id]) fillCard(card, changes.edited[id]);
    });

    const ownerDocument = grid.ownerDocument || document;
    changes.added.forEach((product) => grid.appendChild(createCard(product, ownerDocument)));
  };

  // Imágenes personalizadas por nombre de producto (URL o imagen subida desde el panel).
  const customImages = () => {
    if (cachedImages) return cachedImages;
    const changes = readChanges();
    const images = new Map();
    Object.values(changes.edited).forEach((product) => {
      if (product.image) images.set(product.name, product.image);
    });
    changes.added.forEach((product) => {
      if (product.image) images.set(product.name, product.image);
    });
    cachedImages = images;
    return images;
  };

  const baseGetImage = window.getEStoreProductImage;
  if (baseGetImage) {
    window.getEStoreProductImage = (category, name = '', index = 0) => (
      customImages().get(name) || baseGetImage(category, name, index)
    );
  }

  window.EStoreCatalog = {
    categoryLabels,
    readChanges,
    saveChanges,
    defaultStock,
    formatPrice,
    apply
  };

  apply(document);
})();
