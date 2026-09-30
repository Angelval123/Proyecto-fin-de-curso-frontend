const { categoryLabels, readChanges, saveChanges, defaultStock, formatPrice } = window.EStoreCatalog;
const { getSession, logout, createLoginForm } = window.EStoreAuth;

const loginSection = document.querySelector('#admin-login');
const loginCard = document.querySelector('#admin-login-card');
const dashboard = document.querySelector('#admin-dashboard');
const sessionActions = document.querySelector('#admin-session-actions');
const userLabel = document.querySelector('#admin-user');
const tableBody = document.querySelector('#admin-table-body');
const tableStatus = document.querySelector('#admin-table-status');
const searchInput = document.querySelector('#admin-search');
const categoryFilter = document.querySelector('#admin-category-filter');
const statusFilter = document.querySelector('#admin-status-filter');
const sortSelect = document.querySelector('#admin-sort');
const categoryList = document.querySelector('#admin-categories');
const toast = document.querySelector('#admin-toast');

const productModal = document.querySelector('#product-modal');
const productForm = document.querySelector('#product-form');
const productModalTitle = document.querySelector('#product-modal-title');
const productModalEyebrow = document.querySelector('#product-modal-eyebrow');
const productSubmit = document.querySelector('#product-submit');
const nameInput = document.querySelector('#product-name');
const categoryInput = document.querySelector('#product-category');
const priceInput = document.querySelector('#product-price');
const stockInput = document.querySelector('#product-stock');
const imageUrlInput = document.querySelector('#product-image-url');
const imageFileInput = document.querySelector('#product-image-file');
const imagePreview = document.querySelector('#product-image-preview');
const imageClear = document.querySelector('#product-image-clear');
const descriptionInput = document.querySelector('#product-description');
const descriptionCount = document.querySelector('#product-description-count');

const confirmModal = document.querySelector('#confirm-modal');
const confirmTitle = document.querySelector('#confirm-modal-title');
const confirmText = document.querySelector('#confirm-modal-text');
const confirmAccept = document.querySelector('#confirm-modal-accept');

const statusLabels = { original: 'Original', editado: 'Editado', nuevo: 'Nuevo' };
const normalize = (value) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

let baseProducts = [];
let editingProduct = null;
let uploadedImage = '';
let confirmAction = null;
let lastFocused = null;
let toastTimer = null;

// ---------- Datos ----------

const loadBaseProducts = async () => {
  const response = await fetch('productos.html');
  if (!response.ok) throw new Error('No se pudo cargar productos.html');
  const parsed = new DOMParser().parseFromString(await response.text(), 'text/html');
  return [...parsed.querySelectorAll('#catalog-grid .product-card[data-name]')].map((card) => {
    const price = Number(card.dataset.price);
    return {
      id: card.dataset.name,
      name: card.dataset.name,
      category: card.dataset.category,
      price,
      stock: defaultStock(card.dataset.category, price),
      description: card.querySelector('.product-card__content p')?.textContent.trim() || '',
      image: ''
    };
  });
};

const getProducts = () => {
  const changes = readChanges();
  const current = baseProducts
    .filter((product) => !changes.removed.includes(product.id))
    .map((product) => (changes.edited[product.id]
      ? { ...product, ...changes.edited[product.id], id: product.id, status: 'editado' }
      : { ...product, status: 'original' }));
  return [...current, ...changes.added.map((product) => ({ ...product, status: 'nuevo' }))];
};

const getProductImage = (product, index) => (
  product.image || window.getEStoreProductImage(product.category, product.name, index)
);

const persist = (update) => {
  if (!getSession()) {
    showLogin('Tu sesión expiró. Vuelve a iniciar sesión para guardar cambios.');
    return false;
  }
  const changes = readChanges();
  update(changes);
  try {
    saveChanges(changes);
    return true;
  } catch {
    showToast('No se pudo guardar: el almacenamiento del navegador está lleno. Usa una imagen más liviana o una URL.', true);
    return false;
  }
};

// ---------- Vista ----------

const showToast = (message, isError = false) => {
  toast.textContent = message;
  toast.classList.toggle('is-error', isError);
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
};

