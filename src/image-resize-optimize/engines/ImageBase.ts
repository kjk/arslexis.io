export class ImageBase {
  info;
  option;
  constructor(info, option) {
    this.info = info;
    this.option = option;
  }
  /**
   * Get output image dimension, based on resize param
   * @returns Dimension
   */
  getOutputDimension() {
    const { method, width, height, short, long } = this.option.resize;
    const originDimension = {
      width: this.info.width,
      height: this.info.height,
    };
    if (method === "fitWidth") {
      if (!width) {
        return originDimension;
      }
      const rate = width / this.info.width;
      const newHeight = rate * this.info.height;
      return {
        width: Math.ceil(width),
        height: Math.ceil(newHeight),
      };
    }
    if (method === "fitHeight") {
      if (!height) {
        return originDimension;
      }
      const rate = height / this.info.height;
      const newWidth = rate * this.info.width;
      return {
        width: Math.ceil(newWidth),
        height: Math.ceil(height),
      };
    }
    if (method === "setShort") {
      if (!short) {
        return originDimension;
      }
      let newWidth;
      let newHeight;
      if (this.info.width <= this.info.height) {
        newWidth = short;
        const rate = newWidth / this.info.width;
        newHeight = rate * this.info.height;
      } else {
        newHeight = short;
        const rate = newHeight / this.info.height;
        newWidth = rate * this.info.width;
      }
      return {
        width: Math.ceil(newWidth),
        height: Math.ceil(newHeight),
      };
    }
    if (method === "setLong") {
      if (!long) {
        return originDimension;
      }
      let newWidth;
      let newHeight;
      if (this.info.width >= this.info.height) {
        newWidth = long;
        const rate = newWidth / this.info.width;
        newHeight = rate * this.info.height;
      } else {
        newHeight = long;
        const rate = newHeight / this.info.height;
        newWidth = rate * this.info.width;
      }
      return {
        width: Math.ceil(newWidth),
        height: Math.ceil(newHeight),
      };
    }
    return originDimension;
  }
  /**
   * Return original info when process fails
   * @returns
   */
  failResult() {
    return {
      width: this.info.width,
      height: this.info.height,
      blob: this.info.blob,
      src: URL.createObjectURL(this.info.blob),
    };
  }
  /**
   * Get preview image size via option
   * @returns Dimension
   */
  getPreviewDimension() {
    const maxSize = this.option.preview.maxSize;
    if (Math.max(this.info.width, this.info.height) <= maxSize) {
      return {
        width: this.info.width,
        height: this.info.height,
      };
    }
    let width, height;
    if (this.info.width >= this.info.height) {
      const rate = maxSize / this.info.width;
      width = maxSize;
      height = rate * this.info.height;
    } else {
      const rate = maxSize / this.info.height;
      width = rate * this.info.width;
      height = maxSize;
    }
    return { width: Math.ceil(width), height: Math.ceil(height) };
  }
  /**
   * Get preview from native browser method
   * @returns
   */
  async preview() {
    const { width, height } = this.getPreviewDimension();
    const blob = await this.createBlob(width, height);
    return {
      width,
      height,
      blob,
      src: URL.createObjectURL(blob),
    };
  }
  async createCanvas(width, height) {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");
    const image = await createImageBitmap(this.info.blob);
    context?.drawImage(
      image,
      0,
      0,
      this.info.width,
      this.info.height,
      0,
      0,
      width,
      height,
    );
    image.close();
    return { canvas, context };
  }
  /**
   * create OffscreenCanvas from Blob
   * @param width
   * @param height
   * @param quality
   * @returns
   */
  async createBlob(width, height, quality = 0.6) {
    const { canvas } = await this.createCanvas(width, height);
    const opiton = {
      type: this.info.blob.type,
      quality,
    };
    return canvas.convertToBlob(opiton);
  }
}
