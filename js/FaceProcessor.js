class FaceProcessor {
  // Smart-crops uploaded photo to a square canvas focused on the face.
  // Without an AI model we use heuristic: face is usually in the top 65%
  // center of a portrait photo.
  static processPhoto(file, size = 120) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('Not an image'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const out = document.createElement('canvas');
          out.width = size;
          out.height = size;
          const ctx = out.getContext('2d');

          // Crop: center-x, top 65% of height → square
          const shortSide = Math.min(img.width, img.height * 0.65);
          const srcX = (img.width - shortSide) / 2;
          const srcY = 0;
          const srcSize = shortSide;

          ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, size, size);
          resolve(out);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  static createDefaultFace(size = 120, colorHex = '#FFB347') {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#333';
    const eye = size * 0.12;
    ctx.beginPath();
    ctx.arc(size * 0.33, size * 0.38, eye, 0, Math.PI * 2);
    ctx.arc(size * 0.67, size * 0.38, eye, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(size / 2, size * 0.62, size * 0.18, 0.1, Math.PI - 0.1);
    ctx.fill();
    return canvas;
  }
}
