import { createCompressTask } from "../engines/transform";
// import { makeAutoObservable } from "mobx";
export const DefaultCompressOption = {
  preview: {
    maxSize: 256,
  },
  resize: {
    method: undefined,
    width: undefined,
    height: undefined,
    short: undefined,
    long: undefined,
  },
  format: {
    target: undefined,
    transparentFill: "#FFFFFF",
  },
  jpeg: {
    quality: 0.7,
  },
  png: {
    colors: 32,
    dithering: 0,
  },
  gif: {
    colors: 128,
    dithering: false,
  },
  avif: {
    quality: 50,
    speed: 8,
  },
};
export class HomeState {
  list = new Map();
  option = DefaultCompressOption;
  tempOption = DefaultCompressOption;
  compareId = null;
  showOption = false;
  constructor() {
    // makeAutoObservable(this);
  }
  reCompress() {
    this.list.forEach((info) => {
      URL.revokeObjectURL(info.compress.src);
      info.compress = undefined;
      createCompressTask(info);
    });
  }
  hasTaskRunning() {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    for (const [_, value] of this.list) {
      if (!value.preview || !value.compress) {
        return true;
      }
    }
    return false;
  }
  /**
   * 获取进度条信息
   * @returns
   */
  getProgressHintInfo() {
    const totalNum = this.list.size;
    let loadedNum = 0;
    let originSize = 0;
    let outputSize = 0;
    /* eslint-disable @typescript-eslint/no-unused-vars */
    for (const [_, info] of this.list) {
      originSize += info.blob.size;
      if (info.compress) {
        loadedNum++;
        outputSize += info.compress.blob.size;
      }
    }
    const percent = Math.ceil((loadedNum * 100) / totalNum);
    const originRate = ((outputSize - originSize) * 100) / originSize;
    const rate = Number(Math.abs(originRate).toFixed(2));
    return {
      totalNum,
      loadedNum,
      originSize,
      outputSize,
      percent,
      rate,
    };
  }
}
export const homeState = new HomeState();
