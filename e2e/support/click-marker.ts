export const clickMarkerScript = () => {
  addEventListener(
    'pointerdown',
    (event) => {
      const ring = document.createElement('div');
      ring.style.cssText = `position:fixed;left:${event.clientX - 18}px;top:${event.clientY - 18}px;width:36px;height:36px;border-radius:50%;border:3px solid #e11d48;background:rgba(225,29,72,.25);pointer-events:none;z-index:2147483647;transition:transform .5s ease-out,opacity .5s ease-out`;
      document.documentElement.appendChild(ring);
      requestAnimationFrame(() => {
        ring.style.transform = 'scale(1.8)';
        ring.style.opacity = '0';
      });
      setTimeout(() => ring.remove(), 600);
    },
    true,
  );
};
