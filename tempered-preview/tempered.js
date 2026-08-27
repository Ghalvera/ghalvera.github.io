const marks = document.querySelector('.marks');
if (marks) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 192; i++) {
    const span = document.createElement('span');
    span.className = `mark ${i < 186 ? 'parsed' : 'unparsed'}`;
    span.setAttribute('aria-hidden','true');
    frag.appendChild(span);
  }
  marks.appendChild(frag);
}

const instrument = document.querySelector('.instrument');
const paths = [...document.querySelectorAll('.path-held,.path-straw,.path-outrun')];
if (instrument && matchMedia('(pointer:fine)').matches) {
  instrument.addEventListener('pointermove', (event) => {
    const rect = instrument.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width;
    const ny = (event.clientY - rect.top) / rect.height;
    instrument.style.setProperty('--px', `${(nx * 100).toFixed(1)}%`);
    instrument.style.setProperty('--py', `${(ny * 100).toFixed(1)}%`);
  });
  instrument.addEventListener('pointerleave', () => {
    instrument.style.removeProperty('--px');
    instrument.style.removeProperty('--py');
  });
}

const specimen = document.querySelector('.specimen');
const recordMarks = [...document.querySelectorAll('.mark')];
if (specimen && recordMarks.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      recordMarks.forEach((mark, index) => {
        setTimeout(() => mark.classList.remove('dim'), Math.min(index * 3, 650));
      });
      observer.disconnect();
    }
  }, { threshold: .35 });
  recordMarks.forEach(mark => mark.classList.add('dim'));
  observer.observe(specimen);
}

paths.forEach((path) => {
  path.addEventListener('mouseenter', () => {
    paths.forEach(p => { if (p !== path) p.style.opacity = '.14'; });
    path.style.opacity = '1';
  });
  path.addEventListener('mouseleave', () => {
    paths.forEach(p => p.style.opacity = '');
  });
});