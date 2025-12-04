// Simple decorative animation placeholder
document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('hero-canvas');
  if (!el) return;
  // Create some floating circles for decoration
  for (let i = 0; i < 6; i++) {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.width = `${30 + Math.random() * 40}px`;
    div.style.height = div.style.width;
    div.style.borderRadius = '50%';
    div.style.background = `rgba(255,255,255,${0.08 + Math.random() * 0.12})`;
    div.style.left = `${Math.random() * 80}%`;
    div.style.top = `${10 + Math.random() * 70}%`;
    div.style.transform = `translate(-50%, -50%)`;
    div.style.animation = `floaty ${6 + Math.random() * 6}s ease-in-out ${Math.random()*3}s infinite`;
    el.appendChild(div);
  }
});
