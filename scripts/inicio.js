// Productos reales del catálogo que el asesor puede recomendar, ordenados por precio.
const finderProducts = {
  jugar: [
    { name: 'HP Victus Gaming 15 RTX 3050', category: 'computacion', price: 3034.5, description: 'Core i5 y tarjeta gráfica RTX 3050.' },
    { name: 'HP Victus Gaming 15 RTX 4050', category: 'computacion', price: 3989.5, description: 'Core i5 y tarjeta gráfica RTX 4050.' },
    { name: 'Lenovo Legion Gaming', category: 'computadoras-escritorio', price: 4500, description: 'Computadora gaming con Ryzen 7, 16 GB de RAM y tarjeta RTX.' },
    { name: 'HP Omen Desktop', category: 'computadoras-escritorio', price: 5500, description: 'Computadora gaming con Ryzen o Core y tarjeta RTX.' },
    { name: 'Lenovo Legion 5', category: 'computacion', price: 5799, description: 'Core i7, 16 GB de RAM y tarjeta gráfica RTX 5050.' },
    { name: 'ASUS ROG Gaming Desktop', category: 'computadoras-escritorio', price: 6000, description: 'Computadora gaming con procesador Core o Ryzen y tarjeta RTX.' }
  ],
  estudiar: [
    { name: 'Lenovo V15 G5 IRL', category: 'computacion', price: 1943.5, description: 'Core i3, 8 GB de RAM y almacenamiento de 512 GB.' },
    { name: 'HP Pro Mini 260 G9', category: 'computadoras-escritorio', price: 2182, description: 'Computadora mini con procesador i5, 16 GB de RAM y 512 GB.' },
    { name: 'ASUS Vivobook 15 X1504VA', category: 'computacion', price: 2625.5, description: 'Core 5, 16 GB de RAM y almacenamiento de 512 GB.' },
    { name: 'HP 15-fd0374la', category: 'computacion', price: 3222, description: 'Core 7, 16 GB de RAM y almacenamiento de 512 GB.' }
  ],
  oficina: [
    { name: 'HP Pro Mini 260 G9 W11 Pro', category: 'computadoras-escritorio', price: 2840.5, description: 'Computadora mini con procesador i5, 16 GB de RAM y 512 GB.' },
    { name: 'Lenovo ThinkCentre Neo 50q Ultra 5', category: 'computadoras-escritorio', price: 3065.5, description: 'Procesador Ultra 5, 16 GB de RAM y almacenamiento de 512 GB.' },
    { name: 'ASUS ExpertBook B1503CVA', category: 'computacion', price: 3406.5, description: 'Core 7, 16 GB de RAM y almacenamiento de 512 GB.' },
    { name: 'Dell Pro 15', category: 'computacion', price: 3614.5, description: 'Core i5, 16 GB de RAM y almacenamiento de 512 GB.' },
    { name: 'HP ProDesk 4 Mini G1i', category: 'computadoras-escritorio', price: 3972.5, description: 'Computadora mini con procesador Ultra 5, 24 GB de RAM y 512 GB.' }
  ],
  editar: [
    { name: 'Lenovo ThinkCentre Neo 50q Ultra 7', category: 'computadoras-escritorio', price: 3955.5, description: 'Procesador Ultra 7, 16 GB de RAM y almacenamiento de 512 GB.' },
    { name: 'ASUS ExpertCenter D700SSF', category: 'computadoras-escritorio', price: 4429.5, description: 'Procesador Ultra 7, 16 GB de RAM y almacenamiento de 1 TB.' },
    { name: 'Dell Pro QCM1250 MFF', category: 'computadoras-escritorio', price: 4671.5, description: 'Computadora compacta con procesador i7, 16 GB de RAM y 512 GB.' },
    { name: 'Lenovo Legion 5', category: 'computacion', price: 5799, description: 'Core i7, 16 GB de RAM y tarjeta gráfica RTX 5050.' }
  ]
};

const useLabels = { jugar: 'jugar', estudiar: 'estudiar', oficina: 'trabajo y oficina', editar: 'editar foto y video' };
const formatPrice = (price) => `S/ ${price.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(price) ? 0 : 2 })}`;

const productDetailUrl = ({ name, category, price, description }) => `producto.html?${new URLSearchParams({
  name,
  category,
  price,
  image: window.getEStoreProductImage(category, name),
  description
}).toString()}`;


// Asesor de compra con carrusel de equipos
const useButtons = document.querySelectorAll('[data-use]');
const budgetInput = document.querySelector('#finder-budget');
const finderTrack = document.querySelector('#finder-track');
const finderDots = document.querySelector('#finder-dots');
const finderCarousel = document.querySelector('.finder__image');
const finderSummary = document.querySelector('#finder-summary');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const AUTOPLAY_DELAY = 4000;

