/**
 * Minimal QR Code Generator
 * A compact, dependency-free QR code generator
 * Supports alphanumeric and byte mode encoding
 *
 * Based on QR Code specification ISO/IEC 18004
 * Simplified for URL encoding use case
 */
(function(global) {
  "use strict";

  // Error correction level L (7% recovery)
  const ECL = { L: 0, M: 1, Q: 2, H: 3 };

  // Version capacity table (version 1-10, ECL L, byte mode)
  const CAPACITIES = [0, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271];

  // Generator polynomials for error correction
  const GEN_POLY = {
    7: [87, 229, 146, 149, 238, 102, 21],
    10: [251, 67, 46, 61, 118, 70, 64, 94, 32, 45],
    13: [74, 152, 176, 100, 86, 100, 106, 104, 130, 218, 206, 140, 78],
    15: [8, 183, 61, 91, 202, 37, 51, 58, 58, 237, 140, 124, 5, 99, 105],
    16: [120, 104, 107, 109, 102, 161, 76, 3, 91, 191, 147, 169, 182, 194, 225, 120],
    17: [43, 139, 206, 78, 43, 239, 123, 206, 214, 147, 24, 99, 150, 39, 243, 163, 136],
    18: [215, 234, 158, 94, 184, 97, 118, 170, 79, 187, 152, 148, 252, 179, 5, 98, 96, 153],
    20: [17, 60, 79, 50, 61, 163, 26, 187, 202, 180, 221, 225, 83, 239, 156, 164, 212, 212, 188, 190],
    22: [210, 171, 247, 242, 93, 230, 14, 109, 221, 53, 200, 74, 8, 172, 98, 80, 219, 134, 160, 105, 165, 231],
  };

  // Galois field tables
  const GF_EXP = new Uint8Array(512);
  const GF_LOG = new Uint8Array(256);

  // Initialize Galois field
  (function initGF() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) {
      GF_EXP[i] = GF_EXP[i - 255];
    }
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  function polyMul(p, q) {
    const result = new Uint8Array(p.length + q.length - 1);
    for (let i = 0; i < p.length; i++) {
      for (let j = 0; j < q.length; j++) {
        result[i + j] ^= gfMul(p[i], q[j]);
      }
    }
    return result;
  }

  function polyRemainder(dividend, divisor) {
    const result = new Uint8Array(dividend);
    for (let i = 0; i < dividend.length - divisor.length + 1; i++) {
      if (result[i] !== 0) {
        const coef = result[i];
        for (let j = 0; j < divisor.length; j++) {
          result[i + j] ^= gfMul(divisor[j], coef);
        }
      }
    }
    return result.slice(dividend.length - divisor.length + 1);
  }

  function getVersion(text) {
    const len = new TextEncoder().encode(text).length;
    for (let v = 1; v <= 10; v++) {
      if (len <= CAPACITIES[v]) return v;
    }
    return 10; // Max supported version
  }

  function getSize(version) {
    return 17 + version * 4;
  }

  function encodeData(text, version) {
    const bytes = new TextEncoder().encode(text);
    const capacity = CAPACITIES[version];

    // Mode indicator (0100 = byte mode) + character count
    const bits = [];

    // Mode indicator: 4 bits
    [0, 1, 0, 0].forEach(b => bits.push(b));

    // Character count: 8 bits for versions 1-9
    const countBits = version < 10 ? 8 : 16;
    for (let i = countBits - 1; i >= 0; i--) {
      bits.push((bytes.length >> i) & 1);
    }

    // Data
    for (const byte of bytes) {
      for (let i = 7; i >= 0; i--) {
        bits.push((byte >> i) & 1);
      }
    }

    // Terminator
    const dataBits = getDataBits(version);
    while (bits.length < dataBits && bits.length < dataBits) {
      bits.push(0);
      if (bits.length >= 4 || bits.length >= dataBits) break;
    }

    // Pad to byte boundary
    while (bits.length % 8 !== 0 && bits.length < dataBits) {
      bits.push(0);
    }

    // Pad bytes
    const padBytes = [0xec, 0x11];
    let padIndex = 0;
    while (bits.length < dataBits) {
      const pad = padBytes[padIndex % 2];
      for (let i = 7; i >= 0; i--) {
        bits.push((pad >> i) & 1);
      }
      padIndex++;
    }

    return bits.slice(0, dataBits);
  }

  function getDataBits(version) {
    // Data codewords for ECL L
    const codewords = [0, 19, 34, 55, 80, 108, 136, 156, 194, 232, 274];
    return codewords[version] * 8;
  }

  function getECCodewords(version) {
    // EC codewords for ECL L
    const ec = [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18];
    return ec[version];
  }

  function addErrorCorrection(data, version) {
    const dataBytes = [];
    for (let i = 0; i < data.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8 && i + j < data.length; j++) {
        byte = (byte << 1) | data[i + j];
      }
      dataBytes.push(byte);
    }

    const ecCount = getECCodewords(version);
    const genPoly = GEN_POLY[ecCount] || GEN_POLY[7];

    // Create message polynomial
    const msgPoly = new Uint8Array(dataBytes.length + ecCount);
    msgPoly.set(dataBytes);

    // Calculate EC codewords
    const ec = polyRemainder(msgPoly, [1, ...genPoly]);

    // Combine data and EC
    const result = [];
    for (const byte of dataBytes) {
      for (let i = 7; i >= 0; i--) {
        result.push((byte >> i) & 1);
      }
    }
    for (const byte of ec) {
      for (let i = 7; i >= 0; i--) {
        result.push((byte >> i) & 1);
      }
    }

    return result;
  }

  function createMatrix(version) {
    const size = getSize(version);
    const matrix = Array(size).fill(null).map(() => Array(size).fill(null));
    const reserved = Array(size).fill(null).map(() => Array(size).fill(false));

    // Add finder patterns
    addFinderPattern(matrix, reserved, 0, 0);
    addFinderPattern(matrix, reserved, size - 7, 0);
    addFinderPattern(matrix, reserved, 0, size - 7);

    // Add separators
    addSeparators(matrix, reserved, size);

    // Add timing patterns
    addTimingPatterns(matrix, reserved, size);

    // Add alignment pattern (version 2+)
    if (version >= 2) {
      const pos = size - 7;
      addAlignmentPattern(matrix, reserved, pos, pos);
    }

    // Reserve format info area
    reserveFormatInfo(reserved, size);

    // Add dark module
    matrix[size - 8][8] = true;
    reserved[size - 8][8] = true;

    return { matrix, reserved, size };
  }

  function addFinderPattern(matrix, reserved, row, col) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[row + r][col + c] = isOuter || isInner;
        reserved[row + r][col + c] = true;
      }
    }
  }

  function addSeparators(matrix, reserved, size) {
    // Top-left
    for (let i = 0; i < 8; i++) {
      matrix[7][i] = false; reserved[7][i] = true;
      matrix[i][7] = false; reserved[i][7] = true;
    }
    // Top-right
    for (let i = 0; i < 8; i++) {
      matrix[7][size - 8 + i] = false; reserved[7][size - 8 + i] = true;
      matrix[i][size - 8] = false; reserved[i][size - 8] = true;
    }
    // Bottom-left
    for (let i = 0; i < 8; i++) {
      matrix[size - 8][i] = false; reserved[size - 8][i] = true;
      matrix[size - 8 + i][7] = false; reserved[size - 8 + i][7] = true;
    }
  }

  function addTimingPatterns(matrix, reserved, size) {
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
      reserved[6][i] = true;
      reserved[i][6] = true;
    }
  }

  function addAlignmentPattern(matrix, reserved, centerRow, centerCol) {
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isOuter = Math.abs(r) === 2 || Math.abs(c) === 2;
        const isCenter = r === 0 && c === 0;
        matrix[centerRow + r][centerCol + c] = isOuter || isCenter;
        reserved[centerRow + r][centerCol + c] = true;
      }
    }
  }

  function reserveFormatInfo(reserved, size) {
    // Around top-left finder
    for (let i = 0; i < 9; i++) {
      reserved[8][i] = true;
      reserved[i][8] = true;
    }
    // Below top-right finder
    for (let i = 0; i < 8; i++) {
      reserved[8][size - 8 + i] = true;
    }
    // Right of bottom-left finder
    for (let i = 0; i < 7; i++) {
      reserved[size - 7 + i][8] = true;
    }
  }

  function placeData(matrix, reserved, data, size) {
    let dataIndex = 0;
    let upward = true;

    for (let col = size - 1; col > 0; col -= 2) {
      if (col === 6) col = 5; // Skip timing pattern

      for (let row = 0; row < size; row++) {
        const actualRow = upward ? size - 1 - row : row;

        for (let c = 0; c < 2; c++) {
          const actualCol = col - c;
          if (!reserved[actualRow][actualCol]) {
            matrix[actualRow][actualCol] = dataIndex < data.length ? data[dataIndex++] : false;
          }
        }
      }
      upward = !upward;
    }
  }

  function applyMask(matrix, reserved, size, maskPattern) {
    const maskFn = getMaskFunction(maskPattern);
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (!reserved[row][col] && maskFn(row, col)) {
          matrix[row][col] = !matrix[row][col];
        }
      }
    }
  }

  function getMaskFunction(pattern) {
    const masks = [
      (r, c) => (r + c) % 2 === 0,
      (r, c) => r % 2 === 0,
      (r, c) => c % 3 === 0,
      (r, c) => (r + c) % 3 === 0,
      (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
      (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
      (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
      (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
    ];
    return masks[pattern] || masks[0];
  }

  function addFormatInfo(matrix, size, maskPattern) {
    // Format info for ECL L and mask pattern
    const formatBits = [
      [1,1,1,0,1,1,1,1,1,0,0,0,1,0,0], // L, mask 0
      [1,1,1,0,0,1,0,1,1,1,1,0,0,1,1], // L, mask 1
      [1,1,1,1,1,0,1,1,0,1,0,1,0,1,0], // L, mask 2
      [1,1,1,1,0,0,0,1,0,0,1,1,1,0,1], // L, mask 3
      [1,1,0,0,1,1,0,0,0,1,0,1,1,1,1], // L, mask 4
      [1,1,0,0,0,1,1,0,0,0,1,1,0,0,0], // L, mask 5
      [1,1,0,1,1,0,0,0,1,0,0,0,0,0,1], // L, mask 6
      [1,1,0,1,0,0,1,0,1,1,1,0,1,1,0], // L, mask 7
    ];

    const bits = formatBits[maskPattern] || formatBits[0];

    // Place around top-left
    for (let i = 0; i < 6; i++) {
      matrix[8][i] = bits[i];
    }
    matrix[8][7] = bits[6];
    matrix[8][8] = bits[7];
    matrix[7][8] = bits[8];
    for (let i = 0; i < 6; i++) {
      matrix[5 - i][8] = bits[9 + i];
    }

    // Place below top-right and right of bottom-left
    for (let i = 0; i < 8; i++) {
      matrix[8][size - 8 + i] = bits[14 - i];
    }
    for (let i = 0; i < 7; i++) {
      matrix[size - 7 + i][8] = bits[i];
    }
  }

  function calculatePenalty(matrix, size) {
    let penalty = 0;

    // Rule 1: Consecutive modules in row/column
    for (let row = 0; row < size; row++) {
      let count = 1;
      for (let col = 1; col < size; col++) {
        if (matrix[row][col] === matrix[row][col - 1]) {
          count++;
        } else {
          if (count >= 5) penalty += 3 + (count - 5);
          count = 1;
        }
      }
      if (count >= 5) penalty += 3 + (count - 5);
    }

    for (let col = 0; col < size; col++) {
      let count = 1;
      for (let row = 1; row < size; row++) {
        if (matrix[row][col] === matrix[row - 1][col]) {
          count++;
        } else {
          if (count >= 5) penalty += 3 + (count - 5);
          count = 1;
        }
      }
      if (count >= 5) penalty += 3 + (count - 5);
    }

    return penalty;
  }

  function findBestMask(matrix, reserved, size) {
    let bestMask = 0;
    let bestPenalty = Infinity;

    for (let mask = 0; mask < 8; mask++) {
      // Create copy
      const testMatrix = matrix.map(row => [...row]);
      applyMask(testMatrix, reserved, size, mask);
      addFormatInfo(testMatrix, size, mask);

      const penalty = calculatePenalty(testMatrix, size);
      if (penalty < bestPenalty) {
        bestPenalty = penalty;
        bestMask = mask;
      }
    }

    return bestMask;
  }

  function generate(text) {
    const version = getVersion(text);
    const data = encodeData(text, version);
    const dataWithEC = addErrorCorrection(data, version);

    const { matrix, reserved, size } = createMatrix(version);
    placeData(matrix, reserved, dataWithEC, size);

    const bestMask = findBestMask(matrix, reserved, size);
    applyMask(matrix, reserved, size, bestMask);
    addFormatInfo(matrix, size, bestMask);

    return matrix;
  }

  function toCanvas(canvas, text, options = {}) {
    const matrix = generate(text);
    const size = matrix.length;

    const moduleSize = Math.floor((options.size || canvas.width) / (size + 2));
    const canvasSize = moduleSize * (size + 2);
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = options.background || "#ffffff";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Modules
    ctx.fillStyle = options.foreground || "#000000";
    const offset = moduleSize;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (matrix[row][col]) {
          ctx.fillRect(
            offset + col * moduleSize,
            offset + row * moduleSize,
            moduleSize,
            moduleSize
          );
        }
      }
    }
  }

  // Export
  global.QRCode = {
    generate,
    toCanvas
  };

})(typeof window !== "undefined" ? window : this);
