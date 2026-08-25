export function initDevtoolsProtection() {
  if (!import.meta.env.PROD) return;

  const blockEvent = (e: KeyboardEvent | MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  document.addEventListener('contextmenu', (e: MouseEvent) => {
    blockEvent(e);
  });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
      (e.ctrlKey && e.key.toUpperCase() === 'U')
    ) {
      blockEvent(e);
    }
  });

  let devtoolsOpen = false;
  const threshold = 160;

  setInterval(() => {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;

    if (widthDiff > threshold || heightDiff > threshold) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        document.title = 'Chati Solutions - Protected';
        document.body.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#fff;color:#333;">
            <div style="text-align:center;">
              <h1 style="font-size:24px;margin-bottom:12px;">Developer Tools Disabled</h1>
              <p style="font-size:14px;color:#666;">For security reasons, developer tools are not allowed on this platform.</p>
            </div>
          </div>
        `;
      }
    } else {
      devtoolsOpen = false;
    }
  }, 1000);
}
