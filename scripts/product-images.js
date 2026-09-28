const productImagesByCategory = {
  camaras: ['logitech-1.jpg', 'logitech-2.jpg', 'logitech-3.jpg'],
  computacion: ['laptop-asus.jpg', 'laptop-dell.jpg', 'laptop-hp.jpg'],
  'computadoras-escritorio': ['pc-escritorio-1.jpg'],
  perifericos: ['mouse.jpg'],
  componentes: ['memoria-ram.jpg', 'memoria-ram-crucial.jpg'],
  'placas-madre': ['placa-madre-asus.jpg', 'placa-madre.jpg'],
  procesadores: ['procesador-amd.jpg', 'cpu-intel.webp'],
  monitores: ['monitor-teros.jpg', 'monitor-2.jpg', 'monitor-3.jpg'],
  'tarjetas-video': [
    'asus-proart-rtx-5080-16gb.jpg',
    'gigabyte-aorus-rx-9070-xt-elite-16gb.jpg',
    'asus-prime-rx-9070-xt-16gb.jpg',
    'gigabyte-rx-9070-gaming-oc-16gb.webp',
    'gigabyte-rtx-5070-gaming-oc-12gb.png'
  ],
  movilidad: ['scooter-1.jpg', 'scooter-2.jpg']
};

const productImageRules = [
  { category: 'camaras', match: /c270/i, image: 'logitech-1.jpg' },
  { category: 'camaras', match: /c920/i, image: 'logitech-2.jpg' },
  { category: 'camaras', match: /c922/i, image: 'logitech-3.jpg' },
  { category: 'computacion', match: /monitor/i, image: 'monitor-teros.jpg' },
  { category: 'computacion', match: /asus/i, image: 'laptop-asus.jpg' },
  { category: 'computacion', match: /dell/i, image: 'laptop-dell.jpg' },
  { category: 'computacion', match: /hp/i, image: 'laptop-hp.jpg' },
  { category: 'componentes', match: /crucial/i, image: 'memoria-ram-crucial.jpg' },
  { category: 'placas-madre', match: /asus/i, image: 'placa-madre-asus.jpg' },
  { category: 'procesadores', match: /^intel/i, image: 'cpu-intel.webp' },
  { category: 'procesadores', match: /^amd/i, image: 'procesador-amd.jpg' },
  { category: 'tarjetas-video', match: /proart/i, image: 'asus-proart-rtx-5080-16gb.jpg' },
  { category: 'tarjetas-video', match: /aorus/i, image: 'gigabyte-aorus-rx-9070-xt-elite-16gb.jpg' },
  { category: 'tarjetas-video', match: /prime/i, image: 'asus-prime-rx-9070-xt-16gb.jpg' },
  { category: 'tarjetas-video', match: /rtx 5070/i, image: 'gigabyte-rtx-5070-gaming-oc-12gb.png' },
  { category: 'tarjetas-video', match: /rx 9070 gaming/i, image: 'gigabyte-rx-9070-gaming-oc-16gb.webp' },
  { category: 'movilidad', match: /c2 lite/i, image: 'scooter-1.jpg' },
  { category: 'movilidad', match: /c2$/i, image: 'scooter-2.jpg' }
];

window.getEStoreProductImage = (category, name = '', index = 0) => {
  const specificImage = productImageRules.find((rule) => rule.category === category && rule.match.test(name))?.image;
  const categoryImages = productImagesByCategory[category] || [];
  const image = specificImage || categoryImages[index % categoryImages.length];
  if (!image) return 'assets/principal.jpg';
  return `assets/${image}`;
};