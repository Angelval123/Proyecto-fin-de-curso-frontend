const searchInput = document.querySelector('#product-search');
const sortSelect = document.querySelector('#product-sort');
const brandFilter = document.querySelector('#brand-filter');
const typeFilter = document.querySelector('#type-filter');
const stockFilter = document.querySelector('#stock-filter');
const catalogGrid = document.querySelector('#catalog-grid');
const catalogStatus = document.querySelector('#catalog-status');
const categoryLinks = document.querySelectorAll('[data-filter]');
const quantityModal = document.querySelector('#quantity-modal');
const quantityModalProduct = document.querySelector('#quantity-modal-product');
const quantityModalStock = document.querySelector('#quantity-modal-stock');
const quantityInput = document.querySelector('#quantity-input');
const confirmQuantity = document.querySelector('#confirm-quantity');
const cartKey = 'estore-cart';

const getCart = () => JSON.parse(localStorage.getItem(cartKey) || '[]');

const updateCartCount = () => {
  const count = getCart().reduce((total, product) => total + product.quantity, 0);
  document.querySelectorAll('.cart-button span').forEach((counter) => {
    counter.textContent = count;
  });
};

const getStockByPrice = (price) => {
  if (price <= 250) return 300;
  if (price <= 700) return 150;
  if (price <= 1500) return 100;
  if (price <= 3000) return 60;
  if (price <= 5000) return 40;
  return 30;
};

const categoryImageIndexes = new Map();

document.querySelectorAll('.product-card').forEach((productCard) => {
  const limitedStockCategories = ['movilidad', 'procesadores'];
  const stock = limitedStockCategories.includes(productCard.dataset.category)
    ? 50
    : getStockByPrice(Number(productCard.dataset.price));
  productCard.dataset.stock = stock;
  const stockLabel = productCard.querySelector('.stock');
  if (stockLabel) stockLabel.textContent = `${stock} disponibles`;
  const productImage = productCard.querySelector('img');
  if (productImage) {
    const category = productCard.dataset.category;
    const imageIndex = categoryImageIndexes.get(category) || 0;
    categoryImageIndexes.set(category, imageIndex + 1);
    productImage.src = window.getEStoreProductImage(category, productCard.dataset.name, imageIndex);
    productImage.addEventListener('error', () => {
      productImage.src = 'assets/principal.jpg';
    }, { once: true });
  }

  const detailLink = document.createElement('a');
  const detailParams = new URLSearchParams({
    name: productCard.dataset.name,
    category: productCard.dataset.category,
    price: productCard.dataset.price,
    image: productImage?.getAttribute('src') || '',
    description: productCard.querySelector('p')?.textContent.trim() || ''
  });
  detailLink.className = 'product-detail-link';
  detailLink.href = `producto.html?${detailParams.toString()}`;
  detailLink.textContent = 'Ver detalles';
  productCard.querySelector('.product-card__content')?.appendChild(detailLink);
});

let selectedProductCard = null;
let selectedProductButton = null;

const closeQuantityModal = () => {
  if (!quantityModal) return;
  quantityModal.hidden = true;
  selectedProductCard = null;
  selectedProductButton = null;
};

const openQuantityModal = (productCard, button) => {
  const availableStock = Number(productCard.dataset.stock);
  selectedProductCard = productCard;
  selectedProductButton = button;
  quantityModalProduct.textContent = productCard.dataset.name;
  quantityModalStock.textContent = `${availableStock} disponibles`;
  quantityInput.max = availableStock;
  quantityInput.value = 1;
  quantityModal.hidden = false;
  quantityInput.focus();
};

const addProductToCart = (quantity) => {
  const cart = getCart();
  const product = cart.find((item) => item.name === selectedProductCard.dataset.name);
  const availableStock = Number(selectedProductCard.dataset.stock);

  if (product) {
    product.quantity = Math.min(product.quantity + quantity, availableStock);
  } else {
    cart.push({
      name: selectedProductCard.dataset.name,
      category: selectedProductCard.dataset.category,
      price: Number(selectedProductCard.dataset.price),
      image: selectedProductCard.querySelector('img').getAttribute('src'),
      stock: availableStock,
      quantity
    });
  }

  localStorage.setItem(cartKey, JSON.stringify(cart));
  updateCartCount();
  selectedProductButton.textContent = 'Agregado al carrito';
  setTimeout(() => { selectedProductButton.textContent = 'Comprar'; }, 1200);
  closeQuantityModal();
};