const stockClass = (stock) => {
  if (stock <= 50) return 'admin-stock admin-stock--low';
  if (stock <= 150) return 'admin-stock admin-stock--medium';
  return 'admin-stock';
};

const renderStats = (products) => {
  const changes = readChanges();
  const totalStock = products.reduce((total, product) => total + Number(product.stock), 0);
  const totalValue = products.reduce((total, product) => total + product.price * product.stock, 0);
  const usedCategories = new Set(products.map((product) => product.category));
  const changeCount = Object.keys(changes.edited).length + changes.added.length + changes.removed.length;
  const setStat = (key, value) => { document.querySelector(`[data-stat="${key}"]`).textContent = value; };

  setStat('total', products.length.toLocaleString('es-PE'));
  setStat('changes', changeCount ? `${changeCount} ${changeCount === 1 ? 'cambio' : 'cambios'} sobre el catálogo base` : 'Sin cambios sobre el catálogo base');
  setStat('stock', totalStock.toLocaleString('es-PE'));
  setStat('categories', `En ${usedCategories.size} categorías`);
  setStat('value', `S/ ${Math.round(totalValue).toLocaleString('es-PE')}`);
  setStat('average', products.length ? `Precio promedio ${formatPrice(Math.round(products.reduce((t, p) => t + p.price, 0) / products.length))}` : '');
  setStat('low', products.filter((product) => product.stock <= 50).length.toLocaleString('es-PE'));

  const counts = Object.keys(categoryLabels).map((key) => ({
    key,
    count: products.filter((product) => product.category === key).length
  }));
  const maxCount = Math.max(1, ...counts.map((item) => item.count));
  categoryList.replaceChildren(...counts.map(({ key, count }) => {
    const item = document.createElement('li');
    item.className = 'admin-categories__item';
    item.innerHTML = '<span class="admin-categories__name"></span><span class="admin-categories__bar"><span></span></span><strong></strong>';
    item.querySelector('.admin-categories__name').textContent = categoryLabels[key];
    item.querySelector('.admin-categories__bar span').style.width = `${(count / maxCount) * 100}%`;
    item.querySelector('strong').textContent = count;
    return item;
  }));
};

