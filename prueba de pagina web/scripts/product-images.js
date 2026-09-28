const productImagesByCategory = {
  camaras: ['Logitech 1.jpg', 'Logitech 2.jpg', 'Logitech 3.jpg'],
  computacion: ['Laptop asus.jpg', 'Laptop Dell.jpg', 'Laptop HP.jpg'],
  'computadoras-escritorio': ['PC de escritorio 1.jpg'],
  perifericos: ['Mouse.jpg'],
  componentes: ['Memoria RAM.jpg', 'Memoria Ram crucial.jpg'],
  'placas-madre': ['Placa madre asus.jpg', 'Placa madre.jpg'],
  procesadores: ['Procesador AMD.jpg', 'CPU intel.webp'],
  monitores: ['Monitor teros.jpg', 'Monitor 2.jpg', 'Monitor 3.jpg'],
  'tarjetas-video': [
    'ASUS ProArt RTX 5080 16 GB.jpg',
    'Gigabyte AORUS RX 9070 XT Elite 16 GB.jpg',
    'ASUS Prime RX 9070 XT 16 GB.jpg',
    'Gigabyte RX 9070 Gaming OC 16 GB.webp',
    'Gigabyte RTX 5070 Gaming OC 12 GB.png'
  ],
  movilidad: ['Scooter 1.jpg', 'Scooter 2.jpg']
};

const productImageRules = [
  { category: 'camaras', match: /c270/i, image: 'Logitech 1.jpg' },
  { category: 'camaras', match: /c920/i, image: 'Logitech 2.jpg' },
  { category: 'camaras', match: /c922/i, image: 'Logitech 3.jpg' },
  { category: 'computacion', match: /monitor/i, image: 'Monitor teros.jpg' },
  { category: 'computacion', match: /asus/i, image: 'Laptop asus.jpg' },
  { category: 'computacion', match: /dell/i, image: 'Laptop Dell.jpg' },
  { category: 'computacion', match: /hp/i, image: 'Laptop HP.jpg' },
  { category: 'componentes', match: /crucial/i, image: 'Memoria Ram crucial.jpg' },
  { category: 'placas-madre', match: /asus/i, image: 'Placa madre asus.jpg' },
  { category: 'procesadores', match: /^intel/i, image: 'CPU intel.webp' },
  { category: 'procesadores', match: /^amd/i, image: 'Procesador AMD.jpg' },
  { category: 'tarjetas-video', match: /proart/i, image: 'ASUS ProArt RTX 5080 16 GB.jpg' },
  { category: 'tarjetas-video', match: /aorus/i, image: 'Gigabyte AORUS RX 9070 XT Elite 16 GB.jpg' },
  { category: 'tarjetas-video', match: /prime/i, image: 'ASUS Prime RX 9070 XT 16 GB.jpg' },
  { category: 'tarjetas-video', match: /rtx 5070/i, image: 'Gigabyte RTX 5070 Gaming OC 12 GB.png' },
  { category: 'tarjetas-video', match: /rx 9070 gaming/i, image: 'Gigabyte RX 9070 Gaming OC 16 GB.webp' },
  { category: 'movilidad', match: /c2 lite/i, image: 'Scooter 1.jpg' },
  { category: 'movilidad', match: /c2$/i, image: 'Scooter 2.jpg' }
];

window.getEStoreProductImage = (category, name = '', index = 0) => {
  const specificImage = productImageRules.find((rule) => rule.category === category && rule.match.test(name))?.image;
  const categoryImages = productImagesByCategory[category] || ['principal.jpg'];
  const image = specificImage || categoryImages[index % categoryImages.length];
  return `assets/${encodeURIComponent(image)}`;
};