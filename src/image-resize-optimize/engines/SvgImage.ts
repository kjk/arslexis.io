import { Mimes } from "../mimes";
import { ImageBase } from "./ImageBase";
import { optimize } from "svgo/lib/svgo";
/**
 * JPEG/JPG/WEBP is compatible
 */
export class SvgImage extends ImageBase {
  async compress() {
    if (this.info.width === 0 || this.info.height === 0) {
      return this.failResult();
    }
    const data = await this.info.blob.text();
    const result = optimize(data);
    const blob = new Blob([result.data], { type: Mimes.svg });
    return {
      width: this.info.width,
      height: this.info.height,
      blob,
      src: URL.createObjectURL(blob),
    };
  }
  /**
   * We will do nothing for svg preview
   * @returns
   */
  async preview() {
    return this.failResult();
  }
}