const renderTable = () => {
  const products = getProducts();
  renderStats(products);

  const imageIndexes = new Map();
  const withImages = products.map((product) => {
    const index = imageIndexes.get(product.category) || 0;
    imageIndexes.set(product.category, index + 1);
    return { ...product, thumbnail: getProductImage(product, index) };
  });

  const query = normalize(searchInput.value);
  const visible = withImages.filter((product) => (
    (categoryFilter.value === 'all' || product.category === categoryFilter.value)
    && (statusFilter.value === 'all' || product.status === statusFilter.value)
    && normalize(`${product.name} ${product.description} ${categoryLabels[product.category] || ''}`).includes(query)
  ));

  const sorters = {
    name: (a, b) => a.name.localeCompare(b.name, 'es'),
    'price-high': (a, b) => b.price - a.price,
    'price-low': (a, b) => a.price - b.price,
    'stock-low': (a, b) => a.stock - b.stock
  };
  if (sorters[sortSelect.value]) visible.sort(sorters[sortSelect.value]);

  tableStatus.textContent = `${visible.length} de ${products.length} ${products.length === 1 ? 'producto' : 'productos'}`;

  if (!visible.length) {
    const row = document.createElement('tr');
    row.innerHTML = '<td class="admin-table__empty" colspan="6">No hay productos que coincidan con los filtros.</td>';
    tableBody.replaceChildren(row);
    return;
  }

  tableBody.replaceChildren(...visible.map((product) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <div class="admin-product">
          <img alt="" loading="lazy">
          <div>
            <strong class="admin-product__name"></strong>
            <span class="admin-product__description"></span>
          </div>
        </div>
      </td>
      <td class="admin-table__category"></td>
      <td class="is-numeric admin-table__price"></td>
      <td class="is-numeric"><span></span></td>
      <td><span class="admin-status admin-status--${product.status}">${statusLabels[product.status]}</span></td>
      <td>
        <div class="admin-actions">
          <button class="admin-action" type="button" data-action="edit">Editar</button>
          ${product.status === 'editado' ? '<button class="admin-action" type="button" data-action="revert">Deshacer</button>' : ''}
          <button class="admin-action admin-action--danger" type="button" data-action="delete">Eliminar</button>
        </div>
      </td>
    `;
    const image = row.querySelector('img');
    image.src = product.thumbnail;
    image.addEventListener('error', () => { image.src = 'assets/principal.jpg'; }, { once: true });
    row.querySelector('.admin-product__name').textContent = product.name;
    row.querySelector('.admin-product__description').textContent = product.description;
    row.querySelector('.admin-table__category').textContent = categoryLabels[product.category] || product.category;
    row.querySelector('.admin-table__price').textContent = formatPrice(product.price);
    const stock = row.querySelector('td:nth-child(4) span');
    stock.className = stockClass(product.stock);
    stock.textContent = product.stock.toLocaleString('es-PE');
    row.querySelectorAll('[data-action]').forEach((button) => {
      button.setAttribute('aria-label', `${button.textContent} ${product.name}`);
    });
    row.querySelector('[data-action="edit"]').addEventListener('click', () => openProductModal(product));
    row.querySelector('[data-action="revert"]')?.addEventListener('click', () => revertProduct(product));
    row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteProduct(product));
    return row;
  }));
};

// ---------- Formulario de producto ----------

const setImagePreview = (source) => {
  imagePreview.src = source || window.getEStoreProductImage(categoryInput.value, nameInput.value.trim());
};

const clearFormErrors = () => {
  productForm.querySelectorAll('[data-error-for]').forEach((error) => { error.textContent = ''; });
  productForm.querySelectorAll('[aria-invalid]').forEach((field) => field.removeAttribute('aria-invalid'));
};

const openProductModal = (product = null) => {
  editingProduct = product;
  uploadedImage = '';
  productForm.reset();
  clearFormErrors();
  imageFileInput.value = '';

  productModalEyebrow.textContent = product ? 'Editar producto' : 'Nuevo producto';
  productModalTitle.textContent = product ? product.name : 'Añadir producto';
  productSubmit.textContent = product ? 'Guardar cambios' : 'Publicar producto';

  if (product) {
    nameInput.value = product.name;
    categoryInput.value = product.category;
    priceInput.value = product.price;
    stockInput.value = product.stock;
    descriptionInput.value = product.description;
    if (product.image?.startsWith('data:')) uploadedImage = product.image;
    else imageUrlInput.value = product.image || '';
  }
  descriptionCount.textContent = descriptionInput.value.length;
  setImagePreview(uploadedImage || imageUrlInput.value.trim());

  lastFocused = document.activeElement;
  productModal.hidden = false;
  nameInput.focus();
};

const closeProductModal = () => {
  productModal.hidden = true;
  editingProduct = null;
  lastFocused?.focus();
};

const isValidImageSource = (value) => (
  !value || /^https?:\/\/\S+$/i.test(value) || /^assets\/[\w\-./]+\.(jpe?g|png|webp|gif|svg|avif)$/i.test(value)
);

const validateProduct = () => {
  const errors = {};
  const name = nameInput.value.trim().replace(/\s+/g, ' ');
  const price = Number(priceInput.value);
  const stock = Number(stockInput.value);
  const description = descriptionInput.value.trim();
  const image = imageUrlInput.value.trim();
  const duplicate = getProducts().some((product) => (
    normalize(product.name) === normalize(name) && product.id !== editingProduct?.id
  ));

  if (name.length < 3) errors.name = 'El nombre debe tener al menos 3 caracteres.';
  else if (duplicate) errors.name = 'Ya existe un producto con ese nombre.';
  if (!categoryLabels[categoryInput.value]) errors.category = 'Selecciona una categoría.';
  if (priceInput.value === '' || !Number.isFinite(price) || price <= 0) errors.price = 'Ingresa un precio mayor a 0.';
  else if (price > 100000) errors.price = 'El precio no puede superar S/ 100,000.';
  else if (!/^\d+(\.\d{1,2})?$/.test(priceInput.value.trim())) errors.price = 'Usa como máximo 2 decimales.';
  if (stockInput.value === '' || !Number.isInteger(stock) || stock < 0) errors.stock = 'El stock debe ser un número entero de 0 o más.';
  else if (stock > 10000) errors.stock = 'El stock no puede superar 10,000 unidades.';
  if (description.length < 10) errors.description = 'La descripción debe tener al menos 10 caracteres.';
  if (!uploadedImage && !isValidImageSource(image)) errors.image = 'Usa una URL https:// o una ruta de assets/.';

  return {
    errors,
    product: { name, category: categoryInput.value, price, stock, description, image: uploadedImage || image }
  };
};

const showFormErrors = (errors) => {
  const fields = { name: nameInput, category: categoryInput, price: priceInput, stock: stockInput, description: descriptionInput, image: imageUrlInput };
  Object.entries(errors).forEach(([key, message]) => {
    productForm.querySelector(`[data-error-for="${key}"]`).textContent = message;
    fields[key].setAttribute('aria-invalid', 'true');
  });
  fields[Object.keys(fields).find((key) => errors[key])]?.focus();
};

const resizeImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.addEventListener('error', reject);
  reader.addEventListener('load', () => {
    const image = new Image();
    image.addEventListener('error', reject);
    image.addEventListener('load', () => {
      const scale = Math.min(1, 480 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext('2d');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    });
    image.src = reader.result;
  });
  reader.readAsDataURL(file);
});

productForm.addEventListener('submit', (event) => {
  event.preventDefault();
  clearFormErrors();
  const { errors, product } = validateProduct();
  if (Object.keys(errors).length) {
    showFormErrors(errors);
    return;
  }

  const isEditing = Boolean(editingProduct);
  const saved = persist((changes) => {
    if (!isEditing) {
      changes.added.push({ ...product, id: `nuevo-${Date.now().toString(36)}` });
    } else if (editingProduct.status === 'nuevo') {
      changes.added = changes.added.map((item) => (item.id === editingProduct.id ? { ...product, id: item.id } : item));
    } else {
      changes.edited[editingProduct.id] = product;
    }
  });
  if (!saved) return;

  closeProductModal();
  renderTable();
  showToast(isEditing ? `“${product.name}” se actualizó.` : `“${product.name}” se publicó en la tienda.`);
});

imageFileInput.addEventListener('change', async () => {
  const file = imageFileInput.files[0];
  if (!file) return;
  const imageError = productForm.querySelector('[data-error-for="image"]');
  if (!file.type.startsWith('image/')) {
    imageError.textContent = 'El archivo debe ser una imagen.';
    return;
  }
  try {
    uploadedImage = await resizeImage(file);
    imageUrlInput.value = '';
    imageError.textContent = '';
    imageUrlInput.removeAttribute('aria-invalid');
    setImagePreview(uploadedImage);
  } catch {
    imageError.textContent = 'No se pudo leer la imagen.';
  }
});

imageUrlInput.addEventListener('input', () => {
  uploadedImage = '';
  imageFileInput.value = '';
  const value = imageUrlInput.value.trim();
  if (isValidImageSource(value)) setImagePreview(value);
});

imageClear.addEventListener('click', () => {
  uploadedImage = '';
  imageUrlInput.value = '';
  imageFileInput.value = '';
  setImagePreview('');
});

const clearFieldError = (event) => {
  const error = productForm.querySelector(`[data-error-for="${event.target.name}"]`);
  if (!error) return;
  error.textContent = '';
  event.target.removeAttribute('aria-invalid');
};
productForm.addEventListener('input', clearFieldError);
productForm.addEventListener('change', clearFieldError);

imagePreview.addEventListener('error',() => { imagePreview.src = 'assets/principal.jpg'; });
categoryInput.addEventListener('change', () => {
  if (!uploadedImage && !imageUrlInput.value.trim()) setImagePreview('');
});
descriptionInput.addEventListener('input', () => { descriptionCount.textContent = descriptionInput.value.length; });

// ---------- Confirmaciones ----------

const openConfirm = ({ title, text, accept, onConfirm }) => {
  confirmTitle.textContent = title;
  confirmText.textContent = text;
  confirmAccept.textContent = accept;
  confirmAction = onConfirm;
  lastFocused = document.activeElement;
  confirmModal.hidden = false;
  confirmModal.querySelector('[data-close-confirm-modal].btn').focus();
};

const closeConfirm = () => {
  confirmModal.hidden = true;
  confirmAction = null;
  lastFocused?.focus();
};

confirmAccept.addEventListener('click', () => {
  const action = confirmAction;
  closeConfirm();
  action?.();
});

const deleteProduct = (product) => openConfirm({
  title: '¿Eliminar este producto?',
  text: `“${product.name}” dejará de mostrarse en la tienda.`,
  accept: 'Eliminar',
  onConfirm: () => {
    const saved = persist((changes) => {
      if (product.status === 'nuevo') {
        changes.added = changes.added.filter((item) => item.id !== product.id);
        return;
      }
      delete changes.edited[product.id];
      if (!changes.removed.includes(product.id)) changes.removed.push(product.id);
    });
    if (!saved) return;
    renderTable();
    showToast(`“${product.name}” se eliminó del catálogo.`);
  }
});

const revertProduct = (product) => openConfirm({
  title: '¿Deshacer los cambios?',
  text: `“${product.name}” volverá a sus datos originales.`,
  accept: 'Deshacer cambios',
  onConfirm: () => {
    if (!persist((changes) => { delete changes.edited[product.id]; })) return;
    renderTable();
    showToast('Se restauraron los datos originales del producto.');
  }
});

document.querySelector('#admin-reset').addEventListener('click', () => openConfirm({
  title: '¿Restaurar el catálogo original?',
  text: 'Se perderán todos los productos añadidos, editados y eliminados desde este panel.',
  accept: 'Restaurar catálogo',
  onConfirm: () => {
    if (!persist((changes) => {
      changes.edited = {};
      changes.added = [];
      changes.removed = [];
    })) return;
    renderTable();
    showToast('El catálogo volvió a su estado original.');
  }
}));

// ---------- Sesión ----------

let dashboardReady = false;

const showDashboard = async (session) => {
  loginSection.hidden = true;
  dashboard.hidden = false;
  sessionActions.hidden = false;
  userLabel.textContent = `Hola, ${session.name}`;

  if (dashboardReady) {
    renderTable();
    return;
  }
  try {
    baseProducts = await loadBaseProducts();
    dashboardReady = true;
    renderTable();
  } catch {
    tableStatus.textContent = 'No se pudo cargar el catálogo. Abre el sitio desde un servidor local (por ejemplo Live Server).';
  }
};

let loginForm = null;

const showLogin = (message = '') => {
  productModal.hidden = true;
  confirmModal.hidden = true;
  dashboard.hidden = true;
  sessionActions.hidden = true;
  loginSection.hidden = false;
  if (!loginForm) {
    loginForm = createLoginForm({ onSuccess: showDashboard });
    loginCard.appendChild(loginForm);
  }
  if (message) loginForm.querySelector('.worker-login__error').textContent = message;
  loginForm.focusFirst();
};

document.querySelector('#admin-logout').addEventListener('click', () => {
  logout();
  showLogin('Cerraste sesión correctamente.');
});

// ---------- Eventos generales ----------

Object.entries(categoryLabels).forEach(([value, label]) => {
  categoryFilter.appendChild(new Option(label, value));
  categoryInput.appendChild(new Option(label, value));
});

document.querySelector('#admin-new-product').addEventListener('click', () => openProductModal());
[searchInput, categoryFilter, statusFilter, sortSelect].forEach((control) => {
  control.addEventListener(control === searchInput ? 'input' : 'change', renderTable);
});
document.querySelectorAll('[data-close-product-modal]').forEach((element) => element.addEventListener('click', closeProductModal));
document.querySelectorAll('[data-close-confirm-modal]').forEach((element) => element.addEventListener('click', closeConfirm));
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (!confirmModal.hidden) closeConfirm();
  else if (!productModal.hidden) closeProductModal();
});

// Si la sesión caduca con el panel abierto, se vuelve a pedir el login.
setInterval(() => {
  if (!dashboard.hidden && !getSession()) showLogin('Tu sesión expiró. Vuelve a iniciar sesión.');
}, 30 * 1000);

const initialSession = getSession();
if (initialSession) showDashboard(initialSession);
else showLogin();
