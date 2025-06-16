import { CompressedFile } from "./compressed-file.js";


export class Archive {

  static _options = {};

  /**
   * Initialize libarchivejs
   * @param {Object} options
   */
  static init(options = {}) {
    Archive._options = {
      workerUrl: '../dist/worker-bundle.js',
      ...options
    };
    return Archive._options;
  }

  /**
   * Creates new archive instance from browser native File object
   * @param {File} file
   * @param {object} options
   * @returns {Promise<Archive>}
   */
  static open(file, options = null) {
    options = options ||
      Archive._options ||
      Archive.init() && console.warn('Automatically initializing using options: ', Archive._options);
    const arch = new Archive(file, options);
    return arch.open();
  }

  /**
   * Create new archive
   * @param {File} file
   * @param {Object} options
   */
  constructor(file, options) {
    this._worker = new Worker(options.workerUrl);
    this._worker.addEventListener('message', this._workerMsg.bind(this));
    this._callbacks = [];
    this._content = {};
    this._processed = 0;
    this._file = file;
  }

  /**
   * Prepares file for reading
   * @returns {Promise<Archive>} archive instance
   */
  async open() {
    await this._postMessage({ type: 'HELLO' }, (resolve, reject, msg) => {
      if (msg.type === 'READY') {
        resolve();
      }
    });
    return await this._postMessage({ type: 'OPEN', file: this._file }, (resolve, reject, msg) => {
      if (msg.type === 'OPENED') {
        resolve(this);
      }
    });
  }

  /**
   * detect if archive has encrypted data
   * @returns {boolean|null} null if could not be determined
   */
  hasEncryptedData() {
    return this._postMessage({ type: 'CHECK_ENCRYPTION' },
      (resolve, reject, msg) => {
        if (msg.type === 'ENCRYPTION_STATUS') {
          resolve(msg.status);
        }
      }
    );
  }

  /**
   * set password to be used when reading archive
   */
  usePassword(archivePassword) {
    return this._postMessage({ type: 'SET_PASSPHRASE', passphrase: archivePassword },
      (resolve, reject, msg) => {
        if (msg.type === 'PASSPHRASE_STATUS') {
          resolve(msg.status);
        }
      }
    );
  }

  /**
   * Returns object containing directory structure and file information
   * @returns {Promise<object>}
   */
  getFilesObject() {
    if (this._processed > 0) {
      return Promise.resolve().then(() => this._content);
    }
    return this._postMessage({ type: 'LIST_FILES' }, (resolve, reject, msg) => {
      if (msg.type === 'ENTRY') {
        const entry = msg.entry;
        const [target, prop] = this._getProp(this._content, entry.path);
        if (entry.type === 'FILE') {
          target[prop] = new CompressedFile(entry.fileName, entry.size, entry.path, this);
        }
        return true;
      } else if (msg.type === 'END') {
        this._processed = 1;
        resolve(this._cloneContent(this._content));
      }
    });
  }

  getFilesArray() {
    return this.getFilesObject().then((obj) => {
      return this._objectToArray(obj);
    });
  }

  extractSingleFile(target) {
    return this._postMessage({ type: 'EXTRACT_SINGLE_FILE', target: target },
      (resolve, reject, msg) => {
        if (msg.type === 'FILE') {
          const file = new File([msg.entry.fileData], msg.entry.fileName, {
            type: 'application/octet-stream'
          });
          resolve(file);
        }
      }
    );
  }

  /**
   * Returns object containing directory structure and extracted File objects
   * @param {Function} extractCallback
   *
   */
  extractFiles(extractCallback) {
    if (this._processed > 1) {
      return Promise.resolve().then(() => this._content);
    }
    return this._postMessage({ type: 'EXTRACT_FILES' }, (resolve, reject, msg) => {
      if (msg.type === 'ENTRY') {
        const [target, prop] = this._getProp(this._content, msg.entry.path);
        if (msg.entry.type === 'FILE') {
          target[prop] = new File([msg.entry.fileData], msg.entry.fileName, {
            type: 'application/octet-stream'
          });
          if (extractCallback !== undefined) {
            setTimeout(extractCallback.bind(null, {
              file: target[prop],
              path: msg.entry.path,
            }));
          }
        }
        return true;
      } else if (msg.type === 'END') {
        this._processed = 2;
        this._worker.terminate();
        resolve(this._cloneContent(this._content));
      }
    });
  }

  _cloneContent(obj) {
    if (obj instanceof File || obj instanceof CompressedFile || obj === null) return obj;
    const o = {};
    for (const prop of Object.keys(obj)) {
      o[prop] = this._cloneContent(obj[prop]);
    }
    return o;
  }

  _objectToArray(obj, path = '') {
    const files = [];
    for (const key of Object.keys(obj)) {
      if (obj[key] instanceof File || obj[key] instanceof CompressedFile || obj[key] === null) {
        files.push({
          file: obj[key] || key,
          path: path
        });
      } else {
        files.push(...this._objectToArray(obj[key], `${path}${key}/`));
      }
    }
    return files;
  }

  _getProp(obj, path) {
    const parts = path.split('/');
    if (parts[parts.length - 1] === '') parts.pop();
    let cur = obj, prev = null;
    for (const part of parts) {
      cur[part] = cur[part] || {};
      prev = cur;
      cur = cur[part];
    }
    return [prev, parts[parts.length - 1]];
  }

  _postMessage(msg, callback) {
    this._worker.postMessage(msg);
    return new Promise((resolve, reject) => {
      this._callbacks.push(this._msgHandler.bind(this, callback, resolve, reject));
    });
  }

  _msgHandler(callback, resolve, reject, msg) {
    if (msg.type === 'BUSY') {
      reject('worker is busy');
    } else if (msg.type === 'ERROR') {
      reject(msg.error);
    } else {
      return callback(resolve, reject, msg);
    }
  }

  _workerMsg({ data: msg }) {
    const callback = this._callbacks[this._callbacks.length - 1];
    const next = callback(msg);
    if (!next) {
      this._callbacks.pop();
    }
  }

}
