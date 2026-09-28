const volumeDiscounts = document.querySelector('.volume-discounts');

if (volumeDiscounts) {
  const setPointerOrigin = (event) => {
    const bounds = volumeDiscounts.getBoundingClientRect();
    volumeDiscounts.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
    volumeDiscounts.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
  };

  volumeDiscounts.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'touch') return;
    setPointerOrigin(event);
    volumeDiscounts.classList.add('is-pointer-active');
  });

  volumeDiscounts.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'touch') setPointerOrigin(event);
  });

  volumeDiscounts.addEventListener('pointerleave', () => {
    volumeDiscounts.classList.remove('is-pointer-active');
  });
}