let selectedUse = 'jugar';
let currentSlide = 0;
let recommendedSlide = 0;
let autoplayTimer = null;

const currentOptions = () => finderProducts[selectedUse];

const showSlide = (index) => {
  const options = currentOptions();
  const budget = Number(budgetInput.value);
  currentSlide = (index + options.length) % options.length;
  const product = options[currentSlide];

  finderTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
  finderDots.querySelectorAll('button').forEach((dot, dotIndex) => {
    dot.setAttribute('aria-current', String(dotIndex === currentSlide));
  });

  let label = `Otra opción para ${useLabels[selectedUse]}`;
  if (currentSlide === recommendedSlide) label = `Recomendado para ${useLabels[selectedUse]}`;
  if (product.price > budget) label = 'Supera tu presupuesto';

  document.querySelector('#finder-for').textContent = label;
  document.querySelector('#finder-name').textContent = product.name;
  document.querySelector('#finder-price').textContent = formatPrice(product.price);
  document.querySelector('#finder-spec').textContent = product.description;
  document.querySelector('#finder-cta').href = productDetailUrl(product);

  // Reinicia la animación de entrada del resumen
  finderSummary.classList.remove('is-changing');
  void finderSummary.offsetWidth;
  finderSummary.classList.add('is-changing');
};

const stopAutoplay = () => clearInterval(autoplayTimer);
const startAutoplay = () => {
  stopAutoplay();
  if (!reduceMotion) autoplayTimer = setInterval(() => showSlide(currentSlide + 1), AUTOPLAY_DELAY);
};

const buildSlides = () => {
  const options = currentOptions();
  finderTrack.replaceChildren(...options.map((product) => {
    const slide = document.createElement('div');
    slide.className = 'finder__slide';
    const image = document.createElement('img');
    image.src = window.getEStoreProductImage(product.category, product.name);
    image.alt = product.name;
    slide.appendChild(image);
    return slide;
  }));
  finderDots.replaceChildren(...options.map((product, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Ver ${product.name}`);
    dot.addEventListener('click', () => { showSlide(index); startAutoplay(); });
    return dot;
  }));
};

const updateRecommendation = () => {
  const options = currentOptions();
  const budget = Number(budgetInput.value);
  // El más caro que entra en el presupuesto; si ninguno entra, el más barato.
  const affordable = options.filter((option) => option.price <= budget);
  recommendedSlide = affordable.length ? affordable.length - 1 : 0;
  document.querySelector('#finder-budget-label').textContent = formatPrice(budget);
  showSlide(recommendedSlide);
  startAutoplay();
};

if (budgetInput && finderTrack) {
  useButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedUse = button.dataset.use;
      useButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      buildSlides();
      updateRecommendation();
    });
  });

  budgetInput.addEventListener('input', updateRecommendation);
  document.querySelector('#finder-prev').addEventListener('click', () => { showSlide(currentSlide - 1); startAutoplay(); });
  document.querySelector('#finder-next').addEventListener('click', () => { showSlide(currentSlide + 1); startAutoplay(); });
  finderCarousel.addEventListener('mouseenter', stopAutoplay);
  finderCarousel.addEventListener('mouseleave', startAutoplay);

  buildSlides();
  updateRecommendation();
}

// Enlaces de "Equipos listos" hacia la página de detalle
document.querySelectorAll('[data-detail-card]').forEach((card) => {
  const link = card.querySelector('.kit__link');
  if (link) link.href = productDetailUrl(card.dataset);
});

// Un solo buscador: se escribe en la barra grande y los resultados aparecen debajo
const homeSearchInput = document.querySelector('[data-home-search]');
const headerSearchPanel = document.querySelector('.header-search');
const headerSearchToggle = document.querySelector('[data-header-search-toggle]');

if (homeSearchInput && headerSearchPanel) {
  const panelInput = headerSearchPanel.querySelector('.header-search__input');
  homeSearchInput.closest('[data-search-anchor]').appendChild(headerSearchPanel);

  const openPanel = () => {
    headerSearchPanel.hidden = false;
    headerSearchToggle?.setAttribute('aria-expanded', 'true');
  };
  const closePanel = () => {
    headerSearchPanel.hidden = true;
    headerSearchToggle?.setAttribute('aria-expanded', 'false');
  };

  homeSearchInput.addEventListener('input', () => {
    panelInput.value = homeSearchInput.value;
    panelInput.dispatchEvent(new Event('input'));
    if (homeSearchInput.value.trim()) openPanel(); else closePanel();
  });
  homeSearchInput.addEventListener('focus', () => {
    if (homeSearchInput.value.trim()) openPanel();
  });
  homeSearchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePanel();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      headerSearchPanel.querySelector('a')?.focus();
    }
  });
}
