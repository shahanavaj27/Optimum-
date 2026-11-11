/**
 * Asset loader & image processor for Optimum Hill Climb.
 * Loads and keys out backgrounds from user uploaded images to produce
 * crisp transparent game sprites for Muscat and the Silver Optimum Coin.
 */

export interface GameAssets {
  isLoaded: boolean;
  optimumCoin: HTMLCanvasElement | null;
  optimumOriginal: HTMLImageElement | null;
  muscatDriver: HTMLCanvasElement | null;
  muscatOriginal: HTMLImageElement | null;
  muscatJeepRef: HTMLImageElement | null;
}

class AssetManager {
  private assets: GameAssets = {
    isLoaded: false,
    optimumCoin: null,
    optimumOriginal: null,
    muscatDriver: null,
    muscatOriginal: null,
    muscatJeepRef: null,
  };

  private loadPromise: Promise<GameAssets> | null = null;

  public load(): Promise<GameAssets> {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise((resolve) => {
      let loadedCount = 0;
      const totalImages = 3;

      const checkComplete = () => {
        loadedCount++;
        if (loadedCount >= totalImages) {
          this.assets.isLoaded = true;
          resolve(this.assets);
        }
      };

      // 1. Optimum Silver Infinity Coin
      const coinImg = new Image();
      coinImg.crossOrigin = 'anonymous';
      coinImg.src = '/assets/aistudio/Screenshot_2026_1111_013101_29e1dc6a.png';
      this.assets.optimumOriginal = coinImg;
      coinImg.onload = () => {
        this.assets.optimumCoin = this.processCoinTransparency(coinImg);
        checkComplete();
      };
      coinImg.onerror = () => {
        console.warn('Could not load Optimum coin image, creating procedural fallback');
        this.assets.optimumCoin = this.createFallbackCoin();
        checkComplete();
      };

      // 2. Muscat Mascot
      const muscatImg = new Image();
      muscatImg.crossOrigin = 'anonymous';
      muscatImg.src = '/assets/aistudio/Screenshot_2026_1110_023154_dc3be18b.png';
      this.assets.muscatOriginal = muscatImg;
      muscatImg.onload = () => {
        this.assets.muscatDriver = this.processMuscatTransparency(muscatImg);
        checkComplete();
      };
      muscatImg.onerror = () => {
        console.warn('Could not load Muscat mascot image, creating procedural fallback');
        this.assets.muscatDriver = this.createFallbackMuscat();
        checkComplete();
      };

      // 3. Muscat in Optimum Offroad Jeep (Hero Reference)
      const heroImg = new Image();
      heroImg.crossOrigin = 'anonymous';
      heroImg.src = '/assets/aistudio/file_00000000d4948211bbf79b968b683932_8a5f2596.png';
      this.assets.muscatJeepRef = heroImg;
      heroImg.onload = () => {
        checkComplete();
      };
      heroImg.onerror = () => {
        console.warn('Could not load Muscat Jeep reference image');
        checkComplete();
      };
    });

    return this.loadPromise;
  }

  public getAssets(): GameAssets {
    return this.assets;
  }

  /**
   * Remove the dark charcoal background of the Optimum Silver Infinity Coin
   * and clean up the inner holes to leave the pure silver metallic logo.
   */
  private processCoinTransparency(img: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Corner background sampling
    const bgR = data[0];
    const bgG = data[1];
    const bgB = data[2];

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Distance from dark background color
      const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
      // Brightness of the pixel
      const brightness = (r + g + b) / 3;

      // Dark background removal threshold
      if (dist < 28 || (brightness < 45 && Math.abs(r - g) < 10 && Math.abs(g - b) < 10)) {
        data[i + 3] = 0; // Transparent
      } else if (dist < 40) {
        // Soft edge antialiasing
        const alpha = (dist - 28) / 12;
        data[i + 3] = Math.round(data[i + 3] * alpha);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  /**
   * Remove dark charcoal background from Muscat mascot image,
   * retaining his crisp white character outline and all internal artwork.
   */
  private processMuscatTransparency(img: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Sample background from corner (top-left)
    const bgR = data[0];
    const bgG = data[1];
    const bgB = data[2];

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
      const brightness = (r + g + b) / 3;

      // The mascot has a clear white outline separating him from the background.
      // Outside the outline, the background is uniform charcoal (brightness < 38).
      if (dist < 25 || (brightness < 38 && Math.abs(r - g) < 8 && Math.abs(g - b) < 8)) {
        data[i + 3] = 0;
      } else if (dist < 36) {
        const alpha = (dist - 25) / 11;
        data[i + 3] = Math.round(data[i + 3] * alpha);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  private createFallbackCoin(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 60;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(35, 30, 20, 0, Math.PI * 2);
    ctx.arc(85, 30, 20, 0, Math.PI * 2);
    ctx.stroke();
    return canvas;
  }

  private createFallbackMuscat(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(50, 50, 40, 0, Math.PI * 2);
    ctx.fill();
    return canvas;
  }
}

export const assetManager = new AssetManager();