document.querySelectorAll('.product-button').forEach((button) => {
  button.addEventListener('click', () => openQuantityModal(button.closest('.product-card'), button));
});

document.querySelectorAll('[data-close-quantity-modal]').forEach((element) => {
  element.addEventListener('click', closeQuantityModal);
});

confirmQuantity?.addEventListener('click', () => {
  const availableStock = Number(selectedProductCard.dataset.stock);
  const quantity = Math.max(1, Math.min(Number(quantityInput.value) || 1, availableStock));
  addProductToCart(quantity);
});

quantityInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') confirmQuantity.click();
  if (event.key === 'Escape') closeQuantityModal();
});

if (searchInput && sortSelect && catalogGrid) {
  const products = [...catalogGrid.querySelectorAll('.product-card')];
  let activeCategory = 'all';

  const getProductBrand = (product) => product.dataset.name.trim().split(' ')[0];
  const getProductType = (product) => product.dataset.category;

  const typeLabels = {
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

  const brands = [...new Set(products.map(getProductBrand))].sort((firstBrand, secondBrand) => firstBrand.localeCompare(secondBrand));
  brands.forEach((brand) => {
    const option = document.createElement('option');
    option.value = brand;
    option.textContent = brand;
    brandFilter.appendChild(option);
  });

  Object.entries(typeLabels).forEach(([value, label]) => {
    if (!products.some((product) => getProductType(product) === value)) return;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    typeFilter.appendChild(option);
  });

  const renderCatalog = () => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedBrand = brandFilter.value;
    const selectedType = typeFilter.value;
    const selectedStock = stockFilter.value;
    const visibleProducts = products.filter((product) => {
      const matchesCategory = activeCategory === 'all' || product.dataset.category === activeCategory;
      const matchesBrand = selectedBrand === 'all' || getProductBrand(product) === selectedBrand;
      const matchesType = selectedType === 'all' || getProductType(product) === selectedType;
      const stock = Number(product.dataset.stock);
      const matchesStock = selectedStock === 'all'
        || (selectedStock === 'high' && stock >= 250)
        || (selectedStock === 'medium' && stock >= 151 && stock <= 249)
        || (selectedStock === 'low' && stock >= 51 && stock <= 150)
        || (selectedStock === 'very-low' && stock <= 50);
      const searchableText = `${product.dataset.name} ${getProductBrand(product)} ${product.dataset.category}`.toLowerCase();
      return matchesCategory && matchesBrand && matchesType && matchesStock && searchableText.includes(searchTerm);
    });

    const sortedProducts = [...visibleProducts].sort((firstProduct, secondProduct) => {
      const firstPrice = Number(firstProduct.dataset.price);
      const secondPrice = Number(secondProduct.dataset.price);
      const firstStock = Number(firstProduct.dataset.stock);
      const secondStock = Number(secondProduct.dataset.stock);

      if (sortSelect.value === 'price-low') return firstPrice - secondPrice;
      if (sortSelect.value === 'price-high') return secondPrice - firstPrice;
      if (sortSelect.value === 'stock-high') return secondStock - firstStock;
      if (sortSelect.value === 'stock-low') return firstStock - secondStock;
      return products.indexOf(firstProduct) - products.indexOf(secondProduct);
    });

    products.forEach((product) => { product.hidden = true; });
    sortedProducts.forEach((product) => {
      product.hidden = false;
      catalogGrid.appendChild(product);
    });

    catalogStatus.textContent = `${visibleProducts.length} ${visibleProducts.length === 1 ? 'producto encontrado' : 'productos encontrados'}`;
  };

  categoryLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      activeCategory = link.dataset.filter;
      categoryLinks.forEach((categoryLink) => categoryLink.classList.remove('is-selected'));
      link.classList.add('is-selected');
      renderCatalog();
    });
  });

  searchInput.addEventListener('input', renderCatalog);
  sortSelect.addEventListener('change', renderCatalog);
  brandFilter.addEventListener('change', renderCatalog);
  typeFilter.addEventListener('change', renderCatalog);
  stockFilter.addEventListener('change', renderCatalog);
  renderCatalog();
}

updateCartCount();
