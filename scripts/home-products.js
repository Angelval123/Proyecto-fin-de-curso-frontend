const homeCartKey = 'estore-cart';
const homeProductStock = 10;

const updateHomeCartCount = () => {
  const cart = JSON.parse(localStorage.getItem(homeCartKey) || '[]');
  const count = cart.reduce((total, product) => total + product.quantity, 0);
  document.querySelectorAll('.cart-button span').forEach((counter) => {
    counter.textContent = count;
  });
};

const addHomeProductToCart = (productCard, button) => {
  const cart = JSON.parse(localStorage.getItem(homeCartKey) || '[]');
  const product = cart.find((item) => item.name === productCard.dataset.name);

  if (product) {
    product.quantity = Math.min(product.quantity + 1, product.stock);
  } else {
    cart.push({
      name: productCard.dataset.name,
      category: productCard.dataset.category,
      price: Number(productCard.dataset.price),
      image: productCard.querySelector('img').getAttribute('src'),
      stock: homeProductStock,
      quantity: 1
    });
  }

  localStorage.setItem(homeCartKey, JSON.stringify(cart));
  updateHomeCartCount();
  button.textContent = 'Agregado al carrito';
  setTimeout(() => { button.textContent = 'Comprar'; }, 1200);
};

document.querySelectorAll('#productos .product-card[data-name]').forEach((productCard) => {
  const { name, category, price } = productCard.dataset;
  const description = productCard.querySelector('p')?.textContent.trim() || '';
  const image = window.getEStoreProductImage(category, name);
  const detailParams = new URLSearchParams({
    name,
    category,
    price,
    image,
    description
  });
  const detailLink = document.createElement('a');
  detailLink.className = 'product-detail-link';
  detailLink.href = `producto.html?${detailParams.toString()}`;
  detailLink.textContent = 'Ver detalles';
  productCard.querySelector('.product-card__content')?.appendChild(detailLink);

  const buyButton = productCard.querySelector('.product-button');
  buyButton?.addEventListener('click', () => addHomeProductToCart(productCard, buyButton));
});

updateHomeCartCount();
