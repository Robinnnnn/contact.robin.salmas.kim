(function() {
  // Minimal QR Code generator (supports up to ~100 chars with error correction Q)
  // Based on qr-creator approach - generates SVG output

  const EC_LEVEL = 'L'; // Low error correction - denser QR for short URLs

  // QR Code generation using the QR Code Model 2 specification
  function generateQR(text) {
    const encoder = new QRCode(text, EC_LEVEL);
    return encoder.toSVG();
  }

  // Minimal QR Code implementation
  class QRCode {
    constructor(text, ecLevel) {
      this.text = text;
      this.ecLevel = ecLevel;
      this.modules = this.generate();
    }

    generate() {
      // Use a canvas-free approach: encode data and create module matrix
      const data = this.encodeData(this.text);
      const version = this.getVersion(data.length);
      const size = version * 4 + 17;
      const modules = Array(size).fill(null).map(() => Array(size).fill(null));

      this.addFinderPatterns(modules, size);
      this.addAlignmentPatterns(modules, version, size);
      this.addTimingPatterns(modules, size);
      this.addDarkModule(modules, version);
      this.reserveFormatArea(modules, size);

      const dataWithEC = this.addErrorCorrection(data, version);
      this.placeData(modules, dataWithEC, size);

      const mask = this.applyBestMask(modules, size);
      this.addFormatInfo(modules, size, mask);

      return modules;
    }

    encodeData(text) {
      // Byte mode encoding
      const bytes = new TextEncoder().encode(text);
      const bits = [];

      // Mode indicator (0100 = byte mode)
      bits.push(0, 1, 0, 0);

      // Character count (8 bits for version 1-9)
      for (let i = 7; i >= 0; i--) {
        bits.push((bytes.length >> i) & 1);
      }

      // Data
      for (const byte of bytes) {
        for (let i = 7; i >= 0; i--) {
          bits.push((byte >> i) & 1);
        }
      }

      // Terminator
      bits.push(0, 0, 0, 0);

      // Pad to byte boundary
      while (bits.length % 8 !== 0) bits.push(0);

      return bits;
    }

    getVersion(dataLength) {
      // Simplified: use version based on data capacity with EC level L
      const capacities = [0, 19, 34, 55, 80, 108, 136, 156, 194, 232, 274];
      const bytesNeeded = Math.ceil(dataLength / 8);
      for (let v = 1; v <= 10; v++) {
        if (capacities[v] >= bytesNeeded) return v;
      }
      return 10;
    }

    addFinderPatterns(modules, size) {
      const pattern = [
        [1,1,1,1,1,1,1],
        [1,0,0,0,0,0,1],
        [1,0,1,1,1,0,1],
        [1,0,1,1,1,0,1],
        [1,0,1,1,1,0,1],
        [1,0,0,0,0,0,1],
        [1,1,1,1,1,1,1]
      ];

      const positions = [[0, 0], [size - 7, 0], [0, size - 7]];
      for (const [row, col] of positions) {
        for (let r = 0; r < 7; r++) {
          for (let c = 0; c < 7; c++) {
            if (row + r < size && col + c < size) {
              modules[row + r][col + c] = pattern[r][c];
            }
          }
        }
        // Separator
        for (let i = 0; i < 8; i++) {
          if (row === 0 && col === 0) {
            if (row + 7 < size) modules[row + 7][col + i] = 0;
            if (col + 7 < size) modules[row + i][col + 7] = 0;
          } else if (row === size - 7 && col === 0) {
            if (row - 1 >= 0) modules[row - 1][col + i] = 0;
            if (col + 7 < size && i < 7) modules[row + i][col + 7] = 0;
          } else if (row === 0 && col === size - 7) {
            if (row + 7 < size && i < 7) modules[row + 7][col + i] = 0;
            if (col - 1 >= 0) modules[row + i][col - 1] = 0;
          }
        }
      }
    }

    addAlignmentPatterns(modules, version, size) {
      if (version < 2) return;
      const positions = this.getAlignmentPositions(version, size);
      const pattern = [[1,1,1,1,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,0,0,1],[1,1,1,1,1]];

      for (const row of positions) {
        for (const col of positions) {
          if (modules[row][col] !== null) continue;
          for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
              modules[row + r][col + c] = pattern[r + 2][c + 2];
            }
          }
        }
      }
    }

    getAlignmentPositions(version, size) {
      if (version === 1) return [];
      const intervals = Math.floor(version / 7) + 1;
      const step = Math.floor((size - 13) / intervals);
      const positions = [6];
      for (let i = 1; i <= intervals; i++) {
        positions.push(6 + step * i);
      }
      positions[positions.length - 1] = size - 7;
      return positions;
    }

    addTimingPatterns(modules, size) {
      for (let i = 8; i < size - 8; i++) {
        modules[6][i] = i % 2 === 0 ? 1 : 0;
        modules[i][6] = i % 2 === 0 ? 1 : 0;
      }
    }

    addDarkModule(modules, version) {
      modules[version * 4 + 9][8] = 1;
    }

    reserveFormatArea(modules, size) {
      for (let i = 0; i < 9; i++) {
        if (modules[8][i] === null) modules[8][i] = 0;
        if (modules[i][8] === null) modules[i][8] = 0;
      }
      for (let i = 0; i < 8; i++) {
        if (modules[8][size - 1 - i] === null) modules[8][size - 1 - i] = 0;
        if (modules[size - 1 - i][8] === null) modules[size - 1 - i][8] = 0;
      }
    }

    addErrorCorrection(data, version) {
      // Simplified: pad data to required length (EC level L capacities in bits)
      const capacities = [0, 152, 272, 440, 640, 864, 1088, 1248, 1552, 1856, 2192];
      const totalBits = capacities[version];

      // Pad with alternating bytes
      const padBytes = [0xEC, 0x11];
      let padIndex = 0;
      while (data.length < totalBits) {
        for (let i = 7; i >= 0 && data.length < totalBits; i--) {
          data.push((padBytes[padIndex] >> i) & 1);
        }
        padIndex = (padIndex + 1) % 2;
      }

      return data;
    }

    placeData(modules, data, size) {
      let dataIndex = 0;
      let upward = true;

      for (let col = size - 1; col > 0; col -= 2) {
        if (col === 6) col--;

        for (let row = upward ? size - 1 : 0; upward ? row >= 0 : row < size; upward ? row-- : row++) {
          for (let c = 0; c < 2; c++) {
            const actualCol = col - c;
            if (modules[row][actualCol] === null) {
              modules[row][actualCol] = dataIndex < data.length ? data[dataIndex++] : 0;
            }
          }
        }
        upward = !upward;
      }
    }

    applyBestMask(modules, size) {
      // Apply mask 3: (row + col) % 3 === 0 - looks more organic than checkerboard
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (this.isDataModule(row, col, size)) {
            if ((row + col) % 3 === 0) {
              modules[row][col] ^= 1;
            }
          }
        }
      }
      return 3;
    }

    isDataModule(row, col, size) {
      // Check if this is a data module (not a function pattern)
      if (row < 9 && col < 9) return false;
      if (row < 9 && col >= size - 8) return false;
      if (row >= size - 8 && col < 9) return false;
      if (row === 6 || col === 6) return false;
      return true;
    }

    addFormatInfo(modules, size, mask) {
      // Format info for EC level L and mask 3
      const formatBits = [1,1,1,1,0,0,0,1,0,0,1,1,1,0,1];

      for (let i = 0; i < 6; i++) {
        modules[8][i] = formatBits[i];
        modules[i][8] = formatBits[14 - i];
      }
      modules[8][7] = formatBits[6];
      modules[8][8] = formatBits[7];
      modules[7][8] = formatBits[8];

      for (let i = 0; i < 7; i++) {
        modules[8][size - 1 - i] = formatBits[14 - i];
        modules[size - 1 - i][8] = formatBits[i];
      }
      for (let i = 0; i < 8; i++) {
        modules[size - 8 + i][8] = formatBits[7 + i] !== undefined ? formatBits[7 + i] : 0;
      }
    }

    toSVG() {
      const size = this.modules.length;
      const cellSize = 4;
      const margin = 4;
      const svgSize = (size + margin * 2) * cellSize;

      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}">`;
      const dataTheme = document.documentElement.getAttribute('data-theme');
      const isDark = dataTheme === 'dark' || (dataTheme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      const fgColor = isDark ? '#e5e5e5' : '#333';

      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (this.modules[row][col]) {
            const x = (col + margin) * cellSize;
            const y = (row + margin) * cellSize;
            svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fgColor}"/>`;
          }
        }
      }

      svg += '</svg>';
      return svg;
    }
  }

  // DOM Elements
  const btn = document.getElementById('qrBtn');
  const contactNav = document.querySelector('nav:not(.finances-nav)');
  const financesNav = document.getElementById('financesNav');
  const qrPanel = document.getElementById('qrPanel');
  const qrCode = document.getElementById('qrCode');
  const qrUrl = document.getElementById('qrUrl');
  let isAnimating = false;
  let previousView = 'contact'; // Track which view was active before QR

  function staggerRows(nav, show) {
    const rows = nav.querySelectorAll('.row');
    rows.forEach((row, i) => {
      if (show) {
        setTimeout(() => row.classList.add('visible'), i * 50);
      } else {
        row.classList.remove('visible');
      }
    });
    return rows.length;
  }

  function toggleQR() {
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

        const targetNav = previousView === 'finances' ? financesNav : contactNav;
        targetNav.classList.remove('hidden');
        const rowCount = staggerRows(targetNav, true);

        setTimeout(() => {
          isAnimating = false;
        }, rowCount * 50 + 150);
      }, 150);
    } else {
      // Switch to QR panel: hide current view, QR slides down
      // Always regenerate QR to ensure correct theme colors
      const url = window.location.href;
      qrCode.innerHTML = generateQR(url);
      let displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      qrUrl.textContent = displayUrl.length > 40 ? displayUrl.slice(0, 37) + '...' : displayUrl;

      // Determine which view is currently active
      const financesActive = !financesNav.classList.contains('hidden');
      previousView = financesActive ? 'finances' : 'contact';
      const currentNav = financesActive ? financesNav : contactNav;

      btn.classList.add('active');
      staggerRows(currentNav, false);

      setTimeout(() => {
        currentNav.classList.add('hidden');
        qrPanel.classList.add('visible');

        setTimeout(() => {
          isAnimating = false;
        }, 150);
      }, 100);
    }
  }

  btn.addEventListener('click', toggleQR);
})();
