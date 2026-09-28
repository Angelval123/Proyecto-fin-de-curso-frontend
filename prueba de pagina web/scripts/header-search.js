const searchButton = document.querySelector('[data-header-search-toggle]');
const searchActions = searchButton?.closest('.nav-actions');
const searchIconUrl = 'https://cdn-icons-png.flaticon.com/256/3817/3817429.png';

if (searchButton && searchActions) {
  const searchIcon = document.createElement('img');
  searchIcon.className = 'header-search-icon';
  searchIcon.src = searchIconUrl;
  searchIcon.alt = '';
  searchIcon.setAttribute('aria-hidden', 'true');
  searchButton.replaceChildren(searchIcon);

  const searchPanel = document.createElement('section');
  searchPanel.className = 'header-search';
  searchPanel.hidden = true;
  searchPanel.setAttribute('aria-label', 'Búsqueda de productos');
  searchPanel.innerHTML = `
    <div class="header-search__top">
      <label class="header-search__field">
        <img class="header-search-icon header-search-icon--field" src="${searchIconUrl}" alt="" aria-hidden="true">
        <input class="header-search__input" type="search" placeholder="Buscar productos" autocomplete="off" aria-label="Buscar productos">
      </label>
      <button class="header-search__close" type="button" aria-label="Cerrar búsqueda">×</button>
    </div>
    <div class="header-search__results" role="listbox" aria-label="Productos coincidentes">
      <p class="header-search__message">Escribe el nombre, marca o categoría.</p>
    </div>
  `;
  searchActions.appendChild(searchPanel);

  const searchInput = searchPanel.querySelector('.header-search__input');
  const searchResults = searchPanel.querySelector('.header-search__results');
  const searchClose = searchPanel.querySelector('.header-search__close');
  const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const categoryLabels = {
    camaras: 'Cámaras web',
    computacion: 'Laptops',
    'computadoras-escritorio': 'Computadoras de escritorio',
    perifericos: 'Periféricos',
    componentes: 'Componentes',
    'placas-madre': 'Placas madre',
    procesadores: 'Procesadores',
    monitores: 'Monitores',
    'tarjetas-video': 'Tarjetas de video',
    movilidad: 'Movilidad'
  };

  const closeSearch = () => {
    searchPanel.hidden = true;
    searchButton.setAttribute('aria-expanded', 'false');
  };

  const showMessage = (message) => {
    const item = document.createElement('p');
    item.className = 'header-search__message';
    item.textContent = message;
    searchResults.replaceChildren(item);
  };

  const renderResults = (products) => {
    const query = normalize(searchInput.value);
    if (!query) {
      showMessage('Escribe el nombre, marca o categoría.');
      return;
    }

    const matches = products.filter((product) => normalize(product.searchableText).includes(query)).slice(0, 8);
    if (!matches.length) {
      showMessage('No encontramos productos con ese texto.');
      return;
    }

    const results = matches.map((product) => {
      const link = document.createElement('a');
      link.className = 'header-search__result';
      link.setAttribute('role', 'option');
      link.href = `producto.html?${new URLSearchParams({
        name: product.name,
        category: product.category,
        price: product.price,
        image: product.image,
        description: product.description
      }).toString()}`;

      const image = document.createElement('img');
      image.src = product.image;
      image.alt = '';
      image.loading = 'lazy';
      const info = document.createElement('span');
      info.className = 'header-search__result-info';
      const name = document.createElement('strong');
      name.textContent = product.name;
      const detail = document.createElement('span');
      detail.textContent = `${categoryLabels[product.category] || product.category} · S/ ${Number(product.price).toLocaleString('es-PE')}`;
      info.append(name, detail);
      link.append(image, info);
      link.addEventListener('click', closeSearch);
      return link;
    });

    searchResults.replaceChildren(...results);
  };

  const loadProducts = fetch('productos.html')
    .then((response) => {
      if (!response.ok) throw new Error('No se pudo cargar el catálogo.');
      return response.text();
    })
    .then((html) => {
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const categoryImageIndexes = new Map();
      return [...parsed.querySelectorAll('.product-card[data-name]')].map((card) => {
        const { name, category, price } = card.dataset;
        const description = card.querySelector('p')?.textContent.trim() || '';
        const imageIndex = categoryImageIndexes.get(category) || 0;
        categoryImageIndexes.set(category, imageIndex + 1);
        const image = window.getEStoreProductImage
          ? window.getEStoreProductImage(category, name, imageIndex)
          : card.querySelector('img')?.getAttribute('src') || 'assets/principal.jpg';
        return {
          name,
          category,
          price,
          description,
          image,
          searchableText: `${name} ${category} ${categoryLabels[category] || ''} ${description}`
        };
      });
    });

  searchButton.setAttribute('aria-expanded', 'false');
  searchButton.setAttribute('aria-controls', 'header-search-panel');
  searchPanel.id = 'header-search-panel';
  searchButton.addEventListener('click', () => {
    const isOpen = !searchPanel.hidden;
    searchPanel.hidden = isOpen;
    searchButton.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) searchInput.focus();
  });
  searchClose.addEventListener('click', () => {
    closeSearch();
    searchButton.focus();
  });
  searchInput.addEventListener('input', async () => {
    showMessage('Buscando productos...');
    try {
      renderResults(await loadProducts);
    } catch {
      showMessage('No se pudo cargar el catálogo. Intenta desde Productos.');
    }
  });
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeSearch();
      searchButton.focus();
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      searchResults.querySelector('a')?.focus();
    }
  });
  document.addEventListener('pointerdown', (event) => {
    if (!searchActions.contains(event.target)) closeSearch();
  });
}