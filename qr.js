(function() {
  // QR generation powered by qrcode-generator (vendored in /vendor)
  function generateQR(text) {
    const dataTheme = document.documentElement.getAttribute('data-theme');
    const isDark = dataTheme === 'dark' || (dataTheme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const fgColor = isDark ? '#2a2a2a' : '#333333';

    if (typeof window.qrcode !== 'function') {
      throw new Error('qrcode-generator library not loaded');
    }

    const qr = window.qrcode(0, 'M');
    qr.addData(text, 'Byte');
    qr.make();

    // Create with transparent bg, then enforce fill color + transparent rect for consistent theming
    let svg = qr.createSvgTag({
      cellSize: 4,
      margin: 2,
      scalable: true
    });

    svg = svg
      .replace(/fill="black"/g, `fill="${fgColor}"`)
      .replace(/fill="white"/g, 'fill="none"')
      .replace(/<rect[^>]*fill="none"[^>]*><\/rect>/, '');

    return svg;
  }

  // DOM Elements
  const btn = document.getElementById('qrBtn');
  const contactNav = document.querySelector('nav:not(.finances-nav)');
  const financesNav = document.getElementById('financesNav');
  const financeBtn = document.getElementById('financeBtn');
  const qrPanel = document.getElementById('qrPanel');
  const qrCode = document.getElementById('qrCode');
  const qrUrl = document.getElementById('qrUrl');
  const sigPanel = document.getElementById('signaturePanel');
  const sigSpine = document.getElementById('signatureSpine');
  let isAnimating = false;
  let previousView = 'contact'; // Track which view was active before QR

  function staggerRows(nav, show) {
    const rows = nav.querySelectorAll('.row');
    rows.forEach((row, i) => {
      if (show) {
        setTimeout(() => row.classList.add('visible'), i * 75);
      } else {
        row.classList.remove('visible');
      }
    });
    return rows.length;
  }

  async function toggleQR() {
    if (isAnimating) return;

    const isActive = qrPanel.classList.contains('visible');
    isAnimating = true;

    if (isActive) {
      // Switch back to previous view: QR slides up, rows stagger in
      btn.classList.remove('active');
      qrPanel.classList.remove('visible');
      qrPanel.classList.add('hiding');

      setTimeout(() => {
        qrPanel.classList.remove('hiding');

        if (previousView === 'signature') {
          sigSpine.classList.add('active');
          sigPanel.classList.add('visible');
          setTimeout(() => {
            isAnimating = false;
          }, 150);
        } else {
          const targetNav = previousView === 'finances' ? financesNav : contactNav;
          if (previousView === 'finances') {
            financeBtn.classList.add('active');
          }
          targetNav.classList.remove('hidden');
          const rowCount = staggerRows(targetNav, true);

          setTimeout(() => {
            isAnimating = false;
          }, rowCount * 75 + 150);
        }
      }, 150);
    } else {
      // Switch to QR panel: hide current view, QR slides down
      const url = window.location.href;
      try {
        qrCode.innerHTML = await generateQR(url);
      } catch {
        qrCode.innerHTML = '<div style="font-size:12px;opacity:.75">qr unavailable</div>';
      }

      let displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      qrUrl.textContent = displayUrl.length > 40 ? displayUrl.slice(0, 37) + '...' : displayUrl;

      // Check if signature panel is active
      const sigActive = sigPanel && sigPanel.classList.contains('visible');

      // Determine which view is currently active
      const financesActive = !financesNav.classList.contains('hidden');

      if (sigActive) {
        previousView = 'signature';
        sigSpine.classList.remove('active');
        sigPanel.classList.remove('visible');
        sigPanel.classList.add('hiding');
        setTimeout(() => sigPanel.classList.remove('hiding'), 150);
      } else {
        previousView = financesActive ? 'finances' : 'contact';
        if (financesActive) {
          financeBtn.classList.remove('active');
        }
        const currentNav = financesActive ? financesNav : contactNav;
        staggerRows(currentNav, false);
        setTimeout(() => currentNav.classList.add('hidden'), 100);
      }

      btn.classList.add('active');

      setTimeout(() => {
        qrPanel.classList.add('visible');

        setTimeout(() => {
          isAnimating = false;
        }, 150);
      }, sigActive ? 150 : 100);
    }
  }

  btn.addEventListener('click', () => {
    void toggleQR();
  });
})();
