var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _Matrix_instances, initData_fn, _a, _matrix, _b;
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
function GrowPSPModel(_depths = {}, _lenses = {}, _sewers = {}) {
  return {
    _depths,
    _lenses,
    sewers: _sewers,
    attachLens: (key, l = FlatLens(key), iv) => {
      let _lPrime = { ..._lenses, [key]: l };
      let _dPrime = structuredClone(_depths);
      if (typeof iv !== "undefined") {
        _dPrime = l.put(_depths, iv);
      }
      return GrowPSPModel(_dPrime, _lPrime, _sewers);
    },
    // PSPMutationSewers define our expectations
    mapSewers: (sewers) => {
      return GrowPSPModel(structuredClone(_depths), _lenses, sewers);
    },
    useModel: () => {
      const yuck = {
        dirtySet: /* @__PURE__ */ new Set(),
        markDirty(marks) {
          const foundSewerNames = marks.filter((m) => m in _sewers);
          if (foundSewerNames.length !== marks.length) {
            const missing = marks.filter((m) => !(m in _sewers));
            console.warn(`_markDirty() | A lens is trying to mark a missing sewer: ${missing}.`);
          }
          foundSewerNames.forEach((x) => this.dirtySet.add(x));
        },
        flush() {
          let markables = [];
          for (let dirtyName of this.dirtySet) {
            markables.push(_sewers[dirtyName]);
          }
          for (let { mutator, drainId } of markables) {
            const drain = document.getElementById(drainId);
            if (!drain) {
              console.error(`_markDirty() | Can't update #${drainId}. It is no longer in the document.`);
              continue;
            }
            mutator(_depths, drain);
          }
        }
      };
      return function useActions(actions2) {
        return async ({ type, payload }) => {
          let upset = await actions2[type](payload);
          for (let [key, value] of Object.entries(upset)) {
            const updatedLens = _lenses[key];
            if (!updatedLens) {
              console.error(`useActions() | Can't find lens ${key}.`);
              continue;
            }
            _depths = updatedLens.put(_depths, value, yuck);
          }
          yuck.flush();
        };
      };
    }
  };
}
function FlatLens(k, forOutlets = [k.toString()]) {
  return {
    key: k,
    marks: forOutlets,
    pik(bag) {
      if (!(k in bag)) {
        throw new TypeError(`Missing key ${k} in data bag. Consider adding an initalizer in the call to attachLens(${k}).Known keys: ${Object.keys(bag)}.`);
      }
      return bag[k];
    },
    put(bag, wat, yuck) {
      const _statePrime = { ...bag, ...{ [k]: wat } };
      if (yuck) {
        yuck.markDirty(this.marks);
      }
      return _statePrime;
    }
  };
}
function DivDrain(ownedSlot) {
  const sms = document.createElement("div");
  sms.slot = ownedSlot.name;
  sms.innerHTML = ownedSlot.innerHTML;
  return sms;
}
class PSPHost extends HTMLElement {
  constructor() {
    var __super = (...args) => {
      super(...args);
      __publicField(this, "hostEl");
      return this;
    };
    const _hel = __super();
    this.hostEl = _hel;
  }
  installDrains(sewerModel) {
    if (!this.hostEl.shadowRoot) {
      console.error("PSP host has no shadowroot.");
      return;
    }
    if (!Object.keys(sewerModel.sewers).length) {
      console.warn(`PSPHost: No sewer map when installing drains. Was a sewer map provided to the model?`);
    }
    const slots = [...this.hostEl.shadowRoot.querySelectorAll("slot")];
    for (let sewerMapSlotName of Object.keys(sewerModel.sewers)) {
      let ownedSlot;
      if (!(ownedSlot = slots.find((sl) => sl.name == sewerMapSlotName))) {
        console.warn(this.hostEl);
        throw new RangeError(`installDrains | The host element does not contain a slot for '${sewerMapSlotName}'.`);
      }
      const sms = sewerModel.sewers[sewerMapSlotName].buildDrainElement(ownedSlot);
      sms.id = sewerModel.sewers[sewerMapSlotName].drainId;
      this.hostEl.appendChild(sms);
      const dirtyingLenses = Object.values(sewerModel._lenses).filter((l) => l.marks.includes(sewerMapSlotName));
      if (dirtyingLenses.length > 0) {
        sewerModel.sewers[sewerMapSlotName].mutator(sewerModel._depths, sms);
      }
    }
  }
}
const bitMethods = {
  /**
   * Get the bit of a pixel using a pixel index.
   * This method can only be called on binary images.
   * @memberof Image
   * @instance
   * @param {number} pixel - The pixel index which corresponds to `x * image.width + y`
   * @return {number} 0: bit is unset, 1: bit is set
   */
  getBit(pixel) {
    return this.data[getSlot(pixel)] & 1 << getShift(pixel) ? 1 : 0;
  },
  /**
   * Set the bit of a pixel using a pixel index.
   * This method can only be called on binary images.
   * @memberof Image
   * @instance
   * @param {number} pixel - The pixel index which corresponds to `x * image.width + y`
   */
  setBit(pixel) {
    this.data[getSlot(pixel)] |= 1 << getShift(pixel);
  },
  /**
   * Clear the bit of a pixel using a pixel index.
   * This method can only be called on binary images.
   * @memberof Image
   * @instance
   * @param {number} pixel - The pixel index which corresponds to `x * image.width + y`
   */
  clearBit(pixel) {
    this.data[getSlot(pixel)] &= ~(1 << getShift(pixel));
  },
  /**
   * Toggle (invert) the bit of a pixel using a pixel index.
   * This method can only be called on binary images.
   * @memberof Image
   * @instance
   * @param {number} pixel - The pixel index which corresponds to `x * image.width + y`
   */
  toggleBit(pixel) {
    this.data[getSlot(pixel)] ^= 1 << getShift(pixel);
  },
  /**
   * Get the bit of a pixel using coordinates.
   * This method can only be called on binary images.
   * @memberof Image
   * @instance
   * @param {number} x - x coordinate (0 = left)
   * @param {number} y - y coordinate (0 = top)
   * @return {number} 0: bit is unset, 1: bit is set
   */
  getBitXY(x, y) {
    if (x >= this.width || y >= this.height) return 0;
    return this.getBit(y * this.width + x);
  },
  /**
   * Set the bit of a pixel using coordinates.
   * This method can only be called on binary images.
   * @memberof Image
   * @instance
   * @param {number} x - x coordinate (0 = left)
   * @param {number} y - y coordinate (0 = top)
   */
  setBitXY(x, y) {
    this.setBit(y * this.width + x);
  },
  /**
   * Clear the bit of a pixel using coordinates.
   * @memberof Image
   * @instance
   * @param {number} x - x coordinate (0 = left)
   * @param {number} y - y coordinate (0 = top)
   */
  clearBitXY(x, y) {
    this.clearBit(y * this.width + x);
  },
  /**
   * Toggle (invert) the bit of a pixel using coordinates.
   * @memberof Image
   * @instance
   * @param {number} x - x coordinate (0 = left)
   * @param {number} y - y coordinate (0 = top)
   */
  toggleBitXY(x, y) {
    this.toggleBit(y * this.width + x);
  }
};
function getSlot(pixel) {
  return pixel >> 3;
}
function getShift(pixel) {
  return 7 - (pixel & 7);
}
function setBitMethods(Image2) {
  for (const i2 in bitMethods) {
    Image2.prototype[i2] = bitMethods[i2];
  }
}
function checkProcessable(processName, options = {}) {
  let { bitDepth, alpha, colorModel, components, channels } = options;
  if (typeof processName !== "string" || processName.length === 0) {
    throw new TypeError("processName must be a string");
  }
  if (bitDepth) {
    if (!Array.isArray(bitDepth)) {
      bitDepth = [bitDepth];
    }
    if (!bitDepth.includes(this.bitDepth)) {
      throw new TypeError(
        `The process: ${processName} can only be applied if bit depth is in: ${bitDepth}`
      );
    }
  }
  if (alpha) {
    if (!Array.isArray(alpha)) {
      alpha = [alpha];
    }
    if (!alpha.includes(this.alpha)) {
      throw new TypeError(
        `The process: ${processName} can only be applied if alpha is in: ${alpha}`
      );
    }
  }
  if (colorModel) {
    if (!Array.isArray(colorModel)) {
      colorModel = [colorModel];
    }
    if (!colorModel.includes(this.colorModel)) {
      throw new TypeError(
        `The process: ${processName} can only be applied if color model is in: ${colorModel}`
      );
    }
  }
  if (components) {
    if (!Array.isArray(components)) {
      components = [components];
    }
    if (!components.includes(this.components)) {
      let errorMessage = `The process: ${processName} can only be applied if the number of components is in: ${components}`;
      if (components.length === 1 && components[0] === 1) {
        throw new TypeError(
          `${errorMessage}.\rYou should transform your image using "image.grey()" before applying the algorithm.`
        );
      } else {
        throw new TypeError(errorMessage);
      }
    }
  }
  if (channels) {
    if (!Array.isArray(channels)) {
      channels = [channels];
    }
    if (!channels.includes(this.channels)) {
      throw new TypeError(
        `The process: ${processName} can only be applied if the number of channels is in: ${channels}`
      );
    }
  }
}
function createBlob(parts, properties) {
  parts = parts || [];
  properties = properties || {};
  if (typeof properties === "string") {
    properties = { type: properties };
  }
  try {
    return new Blob(parts, properties);
  } catch (e) {
    if (e.name !== "TypeError") {
      throw e;
    }
    var Builder = typeof BlobBuilder !== "undefined" ? BlobBuilder : typeof MSBlobBuilder !== "undefined" ? MSBlobBuilder : typeof MozBlobBuilder !== "undefined" ? MozBlobBuilder : WebKitBlobBuilder;
    var builder = new Builder();
    for (var i2 = 0; i2 < parts.length; i2 += 1) {
      builder.append(parts[i2]);
    }
    return builder.getBlob(properties.type);
  }
}
function dataURLToBlob(dataURL) {
  var type = dataURL.match(/data:([^;]+)/)[1];
  var base64 = dataURL.replace(/^[^,]+,/, "");
  var buff = binaryStringToArrayBuffer(atob(base64));
  return createBlob([buff], { type });
}
function canvasToBlob(canvas, type, quality) {
  if (typeof canvas.toBlob === "function") {
    return new Promise(function(resolve2) {
      canvas.toBlob(resolve2, type, quality);
    });
  }
  return Promise.resolve(dataURLToBlob(canvas.toDataURL(type, quality)));
}
function binaryStringToArrayBuffer(binary) {
  var length = binary.length;
  var buf = new ArrayBuffer(length);
  var arr = new Uint8Array(buf);
  var i2 = -1;
  while (++i2 < length) {
    arr[i2] = binary.charCodeAt(i2);
  }
  return buf;
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
function getAugmentedNamespace(n) {
  if (n.__esModule) return n;
  var f = n.default;
  if (typeof f == "function") {
    var a = function a2() {
      if (this instanceof a2) {
        return Reflect.construct(f, arguments, this.constructor);
      }
      return f.apply(this, arguments);
    };
    a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, "__esModule", { value: true });
  Object.keys(n).forEach(function(k) {
    var d = Object.getOwnPropertyDescriptor(n, k);
    Object.defineProperty(a, k, d.get ? d : {
      enumerable: true,
      get: function() {
        return n[k];
      }
    });
  });
  return a;
}
(function(scope) {
  if (scope["TextEncoder"] && scope["TextDecoder"]) {
    return false;
  }
  function FastTextEncoder(utfLabel = "utf-8") {
    if (utfLabel !== "utf-8") {
      throw new RangeError(`Failed to construct 'TextEncoder': The encoding label provided ('${utfLabel}') is invalid.`);
    }
  }
  Object.defineProperty(FastTextEncoder.prototype, "encoding", {
    value: "utf-8"
  });
  FastTextEncoder.prototype.encode = function(string, options = { stream: false }) {
    if (options.stream) {
      throw new Error(`Failed to encode: the 'stream' option is unsupported.`);
    }
    let pos = 0;
    const len = string.length;
    let at = 0;
    let tlen = Math.max(32, len + (len >> 1) + 7);
    let target = new Uint8Array(tlen >> 3 << 3);
    while (pos < len) {
      let value = string.charCodeAt(pos++);
      if (value >= 55296 && value <= 56319) {
        if (pos < len) {
          const extra = string.charCodeAt(pos);
          if ((extra & 64512) === 56320) {
            ++pos;
            value = ((value & 1023) << 10) + (extra & 1023) + 65536;
          }
        }
        if (value >= 55296 && value <= 56319) {
          continue;
        }
      }
      if (at + 4 > target.length) {
        tlen += 8;
        tlen *= 1 + pos / string.length * 2;
        tlen = tlen >> 3 << 3;
        const update = new Uint8Array(tlen);
        update.set(target);
        target = update;
      }
      if ((value & 4294967168) === 0) {
        target[at++] = value;
        continue;
      } else if ((value & 4294965248) === 0) {
        target[at++] = value >> 6 & 31 | 192;
      } else if ((value & 4294901760) === 0) {
        target[at++] = value >> 12 & 15 | 224;
        target[at++] = value >> 6 & 63 | 128;
      } else if ((value & 4292870144) === 0) {
        target[at++] = value >> 18 & 7 | 240;
        target[at++] = value >> 12 & 63 | 128;
        target[at++] = value >> 6 & 63 | 128;
      } else {
        continue;
      }
      target[at++] = value & 63 | 128;
    }
    return target.slice(0, at);
  };
  function FastTextDecoder(utfLabel = "utf-8", options = { fatal: false }) {
    if (utfLabel !== "utf-8") {
      throw new RangeError(`Failed to construct 'TextDecoder': The encoding label provided ('${utfLabel}') is invalid.`);
    }
    if (options.fatal) {
      throw new Error(`Failed to construct 'TextDecoder': the 'fatal' option is unsupported.`);
    }
  }
  Object.defineProperty(FastTextDecoder.prototype, "encoding", {
    value: "utf-8"
  });
  Object.defineProperty(FastTextDecoder.prototype, "fatal", { value: false });
  Object.defineProperty(FastTextDecoder.prototype, "ignoreBOM", {
    value: false
  });
  FastTextDecoder.prototype.decode = function(buffer, options = { stream: false }) {
    if (options["stream"]) {
      throw new Error(`Failed to decode: the 'stream' option is unsupported.`);
    }
    const bytes = new Uint8Array(buffer);
    let pos = 0;
    const len = bytes.length;
    const out = [];
    while (pos < len) {
      const byte1 = bytes[pos++];
      if (byte1 === 0) {
        break;
      }
      if ((byte1 & 128) === 0) {
        out.push(byte1);
      } else if ((byte1 & 224) === 192) {
        const byte2 = bytes[pos++] & 63;
        out.push((byte1 & 31) << 6 | byte2);
      } else if ((byte1 & 240) === 224) {
        const byte2 = bytes[pos++] & 63;
        const byte3 = bytes[pos++] & 63;
        out.push((byte1 & 31) << 12 | byte2 << 6 | byte3);
      } else if ((byte1 & 248) === 240) {
        const byte2 = bytes[pos++] & 63;
        const byte3 = bytes[pos++] & 63;
        const byte4 = bytes[pos++] & 63;
        let codepoint = (byte1 & 7) << 18 | byte2 << 12 | byte3 << 6 | byte4;
        if (codepoint > 65535) {
          codepoint -= 65536;
          out.push(codepoint >>> 10 & 1023 | 55296);
          codepoint = 56320 | codepoint & 1023;
        }
        out.push(codepoint);
      } else ;
    }
    return String.fromCharCode.apply(null, out);
  };
  scope["TextEncoder"] = FastTextEncoder;
  scope["TextDecoder"] = FastTextDecoder;
})(typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : void 0);
function decode$5(bytes, encoding = "utf8") {
  const decoder2 = new TextDecoder(encoding);
  return decoder2.decode(bytes);
}
const encoder$1 = new TextEncoder();
function encode$3(str) {
  return encoder$1.encode(str);
}
const defaultByteLength$1 = 1024 * 8;
const hostBigEndian = (() => {
  const array = new Uint8Array(4);
  const view = new Uint32Array(array.buffer);
  return !((view[0] = 1) & array[0]);
})();
const typedArrays = {
  int8: globalThis.Int8Array,
  uint8: globalThis.Uint8Array,
  int16: globalThis.Int16Array,
  uint16: globalThis.Uint16Array,
  int32: globalThis.Int32Array,
  uint32: globalThis.Uint32Array,
  uint64: globalThis.BigUint64Array,
  int64: globalThis.BigInt64Array,
  float32: globalThis.Float32Array,
  float64: globalThis.Float64Array
};
let IOBuffer$4 = class IOBuffer2 {
  /**
   * @param data - The data to construct the IOBuffer with.
   * If data is a number, it will be the new buffer's length<br>
   * If data is `undefined`, the buffer will be initialized with a default length of 8Kb<br>
   * If data is an ArrayBuffer, SharedArrayBuffer, an ArrayBufferView (Typed Array), an IOBuffer instance,
   * or a Node.js Buffer, a view will be created over the underlying ArrayBuffer.
   * @param options
   */
  constructor(data = defaultByteLength$1, options = {}) {
    let dataIsGiven = false;
    if (typeof data === "number") {
      data = new ArrayBuffer(data);
    } else {
      dataIsGiven = true;
      this.lastWrittenByte = data.byteLength;
    }
    const offset = options.offset ? options.offset >>> 0 : 0;
    const byteLength = data.byteLength - offset;
    let dvOffset = offset;
    if (ArrayBuffer.isView(data) || data instanceof IOBuffer2) {
      if (data.byteLength !== data.buffer.byteLength) {
        dvOffset = data.byteOffset + offset;
      }
      data = data.buffer;
    }
    if (dataIsGiven) {
      this.lastWrittenByte = byteLength;
    } else {
      this.lastWrittenByte = 0;
    }
    this.buffer = data;
    this.length = byteLength;
    this.byteLength = byteLength;
    this.byteOffset = dvOffset;
    this.offset = 0;
    this.littleEndian = true;
    this._data = new DataView(this.buffer, dvOffset, byteLength);
    this._mark = 0;
    this._marks = [];
  }
  /**
   * Checks if the memory allocated to the buffer is sufficient to store more
   * bytes after the offset.
   * @param byteLength - The needed memory in bytes.
   * @returns `true` if there is sufficient space and `false` otherwise.
   */
  available(byteLength = 1) {
    return this.offset + byteLength <= this.length;
  }
  /**
   * Check if little-endian mode is used for reading and writing multi-byte
   * values.
   * @returns `true` if little-endian mode is used, `false` otherwise.
   */
  isLittleEndian() {
    return this.littleEndian;
  }
  /**
   * Set little-endian mode for reading and writing multi-byte values.
   */
  setLittleEndian() {
    this.littleEndian = true;
    return this;
  }
  /**
   * Check if big-endian mode is used for reading and writing multi-byte values.
   * @returns `true` if big-endian mode is used, `false` otherwise.
   */
  isBigEndian() {
    return !this.littleEndian;
  }
  /**
   * Switches to big-endian mode for reading and writing multi-byte values.
   */
  setBigEndian() {
    this.littleEndian = false;
    return this;
  }
  /**
   * Move the pointer n bytes forward.
   * @param n - Number of bytes to skip.
   */
  skip(n = 1) {
    this.offset += n;
    return this;
  }
  /**
   * Move the pointer n bytes backward.
   * @param n - Number of bytes to move back.
   */
  back(n = 1) {
    this.offset -= n;
    return this;
  }
  /**
   * Move the pointer to the given offset.
   * @param offset
   */
  seek(offset) {
    this.offset = offset;
    return this;
  }
  /**
   * Store the current pointer offset.
   * @see {@link IOBuffer#reset}
   */
  mark() {
    this._mark = this.offset;
    return this;
  }
  /**
   * Move the pointer back to the last pointer offset set by mark.
   * @see {@link IOBuffer#mark}
   */
  reset() {
    this.offset = this._mark;
    return this;
  }
  /**
   * Push the current pointer offset to the mark stack.
   * @see {@link IOBuffer#popMark}
   */
  pushMark() {
    this._marks.push(this.offset);
    return this;
  }
  /**
   * Pop the last pointer offset from the mark stack, and set the current
   * pointer offset to the popped value.
   * @see {@link IOBuffer#pushMark}
   */
  popMark() {
    const offset = this._marks.pop();
    if (offset === void 0) {
      throw new Error("Mark stack empty");
    }
    this.seek(offset);
    return this;
  }
  /**
   * Move the pointer offset back to 0.
   */
  rewind() {
    this.offset = 0;
    return this;
  }
  /**
   * Make sure the buffer has sufficient memory to write a given byteLength at
   * the current pointer offset.
   * If the buffer's memory is insufficient, this method will create a new
   * buffer (a copy) with a length that is twice (byteLength + current offset).
   * @param byteLength
   */
  ensureAvailable(byteLength = 1) {
    if (!this.available(byteLength)) {
      const lengthNeeded = this.offset + byteLength;
      const newLength = lengthNeeded * 2;
      const newArray2 = new Uint8Array(newLength);
      newArray2.set(new Uint8Array(this.buffer));
      this.buffer = newArray2.buffer;
      this.length = this.byteLength = newLength;
      this._data = new DataView(this.buffer);
    }
    return this;
  }
  /**
   * Read a byte and return false if the byte's value is 0, or true otherwise.
   * Moves pointer forward by one byte.
   */
  readBoolean() {
    return this.readUint8() !== 0;
  }
  /**
   * Read a signed 8-bit integer and move pointer forward by 1 byte.
   */
  readInt8() {
    return this._data.getInt8(this.offset++);
  }
  /**
   * Read an unsigned 8-bit integer and move pointer forward by 1 byte.
   */
  readUint8() {
    return this._data.getUint8(this.offset++);
  }
  /**
   * Alias for {@link IOBuffer#readUint8}.
   */
  readByte() {
    return this.readUint8();
  }
  /**
   * Read `n` bytes and move pointer forward by `n` bytes.
   */
  readBytes(n = 1) {
    return this.readArray(n, "uint8");
  }
  /**
   * Creates an array of corresponding to the type `type` and size `size`.
   * For example type `uint8` will create a `Uint8Array`.
   * @param size - size of the resulting array
   * @param type - number type of elements to read
   */
  readArray(size, type) {
    const bytes = typedArrays[type].BYTES_PER_ELEMENT * size;
    const offset = this.byteOffset + this.offset;
    const slice = this.buffer.slice(offset, offset + bytes);
    if (this.littleEndian === hostBigEndian && type !== "uint8" && type !== "int8") {
      const slice2 = new Uint8Array(this.buffer.slice(offset, offset + bytes));
      slice2.reverse();
      const returnArray2 = new typedArrays[type](slice2.buffer);
      this.offset += bytes;
      returnArray2.reverse();
      return returnArray2;
    }
    const returnArray = new typedArrays[type](slice);
    this.offset += bytes;
    return returnArray;
  }
  /**
   * Read a 16-bit signed integer and move pointer forward by 2 bytes.
   */
  readInt16() {
    const value = this._data.getInt16(this.offset, this.littleEndian);
    this.offset += 2;
    return value;
  }
  /**
   * Read a 16-bit unsigned integer and move pointer forward by 2 bytes.
   */
  readUint16() {
    const value = this._data.getUint16(this.offset, this.littleEndian);
    this.offset += 2;
    return value;
  }
  /**
   * Read a 32-bit signed integer and move pointer forward by 4 bytes.
   */
  readInt32() {
    const value = this._data.getInt32(this.offset, this.littleEndian);
    this.offset += 4;
    return value;
  }
  /**
   * Read a 32-bit unsigned integer and move pointer forward by 4 bytes.
   */
  readUint32() {
    const value = this._data.getUint32(this.offset, this.littleEndian);
    this.offset += 4;
    return value;
  }
  /**
   * Read a 32-bit floating number and move pointer forward by 4 bytes.
   */
  readFloat32() {
    const value = this._data.getFloat32(this.offset, this.littleEndian);
    this.offset += 4;
    return value;
  }
  /**
   * Read a 64-bit floating number and move pointer forward by 8 bytes.
   */
  readFloat64() {
    const value = this._data.getFloat64(this.offset, this.littleEndian);
    this.offset += 8;
    return value;
  }
  /**
   * Read a 64-bit signed integer number and move pointer forward by 8 bytes.
   */
  readBigInt64() {
    const value = this._data.getBigInt64(this.offset, this.littleEndian);
    this.offset += 8;
    return value;
  }
  /**
   * Read a 64-bit unsigned integer number and move pointer forward by 8 bytes.
   */
  readBigUint64() {
    const value = this._data.getBigUint64(this.offset, this.littleEndian);
    this.offset += 8;
    return value;
  }
  /**
   * Read a 1-byte ASCII character and move pointer forward by 1 byte.
   */
  readChar() {
    return String.fromCharCode(this.readInt8());
  }
  /**
   * Read `n` 1-byte ASCII characters and move pointer forward by `n` bytes.
   */
  readChars(n = 1) {
    let result = "";
    for (let i2 = 0; i2 < n; i2++) {
      result += this.readChar();
    }
    return result;
  }
  /**
   * Read the next `n` bytes, return a UTF-8 decoded string and move pointer
   * forward by `n` bytes.
   */
  readUtf8(n = 1) {
    return decode$5(this.readBytes(n));
  }
  /**
   * Read the next `n` bytes, return a string decoded with `encoding` and move pointer
   * forward by `n` bytes.
   * If no encoding is passed, the function is equivalent to @see {@link IOBuffer#readUtf8}
   */
  decodeText(n = 1, encoding = "utf-8") {
    return decode$5(this.readBytes(n), encoding);
  }
  /**
   * Write 0xff if the passed value is truthy, 0x00 otherwise and move pointer
   * forward by 1 byte.
   */
  writeBoolean(value) {
    this.writeUint8(value ? 255 : 0);
    return this;
  }
  /**
   * Write `value` as an 8-bit signed integer and move pointer forward by 1 byte.
   */
  writeInt8(value) {
    this.ensureAvailable(1);
    this._data.setInt8(this.offset++, value);
    this._updateLastWrittenByte();
    return this;
  }
  /**
   * Write `value` as an 8-bit unsigned integer and move pointer forward by 1
   * byte.
   */
  writeUint8(value) {
    this.ensureAvailable(1);
    this._data.setUint8(this.offset++, value);
    this._updateLastWrittenByte();
    return this;
  }
  /**
   * An alias for {@link IOBuffer#writeUint8}.
   */
  writeByte(value) {
    return this.writeUint8(value);
  }
  /**
   * Write all elements of `bytes` as uint8 values and move pointer forward by
   * `bytes.length` bytes.
   */
  writeBytes(bytes) {
    this.ensureAvailable(bytes.length);
    for (let i2 = 0; i2 < bytes.length; i2++) {
      this._data.setUint8(this.offset++, bytes[i2]);
    }
    this._updateLastWrittenByte();
    return this;
  }
  /**
   * Write `value` as a 16-bit signed integer and move pointer forward by 2
   * bytes.
   */
  writeInt16(value) {
    this.ensureAvailable(2);
    this._data.setInt16(this.offset, value, this.littleEndian);
    this.offset += 2;
    this._updateLastWrittenByte();
    return this;
  }
  /**
   * Write `value` as a 16-bit unsigned integer and move pointer forward by 2
   * bytes.
   */
  writeUint16(value) {
    this.ensureAvailable(2);
    this._data.setUint16(this.offset, value, this.littleEndian);
    this.offset += 2;
    this._updateLastWrittenByte();
    return this;
  }
  /**
   * Write `value` as a 32-bit signed integer and move pointer forward by 4
   * bytes.
   */
  writeInt32(value) {
    this.ensureAvailable(4);
    this._data.setInt32(this.offset, value, this.littleEndian);
    this.offset += 4;
    this._updateLastWrittenByte();
    return this;
  }
  /**
   * Write `value` as a 32-bit unsigned integer and move pointer forward by 4
   * bytes.
   */
  writeUint32(value) {
    this.ensureAvailable(4);
    this._data.setUint32(this.offset, value, this.littleEndian);
    this.offset += 4;
    this._updateLastWrittenByte();
    return this;
  }
  /**
   * Write `value` as a 32-bit floating number and move pointer forward by 4
   * bytes.
   */
  writeFloat32(value) {
    this.ensureAvailable(4);
    this._data.setFloat32(this.offset, value, this.littleEndian);
    this.offset += 4;
    this._updateLastWrittenByte();
    return this;
  }
  /**
   * Write `value` as a 64-bit floating number and move pointer forward by 8
   * bytes.
   */
  writeFloat64(value) {
    this.ensureAvailable(8);
    this._data.setFloat64(this.offset, value, this.littleEndian);
    this.offset += 8;
    this._updateLastWrittenByte();
    return this;
  }
  /**
   * Write `value` as a 64-bit signed bigint and move pointer forward by 8
   * bytes.
   */
  writeBigInt64(value) {
    this.ensureAvailable(8);
    this._data.setBigInt64(this.offset, value, this.littleEndian);
    this.offset += 8;
    this._updateLastWrittenByte();
    return this;
  }
  /**
   * Write `value` as a 64-bit unsigned bigint and move pointer forward by 8
   * bytes.
   */
  writeBigUint64(value) {
    this.ensureAvailable(8);
    this._data.setBigUint64(this.offset, value, this.littleEndian);
    this.offset += 8;
    this._updateLastWrittenByte();
    return this;
  }
  /**
   * Write the charCode of `str`'s first character as an 8-bit unsigned integer
   * and move pointer forward by 1 byte.
   */
  writeChar(str) {
    return this.writeUint8(str.charCodeAt(0));
  }
  /**
   * Write the charCodes of all `str`'s characters as 8-bit unsigned integers
   * and move pointer forward by `str.length` bytes.
   */
  writeChars(str) {
    for (let i2 = 0; i2 < str.length; i2++) {
      this.writeUint8(str.charCodeAt(i2));
    }
    return this;
  }
  /**
   * UTF-8 encode and write `str` to the current pointer offset and move pointer
   * forward according to the encoded length.
   */
  writeUtf8(str) {
    return this.writeBytes(encode$3(str));
  }
  /**
   * Export a Uint8Array view of the internal buffer.
   * The view starts at the byte offset and its length
   * is calculated to stop at the last written byte or the original length.
   */
  toArray() {
    return new Uint8Array(this.buffer, this.byteOffset, this.lastWrittenByte);
  }
  /**
   * Update the last written byte offset
   * @private
   */
  _updateLastWrittenByte() {
    if (this.offset > this.lastWrittenByte) {
      this.lastWrittenByte = this.offset;
    }
  }
};
const IOBuffer$5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  IOBuffer: IOBuffer$4
}, Symbol.toStringTag, { value: "Module" }));
const require$$0$4 = /* @__PURE__ */ getAugmentedNamespace(IOBuffer$5);
var constants$4 = {
  BITMAPV5HEADER: {
    LogicalColorSpace: {
      // https://msdn.microsoft.com/en-us/library/cc250396.aspx
      LCS_CALIBRATED_RGB: 0,
      LCS_sRGB: 1934772034,
      // eslint-disable-line camelcase
      LCS_WINDOWS_COLOR_SPACE: 1466527264
    },
    Compression: {
      // https://msdn.microsoft.com/en-us/library/cc250415.aspx
      BI_RGB: 0,
      // No compression
      BI_RLE8: 1,
      BI_RLE4: 2,
      BI_BITFIELDS: 3,
      BI_JPEG: 4,
      BI_PNG: 5,
      BI_CMYK: 11,
      BI_CMYKRLE8: 12,
      BI_CMYKRLE4: 13
    },
    GamutMappingIntent: {
      // https://msdn.microsoft.com/en-us/library/cc250392.aspx
      LCS_GM_ABS_COLORIMETRIC: 8,
      LCS_GM_BUSINESS: 1,
      LCS_GM_GRAPHICS: 2,
      LCS_GM_IMAGES: 4
    }
  }
};
const { IOBuffer: IOBuffer$3 } = require$$0$4;
const constants$3 = constants$4;
const tableLeft = [];
for (let i2 = 0; i2 <= 8; i2++) {
  tableLeft.push(255 << i2);
}
class BMPEncoder extends IOBuffer$3 {
  constructor(data) {
    if (data.bitDepth !== 1) {
      throw new Error("Only bitDepth of 1 is supported");
    }
    if (!data.height || !data.width) {
      throw new Error("ImageData width and height are required");
    }
    super(data.data);
    this.width = data.width;
    this.height = data.height;
    this.bitDepth = data.bitDepth;
    this.channels = data.channels;
    this.components = data.components;
  }
  encode() {
    this.encoded = new IOBuffer$3();
    this.encoded.skip(14);
    this.writeBitmapV5Header();
    this.writeColorTable();
    const offset = this.encoded.offset;
    this.writePixelArray();
    this.encoded.rewind();
    this.writeBitmapFileHeader(offset);
    return this.encoded.toArray();
  }
  writePixelArray() {
    let io = this.encoded;
    const rowSize = Math.floor((this.bitDepth * this.width + 31) / 32) * 4;
    const dataRowSize = Math.ceil(this.bitDepth * this.width / 8);
    const skipSize = rowSize - dataRowSize;
    const bitOverflow = this.bitDepth * this.width % 8;
    const bitSkip = bitOverflow === 0 ? 0 : 8 - bitOverflow;
    const totalBytes = rowSize * this.height;
    let byteA, byteB;
    let offset = 0;
    let relOffset = 0;
    let iOffset = 8;
    io.mark();
    byteB = this.readUint8();
    for (let i2 = this.height - 1; i2 >= 0; i2--) {
      const lastRow = i2 === 0;
      io.reset();
      io.skip(i2 * rowSize);
      for (let j = 0; j < dataRowSize; j++) {
        const lastCol = j === dataRowSize - 1;
        if (relOffset <= bitSkip && lastCol) {
          io.writeByte(byteB << relOffset);
          if ((bitSkip === 0 || bitSkip === relOffset) && !lastRow) {
            byteA = byteB;
            byteB = this.readByte();
          }
        } else if (relOffset === 0) {
          byteA = byteB;
          byteB = this.readUint8();
          io.writeByte(byteA);
        } else {
          byteA = byteB;
          byteB = this.readUint8();
          io.writeByte(
            byteA << relOffset & tableLeft[relOffset] | byteB >> iOffset
          );
        }
        if (lastCol) {
          offset += bitOverflow || 0;
          io.skip(skipSize);
          relOffset = offset % 8;
          iOffset = 8 - relOffset;
        }
      }
    }
    if (rowSize > dataRowSize) {
      io.reset();
      io.skip(totalBytes - 1);
      io.writeUint8(0);
    }
  }
  writeColorTable() {
    this.encoded.writeUint32(0).writeUint32(16777215);
  }
  writeBitmapFileHeader(imageOffset) {
    this.encoded.writeChars("BM").writeInt32(this.encoded.lastWrittenByte).writeUint16(0).writeUint16(0).writeUint32(imageOffset);
  }
  writeBitmapV5Header() {
    const rowSize = Math.floor((this.bitDepth * this.width + 31) / 32) * 4;
    const totalBytes = rowSize * this.height;
    this.encoded.writeUint32(124).writeInt32(this.width).writeInt32(this.height).writeUint16(1).writeUint16(this.bitDepth).writeUint32(constants$3.BITMAPV5HEADER.Compression.BI_RGB).writeUint32(totalBytes).writeInt32(0).writeInt32(0).writeUint32(Math.pow(2, this.bitDepth)).writeUint32(Math.pow(2, this.bitDepth)).writeUint32(4278190080).writeUint32(16711680).writeUint32(65280).writeUint32(255).writeUint32(constants$3.BITMAPV5HEADER.LogicalColorSpace.LCS_sRGB).skip(36).skip(12).writeUint32(constants$3.BITMAPV5HEADER.GamutMappingIntent.LCS_GM_IMAGES).skip(12);
  }
}
var BMPEncoder_1 = BMPEncoder;
const Encoder = BMPEncoder_1;
var encode$2 = function encode2(data) {
  const encoder2 = new Encoder(data);
  return encoder2.encode();
};
/*! pako 2.1.0 https://github.com/nodeca/pako @license (MIT AND Zlib) */
const Z_FIXED$1 = 4;
const Z_BINARY = 0;
const Z_TEXT = 1;
const Z_UNKNOWN$1 = 2;
function zero$1(buf) {
  let len = buf.length;
  while (--len >= 0) {
    buf[len] = 0;
  }
}
const STORED_BLOCK = 0;
const STATIC_TREES = 1;
const DYN_TREES = 2;
const MIN_MATCH$1 = 3;
const MAX_MATCH$1 = 258;
const LENGTH_CODES$1 = 29;
const LITERALS$1 = 256;
const L_CODES$1 = LITERALS$1 + 1 + LENGTH_CODES$1;
const D_CODES$1 = 30;
const BL_CODES$1 = 19;
const HEAP_SIZE$1 = 2 * L_CODES$1 + 1;
const MAX_BITS$1 = 15;
const Buf_size = 16;
const MAX_BL_BITS = 7;
const END_BLOCK = 256;
const REP_3_6 = 16;
const REPZ_3_10 = 17;
const REPZ_11_138 = 18;
const extra_lbits = (
  /* extra bits for each length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0])
);
const extra_dbits = (
  /* extra bits for each distance code */
  new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13])
);
const extra_blbits = (
  /* extra bits for each bit length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7])
);
const bl_order = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
const DIST_CODE_LEN = 512;
const static_ltree = new Array((L_CODES$1 + 2) * 2);
zero$1(static_ltree);
const static_dtree = new Array(D_CODES$1 * 2);
zero$1(static_dtree);
const _dist_code = new Array(DIST_CODE_LEN);
zero$1(_dist_code);
const _length_code = new Array(MAX_MATCH$1 - MIN_MATCH$1 + 1);
zero$1(_length_code);
const base_length = new Array(LENGTH_CODES$1);
zero$1(base_length);
const base_dist = new Array(D_CODES$1);
zero$1(base_dist);
function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
  this.static_tree = static_tree;
  this.extra_bits = extra_bits;
  this.extra_base = extra_base;
  this.elems = elems;
  this.max_length = max_length;
  this.has_stree = static_tree && static_tree.length;
}
let static_l_desc;
let static_d_desc;
let static_bl_desc;
function TreeDesc(dyn_tree, stat_desc) {
  this.dyn_tree = dyn_tree;
  this.max_code = 0;
  this.stat_desc = stat_desc;
}
const d_code = (dist) => {
  return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
};
const put_short = (s, w) => {
  s.pending_buf[s.pending++] = w & 255;
  s.pending_buf[s.pending++] = w >>> 8 & 255;
};
const send_bits = (s, value, length) => {
  if (s.bi_valid > Buf_size - length) {
    s.bi_buf |= value << s.bi_valid & 65535;
    put_short(s, s.bi_buf);
    s.bi_buf = value >> Buf_size - s.bi_valid;
    s.bi_valid += length - Buf_size;
  } else {
    s.bi_buf |= value << s.bi_valid & 65535;
    s.bi_valid += length;
  }
};
const send_code = (s, c, tree) => {
  send_bits(
    s,
    tree[c * 2],
    tree[c * 2 + 1]
    /*.Len*/
  );
};
const bi_reverse = (code, len) => {
  let res = 0;
  do {
    res |= code & 1;
    code >>>= 1;
    res <<= 1;
  } while (--len > 0);
  return res >>> 1;
};
const bi_flush = (s) => {
  if (s.bi_valid === 16) {
    put_short(s, s.bi_buf);
    s.bi_buf = 0;
    s.bi_valid = 0;
  } else if (s.bi_valid >= 8) {
    s.pending_buf[s.pending++] = s.bi_buf & 255;
    s.bi_buf >>= 8;
    s.bi_valid -= 8;
  }
};
const gen_bitlen = (s, desc) => {
  const tree = desc.dyn_tree;
  const max_code = desc.max_code;
  const stree = desc.stat_desc.static_tree;
  const has_stree = desc.stat_desc.has_stree;
  const extra = desc.stat_desc.extra_bits;
  const base = desc.stat_desc.extra_base;
  const max_length = desc.stat_desc.max_length;
  let h;
  let n, m;
  let bits;
  let xbits;
  let f;
  let overflow = 0;
  for (bits = 0; bits <= MAX_BITS$1; bits++) {
    s.bl_count[bits] = 0;
  }
  tree[s.heap[s.heap_max] * 2 + 1] = 0;
  for (h = s.heap_max + 1; h < HEAP_SIZE$1; h++) {
    n = s.heap[h];
    bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
    if (bits > max_length) {
      bits = max_length;
      overflow++;
    }
    tree[n * 2 + 1] = bits;
    if (n > max_code) {
      continue;
    }
    s.bl_count[bits]++;
    xbits = 0;
    if (n >= base) {
      xbits = extra[n - base];
    }
    f = tree[n * 2];
    s.opt_len += f * (bits + xbits);
    if (has_stree) {
      s.static_len += f * (stree[n * 2 + 1] + xbits);
    }
  }
  if (overflow === 0) {
    return;
  }
  do {
    bits = max_length - 1;
    while (s.bl_count[bits] === 0) {
      bits--;
    }
    s.bl_count[bits]--;
    s.bl_count[bits + 1] += 2;
    s.bl_count[max_length]--;
    overflow -= 2;
  } while (overflow > 0);
  for (bits = max_length; bits !== 0; bits--) {
    n = s.bl_count[bits];
    while (n !== 0) {
      m = s.heap[--h];
      if (m > max_code) {
        continue;
      }
      if (tree[m * 2 + 1] !== bits) {
        s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
        tree[m * 2 + 1] = bits;
      }
      n--;
    }
  }
};
const gen_codes = (tree, max_code, bl_count) => {
  const next_code = new Array(MAX_BITS$1 + 1);
  let code = 0;
  let bits;
  let n;
  for (bits = 1; bits <= MAX_BITS$1; bits++) {
    code = code + bl_count[bits - 1] << 1;
    next_code[bits] = code;
  }
  for (n = 0; n <= max_code; n++) {
    let len = tree[n * 2 + 1];
    if (len === 0) {
      continue;
    }
    tree[n * 2] = bi_reverse(next_code[len]++, len);
  }
};
const tr_static_init = () => {
  let n;
  let bits;
  let length;
  let code;
  let dist;
  const bl_count = new Array(MAX_BITS$1 + 1);
  length = 0;
  for (code = 0; code < LENGTH_CODES$1 - 1; code++) {
    base_length[code] = length;
    for (n = 0; n < 1 << extra_lbits[code]; n++) {
      _length_code[length++] = code;
    }
  }
  _length_code[length - 1] = code;
  dist = 0;
  for (code = 0; code < 16; code++) {
    base_dist[code] = dist;
    for (n = 0; n < 1 << extra_dbits[code]; n++) {
      _dist_code[dist++] = code;
    }
  }
  dist >>= 7;
  for (; code < D_CODES$1; code++) {
    base_dist[code] = dist << 7;
    for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
      _dist_code[256 + dist++] = code;
    }
  }
  for (bits = 0; bits <= MAX_BITS$1; bits++) {
    bl_count[bits] = 0;
  }
  n = 0;
  while (n <= 143) {
    static_ltree[n * 2 + 1] = 8;
    n++;
    bl_count[8]++;
  }
  while (n <= 255) {
    static_ltree[n * 2 + 1] = 9;
    n++;
    bl_count[9]++;
  }
  while (n <= 279) {
    static_ltree[n * 2 + 1] = 7;
    n++;
    bl_count[7]++;
  }
  while (n <= 287) {
    static_ltree[n * 2 + 1] = 8;
    n++;
    bl_count[8]++;
  }
  gen_codes(static_ltree, L_CODES$1 + 1, bl_count);
  for (n = 0; n < D_CODES$1; n++) {
    static_dtree[n * 2 + 1] = 5;
    static_dtree[n * 2] = bi_reverse(n, 5);
  }
  static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS$1 + 1, L_CODES$1, MAX_BITS$1);
  static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES$1, MAX_BITS$1);
  static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES$1, MAX_BL_BITS);
};
const init_block = (s) => {
  let n;
  for (n = 0; n < L_CODES$1; n++) {
    s.dyn_ltree[n * 2] = 0;
  }
  for (n = 0; n < D_CODES$1; n++) {
    s.dyn_dtree[n * 2] = 0;
  }
  for (n = 0; n < BL_CODES$1; n++) {
    s.bl_tree[n * 2] = 0;
  }
  s.dyn_ltree[END_BLOCK * 2] = 1;
  s.opt_len = s.static_len = 0;
  s.sym_next = s.matches = 0;
};
const bi_windup = (s) => {
  if (s.bi_valid > 8) {
    put_short(s, s.bi_buf);
  } else if (s.bi_valid > 0) {
    s.pending_buf[s.pending++] = s.bi_buf;
  }
  s.bi_buf = 0;
  s.bi_valid = 0;
};
const smaller = (tree, n, m, depth) => {
  const _n2 = n * 2;
  const _m2 = m * 2;
  return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
};
const pqdownheap = (s, tree, k) => {
  const v = s.heap[k];
  let j = k << 1;
  while (j <= s.heap_len) {
    if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
      j++;
    }
    if (smaller(tree, v, s.heap[j], s.depth)) {
      break;
    }
    s.heap[k] = s.heap[j];
    k = j;
    j <<= 1;
  }
  s.heap[k] = v;
};
const compress_block = (s, ltree, dtree) => {
  let dist;
  let lc;
  let sx = 0;
  let code;
  let extra;
  if (s.sym_next !== 0) {
    do {
      dist = s.pending_buf[s.sym_buf + sx++] & 255;
      dist += (s.pending_buf[s.sym_buf + sx++] & 255) << 8;
      lc = s.pending_buf[s.sym_buf + sx++];
      if (dist === 0) {
        send_code(s, lc, ltree);
      } else {
        code = _length_code[lc];
        send_code(s, code + LITERALS$1 + 1, ltree);
        extra = extra_lbits[code];
        if (extra !== 0) {
          lc -= base_length[code];
          send_bits(s, lc, extra);
        }
        dist--;
        code = d_code(dist);
        send_code(s, code, dtree);
        extra = extra_dbits[code];
        if (extra !== 0) {
          dist -= base_dist[code];
          send_bits(s, dist, extra);
        }
      }
    } while (sx < s.sym_next);
  }
  send_code(s, END_BLOCK, ltree);
};
const build_tree = (s, desc) => {
  const tree = desc.dyn_tree;
  const stree = desc.stat_desc.static_tree;
  const has_stree = desc.stat_desc.has_stree;
  const elems = desc.stat_desc.elems;
  let n, m;
  let max_code = -1;
  let node;
  s.heap_len = 0;
  s.heap_max = HEAP_SIZE$1;
  for (n = 0; n < elems; n++) {
    if (tree[n * 2] !== 0) {
      s.heap[++s.heap_len] = max_code = n;
      s.depth[n] = 0;
    } else {
      tree[n * 2 + 1] = 0;
    }
  }
  while (s.heap_len < 2) {
    node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
    tree[node * 2] = 1;
    s.depth[node] = 0;
    s.opt_len--;
    if (has_stree) {
      s.static_len -= stree[node * 2 + 1];
    }
  }
  desc.max_code = max_code;
  for (n = s.heap_len >> 1; n >= 1; n--) {
    pqdownheap(s, tree, n);
  }
  node = elems;
  do {
    n = s.heap[
      1
      /*SMALLEST*/
    ];
    s.heap[
      1
      /*SMALLEST*/
    ] = s.heap[s.heap_len--];
    pqdownheap(
      s,
      tree,
      1
      /*SMALLEST*/
    );
    m = s.heap[
      1
      /*SMALLEST*/
    ];
    s.heap[--s.heap_max] = n;
    s.heap[--s.heap_max] = m;
    tree[node * 2] = tree[n * 2] + tree[m * 2];
    s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
    tree[n * 2 + 1] = tree[m * 2 + 1] = node;
    s.heap[
      1
      /*SMALLEST*/
    ] = node++;
    pqdownheap(
      s,
      tree,
      1
      /*SMALLEST*/
    );
  } while (s.heap_len >= 2);
  s.heap[--s.heap_max] = s.heap[
    1
    /*SMALLEST*/
  ];
  gen_bitlen(s, desc);
  gen_codes(tree, max_code, s.bl_count);
};
const scan_tree = (s, tree, max_code) => {
  let n;
  let prevlen = -1;
  let curlen;
  let nextlen = tree[0 * 2 + 1];
  let count = 0;
  let max_count = 7;
  let min_count = 4;
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  tree[(max_code + 1) * 2 + 1] = 65535;
  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n + 1) * 2 + 1];
    if (++count < max_count && curlen === nextlen) {
      continue;
    } else if (count < min_count) {
      s.bl_tree[curlen * 2] += count;
    } else if (curlen !== 0) {
      if (curlen !== prevlen) {
        s.bl_tree[curlen * 2]++;
      }
      s.bl_tree[REP_3_6 * 2]++;
    } else if (count <= 10) {
      s.bl_tree[REPZ_3_10 * 2]++;
    } else {
      s.bl_tree[REPZ_11_138 * 2]++;
    }
    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;
    } else {
      max_count = 7;
      min_count = 4;
    }
  }
};
const send_tree = (s, tree, max_code) => {
  let n;
  let prevlen = -1;
  let curlen;
  let nextlen = tree[0 * 2 + 1];
  let count = 0;
  let max_count = 7;
  let min_count = 4;
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n + 1) * 2 + 1];
    if (++count < max_count && curlen === nextlen) {
      continue;
    } else if (count < min_count) {
      do {
        send_code(s, curlen, s.bl_tree);
      } while (--count !== 0);
    } else if (curlen !== 0) {
      if (curlen !== prevlen) {
        send_code(s, curlen, s.bl_tree);
        count--;
      }
      send_code(s, REP_3_6, s.bl_tree);
      send_bits(s, count - 3, 2);
    } else if (count <= 10) {
      send_code(s, REPZ_3_10, s.bl_tree);
      send_bits(s, count - 3, 3);
    } else {
      send_code(s, REPZ_11_138, s.bl_tree);
      send_bits(s, count - 11, 7);
    }
    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;
    } else {
      max_count = 7;
      min_count = 4;
    }
  }
};
const build_bl_tree = (s) => {
  let max_blindex;
  scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
  scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
  build_tree(s, s.bl_desc);
  for (max_blindex = BL_CODES$1 - 1; max_blindex >= 3; max_blindex--) {
    if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
      break;
    }
  }
  s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
  return max_blindex;
};
const send_all_trees = (s, lcodes, dcodes, blcodes) => {
  let rank2;
  send_bits(s, lcodes - 257, 5);
  send_bits(s, dcodes - 1, 5);
  send_bits(s, blcodes - 4, 4);
  for (rank2 = 0; rank2 < blcodes; rank2++) {
    send_bits(s, s.bl_tree[bl_order[rank2] * 2 + 1], 3);
  }
  send_tree(s, s.dyn_ltree, lcodes - 1);
  send_tree(s, s.dyn_dtree, dcodes - 1);
};
const detect_data_type = (s) => {
  let block_mask = 4093624447;
  let n;
  for (n = 0; n <= 31; n++, block_mask >>>= 1) {
    if (block_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
      return Z_BINARY;
    }
  }
  if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
    return Z_TEXT;
  }
  for (n = 32; n < LITERALS$1; n++) {
    if (s.dyn_ltree[n * 2] !== 0) {
      return Z_TEXT;
    }
  }
  return Z_BINARY;
};
let static_init_done = false;
const _tr_init$1 = (s) => {
  if (!static_init_done) {
    tr_static_init();
    static_init_done = true;
  }
  s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
  s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
  s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
  s.bi_buf = 0;
  s.bi_valid = 0;
  init_block(s);
};
const _tr_stored_block$1 = (s, buf, stored_len, last) => {
  send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
  bi_windup(s);
  put_short(s, stored_len);
  put_short(s, ~stored_len);
  if (stored_len) {
    s.pending_buf.set(s.window.subarray(buf, buf + stored_len), s.pending);
  }
  s.pending += stored_len;
};
const _tr_align$1 = (s) => {
  send_bits(s, STATIC_TREES << 1, 3);
  send_code(s, END_BLOCK, static_ltree);
  bi_flush(s);
};
const _tr_flush_block$1 = (s, buf, stored_len, last) => {
  let opt_lenb, static_lenb;
  let max_blindex = 0;
  if (s.level > 0) {
    if (s.strm.data_type === Z_UNKNOWN$1) {
      s.strm.data_type = detect_data_type(s);
    }
    build_tree(s, s.l_desc);
    build_tree(s, s.d_desc);
    max_blindex = build_bl_tree(s);
    opt_lenb = s.opt_len + 3 + 7 >>> 3;
    static_lenb = s.static_len + 3 + 7 >>> 3;
    if (static_lenb <= opt_lenb) {
      opt_lenb = static_lenb;
    }
  } else {
    opt_lenb = static_lenb = stored_len + 5;
  }
  if (stored_len + 4 <= opt_lenb && buf !== -1) {
    _tr_stored_block$1(s, buf, stored_len, last);
  } else if (s.strategy === Z_FIXED$1 || static_lenb === opt_lenb) {
    send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
    compress_block(s, static_ltree, static_dtree);
  } else {
    send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
    send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
    compress_block(s, s.dyn_ltree, s.dyn_dtree);
  }
  init_block(s);
  if (last) {
    bi_windup(s);
  }
};
const _tr_tally$1 = (s, dist, lc) => {
  s.pending_buf[s.sym_buf + s.sym_next++] = dist;
  s.pending_buf[s.sym_buf + s.sym_next++] = dist >> 8;
  s.pending_buf[s.sym_buf + s.sym_next++] = lc;
  if (dist === 0) {
    s.dyn_ltree[lc * 2]++;
  } else {
    s.matches++;
    dist--;
    s.dyn_ltree[(_length_code[lc] + LITERALS$1 + 1) * 2]++;
    s.dyn_dtree[d_code(dist) * 2]++;
  }
  return s.sym_next === s.sym_end;
};
var _tr_init_1 = _tr_init$1;
var _tr_stored_block_1 = _tr_stored_block$1;
var _tr_flush_block_1 = _tr_flush_block$1;
var _tr_tally_1 = _tr_tally$1;
var _tr_align_1 = _tr_align$1;
var trees = {
  _tr_init: _tr_init_1,
  _tr_stored_block: _tr_stored_block_1,
  _tr_flush_block: _tr_flush_block_1,
  _tr_tally: _tr_tally_1,
  _tr_align: _tr_align_1
};
const adler32 = (adler, buf, len, pos) => {
  let s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
  while (len !== 0) {
    n = len > 2e3 ? 2e3 : len;
    len -= n;
    do {
      s1 = s1 + buf[pos++] | 0;
      s2 = s2 + s1 | 0;
    } while (--n);
    s1 %= 65521;
    s2 %= 65521;
  }
  return s1 | s2 << 16 | 0;
};
var adler32_1 = adler32;
const makeTable = () => {
  let c, table = [];
  for (var n = 0; n < 256; n++) {
    c = n;
    for (var k = 0; k < 8; k++) {
      c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    }
    table[n] = c;
  }
  return table;
};
const crcTable$1 = new Uint32Array(makeTable());
const crc32 = (crc2, buf, len, pos) => {
  const t = crcTable$1;
  const end = pos + len;
  crc2 ^= -1;
  for (let i2 = pos; i2 < end; i2++) {
    crc2 = crc2 >>> 8 ^ t[(crc2 ^ buf[i2]) & 255];
  }
  return crc2 ^ -1;
};
var crc32_1 = crc32;
var messages = {
  2: "need dictionary",
  /* Z_NEED_DICT       2  */
  1: "stream end",
  /* Z_STREAM_END      1  */
  0: "",
  /* Z_OK              0  */
  "-1": "file error",
  /* Z_ERRNO         (-1) */
  "-2": "stream error",
  /* Z_STREAM_ERROR  (-2) */
  "-3": "data error",
  /* Z_DATA_ERROR    (-3) */
  "-4": "insufficient memory",
  /* Z_MEM_ERROR     (-4) */
  "-5": "buffer error",
  /* Z_BUF_ERROR     (-5) */
  "-6": "incompatible version"
  /* Z_VERSION_ERROR (-6) */
};
var constants$2 = {
  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH: 0,
  Z_PARTIAL_FLUSH: 1,
  Z_SYNC_FLUSH: 2,
  Z_FULL_FLUSH: 3,
  Z_FINISH: 4,
  Z_BLOCK: 5,
  Z_TREES: 6,
  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK: 0,
  Z_STREAM_END: 1,
  Z_NEED_DICT: 2,
  Z_ERRNO: -1,
  Z_STREAM_ERROR: -2,
  Z_DATA_ERROR: -3,
  Z_MEM_ERROR: -4,
  Z_BUF_ERROR: -5,
  //Z_VERSION_ERROR: -6,
  /* compression levels */
  Z_NO_COMPRESSION: 0,
  Z_BEST_SPEED: 1,
  Z_BEST_COMPRESSION: 9,
  Z_DEFAULT_COMPRESSION: -1,
  Z_FILTERED: 1,
  Z_HUFFMAN_ONLY: 2,
  Z_RLE: 3,
  Z_FIXED: 4,
  Z_DEFAULT_STRATEGY: 0,
  /* Possible values of the data_type field (though see inflate()) */
  Z_BINARY: 0,
  Z_TEXT: 1,
  //Z_ASCII:                1, // = Z_TEXT (deprecated)
  Z_UNKNOWN: 2,
  /* The deflate compression method */
  Z_DEFLATED: 8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};
const { _tr_init, _tr_stored_block, _tr_flush_block, _tr_tally, _tr_align } = trees;
const {
  Z_NO_FLUSH: Z_NO_FLUSH$2,
  Z_PARTIAL_FLUSH,
  Z_FULL_FLUSH: Z_FULL_FLUSH$1,
  Z_FINISH: Z_FINISH$3,
  Z_BLOCK: Z_BLOCK$1,
  Z_OK: Z_OK$3,
  Z_STREAM_END: Z_STREAM_END$3,
  Z_STREAM_ERROR: Z_STREAM_ERROR$2,
  Z_DATA_ERROR: Z_DATA_ERROR$2,
  Z_BUF_ERROR: Z_BUF_ERROR$1,
  Z_DEFAULT_COMPRESSION: Z_DEFAULT_COMPRESSION$1,
  Z_FILTERED,
  Z_HUFFMAN_ONLY,
  Z_RLE,
  Z_FIXED,
  Z_DEFAULT_STRATEGY: Z_DEFAULT_STRATEGY$1,
  Z_UNKNOWN,
  Z_DEFLATED: Z_DEFLATED$2
} = constants$2;
const MAX_MEM_LEVEL = 9;
const MAX_WBITS$1 = 15;
const DEF_MEM_LEVEL = 8;
const LENGTH_CODES = 29;
const LITERALS = 256;
const L_CODES = LITERALS + 1 + LENGTH_CODES;
const D_CODES = 30;
const BL_CODES = 19;
const HEAP_SIZE = 2 * L_CODES + 1;
const MAX_BITS = 15;
const MIN_MATCH = 3;
const MAX_MATCH = 258;
const MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
const PRESET_DICT = 32;
const INIT_STATE = 42;
const GZIP_STATE = 57;
const EXTRA_STATE = 69;
const NAME_STATE = 73;
const COMMENT_STATE = 91;
const HCRC_STATE = 103;
const BUSY_STATE = 113;
const FINISH_STATE = 666;
const BS_NEED_MORE = 1;
const BS_BLOCK_DONE = 2;
const BS_FINISH_STARTED = 3;
const BS_FINISH_DONE = 4;
const OS_CODE = 3;
const err = (strm, errorCode) => {
  strm.msg = messages[errorCode];
  return errorCode;
};
const rank = (f) => {
  return f * 2 - (f > 4 ? 9 : 0);
};
const zero = (buf) => {
  let len = buf.length;
  while (--len >= 0) {
    buf[len] = 0;
  }
};
const slide_hash = (s) => {
  let n, m;
  let p;
  let wsize = s.w_size;
  n = s.hash_size;
  p = n;
  do {
    m = s.head[--p];
    s.head[p] = m >= wsize ? m - wsize : 0;
  } while (--n);
  n = wsize;
  p = n;
  do {
    m = s.prev[--p];
    s.prev[p] = m >= wsize ? m - wsize : 0;
  } while (--n);
};
let HASH_ZLIB = (s, prev, data) => (prev << s.hash_shift ^ data) & s.hash_mask;
let HASH = HASH_ZLIB;
const flush_pending = (strm) => {
  const s = strm.state;
  let len = s.pending;
  if (len > strm.avail_out) {
    len = strm.avail_out;
  }
  if (len === 0) {
    return;
  }
  strm.output.set(s.pending_buf.subarray(s.pending_out, s.pending_out + len), strm.next_out);
  strm.next_out += len;
  s.pending_out += len;
  strm.total_out += len;
  strm.avail_out -= len;
  s.pending -= len;
  if (s.pending === 0) {
    s.pending_out = 0;
  }
};
const flush_block_only = (s, last) => {
  _tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
  s.block_start = s.strstart;
  flush_pending(s.strm);
};
const put_byte = (s, b) => {
  s.pending_buf[s.pending++] = b;
};
const putShortMSB = (s, b) => {
  s.pending_buf[s.pending++] = b >>> 8 & 255;
  s.pending_buf[s.pending++] = b & 255;
};
const read_buf = (strm, buf, start, size) => {
  let len = strm.avail_in;
  if (len > size) {
    len = size;
  }
  if (len === 0) {
    return 0;
  }
  strm.avail_in -= len;
  buf.set(strm.input.subarray(strm.next_in, strm.next_in + len), start);
  if (strm.state.wrap === 1) {
    strm.adler = adler32_1(strm.adler, buf, len, start);
  } else if (strm.state.wrap === 2) {
    strm.adler = crc32_1(strm.adler, buf, len, start);
  }
  strm.next_in += len;
  strm.total_in += len;
  return len;
};
const longest_match = (s, cur_match) => {
  let chain_length = s.max_chain_length;
  let scan = s.strstart;
  let match;
  let len;
  let best_len = s.prev_length;
  let nice_match = s.nice_match;
  const limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
  const _win = s.window;
  const wmask = s.w_mask;
  const prev = s.prev;
  const strend = s.strstart + MAX_MATCH;
  let scan_end1 = _win[scan + best_len - 1];
  let scan_end = _win[scan + best_len];
  if (s.prev_length >= s.good_match) {
    chain_length >>= 2;
  }
  if (nice_match > s.lookahead) {
    nice_match = s.lookahead;
  }
  do {
    match = cur_match;
    if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
      continue;
    }
    scan += 2;
    match++;
    do {
    } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
    len = MAX_MATCH - (strend - scan);
    scan = strend - MAX_MATCH;
    if (len > best_len) {
      s.match_start = cur_match;
      best_len = len;
      if (len >= nice_match) {
        break;
      }
      scan_end1 = _win[scan + best_len - 1];
      scan_end = _win[scan + best_len];
    }
  } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
  if (best_len <= s.lookahead) {
    return best_len;
  }
  return s.lookahead;
};
const fill_window = (s) => {
  const _w_size = s.w_size;
  let n, more, str;
  do {
    more = s.window_size - s.lookahead - s.strstart;
    if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
      s.window.set(s.window.subarray(_w_size, _w_size + _w_size - more), 0);
      s.match_start -= _w_size;
      s.strstart -= _w_size;
      s.block_start -= _w_size;
      if (s.insert > s.strstart) {
        s.insert = s.strstart;
      }
      slide_hash(s);
      more += _w_size;
    }
    if (s.strm.avail_in === 0) {
      break;
    }
    n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
    s.lookahead += n;
    if (s.lookahead + s.insert >= MIN_MATCH) {
      str = s.strstart - s.insert;
      s.ins_h = s.window[str];
      s.ins_h = HASH(s, s.ins_h, s.window[str + 1]);
      while (s.insert) {
        s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
        s.prev[str & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = str;
        str++;
        s.insert--;
        if (s.lookahead + s.insert < MIN_MATCH) {
          break;
        }
      }
    }
  } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
};
const deflate_stored = (s, flush) => {
  let min_block = s.pending_buf_size - 5 > s.w_size ? s.w_size : s.pending_buf_size - 5;
  let len, left, have, last = 0;
  let used = s.strm.avail_in;
  do {
    len = 65535;
    have = s.bi_valid + 42 >> 3;
    if (s.strm.avail_out < have) {
      break;
    }
    have = s.strm.avail_out - have;
    left = s.strstart - s.block_start;
    if (len > left + s.strm.avail_in) {
      len = left + s.strm.avail_in;
    }
    if (len > have) {
      len = have;
    }
    if (len < min_block && (len === 0 && flush !== Z_FINISH$3 || flush === Z_NO_FLUSH$2 || len !== left + s.strm.avail_in)) {
      break;
    }
    last = flush === Z_FINISH$3 && len === left + s.strm.avail_in ? 1 : 0;
    _tr_stored_block(s, 0, 0, last);
    s.pending_buf[s.pending - 4] = len;
    s.pending_buf[s.pending - 3] = len >> 8;
    s.pending_buf[s.pending - 2] = ~len;
    s.pending_buf[s.pending - 1] = ~len >> 8;
    flush_pending(s.strm);
    if (left) {
      if (left > len) {
        left = len;
      }
      s.strm.output.set(s.window.subarray(s.block_start, s.block_start + left), s.strm.next_out);
      s.strm.next_out += left;
      s.strm.avail_out -= left;
      s.strm.total_out += left;
      s.block_start += left;
      len -= left;
    }
    if (len) {
      read_buf(s.strm, s.strm.output, s.strm.next_out, len);
      s.strm.next_out += len;
      s.strm.avail_out -= len;
      s.strm.total_out += len;
    }
  } while (last === 0);
  used -= s.strm.avail_in;
  if (used) {
    if (used >= s.w_size) {
      s.matches = 2;
      s.window.set(s.strm.input.subarray(s.strm.next_in - s.w_size, s.strm.next_in), 0);
      s.strstart = s.w_size;
      s.insert = s.strstart;
    } else {
      if (s.window_size - s.strstart <= used) {
        s.strstart -= s.w_size;
        s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
        if (s.matches < 2) {
          s.matches++;
        }
        if (s.insert > s.strstart) {
          s.insert = s.strstart;
        }
      }
      s.window.set(s.strm.input.subarray(s.strm.next_in - used, s.strm.next_in), s.strstart);
      s.strstart += used;
      s.insert += used > s.w_size - s.insert ? s.w_size - s.insert : used;
    }
    s.block_start = s.strstart;
  }
  if (s.high_water < s.strstart) {
    s.high_water = s.strstart;
  }
  if (last) {
    return BS_FINISH_DONE;
  }
  if (flush !== Z_NO_FLUSH$2 && flush !== Z_FINISH$3 && s.strm.avail_in === 0 && s.strstart === s.block_start) {
    return BS_BLOCK_DONE;
  }
  have = s.window_size - s.strstart;
  if (s.strm.avail_in > have && s.block_start >= s.w_size) {
    s.block_start -= s.w_size;
    s.strstart -= s.w_size;
    s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
    if (s.matches < 2) {
      s.matches++;
    }
    have += s.w_size;
    if (s.insert > s.strstart) {
      s.insert = s.strstart;
    }
  }
  if (have > s.strm.avail_in) {
    have = s.strm.avail_in;
  }
  if (have) {
    read_buf(s.strm, s.window, s.strstart, have);
    s.strstart += have;
    s.insert += have > s.w_size - s.insert ? s.w_size - s.insert : have;
  }
  if (s.high_water < s.strstart) {
    s.high_water = s.strstart;
  }
  have = s.bi_valid + 42 >> 3;
  have = s.pending_buf_size - have > 65535 ? 65535 : s.pending_buf_size - have;
  min_block = have > s.w_size ? s.w_size : have;
  left = s.strstart - s.block_start;
  if (left >= min_block || (left || flush === Z_FINISH$3) && flush !== Z_NO_FLUSH$2 && s.strm.avail_in === 0 && left <= have) {
    len = left > have ? have : left;
    last = flush === Z_FINISH$3 && s.strm.avail_in === 0 && len === left ? 1 : 0;
    _tr_stored_block(s, s.block_start, len, last);
    s.block_start += len;
    flush_pending(s.strm);
  }
  return last ? BS_FINISH_STARTED : BS_NEED_MORE;
};
const deflate_fast = (s, flush) => {
  let hash_head;
  let bflush;
  for (; ; ) {
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break;
      }
    }
    hash_head = 0;
    if (s.lookahead >= MIN_MATCH) {
      s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
    }
    if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
      s.match_length = longest_match(s, hash_head);
    }
    if (s.match_length >= MIN_MATCH) {
      bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
      s.lookahead -= s.match_length;
      if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
        s.match_length--;
        do {
          s.strstart++;
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
        } while (--s.match_length !== 0);
        s.strstart++;
      } else {
        s.strstart += s.match_length;
        s.match_length = 0;
        s.ins_h = s.window[s.strstart];
        s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + 1]);
      }
    } else {
      bflush = _tr_tally(s, 0, s.window[s.strstart]);
      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
  }
  s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
  if (flush === Z_FINISH$3) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    return BS_FINISH_DONE;
  }
  if (s.sym_next) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
  }
  return BS_BLOCK_DONE;
};
const deflate_slow = (s, flush) => {
  let hash_head;
  let bflush;
  let max_insert;
  for (; ; ) {
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break;
      }
    }
    hash_head = 0;
    if (s.lookahead >= MIN_MATCH) {
      s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
    }
    s.prev_length = s.match_length;
    s.prev_match = s.match_start;
    s.match_length = MIN_MATCH - 1;
    if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
      s.match_length = longest_match(s, hash_head);
      if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) {
        s.match_length = MIN_MATCH - 1;
      }
    }
    if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
      max_insert = s.strstart + s.lookahead - MIN_MATCH;
      bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
      s.lookahead -= s.prev_length - 1;
      s.prev_length -= 2;
      do {
        if (++s.strstart <= max_insert) {
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
        }
      } while (--s.prev_length !== 0);
      s.match_available = 0;
      s.match_length = MIN_MATCH - 1;
      s.strstart++;
      if (bflush) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
    } else if (s.match_available) {
      bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
      if (bflush) {
        flush_block_only(s, false);
      }
      s.strstart++;
      s.lookahead--;
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    } else {
      s.match_available = 1;
      s.strstart++;
      s.lookahead--;
    }
  }
  if (s.match_available) {
    bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
    s.match_available = 0;
  }
  s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
  if (flush === Z_FINISH$3) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    return BS_FINISH_DONE;
  }
  if (s.sym_next) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
  }
  return BS_BLOCK_DONE;
};
const deflate_rle = (s, flush) => {
  let bflush;
  let prev;
  let scan, strend;
  const _win = s.window;
  for (; ; ) {
    if (s.lookahead <= MAX_MATCH) {
      fill_window(s);
      if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH$2) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break;
      }
    }
    s.match_length = 0;
    if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
      scan = s.strstart - 1;
      prev = _win[scan];
      if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
        strend = s.strstart + MAX_MATCH;
        do {
        } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
        s.match_length = MAX_MATCH - (strend - scan);
        if (s.match_length > s.lookahead) {
          s.match_length = s.lookahead;
        }
      }
    }
    if (s.match_length >= MIN_MATCH) {
      bflush = _tr_tally(s, 1, s.match_length - MIN_MATCH);
      s.lookahead -= s.match_length;
      s.strstart += s.match_length;
      s.match_length = 0;
    } else {
      bflush = _tr_tally(s, 0, s.window[s.strstart]);
      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH$3) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    return BS_FINISH_DONE;
  }
  if (s.sym_next) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
  }
  return BS_BLOCK_DONE;
};
const deflate_huff = (s, flush) => {
  let bflush;
  for (; ; ) {
    if (s.lookahead === 0) {
      fill_window(s);
      if (s.lookahead === 0) {
        if (flush === Z_NO_FLUSH$2) {
          return BS_NEED_MORE;
        }
        break;
      }
    }
    s.match_length = 0;
    bflush = _tr_tally(s, 0, s.window[s.strstart]);
    s.lookahead--;
    s.strstart++;
    if (bflush) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH$3) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    return BS_FINISH_DONE;
  }
  if (s.sym_next) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
  }
  return BS_BLOCK_DONE;
};
function Config(good_length, max_lazy, nice_length, max_chain, func) {
  this.good_length = good_length;
  this.max_lazy = max_lazy;
  this.nice_length = nice_length;
  this.max_chain = max_chain;
  this.func = func;
}
const configuration_table = [
  /*      good lazy nice chain */
  new Config(0, 0, 0, 0, deflate_stored),
  /* 0 store only */
  new Config(4, 4, 8, 4, deflate_fast),
  /* 1 max speed, no lazy matches */
  new Config(4, 5, 16, 8, deflate_fast),
  /* 2 */
  new Config(4, 6, 32, 32, deflate_fast),
  /* 3 */
  new Config(4, 4, 16, 16, deflate_slow),
  /* 4 lazy matches */
  new Config(8, 16, 32, 32, deflate_slow),
  /* 5 */
  new Config(8, 16, 128, 128, deflate_slow),
  /* 6 */
  new Config(8, 32, 128, 256, deflate_slow),
  /* 7 */
  new Config(32, 128, 258, 1024, deflate_slow),
  /* 8 */
  new Config(32, 258, 258, 4096, deflate_slow)
  /* 9 max compression */
];
const lm_init = (s) => {
  s.window_size = 2 * s.w_size;
  zero(s.head);
  s.max_lazy_match = configuration_table[s.level].max_lazy;
  s.good_match = configuration_table[s.level].good_length;
  s.nice_match = configuration_table[s.level].nice_length;
  s.max_chain_length = configuration_table[s.level].max_chain;
  s.strstart = 0;
  s.block_start = 0;
  s.lookahead = 0;
  s.insert = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  s.ins_h = 0;
};
function DeflateState() {
  this.strm = null;
  this.status = 0;
  this.pending_buf = null;
  this.pending_buf_size = 0;
  this.pending_out = 0;
  this.pending = 0;
  this.wrap = 0;
  this.gzhead = null;
  this.gzindex = 0;
  this.method = Z_DEFLATED$2;
  this.last_flush = -1;
  this.w_size = 0;
  this.w_bits = 0;
  this.w_mask = 0;
  this.window = null;
  this.window_size = 0;
  this.prev = null;
  this.head = null;
  this.ins_h = 0;
  this.hash_size = 0;
  this.hash_bits = 0;
  this.hash_mask = 0;
  this.hash_shift = 0;
  this.block_start = 0;
  this.match_length = 0;
  this.prev_match = 0;
  this.match_available = 0;
  this.strstart = 0;
  this.match_start = 0;
  this.lookahead = 0;
  this.prev_length = 0;
  this.max_chain_length = 0;
  this.max_lazy_match = 0;
  this.level = 0;
  this.strategy = 0;
  this.good_match = 0;
  this.nice_match = 0;
  this.dyn_ltree = new Uint16Array(HEAP_SIZE * 2);
  this.dyn_dtree = new Uint16Array((2 * D_CODES + 1) * 2);
  this.bl_tree = new Uint16Array((2 * BL_CODES + 1) * 2);
  zero(this.dyn_ltree);
  zero(this.dyn_dtree);
  zero(this.bl_tree);
  this.l_desc = null;
  this.d_desc = null;
  this.bl_desc = null;
  this.bl_count = new Uint16Array(MAX_BITS + 1);
  this.heap = new Uint16Array(2 * L_CODES + 1);
  zero(this.heap);
  this.heap_len = 0;
  this.heap_max = 0;
  this.depth = new Uint16Array(2 * L_CODES + 1);
  zero(this.depth);
  this.sym_buf = 0;
  this.lit_bufsize = 0;
  this.sym_next = 0;
  this.sym_end = 0;
  this.opt_len = 0;
  this.static_len = 0;
  this.matches = 0;
  this.insert = 0;
  this.bi_buf = 0;
  this.bi_valid = 0;
}
const deflateStateCheck = (strm) => {
  if (!strm) {
    return 1;
  }
  const s = strm.state;
  if (!s || s.strm !== strm || s.status !== INIT_STATE && //#ifdef GZIP
  s.status !== GZIP_STATE && //#endif
  s.status !== EXTRA_STATE && s.status !== NAME_STATE && s.status !== COMMENT_STATE && s.status !== HCRC_STATE && s.status !== BUSY_STATE && s.status !== FINISH_STATE) {
    return 1;
  }
  return 0;
};
const deflateResetKeep = (strm) => {
  if (deflateStateCheck(strm)) {
    return err(strm, Z_STREAM_ERROR$2);
  }
  strm.total_in = strm.total_out = 0;
  strm.data_type = Z_UNKNOWN;
  const s = strm.state;
  s.pending = 0;
  s.pending_out = 0;
  if (s.wrap < 0) {
    s.wrap = -s.wrap;
  }
  s.status = //#ifdef GZIP
  s.wrap === 2 ? GZIP_STATE : (
    //#endif
    s.wrap ? INIT_STATE : BUSY_STATE
  );
  strm.adler = s.wrap === 2 ? 0 : 1;
  s.last_flush = -2;
  _tr_init(s);
  return Z_OK$3;
};
const deflateReset = (strm) => {
  const ret = deflateResetKeep(strm);
  if (ret === Z_OK$3) {
    lm_init(strm.state);
  }
  return ret;
};
const deflateSetHeader = (strm, head) => {
  if (deflateStateCheck(strm) || strm.state.wrap !== 2) {
    return Z_STREAM_ERROR$2;
  }
  strm.state.gzhead = head;
  return Z_OK$3;
};
const deflateInit2 = (strm, level2, method, windowBits, memLevel, strategy) => {
  if (!strm) {
    return Z_STREAM_ERROR$2;
  }
  let wrap2 = 1;
  if (level2 === Z_DEFAULT_COMPRESSION$1) {
    level2 = 6;
  }
  if (windowBits < 0) {
    wrap2 = 0;
    windowBits = -windowBits;
  } else if (windowBits > 15) {
    wrap2 = 2;
    windowBits -= 16;
  }
  if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED$2 || windowBits < 8 || windowBits > 15 || level2 < 0 || level2 > 9 || strategy < 0 || strategy > Z_FIXED || windowBits === 8 && wrap2 !== 1) {
    return err(strm, Z_STREAM_ERROR$2);
  }
  if (windowBits === 8) {
    windowBits = 9;
  }
  const s = new DeflateState();
  strm.state = s;
  s.strm = strm;
  s.status = INIT_STATE;
  s.wrap = wrap2;
  s.gzhead = null;
  s.w_bits = windowBits;
  s.w_size = 1 << s.w_bits;
  s.w_mask = s.w_size - 1;
  s.hash_bits = memLevel + 7;
  s.hash_size = 1 << s.hash_bits;
  s.hash_mask = s.hash_size - 1;
  s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
  s.window = new Uint8Array(s.w_size * 2);
  s.head = new Uint16Array(s.hash_size);
  s.prev = new Uint16Array(s.w_size);
  s.lit_bufsize = 1 << memLevel + 6;
  s.pending_buf_size = s.lit_bufsize * 4;
  s.pending_buf = new Uint8Array(s.pending_buf_size);
  s.sym_buf = s.lit_bufsize;
  s.sym_end = (s.lit_bufsize - 1) * 3;
  s.level = level2;
  s.strategy = strategy;
  s.method = method;
  return deflateReset(strm);
};
const deflateInit = (strm, level2) => {
  return deflateInit2(strm, level2, Z_DEFLATED$2, MAX_WBITS$1, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY$1);
};
const deflate$2 = (strm, flush) => {
  if (deflateStateCheck(strm) || flush > Z_BLOCK$1 || flush < 0) {
    return strm ? err(strm, Z_STREAM_ERROR$2) : Z_STREAM_ERROR$2;
  }
  const s = strm.state;
  if (!strm.output || strm.avail_in !== 0 && !strm.input || s.status === FINISH_STATE && flush !== Z_FINISH$3) {
    return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR$1 : Z_STREAM_ERROR$2);
  }
  const old_flush = s.last_flush;
  s.last_flush = flush;
  if (s.pending !== 0) {
    flush_pending(strm);
    if (strm.avail_out === 0) {
      s.last_flush = -1;
      return Z_OK$3;
    }
  } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH$3) {
    return err(strm, Z_BUF_ERROR$1);
  }
  if (s.status === FINISH_STATE && strm.avail_in !== 0) {
    return err(strm, Z_BUF_ERROR$1);
  }
  if (s.status === INIT_STATE && s.wrap === 0) {
    s.status = BUSY_STATE;
  }
  if (s.status === INIT_STATE) {
    let header = Z_DEFLATED$2 + (s.w_bits - 8 << 4) << 8;
    let level_flags = -1;
    if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
      level_flags = 0;
    } else if (s.level < 6) {
      level_flags = 1;
    } else if (s.level === 6) {
      level_flags = 2;
    } else {
      level_flags = 3;
    }
    header |= level_flags << 6;
    if (s.strstart !== 0) {
      header |= PRESET_DICT;
    }
    header += 31 - header % 31;
    putShortMSB(s, header);
    if (s.strstart !== 0) {
      putShortMSB(s, strm.adler >>> 16);
      putShortMSB(s, strm.adler & 65535);
    }
    strm.adler = 1;
    s.status = BUSY_STATE;
    flush_pending(strm);
    if (s.pending !== 0) {
      s.last_flush = -1;
      return Z_OK$3;
    }
  }
  if (s.status === GZIP_STATE) {
    strm.adler = 0;
    put_byte(s, 31);
    put_byte(s, 139);
    put_byte(s, 8);
    if (!s.gzhead) {
      put_byte(s, 0);
      put_byte(s, 0);
      put_byte(s, 0);
      put_byte(s, 0);
      put_byte(s, 0);
      put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
      put_byte(s, OS_CODE);
      s.status = BUSY_STATE;
      flush_pending(strm);
      if (s.pending !== 0) {
        s.last_flush = -1;
        return Z_OK$3;
      }
    } else {
      put_byte(
        s,
        (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16)
      );
      put_byte(s, s.gzhead.time & 255);
      put_byte(s, s.gzhead.time >> 8 & 255);
      put_byte(s, s.gzhead.time >> 16 & 255);
      put_byte(s, s.gzhead.time >> 24 & 255);
      put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
      put_byte(s, s.gzhead.os & 255);
      if (s.gzhead.extra && s.gzhead.extra.length) {
        put_byte(s, s.gzhead.extra.length & 255);
        put_byte(s, s.gzhead.extra.length >> 8 & 255);
      }
      if (s.gzhead.hcrc) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending, 0);
      }
      s.gzindex = 0;
      s.status = EXTRA_STATE;
    }
  }
  if (s.status === EXTRA_STATE) {
    if (s.gzhead.extra) {
      let beg = s.pending;
      let left = (s.gzhead.extra.length & 65535) - s.gzindex;
      while (s.pending + left > s.pending_buf_size) {
        let copy = s.pending_buf_size - s.pending;
        s.pending_buf.set(s.gzhead.extra.subarray(s.gzindex, s.gzindex + copy), s.pending);
        s.pending = s.pending_buf_size;
        if (s.gzhead.hcrc && s.pending > beg) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
        }
        s.gzindex += copy;
        flush_pending(strm);
        if (s.pending !== 0) {
          s.last_flush = -1;
          return Z_OK$3;
        }
        beg = 0;
        left -= copy;
      }
      let gzhead_extra = new Uint8Array(s.gzhead.extra);
      s.pending_buf.set(gzhead_extra.subarray(s.gzindex, s.gzindex + left), s.pending);
      s.pending += left;
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      s.gzindex = 0;
    }
    s.status = NAME_STATE;
  }
  if (s.status === NAME_STATE) {
    if (s.gzhead.name) {
      let beg = s.pending;
      let val;
      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          if (s.pending !== 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
          beg = 0;
        }
        if (s.gzindex < s.gzhead.name.length) {
          val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      s.gzindex = 0;
    }
    s.status = COMMENT_STATE;
  }
  if (s.status === COMMENT_STATE) {
    if (s.gzhead.comment) {
      let beg = s.pending;
      let val;
      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          if (s.pending !== 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
          beg = 0;
        }
        if (s.gzindex < s.gzhead.comment.length) {
          val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
    }
    s.status = HCRC_STATE;
  }
  if (s.status === HCRC_STATE) {
    if (s.gzhead.hcrc) {
      if (s.pending + 2 > s.pending_buf_size) {
        flush_pending(strm);
        if (s.pending !== 0) {
          s.last_flush = -1;
          return Z_OK$3;
        }
      }
      put_byte(s, strm.adler & 255);
      put_byte(s, strm.adler >> 8 & 255);
      strm.adler = 0;
    }
    s.status = BUSY_STATE;
    flush_pending(strm);
    if (s.pending !== 0) {
      s.last_flush = -1;
      return Z_OK$3;
    }
  }
  if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH$2 && s.status !== FINISH_STATE) {
    let bstate = s.level === 0 ? deflate_stored(s, flush) : s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
    if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
      s.status = FINISH_STATE;
    }
    if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
      if (strm.avail_out === 0) {
        s.last_flush = -1;
      }
      return Z_OK$3;
    }
    if (bstate === BS_BLOCK_DONE) {
      if (flush === Z_PARTIAL_FLUSH) {
        _tr_align(s);
      } else if (flush !== Z_BLOCK$1) {
        _tr_stored_block(s, 0, 0, false);
        if (flush === Z_FULL_FLUSH$1) {
          zero(s.head);
          if (s.lookahead === 0) {
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
        }
      }
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        return Z_OK$3;
      }
    }
  }
  if (flush !== Z_FINISH$3) {
    return Z_OK$3;
  }
  if (s.wrap <= 0) {
    return Z_STREAM_END$3;
  }
  if (s.wrap === 2) {
    put_byte(s, strm.adler & 255);
    put_byte(s, strm.adler >> 8 & 255);
    put_byte(s, strm.adler >> 16 & 255);
    put_byte(s, strm.adler >> 24 & 255);
    put_byte(s, strm.total_in & 255);
    put_byte(s, strm.total_in >> 8 & 255);
    put_byte(s, strm.total_in >> 16 & 255);
    put_byte(s, strm.total_in >> 24 & 255);
  } else {
    putShortMSB(s, strm.adler >>> 16);
    putShortMSB(s, strm.adler & 65535);
  }
  flush_pending(strm);
  if (s.wrap > 0) {
    s.wrap = -s.wrap;
  }
  return s.pending !== 0 ? Z_OK$3 : Z_STREAM_END$3;
};
const deflateEnd = (strm) => {
  if (deflateStateCheck(strm)) {
    return Z_STREAM_ERROR$2;
  }
  const status = strm.state.status;
  strm.state = null;
  return status === BUSY_STATE ? err(strm, Z_DATA_ERROR$2) : Z_OK$3;
};
const deflateSetDictionary = (strm, dictionary) => {
  let dictLength = dictionary.length;
  if (deflateStateCheck(strm)) {
    return Z_STREAM_ERROR$2;
  }
  const s = strm.state;
  const wrap2 = s.wrap;
  if (wrap2 === 2 || wrap2 === 1 && s.status !== INIT_STATE || s.lookahead) {
    return Z_STREAM_ERROR$2;
  }
  if (wrap2 === 1) {
    strm.adler = adler32_1(strm.adler, dictionary, dictLength, 0);
  }
  s.wrap = 0;
  if (dictLength >= s.w_size) {
    if (wrap2 === 0) {
      zero(s.head);
      s.strstart = 0;
      s.block_start = 0;
      s.insert = 0;
    }
    let tmpDict = new Uint8Array(s.w_size);
    tmpDict.set(dictionary.subarray(dictLength - s.w_size, dictLength), 0);
    dictionary = tmpDict;
    dictLength = s.w_size;
  }
  const avail = strm.avail_in;
  const next = strm.next_in;
  const input = strm.input;
  strm.avail_in = dictLength;
  strm.next_in = 0;
  strm.input = dictionary;
  fill_window(s);
  while (s.lookahead >= MIN_MATCH) {
    let str = s.strstart;
    let n = s.lookahead - (MIN_MATCH - 1);
    do {
      s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
      s.prev[str & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = str;
      str++;
    } while (--n);
    s.strstart = str;
    s.lookahead = MIN_MATCH - 1;
    fill_window(s);
  }
  s.strstart += s.lookahead;
  s.block_start = s.strstart;
  s.insert = s.lookahead;
  s.lookahead = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  strm.next_in = next;
  strm.input = input;
  strm.avail_in = avail;
  s.wrap = wrap2;
  return Z_OK$3;
};
var deflateInit_1 = deflateInit;
var deflateInit2_1 = deflateInit2;
var deflateReset_1 = deflateReset;
var deflateResetKeep_1 = deflateResetKeep;
var deflateSetHeader_1 = deflateSetHeader;
var deflate_2$1 = deflate$2;
var deflateEnd_1 = deflateEnd;
var deflateSetDictionary_1 = deflateSetDictionary;
var deflateInfo = "pako deflate (from Nodeca project)";
var deflate_1$2 = {
  deflateInit: deflateInit_1,
  deflateInit2: deflateInit2_1,
  deflateReset: deflateReset_1,
  deflateResetKeep: deflateResetKeep_1,
  deflateSetHeader: deflateSetHeader_1,
  deflate: deflate_2$1,
  deflateEnd: deflateEnd_1,
  deflateSetDictionary: deflateSetDictionary_1,
  deflateInfo
};
const _has = (obj, key) => {
  return Object.prototype.hasOwnProperty.call(obj, key);
};
var assign = function(obj) {
  const sources = Array.prototype.slice.call(arguments, 1);
  while (sources.length) {
    const source = sources.shift();
    if (!source) {
      continue;
    }
    if (typeof source !== "object") {
      throw new TypeError(source + "must be non-object");
    }
    for (const p in source) {
      if (_has(source, p)) {
        obj[p] = source[p];
      }
    }
  }
  return obj;
};
var flattenChunks = (chunks) => {
  let len = 0;
  for (let i2 = 0, l = chunks.length; i2 < l; i2++) {
    len += chunks[i2].length;
  }
  const result = new Uint8Array(len);
  for (let i2 = 0, pos = 0, l = chunks.length; i2 < l; i2++) {
    let chunk = chunks[i2];
    result.set(chunk, pos);
    pos += chunk.length;
  }
  return result;
};
var common = {
  assign,
  flattenChunks
};
let STR_APPLY_UIA_OK = true;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch (__) {
  STR_APPLY_UIA_OK = false;
}
const _utf8len = new Uint8Array(256);
for (let q = 0; q < 256; q++) {
  _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
}
_utf8len[254] = _utf8len[254] = 1;
var string2buf = (str) => {
  if (typeof TextEncoder === "function" && TextEncoder.prototype.encode) {
    return new TextEncoder().encode(str);
  }
  let buf, c, c2, m_pos, i2, str_len = str.length, buf_len = 0;
  for (m_pos = 0; m_pos < str_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
      c2 = str.charCodeAt(m_pos + 1);
      if ((c2 & 64512) === 56320) {
        c = 65536 + (c - 55296 << 10) + (c2 - 56320);
        m_pos++;
      }
    }
    buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
  }
  buf = new Uint8Array(buf_len);
  for (i2 = 0, m_pos = 0; i2 < buf_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
      c2 = str.charCodeAt(m_pos + 1);
      if ((c2 & 64512) === 56320) {
        c = 65536 + (c - 55296 << 10) + (c2 - 56320);
        m_pos++;
      }
    }
    if (c < 128) {
      buf[i2++] = c;
    } else if (c < 2048) {
      buf[i2++] = 192 | c >>> 6;
      buf[i2++] = 128 | c & 63;
    } else if (c < 65536) {
      buf[i2++] = 224 | c >>> 12;
      buf[i2++] = 128 | c >>> 6 & 63;
      buf[i2++] = 128 | c & 63;
    } else {
      buf[i2++] = 240 | c >>> 18;
      buf[i2++] = 128 | c >>> 12 & 63;
      buf[i2++] = 128 | c >>> 6 & 63;
      buf[i2++] = 128 | c & 63;
    }
  }
  return buf;
};
const buf2binstring = (buf, len) => {
  if (len < 65534) {
    if (buf.subarray && STR_APPLY_UIA_OK) {
      return String.fromCharCode.apply(null, buf.length === len ? buf : buf.subarray(0, len));
    }
  }
  let result = "";
  for (let i2 = 0; i2 < len; i2++) {
    result += String.fromCharCode(buf[i2]);
  }
  return result;
};
var buf2string = (buf, max2) => {
  const len = max2 || buf.length;
  if (typeof TextDecoder === "function" && TextDecoder.prototype.decode) {
    return new TextDecoder().decode(buf.subarray(0, max2));
  }
  let i2, out;
  const utf16buf = new Array(len * 2);
  for (out = 0, i2 = 0; i2 < len; ) {
    let c = buf[i2++];
    if (c < 128) {
      utf16buf[out++] = c;
      continue;
    }
    let c_len = _utf8len[c];
    if (c_len > 4) {
      utf16buf[out++] = 65533;
      i2 += c_len - 1;
      continue;
    }
    c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
    while (c_len > 1 && i2 < len) {
      c = c << 6 | buf[i2++] & 63;
      c_len--;
    }
    if (c_len > 1) {
      utf16buf[out++] = 65533;
      continue;
    }
    if (c < 65536) {
      utf16buf[out++] = c;
    } else {
      c -= 65536;
      utf16buf[out++] = 55296 | c >> 10 & 1023;
      utf16buf[out++] = 56320 | c & 1023;
    }
  }
  return buf2binstring(utf16buf, out);
};
var utf8border = (buf, max2) => {
  max2 = max2 || buf.length;
  if (max2 > buf.length) {
    max2 = buf.length;
  }
  let pos = max2 - 1;
  while (pos >= 0 && (buf[pos] & 192) === 128) {
    pos--;
  }
  if (pos < 0) {
    return max2;
  }
  if (pos === 0) {
    return max2;
  }
  return pos + _utf8len[buf[pos]] > max2 ? pos : max2;
};
var strings = {
  string2buf,
  buf2string,
  utf8border
};
function ZStream() {
  this.input = null;
  this.next_in = 0;
  this.avail_in = 0;
  this.total_in = 0;
  this.output = null;
  this.next_out = 0;
  this.avail_out = 0;
  this.total_out = 0;
  this.msg = "";
  this.state = null;
  this.data_type = 2;
  this.adler = 0;
}
var zstream = ZStream;
const toString$1$1 = Object.prototype.toString;
const {
  Z_NO_FLUSH: Z_NO_FLUSH$1,
  Z_SYNC_FLUSH,
  Z_FULL_FLUSH,
  Z_FINISH: Z_FINISH$2,
  Z_OK: Z_OK$2,
  Z_STREAM_END: Z_STREAM_END$2,
  Z_DEFAULT_COMPRESSION,
  Z_DEFAULT_STRATEGY,
  Z_DEFLATED: Z_DEFLATED$1
} = constants$2;
function Deflate$1(options) {
  this.options = common.assign({
    level: Z_DEFAULT_COMPRESSION,
    method: Z_DEFLATED$1,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: Z_DEFAULT_STRATEGY
  }, options || {});
  let opt = this.options;
  if (opt.raw && opt.windowBits > 0) {
    opt.windowBits = -opt.windowBits;
  } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
    opt.windowBits += 16;
  }
  this.err = 0;
  this.msg = "";
  this.ended = false;
  this.chunks = [];
  this.strm = new zstream();
  this.strm.avail_out = 0;
  let status = deflate_1$2.deflateInit2(
    this.strm,
    opt.level,
    opt.method,
    opt.windowBits,
    opt.memLevel,
    opt.strategy
  );
  if (status !== Z_OK$2) {
    throw new Error(messages[status]);
  }
  if (opt.header) {
    deflate_1$2.deflateSetHeader(this.strm, opt.header);
  }
  if (opt.dictionary) {
    let dict;
    if (typeof opt.dictionary === "string") {
      dict = strings.string2buf(opt.dictionary);
    } else if (toString$1$1.call(opt.dictionary) === "[object ArrayBuffer]") {
      dict = new Uint8Array(opt.dictionary);
    } else {
      dict = opt.dictionary;
    }
    status = deflate_1$2.deflateSetDictionary(this.strm, dict);
    if (status !== Z_OK$2) {
      throw new Error(messages[status]);
    }
    this._dict_set = true;
  }
}
Deflate$1.prototype.push = function(data, flush_mode) {
  const strm = this.strm;
  const chunkSize = this.options.chunkSize;
  let status, _flush_mode;
  if (this.ended) {
    return false;
  }
  if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;
  else _flush_mode = flush_mode === true ? Z_FINISH$2 : Z_NO_FLUSH$1;
  if (typeof data === "string") {
    strm.input = strings.string2buf(data);
  } else if (toString$1$1.call(data) === "[object ArrayBuffer]") {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }
  strm.next_in = 0;
  strm.avail_in = strm.input.length;
  for (; ; ) {
    if (strm.avail_out === 0) {
      strm.output = new Uint8Array(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }
    if ((_flush_mode === Z_SYNC_FLUSH || _flush_mode === Z_FULL_FLUSH) && strm.avail_out <= 6) {
      this.onData(strm.output.subarray(0, strm.next_out));
      strm.avail_out = 0;
      continue;
    }
    status = deflate_1$2.deflate(strm, _flush_mode);
    if (status === Z_STREAM_END$2) {
      if (strm.next_out > 0) {
        this.onData(strm.output.subarray(0, strm.next_out));
      }
      status = deflate_1$2.deflateEnd(this.strm);
      this.onEnd(status);
      this.ended = true;
      return status === Z_OK$2;
    }
    if (strm.avail_out === 0) {
      this.onData(strm.output);
      continue;
    }
    if (_flush_mode > 0 && strm.next_out > 0) {
      this.onData(strm.output.subarray(0, strm.next_out));
      strm.avail_out = 0;
      continue;
    }
    if (strm.avail_in === 0) break;
  }
  return true;
};
Deflate$1.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};
Deflate$1.prototype.onEnd = function(status) {
  if (status === Z_OK$2) {
    this.result = common.flattenChunks(this.chunks);
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};
function deflate$1(input, options) {
  const deflator = new Deflate$1(options);
  deflator.push(input, true);
  if (deflator.err) {
    throw deflator.msg || messages[deflator.err];
  }
  return deflator.result;
}
function deflateRaw$1(input, options) {
  options = options || {};
  options.raw = true;
  return deflate$1(input, options);
}
function gzip$1(input, options) {
  options = options || {};
  options.gzip = true;
  return deflate$1(input, options);
}
var Deflate_1$1 = Deflate$1;
var deflate_2 = deflate$1;
var deflateRaw_1$1 = deflateRaw$1;
var gzip_1$1 = gzip$1;
var constants$1 = constants$2;
var deflate_1$1 = {
  Deflate: Deflate_1$1,
  deflate: deflate_2,
  deflateRaw: deflateRaw_1$1,
  gzip: gzip_1$1,
  constants: constants$1
};
const BAD$1 = 16209;
const TYPE$1 = 16191;
var inffast = function inflate_fast(strm, start) {
  let _in;
  let last;
  let _out;
  let beg;
  let end;
  let dmax;
  let wsize;
  let whave;
  let wnext;
  let s_window;
  let hold;
  let bits;
  let lcode;
  let dcode;
  let lmask;
  let dmask;
  let here;
  let op;
  let len;
  let dist;
  let from;
  let from_source;
  let input, output;
  const state = strm.state;
  _in = strm.next_in;
  input = strm.input;
  last = _in + (strm.avail_in - 5);
  _out = strm.next_out;
  output = strm.output;
  beg = _out - (start - strm.avail_out);
  end = _out + (strm.avail_out - 257);
  dmax = state.dmax;
  wsize = state.wsize;
  whave = state.whave;
  wnext = state.wnext;
  s_window = state.window;
  hold = state.hold;
  bits = state.bits;
  lcode = state.lencode;
  dcode = state.distcode;
  lmask = (1 << state.lenbits) - 1;
  dmask = (1 << state.distbits) - 1;
  top:
    do {
      if (bits < 15) {
        hold += input[_in++] << bits;
        bits += 8;
        hold += input[_in++] << bits;
        bits += 8;
      }
      here = lcode[hold & lmask];
      dolen:
        for (; ; ) {
          op = here >>> 24;
          hold >>>= op;
          bits -= op;
          op = here >>> 16 & 255;
          if (op === 0) {
            output[_out++] = here & 65535;
          } else if (op & 16) {
            len = here & 65535;
            op &= 15;
            if (op) {
              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;
              }
              len += hold & (1 << op) - 1;
              hold >>>= op;
              bits -= op;
            }
            if (bits < 15) {
              hold += input[_in++] << bits;
              bits += 8;
              hold += input[_in++] << bits;
              bits += 8;
            }
            here = dcode[hold & dmask];
            dodist:
              for (; ; ) {
                op = here >>> 24;
                hold >>>= op;
                bits -= op;
                op = here >>> 16 & 255;
                if (op & 16) {
                  dist = here & 65535;
                  op &= 15;
                  if (bits < op) {
                    hold += input[_in++] << bits;
                    bits += 8;
                    if (bits < op) {
                      hold += input[_in++] << bits;
                      bits += 8;
                    }
                  }
                  dist += hold & (1 << op) - 1;
                  if (dist > dmax) {
                    strm.msg = "invalid distance too far back";
                    state.mode = BAD$1;
                    break top;
                  }
                  hold >>>= op;
                  bits -= op;
                  op = _out - beg;
                  if (dist > op) {
                    op = dist - op;
                    if (op > whave) {
                      if (state.sane) {
                        strm.msg = "invalid distance too far back";
                        state.mode = BAD$1;
                        break top;
                      }
                    }
                    from = 0;
                    from_source = s_window;
                    if (wnext === 0) {
                      from += wsize - op;
                      if (op < len) {
                        len -= op;
                        do {
                          output[_out++] = s_window[from++];
                        } while (--op);
                        from = _out - dist;
                        from_source = output;
                      }
                    } else if (wnext < op) {
                      from += wsize + wnext - op;
                      op -= wnext;
                      if (op < len) {
                        len -= op;
                        do {
                          output[_out++] = s_window[from++];
                        } while (--op);
                        from = 0;
                        if (wnext < len) {
                          op = wnext;
                          len -= op;
                          do {
                            output[_out++] = s_window[from++];
                          } while (--op);
                          from = _out - dist;
                          from_source = output;
                        }
                      }
                    } else {
                      from += wnext - op;
                      if (op < len) {
                        len -= op;
                        do {
                          output[_out++] = s_window[from++];
                        } while (--op);
                        from = _out - dist;
                        from_source = output;
                      }
                    }
                    while (len > 2) {
                      output[_out++] = from_source[from++];
                      output[_out++] = from_source[from++];
                      output[_out++] = from_source[from++];
                      len -= 3;
                    }
                    if (len) {
                      output[_out++] = from_source[from++];
                      if (len > 1) {
                        output[_out++] = from_source[from++];
                      }
                    }
                  } else {
                    from = _out - dist;
                    do {
                      output[_out++] = output[from++];
                      output[_out++] = output[from++];
                      output[_out++] = output[from++];
                      len -= 3;
                    } while (len > 2);
                    if (len) {
                      output[_out++] = output[from++];
                      if (len > 1) {
                        output[_out++] = output[from++];
                      }
                    }
                  }
                } else if ((op & 64) === 0) {
                  here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                  continue dodist;
                } else {
                  strm.msg = "invalid distance code";
                  state.mode = BAD$1;
                  break top;
                }
                break;
              }
          } else if ((op & 64) === 0) {
            here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
            continue dolen;
          } else if (op & 32) {
            state.mode = TYPE$1;
            break top;
          } else {
            strm.msg = "invalid literal/length code";
            state.mode = BAD$1;
            break top;
          }
          break;
        }
    } while (_in < last && _out < end);
  len = bits >> 3;
  _in -= len;
  bits -= len << 3;
  hold &= (1 << bits) - 1;
  strm.next_in = _in;
  strm.next_out = _out;
  strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
  strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
  state.hold = hold;
  state.bits = bits;
  return;
};
const MAXBITS = 15;
const ENOUGH_LENS$1 = 852;
const ENOUGH_DISTS$1 = 592;
const CODES$1 = 0;
const LENS$1 = 1;
const DISTS$1 = 2;
const lbase = new Uint16Array([
  /* Length codes 257..285 base */
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  13,
  15,
  17,
  19,
  23,
  27,
  31,
  35,
  43,
  51,
  59,
  67,
  83,
  99,
  115,
  131,
  163,
  195,
  227,
  258,
  0,
  0
]);
const lext = new Uint8Array([
  /* Length codes 257..285 extra */
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  17,
  17,
  17,
  17,
  18,
  18,
  18,
  18,
  19,
  19,
  19,
  19,
  20,
  20,
  20,
  20,
  21,
  21,
  21,
  21,
  16,
  72,
  78
]);
const dbase = new Uint16Array([
  /* Distance codes 0..29 base */
  1,
  2,
  3,
  4,
  5,
  7,
  9,
  13,
  17,
  25,
  33,
  49,
  65,
  97,
  129,
  193,
  257,
  385,
  513,
  769,
  1025,
  1537,
  2049,
  3073,
  4097,
  6145,
  8193,
  12289,
  16385,
  24577,
  0,
  0
]);
const dext = new Uint8Array([
  /* Distance codes 0..29 extra */
  16,
  16,
  16,
  16,
  17,
  17,
  18,
  18,
  19,
  19,
  20,
  20,
  21,
  21,
  22,
  22,
  23,
  23,
  24,
  24,
  25,
  25,
  26,
  26,
  27,
  27,
  28,
  28,
  29,
  29,
  64,
  64
]);
const inflate_table = (type, lens, lens_index, codes, table, table_index, work2, opts) => {
  const bits = opts.bits;
  let len = 0;
  let sym = 0;
  let min2 = 0, max2 = 0;
  let root = 0;
  let curr = 0;
  let drop = 0;
  let left = 0;
  let used = 0;
  let huff = 0;
  let incr;
  let fill2;
  let low;
  let mask2;
  let next;
  let base = null;
  let match;
  const count = new Uint16Array(MAXBITS + 1);
  const offs = new Uint16Array(MAXBITS + 1);
  let extra = null;
  let here_bits, here_op, here_val;
  for (len = 0; len <= MAXBITS; len++) {
    count[len] = 0;
  }
  for (sym = 0; sym < codes; sym++) {
    count[lens[lens_index + sym]]++;
  }
  root = bits;
  for (max2 = MAXBITS; max2 >= 1; max2--) {
    if (count[max2] !== 0) {
      break;
    }
  }
  if (root > max2) {
    root = max2;
  }
  if (max2 === 0) {
    table[table_index++] = 1 << 24 | 64 << 16 | 0;
    table[table_index++] = 1 << 24 | 64 << 16 | 0;
    opts.bits = 1;
    return 0;
  }
  for (min2 = 1; min2 < max2; min2++) {
    if (count[min2] !== 0) {
      break;
    }
  }
  if (root < min2) {
    root = min2;
  }
  left = 1;
  for (len = 1; len <= MAXBITS; len++) {
    left <<= 1;
    left -= count[len];
    if (left < 0) {
      return -1;
    }
  }
  if (left > 0 && (type === CODES$1 || max2 !== 1)) {
    return -1;
  }
  offs[1] = 0;
  for (len = 1; len < MAXBITS; len++) {
    offs[len + 1] = offs[len] + count[len];
  }
  for (sym = 0; sym < codes; sym++) {
    if (lens[lens_index + sym] !== 0) {
      work2[offs[lens[lens_index + sym]]++] = sym;
    }
  }
  if (type === CODES$1) {
    base = extra = work2;
    match = 20;
  } else if (type === LENS$1) {
    base = lbase;
    extra = lext;
    match = 257;
  } else {
    base = dbase;
    extra = dext;
    match = 0;
  }
  huff = 0;
  sym = 0;
  len = min2;
  next = table_index;
  curr = root;
  drop = 0;
  low = -1;
  used = 1 << root;
  mask2 = used - 1;
  if (type === LENS$1 && used > ENOUGH_LENS$1 || type === DISTS$1 && used > ENOUGH_DISTS$1) {
    return 1;
  }
  for (; ; ) {
    here_bits = len - drop;
    if (work2[sym] + 1 < match) {
      here_op = 0;
      here_val = work2[sym];
    } else if (work2[sym] >= match) {
      here_op = extra[work2[sym] - match];
      here_val = base[work2[sym] - match];
    } else {
      here_op = 32 + 64;
      here_val = 0;
    }
    incr = 1 << len - drop;
    fill2 = 1 << curr;
    min2 = fill2;
    do {
      fill2 -= incr;
      table[next + (huff >> drop) + fill2] = here_bits << 24 | here_op << 16 | here_val | 0;
    } while (fill2 !== 0);
    incr = 1 << len - 1;
    while (huff & incr) {
      incr >>= 1;
    }
    if (incr !== 0) {
      huff &= incr - 1;
      huff += incr;
    } else {
      huff = 0;
    }
    sym++;
    if (--count[len] === 0) {
      if (len === max2) {
        break;
      }
      len = lens[lens_index + work2[sym]];
    }
    if (len > root && (huff & mask2) !== low) {
      if (drop === 0) {
        drop = root;
      }
      next += min2;
      curr = len - drop;
      left = 1 << curr;
      while (curr + drop < max2) {
        left -= count[curr + drop];
        if (left <= 0) {
          break;
        }
        curr++;
        left <<= 1;
      }
      used += 1 << curr;
      if (type === LENS$1 && used > ENOUGH_LENS$1 || type === DISTS$1 && used > ENOUGH_DISTS$1) {
        return 1;
      }
      low = huff & mask2;
      table[low] = root << 24 | curr << 16 | next - table_index | 0;
    }
  }
  if (huff !== 0) {
    table[next + huff] = len - drop << 24 | 64 << 16 | 0;
  }
  opts.bits = root;
  return 0;
};
var inftrees = inflate_table;
const CODES = 0;
const LENS = 1;
const DISTS = 2;
const {
  Z_FINISH: Z_FINISH$1,
  Z_BLOCK,
  Z_TREES,
  Z_OK: Z_OK$1,
  Z_STREAM_END: Z_STREAM_END$1,
  Z_NEED_DICT: Z_NEED_DICT$1,
  Z_STREAM_ERROR: Z_STREAM_ERROR$1,
  Z_DATA_ERROR: Z_DATA_ERROR$1,
  Z_MEM_ERROR: Z_MEM_ERROR$1,
  Z_BUF_ERROR,
  Z_DEFLATED
} = constants$2;
const HEAD = 16180;
const FLAGS = 16181;
const TIME = 16182;
const OS = 16183;
const EXLEN = 16184;
const EXTRA = 16185;
const NAME = 16186;
const COMMENT = 16187;
const HCRC = 16188;
const DICTID = 16189;
const DICT = 16190;
const TYPE = 16191;
const TYPEDO = 16192;
const STORED = 16193;
const COPY_ = 16194;
const COPY = 16195;
const TABLE = 16196;
const LENLENS = 16197;
const CODELENS = 16198;
const LEN_ = 16199;
const LEN = 16200;
const LENEXT = 16201;
const DIST = 16202;
const DISTEXT = 16203;
const MATCH = 16204;
const LIT = 16205;
const CHECK = 16206;
const LENGTH = 16207;
const DONE = 16208;
const BAD = 16209;
const MEM = 16210;
const SYNC = 16211;
const ENOUGH_LENS = 852;
const ENOUGH_DISTS = 592;
const MAX_WBITS = 15;
const DEF_WBITS = MAX_WBITS;
const zswap32 = (q) => {
  return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
};
function InflateState() {
  this.strm = null;
  this.mode = 0;
  this.last = false;
  this.wrap = 0;
  this.havedict = false;
  this.flags = 0;
  this.dmax = 0;
  this.check = 0;
  this.total = 0;
  this.head = null;
  this.wbits = 0;
  this.wsize = 0;
  this.whave = 0;
  this.wnext = 0;
  this.window = null;
  this.hold = 0;
  this.bits = 0;
  this.length = 0;
  this.offset = 0;
  this.extra = 0;
  this.lencode = null;
  this.distcode = null;
  this.lenbits = 0;
  this.distbits = 0;
  this.ncode = 0;
  this.nlen = 0;
  this.ndist = 0;
  this.have = 0;
  this.next = null;
  this.lens = new Uint16Array(320);
  this.work = new Uint16Array(288);
  this.lendyn = null;
  this.distdyn = null;
  this.sane = 0;
  this.back = 0;
  this.was = 0;
}
const inflateStateCheck = (strm) => {
  if (!strm) {
    return 1;
  }
  const state = strm.state;
  if (!state || state.strm !== strm || state.mode < HEAD || state.mode > SYNC) {
    return 1;
  }
  return 0;
};
const inflateResetKeep = (strm) => {
  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }
  const state = strm.state;
  strm.total_in = strm.total_out = state.total = 0;
  strm.msg = "";
  if (state.wrap) {
    strm.adler = state.wrap & 1;
  }
  state.mode = HEAD;
  state.last = 0;
  state.havedict = 0;
  state.flags = -1;
  state.dmax = 32768;
  state.head = null;
  state.hold = 0;
  state.bits = 0;
  state.lencode = state.lendyn = new Int32Array(ENOUGH_LENS);
  state.distcode = state.distdyn = new Int32Array(ENOUGH_DISTS);
  state.sane = 1;
  state.back = -1;
  return Z_OK$1;
};
const inflateReset = (strm) => {
  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }
  const state = strm.state;
  state.wsize = 0;
  state.whave = 0;
  state.wnext = 0;
  return inflateResetKeep(strm);
};
const inflateReset2 = (strm, windowBits) => {
  let wrap2;
  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }
  const state = strm.state;
  if (windowBits < 0) {
    wrap2 = 0;
    windowBits = -windowBits;
  } else {
    wrap2 = (windowBits >> 4) + 5;
    if (windowBits < 48) {
      windowBits &= 15;
    }
  }
  if (windowBits && (windowBits < 8 || windowBits > 15)) {
    return Z_STREAM_ERROR$1;
  }
  if (state.window !== null && state.wbits !== windowBits) {
    state.window = null;
  }
  state.wrap = wrap2;
  state.wbits = windowBits;
  return inflateReset(strm);
};
const inflateInit2 = (strm, windowBits) => {
  if (!strm) {
    return Z_STREAM_ERROR$1;
  }
  const state = new InflateState();
  strm.state = state;
  state.strm = strm;
  state.window = null;
  state.mode = HEAD;
  const ret = inflateReset2(strm, windowBits);
  if (ret !== Z_OK$1) {
    strm.state = null;
  }
  return ret;
};
const inflateInit = (strm) => {
  return inflateInit2(strm, DEF_WBITS);
};
let virgin = true;
let lenfix, distfix;
const fixedtables = (state) => {
  if (virgin) {
    lenfix = new Int32Array(512);
    distfix = new Int32Array(32);
    let sym = 0;
    while (sym < 144) {
      state.lens[sym++] = 8;
    }
    while (sym < 256) {
      state.lens[sym++] = 9;
    }
    while (sym < 280) {
      state.lens[sym++] = 7;
    }
    while (sym < 288) {
      state.lens[sym++] = 8;
    }
    inftrees(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
    sym = 0;
    while (sym < 32) {
      state.lens[sym++] = 5;
    }
    inftrees(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
    virgin = false;
  }
  state.lencode = lenfix;
  state.lenbits = 9;
  state.distcode = distfix;
  state.distbits = 5;
};
const updatewindow = (strm, src2, end, copy) => {
  let dist;
  const state = strm.state;
  if (state.window === null) {
    state.wsize = 1 << state.wbits;
    state.wnext = 0;
    state.whave = 0;
    state.window = new Uint8Array(state.wsize);
  }
  if (copy >= state.wsize) {
    state.window.set(src2.subarray(end - state.wsize, end), 0);
    state.wnext = 0;
    state.whave = state.wsize;
  } else {
    dist = state.wsize - state.wnext;
    if (dist > copy) {
      dist = copy;
    }
    state.window.set(src2.subarray(end - copy, end - copy + dist), state.wnext);
    copy -= dist;
    if (copy) {
      state.window.set(src2.subarray(end - copy, end), 0);
      state.wnext = copy;
      state.whave = state.wsize;
    } else {
      state.wnext += dist;
      if (state.wnext === state.wsize) {
        state.wnext = 0;
      }
      if (state.whave < state.wsize) {
        state.whave += dist;
      }
    }
  }
  return 0;
};
const inflate$2 = (strm, flush) => {
  let state;
  let input, output;
  let next;
  let put;
  let have, left;
  let hold;
  let bits;
  let _in, _out;
  let copy;
  let from;
  let from_source;
  let here = 0;
  let here_bits, here_op, here_val;
  let last_bits, last_op, last_val;
  let len;
  let ret;
  const hbuf = new Uint8Array(4);
  let opts;
  let n;
  const order = (
    /* permutation of code lengths */
    new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
  );
  if (inflateStateCheck(strm) || !strm.output || !strm.input && strm.avail_in !== 0) {
    return Z_STREAM_ERROR$1;
  }
  state = strm.state;
  if (state.mode === TYPE) {
    state.mode = TYPEDO;
  }
  put = strm.next_out;
  output = strm.output;
  left = strm.avail_out;
  next = strm.next_in;
  input = strm.input;
  have = strm.avail_in;
  hold = state.hold;
  bits = state.bits;
  _in = have;
  _out = left;
  ret = Z_OK$1;
  inf_leave:
    for (; ; ) {
      switch (state.mode) {
        case HEAD:
          if (state.wrap === 0) {
            state.mode = TYPEDO;
            break;
          }
          while (bits < 16) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (state.wrap & 2 && hold === 35615) {
            if (state.wbits === 0) {
              state.wbits = 15;
            }
            state.check = 0;
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            state.check = crc32_1(state.check, hbuf, 2, 0);
            hold = 0;
            bits = 0;
            state.mode = FLAGS;
            break;
          }
          if (state.head) {
            state.head.done = false;
          }
          if (!(state.wrap & 1) || /* check if zlib header allowed */
          (((hold & 255) << 8) + (hold >> 8)) % 31) {
            strm.msg = "incorrect header check";
            state.mode = BAD;
            break;
          }
          if ((hold & 15) !== Z_DEFLATED) {
            strm.msg = "unknown compression method";
            state.mode = BAD;
            break;
          }
          hold >>>= 4;
          bits -= 4;
          len = (hold & 15) + 8;
          if (state.wbits === 0) {
            state.wbits = len;
          }
          if (len > 15 || len > state.wbits) {
            strm.msg = "invalid window size";
            state.mode = BAD;
            break;
          }
          state.dmax = 1 << state.wbits;
          state.flags = 0;
          strm.adler = state.check = 1;
          state.mode = hold & 512 ? DICTID : TYPE;
          hold = 0;
          bits = 0;
          break;
        case FLAGS:
          while (bits < 16) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          state.flags = hold;
          if ((state.flags & 255) !== Z_DEFLATED) {
            strm.msg = "unknown compression method";
            state.mode = BAD;
            break;
          }
          if (state.flags & 57344) {
            strm.msg = "unknown header flags set";
            state.mode = BAD;
            break;
          }
          if (state.head) {
            state.head.text = hold >> 8 & 1;
          }
          if (state.flags & 512 && state.wrap & 4) {
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            state.check = crc32_1(state.check, hbuf, 2, 0);
          }
          hold = 0;
          bits = 0;
          state.mode = TIME;
        case TIME:
          while (bits < 32) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (state.head) {
            state.head.time = hold;
          }
          if (state.flags & 512 && state.wrap & 4) {
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            hbuf[2] = hold >>> 16 & 255;
            hbuf[3] = hold >>> 24 & 255;
            state.check = crc32_1(state.check, hbuf, 4, 0);
          }
          hold = 0;
          bits = 0;
          state.mode = OS;
        case OS:
          while (bits < 16) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (state.head) {
            state.head.xflags = hold & 255;
            state.head.os = hold >> 8;
          }
          if (state.flags & 512 && state.wrap & 4) {
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            state.check = crc32_1(state.check, hbuf, 2, 0);
          }
          hold = 0;
          bits = 0;
          state.mode = EXLEN;
        case EXLEN:
          if (state.flags & 1024) {
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.length = hold;
            if (state.head) {
              state.head.extra_len = hold;
            }
            if (state.flags & 512 && state.wrap & 4) {
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              state.check = crc32_1(state.check, hbuf, 2, 0);
            }
            hold = 0;
            bits = 0;
          } else if (state.head) {
            state.head.extra = null;
          }
          state.mode = EXTRA;
        case EXTRA:
          if (state.flags & 1024) {
            copy = state.length;
            if (copy > have) {
              copy = have;
            }
            if (copy) {
              if (state.head) {
                len = state.head.extra_len - state.length;
                if (!state.head.extra) {
                  state.head.extra = new Uint8Array(state.head.extra_len);
                }
                state.head.extra.set(
                  input.subarray(
                    next,
                    // extra field is limited to 65536 bytes
                    // - no need for additional size check
                    next + copy
                  ),
                  /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                  len
                );
              }
              if (state.flags & 512 && state.wrap & 4) {
                state.check = crc32_1(state.check, input, copy, next);
              }
              have -= copy;
              next += copy;
              state.length -= copy;
            }
            if (state.length) {
              break inf_leave;
            }
          }
          state.length = 0;
          state.mode = NAME;
        case NAME:
          if (state.flags & 2048) {
            if (have === 0) {
              break inf_leave;
            }
            copy = 0;
            do {
              len = input[next + copy++];
              if (state.head && len && state.length < 65536) {
                state.head.name += String.fromCharCode(len);
              }
            } while (len && copy < have);
            if (state.flags & 512 && state.wrap & 4) {
              state.check = crc32_1(state.check, input, copy, next);
            }
            have -= copy;
            next += copy;
            if (len) {
              break inf_leave;
            }
          } else if (state.head) {
            state.head.name = null;
          }
          state.length = 0;
          state.mode = COMMENT;
        case COMMENT:
          if (state.flags & 4096) {
            if (have === 0) {
              break inf_leave;
            }
            copy = 0;
            do {
              len = input[next + copy++];
              if (state.head && len && state.length < 65536) {
                state.head.comment += String.fromCharCode(len);
              }
            } while (len && copy < have);
            if (state.flags & 512 && state.wrap & 4) {
              state.check = crc32_1(state.check, input, copy, next);
            }
            have -= copy;
            next += copy;
            if (len) {
              break inf_leave;
            }
          } else if (state.head) {
            state.head.comment = null;
          }
          state.mode = HCRC;
        case HCRC:
          if (state.flags & 512) {
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (state.wrap & 4 && hold !== (state.check & 65535)) {
              strm.msg = "header crc mismatch";
              state.mode = BAD;
              break;
            }
            hold = 0;
            bits = 0;
          }
          if (state.head) {
            state.head.hcrc = state.flags >> 9 & 1;
            state.head.done = true;
          }
          strm.adler = state.check = 0;
          state.mode = TYPE;
          break;
        case DICTID:
          while (bits < 32) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          strm.adler = state.check = zswap32(hold);
          hold = 0;
          bits = 0;
          state.mode = DICT;
        case DICT:
          if (state.havedict === 0) {
            strm.next_out = put;
            strm.avail_out = left;
            strm.next_in = next;
            strm.avail_in = have;
            state.hold = hold;
            state.bits = bits;
            return Z_NEED_DICT$1;
          }
          strm.adler = state.check = 1;
          state.mode = TYPE;
        case TYPE:
          if (flush === Z_BLOCK || flush === Z_TREES) {
            break inf_leave;
          }
        case TYPEDO:
          if (state.last) {
            hold >>>= bits & 7;
            bits -= bits & 7;
            state.mode = CHECK;
            break;
          }
          while (bits < 3) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          state.last = hold & 1;
          hold >>>= 1;
          bits -= 1;
          switch (hold & 3) {
            case 0:
              state.mode = STORED;
              break;
            case 1:
              fixedtables(state);
              state.mode = LEN_;
              if (flush === Z_TREES) {
                hold >>>= 2;
                bits -= 2;
                break inf_leave;
              }
              break;
            case 2:
              state.mode = TABLE;
              break;
            case 3:
              strm.msg = "invalid block type";
              state.mode = BAD;
          }
          hold >>>= 2;
          bits -= 2;
          break;
        case STORED:
          hold >>>= bits & 7;
          bits -= bits & 7;
          while (bits < 32) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
            strm.msg = "invalid stored block lengths";
            state.mode = BAD;
            break;
          }
          state.length = hold & 65535;
          hold = 0;
          bits = 0;
          state.mode = COPY_;
          if (flush === Z_TREES) {
            break inf_leave;
          }
        case COPY_:
          state.mode = COPY;
        case COPY:
          copy = state.length;
          if (copy) {
            if (copy > have) {
              copy = have;
            }
            if (copy > left) {
              copy = left;
            }
            if (copy === 0) {
              break inf_leave;
            }
            output.set(input.subarray(next, next + copy), put);
            have -= copy;
            next += copy;
            left -= copy;
            put += copy;
            state.length -= copy;
            break;
          }
          state.mode = TYPE;
          break;
        case TABLE:
          while (bits < 14) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          state.nlen = (hold & 31) + 257;
          hold >>>= 5;
          bits -= 5;
          state.ndist = (hold & 31) + 1;
          hold >>>= 5;
          bits -= 5;
          state.ncode = (hold & 15) + 4;
          hold >>>= 4;
          bits -= 4;
          if (state.nlen > 286 || state.ndist > 30) {
            strm.msg = "too many length or distance symbols";
            state.mode = BAD;
            break;
          }
          state.have = 0;
          state.mode = LENLENS;
        case LENLENS:
          while (state.have < state.ncode) {
            while (bits < 3) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.lens[order[state.have++]] = hold & 7;
            hold >>>= 3;
            bits -= 3;
          }
          while (state.have < 19) {
            state.lens[order[state.have++]] = 0;
          }
          state.lencode = state.lendyn;
          state.lenbits = 7;
          opts = { bits: state.lenbits };
          ret = inftrees(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
          state.lenbits = opts.bits;
          if (ret) {
            strm.msg = "invalid code lengths set";
            state.mode = BAD;
            break;
          }
          state.have = 0;
          state.mode = CODELENS;
        case CODELENS:
          while (state.have < state.nlen + state.ndist) {
            for (; ; ) {
              here = state.lencode[hold & (1 << state.lenbits) - 1];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (here_val < 16) {
              hold >>>= here_bits;
              bits -= here_bits;
              state.lens[state.have++] = here_val;
            } else {
              if (here_val === 16) {
                n = here_bits + 2;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                if (state.have === 0) {
                  strm.msg = "invalid bit length repeat";
                  state.mode = BAD;
                  break;
                }
                len = state.lens[state.have - 1];
                copy = 3 + (hold & 3);
                hold >>>= 2;
                bits -= 2;
              } else if (here_val === 17) {
                n = here_bits + 3;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                len = 0;
                copy = 3 + (hold & 7);
                hold >>>= 3;
                bits -= 3;
              } else {
                n = here_bits + 7;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                len = 0;
                copy = 11 + (hold & 127);
                hold >>>= 7;
                bits -= 7;
              }
              if (state.have + copy > state.nlen + state.ndist) {
                strm.msg = "invalid bit length repeat";
                state.mode = BAD;
                break;
              }
              while (copy--) {
                state.lens[state.have++] = len;
              }
            }
          }
          if (state.mode === BAD) {
            break;
          }
          if (state.lens[256] === 0) {
            strm.msg = "invalid code -- missing end-of-block";
            state.mode = BAD;
            break;
          }
          state.lenbits = 9;
          opts = { bits: state.lenbits };
          ret = inftrees(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
          state.lenbits = opts.bits;
          if (ret) {
            strm.msg = "invalid literal/lengths set";
            state.mode = BAD;
            break;
          }
          state.distbits = 6;
          state.distcode = state.distdyn;
          opts = { bits: state.distbits };
          ret = inftrees(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
          state.distbits = opts.bits;
          if (ret) {
            strm.msg = "invalid distances set";
            state.mode = BAD;
            break;
          }
          state.mode = LEN_;
          if (flush === Z_TREES) {
            break inf_leave;
          }
        case LEN_:
          state.mode = LEN;
        case LEN:
          if (have >= 6 && left >= 258) {
            strm.next_out = put;
            strm.avail_out = left;
            strm.next_in = next;
            strm.avail_in = have;
            state.hold = hold;
            state.bits = bits;
            inffast(strm, _out);
            put = strm.next_out;
            output = strm.output;
            left = strm.avail_out;
            next = strm.next_in;
            input = strm.input;
            have = strm.avail_in;
            hold = state.hold;
            bits = state.bits;
            if (state.mode === TYPE) {
              state.back = -1;
            }
            break;
          }
          state.back = 0;
          for (; ; ) {
            here = state.lencode[hold & (1 << state.lenbits) - 1];
            here_bits = here >>> 24;
            here_op = here >>> 16 & 255;
            here_val = here & 65535;
            if (here_bits <= bits) {
              break;
            }
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (here_op && (here_op & 240) === 0) {
            last_bits = here_bits;
            last_op = here_op;
            last_val = here_val;
            for (; ; ) {
              here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (last_bits + here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            hold >>>= last_bits;
            bits -= last_bits;
            state.back += last_bits;
          }
          hold >>>= here_bits;
          bits -= here_bits;
          state.back += here_bits;
          state.length = here_val;
          if (here_op === 0) {
            state.mode = LIT;
            break;
          }
          if (here_op & 32) {
            state.back = -1;
            state.mode = TYPE;
            break;
          }
          if (here_op & 64) {
            strm.msg = "invalid literal/length code";
            state.mode = BAD;
            break;
          }
          state.extra = here_op & 15;
          state.mode = LENEXT;
        case LENEXT:
          if (state.extra) {
            n = state.extra;
            while (bits < n) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.length += hold & (1 << state.extra) - 1;
            hold >>>= state.extra;
            bits -= state.extra;
            state.back += state.extra;
          }
          state.was = state.length;
          state.mode = DIST;
        case DIST:
          for (; ; ) {
            here = state.distcode[hold & (1 << state.distbits) - 1];
            here_bits = here >>> 24;
            here_op = here >>> 16 & 255;
            here_val = here & 65535;
            if (here_bits <= bits) {
              break;
            }
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if ((here_op & 240) === 0) {
            last_bits = here_bits;
            last_op = here_op;
            last_val = here_val;
            for (; ; ) {
              here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (last_bits + here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            hold >>>= last_bits;
            bits -= last_bits;
            state.back += last_bits;
          }
          hold >>>= here_bits;
          bits -= here_bits;
          state.back += here_bits;
          if (here_op & 64) {
            strm.msg = "invalid distance code";
            state.mode = BAD;
            break;
          }
          state.offset = here_val;
          state.extra = here_op & 15;
          state.mode = DISTEXT;
        case DISTEXT:
          if (state.extra) {
            n = state.extra;
            while (bits < n) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.offset += hold & (1 << state.extra) - 1;
            hold >>>= state.extra;
            bits -= state.extra;
            state.back += state.extra;
          }
          if (state.offset > state.dmax) {
            strm.msg = "invalid distance too far back";
            state.mode = BAD;
            break;
          }
          state.mode = MATCH;
        case MATCH:
          if (left === 0) {
            break inf_leave;
          }
          copy = _out - left;
          if (state.offset > copy) {
            copy = state.offset - copy;
            if (copy > state.whave) {
              if (state.sane) {
                strm.msg = "invalid distance too far back";
                state.mode = BAD;
                break;
              }
            }
            if (copy > state.wnext) {
              copy -= state.wnext;
              from = state.wsize - copy;
            } else {
              from = state.wnext - copy;
            }
            if (copy > state.length) {
              copy = state.length;
            }
            from_source = state.window;
          } else {
            from_source = output;
            from = put - state.offset;
            copy = state.length;
          }
          if (copy > left) {
            copy = left;
          }
          left -= copy;
          state.length -= copy;
          do {
            output[put++] = from_source[from++];
          } while (--copy);
          if (state.length === 0) {
            state.mode = LEN;
          }
          break;
        case LIT:
          if (left === 0) {
            break inf_leave;
          }
          output[put++] = state.length;
          left--;
          state.mode = LEN;
          break;
        case CHECK:
          if (state.wrap) {
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold |= input[next++] << bits;
              bits += 8;
            }
            _out -= left;
            strm.total_out += _out;
            state.total += _out;
            if (state.wrap & 4 && _out) {
              strm.adler = state.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
              state.flags ? crc32_1(state.check, output, _out, put - _out) : adler32_1(state.check, output, _out, put - _out);
            }
            _out = left;
            if (state.wrap & 4 && (state.flags ? hold : zswap32(hold)) !== state.check) {
              strm.msg = "incorrect data check";
              state.mode = BAD;
              break;
            }
            hold = 0;
            bits = 0;
          }
          state.mode = LENGTH;
        case LENGTH:
          if (state.wrap && state.flags) {
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (state.wrap & 4 && hold !== (state.total & 4294967295)) {
              strm.msg = "incorrect length check";
              state.mode = BAD;
              break;
            }
            hold = 0;
            bits = 0;
          }
          state.mode = DONE;
        case DONE:
          ret = Z_STREAM_END$1;
          break inf_leave;
        case BAD:
          ret = Z_DATA_ERROR$1;
          break inf_leave;
        case MEM:
          return Z_MEM_ERROR$1;
        case SYNC:
        default:
          return Z_STREAM_ERROR$1;
      }
    }
  strm.next_out = put;
  strm.avail_out = left;
  strm.next_in = next;
  strm.avail_in = have;
  state.hold = hold;
  state.bits = bits;
  if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH$1)) {
    if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) ;
  }
  _in -= strm.avail_in;
  _out -= strm.avail_out;
  strm.total_in += _in;
  strm.total_out += _out;
  state.total += _out;
  if (state.wrap & 4 && _out) {
    strm.adler = state.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
    state.flags ? crc32_1(state.check, output, _out, strm.next_out - _out) : adler32_1(state.check, output, _out, strm.next_out - _out);
  }
  strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
  if ((_in === 0 && _out === 0 || flush === Z_FINISH$1) && ret === Z_OK$1) {
    ret = Z_BUF_ERROR;
  }
  return ret;
};
const inflateEnd = (strm) => {
  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }
  let state = strm.state;
  if (state.window) {
    state.window = null;
  }
  strm.state = null;
  return Z_OK$1;
};
const inflateGetHeader = (strm, head) => {
  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }
  const state = strm.state;
  if ((state.wrap & 2) === 0) {
    return Z_STREAM_ERROR$1;
  }
  state.head = head;
  head.done = false;
  return Z_OK$1;
};
const inflateSetDictionary = (strm, dictionary) => {
  const dictLength = dictionary.length;
  let state;
  let dictid;
  let ret;
  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }
  state = strm.state;
  if (state.wrap !== 0 && state.mode !== DICT) {
    return Z_STREAM_ERROR$1;
  }
  if (state.mode === DICT) {
    dictid = 1;
    dictid = adler32_1(dictid, dictionary, dictLength, 0);
    if (dictid !== state.check) {
      return Z_DATA_ERROR$1;
    }
  }
  ret = updatewindow(strm, dictionary, dictLength, dictLength);
  if (ret) {
    state.mode = MEM;
    return Z_MEM_ERROR$1;
  }
  state.havedict = 1;
  return Z_OK$1;
};
var inflateReset_1 = inflateReset;
var inflateReset2_1 = inflateReset2;
var inflateResetKeep_1 = inflateResetKeep;
var inflateInit_1 = inflateInit;
var inflateInit2_1 = inflateInit2;
var inflate_2$1 = inflate$2;
var inflateEnd_1 = inflateEnd;
var inflateGetHeader_1 = inflateGetHeader;
var inflateSetDictionary_1 = inflateSetDictionary;
var inflateInfo = "pako inflate (from Nodeca project)";
var inflate_1$2 = {
  inflateReset: inflateReset_1,
  inflateReset2: inflateReset2_1,
  inflateResetKeep: inflateResetKeep_1,
  inflateInit: inflateInit_1,
  inflateInit2: inflateInit2_1,
  inflate: inflate_2$1,
  inflateEnd: inflateEnd_1,
  inflateGetHeader: inflateGetHeader_1,
  inflateSetDictionary: inflateSetDictionary_1,
  inflateInfo
};
function GZheader() {
  this.text = 0;
  this.time = 0;
  this.xflags = 0;
  this.os = 0;
  this.extra = null;
  this.extra_len = 0;
  this.name = "";
  this.comment = "";
  this.hcrc = 0;
  this.done = false;
}
var gzheader = GZheader;
const toString$2 = Object.prototype.toString;
const {
  Z_NO_FLUSH,
  Z_FINISH,
  Z_OK,
  Z_STREAM_END,
  Z_NEED_DICT,
  Z_STREAM_ERROR,
  Z_DATA_ERROR,
  Z_MEM_ERROR
} = constants$2;
function Inflate$1(options) {
  this.options = common.assign({
    chunkSize: 1024 * 64,
    windowBits: 15,
    to: ""
  }, options || {});
  const opt = this.options;
  if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
    opt.windowBits = -opt.windowBits;
    if (opt.windowBits === 0) {
      opt.windowBits = -15;
    }
  }
  if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
    opt.windowBits += 32;
  }
  if (opt.windowBits > 15 && opt.windowBits < 48) {
    if ((opt.windowBits & 15) === 0) {
      opt.windowBits |= 15;
    }
  }
  this.err = 0;
  this.msg = "";
  this.ended = false;
  this.chunks = [];
  this.strm = new zstream();
  this.strm.avail_out = 0;
  let status = inflate_1$2.inflateInit2(
    this.strm,
    opt.windowBits
  );
  if (status !== Z_OK) {
    throw new Error(messages[status]);
  }
  this.header = new gzheader();
  inflate_1$2.inflateGetHeader(this.strm, this.header);
  if (opt.dictionary) {
    if (typeof opt.dictionary === "string") {
      opt.dictionary = strings.string2buf(opt.dictionary);
    } else if (toString$2.call(opt.dictionary) === "[object ArrayBuffer]") {
      opt.dictionary = new Uint8Array(opt.dictionary);
    }
    if (opt.raw) {
      status = inflate_1$2.inflateSetDictionary(this.strm, opt.dictionary);
      if (status !== Z_OK) {
        throw new Error(messages[status]);
      }
    }
  }
}
Inflate$1.prototype.push = function(data, flush_mode) {
  const strm = this.strm;
  const chunkSize = this.options.chunkSize;
  const dictionary = this.options.dictionary;
  let status, _flush_mode, last_avail_out;
  if (this.ended) return false;
  if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;
  else _flush_mode = flush_mode === true ? Z_FINISH : Z_NO_FLUSH;
  if (toString$2.call(data) === "[object ArrayBuffer]") {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }
  strm.next_in = 0;
  strm.avail_in = strm.input.length;
  for (; ; ) {
    if (strm.avail_out === 0) {
      strm.output = new Uint8Array(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }
    status = inflate_1$2.inflate(strm, _flush_mode);
    if (status === Z_NEED_DICT && dictionary) {
      status = inflate_1$2.inflateSetDictionary(strm, dictionary);
      if (status === Z_OK) {
        status = inflate_1$2.inflate(strm, _flush_mode);
      } else if (status === Z_DATA_ERROR) {
        status = Z_NEED_DICT;
      }
    }
    while (strm.avail_in > 0 && status === Z_STREAM_END && strm.state.wrap > 0 && data[strm.next_in] !== 0) {
      inflate_1$2.inflateReset(strm);
      status = inflate_1$2.inflate(strm, _flush_mode);
    }
    switch (status) {
      case Z_STREAM_ERROR:
      case Z_DATA_ERROR:
      case Z_NEED_DICT:
      case Z_MEM_ERROR:
        this.onEnd(status);
        this.ended = true;
        return false;
    }
    last_avail_out = strm.avail_out;
    if (strm.next_out) {
      if (strm.avail_out === 0 || status === Z_STREAM_END) {
        if (this.options.to === "string") {
          let next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
          let tail = strm.next_out - next_out_utf8;
          let utf8str = strings.buf2string(strm.output, next_out_utf8);
          strm.next_out = tail;
          strm.avail_out = chunkSize - tail;
          if (tail) strm.output.set(strm.output.subarray(next_out_utf8, next_out_utf8 + tail), 0);
          this.onData(utf8str);
        } else {
          this.onData(strm.output.length === strm.next_out ? strm.output : strm.output.subarray(0, strm.next_out));
        }
      }
    }
    if (status === Z_OK && last_avail_out === 0) continue;
    if (status === Z_STREAM_END) {
      status = inflate_1$2.inflateEnd(this.strm);
      this.onEnd(status);
      this.ended = true;
      return true;
    }
    if (strm.avail_in === 0) break;
  }
  return true;
};
Inflate$1.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};
Inflate$1.prototype.onEnd = function(status) {
  if (status === Z_OK) {
    if (this.options.to === "string") {
      this.result = this.chunks.join("");
    } else {
      this.result = common.flattenChunks(this.chunks);
    }
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};
function inflate$1(input, options) {
  const inflator = new Inflate$1(options);
  inflator.push(input);
  if (inflator.err) throw inflator.msg || messages[inflator.err];
  return inflator.result;
}
function inflateRaw$1(input, options) {
  options = options || {};
  options.raw = true;
  return inflate$1(input, options);
}
var Inflate_1$1 = Inflate$1;
var inflate_2 = inflate$1;
var inflateRaw_1$1 = inflateRaw$1;
var ungzip$1 = inflate$1;
var constants = constants$2;
var inflate_1$1 = {
  Inflate: Inflate_1$1,
  inflate: inflate_2,
  inflateRaw: inflateRaw_1$1,
  ungzip: ungzip$1,
  constants
};
const { Deflate, deflate, deflateRaw, gzip } = deflate_1$1;
const { Inflate, inflate, inflateRaw, ungzip } = inflate_1$1;
var deflate_1 = deflate;
var Inflate_1 = Inflate;
var inflate_1 = inflate;
const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 3988292384 ^ c >>> 1;
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}
const initialCrc = 4294967295;
function updateCrc(currentCrc, data, length) {
  let c = currentCrc;
  for (let n = 0; n < length; n++) {
    c = crcTable[(c ^ data[n]) & 255] ^ c >>> 8;
  }
  return c;
}
function crc(data, length) {
  return (updateCrc(initialCrc, data, length) ^ initialCrc) >>> 0;
}
var ColorType;
(function(ColorType2) {
  ColorType2[ColorType2["UNKNOWN"] = -1] = "UNKNOWN";
  ColorType2[ColorType2["GREYSCALE"] = 0] = "GREYSCALE";
  ColorType2[ColorType2["TRUECOLOUR"] = 2] = "TRUECOLOUR";
  ColorType2[ColorType2["INDEXED_COLOUR"] = 3] = "INDEXED_COLOUR";
  ColorType2[ColorType2["GREYSCALE_ALPHA"] = 4] = "GREYSCALE_ALPHA";
  ColorType2[ColorType2["TRUECOLOUR_ALPHA"] = 6] = "TRUECOLOUR_ALPHA";
})(ColorType || (ColorType = {}));
var CompressionMethod;
(function(CompressionMethod2) {
  CompressionMethod2[CompressionMethod2["UNKNOWN"] = -1] = "UNKNOWN";
  CompressionMethod2[CompressionMethod2["DEFLATE"] = 0] = "DEFLATE";
})(CompressionMethod || (CompressionMethod = {}));
var FilterMethod;
(function(FilterMethod2) {
  FilterMethod2[FilterMethod2["UNKNOWN"] = -1] = "UNKNOWN";
  FilterMethod2[FilterMethod2["ADAPTIVE"] = 0] = "ADAPTIVE";
})(FilterMethod || (FilterMethod = {}));
var InterlaceMethod;
(function(InterlaceMethod2) {
  InterlaceMethod2[InterlaceMethod2["UNKNOWN"] = -1] = "UNKNOWN";
  InterlaceMethod2[InterlaceMethod2["NO_INTERLACE"] = 0] = "NO_INTERLACE";
  InterlaceMethod2[InterlaceMethod2["ADAM7"] = 1] = "ADAM7";
})(InterlaceMethod || (InterlaceMethod = {}));
const empty = new Uint8Array(0);
const NULL = "\0";
const uint16 = new Uint16Array([255]);
const uint8 = new Uint8Array(uint16.buffer);
const osIsLittleEndian = uint8[0] === 255;
class PngDecoder extends IOBuffer$4 {
  constructor(data, options = {}) {
    super(data);
    const { checkCrc = false } = options;
    this._checkCrc = checkCrc;
    this._inflator = new Inflate_1();
    this._png = {
      width: -1,
      height: -1,
      channels: -1,
      data: new Uint8Array(0),
      depth: 1,
      text: {}
    };
    this._end = false;
    this._hasPalette = false;
    this._palette = [];
    this._hasTransparency = false;
    this._transparency = new Uint16Array(0);
    this._compressionMethod = CompressionMethod.UNKNOWN;
    this._filterMethod = FilterMethod.UNKNOWN;
    this._interlaceMethod = InterlaceMethod.UNKNOWN;
    this._colorType = ColorType.UNKNOWN;
    this.setBigEndian();
  }
  decode() {
    this.decodeSignature();
    while (!this._end) {
      this.decodeChunk();
    }
    this.decodeImage();
    return this._png;
  }
  // https://www.w3.org/TR/PNG/#5PNG-file-signature
  decodeSignature() {
    for (let i2 = 0; i2 < pngSignature.length; i2++) {
      if (this.readUint8() !== pngSignature[i2]) {
        throw new Error(`wrong PNG signature. Byte at ${i2} should be ${pngSignature[i2]}.`);
      }
    }
  }
  // https://www.w3.org/TR/PNG/#5Chunk-layout
  decodeChunk() {
    const length = this.readUint32();
    const type = this.readChars(4);
    const offset = this.offset;
    switch (type) {
      case "IHDR":
        this.decodeIHDR();
        break;
      case "PLTE":
        this.decodePLTE(length);
        break;
      case "IDAT":
        this.decodeIDAT(length);
        break;
      case "IEND":
        this._end = true;
        break;
      case "tRNS":
        this.decodetRNS(length);
        break;
      case "iCCP":
        this.decodeiCCP(length);
        break;
      case "tEXt":
        this.decodetEXt(length);
        break;
      case "pHYs":
        this.decodepHYs();
        break;
      default:
        this.skip(length);
        break;
    }
    if (this.offset - offset !== length) {
      throw new Error(`Length mismatch while decoding chunk ${type}`);
    }
    if (this._checkCrc) {
      const expectedCrc = this.readUint32();
      const crcLength = length + 4;
      const actualCrc = crc(new Uint8Array(this.buffer, this.byteOffset + this.offset - crcLength - 4, crcLength), crcLength);
      if (actualCrc !== expectedCrc) {
        throw new Error(`CRC mismatch for chunk ${type}. Expected ${expectedCrc}, found ${actualCrc}`);
      }
    } else {
      this.skip(4);
    }
  }
  // https://www.w3.org/TR/PNG/#11IHDR
  decodeIHDR() {
    const image = this._png;
    image.width = this.readUint32();
    image.height = this.readUint32();
    image.depth = checkBitDepth(this.readUint8());
    const colorType = this.readUint8();
    this._colorType = colorType;
    let channels;
    switch (colorType) {
      case ColorType.GREYSCALE:
        channels = 1;
        break;
      case ColorType.TRUECOLOUR:
        channels = 3;
        break;
      case ColorType.INDEXED_COLOUR:
        channels = 1;
        break;
      case ColorType.GREYSCALE_ALPHA:
        channels = 2;
        break;
      case ColorType.TRUECOLOUR_ALPHA:
        channels = 4;
        break;
      default:
        throw new Error(`Unknown color type: ${colorType}`);
    }
    this._png.channels = channels;
    this._compressionMethod = this.readUint8();
    if (this._compressionMethod !== CompressionMethod.DEFLATE) {
      throw new Error(`Unsupported compression method: ${this._compressionMethod}`);
    }
    this._filterMethod = this.readUint8();
    this._interlaceMethod = this.readUint8();
  }
  // https://www.w3.org/TR/PNG/#11PLTE
  decodePLTE(length) {
    if (length % 3 !== 0) {
      throw new RangeError(`PLTE field length must be a multiple of 3. Got ${length}`);
    }
    const l = length / 3;
    this._hasPalette = true;
    const palette = [];
    this._palette = palette;
    for (let i2 = 0; i2 < l; i2++) {
      palette.push([this.readUint8(), this.readUint8(), this.readUint8()]);
    }
  }
  // https://www.w3.org/TR/PNG/#11IDAT
  decodeIDAT(length) {
    this._inflator.push(new Uint8Array(this.buffer, this.offset + this.byteOffset, length));
    this.skip(length);
  }
  // https://www.w3.org/TR/PNG/#11tRNS
  decodetRNS(length) {
    switch (this._colorType) {
      case ColorType.GREYSCALE:
      case ColorType.TRUECOLOUR: {
        if (length % 2 !== 0) {
          throw new RangeError(`tRNS chunk length must be a multiple of 2. Got ${length}`);
        }
        if (length / 2 > this._png.width * this._png.height) {
          throw new Error(`tRNS chunk contains more alpha values than there are pixels (${length / 2} vs ${this._png.width * this._png.height})`);
        }
        this._hasTransparency = true;
        this._transparency = new Uint16Array(length / 2);
        for (let i2 = 0; i2 < length / 2; i2++) {
          this._transparency[i2] = this.readUint16();
        }
        break;
      }
      case ColorType.INDEXED_COLOUR: {
        if (length > this._palette.length) {
          throw new Error(`tRNS chunk contains more alpha values than there are palette colors (${length} vs ${this._palette.length})`);
        }
        let i2 = 0;
        for (; i2 < length; i2++) {
          const alpha = this.readByte();
          this._palette[i2].push(alpha);
        }
        for (; i2 < this._palette.length; i2++) {
          this._palette[i2].push(255);
        }
        break;
      }
      default: {
        throw new Error(`tRNS chunk is not supported for color type ${this._colorType}`);
      }
    }
  }
  // https://www.w3.org/TR/PNG/#11iCCP
  decodeiCCP(length) {
    let name2 = "";
    let char;
    while ((char = this.readChar()) !== NULL) {
      name2 += char;
    }
    const compressionMethod = this.readUint8();
    if (compressionMethod !== CompressionMethod.DEFLATE) {
      throw new Error(`Unsupported iCCP compression method: ${compressionMethod}`);
    }
    const compressedProfile = this.readBytes(length - name2.length - 2);
    this._png.iccEmbeddedProfile = {
      name: name2,
      profile: inflate_1(compressedProfile)
    };
  }
  // https://www.w3.org/TR/PNG/#11tEXt
  decodetEXt(length) {
    let keyword = "";
    let char;
    while ((char = this.readChar()) !== NULL) {
      keyword += char;
    }
    this._png.text[keyword] = this.readChars(length - keyword.length - 1);
  }
  // https://www.w3.org/TR/PNG/#11pHYs
  decodepHYs() {
    const ppuX = this.readUint32();
    const ppuY = this.readUint32();
    const unitSpecifier = this.readByte();
    this._png.resolution = { x: ppuX, y: ppuY, unit: unitSpecifier };
  }
  decodeImage() {
    if (this._inflator.err) {
      throw new Error(`Error while decompressing the data: ${this._inflator.err}`);
    }
    const data = this._inflator.result;
    if (this._filterMethod !== FilterMethod.ADAPTIVE) {
      throw new Error(`Filter method ${this._filterMethod} not supported`);
    }
    if (this._interlaceMethod === InterlaceMethod.NO_INTERLACE) {
      this.decodeInterlaceNull(data);
    } else {
      throw new Error(`Interlace method ${this._interlaceMethod} not supported`);
    }
  }
  decodeInterlaceNull(data) {
    const height = this._png.height;
    const bytesPerPixel = this._png.channels * this._png.depth / 8;
    const bytesPerLine = this._png.width * bytesPerPixel;
    const newData = new Uint8Array(this._png.height * bytesPerLine);
    let prevLine = empty;
    let offset = 0;
    let currentLine;
    let newLine;
    for (let i2 = 0; i2 < height; i2++) {
      currentLine = data.subarray(offset + 1, offset + 1 + bytesPerLine);
      newLine = newData.subarray(i2 * bytesPerLine, (i2 + 1) * bytesPerLine);
      switch (data[offset]) {
        case 0:
          unfilterNone(currentLine, newLine, bytesPerLine);
          break;
        case 1:
          unfilterSub(currentLine, newLine, bytesPerLine, bytesPerPixel);
          break;
        case 2:
          unfilterUp(currentLine, newLine, prevLine, bytesPerLine);
          break;
        case 3:
          unfilterAverage(currentLine, newLine, prevLine, bytesPerLine, bytesPerPixel);
          break;
        case 4:
          unfilterPaeth(currentLine, newLine, prevLine, bytesPerLine, bytesPerPixel);
          break;
        default:
          throw new Error(`Unsupported filter: ${data[offset]}`);
      }
      prevLine = newLine;
      offset += bytesPerLine + 1;
    }
    if (this._hasPalette) {
      this._png.palette = this._palette;
    }
    if (this._hasTransparency) {
      this._png.transparency = this._transparency;
    }
    if (this._png.depth === 16) {
      const uint16Data = new Uint16Array(newData.buffer);
      if (osIsLittleEndian) {
        for (let k = 0; k < uint16Data.length; k++) {
          uint16Data[k] = swap16(uint16Data[k]);
        }
      }
      this._png.data = uint16Data;
    } else {
      this._png.data = newData;
    }
  }
}
function unfilterNone(currentLine, newLine, bytesPerLine) {
  for (let i2 = 0; i2 < bytesPerLine; i2++) {
    newLine[i2] = currentLine[i2];
  }
}
function unfilterSub(currentLine, newLine, bytesPerLine, bytesPerPixel) {
  let i2 = 0;
  for (; i2 < bytesPerPixel; i2++) {
    newLine[i2] = currentLine[i2];
  }
  for (; i2 < bytesPerLine; i2++) {
    newLine[i2] = currentLine[i2] + newLine[i2 - bytesPerPixel] & 255;
  }
}
function unfilterUp(currentLine, newLine, prevLine, bytesPerLine) {
  let i2 = 0;
  if (prevLine.length === 0) {
    for (; i2 < bytesPerLine; i2++) {
      newLine[i2] = currentLine[i2];
    }
  } else {
    for (; i2 < bytesPerLine; i2++) {
      newLine[i2] = currentLine[i2] + prevLine[i2] & 255;
    }
  }
}
function unfilterAverage(currentLine, newLine, prevLine, bytesPerLine, bytesPerPixel) {
  let i2 = 0;
  if (prevLine.length === 0) {
    for (; i2 < bytesPerPixel; i2++) {
      newLine[i2] = currentLine[i2];
    }
    for (; i2 < bytesPerLine; i2++) {
      newLine[i2] = currentLine[i2] + (newLine[i2 - bytesPerPixel] >> 1) & 255;
    }
  } else {
    for (; i2 < bytesPerPixel; i2++) {
      newLine[i2] = currentLine[i2] + (prevLine[i2] >> 1) & 255;
    }
    for (; i2 < bytesPerLine; i2++) {
      newLine[i2] = currentLine[i2] + (newLine[i2 - bytesPerPixel] + prevLine[i2] >> 1) & 255;
    }
  }
}
function unfilterPaeth(currentLine, newLine, prevLine, bytesPerLine, bytesPerPixel) {
  let i2 = 0;
  if (prevLine.length === 0) {
    for (; i2 < bytesPerPixel; i2++) {
      newLine[i2] = currentLine[i2];
    }
    for (; i2 < bytesPerLine; i2++) {
      newLine[i2] = currentLine[i2] + newLine[i2 - bytesPerPixel] & 255;
    }
  } else {
    for (; i2 < bytesPerPixel; i2++) {
      newLine[i2] = currentLine[i2] + prevLine[i2] & 255;
    }
    for (; i2 < bytesPerLine; i2++) {
      newLine[i2] = currentLine[i2] + paethPredictor(newLine[i2 - bytesPerPixel], prevLine[i2], prevLine[i2 - bytesPerPixel]) & 255;
    }
  }
}
function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc)
    return a;
  else if (pb <= pc)
    return b;
  else
    return c;
}
function swap16(val) {
  return (val & 255) << 8 | val >> 8 & 255;
}
function checkBitDepth(value) {
  if (value !== 1 && value !== 2 && value !== 4 && value !== 8 && value !== 16) {
    throw new Error(`invalid bit depth: ${value}`);
  }
  return value;
}
const defaultZlibOptions = {
  level: 3
};
class PngEncoder extends IOBuffer$4 {
  constructor(data, options = {}) {
    super();
    this._colorType = ColorType.UNKNOWN;
    this._zlibOptions = { ...defaultZlibOptions, ...options.zlib };
    this._png = this._checkData(data);
    this.setBigEndian();
  }
  encode() {
    this.encodeSignature();
    this.encodeIHDR();
    this.encodeData();
    this.encodeIEND();
    return this.toArray();
  }
  // https://www.w3.org/TR/PNG/#5PNG-file-signature
  encodeSignature() {
    this.writeBytes(pngSignature);
  }
  // https://www.w3.org/TR/PNG/#11IHDR
  encodeIHDR() {
    this.writeUint32(13);
    this.writeChars("IHDR");
    this.writeUint32(this._png.width);
    this.writeUint32(this._png.height);
    this.writeByte(this._png.depth);
    this.writeByte(this._colorType);
    this.writeByte(CompressionMethod.DEFLATE);
    this.writeByte(FilterMethod.ADAPTIVE);
    this.writeByte(InterlaceMethod.NO_INTERLACE);
    this.writeCrc(17);
  }
  // https://www.w3.org/TR/PNG/#11IEND
  encodeIEND() {
    this.writeUint32(0);
    this.writeChars("IEND");
    this.writeCrc(4);
  }
  // https://www.w3.org/TR/PNG/#11IDAT
  encodeIDAT(data) {
    this.writeUint32(data.length);
    this.writeChars("IDAT");
    this.writeBytes(data);
    this.writeCrc(data.length + 4);
  }
  encodeData() {
    const { width, height, channels, depth, data } = this._png;
    const slotsPerLine = channels * width;
    const newData = new IOBuffer$4().setBigEndian();
    let offset = 0;
    for (let i2 = 0; i2 < height; i2++) {
      newData.writeByte(0);
      if (depth === 8) {
        offset = writeDataBytes(data, newData, slotsPerLine, offset);
      } else if (depth === 16) {
        offset = writeDataUint16(data, newData, slotsPerLine, offset);
      } else {
        throw new Error("unreachable");
      }
    }
    const buffer = newData.toArray();
    const compressed = deflate_1(buffer, this._zlibOptions);
    this.encodeIDAT(compressed);
  }
  _checkData(data) {
    const { colorType, channels, depth } = getColorType(data);
    const png = {
      width: checkInteger(data.width, "width"),
      height: checkInteger(data.height, "height"),
      channels,
      data: data.data,
      depth,
      text: {}
    };
    this._colorType = colorType;
    const expectedSize = png.width * png.height * channels;
    if (png.data.length !== expectedSize) {
      throw new RangeError(`wrong data size. Found ${png.data.length}, expected ${expectedSize}`);
    }
    return png;
  }
  writeCrc(length) {
    this.writeUint32(crc(new Uint8Array(this.buffer, this.byteOffset + this.offset - length, length), length));
  }
}
function checkInteger(value, name2) {
  if (Number.isInteger(value) && value > 0) {
    return value;
  }
  throw new TypeError(`${name2} must be a positive integer`);
}
function getColorType(data) {
  const { channels = 4, depth = 8 } = data;
  if (channels !== 4 && channels !== 3 && channels !== 2 && channels !== 1) {
    throw new RangeError(`unsupported number of channels: ${channels}`);
  }
  if (depth !== 8 && depth !== 16) {
    throw new RangeError(`unsupported bit depth: ${depth}`);
  }
  const returnValue = { channels, depth, colorType: ColorType.UNKNOWN };
  switch (channels) {
    case 4:
      returnValue.colorType = ColorType.TRUECOLOUR_ALPHA;
      break;
    case 3:
      returnValue.colorType = ColorType.TRUECOLOUR;
      break;
    case 1:
      returnValue.colorType = ColorType.GREYSCALE;
      break;
    case 2:
      returnValue.colorType = ColorType.GREYSCALE_ALPHA;
      break;
    default:
      throw new Error("unsupported number of channels");
  }
  return returnValue;
}
function writeDataBytes(data, newData, slotsPerLine, offset) {
  for (let j = 0; j < slotsPerLine; j++) {
    newData.writeByte(data[offset++]);
  }
  return offset;
}
function writeDataUint16(data, newData, slotsPerLine, offset) {
  for (let j = 0; j < slotsPerLine; j++) {
    newData.writeUint16(data[offset++]);
  }
  return offset;
}
var ResolutionUnitSpecifier;
(function(ResolutionUnitSpecifier2) {
  ResolutionUnitSpecifier2[ResolutionUnitSpecifier2["UNKNOWN"] = 0] = "UNKNOWN";
  ResolutionUnitSpecifier2[ResolutionUnitSpecifier2["METRE"] = 1] = "METRE";
})(ResolutionUnitSpecifier || (ResolutionUnitSpecifier = {}));
function decodePng(data, options) {
  const decoder2 = new PngDecoder(data, options);
  return decoder2.decode();
}
function encodePng$1(png, options) {
  const encoder2 = new PngEncoder(png, options);
  return encoder2.encode();
}
var encoder = { exports: {} };
(function(module2) {
  function JPEGEncoder(quality) {
    var ffloor = Math.floor;
    var YTable = new Array(64);
    var UVTable = new Array(64);
    var fdtbl_Y = new Array(64);
    var fdtbl_UV = new Array(64);
    var YDC_HT;
    var UVDC_HT;
    var YAC_HT;
    var UVAC_HT;
    var bitcode = new Array(65535);
    var category = new Array(65535);
    var outputfDCTQuant = new Array(64);
    var DU = new Array(64);
    var byteout = [];
    var bytenew = 0;
    var bytepos = 7;
    var YDU = new Array(64);
    var UDU = new Array(64);
    var VDU = new Array(64);
    var clt = new Array(256);
    var RGB_YUV_TABLE = new Array(2048);
    var currentQuality;
    var ZigZag = [
      0,
      1,
      5,
      6,
      14,
      15,
      27,
      28,
      2,
      4,
      7,
      13,
      16,
      26,
      29,
      42,
      3,
      8,
      12,
      17,
      25,
      30,
      41,
      43,
      9,
      11,
      18,
      24,
      31,
      40,
      44,
      53,
      10,
      19,
      23,
      32,
      39,
      45,
      52,
      54,
      20,
      22,
      33,
      38,
      46,
      51,
      55,
      60,
      21,
      34,
      37,
      47,
      50,
      56,
      59,
      61,
      35,
      36,
      48,
      49,
      57,
      58,
      62,
      63
    ];
    var std_dc_luminance_nrcodes = [0, 0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
    var std_dc_luminance_values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    var std_ac_luminance_nrcodes = [0, 0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 125];
    var std_ac_luminance_values = [
      1,
      2,
      3,
      0,
      4,
      17,
      5,
      18,
      33,
      49,
      65,
      6,
      19,
      81,
      97,
      7,
      34,
      113,
      20,
      50,
      129,
      145,
      161,
      8,
      35,
      66,
      177,
      193,
      21,
      82,
      209,
      240,
      36,
      51,
      98,
      114,
      130,
      9,
      10,
      22,
      23,
      24,
      25,
      26,
      37,
      38,
      39,
      40,
      41,
      42,
      52,
      53,
      54,
      55,
      56,
      57,
      58,
      67,
      68,
      69,
      70,
      71,
      72,
      73,
      74,
      83,
      84,
      85,
      86,
      87,
      88,
      89,
      90,
      99,
      100,
      101,
      102,
      103,
      104,
      105,
      106,
      115,
      116,
      117,
      118,
      119,
      120,
      121,
      122,
      131,
      132,
      133,
      134,
      135,
      136,
      137,
      138,
      146,
      147,
      148,
      149,
      150,
      151,
      152,
      153,
      154,
      162,
      163,
      164,
      165,
      166,
      167,
      168,
      169,
      170,
      178,
      179,
      180,
      181,
      182,
      183,
      184,
      185,
      186,
      194,
      195,
      196,
      197,
      198,
      199,
      200,
      201,
      202,
      210,
      211,
      212,
      213,
      214,
      215,
      216,
      217,
      218,
      225,
      226,
      227,
      228,
      229,
      230,
      231,
      232,
      233,
      234,
      241,
      242,
      243,
      244,
      245,
      246,
      247,
      248,
      249,
      250
    ];
    var std_dc_chrominance_nrcodes = [0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
    var std_dc_chrominance_values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    var std_ac_chrominance_nrcodes = [0, 0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 119];
    var std_ac_chrominance_values = [
      0,
      1,
      2,
      3,
      17,
      4,
      5,
      33,
      49,
      6,
      18,
      65,
      81,
      7,
      97,
      113,
      19,
      34,
      50,
      129,
      8,
      20,
      66,
      145,
      161,
      177,
      193,
      9,
      35,
      51,
      82,
      240,
      21,
      98,
      114,
      209,
      10,
      22,
      36,
      52,
      225,
      37,
      241,
      23,
      24,
      25,
      26,
      38,
      39,
      40,
      41,
      42,
      53,
      54,
      55,
      56,
      57,
      58,
      67,
      68,
      69,
      70,
      71,
      72,
      73,
      74,
      83,
      84,
      85,
      86,
      87,
      88,
      89,
      90,
      99,
      100,
      101,
      102,
      103,
      104,
      105,
      106,
      115,
      116,
      117,
      118,
      119,
      120,
      121,
      122,
      130,
      131,
      132,
      133,
      134,
      135,
      136,
      137,
      138,
      146,
      147,
      148,
      149,
      150,
      151,
      152,
      153,
      154,
      162,
      163,
      164,
      165,
      166,
      167,
      168,
      169,
      170,
      178,
      179,
      180,
      181,
      182,
      183,
      184,
      185,
      186,
      194,
      195,
      196,
      197,
      198,
      199,
      200,
      201,
      202,
      210,
      211,
      212,
      213,
      214,
      215,
      216,
      217,
      218,
      226,
      227,
      228,
      229,
      230,
      231,
      232,
      233,
      234,
      242,
      243,
      244,
      245,
      246,
      247,
      248,
      249,
      250
    ];
    function initQuantTables(sf) {
      var YQT = [
        16,
        11,
        10,
        16,
        24,
        40,
        51,
        61,
        12,
        12,
        14,
        19,
        26,
        58,
        60,
        55,
        14,
        13,
        16,
        24,
        40,
        57,
        69,
        56,
        14,
        17,
        22,
        29,
        51,
        87,
        80,
        62,
        18,
        22,
        37,
        56,
        68,
        109,
        103,
        77,
        24,
        35,
        55,
        64,
        81,
        104,
        113,
        92,
        49,
        64,
        78,
        87,
        103,
        121,
        120,
        101,
        72,
        92,
        95,
        98,
        112,
        100,
        103,
        99
      ];
      for (var i2 = 0; i2 < 64; i2++) {
        var t = ffloor((YQT[i2] * sf + 50) / 100);
        if (t < 1) {
          t = 1;
        } else if (t > 255) {
          t = 255;
        }
        YTable[ZigZag[i2]] = t;
      }
      var UVQT = [
        17,
        18,
        24,
        47,
        99,
        99,
        99,
        99,
        18,
        21,
        26,
        66,
        99,
        99,
        99,
        99,
        24,
        26,
        56,
        99,
        99,
        99,
        99,
        99,
        47,
        66,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99,
        99
      ];
      for (var j = 0; j < 64; j++) {
        var u = ffloor((UVQT[j] * sf + 50) / 100);
        if (u < 1) {
          u = 1;
        } else if (u > 255) {
          u = 255;
        }
        UVTable[ZigZag[j]] = u;
      }
      var aasf = [
        1,
        1.387039845,
        1.306562965,
        1.175875602,
        1,
        0.785694958,
        0.5411961,
        0.275899379
      ];
      var k = 0;
      for (var row = 0; row < 8; row++) {
        for (var col = 0; col < 8; col++) {
          fdtbl_Y[k] = 1 / (YTable[ZigZag[k]] * aasf[row] * aasf[col] * 8);
          fdtbl_UV[k] = 1 / (UVTable[ZigZag[k]] * aasf[row] * aasf[col] * 8);
          k++;
        }
      }
    }
    function computeHuffmanTbl(nrcodes, std_table) {
      var codevalue = 0;
      var pos_in_table = 0;
      var HT = new Array();
      for (var k = 1; k <= 16; k++) {
        for (var j = 1; j <= nrcodes[k]; j++) {
          HT[std_table[pos_in_table]] = [];
          HT[std_table[pos_in_table]][0] = codevalue;
          HT[std_table[pos_in_table]][1] = k;
          pos_in_table++;
          codevalue++;
        }
        codevalue *= 2;
      }
      return HT;
    }
    function initHuffmanTbl() {
      YDC_HT = computeHuffmanTbl(std_dc_luminance_nrcodes, std_dc_luminance_values);
      UVDC_HT = computeHuffmanTbl(std_dc_chrominance_nrcodes, std_dc_chrominance_values);
      YAC_HT = computeHuffmanTbl(std_ac_luminance_nrcodes, std_ac_luminance_values);
      UVAC_HT = computeHuffmanTbl(std_ac_chrominance_nrcodes, std_ac_chrominance_values);
    }
    function initCategoryNumber() {
      var nrlower = 1;
      var nrupper = 2;
      for (var cat = 1; cat <= 15; cat++) {
        for (var nr = nrlower; nr < nrupper; nr++) {
          category[32767 + nr] = cat;
          bitcode[32767 + nr] = [];
          bitcode[32767 + nr][1] = cat;
          bitcode[32767 + nr][0] = nr;
        }
        for (var nrneg = -(nrupper - 1); nrneg <= -nrlower; nrneg++) {
          category[32767 + nrneg] = cat;
          bitcode[32767 + nrneg] = [];
          bitcode[32767 + nrneg][1] = cat;
          bitcode[32767 + nrneg][0] = nrupper - 1 + nrneg;
        }
        nrlower <<= 1;
        nrupper <<= 1;
      }
    }
    function initRGBYUVTable() {
      for (var i2 = 0; i2 < 256; i2++) {
        RGB_YUV_TABLE[i2] = 19595 * i2;
        RGB_YUV_TABLE[i2 + 256 >> 0] = 38470 * i2;
        RGB_YUV_TABLE[i2 + 512 >> 0] = 7471 * i2 + 32768;
        RGB_YUV_TABLE[i2 + 768 >> 0] = -11059 * i2;
        RGB_YUV_TABLE[i2 + 1024 >> 0] = -21709 * i2;
        RGB_YUV_TABLE[i2 + 1280 >> 0] = 32768 * i2 + 8421375;
        RGB_YUV_TABLE[i2 + 1536 >> 0] = -27439 * i2;
        RGB_YUV_TABLE[i2 + 1792 >> 0] = -5329 * i2;
      }
    }
    function writeBits(bs) {
      var value = bs[0];
      var posval = bs[1] - 1;
      while (posval >= 0) {
        if (value & 1 << posval) {
          bytenew |= 1 << bytepos;
        }
        posval--;
        bytepos--;
        if (bytepos < 0) {
          if (bytenew == 255) {
            writeByte(255);
            writeByte(0);
          } else {
            writeByte(bytenew);
          }
          bytepos = 7;
          bytenew = 0;
        }
      }
    }
    function writeByte(value) {
      byteout.push(value);
    }
    function writeWord(value) {
      writeByte(value >> 8 & 255);
      writeByte(value & 255);
    }
    function fDCTQuant(data, fdtbl) {
      var d0, d1, d2, d3, d4, d5, d6, d7;
      var dataOff = 0;
      var i2;
      var I8 = 8;
      var I64 = 64;
      for (i2 = 0; i2 < I8; ++i2) {
        d0 = data[dataOff];
        d1 = data[dataOff + 1];
        d2 = data[dataOff + 2];
        d3 = data[dataOff + 3];
        d4 = data[dataOff + 4];
        d5 = data[dataOff + 5];
        d6 = data[dataOff + 6];
        d7 = data[dataOff + 7];
        var tmp0 = d0 + d7;
        var tmp7 = d0 - d7;
        var tmp1 = d1 + d6;
        var tmp6 = d1 - d6;
        var tmp2 = d2 + d5;
        var tmp5 = d2 - d5;
        var tmp3 = d3 + d4;
        var tmp4 = d3 - d4;
        var tmp10 = tmp0 + tmp3;
        var tmp13 = tmp0 - tmp3;
        var tmp11 = tmp1 + tmp2;
        var tmp12 = tmp1 - tmp2;
        data[dataOff] = tmp10 + tmp11;
        data[dataOff + 4] = tmp10 - tmp11;
        var z1 = (tmp12 + tmp13) * 0.707106781;
        data[dataOff + 2] = tmp13 + z1;
        data[dataOff + 6] = tmp13 - z1;
        tmp10 = tmp4 + tmp5;
        tmp11 = tmp5 + tmp6;
        tmp12 = tmp6 + tmp7;
        var z5 = (tmp10 - tmp12) * 0.382683433;
        var z2 = 0.5411961 * tmp10 + z5;
        var z4 = 1.306562965 * tmp12 + z5;
        var z3 = tmp11 * 0.707106781;
        var z11 = tmp7 + z3;
        var z13 = tmp7 - z3;
        data[dataOff + 5] = z13 + z2;
        data[dataOff + 3] = z13 - z2;
        data[dataOff + 1] = z11 + z4;
        data[dataOff + 7] = z11 - z4;
        dataOff += 8;
      }
      dataOff = 0;
      for (i2 = 0; i2 < I8; ++i2) {
        d0 = data[dataOff];
        d1 = data[dataOff + 8];
        d2 = data[dataOff + 16];
        d3 = data[dataOff + 24];
        d4 = data[dataOff + 32];
        d5 = data[dataOff + 40];
        d6 = data[dataOff + 48];
        d7 = data[dataOff + 56];
        var tmp0p2 = d0 + d7;
        var tmp7p2 = d0 - d7;
        var tmp1p2 = d1 + d6;
        var tmp6p2 = d1 - d6;
        var tmp2p2 = d2 + d5;
        var tmp5p2 = d2 - d5;
        var tmp3p2 = d3 + d4;
        var tmp4p2 = d3 - d4;
        var tmp10p2 = tmp0p2 + tmp3p2;
        var tmp13p2 = tmp0p2 - tmp3p2;
        var tmp11p2 = tmp1p2 + tmp2p2;
        var tmp12p2 = tmp1p2 - tmp2p2;
        data[dataOff] = tmp10p2 + tmp11p2;
        data[dataOff + 32] = tmp10p2 - tmp11p2;
        var z1p2 = (tmp12p2 + tmp13p2) * 0.707106781;
        data[dataOff + 16] = tmp13p2 + z1p2;
        data[dataOff + 48] = tmp13p2 - z1p2;
        tmp10p2 = tmp4p2 + tmp5p2;
        tmp11p2 = tmp5p2 + tmp6p2;
        tmp12p2 = tmp6p2 + tmp7p2;
        var z5p2 = (tmp10p2 - tmp12p2) * 0.382683433;
        var z2p2 = 0.5411961 * tmp10p2 + z5p2;
        var z4p2 = 1.306562965 * tmp12p2 + z5p2;
        var z3p2 = tmp11p2 * 0.707106781;
        var z11p2 = tmp7p2 + z3p2;
        var z13p2 = tmp7p2 - z3p2;
        data[dataOff + 40] = z13p2 + z2p2;
        data[dataOff + 24] = z13p2 - z2p2;
        data[dataOff + 8] = z11p2 + z4p2;
        data[dataOff + 56] = z11p2 - z4p2;
        dataOff++;
      }
      var fDCTQuant2;
      for (i2 = 0; i2 < I64; ++i2) {
        fDCTQuant2 = data[i2] * fdtbl[i2];
        outputfDCTQuant[i2] = fDCTQuant2 > 0 ? fDCTQuant2 + 0.5 | 0 : fDCTQuant2 - 0.5 | 0;
      }
      return outputfDCTQuant;
    }
    function writeAPP0() {
      writeWord(65504);
      writeWord(16);
      writeByte(74);
      writeByte(70);
      writeByte(73);
      writeByte(70);
      writeByte(0);
      writeByte(1);
      writeByte(1);
      writeByte(0);
      writeWord(1);
      writeWord(1);
      writeByte(0);
      writeByte(0);
    }
    function writeAPP1(exifBuffer) {
      if (!exifBuffer) return;
      writeWord(65505);
      if (exifBuffer[0] === 69 && exifBuffer[1] === 120 && exifBuffer[2] === 105 && exifBuffer[3] === 102) {
        writeWord(exifBuffer.length + 2);
      } else {
        writeWord(exifBuffer.length + 5 + 2);
        writeByte(69);
        writeByte(120);
        writeByte(105);
        writeByte(102);
        writeByte(0);
      }
      for (var i2 = 0; i2 < exifBuffer.length; i2++) {
        writeByte(exifBuffer[i2]);
      }
    }
    function writeSOF0(width, height) {
      writeWord(65472);
      writeWord(17);
      writeByte(8);
      writeWord(height);
      writeWord(width);
      writeByte(3);
      writeByte(1);
      writeByte(17);
      writeByte(0);
      writeByte(2);
      writeByte(17);
      writeByte(1);
      writeByte(3);
      writeByte(17);
      writeByte(1);
    }
    function writeDQT() {
      writeWord(65499);
      writeWord(132);
      writeByte(0);
      for (var i2 = 0; i2 < 64; i2++) {
        writeByte(YTable[i2]);
      }
      writeByte(1);
      for (var j = 0; j < 64; j++) {
        writeByte(UVTable[j]);
      }
    }
    function writeDHT() {
      writeWord(65476);
      writeWord(418);
      writeByte(0);
      for (var i2 = 0; i2 < 16; i2++) {
        writeByte(std_dc_luminance_nrcodes[i2 + 1]);
      }
      for (var j = 0; j <= 11; j++) {
        writeByte(std_dc_luminance_values[j]);
      }
      writeByte(16);
      for (var k = 0; k < 16; k++) {
        writeByte(std_ac_luminance_nrcodes[k + 1]);
      }
      for (var l = 0; l <= 161; l++) {
        writeByte(std_ac_luminance_values[l]);
      }
      writeByte(1);
      for (var m = 0; m < 16; m++) {
        writeByte(std_dc_chrominance_nrcodes[m + 1]);
      }
      for (var n = 0; n <= 11; n++) {
        writeByte(std_dc_chrominance_values[n]);
      }
      writeByte(17);
      for (var o = 0; o < 16; o++) {
        writeByte(std_ac_chrominance_nrcodes[o + 1]);
      }
      for (var p = 0; p <= 161; p++) {
        writeByte(std_ac_chrominance_values[p]);
      }
    }
    function writeCOM(comments) {
      if (typeof comments === "undefined" || comments.constructor !== Array) return;
      comments.forEach((e) => {
        if (typeof e !== "string") return;
        writeWord(65534);
        var l = e.length;
        writeWord(l + 2);
        var i2;
        for (i2 = 0; i2 < l; i2++)
          writeByte(e.charCodeAt(i2));
      });
    }
    function writeSOS() {
      writeWord(65498);
      writeWord(12);
      writeByte(3);
      writeByte(1);
      writeByte(0);
      writeByte(2);
      writeByte(17);
      writeByte(3);
      writeByte(17);
      writeByte(0);
      writeByte(63);
      writeByte(0);
    }
    function processDU(CDU, fdtbl, DC, HTDC, HTAC) {
      var EOB = HTAC[0];
      var M16zeroes = HTAC[240];
      var pos;
      var I16 = 16;
      var I63 = 63;
      var I64 = 64;
      var DU_DCT = fDCTQuant(CDU, fdtbl);
      for (var j = 0; j < I64; ++j) {
        DU[ZigZag[j]] = DU_DCT[j];
      }
      var Diff = DU[0] - DC;
      DC = DU[0];
      if (Diff == 0) {
        writeBits(HTDC[0]);
      } else {
        pos = 32767 + Diff;
        writeBits(HTDC[category[pos]]);
        writeBits(bitcode[pos]);
      }
      var end0pos = 63;
      for (; end0pos > 0 && DU[end0pos] == 0; end0pos--) {
      }
      if (end0pos == 0) {
        writeBits(EOB);
        return DC;
      }
      var i2 = 1;
      var lng;
      while (i2 <= end0pos) {
        var startpos = i2;
        for (; DU[i2] == 0 && i2 <= end0pos; ++i2) {
        }
        var nrzeroes = i2 - startpos;
        if (nrzeroes >= I16) {
          lng = nrzeroes >> 4;
          for (var nrmarker = 1; nrmarker <= lng; ++nrmarker)
            writeBits(M16zeroes);
          nrzeroes = nrzeroes & 15;
        }
        pos = 32767 + DU[i2];
        writeBits(HTAC[(nrzeroes << 4) + category[pos]]);
        writeBits(bitcode[pos]);
        i2++;
      }
      if (end0pos != I63) {
        writeBits(EOB);
      }
      return DC;
    }
    function initCharLookupTable() {
      var sfcc = String.fromCharCode;
      for (var i2 = 0; i2 < 256; i2++) {
        clt[i2] = sfcc(i2);
      }
    }
    this.encode = function(image, quality2) {
      (/* @__PURE__ */ new Date()).getTime();
      if (quality2) setQuality(quality2);
      byteout = new Array();
      bytenew = 0;
      bytepos = 7;
      writeWord(65496);
      writeAPP0();
      writeCOM(image.comments);
      writeAPP1(image.exifBuffer);
      writeDQT();
      writeSOF0(image.width, image.height);
      writeDHT();
      writeSOS();
      var DCY = 0;
      var DCU = 0;
      var DCV = 0;
      bytenew = 0;
      bytepos = 7;
      this.encode.displayName = "_encode_";
      var imageData = image.data;
      var width = image.width;
      var height = image.height;
      var quadWidth = width * 4;
      var x, y = 0;
      var r, g, b;
      var start, p, col, row, pos;
      while (y < height) {
        x = 0;
        while (x < quadWidth) {
          start = quadWidth * y + x;
          p = start;
          col = -1;
          row = 0;
          for (pos = 0; pos < 64; pos++) {
            row = pos >> 3;
            col = (pos & 7) * 4;
            p = start + row * quadWidth + col;
            if (y + row >= height) {
              p -= quadWidth * (y + 1 + row - height);
            }
            if (x + col >= quadWidth) {
              p -= x + col - quadWidth + 4;
            }
            r = imageData[p++];
            g = imageData[p++];
            b = imageData[p++];
            YDU[pos] = (RGB_YUV_TABLE[r] + RGB_YUV_TABLE[g + 256 >> 0] + RGB_YUV_TABLE[b + 512 >> 0] >> 16) - 128;
            UDU[pos] = (RGB_YUV_TABLE[r + 768 >> 0] + RGB_YUV_TABLE[g + 1024 >> 0] + RGB_YUV_TABLE[b + 1280 >> 0] >> 16) - 128;
            VDU[pos] = (RGB_YUV_TABLE[r + 1280 >> 0] + RGB_YUV_TABLE[g + 1536 >> 0] + RGB_YUV_TABLE[b + 1792 >> 0] >> 16) - 128;
          }
          DCY = processDU(YDU, fdtbl_Y, DCY, YDC_HT, YAC_HT);
          DCU = processDU(UDU, fdtbl_UV, DCU, UVDC_HT, UVAC_HT);
          DCV = processDU(VDU, fdtbl_UV, DCV, UVDC_HT, UVAC_HT);
          x += 32;
        }
        y += 8;
      }
      if (bytepos >= 0) {
        var fillbits = [];
        fillbits[1] = bytepos + 1;
        fillbits[0] = (1 << bytepos + 1) - 1;
        writeBits(fillbits);
      }
      writeWord(65497);
      return Buffer.from(byteout);
    };
    function setQuality(quality2) {
      if (quality2 <= 0) {
        quality2 = 1;
      }
      if (quality2 > 100) {
        quality2 = 100;
      }
      if (currentQuality == quality2) return;
      var sf = 0;
      if (quality2 < 50) {
        sf = Math.floor(5e3 / quality2);
      } else {
        sf = Math.floor(200 - quality2 * 2);
      }
      initQuantTables(sf);
      currentQuality = quality2;
    }
    function init() {
      var time_start = (/* @__PURE__ */ new Date()).getTime();
      if (!quality) quality = 50;
      initCharLookupTable();
      initHuffmanTbl();
      initCategoryNumber();
      initRGBYUVTable();
      setQuality(quality);
      (/* @__PURE__ */ new Date()).getTime() - time_start;
    }
    init();
  }
  {
    module2.exports = encode3;
  }
  function encode3(imgData, qu) {
    if (typeof qu === "undefined") qu = 50;
    var encoder2 = new JPEGEncoder(qu);
    var data = encoder2.encode(imgData, qu);
    return {
      data,
      width: imgData.width,
      height: imgData.height
    };
  }
})(encoder);
var encoderExports = encoder.exports;
var decoder = { exports: {} };
(function(module2) {
  var JpegImage = function jpegImage() {
    var dctZigZag = new Int32Array([
      0,
      1,
      8,
      16,
      9,
      2,
      3,
      10,
      17,
      24,
      32,
      25,
      18,
      11,
      4,
      5,
      12,
      19,
      26,
      33,
      40,
      48,
      41,
      34,
      27,
      20,
      13,
      6,
      7,
      14,
      21,
      28,
      35,
      42,
      49,
      56,
      57,
      50,
      43,
      36,
      29,
      22,
      15,
      23,
      30,
      37,
      44,
      51,
      58,
      59,
      52,
      45,
      38,
      31,
      39,
      46,
      53,
      60,
      61,
      54,
      47,
      55,
      62,
      63
    ]);
    var dctCos1 = 4017;
    var dctSin1 = 799;
    var dctCos3 = 3406;
    var dctSin3 = 2276;
    var dctCos6 = 1567;
    var dctSin6 = 3784;
    var dctSqrt2 = 5793;
    var dctSqrt1d2 = 2896;
    function constructor() {
    }
    function buildHuffmanTable(codeLengths, values) {
      var k = 0, code = [], i2, j, length = 16;
      while (length > 0 && !codeLengths[length - 1])
        length--;
      code.push({ children: [], index: 0 });
      var p = code[0], q;
      for (i2 = 0; i2 < length; i2++) {
        for (j = 0; j < codeLengths[i2]; j++) {
          p = code.pop();
          p.children[p.index] = values[k];
          while (p.index > 0) {
            if (code.length === 0)
              throw new Error("Could not recreate Huffman Table");
            p = code.pop();
          }
          p.index++;
          code.push(p);
          while (code.length <= i2) {
            code.push(q = { children: [], index: 0 });
            p.children[p.index] = q.children;
            p = q;
          }
          k++;
        }
        if (i2 + 1 < length) {
          code.push(q = { children: [], index: 0 });
          p.children[p.index] = q.children;
          p = q;
        }
      }
      return code[0].children;
    }
    function decodeScan(data, offset, frame, components, resetInterval, spectralStart, spectralEnd, successivePrev, successive, opts) {
      frame.precision;
      frame.samplesPerLine;
      frame.scanLines;
      var mcusPerLine = frame.mcusPerLine;
      var progressive = frame.progressive;
      frame.maxH;
      frame.maxV;
      var startOffset = offset, bitsData = 0, bitsCount = 0;
      function readBit() {
        if (bitsCount > 0) {
          bitsCount--;
          return bitsData >> bitsCount & 1;
        }
        bitsData = data[offset++];
        if (bitsData == 255) {
          var nextByte = data[offset++];
          if (nextByte) {
            throw new Error("unexpected marker: " + (bitsData << 8 | nextByte).toString(16));
          }
        }
        bitsCount = 7;
        return bitsData >>> 7;
      }
      function decodeHuffman(tree) {
        var node = tree, bit;
        while ((bit = readBit()) !== null) {
          node = node[bit];
          if (typeof node === "number")
            return node;
          if (typeof node !== "object")
            throw new Error("invalid huffman sequence");
        }
        return null;
      }
      function receive(length) {
        var n2 = 0;
        while (length > 0) {
          var bit = readBit();
          if (bit === null) return;
          n2 = n2 << 1 | bit;
          length--;
        }
        return n2;
      }
      function receiveAndExtend(length) {
        var n2 = receive(length);
        if (n2 >= 1 << length - 1)
          return n2;
        return n2 + (-1 << length) + 1;
      }
      function decodeBaseline(component2, zz) {
        var t = decodeHuffman(component2.huffmanTableDC);
        var diff = t === 0 ? 0 : receiveAndExtend(t);
        zz[0] = component2.pred += diff;
        var k2 = 1;
        while (k2 < 64) {
          var rs = decodeHuffman(component2.huffmanTableAC);
          var s = rs & 15, r = rs >> 4;
          if (s === 0) {
            if (r < 15)
              break;
            k2 += 16;
            continue;
          }
          k2 += r;
          var z = dctZigZag[k2];
          zz[z] = receiveAndExtend(s);
          k2++;
        }
      }
      function decodeDCFirst(component2, zz) {
        var t = decodeHuffman(component2.huffmanTableDC);
        var diff = t === 0 ? 0 : receiveAndExtend(t) << successive;
        zz[0] = component2.pred += diff;
      }
      function decodeDCSuccessive(component2, zz) {
        zz[0] |= readBit() << successive;
      }
      var eobrun = 0;
      function decodeACFirst(component2, zz) {
        if (eobrun > 0) {
          eobrun--;
          return;
        }
        var k2 = spectralStart, e = spectralEnd;
        while (k2 <= e) {
          var rs = decodeHuffman(component2.huffmanTableAC);
          var s = rs & 15, r = rs >> 4;
          if (s === 0) {
            if (r < 15) {
              eobrun = receive(r) + (1 << r) - 1;
              break;
            }
            k2 += 16;
            continue;
          }
          k2 += r;
          var z = dctZigZag[k2];
          zz[z] = receiveAndExtend(s) * (1 << successive);
          k2++;
        }
      }
      var successiveACState = 0, successiveACNextValue;
      function decodeACSuccessive(component2, zz) {
        var k2 = spectralStart, e = spectralEnd, r = 0;
        while (k2 <= e) {
          var z = dctZigZag[k2];
          var direction = zz[z] < 0 ? -1 : 1;
          switch (successiveACState) {
            case 0:
              var rs = decodeHuffman(component2.huffmanTableAC);
              var s = rs & 15, r = rs >> 4;
              if (s === 0) {
                if (r < 15) {
                  eobrun = receive(r) + (1 << r);
                  successiveACState = 4;
                } else {
                  r = 16;
                  successiveACState = 1;
                }
              } else {
                if (s !== 1)
                  throw new Error("invalid ACn encoding");
                successiveACNextValue = receiveAndExtend(s);
                successiveACState = r ? 2 : 3;
              }
              continue;
            case 1:
            case 2:
              if (zz[z])
                zz[z] += (readBit() << successive) * direction;
              else {
                r--;
                if (r === 0)
                  successiveACState = successiveACState == 2 ? 3 : 0;
              }
              break;
            case 3:
              if (zz[z])
                zz[z] += (readBit() << successive) * direction;
              else {
                zz[z] = successiveACNextValue << successive;
                successiveACState = 0;
              }
              break;
            case 4:
              if (zz[z])
                zz[z] += (readBit() << successive) * direction;
              break;
          }
          k2++;
        }
        if (successiveACState === 4) {
          eobrun--;
          if (eobrun === 0)
            successiveACState = 0;
        }
      }
      function decodeMcu(component2, decode3, mcu2, row, col) {
        var mcuRow = mcu2 / mcusPerLine | 0;
        var mcuCol = mcu2 % mcusPerLine;
        var blockRow = mcuRow * component2.v + row;
        var blockCol = mcuCol * component2.h + col;
        if (component2.blocks[blockRow] === void 0 && opts.tolerantDecoding)
          return;
        decode3(component2, component2.blocks[blockRow][blockCol]);
      }
      function decodeBlock(component2, decode3, mcu2) {
        var blockRow = mcu2 / component2.blocksPerLine | 0;
        var blockCol = mcu2 % component2.blocksPerLine;
        if (component2.blocks[blockRow] === void 0 && opts.tolerantDecoding)
          return;
        decode3(component2, component2.blocks[blockRow][blockCol]);
      }
      var componentsLength = components.length;
      var component, i2, j, k, n;
      var decodeFn;
      if (progressive) {
        if (spectralStart === 0)
          decodeFn = successivePrev === 0 ? decodeDCFirst : decodeDCSuccessive;
        else
          decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
      } else {
        decodeFn = decodeBaseline;
      }
      var mcu = 0, marker;
      var mcuExpected;
      if (componentsLength == 1) {
        mcuExpected = components[0].blocksPerLine * components[0].blocksPerColumn;
      } else {
        mcuExpected = mcusPerLine * frame.mcusPerColumn;
      }
      if (!resetInterval) resetInterval = mcuExpected;
      var h, v;
      while (mcu < mcuExpected) {
        for (i2 = 0; i2 < componentsLength; i2++)
          components[i2].pred = 0;
        eobrun = 0;
        if (componentsLength == 1) {
          component = components[0];
          for (n = 0; n < resetInterval; n++) {
            decodeBlock(component, decodeFn, mcu);
            mcu++;
          }
        } else {
          for (n = 0; n < resetInterval; n++) {
            for (i2 = 0; i2 < componentsLength; i2++) {
              component = components[i2];
              h = component.h;
              v = component.v;
              for (j = 0; j < v; j++) {
                for (k = 0; k < h; k++) {
                  decodeMcu(component, decodeFn, mcu, j, k);
                }
              }
            }
            mcu++;
            if (mcu === mcuExpected) break;
          }
        }
        if (mcu === mcuExpected) {
          do {
            if (data[offset] === 255) {
              if (data[offset + 1] !== 0) {
                break;
              }
            }
            offset += 1;
          } while (offset < data.length - 2);
        }
        bitsCount = 0;
        marker = data[offset] << 8 | data[offset + 1];
        if (marker < 65280) {
          throw new Error("marker was not found");
        }
        if (marker >= 65488 && marker <= 65495) {
          offset += 2;
        } else
          break;
      }
      return offset - startOffset;
    }
    function buildComponentData(frame, component) {
      var lines = [];
      var blocksPerLine = component.blocksPerLine;
      var blocksPerColumn = component.blocksPerColumn;
      var samplesPerLine = blocksPerLine << 3;
      var R = new Int32Array(64), r = new Uint8Array(64);
      function quantizeAndInverse(zz, dataOut, dataIn) {
        var qt = component.quantizationTable;
        var v0, v1, v2, v3, v4, v5, v6, v7, t;
        var p = dataIn;
        var i3;
        for (i3 = 0; i3 < 64; i3++)
          p[i3] = zz[i3] * qt[i3];
        for (i3 = 0; i3 < 8; ++i3) {
          var row = 8 * i3;
          if (p[1 + row] == 0 && p[2 + row] == 0 && p[3 + row] == 0 && p[4 + row] == 0 && p[5 + row] == 0 && p[6 + row] == 0 && p[7 + row] == 0) {
            t = dctSqrt2 * p[0 + row] + 512 >> 10;
            p[0 + row] = t;
            p[1 + row] = t;
            p[2 + row] = t;
            p[3 + row] = t;
            p[4 + row] = t;
            p[5 + row] = t;
            p[6 + row] = t;
            p[7 + row] = t;
            continue;
          }
          v0 = dctSqrt2 * p[0 + row] + 128 >> 8;
          v1 = dctSqrt2 * p[4 + row] + 128 >> 8;
          v2 = p[2 + row];
          v3 = p[6 + row];
          v4 = dctSqrt1d2 * (p[1 + row] - p[7 + row]) + 128 >> 8;
          v7 = dctSqrt1d2 * (p[1 + row] + p[7 + row]) + 128 >> 8;
          v5 = p[3 + row] << 4;
          v6 = p[5 + row] << 4;
          t = v0 - v1 + 1 >> 1;
          v0 = v0 + v1 + 1 >> 1;
          v1 = t;
          t = v2 * dctSin6 + v3 * dctCos6 + 128 >> 8;
          v2 = v2 * dctCos6 - v3 * dctSin6 + 128 >> 8;
          v3 = t;
          t = v4 - v6 + 1 >> 1;
          v4 = v4 + v6 + 1 >> 1;
          v6 = t;
          t = v7 + v5 + 1 >> 1;
          v5 = v7 - v5 + 1 >> 1;
          v7 = t;
          t = v0 - v3 + 1 >> 1;
          v0 = v0 + v3 + 1 >> 1;
          v3 = t;
          t = v1 - v2 + 1 >> 1;
          v1 = v1 + v2 + 1 >> 1;
          v2 = t;
          t = v4 * dctSin3 + v7 * dctCos3 + 2048 >> 12;
          v4 = v4 * dctCos3 - v7 * dctSin3 + 2048 >> 12;
          v7 = t;
          t = v5 * dctSin1 + v6 * dctCos1 + 2048 >> 12;
          v5 = v5 * dctCos1 - v6 * dctSin1 + 2048 >> 12;
          v6 = t;
          p[0 + row] = v0 + v7;
          p[7 + row] = v0 - v7;
          p[1 + row] = v1 + v6;
          p[6 + row] = v1 - v6;
          p[2 + row] = v2 + v5;
          p[5 + row] = v2 - v5;
          p[3 + row] = v3 + v4;
          p[4 + row] = v3 - v4;
        }
        for (i3 = 0; i3 < 8; ++i3) {
          var col = i3;
          if (p[1 * 8 + col] == 0 && p[2 * 8 + col] == 0 && p[3 * 8 + col] == 0 && p[4 * 8 + col] == 0 && p[5 * 8 + col] == 0 && p[6 * 8 + col] == 0 && p[7 * 8 + col] == 0) {
            t = dctSqrt2 * dataIn[i3 + 0] + 8192 >> 14;
            p[0 * 8 + col] = t;
            p[1 * 8 + col] = t;
            p[2 * 8 + col] = t;
            p[3 * 8 + col] = t;
            p[4 * 8 + col] = t;
            p[5 * 8 + col] = t;
            p[6 * 8 + col] = t;
            p[7 * 8 + col] = t;
            continue;
          }
          v0 = dctSqrt2 * p[0 * 8 + col] + 2048 >> 12;
          v1 = dctSqrt2 * p[4 * 8 + col] + 2048 >> 12;
          v2 = p[2 * 8 + col];
          v3 = p[6 * 8 + col];
          v4 = dctSqrt1d2 * (p[1 * 8 + col] - p[7 * 8 + col]) + 2048 >> 12;
          v7 = dctSqrt1d2 * (p[1 * 8 + col] + p[7 * 8 + col]) + 2048 >> 12;
          v5 = p[3 * 8 + col];
          v6 = p[5 * 8 + col];
          t = v0 - v1 + 1 >> 1;
          v0 = v0 + v1 + 1 >> 1;
          v1 = t;
          t = v2 * dctSin6 + v3 * dctCos6 + 2048 >> 12;
          v2 = v2 * dctCos6 - v3 * dctSin6 + 2048 >> 12;
          v3 = t;
          t = v4 - v6 + 1 >> 1;
          v4 = v4 + v6 + 1 >> 1;
          v6 = t;
          t = v7 + v5 + 1 >> 1;
          v5 = v7 - v5 + 1 >> 1;
          v7 = t;
          t = v0 - v3 + 1 >> 1;
          v0 = v0 + v3 + 1 >> 1;
          v3 = t;
          t = v1 - v2 + 1 >> 1;
          v1 = v1 + v2 + 1 >> 1;
          v2 = t;
          t = v4 * dctSin3 + v7 * dctCos3 + 2048 >> 12;
          v4 = v4 * dctCos3 - v7 * dctSin3 + 2048 >> 12;
          v7 = t;
          t = v5 * dctSin1 + v6 * dctCos1 + 2048 >> 12;
          v5 = v5 * dctCos1 - v6 * dctSin1 + 2048 >> 12;
          v6 = t;
          p[0 * 8 + col] = v0 + v7;
          p[7 * 8 + col] = v0 - v7;
          p[1 * 8 + col] = v1 + v6;
          p[6 * 8 + col] = v1 - v6;
          p[2 * 8 + col] = v2 + v5;
          p[5 * 8 + col] = v2 - v5;
          p[3 * 8 + col] = v3 + v4;
          p[4 * 8 + col] = v3 - v4;
        }
        for (i3 = 0; i3 < 64; ++i3) {
          var sample2 = 128 + (p[i3] + 8 >> 4);
          dataOut[i3] = sample2 < 0 ? 0 : sample2 > 255 ? 255 : sample2;
        }
      }
      requestMemoryAllocation(samplesPerLine * blocksPerColumn * 8);
      var i2, j;
      for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
        var scanLine = blockRow << 3;
        for (i2 = 0; i2 < 8; i2++)
          lines.push(new Uint8Array(samplesPerLine));
        for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) {
          quantizeAndInverse(component.blocks[blockRow][blockCol], r, R);
          var offset = 0, sample = blockCol << 3;
          for (j = 0; j < 8; j++) {
            var line = lines[scanLine + j];
            for (i2 = 0; i2 < 8; i2++)
              line[sample + i2] = r[offset++];
          }
        }
      }
      return lines;
    }
    function clampTo8bit(a) {
      return a < 0 ? 0 : a > 255 ? 255 : a;
    }
    constructor.prototype = {
      load: function load2(path) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", path, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = (function() {
          var data = new Uint8Array(xhr.response || xhr.mozResponseArrayBuffer);
          this.parse(data);
          if (this.onload)
            this.onload();
        }).bind(this);
        xhr.send(null);
      },
      parse: function parse2(data) {
        var maxResolutionInPixels = this.opts.maxResolutionInMP * 1e3 * 1e3;
        var offset = 0;
        data.length;
        function readUint16() {
          var value = data[offset] << 8 | data[offset + 1];
          offset += 2;
          return value;
        }
        function readDataBlock() {
          var length = readUint16();
          var array = data.subarray(offset, offset + length - 2);
          offset += array.length;
          return array;
        }
        function prepareComponents(frame2) {
          var maxH = 1, maxV = 1;
          var component2, componentId2;
          for (componentId2 in frame2.components) {
            if (frame2.components.hasOwnProperty(componentId2)) {
              component2 = frame2.components[componentId2];
              if (maxH < component2.h) maxH = component2.h;
              if (maxV < component2.v) maxV = component2.v;
            }
          }
          var mcusPerLine = Math.ceil(frame2.samplesPerLine / 8 / maxH);
          var mcusPerColumn = Math.ceil(frame2.scanLines / 8 / maxV);
          for (componentId2 in frame2.components) {
            if (frame2.components.hasOwnProperty(componentId2)) {
              component2 = frame2.components[componentId2];
              var blocksPerLine = Math.ceil(Math.ceil(frame2.samplesPerLine / 8) * component2.h / maxH);
              var blocksPerColumn = Math.ceil(Math.ceil(frame2.scanLines / 8) * component2.v / maxV);
              var blocksPerLineForMcu = mcusPerLine * component2.h;
              var blocksPerColumnForMcu = mcusPerColumn * component2.v;
              var blocksToAllocate = blocksPerColumnForMcu * blocksPerLineForMcu;
              var blocks = [];
              requestMemoryAllocation(blocksToAllocate * 256);
              for (var i3 = 0; i3 < blocksPerColumnForMcu; i3++) {
                var row = [];
                for (var j2 = 0; j2 < blocksPerLineForMcu; j2++)
                  row.push(new Int32Array(64));
                blocks.push(row);
              }
              component2.blocksPerLine = blocksPerLine;
              component2.blocksPerColumn = blocksPerColumn;
              component2.blocks = blocks;
            }
          }
          frame2.maxH = maxH;
          frame2.maxV = maxV;
          frame2.mcusPerLine = mcusPerLine;
          frame2.mcusPerColumn = mcusPerColumn;
        }
        var jfif = null;
        var adobe = null;
        var frame, resetInterval;
        var quantizationTables = [], frames = [];
        var huffmanTablesAC = [], huffmanTablesDC = [];
        var fileMarker = readUint16();
        var malformedDataOffset = -1;
        this.comments = [];
        if (fileMarker != 65496) {
          throw new Error("SOI not found");
        }
        fileMarker = readUint16();
        while (fileMarker != 65497) {
          var i2, j;
          switch (fileMarker) {
            case 65280:
              break;
            case 65504:
            case 65505:
            case 65506:
            case 65507:
            case 65508:
            case 65509:
            case 65510:
            case 65511:
            case 65512:
            case 65513:
            case 65514:
            case 65515:
            case 65516:
            case 65517:
            case 65518:
            case 65519:
            case 65534:
              var appData = readDataBlock();
              if (fileMarker === 65534) {
                var comment = String.fromCharCode.apply(null, appData);
                this.comments.push(comment);
              }
              if (fileMarker === 65504) {
                if (appData[0] === 74 && appData[1] === 70 && appData[2] === 73 && appData[3] === 70 && appData[4] === 0) {
                  jfif = {
                    version: { major: appData[5], minor: appData[6] },
                    densityUnits: appData[7],
                    xDensity: appData[8] << 8 | appData[9],
                    yDensity: appData[10] << 8 | appData[11],
                    thumbWidth: appData[12],
                    thumbHeight: appData[13],
                    thumbData: appData.subarray(14, 14 + 3 * appData[12] * appData[13])
                  };
                }
              }
              if (fileMarker === 65505) {
                if (appData[0] === 69 && appData[1] === 120 && appData[2] === 105 && appData[3] === 102 && appData[4] === 0) {
                  this.exifBuffer = appData.subarray(5, appData.length);
                }
              }
              if (fileMarker === 65518) {
                if (appData[0] === 65 && appData[1] === 100 && appData[2] === 111 && appData[3] === 98 && appData[4] === 101 && appData[5] === 0) {
                  adobe = {
                    version: appData[6],
                    flags0: appData[7] << 8 | appData[8],
                    flags1: appData[9] << 8 | appData[10],
                    transformCode: appData[11]
                  };
                }
              }
              break;
            case 65499:
              var quantizationTablesLength = readUint16();
              var quantizationTablesEnd = quantizationTablesLength + offset - 2;
              while (offset < quantizationTablesEnd) {
                var quantizationTableSpec = data[offset++];
                requestMemoryAllocation(64 * 4);
                var tableData = new Int32Array(64);
                if (quantizationTableSpec >> 4 === 0) {
                  for (j = 0; j < 64; j++) {
                    var z = dctZigZag[j];
                    tableData[z] = data[offset++];
                  }
                } else if (quantizationTableSpec >> 4 === 1) {
                  for (j = 0; j < 64; j++) {
                    var z = dctZigZag[j];
                    tableData[z] = readUint16();
                  }
                } else
                  throw new Error("DQT: invalid table spec");
                quantizationTables[quantizationTableSpec & 15] = tableData;
              }
              break;
            case 65472:
            case 65473:
            case 65474:
              readUint16();
              frame = {};
              frame.extended = fileMarker === 65473;
              frame.progressive = fileMarker === 65474;
              frame.precision = data[offset++];
              frame.scanLines = readUint16();
              frame.samplesPerLine = readUint16();
              frame.components = {};
              frame.componentsOrder = [];
              var pixelsInFrame = frame.scanLines * frame.samplesPerLine;
              if (pixelsInFrame > maxResolutionInPixels) {
                var exceededAmount = Math.ceil((pixelsInFrame - maxResolutionInPixels) / 1e6);
                throw new Error(`maxResolutionInMP limit exceeded by ${exceededAmount}MP`);
              }
              var componentsCount = data[offset++], componentId;
              for (i2 = 0; i2 < componentsCount; i2++) {
                componentId = data[offset];
                var h = data[offset + 1] >> 4;
                var v = data[offset + 1] & 15;
                var qId = data[offset + 2];
                if (h <= 0 || v <= 0) {
                  throw new Error("Invalid sampling factor, expected values above 0");
                }
                frame.componentsOrder.push(componentId);
                frame.components[componentId] = {
                  h,
                  v,
                  quantizationIdx: qId
                };
                offset += 3;
              }
              prepareComponents(frame);
              frames.push(frame);
              break;
            case 65476:
              var huffmanLength = readUint16();
              for (i2 = 2; i2 < huffmanLength; ) {
                var huffmanTableSpec = data[offset++];
                var codeLengths = new Uint8Array(16);
                var codeLengthSum = 0;
                for (j = 0; j < 16; j++, offset++) {
                  codeLengthSum += codeLengths[j] = data[offset];
                }
                requestMemoryAllocation(16 + codeLengthSum);
                var huffmanValues = new Uint8Array(codeLengthSum);
                for (j = 0; j < codeLengthSum; j++, offset++)
                  huffmanValues[j] = data[offset];
                i2 += 17 + codeLengthSum;
                (huffmanTableSpec >> 4 === 0 ? huffmanTablesDC : huffmanTablesAC)[huffmanTableSpec & 15] = buildHuffmanTable(codeLengths, huffmanValues);
              }
              break;
            case 65501:
              readUint16();
              resetInterval = readUint16();
              break;
            case 65500:
              readUint16();
              readUint16();
              break;
            case 65498:
              readUint16();
              var selectorsCount = data[offset++];
              var components = [], component;
              for (i2 = 0; i2 < selectorsCount; i2++) {
                component = frame.components[data[offset++]];
                var tableSpec = data[offset++];
                component.huffmanTableDC = huffmanTablesDC[tableSpec >> 4];
                component.huffmanTableAC = huffmanTablesAC[tableSpec & 15];
                components.push(component);
              }
              var spectralStart = data[offset++];
              var spectralEnd = data[offset++];
              var successiveApproximation = data[offset++];
              var processed = decodeScan(
                data,
                offset,
                frame,
                components,
                resetInterval,
                spectralStart,
                spectralEnd,
                successiveApproximation >> 4,
                successiveApproximation & 15,
                this.opts
              );
              offset += processed;
              break;
            case 65535:
              if (data[offset] !== 255) {
                offset--;
              }
              break;
            default:
              if (data[offset - 3] == 255 && data[offset - 2] >= 192 && data[offset - 2] <= 254) {
                offset -= 3;
                break;
              } else if (fileMarker === 224 || fileMarker == 225) {
                if (malformedDataOffset !== -1) {
                  throw new Error(`first unknown JPEG marker at offset ${malformedDataOffset.toString(16)}, second unknown JPEG marker ${fileMarker.toString(16)} at offset ${(offset - 1).toString(16)}`);
                }
                malformedDataOffset = offset - 1;
                const nextOffset = readUint16();
                if (data[offset + nextOffset - 2] === 255) {
                  offset += nextOffset - 2;
                  break;
                }
              }
              throw new Error("unknown JPEG marker " + fileMarker.toString(16));
          }
          fileMarker = readUint16();
        }
        if (frames.length != 1)
          throw new Error("only single frame JPEGs supported");
        for (var i2 = 0; i2 < frames.length; i2++) {
          var cp = frames[i2].components;
          for (var j in cp) {
            cp[j].quantizationTable = quantizationTables[cp[j].quantizationIdx];
            delete cp[j].quantizationIdx;
          }
        }
        this.width = frame.samplesPerLine;
        this.height = frame.scanLines;
        this.jfif = jfif;
        this.adobe = adobe;
        this.components = [];
        for (var i2 = 0; i2 < frame.componentsOrder.length; i2++) {
          var component = frame.components[frame.componentsOrder[i2]];
          this.components.push({
            lines: buildComponentData(frame, component),
            scaleX: component.h / frame.maxH,
            scaleY: component.v / frame.maxV
          });
        }
      },
      getData: function getData(width, height) {
        var scaleX = this.width / width, scaleY = this.height / height;
        var component1, component2, component3, component4;
        var component1Line, component2Line, component3Line, component4Line;
        var x, y;
        var offset = 0;
        var Y, Cb, Cr, K, C, M, Ye, R, G, B;
        var colorTransform;
        var dataLength = width * height * this.components.length;
        requestMemoryAllocation(dataLength);
        var data = new Uint8Array(dataLength);
        switch (this.components.length) {
          case 1:
            component1 = this.components[0];
            for (y = 0; y < height; y++) {
              component1Line = component1.lines[0 | y * component1.scaleY * scaleY];
              for (x = 0; x < width; x++) {
                Y = component1Line[0 | x * component1.scaleX * scaleX];
                data[offset++] = Y;
              }
            }
            break;
          case 2:
            component1 = this.components[0];
            component2 = this.components[1];
            for (y = 0; y < height; y++) {
              component1Line = component1.lines[0 | y * component1.scaleY * scaleY];
              component2Line = component2.lines[0 | y * component2.scaleY * scaleY];
              for (x = 0; x < width; x++) {
                Y = component1Line[0 | x * component1.scaleX * scaleX];
                data[offset++] = Y;
                Y = component2Line[0 | x * component2.scaleX * scaleX];
                data[offset++] = Y;
              }
            }
            break;
          case 3:
            colorTransform = true;
            if (this.adobe && this.adobe.transformCode)
              colorTransform = true;
            else if (typeof this.opts.colorTransform !== "undefined")
              colorTransform = !!this.opts.colorTransform;
            component1 = this.components[0];
            component2 = this.components[1];
            component3 = this.components[2];
            for (y = 0; y < height; y++) {
              component1Line = component1.lines[0 | y * component1.scaleY * scaleY];
              component2Line = component2.lines[0 | y * component2.scaleY * scaleY];
              component3Line = component3.lines[0 | y * component3.scaleY * scaleY];
              for (x = 0; x < width; x++) {
                if (!colorTransform) {
                  R = component1Line[0 | x * component1.scaleX * scaleX];
                  G = component2Line[0 | x * component2.scaleX * scaleX];
                  B = component3Line[0 | x * component3.scaleX * scaleX];
                } else {
                  Y = component1Line[0 | x * component1.scaleX * scaleX];
                  Cb = component2Line[0 | x * component2.scaleX * scaleX];
                  Cr = component3Line[0 | x * component3.scaleX * scaleX];
                  R = clampTo8bit(Y + 1.402 * (Cr - 128));
                  G = clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
                  B = clampTo8bit(Y + 1.772 * (Cb - 128));
                }
                data[offset++] = R;
                data[offset++] = G;
                data[offset++] = B;
              }
            }
            break;
          case 4:
            if (!this.adobe)
              throw new Error("Unsupported color mode (4 components)");
            colorTransform = false;
            if (this.adobe && this.adobe.transformCode)
              colorTransform = true;
            else if (typeof this.opts.colorTransform !== "undefined")
              colorTransform = !!this.opts.colorTransform;
            component1 = this.components[0];
            component2 = this.components[1];
            component3 = this.components[2];
            component4 = this.components[3];
            for (y = 0; y < height; y++) {
              component1Line = component1.lines[0 | y * component1.scaleY * scaleY];
              component2Line = component2.lines[0 | y * component2.scaleY * scaleY];
              component3Line = component3.lines[0 | y * component3.scaleY * scaleY];
              component4Line = component4.lines[0 | y * component4.scaleY * scaleY];
              for (x = 0; x < width; x++) {
                if (!colorTransform) {
                  C = component1Line[0 | x * component1.scaleX * scaleX];
                  M = component2Line[0 | x * component2.scaleX * scaleX];
                  Ye = component3Line[0 | x * component3.scaleX * scaleX];
                  K = component4Line[0 | x * component4.scaleX * scaleX];
                } else {
                  Y = component1Line[0 | x * component1.scaleX * scaleX];
                  Cb = component2Line[0 | x * component2.scaleX * scaleX];
                  Cr = component3Line[0 | x * component3.scaleX * scaleX];
                  K = component4Line[0 | x * component4.scaleX * scaleX];
                  C = 255 - clampTo8bit(Y + 1.402 * (Cr - 128));
                  M = 255 - clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
                  Ye = 255 - clampTo8bit(Y + 1.772 * (Cb - 128));
                }
                data[offset++] = 255 - C;
                data[offset++] = 255 - M;
                data[offset++] = 255 - Ye;
                data[offset++] = 255 - K;
              }
            }
            break;
          default:
            throw new Error("Unsupported color mode");
        }
        return data;
      },
      copyToImageData: function copyToImageData(imageData, formatAsRGBA) {
        var width = imageData.width, height = imageData.height;
        var imageDataArray = imageData.data;
        var data = this.getData(width, height);
        var i2 = 0, j = 0, x, y;
        var Y, K, C, M, R, G, B;
        switch (this.components.length) {
          case 1:
            for (y = 0; y < height; y++) {
              for (x = 0; x < width; x++) {
                Y = data[i2++];
                imageDataArray[j++] = Y;
                imageDataArray[j++] = Y;
                imageDataArray[j++] = Y;
                if (formatAsRGBA) {
                  imageDataArray[j++] = 255;
                }
              }
            }
            break;
          case 3:
            for (y = 0; y < height; y++) {
              for (x = 0; x < width; x++) {
                R = data[i2++];
                G = data[i2++];
                B = data[i2++];
                imageDataArray[j++] = R;
                imageDataArray[j++] = G;
                imageDataArray[j++] = B;
                if (formatAsRGBA) {
                  imageDataArray[j++] = 255;
                }
              }
            }
            break;
          case 4:
            for (y = 0; y < height; y++) {
              for (x = 0; x < width; x++) {
                C = data[i2++];
                M = data[i2++];
                Y = data[i2++];
                K = data[i2++];
                R = 255 - clampTo8bit(C * (1 - K / 255) + K);
                G = 255 - clampTo8bit(M * (1 - K / 255) + K);
                B = 255 - clampTo8bit(Y * (1 - K / 255) + K);
                imageDataArray[j++] = R;
                imageDataArray[j++] = G;
                imageDataArray[j++] = B;
                if (formatAsRGBA) {
                  imageDataArray[j++] = 255;
                }
              }
            }
            break;
          default:
            throw new Error("Unsupported color mode");
        }
      }
    };
    var totalBytesAllocated = 0;
    var maxMemoryUsageBytes = 0;
    function requestMemoryAllocation(increaseAmount = 0) {
      var totalMemoryImpactBytes = totalBytesAllocated + increaseAmount;
      if (totalMemoryImpactBytes > maxMemoryUsageBytes) {
        var exceededAmount = Math.ceil((totalMemoryImpactBytes - maxMemoryUsageBytes) / 1024 / 1024);
        throw new Error(`maxMemoryUsageInMB limit exceeded by at least ${exceededAmount}MB`);
      }
      totalBytesAllocated = totalMemoryImpactBytes;
    }
    constructor.resetMaxMemoryUsage = function(maxMemoryUsageBytes_) {
      totalBytesAllocated = 0;
      maxMemoryUsageBytes = maxMemoryUsageBytes_;
    };
    constructor.getBytesAllocated = function() {
      return totalBytesAllocated;
    };
    constructor.requestMemoryAllocation = requestMemoryAllocation;
    return constructor;
  }();
  {
    module2.exports = decode2;
  }
  function decode2(jpegData, userOpts = {}) {
    var defaultOpts = {
      // "undefined" means "Choose whether to transform colors based on the image’s color model."
      colorTransform: void 0,
      useTArray: false,
      formatAsRGBA: true,
      tolerantDecoding: true,
      maxResolutionInMP: 100,
      // Don't decode more than 100 megapixels
      maxMemoryUsageInMB: 512
      // Don't decode if memory footprint is more than 512MB
    };
    var opts = { ...defaultOpts, ...userOpts };
    var arr = new Uint8Array(jpegData);
    var decoder2 = new JpegImage();
    decoder2.opts = opts;
    JpegImage.resetMaxMemoryUsage(opts.maxMemoryUsageInMB * 1024 * 1024);
    decoder2.parse(arr);
    var channels = opts.formatAsRGBA ? 4 : 3;
    var bytesNeeded = decoder2.width * decoder2.height * channels;
    try {
      JpegImage.requestMemoryAllocation(bytesNeeded);
      var image = {
        width: decoder2.width,
        height: decoder2.height,
        exifBuffer: decoder2.exifBuffer,
        data: opts.useTArray ? new Uint8Array(bytesNeeded) : Buffer.alloc(bytesNeeded)
      };
      if (decoder2.comments.length > 0) {
        image["comments"] = decoder2.comments;
      }
    } catch (err2) {
      if (err2 instanceof RangeError) {
        throw new Error("Could not allocate enough memory for the image. Required: " + bytesNeeded);
      }
      if (err2 instanceof ReferenceError) {
        if (err2.message === "Buffer is not defined") {
          throw new Error("Buffer is not globally defined in this environment. Consider setting useTArray to true");
        }
      }
      throw err2;
    }
    decoder2.copyToImageData(image, opts.formatAsRGBA);
    return image;
  }
})(decoder);
var decoderExports = decoder.exports;
var encode$1 = encoderExports, decode$4 = decoderExports;
var jpegJs = {
  encode: encode$1,
  decode: decode$4
};
let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
let lookup = new Uint8Array(256);
for (let i2 = 0; i2 < chars.length; i2++) {
  lookup[chars.charCodeAt(i2)] = i2;
}
function encode(bytes) {
  let i2;
  let len = bytes.length;
  let base64 = "";
  for (i2 = 0; i2 < len; i2 += 3) {
    base64 += chars[bytes[i2] >> 2];
    base64 += chars[(bytes[i2] & 3) << 4 | bytes[i2 + 1] >> 4];
    base64 += chars[(bytes[i2 + 1] & 15) << 2 | bytes[i2 + 2] >> 6];
    base64 += chars[bytes[i2 + 2] & 63];
  }
  if (len % 3 === 2) {
    base64 = `${base64.substring(0, base64.length - 1)}=`;
  } else if (len % 3 === 1) {
    base64 = `${base64.substring(0, base64.length - 2)}==`;
  }
  return base64;
}
function decode$3(base64) {
  let bufferLength = base64.length * 0.75;
  let len = base64.length;
  let p = 0;
  let encoded1, encoded2, encoded3, encoded4;
  if (base64[base64.length - 1] === "=") {
    bufferLength--;
    if (base64[base64.length - 2] === "=") {
      bufferLength--;
    }
  }
  const bytes = new Uint8Array(bufferLength);
  for (let i2 = 0; i2 < len; i2 += 4) {
    encoded1 = lookup[base64.charCodeAt(i2)];
    encoded2 = lookup[base64.charCodeAt(i2 + 1)];
    encoded3 = lookup[base64.charCodeAt(i2 + 2)];
    encoded4 = lookup[base64.charCodeAt(i2 + 3)];
    bytes[p++] = encoded1 << 2 | encoded2 >> 4;
    bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
    bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
  }
  return bytes;
}
function toBase64URL(u8, type) {
  const base64 = encode(u8);
  return `data:${type};base64,${base64}`;
}
const ImageData$1 = self.ImageData;
const DOMImage = self.Image;
function createCanvas(width, height) {
  let canvas = self.document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}
function fetchBinary(url, { withCredentials = false } = {}) {
  return new Promise(function(resolve2, reject2) {
    let xhr = new self.XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.withCredentials = withCredentials;
    xhr.onload = function(e) {
      if (this.status !== 200) reject2(e);
      else resolve2(this.response);
    };
    xhr.onerror = reject2;
    xhr.send();
  });
}
function createWriteStream() {
  throw new Error("createWriteStream does not exist in the browser");
}
function writeFile() {
  throw new Error("writeFile does not exist in the browser");
}
function getType(type) {
  if (!type.includes("/")) {
    type = `image/${type}`;
  }
  return type;
}
function encodeJpeg(image, options = {}) {
  const data = {
    width: image.width,
    height: image.height,
    data: image.getRGBAData()
  };
  return jpegJs.encode(data, options.quality).data;
}
function encodePng(image, options) {
  const data = {
    width: image.width,
    height: image.height,
    channels: image.channels,
    depth: image.bitDepth,
    data: image.data
  };
  if (data.depth === 1 || data.depth === 32) {
    data.depth = 8;
    data.channels = 4;
    data.data = image.getRGBAData();
  }
  return encodePng$1(data, options);
}
const exportMethods = {
  /**
   * Save the image to disk (Node.js only)
   * @memberof Image
   * @instance
   * @param {string} path
   * @param {object} [options]
   * @param {string} [options.format] - One of: png, jpg, bmp (limited support for bmp). If not specified will try to infer from filename
   * @param {boolean} [options.useCanvas=false] - Force use of the canvas API to save the image instead of a JavaScript implementation
   * @param {object} [options.encoder] - Specify options for the encoder if applicable.
   * @return {Promise} - Resolves when the file is fully written
   */
  save(path, options = {}) {
    const { useCanvas = false, encoder: encoderOptions = void 0 } = options;
    let { format } = options;
    if (!format) {
      const m = /\.(?<format>[a-zA-Z]+)$/.exec(path);
      if (m) {
        format = m.groups.format.toLowerCase();
      }
    }
    if (!format) {
      throw new Error("file format not provided");
    }
    return new Promise((resolve2, reject2) => {
      let stream2, buffer;
      switch (format.toLowerCase()) {
        case "png": {
          if (useCanvas) {
            stream2 = this.getCanvas().pngStream();
          } else {
            buffer = encodePng(this, encoderOptions);
          }
          break;
        }
        case "jpg":
        case "jpeg":
          if (useCanvas) {
            stream2 = this.getCanvas().jpegStream();
          } else {
            buffer = encodeJpeg(this, encoderOptions);
          }
          break;
        case "bmp":
          buffer = encode$2(this, encoderOptions);
          break;
        default:
          throw new RangeError(`invalid output format: ${format}`);
      }
      if (stream2) {
        let out = createWriteStream();
        out.on("finish", resolve2);
        out.on("error", reject2);
        stream2.pipe(out);
      } else if (buffer) {
        writeFile();
      }
    });
  },
  /**
   * Creates a dataURL string from the image.
   * @memberof Image
   * @instance
   * @param {string} [type='image/png']
   * @param {object} [options]
   * @param {boolean} [options.useCanvas=false] - Force use of the canvas API to save the image instead of JavaScript implementation.
   * @param {object} [options.encoder] - Specify options for the encoder if applicable.
   * @return {string|Promise<string>}
   */
  toDataURL(type = "image/png", options = {}) {
    if (typeof type === "object") {
      options = type;
      type = "image/png";
    }
    const { useCanvas = false, encoder: encoderOptions = void 0 } = options;
    type = getType(type);
    function dataUrl(encoder2, ctx) {
      const u8 = encoder2(ctx, encoderOptions);
      return toBase64URL(u8, type);
    }
    if (type === "image/bmp") {
      return dataUrl(encode$2, this);
    } else if (type === "image/png" && !useCanvas) {
      return dataUrl(encodePng, this);
    } else if (type === "image/jpeg" && !useCanvas) {
      return dataUrl(encodeJpeg, this);
    } else {
      return this.getCanvas().toDataURL(type);
    }
  },
  /**
   * Encodes the image and returns a buffer
   * @memberof Image
   * @instance
   * @param {object} [options]
   * @param {string} [options.format='png']
   * @param {object} [options.encoder] - Specify options for the encoder if applicable.
   * @return {Uint8Array}
   */
  toBuffer(options = {}) {
    const { format = "png", encoder: encoderOptions = void 0 } = options;
    switch (format.toLowerCase()) {
      case "png":
        return encodePng(this, encoderOptions);
      case "jpeg":
      case "jpg":
        return encodeJpeg(this, encoderOptions);
      case "bmp":
        return encode$2(this, encoderOptions);
      default:
        throw new RangeError(`invalid output format: ${format}`);
    }
  },
  /**
   * Creates a base64 string from the image.
   * @memberof Image
   * @instance
   * @param {string} [type='image/png']
   * @param {object} [options] - Same options as toDataURL
   * @return {string|Promise<string>}
   */
  toBase64(type = "image/png", options = {}) {
    if (options.async) {
      return this.toDataURL(type, options).then(function(dataURL) {
        return dataURL.substring(dataURL.indexOf(",") + 1);
      });
    } else {
      const dataURL = this.toDataURL(type, options);
      return dataURL.substring(dataURL.indexOf(",") + 1);
    }
  },
  /**
   * Creates a blob from the image and return a Promise.
   * This function is only available in the browser.
   * @memberof Image
   * @instance
   * @param {string} [type='image/png'] A String indicating the image format. The default type is image/png.
   * @param {string} [quality=0.8] A Number between 0 and 1 indicating image quality if the requested type is image/jpeg or image/webp. If this argument is anything else, the default value for image quality is used. Other arguments are ignored.
   * @return {Promise}
   */
  toBlob(type = "image/png", quality = 0.8) {
    return canvasToBlob(this.getCanvas(), type, quality);
  },
  /**
   * Creates a new canvas element and draw the image inside it
   * @memberof Image
   * @instance
   * @return {Canvas}
   */
  getCanvas() {
    const data = new ImageData$1(
      this.getRGBAData({ clamped: true }),
      this.width,
      this.height
    );
    let canvas = createCanvas(this.width, this.height);
    let ctx = canvas.getContext("2d");
    ctx.putImageData(data, 0, 0);
    return canvas;
  }
};
function setExportMethods(Image2) {
  for (const i2 in exportMethods) {
    Image2.prototype[i2] = exportMethods[i2];
  }
}
var hasOwn$1 = { exports: {} };
const name = "has-own";
const version = "1.0.1";
const description = "A safer .hasOwnProperty() - hasOwn(name, obj)";
const main = "index.js";
const scripts = {
  test: "make test"
};
const author = "Aaron Heckmann <aaron.heckmann+github@gmail.com>";
const license = "MIT";
const repository = {
  type: "git",
  url: "git://github.com/aheckmann/has-own.git"
};
const homepage = "https://github.com/aheckmann/has-own/";
const devDependencies = {
  mocha: "^6.2.2"
};
const require$$0$3 = {
  name,
  version,
  description,
  main,
  scripts,
  author,
  license,
  repository,
  homepage,
  devDependencies
};
(function(module2, exports) {
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  module2.exports = exports = function hasOwn2(prop, obj) {
    return hasOwnProperty.call(obj, prop);
  };
  exports.version = require$$0$3.version;
})(hasOwn$1, hasOwn$1.exports);
var hasOwnExports = hasOwn$1.exports;
const hasOwn = /* @__PURE__ */ getDefaultExportFromCjs(hasOwnExports);
let computedPropertyDescriptor$1 = {
  configurable: true,
  enumerable: false,
  get: void 0
};
function extendMethod(name2, method, options = {}) {
  let { inPlace = false, returnThis = true, partialArgs = [] } = options;
  if (inPlace) {
    Image.prototype[name2] = function(...args) {
      this.computed = null;
      let result = method.apply(this, [...partialArgs, ...args]);
      if (returnThis) {
        return this;
      }
      return result;
    };
  } else {
    Image.prototype[name2] = function(...args) {
      return method.apply(this, [...partialArgs, ...args]);
    };
  }
  return Image;
}
function extendProperty(name2, method, options = {}) {
  let { partialArgs = [] } = options;
  computedPropertyDescriptor$1.get = function() {
    if (this.computed === null) {
      this.computed = {};
    } else if (hasOwn(name2, this.computed)) {
      return this.computed[name2];
    }
    let result = method.apply(this, partialArgs);
    this.computed[name2] = result;
    return result;
  };
  Object.defineProperty(Image.prototype, name2, computedPropertyDescriptor$1);
  return Image;
}
const GREY$1 = "GREY";
const RGB$1 = "RGB";
const HSL = "HSL";
const HSV = "HSV";
const CMYK$1 = "CMYK";
const ColorModel = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CMYK: CMYK$1,
  GREY: GREY$1,
  HSL,
  HSV,
  RGB: RGB$1
}, Symbol.toStringTag, { value: "Module" }));
function getRGBAData(options = {}) {
  const { clamped } = options;
  this.checkProcessable("getRGBAData", {
    components: [1, 3],
    bitDepth: [1, 8, 16, 32]
  });
  const arrayLength = this.width * this.height * 4;
  let newData = clamped ? new Uint8ClampedArray(arrayLength) : new Uint8Array(arrayLength);
  if (this.bitDepth === 1) {
    fillDataFromBinary(this, newData);
  } else if (this.bitDepth === 32) {
    this.checkProcessable("getRGBAData", { alpha: 0 });
    if (this.components === 1) {
      fillDataFromGrey32(this, newData);
    } else if (this.components === 3) {
      this.checkProcessable("getRGBAData", { colorModel: [RGB$1] });
      fillDataFromRGB32(this, newData);
    }
  } else {
    if (this.components === 1) {
      fillDataFromGrey(this, newData);
    } else if (this.components === 3) {
      this.checkProcessable("getRGBAData", { colorModel: [RGB$1] });
      fillDataFromRGB(this, newData);
    }
  }
  if (this.alpha === 1) {
    this.checkProcessable("getRGBAData", { bitDepth: [8, 16] });
    copyAlpha(this, newData);
  } else {
    fillAlpha(this, newData);
  }
  return newData;
}
function fillDataFromBinary(image, newData) {
  for (let i2 = 0; i2 < image.size; i2++) {
    const value = image.getBit(i2);
    newData[i2 * 4] = value * 255;
    newData[i2 * 4 + 1] = value * 255;
    newData[i2 * 4 + 2] = value * 255;
  }
}
function fillDataFromGrey32(image, newData) {
  const min2 = image.min[0];
  const max2 = image.max[0];
  const range = max2 - min2;
  for (let i2 = 0; i2 < image.size; i2++) {
    const val = Math.floor(255 * (image.data[i2] - min2) / range);
    newData[i2 * 4] = val;
    newData[i2 * 4 + 1] = val;
    newData[i2 * 4 + 2] = val;
  }
}
function fillDataFromRGB32(image, newData) {
  const min2 = Math.min(...image.min);
  const max2 = Math.max(...image.max);
  const range = max2 - min2;
  for (let i2 = 0; i2 < image.size; i2++) {
    const val1 = Math.floor(255 * (image.data[i2 * 3] - min2) / range);
    const val2 = Math.floor(255 * (image.data[i2 * 3 + 1] - min2) / range);
    const val3 = Math.floor(255 * (image.data[i2 * 3 + 2] - min2) / range);
    newData[i2 * 4] = val1;
    newData[i2 * 4 + 1] = val2;
    newData[i2 * 4 + 2] = val3;
  }
}
function fillDataFromGrey(image, newData) {
  for (let i2 = 0; i2 < image.size; i2++) {
    newData[i2 * 4] = image.data[i2 * image.channels] >>> image.bitDepth - 8;
    newData[i2 * 4 + 1] = image.data[i2 * image.channels] >>> image.bitDepth - 8;
    newData[i2 * 4 + 2] = image.data[i2 * image.channels] >>> image.bitDepth - 8;
  }
}
function fillDataFromRGB(image, newData) {
  for (let i2 = 0; i2 < image.size; i2++) {
    newData[i2 * 4] = image.data[i2 * image.channels] >>> image.bitDepth - 8;
    newData[i2 * 4 + 1] = image.data[i2 * image.channels + 1] >>> image.bitDepth - 8;
    newData[i2 * 4 + 2] = image.data[i2 * image.channels + 2] >>> image.bitDepth - 8;
  }
}
function copyAlpha(image, newData) {
  for (let i2 = 0; i2 < image.size; i2++) {
    newData[i2 * 4 + 3] = image.data[i2 * image.channels + image.components] >> image.bitDepth - 8;
  }
}
function fillAlpha(image, newData) {
  for (let i2 = 0; i2 < image.size; i2++) {
    newData[i2 * 4 + 3] = 255;
  }
}
const BINARY = "BINARY";
const GREY = "GREY";
const GREYA = "GREYA";
const RGB = "RGB";
const RGBA = "RGBA";
const CMYK = "CMYK";
const CMYKA = "CMYKA";
const kinds = {};
kinds[BINARY] = {
  components: 1,
  alpha: 0,
  bitDepth: 1,
  colorModel: GREY$1
};
kinds[GREYA] = {
  components: 1,
  alpha: 1,
  bitDepth: 8,
  colorModel: GREY$1
};
kinds[GREY] = {
  components: 1,
  alpha: 0,
  bitDepth: 8,
  colorModel: GREY$1
};
kinds[RGBA] = {
  components: 3,
  alpha: 1,
  bitDepth: 8,
  colorModel: RGB$1
};
kinds[RGB] = {
  components: 3,
  alpha: 0,
  bitDepth: 8,
  colorModel: RGB$1
};
kinds[CMYK] = {
  components: 4,
  alpha: 0,
  bitDepth: 8,
  colorModel: CMYK$1
};
kinds[CMYKA] = {
  components: 4,
  alpha: 1,
  bitDepth: 8,
  colorModel: CMYK$1
};
function getKind(kind) {
  const result = kinds[kind];
  if (!result) {
    throw new RangeError(`invalid image kind: ${kind}`);
  }
  return result;
}
const validBitDepth = [1, 8, 16, 32];
function verifyKindDefinition(definition) {
  const { components, alpha, bitDepth, colorModel } = definition;
  if (!Number.isInteger(components) || components <= 0) {
    throw new RangeError(
      `invalid components: ${components}. Must be a positive integer`
    );
  }
  if (alpha !== 0 && alpha !== 1 && typeof alpha !== "boolean") {
    throw new TypeError(`invalid alpha: ${alpha}: must be a boolean, 0 or 1`);
  }
  if (!validBitDepth.includes(bitDepth)) {
    throw new RangeError(
      `invalid bitDepth: ${bitDepth}. Must be one of ${validBitDepth.join(
        ", "
      )}`
    );
  }
  if (!ColorModel[colorModel]) {
    throw new RangeError(
      `invalid colorModel: ${colorModel}. Must be one of ${Object.keys(
        ColorModel
      ).join(", ")}`
    );
  }
}
function getTheoreticalPixelArraySize(size, channels, bitDepth) {
  let length = channels * size;
  if (bitDepth === 1) {
    length = Math.ceil(length / 8);
  }
  return length;
}
function createPixelArray(size, components, alpha, channels, bitDepth, maxValue) {
  const length = channels * size;
  let arr;
  switch (bitDepth) {
    case 1:
      arr = new Uint8Array(Math.ceil(length / 8));
      break;
    case 8:
      arr = new Uint8Array(length);
      break;
    case 16:
      arr = new Uint16Array(length);
      break;
    case 32:
      arr = new Float32Array(length);
      break;
    default:
      throw new Error(`Cannot create pixel array for bit depth ${bitDepth}`);
  }
  if (alpha) {
    for (let i2 = components; i2 < arr.length; i2 += channels) {
      arr[i2] = maxValue;
    }
  }
  return arr;
}
const defaultByteLength = 1024 * 8;
const charArray = [];
let IOBuffer$2 = class IOBuffer3 {
  constructor(data, options) {
    options = options || {};
    if (data === void 0) {
      data = defaultByteLength;
    }
    if (typeof data === "number") {
      data = new ArrayBuffer(data);
    }
    let length = data.byteLength;
    const offset = options.offset ? options.offset >>> 0 : 0;
    if (data.buffer) {
      length = data.byteLength - offset;
      if (data.byteLength !== data.buffer.byteLength) {
        data = data.buffer.slice(data.byteOffset + offset, data.byteOffset + data.byteLength);
      } else if (offset) {
        data = data.buffer.slice(offset);
      } else {
        data = data.buffer;
      }
    }
    this.buffer = data;
    this.length = length;
    this.byteLength = length;
    this.byteOffset = 0;
    this.offset = 0;
    this.littleEndian = true;
    this._data = new DataView(this.buffer);
    this._increment = length || defaultByteLength;
    this._mark = 0;
  }
  available(byteLength) {
    if (byteLength === void 0) byteLength = 1;
    return this.offset + byteLength <= this.length;
  }
  isLittleEndian() {
    return this.littleEndian;
  }
  setLittleEndian() {
    this.littleEndian = true;
  }
  isBigEndian() {
    return !this.littleEndian;
  }
  setBigEndian() {
    this.littleEndian = false;
  }
  skip(n) {
    if (n === void 0) n = 1;
    this.offset += n;
  }
  seek(offset) {
    this.offset = offset;
  }
  mark() {
    this._mark = this.offset;
  }
  reset() {
    this.offset = this._mark;
  }
  rewind() {
    this.offset = 0;
  }
  ensureAvailable(byteLength) {
    if (byteLength === void 0) byteLength = 1;
    if (!this.available(byteLength)) {
      const newIncrement = this._increment + this._increment;
      this._increment = newIncrement;
      const newLength = this.length + newIncrement;
      const newArray2 = new Uint8Array(newLength);
      newArray2.set(new Uint8Array(this.buffer));
      this.buffer = newArray2.buffer;
      this.length = newLength;
      this._data = new DataView(this.buffer);
    }
  }
  readBoolean() {
    return this.readUint8() !== 0;
  }
  readInt8() {
    return this._data.getInt8(this.offset++);
  }
  readUint8() {
    return this._data.getUint8(this.offset++);
  }
  readByte() {
    return this.readUint8();
  }
  readBytes(n) {
    if (n === void 0) n = 1;
    var bytes = new Uint8Array(n);
    for (var i2 = 0; i2 < n; i2++) {
      bytes[i2] = this.readByte();
    }
    return bytes;
  }
  readInt16() {
    var value = this._data.getInt16(this.offset, this.littleEndian);
    this.offset += 2;
    return value;
  }
  readUint16() {
    var value = this._data.getUint16(this.offset, this.littleEndian);
    this.offset += 2;
    return value;
  }
  readInt32() {
    var value = this._data.getInt32(this.offset, this.littleEndian);
    this.offset += 4;
    return value;
  }
  readUint32() {
    var value = this._data.getUint32(this.offset, this.littleEndian);
    this.offset += 4;
    return value;
  }
  readFloat32() {
    var value = this._data.getFloat32(this.offset, this.littleEndian);
    this.offset += 4;
    return value;
  }
  readFloat64() {
    var value = this._data.getFloat64(this.offset, this.littleEndian);
    this.offset += 8;
    return value;
  }
  readChar() {
    return String.fromCharCode(this.readInt8());
  }
  readChars(n) {
    if (n === void 0) n = 1;
    charArray.length = n;
    for (var i2 = 0; i2 < n; i2++) {
      charArray[i2] = this.readChar();
    }
    return charArray.join("");
  }
  writeBoolean(bool) {
    this.writeUint8(bool ? 255 : 0);
  }
  writeInt8(value) {
    this.ensureAvailable(1);
    this._data.setInt8(this.offset++, value);
  }
  writeUint8(value) {
    this.ensureAvailable(1);
    this._data.setUint8(this.offset++, value);
  }
  writeByte(value) {
    this.writeUint8(value);
  }
  writeBytes(bytes) {
    this.ensureAvailable(bytes.length);
    for (var i2 = 0; i2 < bytes.length; i2++) {
      this._data.setUint8(this.offset++, bytes[i2]);
    }
  }
  writeInt16(value) {
    this.ensureAvailable(2);
    this._data.setInt16(this.offset, value, this.littleEndian);
    this.offset += 2;
  }
  writeUint16(value) {
    this.ensureAvailable(2);
    this._data.setUint16(this.offset, value, this.littleEndian);
    this.offset += 2;
  }
  writeInt32(value) {
    this.ensureAvailable(4);
    this._data.setInt32(this.offset, value, this.littleEndian);
    this.offset += 4;
  }
  writeUint32(value) {
    this.ensureAvailable(4);
    this._data.setUint32(this.offset, value, this.littleEndian);
    this.offset += 4;
  }
  writeFloat32(value) {
    this.ensureAvailable(4);
    this._data.setFloat32(this.offset, value, this.littleEndian);
    this.offset += 4;
  }
  writeFloat64(value) {
    this.ensureAvailable(8);
    this._data.setFloat64(this.offset, value, this.littleEndian);
    this.offset += 8;
  }
  writeChar(str) {
    this.writeUint8(str.charCodeAt(0));
  }
  writeChars(str) {
    for (var i2 = 0; i2 < str.length; i2++) {
      this.writeUint8(str.charCodeAt(i2));
    }
  }
  toArray() {
    return new Uint8Array(this.buffer, 0, this.offset);
  }
};
var IOBuffer_1 = IOBuffer$2;
var src$3 = {};
const tagsById$5 = {
  // Baseline tags
  254: "NewSubfileType",
  255: "SubfileType",
  256: "ImageWidth",
  257: "ImageLength",
  258: "BitsPerSample",
  259: "Compression",
  262: "PhotometricInterpretation",
  263: "Threshholding",
  264: "CellWidth",
  265: "CellLength",
  266: "FillOrder",
  270: "ImageDescription",
  271: "Make",
  272: "Model",
  273: "StripOffsets",
  274: "Orientation",
  277: "SamplesPerPixel",
  278: "RowsPerStrip",
  279: "StripByteCounts",
  280: "MinSampleValue",
  281: "MaxSampleValue",
  282: "XResolution",
  283: "YResolution",
  284: "PlanarConfiguration",
  288: "FreeOffsets",
  289: "FreeByteCounts",
  290: "GrayResponseUnit",
  291: "GrayResponseCurve",
  296: "ResolutionUnit",
  305: "Software",
  306: "DateTime",
  315: "Artist",
  316: "HostComputer",
  320: "ColorMap",
  338: "ExtraSamples",
  33432: "Copyright",
  // Extension tags
  269: "DocumentName",
  285: "PageName",
  286: "XPosition",
  287: "YPosition",
  292: "T4Options",
  293: "T6Options",
  297: "PageNumber",
  301: "TransferFunction",
  317: "Predictor",
  318: "WhitePoint",
  319: "PrimaryChromaticities",
  321: "HalftoneHints",
  322: "TileWidth",
  323: "TileLength",
  324: "TileOffsets",
  325: "TileByteCounts",
  326: "BadFaxLines",
  327: "CleanFaxData",
  328: "ConsecutiveBadFaxLines",
  330: "SubIFDs",
  332: "InkSet",
  333: "InkNames",
  334: "NumberOfInks",
  336: "DotRange",
  337: "TargetPrinter",
  339: "SampleFormat",
  340: "SMinSampleValue",
  341: "SMaxSampleValue",
  342: "TransferRange",
  343: "ClipPath",
  344: "XClipPathUnits",
  345: "YClipPathUnits",
  346: "Indexed",
  347: "JPEGTables",
  351: "OPIProxy",
  400: "GlobalParametersIFD",
  401: "ProfileType",
  402: "FaxProfile",
  403: "CodingMethods",
  404: "VersionYear",
  405: "ModeNumber",
  433: "Decode",
  434: "DefaultImageColor",
  512: "JPEGProc",
  513: "JPEGInterchangeFormat",
  514: "JPEGInterchangeFormatLength",
  515: "JPEGRestartInterval",
  517: "JPEGLosslessPredictors",
  518: "JPEGPointTransforms",
  519: "JPEGQTables",
  520: "JPEGDCTables",
  521: "JPEGACTables",
  529: "YCbCrCoefficients",
  530: "YCbCrSubSampling",
  531: "YCbCrPositioning",
  532: "ReferenceBlackWhite",
  559: "StripRowCounts",
  700: "XMP",
  32781: "ImageID",
  34732: "ImageLayer",
  // Private tags
  32932: "WangAnnotatio",
  33445: "MDFileTag",
  33446: "MDScalePixel",
  33447: "MDColorTable",
  33448: "MDLabName",
  33449: "MDSampleInfo",
  33450: "MDPrepDate",
  33451: "MDPrepTime",
  33452: "MDFileUnits",
  33550: "ModelPixelScaleTag",
  33723: "IPTC",
  33918: "INGRPacketDataTag",
  33919: "INGRFlagRegisters",
  33920: "IrasBTransformationMatrix",
  33922: "ModelTiepointTag",
  34264: "ModelTransformationTag",
  34377: "Photoshop",
  34665: "ExifIFD",
  34675: "ICCProfile",
  34735: "GeoKeyDirectoryTag",
  34736: "GeoDoubleParamsTag",
  34737: "GeoAsciiParamsTag",
  34853: "GPSIFD",
  34908: "HylaFAXFaxRecvParams",
  34909: "HylaFAXFaxSubAddress",
  34910: "HylaFAXFaxRecvTime",
  37724: "ImageSourceData",
  40965: "InteroperabilityIFD",
  42112: "GDAL_METADATA",
  42113: "GDAL_NODATA",
  50215: "OceScanjobDescription",
  50216: "OceApplicationSelector",
  50217: "OceIdentificationNumber",
  50218: "OceImageLogicCharacteristics",
  50706: "DNGVersion",
  50707: "DNGBackwardVersion",
  50708: "UniqueCameraModel",
  50709: "LocalizedCameraModel",
  50710: "CFAPlaneColor",
  50711: "CFALayout",
  50712: "LinearizationTable",
  50713: "BlackLevelRepeatDim",
  50714: "BlackLevel",
  50715: "BlackLevelDeltaH",
  50716: "BlackLevelDeltaV",
  50717: "WhiteLevel",
  50718: "DefaultScale",
  50719: "DefaultCropOrigin",
  50720: "DefaultCropSize",
  50721: "ColorMatrix1",
  50722: "ColorMatrix2",
  50723: "CameraCalibration1",
  50724: "CameraCalibration2",
  50725: "ReductionMatrix1",
  50726: "ReductionMatrix2",
  50727: "AnalogBalance",
  50728: "AsShotNeutral",
  50729: "AsShotWhiteXY",
  50730: "BaselineExposure",
  50731: "BaselineNoise",
  50732: "BaselineSharpness",
  50733: "BayerGreenSplit",
  50734: "LinearResponseLimit",
  50735: "CameraSerialNumber",
  50736: "LensInfo",
  50737: "ChromaBlurRadius",
  50738: "AntiAliasStrength",
  50740: "DNGPrivateData",
  50741: "MakerNoteSafety",
  50778: "CalibrationIlluminant1",
  50779: "CalibrationIlluminant2",
  50780: "BestQualityScale",
  50784: "AliasLayerMetadata"
};
const tagsByName$5 = {};
for (var i$2 in tagsById$5) {
  tagsByName$5[tagsById$5[i$2]] = i$2;
}
var standard$1 = {
  tagsById: tagsById$5,
  tagsByName: tagsByName$5
};
const tagsById$4 = {
  33434: "ExposureTime",
  33437: "FNumber",
  34850: "ExposureProgram",
  34852: "SpectralSensitivity",
  34855: "ISOSpeedRatings",
  34856: "OECF",
  34864: "SensitivityType",
  34865: "StandardOutputSensitivity",
  34866: "RecommendedExposureIndex",
  34867: "ISOSpeed",
  34868: "ISOSpeedLatitudeyyy",
  34869: "ISOSpeedLatitudezzz",
  36864: "ExifVersion",
  36867: "DateTimeOriginal",
  36868: "DateTimeDigitized",
  37121: "ComponentsConfiguration",
  37122: "CompressedBitsPerPixel",
  37377: "ShutterSpeedValue",
  37378: "ApertureValue",
  37379: "BrightnessValue",
  37380: "ExposureBiasValue",
  37381: "MaxApertureValue",
  37382: "SubjectDistance",
  37383: "MeteringMode",
  37384: "LightSource",
  37385: "Flash",
  37386: "FocalLength",
  37396: "SubjectArea",
  37500: "MakerNote",
  37510: "UserComment",
  37520: "SubsecTime",
  37521: "SubsecTimeOriginal",
  37522: "SubsecTimeDigitized",
  40960: "FlashpixVersion",
  40961: "ColorSpace",
  40962: "PixelXDimension",
  40963: "PixelYDimension",
  40964: "RelatedSoundFile",
  41483: "FlashEnergy",
  41484: "SpatialFrequencyResponse",
  41486: "FocalPlaneXResolution",
  41487: "FocalPlaneYResolution",
  41488: "FocalPlaneResolutionUnit",
  41492: "SubjectLocation",
  41493: "ExposureIndex",
  41495: "SensingMethod",
  41728: "FileSource",
  41729: "SceneType",
  41730: "CFAPattern",
  41985: "CustomRendered",
  41986: "ExposureMode",
  41987: "WhiteBalance",
  41988: "DigitalZoomRatio",
  41989: "FocalLengthIn35mmFilm",
  41990: "SceneCaptureType",
  41991: "GainControl",
  41992: "Contrast",
  41993: "Saturation",
  41994: "Sharpness",
  41995: "DeviceSettingDescription",
  41996: "SubjectDistanceRange",
  42016: "ImageUniqueID",
  42032: "CameraOwnerName",
  42033: "BodySerialNumber",
  42034: "LensSpecification",
  42035: "LensMake",
  42036: "LensModel",
  42037: "LensSerialNumber",
  42240: "Gamma"
};
const tagsByName$4 = {};
for (var i$1 in tagsById$4) {
  tagsByName$4[tagsById$4[i$1]] = i$1;
}
var exif$1 = {
  tagsById: tagsById$4,
  tagsByName: tagsByName$4
};
const tagsById$3 = {
  0: "GPSVersionID",
  1: "GPSLatitudeRef",
  2: "GPSLatitude",
  3: "GPSLongitudeRef",
  4: "GPSLongitude",
  5: "GPSAltitudeRef",
  6: "GPSAltitude",
  7: "GPSTimeStamp",
  8: "GPSSatellites",
  9: "GPSStatus",
  10: "GPSMeasureMode",
  11: "GPSDOP",
  12: "GPSSpeedRef",
  13: "GPSSpeed",
  14: "GPSTrackRef",
  15: "GPSTrack",
  16: "GPSImgDirectionRef",
  17: "GPSImgDirection",
  18: "GPSMapDatum",
  19: "GPSDestLatitudeRef",
  20: "GPSDestLatitude",
  21: "GPSDestLongitudeRef",
  22: "GPSDestLongitude",
  23: "GPSDestBearingRef",
  24: "GPSDestBearing",
  25: "GPSDestDistanceRef",
  26: "GPSDestDistance",
  27: "GPSProcessingMethod",
  28: "GPSAreaInformation",
  29: "GPSDateStamp",
  30: "GPSDifferential",
  31: "GPSHPositioningError"
};
const tagsByName$3 = {};
for (var i in tagsById$3) {
  tagsByName$3[tagsById$3[i]] = i;
}
var gps$1 = {
  tagsById: tagsById$3,
  tagsByName: tagsByName$3
};
const tags$1 = {
  standard: standard$1,
  exif: exif$1,
  gps: gps$1
};
let IFD$2 = class IFD2 {
  constructor(kind) {
    if (!kind) {
      throw new Error("missing kind");
    }
    this.data = null;
    this.fields = /* @__PURE__ */ new Map();
    this.kind = kind;
    this._map = null;
  }
  get(tag) {
    if (typeof tag === "number") {
      return this.fields.get(tag);
    } else if (typeof tag === "string") {
      return this.fields.get(tags$1[this.kind].tagsByName[tag]);
    } else {
      throw new Error("expected a number or string");
    }
  }
  get map() {
    if (!this._map) {
      this._map = {};
      const taglist = tags$1[this.kind].tagsById;
      for (var key of this.fields.keys()) {
        if (taglist[key]) {
          this._map[taglist[key]] = this.fields.get(key);
        }
      }
    }
    return this._map;
  }
};
var ifd = IFD$2;
const Ifd = ifd;
const dateTimeRegex$1 = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
let TiffIfd$1 = class TiffIfd2 extends Ifd {
  constructor() {
    super("standard");
  }
  // Custom fields
  get size() {
    return this.width * this.height;
  }
  get width() {
    return this.imageWidth;
  }
  get height() {
    return this.imageLength;
  }
  get components() {
    return this.samplesPerPixel;
  }
  get date() {
    var date = /* @__PURE__ */ new Date();
    var result = dateTimeRegex$1.exec(this.dateTime);
    date.setFullYear(result[1], result[2] - 1, result[3]);
    date.setHours(result[4], result[5], result[6]);
    return date;
  }
  // IFD fields
  get newSubfileType() {
    return this.get(254);
  }
  get imageWidth() {
    return this.get(256);
  }
  get imageLength() {
    return this.get(257);
  }
  get bitsPerSample() {
    return this.get(258);
  }
  get compression() {
    return this.get(259) || 1;
  }
  get type() {
    return this.get(262);
  }
  get fillOrder() {
    return this.get(266) || 1;
  }
  get documentName() {
    return this.get(269);
  }
  get imageDescription() {
    return this.get(270);
  }
  get stripOffsets() {
    return alwaysArray$1(this.get(273));
  }
  get orientation() {
    return this.get(274);
  }
  get samplesPerPixel() {
    return this.get(277);
  }
  get rowsPerStrip() {
    return this.get(278);
  }
  get stripByteCounts() {
    return alwaysArray$1(this.get(279));
  }
  get minSampleValue() {
    return this.get(280) || 0;
  }
  get maxSampleValue() {
    return this.get(281) || Math.pow(2, this.bitsPerSample) - 1;
  }
  get xResolution() {
    return this.get(282);
  }
  get yResolution() {
    return this.get(283);
  }
  get planarConfiguration() {
    return this.get(284) || 1;
  }
  get resolutionUnit() {
    return this.get(296) || 2;
  }
  get dateTime() {
    return this.get(306);
  }
  get predictor() {
    return this.get(317) || 1;
  }
  get sampleFormat() {
    return this.get(339) || 1;
  }
  get sMinSampleValue() {
    return this.get(340) || this.minSampleValue;
  }
  get sMaxSampleValue() {
    return this.get(341) || this.maxSampleValue;
  }
};
function alwaysArray$1(value) {
  if (typeof value === "number") return [value];
  return value;
}
var tiffIfd = TiffIfd$1;
var ifdValue = {};
var types$1 = /* @__PURE__ */ new Map([
  [1, [1, readByte$1]],
  // BYTE
  [2, [1, readASCII$1]],
  // ASCII
  [3, [2, readShort$1]],
  // SHORT
  [4, [4, readLong$1]],
  // LONG
  [5, [8, readRational$1]],
  // RATIONAL
  [6, [1, readSByte$1]],
  // SBYTE
  [7, [1, readByte$1]],
  // UNDEFINED
  [8, [2, readSShort$1]],
  // SSHORT
  [9, [4, readSLong$1]],
  // SLONG
  [10, [8, readSRational$1]],
  // SRATIONAL
  [11, [4, readFloat$1]],
  // FLOAT
  [12, [8, readDouble$1]]
  // DOUBLE
]);
ifdValue.getByteLength = function(type, count) {
  return types$1.get(type)[0] * count;
};
ifdValue.readData = function(decoder2, type, count) {
  return types$1.get(type)[1](decoder2, count);
};
function readByte$1(decoder2, count) {
  if (count === 1) return decoder2.readUint8();
  var array = new Uint8Array(count);
  for (var i2 = 0; i2 < count; i2++) {
    array[i2] = decoder2.readUint8();
  }
  return array;
}
function readASCII$1(decoder2, count) {
  var strings2 = [];
  var currentString = "";
  for (var i2 = 0; i2 < count; i2++) {
    var char = String.fromCharCode(decoder2.readUint8());
    if (char === "\0") {
      strings2.push(currentString);
      currentString = "";
    } else {
      currentString += char;
    }
  }
  if (strings2.length === 1) {
    return strings2[0];
  } else {
    return strings2;
  }
}
function readShort$1(decoder2, count) {
  if (count === 1) return decoder2.readUint16();
  var array = new Uint16Array(count);
  for (var i2 = 0; i2 < count; i2++) {
    array[i2] = decoder2.readUint16();
  }
  return array;
}
function readLong$1(decoder2, count) {
  if (count === 1) return decoder2.readUint32();
  var array = new Uint32Array(count);
  for (var i2 = 0; i2 < count; i2++) {
    array[i2] = decoder2.readUint32();
  }
  return array;
}
function readRational$1(decoder2, count) {
  if (count === 1) {
    return decoder2.readUint32() / decoder2.readUint32();
  }
  var rationals = new Array(count);
  for (var i2 = 0; i2 < count; i2++) {
    rationals[i2] = decoder2.readUint32() / decoder2.readUint32();
  }
  return rationals;
}
function readSByte$1(decoder2, count) {
  if (count === 1) return decoder2.readInt8();
  var array = new Int8Array(count);
  for (var i2 = 0; i2 < count; i2++) {
    array[i2] = decoder2.readInt8();
  }
  return array;
}
function readSShort$1(decoder2, count) {
  if (count === 1) return decoder2.readInt16();
  var array = new Int16Array(count);
  for (var i2 = 0; i2 < count; i2++) {
    array[i2] = decoder2.readInt16();
  }
  return array;
}
function readSLong$1(decoder2, count) {
  if (count === 1) return decoder2.readInt32();
  var array = new Int32Array(count);
  for (var i2 = 0; i2 < count; i2++) {
    array[i2] = decoder2.readInt32();
  }
  return array;
}
function readSRational$1(decoder2, count) {
  if (count === 1) {
    return decoder2.readInt32() / decoder2.readInt32();
  }
  var rationals = new Array(count);
  for (var i2 = 0; i2 < count; i2++) {
    rationals[i2] = decoder2.readInt32() / decoder2.readInt32();
  }
  return rationals;
}
function readFloat$1(decoder2, count) {
  if (count === 1) return decoder2.readFloat32();
  var array = new Float32Array(count);
  for (var i2 = 0; i2 < count; i2++) {
    array[i2] = decoder2.readFloat32();
  }
  return array;
}
function readDouble$1(decoder2, count) {
  if (count === 1) return decoder2.readFloat64();
  var array = new Float64Array(count);
  for (var i2 = 0; i2 < count; i2++) {
    array[i2] = decoder2.readFloat64();
  }
  return array;
}
const IOBuffer$1 = IOBuffer_1;
const IFD$1 = ifd;
const TiffIFD = tiffIfd;
const IFDValue = ifdValue;
const defaultOptions$d = {
  ignoreImageData: false,
  onlyFirst: false
};
let TIFFDecoder$2 = class TIFFDecoder2 extends IOBuffer$1 {
  constructor(data, options) {
    super(data, options);
    this._nextIFD = 0;
  }
  decode(options) {
    options = Object.assign({}, defaultOptions$d, options);
    const result = [];
    this.decodeHeader();
    while (this._nextIFD) {
      result.push(this.decodeIFD(options));
      if (options.onlyFirst) {
        return result[0];
      }
    }
    return result;
  }
  decodeHeader() {
    let value = this.readUint16();
    if (value === 18761) {
      this.setLittleEndian();
    } else if (value === 19789) {
      this.setBigEndian();
    } else {
      throw new Error("invalid byte order: 0x" + value.toString(16));
    }
    value = this.readUint16();
    if (value !== 42) {
      throw new Error("not a TIFF file");
    }
    this._nextIFD = this.readUint32();
  }
  decodeIFD(options) {
    this.seek(this._nextIFD);
    var ifd2;
    if (!options.kind) {
      ifd2 = new TiffIFD();
    } else {
      ifd2 = new IFD$1(options.kind);
    }
    const numEntries = this.readUint16();
    for (var i2 = 0; i2 < numEntries; i2++) {
      this.decodeIFDEntry(ifd2);
    }
    if (!options.ignoreImageData) {
      this.decodeImageData(ifd2);
    }
    this._nextIFD = this.readUint32();
    return ifd2;
  }
  decodeIFDEntry(ifd2) {
    const offset = this.offset;
    const tag = this.readUint16();
    const type = this.readUint16();
    const numValues = this.readUint32();
    if (type < 1 || type > 12) {
      this.skip(4);
      return;
    }
    const valueByteLength = IFDValue.getByteLength(type, numValues);
    if (valueByteLength > 4) {
      this.seek(this.readUint32());
    }
    const value = IFDValue.readData(this, type, numValues);
    ifd2.fields.set(tag, value);
    if (tag === 34665 || tag === 34853) {
      let currentOffset = this.offset;
      let kind;
      if (tag === 34665) {
        kind = "exif";
      } else if (tag === 34853) {
        kind = "gps";
      }
      this._nextIFD = value;
      ifd2[kind] = this.decodeIFD({
        kind,
        ignoreImageData: true
      });
      this.offset = currentOffset;
    }
    this.seek(offset);
    this.skip(12);
  }
  decodeImageData(ifd2) {
    const orientation2 = ifd2.orientation;
    if (orientation2 && orientation2 !== 1) {
      unsupported$1("orientation", orientation2);
    }
    switch (ifd2.type) {
      case 1:
      case 2:
        this.readStripData(ifd2);
        break;
      default:
        unsupported$1("image type", ifd2.type);
        break;
    }
  }
  readStripData(ifd2) {
    const width = ifd2.width;
    const height = ifd2.height;
    const bitDepth = validateBitDepth(ifd2.bitsPerSample);
    const sampleFormat = ifd2.sampleFormat;
    let size = width * height;
    const data = getDataArray$1(size, 1, bitDepth, sampleFormat);
    const compression = ifd2.compression;
    const rowsPerStrip = ifd2.rowsPerStrip;
    const maxPixels = rowsPerStrip * width;
    const stripOffsets = ifd2.stripOffsets;
    const stripByteCounts = ifd2.stripByteCounts;
    var pixel = 0;
    for (var i2 = 0; i2 < stripOffsets.length; i2++) {
      var stripData = this.getStripData(compression, stripOffsets[i2], stripByteCounts[i2]);
      var length = size > maxPixels ? maxPixels : size;
      size -= length;
      if (bitDepth === 8) {
        pixel = fill8bit$1(data, stripData, pixel, length);
      } else if (bitDepth === 16) {
        pixel = fill16bit$1(data, stripData, pixel, length, this.isLittleEndian());
      } else if (bitDepth === 32 && sampleFormat === 3) {
        pixel = fillFloat32$1(data, stripData, pixel, length, this.isLittleEndian());
      } else {
        unsupported$1("bitDepth", bitDepth);
      }
    }
    ifd2.data = data;
  }
  getStripData(compression, offset, byteCounts) {
    switch (compression) {
      case 1:
        return new DataView(this.buffer, offset, byteCounts);
      case 2:
      case 32773:
        return unsupported$1("Compression", compression);
      default:
        throw new Error("invalid compression: " + compression);
    }
  }
};
var tiffDecoder = TIFFDecoder$2;
function getDataArray$1(size, channels, bitDepth, sampleFormat) {
  if (bitDepth === 8) {
    return new Uint8Array(size * channels);
  } else if (bitDepth === 16) {
    return new Uint16Array(size * channels);
  } else if (bitDepth === 32 && sampleFormat === 3) {
    return new Float32Array(size * channels);
  } else {
    return unsupported$1("bit depth / sample format", bitDepth + " / " + sampleFormat);
  }
}
function fill8bit$1(dataTo, dataFrom, index, length) {
  for (var i2 = 0; i2 < length; i2++) {
    dataTo[index++] = dataFrom.getUint8(i2);
  }
  return index;
}
function fill16bit$1(dataTo, dataFrom, index, length, littleEndian) {
  for (var i2 = 0; i2 < length * 2; i2 += 2) {
    dataTo[index++] = dataFrom.getUint16(i2, littleEndian);
  }
  return index;
}
function fillFloat32$1(dataTo, dataFrom, index, length, littleEndian) {
  for (var i2 = 0; i2 < length * 4; i2 += 4) {
    dataTo[index++] = dataFrom.getFloat32(i2, littleEndian);
  }
  return index;
}
function unsupported$1(type, value) {
  throw new Error("Unsupported " + type + ": " + value);
}
function validateBitDepth(bitDepth) {
  if (bitDepth.length) {
    const bitDepthArray = bitDepth;
    bitDepth = bitDepthArray[0];
    for (var i2 = 0; i2 < bitDepthArray.length; i2++) {
      if (bitDepthArray[i2] !== bitDepth) {
        unsupported$1("bit depth", bitDepthArray);
      }
    }
  }
  return bitDepth;
}
const TIFFDecoder$1 = tiffDecoder;
var decode$2 = function decodeTIFF2(data, options) {
  const decoder2 = new TIFFDecoder$1(data, options);
  return decoder2.decode(options);
};
src$3.decode = decode$2;
const IOBuffer = IOBuffer_1;
const tiff = src$3;
function decode$1(data) {
  const buffer = new IOBuffer(data);
  const result = {};
  buffer.setBigEndian();
  const val = buffer.readUint16();
  if (val !== 65496) {
    throw new Error("SOI marker not found. Not a valid JPEG file");
  }
  const next = buffer.readUint16();
  if (next === 65505) {
    buffer.readUint16();
    const header = buffer.readBytes(6);
    if (header[0] === 69 && // E
    header[1] === 120 && // x
    header[2] === 105 && // i
    header[3] === 102 && // f
    header[4] === 0 && header[5] === 0) {
      const exif2 = tiff.decode(buffer, {
        onlyFirst: true,
        ignoreImageData: true,
        offset: buffer.offset
      });
      result.exif = exif2;
    }
  }
  return result;
}
var decode_1 = decode$1;
var decode = decode_1;
var imageType$2 = { exports: {} };
var fileType$1 = { exports: {} };
(function(module) {
  const toBytes = (s) => [...s].map((c) => c.charCodeAt(0));
  const xpiZipFilename = toBytes("META-INF/mozilla.rsa");
  const oxmlContentTypes = toBytes("[Content_Types].xml");
  const oxmlRels = toBytes("_rels/.rels");
  function readUInt64LE(buf, offset = 0) {
    let n = buf[offset];
    let mul = 1;
    let i2 = 0;
    while (++i2 < 8) {
      mul *= 256;
      n += buf[offset + i2] * mul;
    }
    return n;
  }
  const fileType = (input) => {
    if (!(input instanceof Uint8Array || input instanceof ArrayBuffer || Buffer.isBuffer(input))) {
      throw new TypeError(`Expected the \`input\` argument to be of type \`Uint8Array\` or \`Buffer\` or \`ArrayBuffer\`, got \`${typeof input}\``);
    }
    const buf = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (!(buf && buf.length > 1)) {
      return null;
    }
    const check = (header, options) => {
      options = Object.assign({
        offset: 0
      }, options);
      for (let i2 = 0; i2 < header.length; i2++) {
        if (options.mask) {
          if (header[i2] !== (options.mask[i2] & buf[i2 + options.offset])) {
            return false;
          }
        } else if (header[i2] !== buf[i2 + options.offset]) {
          return false;
        }
      }
      return true;
    };
    const checkString = (header, options) => check(toBytes(header), options);
    if (check([255, 216, 255])) {
      return {
        ext: "jpg",
        mime: "image/jpeg"
      };
    }
    if (check([137, 80, 78, 71, 13, 10, 26, 10])) {
      return {
        ext: "png",
        mime: "image/png"
      };
    }
    if (check([71, 73, 70])) {
      return {
        ext: "gif",
        mime: "image/gif"
      };
    }
    if (check([87, 69, 66, 80], { offset: 8 })) {
      return {
        ext: "webp",
        mime: "image/webp"
      };
    }
    if (check([70, 76, 73, 70])) {
      return {
        ext: "flif",
        mime: "image/flif"
      };
    }
    if ((check([73, 73, 42, 0]) || check([77, 77, 0, 42])) && check([67, 82], { offset: 8 })) {
      return {
        ext: "cr2",
        mime: "image/x-canon-cr2"
      };
    }
    if (check([73, 73, 42, 0]) || check([77, 77, 0, 42])) {
      return {
        ext: "tif",
        mime: "image/tiff"
      };
    }
    if (check([66, 77])) {
      return {
        ext: "bmp",
        mime: "image/bmp"
      };
    }
    if (check([73, 73, 188])) {
      return {
        ext: "jxr",
        mime: "image/vnd.ms-photo"
      };
    }
    if (check([56, 66, 80, 83])) {
      return {
        ext: "psd",
        mime: "image/vnd.adobe.photoshop"
      };
    }
    if (check([80, 75, 3, 4])) {
      if (check([109, 105, 109, 101, 116, 121, 112, 101, 97, 112, 112, 108, 105, 99, 97, 116, 105, 111, 110, 47, 101, 112, 117, 98, 43, 122, 105, 112], { offset: 30 })) {
        return {
          ext: "epub",
          mime: "application/epub+zip"
        };
      }
      if (check(xpiZipFilename, { offset: 30 })) {
        return {
          ext: "xpi",
          mime: "application/x-xpinstall"
        };
      }
      if (checkString("mimetypeapplication/vnd.oasis.opendocument.text", { offset: 30 })) {
        return {
          ext: "odt",
          mime: "application/vnd.oasis.opendocument.text"
        };
      }
      if (checkString("mimetypeapplication/vnd.oasis.opendocument.spreadsheet", { offset: 30 })) {
        return {
          ext: "ods",
          mime: "application/vnd.oasis.opendocument.spreadsheet"
        };
      }
      if (checkString("mimetypeapplication/vnd.oasis.opendocument.presentation", { offset: 30 })) {
        return {
          ext: "odp",
          mime: "application/vnd.oasis.opendocument.presentation"
        };
      }
      const findNextZipHeaderIndex = (arr, startAt = 0) => arr.findIndex((el, i2, arr2) => i2 >= startAt && arr2[i2] === 80 && arr2[i2 + 1] === 75 && arr2[i2 + 2] === 3 && arr2[i2 + 3] === 4);
      let zipHeaderIndex = 0;
      let oxmlFound = false;
      let type = null;
      do {
        const offset = zipHeaderIndex + 30;
        if (!oxmlFound) {
          oxmlFound = check(oxmlContentTypes, { offset }) || check(oxmlRels, { offset });
        }
        if (!type) {
          if (checkString("word/", { offset })) {
            type = {
              ext: "docx",
              mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            };
          } else if (checkString("ppt/", { offset })) {
            type = {
              ext: "pptx",
              mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            };
          } else if (checkString("xl/", { offset })) {
            type = {
              ext: "xlsx",
              mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            };
          }
        }
        if (oxmlFound && type) {
          return type;
        }
        zipHeaderIndex = findNextZipHeaderIndex(buf, offset);
      } while (zipHeaderIndex >= 0);
      if (type) {
        return type;
      }
    }
    if (check([80, 75]) && (buf[2] === 3 || buf[2] === 5 || buf[2] === 7) && (buf[3] === 4 || buf[3] === 6 || buf[3] === 8)) {
      return {
        ext: "zip",
        mime: "application/zip"
      };
    }
    if (check([117, 115, 116, 97, 114], { offset: 257 })) {
      return {
        ext: "tar",
        mime: "application/x-tar"
      };
    }
    if (check([82, 97, 114, 33, 26, 7]) && (buf[6] === 0 || buf[6] === 1)) {
      return {
        ext: "rar",
        mime: "application/x-rar-compressed"
      };
    }
    if (check([31, 139, 8])) {
      return {
        ext: "gz",
        mime: "application/gzip"
      };
    }
    if (check([66, 90, 104])) {
      return {
        ext: "bz2",
        mime: "application/x-bzip2"
      };
    }
    if (check([55, 122, 188, 175, 39, 28])) {
      return {
        ext: "7z",
        mime: "application/x-7z-compressed"
      };
    }
    if (check([120, 1])) {
      return {
        ext: "dmg",
        mime: "application/x-apple-diskimage"
      };
    }
    if (check([51, 103, 112, 53]) || // 3gp5
    check([0, 0, 0]) && check([102, 116, 121, 112], { offset: 4 }) && (check([109, 112, 52, 49], { offset: 8 }) || // MP41
    check([109, 112, 52, 50], { offset: 8 }) || // MP42
    check([105, 115, 111, 109], { offset: 8 }) || // ISOM
    check([105, 115, 111, 50], { offset: 8 }) || // ISO2
    check([109, 109, 112, 52], { offset: 8 }) || // MMP4
    check([77, 52, 86], { offset: 8 }) || // M4V
    check([100, 97, 115, 104], { offset: 8 }))) {
      return {
        ext: "mp4",
        mime: "video/mp4"
      };
    }
    if (check([77, 84, 104, 100])) {
      return {
        ext: "mid",
        mime: "audio/midi"
      };
    }
    if (check([26, 69, 223, 163])) {
      const sliced = buf.subarray(4, 4 + 4096);
      const idPos = sliced.findIndex((el, i2, arr) => arr[i2] === 66 && arr[i2 + 1] === 130);
      if (idPos !== -1) {
        const docTypePos = idPos + 3;
        const findDocType = (type) => [...type].every((c, i2) => sliced[docTypePos + i2] === c.charCodeAt(0));
        if (findDocType("matroska")) {
          return {
            ext: "mkv",
            mime: "video/x-matroska"
          };
        }
        if (findDocType("webm")) {
          return {
            ext: "webm",
            mime: "video/webm"
          };
        }
      }
    }
    if (check([0, 0, 0, 20, 102, 116, 121, 112, 113, 116, 32, 32]) || check([102, 114, 101, 101], { offset: 4 }) || // Type: `free`
    check([102, 116, 121, 112, 113, 116, 32, 32], { offset: 4 }) || check([109, 100, 97, 116], { offset: 4 }) || // MJPEG
    check([109, 111, 111, 118], { offset: 4 }) || // Type: `moov`
    check([119, 105, 100, 101], { offset: 4 })) {
      return {
        ext: "mov",
        mime: "video/quicktime"
      };
    }
    if (check([82, 73, 70, 70])) {
      if (check([65, 86, 73], { offset: 8 })) {
        return {
          ext: "avi",
          mime: "video/vnd.avi"
        };
      }
      if (check([87, 65, 86, 69], { offset: 8 })) {
        return {
          ext: "wav",
          mime: "audio/vnd.wave"
        };
      }
      if (check([81, 76, 67, 77], { offset: 8 })) {
        return {
          ext: "qcp",
          mime: "audio/qcelp"
        };
      }
    }
    if (check([48, 38, 178, 117, 142, 102, 207, 17, 166, 217])) {
      let offset = 30;
      do {
        const objectSize = readUInt64LE(buf, offset + 16);
        if (check([145, 7, 220, 183, 183, 169, 207, 17, 142, 230, 0, 192, 12, 32, 83, 101], { offset })) {
          if (check([64, 158, 105, 248, 77, 91, 207, 17, 168, 253, 0, 128, 95, 92, 68, 43], { offset: offset + 24 })) {
            return {
              ext: "wma",
              mime: "audio/x-ms-wma"
            };
          }
          if (check([192, 239, 25, 188, 77, 91, 207, 17, 168, 253, 0, 128, 95, 92, 68, 43], { offset: offset + 24 })) {
            return {
              ext: "wmv",
              mime: "video/x-ms-asf"
            };
          }
          break;
        }
        offset += objectSize;
      } while (offset + 24 <= buf.length);
      return {
        ext: "asf",
        mime: "application/vnd.ms-asf"
      };
    }
    if (check([0, 0, 1, 186]) || check([0, 0, 1, 179])) {
      return {
        ext: "mpg",
        mime: "video/mpeg"
      };
    }
    if (check([102, 116, 121, 112, 51, 103], { offset: 4 })) {
      return {
        ext: "3gp",
        mime: "video/3gpp"
      };
    }
    for (let start = 0; start < 2 && start < buf.length - 16; start++) {
      if (check([73, 68, 51], { offset: start }) || // ID3 header
      check([255, 226], { offset: start, mask: [255, 226] })) {
        return {
          ext: "mp3",
          mime: "audio/mpeg"
        };
      }
      if (check([255, 228], { offset: start, mask: [255, 228] })) {
        return {
          ext: "mp2",
          mime: "audio/mpeg"
        };
      }
      if (check([255, 248], { offset: start, mask: [255, 252] })) {
        return {
          ext: "mp2",
          mime: "audio/mpeg"
        };
      }
      if (check([255, 240], { offset: start, mask: [255, 252] })) {
        return {
          ext: "mp4",
          mime: "audio/mpeg"
        };
      }
    }
    if (check([102, 116, 121, 112, 77, 52, 65], { offset: 4 })) {
      return {
        // MPEG-4 layer 3 (audio)
        ext: "m4a",
        mime: "audio/mp4"
        // RFC 4337
      };
    }
    if (check([79, 112, 117, 115, 72, 101, 97, 100], { offset: 28 })) {
      return {
        ext: "opus",
        mime: "audio/opus"
      };
    }
    if (check([79, 103, 103, 83])) {
      if (check([128, 116, 104, 101, 111, 114, 97], { offset: 28 })) {
        return {
          ext: "ogv",
          mime: "video/ogg"
        };
      }
      if (check([1, 118, 105, 100, 101, 111, 0], { offset: 28 })) {
        return {
          ext: "ogm",
          mime: "video/ogg"
        };
      }
      if (check([127, 70, 76, 65, 67], { offset: 28 })) {
        return {
          ext: "oga",
          mime: "audio/ogg"
        };
      }
      if (check([83, 112, 101, 101, 120, 32, 32], { offset: 28 })) {
        return {
          ext: "spx",
          mime: "audio/ogg"
        };
      }
      if (check([1, 118, 111, 114, 98, 105, 115], { offset: 28 })) {
        return {
          ext: "ogg",
          mime: "audio/ogg"
        };
      }
      return {
        ext: "ogx",
        mime: "application/ogg"
      };
    }
    if (check([102, 76, 97, 67])) {
      return {
        ext: "flac",
        mime: "audio/x-flac"
      };
    }
    if (check([77, 65, 67, 32])) {
      return {
        ext: "ape",
        mime: "audio/ape"
      };
    }
    if (check([119, 118, 112, 107])) {
      return {
        ext: "wv",
        mime: "audio/wavpack"
      };
    }
    if (check([35, 33, 65, 77, 82, 10])) {
      return {
        ext: "amr",
        mime: "audio/amr"
      };
    }
    if (check([37, 80, 68, 70])) {
      return {
        ext: "pdf",
        mime: "application/pdf"
      };
    }
    if (check([77, 90])) {
      return {
        ext: "exe",
        mime: "application/x-msdownload"
      };
    }
    if ((buf[0] === 67 || buf[0] === 70) && check([87, 83], { offset: 1 })) {
      return {
        ext: "swf",
        mime: "application/x-shockwave-flash"
      };
    }
    if (check([123, 92, 114, 116, 102])) {
      return {
        ext: "rtf",
        mime: "application/rtf"
      };
    }
    if (check([0, 97, 115, 109])) {
      return {
        ext: "wasm",
        mime: "application/wasm"
      };
    }
    if (check([119, 79, 70, 70]) && (check([0, 1, 0, 0], { offset: 4 }) || check([79, 84, 84, 79], { offset: 4 }))) {
      return {
        ext: "woff",
        mime: "font/woff"
      };
    }
    if (check([119, 79, 70, 50]) && (check([0, 1, 0, 0], { offset: 4 }) || check([79, 84, 84, 79], { offset: 4 }))) {
      return {
        ext: "woff2",
        mime: "font/woff2"
      };
    }
    if (check([76, 80], { offset: 34 }) && (check([0, 0, 1], { offset: 8 }) || check([1, 0, 2], { offset: 8 }) || check([2, 0, 2], { offset: 8 }))) {
      return {
        ext: "eot",
        mime: "application/vnd.ms-fontobject"
      };
    }
    if (check([0, 1, 0, 0, 0])) {
      return {
        ext: "ttf",
        mime: "font/ttf"
      };
    }
    if (check([79, 84, 84, 79, 0])) {
      return {
        ext: "otf",
        mime: "font/otf"
      };
    }
    if (check([0, 0, 1, 0])) {
      return {
        ext: "ico",
        mime: "image/x-icon"
      };
    }
    if (check([0, 0, 2, 0])) {
      return {
        ext: "cur",
        mime: "image/x-icon"
      };
    }
    if (check([70, 76, 86, 1])) {
      return {
        ext: "flv",
        mime: "video/x-flv"
      };
    }
    if (check([37, 33])) {
      return {
        ext: "ps",
        mime: "application/postscript"
      };
    }
    if (check([253, 55, 122, 88, 90, 0])) {
      return {
        ext: "xz",
        mime: "application/x-xz"
      };
    }
    if (check([83, 81, 76, 105])) {
      return {
        ext: "sqlite",
        mime: "application/x-sqlite3"
      };
    }
    if (check([78, 69, 83, 26])) {
      return {
        ext: "nes",
        mime: "application/x-nintendo-nes-rom"
      };
    }
    if (check([67, 114, 50, 52])) {
      return {
        ext: "crx",
        mime: "application/x-google-chrome-extension"
      };
    }
    if (check([77, 83, 67, 70]) || check([73, 83, 99, 40])) {
      return {
        ext: "cab",
        mime: "application/vnd.ms-cab-compressed"
      };
    }
    if (check([33, 60, 97, 114, 99, 104, 62, 10, 100, 101, 98, 105, 97, 110, 45, 98, 105, 110, 97, 114, 121])) {
      return {
        ext: "deb",
        mime: "application/x-deb"
      };
    }
    if (check([33, 60, 97, 114, 99, 104, 62])) {
      return {
        ext: "ar",
        mime: "application/x-unix-archive"
      };
    }
    if (check([237, 171, 238, 219])) {
      return {
        ext: "rpm",
        mime: "application/x-rpm"
      };
    }
    if (check([31, 160]) || check([31, 157])) {
      return {
        ext: "Z",
        mime: "application/x-compress"
      };
    }
    if (check([76, 90, 73, 80])) {
      return {
        ext: "lz",
        mime: "application/x-lzip"
      };
    }
    if (check([208, 207, 17, 224, 161, 177, 26, 225])) {
      return {
        ext: "msi",
        mime: "application/x-msi"
      };
    }
    if (check([6, 14, 43, 52, 2, 5, 1, 1, 13, 1, 2, 1, 1, 2])) {
      return {
        ext: "mxf",
        mime: "application/mxf"
      };
    }
    if (check([71], { offset: 4 }) && (check([71], { offset: 192 }) || check([71], { offset: 196 }))) {
      return {
        ext: "mts",
        mime: "video/mp2t"
      };
    }
    if (check([66, 76, 69, 78, 68, 69, 82])) {
      return {
        ext: "blend",
        mime: "application/x-blender"
      };
    }
    if (check([66, 80, 71, 251])) {
      return {
        ext: "bpg",
        mime: "image/bpg"
      };
    }
    if (check([0, 0, 0, 12, 106, 80, 32, 32, 13, 10, 135, 10])) {
      if (check([106, 112, 50, 32], { offset: 20 })) {
        return {
          ext: "jp2",
          mime: "image/jp2"
        };
      }
      if (check([106, 112, 120, 32], { offset: 20 })) {
        return {
          ext: "jpx",
          mime: "image/jpx"
        };
      }
      if (check([106, 112, 109, 32], { offset: 20 })) {
        return {
          ext: "jpm",
          mime: "image/jpm"
        };
      }
      if (check([109, 106, 112, 50], { offset: 20 })) {
        return {
          ext: "mj2",
          mime: "image/mj2"
        };
      }
    }
    if (check([70, 79, 82, 77])) {
      return {
        ext: "aif",
        mime: "audio/aiff"
      };
    }
    if (checkString("<?xml ")) {
      return {
        ext: "xml",
        mime: "application/xml"
      };
    }
    if (check([66, 79, 79, 75, 77, 79, 66, 73], { offset: 60 })) {
      return {
        ext: "mobi",
        mime: "application/x-mobipocket-ebook"
      };
    }
    if (check([102, 116, 121, 112], { offset: 4 })) {
      if (check([109, 105, 102, 49], { offset: 8 })) {
        return {
          ext: "heic",
          mime: "image/heif"
        };
      }
      if (check([109, 115, 102, 49], { offset: 8 })) {
        return {
          ext: "heic",
          mime: "image/heif-sequence"
        };
      }
      if (check([104, 101, 105, 99], { offset: 8 }) || check([104, 101, 105, 120], { offset: 8 })) {
        return {
          ext: "heic",
          mime: "image/heic"
        };
      }
      if (check([104, 101, 118, 99], { offset: 8 }) || check([104, 101, 118, 120], { offset: 8 })) {
        return {
          ext: "heic",
          mime: "image/heic-sequence"
        };
      }
    }
    if (check([171, 75, 84, 88, 32, 49, 49, 187, 13, 10, 26, 10])) {
      return {
        ext: "ktx",
        mime: "image/ktx"
      };
    }
    if (check([68, 73, 67, 77], { offset: 128 })) {
      return {
        ext: "dcm",
        mime: "application/dicom"
      };
    }
    if (check([77, 80, 43])) {
      return {
        ext: "mpc",
        mime: "audio/x-musepack"
      };
    }
    if (check([77, 80, 67, 75])) {
      return {
        ext: "mpc",
        mime: "audio/x-musepack"
      };
    }
    if (check([66, 69, 71, 73, 78, 58])) {
      return {
        ext: "ics",
        mime: "text/calendar"
      };
    }
    if (check([103, 108, 84, 70, 2, 0, 0, 0])) {
      return {
        ext: "glb",
        mime: "model/gltf-binary"
      };
    }
    if (check([212, 195, 178, 161]) || check([161, 178, 195, 212])) {
      return {
        ext: "pcap",
        mime: "application/vnd.tcpdump.pcap"
      };
    }
    return null;
  };
  module.exports = fileType;
  module.exports.default = fileType;
  Object.defineProperty(fileType, "minimumBytes", { value: 4100 });
  module.exports.stream = (readableStream) => new Promise((resolve, reject) => {
    const stream = eval("require")("stream");
    readableStream.once("readable", () => {
      const pass = new stream.PassThrough();
      const chunk = readableStream.read(module.exports.minimumBytes) || readableStream.read();
      try {
        pass.fileType = fileType(chunk);
      } catch (error) {
        reject(error);
      }
      readableStream.unshift(chunk);
      if (stream.pipeline) {
        resolve(stream.pipeline(readableStream, pass, () => {
        }));
      } else {
        resolve(readableStream.pipe(pass));
      }
    });
  });
})(fileType$1);
var fileTypeExports = fileType$1.exports;
const fileType = fileTypeExports;
const imageExts = /* @__PURE__ */ new Set([
  "jpg",
  "png",
  "gif",
  "webp",
  "flif",
  "cr2",
  "tif",
  "bmp",
  "jxr",
  "psd",
  "ico",
  "bpg",
  "jp2",
  "jpm",
  "jpx",
  "heic",
  "cur",
  "dcm"
]);
const imageType = (input) => {
  const ret = fileType(input);
  return imageExts.has(ret && ret.ext) ? ret : null;
};
imageType$2.exports = imageType;
imageType$2.exports.default = imageType;
Object.defineProperty(imageType, "minimumBytes", { value: fileType.minimumBytes });
var imageTypeExports = imageType$2.exports;
const imageType$1 = /* @__PURE__ */ getDefaultExportFromCjs(imageTypeExports);
function guessStripByteCounts(ifd2) {
  if (ifd2.compression !== 1) {
    throw new Error("missing mandatory StripByteCounts field in compressed image");
  }
  const bytesPerStrip = ifd2.rowsPerStrip * ifd2.width * ifd2.samplesPerPixel * (ifd2.bitsPerSample / 8);
  return new Array(ifd2.stripOffsets.length).fill(bytesPerStrip);
}
function applyHorizontalDifferencing8Bit(data, width, components) {
  let i2 = 0;
  while (i2 < data.length) {
    for (let j = components; j < width * components; j += components) {
      for (let k = 0; k < components; k++) {
        data[i2 + j + k] = data[i2 + j + k] + data[i2 + j - (components - k)] & 255;
      }
    }
    i2 += width * components;
  }
}
function applyHorizontalDifferencing16Bit(data, width, components) {
  let i2 = 0;
  while (i2 < data.length) {
    for (let j = components; j < width * components; j += components) {
      for (let k = 0; k < components; k++) {
        data[i2 + j + k] = data[i2 + j + k] + data[i2 + j - (components - k)] & 65535;
      }
    }
    i2 += width * components;
  }
}
const tagsById$2 = {
  33434: "ExposureTime",
  33437: "FNumber",
  34850: "ExposureProgram",
  34852: "SpectralSensitivity",
  34855: "ISOSpeedRatings",
  34856: "OECF",
  34864: "SensitivityType",
  34865: "StandardOutputSensitivity",
  34866: "RecommendedExposureIndex",
  34867: "ISOSpeed",
  34868: "ISOSpeedLatitudeyyy",
  34869: "ISOSpeedLatitudezzz",
  36864: "ExifVersion",
  36867: "DateTimeOriginal",
  36868: "DateTimeDigitized",
  37121: "ComponentsConfiguration",
  37122: "CompressedBitsPerPixel",
  37377: "ShutterSpeedValue",
  37378: "ApertureValue",
  37379: "BrightnessValue",
  37380: "ExposureBiasValue",
  37381: "MaxApertureValue",
  37382: "SubjectDistance",
  37383: "MeteringMode",
  37384: "LightSource",
  37385: "Flash",
  37386: "FocalLength",
  37396: "SubjectArea",
  37500: "MakerNote",
  37510: "UserComment",
  37520: "SubsecTime",
  37521: "SubsecTimeOriginal",
  37522: "SubsecTimeDigitized",
  40960: "FlashpixVersion",
  40961: "ColorSpace",
  40962: "PixelXDimension",
  40963: "PixelYDimension",
  40964: "RelatedSoundFile",
  41483: "FlashEnergy",
  41484: "SpatialFrequencyResponse",
  41486: "FocalPlaneXResolution",
  41487: "FocalPlaneYResolution",
  41488: "FocalPlaneResolutionUnit",
  41492: "SubjectLocation",
  41493: "ExposureIndex",
  41495: "SensingMethod",
  41728: "FileSource",
  41729: "SceneType",
  41730: "CFAPattern",
  41985: "CustomRendered",
  41986: "ExposureMode",
  41987: "WhiteBalance",
  41988: "DigitalZoomRatio",
  41989: "FocalLengthIn35mmFilm",
  41990: "SceneCaptureType",
  41991: "GainControl",
  41992: "Contrast",
  41993: "Saturation",
  41994: "Sharpness",
  41995: "DeviceSettingDescription",
  41996: "SubjectDistanceRange",
  42016: "ImageUniqueID",
  42032: "CameraOwnerName",
  42033: "BodySerialNumber",
  42034: "LensSpecification",
  42035: "LensMake",
  42036: "LensModel",
  42037: "LensSerialNumber",
  42240: "Gamma"
};
const tagsByName$2 = {};
for (let i2 in tagsById$2) {
  tagsByName$2[tagsById$2[i2]] = Number(i2);
}
const exif = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  tagsById: tagsById$2,
  tagsByName: tagsByName$2
}, Symbol.toStringTag, { value: "Module" }));
const tagsById$1 = {
  0: "GPSVersionID",
  1: "GPSLatitudeRef",
  2: "GPSLatitude",
  3: "GPSLongitudeRef",
  4: "GPSLongitude",
  5: "GPSAltitudeRef",
  6: "GPSAltitude",
  7: "GPSTimeStamp",
  8: "GPSSatellites",
  9: "GPSStatus",
  10: "GPSMeasureMode",
  11: "GPSDOP",
  12: "GPSSpeedRef",
  13: "GPSSpeed",
  14: "GPSTrackRef",
  15: "GPSTrack",
  16: "GPSImgDirectionRef",
  17: "GPSImgDirection",
  18: "GPSMapDatum",
  19: "GPSDestLatitudeRef",
  20: "GPSDestLatitude",
  21: "GPSDestLongitudeRef",
  22: "GPSDestLongitude",
  23: "GPSDestBearingRef",
  24: "GPSDestBearing",
  25: "GPSDestDistanceRef",
  26: "GPSDestDistance",
  27: "GPSProcessingMethod",
  28: "GPSAreaInformation",
  29: "GPSDateStamp",
  30: "GPSDifferential",
  31: "GPSHPositioningError"
};
const tagsByName$1 = {};
for (let i2 in tagsById$1) {
  tagsByName$1[tagsById$1[i2]] = Number(i2);
}
const gps = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  tagsById: tagsById$1,
  tagsByName: tagsByName$1
}, Symbol.toStringTag, { value: "Module" }));
const tagsById = {
  // Baseline tags
  254: "NewSubfileType",
  255: "SubfileType",
  256: "ImageWidth",
  257: "ImageLength",
  258: "BitsPerSample",
  259: "Compression",
  262: "PhotometricInterpretation",
  263: "Threshholding",
  264: "CellWidth",
  265: "CellLength",
  266: "FillOrder",
  270: "ImageDescription",
  271: "Make",
  272: "Model",
  273: "StripOffsets",
  274: "Orientation",
  277: "SamplesPerPixel",
  278: "RowsPerStrip",
  279: "StripByteCounts",
  280: "MinSampleValue",
  281: "MaxSampleValue",
  282: "XResolution",
  283: "YResolution",
  284: "PlanarConfiguration",
  288: "FreeOffsets",
  289: "FreeByteCounts",
  290: "GrayResponseUnit",
  291: "GrayResponseCurve",
  296: "ResolutionUnit",
  305: "Software",
  306: "DateTime",
  315: "Artist",
  316: "HostComputer",
  320: "ColorMap",
  338: "ExtraSamples",
  33432: "Copyright",
  // Extension tags
  269: "DocumentName",
  285: "PageName",
  286: "XPosition",
  287: "YPosition",
  292: "T4Options",
  293: "T6Options",
  297: "PageNumber",
  301: "TransferFunction",
  317: "Predictor",
  318: "WhitePoint",
  319: "PrimaryChromaticities",
  321: "HalftoneHints",
  322: "TileWidth",
  323: "TileLength",
  324: "TileOffsets",
  325: "TileByteCounts",
  326: "BadFaxLines",
  327: "CleanFaxData",
  328: "ConsecutiveBadFaxLines",
  330: "SubIFDs",
  332: "InkSet",
  333: "InkNames",
  334: "NumberOfInks",
  336: "DotRange",
  337: "TargetPrinter",
  339: "SampleFormat",
  340: "SMinSampleValue",
  341: "SMaxSampleValue",
  342: "TransferRange",
  343: "ClipPath",
  344: "XClipPathUnits",
  345: "YClipPathUnits",
  346: "Indexed",
  347: "JPEGTables",
  351: "OPIProxy",
  400: "GlobalParametersIFD",
  401: "ProfileType",
  402: "FaxProfile",
  403: "CodingMethods",
  404: "VersionYear",
  405: "ModeNumber",
  433: "Decode",
  434: "DefaultImageColor",
  512: "JPEGProc",
  513: "JPEGInterchangeFormat",
  514: "JPEGInterchangeFormatLength",
  515: "JPEGRestartInterval",
  517: "JPEGLosslessPredictors",
  518: "JPEGPointTransforms",
  519: "JPEGQTables",
  520: "JPEGDCTables",
  521: "JPEGACTables",
  529: "YCbCrCoefficients",
  530: "YCbCrSubSampling",
  531: "YCbCrPositioning",
  532: "ReferenceBlackWhite",
  559: "StripRowCounts",
  700: "XMP",
  32781: "ImageID",
  34732: "ImageLayer",
  // Private tags
  32932: "WangAnnotatio",
  33445: "MDFileTag",
  33446: "MDScalePixel",
  33447: "MDColorTable",
  33448: "MDLabName",
  33449: "MDSampleInfo",
  33450: "MDPrepDate",
  33451: "MDPrepTime",
  33452: "MDFileUnits",
  33550: "ModelPixelScaleTag",
  33723: "IPTC",
  33918: "INGRPacketDataTag",
  33919: "INGRFlagRegisters",
  33920: "IrasBTransformationMatrix",
  33922: "ModelTiepointTag",
  34264: "ModelTransformationTag",
  34377: "Photoshop",
  34665: "ExifIFD",
  34675: "ICCProfile",
  34735: "GeoKeyDirectoryTag",
  34736: "GeoDoubleParamsTag",
  34737: "GeoAsciiParamsTag",
  34853: "GPSIFD",
  34908: "HylaFAXFaxRecvParams",
  34909: "HylaFAXFaxSubAddress",
  34910: "HylaFAXFaxRecvTime",
  37724: "ImageSourceData",
  40965: "InteroperabilityIFD",
  42112: "GDAL_METADATA",
  42113: "GDAL_NODATA",
  50215: "OceScanjobDescription",
  50216: "OceApplicationSelector",
  50217: "OceIdentificationNumber",
  50218: "OceImageLogicCharacteristics",
  50706: "DNGVersion",
  50707: "DNGBackwardVersion",
  50708: "UniqueCameraModel",
  50709: "LocalizedCameraModel",
  50710: "CFAPlaneColor",
  50711: "CFALayout",
  50712: "LinearizationTable",
  50713: "BlackLevelRepeatDim",
  50714: "BlackLevel",
  50715: "BlackLevelDeltaH",
  50716: "BlackLevelDeltaV",
  50717: "WhiteLevel",
  50718: "DefaultScale",
  50719: "DefaultCropOrigin",
  50720: "DefaultCropSize",
  50721: "ColorMatrix1",
  50722: "ColorMatrix2",
  50723: "CameraCalibration1",
  50724: "CameraCalibration2",
  50725: "ReductionMatrix1",
  50726: "ReductionMatrix2",
  50727: "AnalogBalance",
  50728: "AsShotNeutral",
  50729: "AsShotWhiteXY",
  50730: "BaselineExposure",
  50731: "BaselineNoise",
  50732: "BaselineSharpness",
  50733: "BayerGreenSplit",
  50734: "LinearResponseLimit",
  50735: "CameraSerialNumber",
  50736: "LensInfo",
  50737: "ChromaBlurRadius",
  50738: "AntiAliasStrength",
  50740: "DNGPrivateData",
  50741: "MakerNoteSafety",
  50778: "CalibrationIlluminant1",
  50779: "CalibrationIlluminant2",
  50780: "BestQualityScale",
  50784: "AliasLayerMetadata"
};
const tagsByName = {};
for (let i2 in tagsById) {
  tagsByName[tagsById[i2]] = Number(i2);
}
const standard = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  tagsById,
  tagsByName
}, Symbol.toStringTag, { value: "Module" }));
const tags = {
  standard,
  exif,
  gps
};
class IFD {
  constructor(kind) {
    if (!kind) {
      throw new Error("missing kind");
    }
    this.data = new Uint8Array();
    this.fields = /* @__PURE__ */ new Map();
    this.kind = kind;
    this._hasMap = false;
    this._map = {};
  }
  get(tag) {
    if (typeof tag === "number") {
      return this.fields.get(tag);
    } else if (typeof tag === "string") {
      return this.fields.get(tags[this.kind].tagsByName[tag]);
    } else {
      throw new Error("expected a number or string");
    }
  }
  get map() {
    if (!this._hasMap) {
      const taglist = tags[this.kind].tagsById;
      for (let key of this.fields.keys()) {
        if (taglist[key]) {
          this._map[taglist[key]] = this.fields.get(key);
        }
      }
      this._hasMap = true;
    }
    return this._map;
  }
}
let types = /* @__PURE__ */ new Map([
  [1, [1, readByte]],
  [2, [1, readASCII]],
  [3, [2, readShort]],
  [4, [4, readLong]],
  [5, [8, readRational]],
  [6, [1, readSByte]],
  [7, [1, readByte]],
  [8, [2, readSShort]],
  [9, [4, readSLong]],
  [10, [8, readSRational]],
  [11, [4, readFloat]],
  [12, [8, readDouble]]
  // DOUBLE
]);
function getByteLength(type, count) {
  const val = types.get(type);
  if (!val)
    throw new Error(`type not found: ${type}`);
  return val[0] * count;
}
function readData(decoder2, type, count) {
  const val = types.get(type);
  if (!val)
    throw new Error(`type not found: ${type}`);
  return val[1](decoder2, count);
}
function readByte(decoder2, count) {
  if (count === 1)
    return decoder2.readUint8();
  let array = new Uint8Array(count);
  for (let i2 = 0; i2 < count; i2++) {
    array[i2] = decoder2.readUint8();
  }
  return array;
}
function readASCII(decoder2, count) {
  let strings2 = [];
  let currentString = "";
  for (let i2 = 0; i2 < count; i2++) {
    let char = String.fromCharCode(decoder2.readUint8());
    if (char === "\0") {
      strings2.push(currentString);
      currentString = "";
    } else {
      currentString += char;
    }
  }
  if (strings2.length === 1) {
    return strings2[0];
  } else {
    return strings2;
  }
}
function readShort(decoder2, count) {
  if (count === 1)
    return decoder2.readUint16();
  let array = new Uint16Array(count);
  for (let i2 = 0; i2 < count; i2++) {
    array[i2] = decoder2.readUint16();
  }
  return array;
}
function readLong(decoder2, count) {
  if (count === 1)
    return decoder2.readUint32();
  let array = new Uint32Array(count);
  for (let i2 = 0; i2 < count; i2++) {
    array[i2] = decoder2.readUint32();
  }
  return array;
}
function readRational(decoder2, count) {
  if (count === 1) {
    return decoder2.readUint32() / decoder2.readUint32();
  }
  let rationals = new Array(count);
  for (let i2 = 0; i2 < count; i2++) {
    rationals[i2] = decoder2.readUint32() / decoder2.readUint32();
  }
  return rationals;
}
function readSByte(decoder2, count) {
  if (count === 1)
    return decoder2.readInt8();
  let array = new Int8Array(count);
  for (let i2 = 0; i2 < count; i2++) {
    array[i2] = decoder2.readInt8();
  }
  return array;
}
function readSShort(decoder2, count) {
  if (count === 1)
    return decoder2.readInt16();
  let array = new Int16Array(count);
  for (let i2 = 0; i2 < count; i2++) {
    array[i2] = decoder2.readInt16();
  }
  return array;
}
function readSLong(decoder2, count) {
  if (count === 1)
    return decoder2.readInt32();
  let array = new Int32Array(count);
  for (let i2 = 0; i2 < count; i2++) {
    array[i2] = decoder2.readInt32();
  }
  return array;
}
function readSRational(decoder2, count) {
  if (count === 1) {
    return decoder2.readInt32() / decoder2.readInt32();
  }
  let rationals = new Array(count);
  for (let i2 = 0; i2 < count; i2++) {
    rationals[i2] = decoder2.readInt32() / decoder2.readInt32();
  }
  return rationals;
}
function readFloat(decoder2, count) {
  if (count === 1)
    return decoder2.readFloat32();
  let array = new Float32Array(count);
  for (let i2 = 0; i2 < count; i2++) {
    array[i2] = decoder2.readFloat32();
  }
  return array;
}
function readDouble(decoder2, count) {
  if (count === 1)
    return decoder2.readFloat64();
  let array = new Float64Array(count);
  for (let i2 = 0; i2 < count; i2++) {
    array[i2] = decoder2.readFloat64();
  }
  return array;
}
const CLEAR_CODE = 256;
const EOI_CODE = 257;
const TABLE_START = 258;
const MIN_BIT_LENGTH = 9;
let stringTable = [];
function initializeStringTable() {
  if (stringTable.length === 0) {
    for (let i2 = 0; i2 < 256; i2++) {
      stringTable.push([i2]);
    }
    const dummyString = [];
    for (let i2 = 256; i2 < 4096; i2++) {
      stringTable.push(dummyString);
    }
  }
}
const andTable = [511, 1023, 2047, 4095];
const bitJumps = [0, 0, 0, 0, 0, 0, 0, 0, 0, 511, 1023, 2047, 4095];
class LzwDecoder {
  constructor(data) {
    this.nextData = 0;
    this.nextBits = 0;
    this.bytePointer = 0;
    this.tableLength = TABLE_START;
    this.currentBitLength = MIN_BIT_LENGTH;
    this.stripArray = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    this.outData = new IOBuffer$4(data.byteLength);
    this.initializeTable();
  }
  decode() {
    let code = 0;
    let oldCode = 0;
    while ((code = this.getNextCode()) !== EOI_CODE) {
      if (code === CLEAR_CODE) {
        this.initializeTable();
        code = this.getNextCode();
        if (code === EOI_CODE) {
          break;
        }
        this.writeString(this.stringFromCode(code));
        oldCode = code;
      } else if (this.isInTable(code)) {
        this.writeString(this.stringFromCode(code));
        this.addStringToTable(this.stringFromCode(oldCode).concat(this.stringFromCode(code)[0]));
        oldCode = code;
      } else {
        const outString = this.stringFromCode(oldCode).concat(this.stringFromCode(oldCode)[0]);
        this.writeString(outString);
        this.addStringToTable(outString);
        oldCode = code;
      }
    }
    const outArray = this.outData.toArray();
    return new DataView(outArray.buffer, outArray.byteOffset, outArray.byteLength);
  }
  initializeTable() {
    initializeStringTable();
    this.tableLength = TABLE_START;
    this.currentBitLength = MIN_BIT_LENGTH;
  }
  writeString(string) {
    this.outData.writeBytes(string);
  }
  stringFromCode(code) {
    return stringTable[code];
  }
  isInTable(code) {
    return code < this.tableLength;
  }
  addStringToTable(string) {
    stringTable[this.tableLength++] = string;
    if (stringTable.length > 4096) {
      stringTable = [];
      throw new Error("LZW decoding error. Please open an issue at https://github.com/image-js/tiff/issues/new/choose (include a test image).");
    }
    if (this.tableLength === bitJumps[this.currentBitLength]) {
      this.currentBitLength++;
    }
  }
  getNextCode() {
    this.nextData = this.nextData << 8 | this.stripArray[this.bytePointer++] & 255;
    this.nextBits += 8;
    if (this.nextBits < this.currentBitLength) {
      this.nextData = this.nextData << 8 | this.stripArray[this.bytePointer++] & 255;
      this.nextBits += 8;
    }
    const code = this.nextData >> this.nextBits - this.currentBitLength & andTable[this.currentBitLength - 9];
    this.nextBits -= this.currentBitLength;
    if (this.bytePointer > this.stripArray.length) {
      return 257;
    }
    return code;
  }
}
function decompressLzw(stripData) {
  return new LzwDecoder(stripData).decode();
}
const dateTimeRegex = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
class TiffIfd extends IFD {
  constructor() {
    super("standard");
  }
  // Custom fields
  get size() {
    return this.width * this.height;
  }
  get width() {
    return this.imageWidth;
  }
  get height() {
    return this.imageLength;
  }
  get components() {
    return this.samplesPerPixel;
  }
  get date() {
    let date = /* @__PURE__ */ new Date();
    let result = dateTimeRegex.exec(this.dateTime);
    if (result === null) {
      throw new Error(`invalid dateTime: ${this.dateTime}`);
    }
    date.setFullYear(Number(result[1]), Number(result[2]) - 1, Number(result[3]));
    date.setHours(Number(result[4]), Number(result[5]), Number(result[6]));
    return date;
  }
  // IFD fields
  get newSubfileType() {
    return this.get("NewSubfileType");
  }
  get imageWidth() {
    return this.get("ImageWidth");
  }
  get imageLength() {
    return this.get("ImageLength");
  }
  get bitsPerSample() {
    const data = this.get("BitsPerSample");
    if (data && typeof data !== "number") {
      return data[0];
    }
    return data;
  }
  get alpha() {
    const extraSamples = this.extraSamples;
    if (!extraSamples)
      return false;
    return extraSamples[0] !== 0;
  }
  get associatedAlpha() {
    const extraSamples = this.extraSamples;
    if (!extraSamples)
      return false;
    return extraSamples[0] === 1;
  }
  get extraSamples() {
    return alwaysArray(this.get("ExtraSamples"));
  }
  get compression() {
    return this.get("Compression") || 1;
  }
  get type() {
    return this.get("PhotometricInterpretation");
  }
  get fillOrder() {
    return this.get("FillOrder") || 1;
  }
  get documentName() {
    return this.get("DocumentName");
  }
  get imageDescription() {
    return this.get("ImageDescription");
  }
  get stripOffsets() {
    return alwaysArray(this.get("StripOffsets"));
  }
  get orientation() {
    return this.get("Orientation");
  }
  get samplesPerPixel() {
    return this.get("SamplesPerPixel") || 1;
  }
  get rowsPerStrip() {
    return this.get("RowsPerStrip");
  }
  get stripByteCounts() {
    return alwaysArray(this.get("StripByteCounts"));
  }
  get minSampleValue() {
    return this.get("MinSampleValue") || 0;
  }
  get maxSampleValue() {
    return this.get("MaxSampleValue") || Math.pow(2, this.bitsPerSample) - 1;
  }
  get xResolution() {
    return this.get("XResolution");
  }
  get yResolution() {
    return this.get("YResolution");
  }
  get planarConfiguration() {
    return this.get("PlanarConfiguration") || 1;
  }
  get resolutionUnit() {
    return this.get("ResolutionUnit") || 2;
  }
  get dateTime() {
    return this.get("DateTime");
  }
  get predictor() {
    return this.get("Predictor") || 1;
  }
  get sampleFormat() {
    return this.get("SampleFormat") || 1;
  }
  get sMinSampleValue() {
    return this.get("SMinSampleValue") || this.minSampleValue;
  }
  get sMaxSampleValue() {
    return this.get("SMaxSampleValue") || this.maxSampleValue;
  }
  get palette() {
    const totalColors = 2 ** this.bitsPerSample;
    const colorMap = this.get("ColorMap");
    if (!colorMap)
      return void 0;
    if (colorMap.length !== 3 * totalColors) {
      throw new Error(`ColorMap size must be ${totalColors}`);
    }
    const palette = [];
    for (let i2 = 0; i2 < totalColors; i2++) {
      palette.push([
        colorMap[i2],
        colorMap[i2 + totalColors],
        colorMap[i2 + 2 * totalColors]
      ]);
    }
    return palette;
  }
}
function alwaysArray(value) {
  if (typeof value === "number")
    return [value];
  return value;
}
function decompressZlib(stripData) {
  const stripUint8 = new Uint8Array(stripData.buffer, stripData.byteOffset, stripData.byteLength);
  const inflated = inflate_1(stripUint8);
  return new DataView(inflated.buffer, inflated.byteOffset, inflated.byteLength);
}
const defaultOptions$c = {
  ignoreImageData: false,
  onlyFirst: false
};
class TIFFDecoder extends IOBuffer$4 {
  constructor(data) {
    super(data);
    this._nextIFD = 0;
  }
  get isMultiPage() {
    let c = 0;
    this.decodeHeader();
    while (this._nextIFD) {
      c++;
      this.decodeIFD({ ignoreImageData: true }, true);
      if (c === 2) {
        return true;
      }
    }
    if (c === 1) {
      return false;
    }
    throw unsupported("ifdCount", c);
  }
  get pageCount() {
    let c = 0;
    this.decodeHeader();
    while (this._nextIFD) {
      c++;
      this.decodeIFD({ ignoreImageData: true }, true);
    }
    if (c > 0) {
      return c;
    }
    throw unsupported("ifdCount", c);
  }
  decode(options = {}) {
    options = Object.assign({}, defaultOptions$c, options);
    const result = [];
    this.decodeHeader();
    while (this._nextIFD) {
      result.push(this.decodeIFD(options, true));
      if (options.onlyFirst) {
        return [result[0]];
      }
    }
    return result;
  }
  decodeHeader() {
    const value = this.readUint16();
    if (value === 18761) {
      this.setLittleEndian();
    } else if (value === 19789) {
      this.setBigEndian();
    } else {
      throw new Error(`invalid byte order: 0x${value.toString(16)}`);
    }
    if (this.readUint16() !== 42) {
      throw new Error("not a TIFF file");
    }
    this._nextIFD = this.readUint32();
  }
  decodeIFD(options, tiff2) {
    this.seek(this._nextIFD);
    let ifd2;
    if (tiff2) {
      ifd2 = new TiffIfd();
    } else {
      if (!options.kind) {
        throw new Error(`kind is missing`);
      }
      ifd2 = new IFD(options.kind);
    }
    const numEntries = this.readUint16();
    for (let i2 = 0; i2 < numEntries; i2++) {
      this.decodeIFDEntry(ifd2);
    }
    if (!options.ignoreImageData) {
      if (!(ifd2 instanceof TiffIfd)) {
        throw new Error("must be a tiff ifd");
      }
      this.decodeImageData(ifd2);
    }
    this._nextIFD = this.readUint32();
    return ifd2;
  }
  decodeIFDEntry(ifd2) {
    const offset = this.offset;
    const tag = this.readUint16();
    const type = this.readUint16();
    const numValues = this.readUint32();
    if (type < 1 || type > 12) {
      this.skip(4);
      return;
    }
    const valueByteLength = getByteLength(type, numValues);
    if (valueByteLength > 4) {
      this.seek(this.readUint32());
    }
    const value = readData(this, type, numValues);
    ifd2.fields.set(tag, value);
    if (tag === 34665 || tag === 34853) {
      let currentOffset = this.offset;
      let kind = "exif";
      if (tag === 34665) {
        kind = "exif";
      } else if (tag === 34853) {
        kind = "gps";
      }
      this._nextIFD = value;
      ifd2[kind] = this.decodeIFD({
        kind,
        ignoreImageData: true
      }, false);
      this.offset = currentOffset;
    }
    this.seek(offset);
    this.skip(12);
  }
  decodeImageData(ifd2) {
    const orientation2 = ifd2.orientation;
    if (orientation2 && orientation2 !== 1) {
      throw unsupported("orientation", orientation2);
    }
    switch (ifd2.type) {
      case 0:
      case 1:
      case 2:
      case 3:
        this.readStripData(ifd2);
        break;
      default:
        throw unsupported("image type", ifd2.type);
    }
    this.applyPredictor(ifd2);
    this.convertAlpha(ifd2);
    if (ifd2.type === 0) {
      const bitDepth = ifd2.bitsPerSample;
      const maxValue = Math.pow(2, bitDepth) - 1;
      for (let i2 = 0; i2 < ifd2.data.length; i2++) {
        ifd2.data[i2] = maxValue - ifd2.data[i2];
      }
    }
  }
  readStripData(ifd2) {
    const width = ifd2.width;
    const height = ifd2.height;
    const bitDepth = ifd2.bitsPerSample;
    const sampleFormat = ifd2.sampleFormat;
    const size = width * height * ifd2.samplesPerPixel;
    const data = getDataArray(size, bitDepth, sampleFormat);
    const rowsPerStrip = ifd2.rowsPerStrip;
    const maxPixels = rowsPerStrip * width * ifd2.samplesPerPixel;
    const stripOffsets = ifd2.stripOffsets;
    const stripByteCounts = ifd2.stripByteCounts || guessStripByteCounts(ifd2);
    let remainingPixels = size;
    let pixel = 0;
    for (let i2 = 0; i2 < stripOffsets.length; i2++) {
      let stripData = new DataView(this.buffer, this.byteOffset + stripOffsets[i2], stripByteCounts[i2]);
      let length = remainingPixels > maxPixels ? maxPixels : remainingPixels;
      remainingPixels -= length;
      let dataToFill = stripData;
      switch (ifd2.compression) {
        case 1: {
          break;
        }
        case 5: {
          dataToFill = decompressLzw(stripData);
          break;
        }
        case 8: {
          dataToFill = decompressZlib(stripData);
          break;
        }
        case 2:
          throw unsupported("Compression", "CCITT Group 3");
        case 32773:
          throw unsupported("Compression", "PackBits");
        default:
          throw unsupported("Compression", ifd2.compression);
      }
      pixel = this.fillUncompressed(bitDepth, sampleFormat, data, dataToFill, pixel, length);
    }
    ifd2.data = data;
  }
  fillUncompressed(bitDepth, sampleFormat, data, stripData, pixel, length) {
    if (bitDepth === 8) {
      return fill8bit(data, stripData, pixel, length);
    } else if (bitDepth === 16) {
      return fill16bit(data, stripData, pixel, length, this.isLittleEndian());
    } else if (bitDepth === 32 && sampleFormat === 3) {
      return fillFloat32(data, stripData, pixel, length, this.isLittleEndian());
    } else {
      throw unsupported("bitDepth", bitDepth);
    }
  }
  applyPredictor(ifd2) {
    const bitDepth = ifd2.bitsPerSample;
    switch (ifd2.predictor) {
      case 1: {
        break;
      }
      case 2: {
        if (bitDepth === 8) {
          applyHorizontalDifferencing8Bit(ifd2.data, ifd2.width, ifd2.components);
        } else if (bitDepth === 16) {
          applyHorizontalDifferencing16Bit(ifd2.data, ifd2.width, ifd2.components);
        } else {
          throw new Error(`Horizontal differencing is only supported for images with a bit depth of ${bitDepth}`);
        }
        break;
      }
      default:
        throw new Error(`invalid predictor: ${ifd2.predictor}`);
    }
  }
  convertAlpha(ifd2) {
    if (ifd2.alpha && ifd2.associatedAlpha) {
      const { data, components, maxSampleValue } = ifd2;
      for (let i2 = 0; i2 < data.length; i2 += components) {
        const alphaValue = data[i2 + components - 1];
        for (let j = 0; j < components - 1; j++) {
          data[i2 + j] = Math.round(data[i2 + j] * maxSampleValue / alphaValue);
        }
      }
    }
  }
}
function getDataArray(size, bitDepth, sampleFormat) {
  if (bitDepth === 8) {
    return new Uint8Array(size);
  } else if (bitDepth === 16) {
    return new Uint16Array(size);
  } else if (bitDepth === 32 && sampleFormat === 3) {
    return new Float32Array(size);
  } else {
    throw unsupported("bit depth / sample format", `${bitDepth} / ${sampleFormat}`);
  }
}
function fill8bit(dataTo, dataFrom, index, length) {
  for (let i2 = 0; i2 < length; i2++) {
    dataTo[index++] = dataFrom.getUint8(i2);
  }
  return index;
}
function fill16bit(dataTo, dataFrom, index, length, littleEndian) {
  for (let i2 = 0; i2 < length * 2; i2 += 2) {
    dataTo[index++] = dataFrom.getUint16(i2, littleEndian);
  }
  return index;
}
function fillFloat32(dataTo, dataFrom, index, length, littleEndian) {
  for (let i2 = 0; i2 < length * 4; i2 += 4) {
    dataTo[index++] = dataFrom.getFloat32(i2, littleEndian);
  }
  return index;
}
function unsupported(type, value) {
  return new Error(`Unsupported ${type}: ${value}`);
}
function decodeTIFF(data, options) {
  const decoder2 = new TIFFDecoder(data);
  return decoder2.decode(options);
}
function matchAndCrop(options = {}) {
  let { algorithm = "matchToPrevious", ignoreBorder = [0, 0] } = options;
  this.checkProcessable("matchAndCrop", {
    bitDepth: [8, 16]
  });
  let matchToPrevious = algorithm === "matchToPrevious";
  let parent = this[0];
  let results = [];
  results[0] = {
    position: [0, 0],
    image: this[0]
  };
  let relativePosition = [0, 0];
  for (let i2 = 1; i2 < this.length; i2++) {
    let position = parent.getBestMatch(this[i2], { border: ignoreBorder });
    results[i2] = {
      position: [
        position[0] + relativePosition[0],
        position[1] + relativePosition[1]
      ],
      image: this[i2]
    };
    if (matchToPrevious) {
      relativePosition[0] += position[0];
      relativePosition[1] += position[1];
      parent = this[i2];
    }
  }
  let leftShift = 0;
  let rightShift = 0;
  let topShift = 0;
  let bottomShift = 0;
  for (let i2 = 0; i2 < results.length; i2++) {
    let result = results[i2];
    if (result.position[0] > leftShift) {
      leftShift = result.position[0];
    }
    if (result.position[0] < rightShift) {
      rightShift = result.position[0];
    }
    if (result.position[1] > topShift) {
      topShift = result.position[1];
    }
    if (result.position[1] < bottomShift) {
      bottomShift = result.position[1];
    }
  }
  rightShift = 0 - rightShift;
  bottomShift = 0 - bottomShift;
  for (let i2 = 0; i2 < results.length; i2++) {
    let result = results[i2];
    result.crop = result.image.crop({
      x: leftShift - result.position[0],
      y: topShift - result.position[1],
      width: parent.width - rightShift - leftShift,
      height: parent.height - bottomShift - topShift
    });
  }
  let newImages = [];
  for (let i2 = 0; i2 < results.length; i2++) {
    newImages[i2] = results[i2].crop;
  }
  return new Stack(newImages);
}
function min$2() {
  this.checkProcessable("min", {
    bitDepth: [8, 16]
  });
  let min2 = this[0].min;
  for (let i2 = 1; i2 < this.length; i2++) {
    for (let j = 0; j < min2.length; j++) {
      min2[j] = Math.min(min2[j], this[i2].min[j]);
    }
  }
  return min2;
}
function max$2() {
  this.checkProcessable("min", {
    bitDepth: [8, 16]
  });
  let max2 = this[0].max;
  for (let i2 = 1; i2 < this.length; i2++) {
    for (let j = 0; j < max2.length; j++) {
      max2[j] = Math.max(max2[j], this[i2].max[j]);
    }
  }
  return max2;
}
function median$2(histogram2) {
  let total = histogram2.reduce((sum2, x) => sum2 + x);
  if (total === 0) {
    throw new Error("unreachable");
  }
  let position = 0;
  let currentTotal = 0;
  let middle = total / 2;
  let previous;
  while (true) {
    if (histogram2[position] > 0) {
      if (previous !== void 0) {
        return (previous + position) / 2;
      }
      currentTotal += histogram2[position];
      if (currentTotal > middle) {
        return position;
      } else if (currentTotal === middle) {
        previous = position;
      }
    }
    position++;
  }
}
function mean$2(histogram2) {
  let total = 0;
  let sum2 = 0;
  for (let i2 = 0; i2 < histogram2.length; i2++) {
    total += histogram2[i2];
    sum2 += histogram2[i2] * i2;
  }
  if (total === 0) {
    return 0;
  }
  return sum2 / total;
}
function median$1() {
  this.checkProcessable("median", {
    bitDepth: [8, 16]
  });
  let histograms2 = this.getHistograms({ maxSlots: this[0].maxValue + 1 });
  let result = new Array(histograms2.length);
  for (let c = 0; c < histograms2.length; c++) {
    let histogram2 = histograms2[c];
    result[c] = median$2(histogram2);
  }
  return result;
}
function histogram(options) {
  this.checkProcessable("min", {
    bitDepth: [8, 16]
  });
  let histogram2 = this[0].getHistogram(options);
  for (let i2 = 1; i2 < this.length; i2++) {
    let secondHistogram = this[i2].getHistogram(options);
    for (let j = 0; j < histogram2.length; j++) {
      histogram2[j] += secondHistogram[j];
    }
  }
  return histogram2;
}
function histograms(options) {
  this.checkProcessable("min", {
    bitDepth: [8, 16]
  });
  let histograms2 = this[0].getHistograms(options);
  let histogramLength = histograms2[0].length;
  for (let i2 = 1; i2 < this.length; i2++) {
    let secondHistograms = this[i2].getHistograms(options);
    for (let c = 0; c < histograms2.length; c++) {
      for (let j = 0; j < histogramLength; j++) {
        histograms2[c][j] += secondHistograms[c][j];
      }
    }
  }
  return histograms2;
}
function averageImage() {
  this.checkProcessable("averageImage", {
    bitDepth: [8, 16]
  });
  let data = new Uint32Array(this[0].data.length);
  for (let i2 = 0; i2 < this.length; i2++) {
    let current = this[i2];
    for (let j = 0; j < this[0].data.length; j++) {
      data[j] += current.data[j];
    }
  }
  let image = Image.createFrom(this[0]);
  let newData = image.data;
  for (let i2 = 0; i2 < this[0].data.length; i2++) {
    newData[i2] = data[i2] / this.length;
  }
  return image;
}
function maxImage() {
  this.checkProcessable("max", {
    bitDepth: [8, 16]
  });
  let image = Image.createFrom(this[0]);
  image.data.fill(0);
  for (const current of this) {
    for (let j = 0; j < image.data.length; j++) {
      image.data[j] = Math.max(current.data[j], image.data[j]);
    }
  }
  return image;
}
function minImage() {
  this.checkProcessable("max", {
    bitDepth: [8, 16]
  });
  let image = Image.createFrom(this[0]);
  image.data.fill(image.maxValue);
  for (const current of this) {
    for (let j = 0; j < image.data.length; j++) {
      image.data[j] = Math.min(current.data[j], image.data[j]);
    }
  }
  return image;
}
function extend$2(Stack2) {
  Stack2.extendMethod("matchAndCrop", matchAndCrop);
  Stack2.extendMethod("getMin", min$2);
  Stack2.extendMethod("getMax", max$2);
  Stack2.extendMethod("getMedian", median$1);
  Stack2.extendMethod("getHistogram", histogram);
  Stack2.extendMethod("getHistograms", histograms);
  Stack2.extendMethod("getAverage", averageImage);
  Stack2.extendMethod("getAverageImage", averageImage);
  Stack2.extendMethod("getMaxImage", maxImage);
  Stack2.extendMethod("getMinImage", minImage);
}
let computedPropertyDescriptor = {
  configurable: true,
  enumerable: false,
  get: void 0
};
class Stack extends Array {
  constructor(images) {
    if (Array.isArray(images)) {
      super(images.length);
      for (let i2 = 0; i2 < images.length; i2++) {
        this[i2] = images[i2];
      }
    } else if (typeof images === "number") {
      super(images);
    } else {
      super();
    }
    this.computed = null;
  }
  static load(urls) {
    return Promise.all(urls.map(Image.load)).then(
      (images) => new Stack(images)
    );
  }
  static extendMethod(name2, method, options = {}) {
    let { inPlace = false, returnThis = true, partialArgs = [] } = options;
    if (inPlace) {
      Stack.prototype[name2] = function(...args) {
        this.computed = null;
        let result = method.apply(this, [...partialArgs, ...args]);
        if (returnThis) {
          return this;
        }
        return result;
      };
    } else {
      Stack.prototype[name2] = function(...args) {
        return method.apply(this, [...partialArgs, ...args]);
      };
    }
    return Stack;
  }
  static extendProperty(name2, method, options = {}) {
    let { partialArgs = [] } = options;
    computedPropertyDescriptor.get = function() {
      if (this.computed === null) {
        this.computed = {};
      } else if (hasOwn(name2, this.computed)) {
        return this.computed[name2];
      }
      let result = method.apply(this, partialArgs);
      this.computed[name2] = result;
      return result;
    };
    Object.defineProperty(Stack.prototype, name2, computedPropertyDescriptor);
    return Stack;
  }
  /**
   * Check if a process can be applied on the stack
   * @param {string} processName
   * @param {object} [options]
   * @private
   */
  checkProcessable(processName, options = {}) {
    if (typeof processName !== "string") {
      throw new TypeError(
        "checkProcessable requires as first parameter the processName (a string)"
      );
    }
    if (this.size === 0) {
      throw new TypeError(
        `The process: ${processName} can not be applied on an empty stack`
      );
    }
    this[0].checkProcessable(processName, options);
    for (let i2 = 1; i2 < this.length; i2++) {
      if ((options.sameSize === void 0 || options.sameSize) && this[0].width !== this[i2].width) {
        throw new TypeError(
          `The process: ${processName} can not be applied if width is not identical in all images`
        );
      }
      if ((options.sameSize === void 0 || options.sameSize) && this[0].height !== this[i2].height) {
        throw new TypeError(
          `The process: ${processName} can not be applied if height is not identical in all images`
        );
      }
      if ((options.sameAlpha === void 0 || options.sameAlpha) && this[0].alpha !== this[i2].alpha) {
        throw new TypeError(
          `The process: ${processName} can not be applied if alpha is not identical in all images`
        );
      }
      if ((options.sameBitDepth === void 0 || options.sameBitDepth) && this[0].bitDepth !== this[i2].bitDepth) {
        throw new TypeError(
          `The process: ${processName} can not be applied if bitDepth is not identical in all images`
        );
      }
      if ((options.sameColorModel === void 0 || options.sameColorModel) && this[0].colorModel !== this[i2].colorModel) {
        throw new TypeError(
          `The process: ${processName} can not be applied if colorModel is not identical in all images`
        );
      }
      if ((options.sameNumberChannels === void 0 || options.sameNumberChannels) && this[0].channels !== this[i2].channels) {
        throw new TypeError(
          `The process: ${processName} can not be applied if channels is not identical in all images`
        );
      }
    }
  }
}
if (!Array[Symbol.species]) {
  Stack.prototype.map = function(cb, thisArg) {
    if (typeof cb !== "function") {
      throw new TypeError(`${cb} is not a function`);
    }
    let newStack = new Stack(this.length);
    for (let i2 = 0; i2 < this.length; i2++) {
      newStack[i2] = cb.call(thisArg, this[i2], i2, this);
    }
    return newStack;
  };
}
extend$2(Stack);
const isDataURL = /^data:[a-z]+\/(?:[a-z]+);base64,/;
function load(image, options) {
  if (typeof image === "string") {
    return loadURL(image, options);
  } else if (image instanceof ArrayBuffer) {
    return Promise.resolve(
      loadBinary(
        new Uint8Array(image),
        void 0,
        options && options.ignorePalette
      )
    );
  } else if (image.buffer) {
    return Promise.resolve(
      loadBinary(image, void 0, options && options.ignorePalette)
    );
  } else {
    throw new Error('argument to "load" must be a string or buffer.');
  }
}
function loadBinary(image, base64Url, ignorePalette) {
  const type = imageType$1(image);
  if (type) {
    switch (type.mime) {
      case "image/png":
        return loadPNG(image);
      case "image/jpeg":
        return loadJPEG(image);
      case "image/tiff":
        return loadTIFF(image, ignorePalette);
      default:
        return loadGeneric(getBase64(type.mime));
    }
  }
  return loadGeneric(getBase64("application/octet-stream"));
  function getBase64(type2) {
    if (base64Url) {
      return base64Url;
    } else {
      return toBase64URL(image, type2);
    }
  }
}
function loadURL(url, options) {
  const dataURL = url.slice(0, 64).match(isDataURL);
  let binaryDataP;
  if (dataURL !== null) {
    binaryDataP = Promise.resolve(decode$3(url.slice(dataURL[0].length)));
  } else {
    binaryDataP = fetchBinary(url, options);
  }
  return binaryDataP.then((binaryData) => {
    const uint82 = new Uint8Array(binaryData);
    return loadBinary(
      uint82,
      dataURL ? url : void 0,
      options && options.ignorePalette
    );
  });
}
function loadPNG(data) {
  const png = decodePng(data);
  let channels = png.channels;
  let components;
  let alpha = 0;
  if (channels === 2 || channels === 4) {
    components = channels - 1;
    alpha = 1;
  } else {
    components = channels;
  }
  if (png.palette) {
    return loadPNGFromPalette(png);
  }
  return new Image(png.width, png.height, png.data, {
    components,
    alpha,
    bitDepth: png.depth
  });
}
function loadPNGFromPalette(png) {
  const pixels = png.width * png.height;
  const channels = png.palette[0].length;
  const data = new Uint8Array(pixels * channels);
  const pixelsPerByte = 8 / png.depth;
  const factor = png.depth < 8 ? pixelsPerByte : 1;
  const mask2 = parseInt("1".repeat(png.depth), 2);
  const hasAlpha = channels === 4;
  let dataIndex = 0;
  for (let i2 = 0; i2 < pixels; i2++) {
    const index = Math.floor(i2 / factor);
    let value = png.data[index];
    if (png.depth < 8) {
      value = value >>> png.depth * (pixelsPerByte - 1 - i2 % pixelsPerByte) & mask2;
    }
    const paletteValue = png.palette[value];
    data[dataIndex++] = paletteValue[0];
    data[dataIndex++] = paletteValue[1];
    data[dataIndex++] = paletteValue[2];
    if (hasAlpha) {
      data[dataIndex++] = paletteValue[3];
    }
  }
  return new Image(png.width, png.height, data, {
    components: 3,
    alpha: hasAlpha,
    bitDepth: 8
  });
}
function loadJPEG(data) {
  const decodedExif = decode(data);
  let meta;
  if (decodedExif.exif) {
    meta = getMetadata(decodedExif.exif);
  }
  const jpeg = jpegJs.decode(data, { useTArray: true, maxMemoryUsageInMB: 1024 });
  let image = new Image(jpeg.width, jpeg.height, jpeg.data, { meta });
  if (meta && meta.tiff.tags.Orientation) {
    const orientation2 = meta.tiff.tags.Orientation;
    if (orientation2 > 2) {
      image = image.rotate(
        {
          3: 180,
          4: 180,
          5: 90,
          6: 90,
          7: 270,
          8: 270
        }[orientation2]
      );
    }
    if ([2, 4, 5, 7].includes(orientation2)) {
      image = image.flipX();
    }
  }
  return image;
}
function loadTIFF(data, ignorePalette) {
  let result = decodeTIFF(data);
  if (result.length === 1) {
    return getImageFromIFD(result[0], ignorePalette);
  } else {
    return new Stack(
      result.map(function(image) {
        return getImageFromIFD(image, ignorePalette);
      })
    );
  }
}
function getMetadata(image) {
  const metadata = {
    tiff: {
      fields: image.fields,
      tags: image.map
    }
  };
  if (image.exif) {
    metadata.exif = image.exif;
  }
  if (image.gps) {
    metadata.gps = image.gps;
  }
  return metadata;
}
function getImageFromIFD(image, ignorePalette) {
  if (!ignorePalette && image.type === 3) {
    const data = new Uint16Array(3 * image.width * image.height);
    const palette = image.palette;
    let ptr = 0;
    for (let i2 = 0; i2 < image.data.length; i2++) {
      const index = image.data[i2];
      const color = palette[index];
      data[ptr++] = color[0];
      data[ptr++] = color[1];
      data[ptr++] = color[2];
    }
    return new Image(image.width, image.height, data, {
      components: 3,
      alpha: image.alpha,
      colorModel: RGB$1,
      bitDepth: 16,
      meta: getMetadata(image)
    });
  } else {
    return new Image(image.width, image.height, image.data, {
      components: image.type === 2 ? 3 : 1,
      alpha: image.alpha,
      colorModel: image.type === 2 ? RGB$1 : GREY$1,
      bitDepth: image.bitsPerSample.length ? image.bitsPerSample[0] : image.bitsPerSample,
      meta: getMetadata(image)
    });
  }
}
function loadGeneric(url, options) {
  options = options || {};
  return new Promise(function(resolve2, reject2) {
    let image = new DOMImage();
    image.onload = function() {
      let w = image.width;
      let h = image.height;
      let canvas = createCanvas(w, h);
      let ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, w, h);
      let data = ctx.getImageData(0, 0, w, h).data;
      resolve2(new Image(w, h, data, options));
    };
    image.onerror = function() {
      reject2(new Error(`Could not load ${url}`));
    };
    image.src = url;
  });
}
const valueMethods = {
  /**
   * Get the value of specific pixel channel
   * @memberof Image
   * @instance
   * @param {number} x - x coordinate (0 = left)
   * @param {number} y - y coordinate (0 = top)
   * @param {number} channel
   * @return {number} - the value of this pixel channel
   */
  getValueXY(x, y, channel) {
    return this.data[(y * this.width + x) * this.channels + channel];
  },
  /**
   * Set the value of specific pixel channel
   * @memberof Image
   * @instance
   * @param {number} x - x coordinate (0 = left)
   * @param {number} y - y coordinate (0 = top)
   * @param {number} channel
   * @param {number} value - the new value of this pixel channel
   * @return {this}
   */
  setValueXY(x, y, channel, value) {
    this.data[(y * this.width + x) * this.channels + channel] = value;
    this.computed = null;
    return this;
  },
  /**
   * Get the value of specific pixel channel
   * @memberof Image
   * @instance
   * @param {number} index - 1D index of the pixel
   * @param {number} channel
   * @return {number} - the value of this pixel channel
   */
  getValue(index, channel) {
    return this.data[index * this.channels + channel];
  },
  /**
   * Set the value of specific pixel channel
   * @memberof Image
   * @instance
   * @param {number} index - 1D index of the pixel
   * @param {number} channel
   * @param {number} value - the new value of this pixel channel
   * @return {this}
   */
  setValue(index, channel, value) {
    this.data[index * this.channels + channel] = value;
    this.computed = null;
    return this;
  },
  /**
   * Get the value of an entire pixel
   * @memberof Image
   * @instance
   * @param {number} x - x coordinate (0 = left)
   * @param {number} y - y coordinate (0 = top)
   * @return {number[]} the value of this pixel
   */
  getPixelXY(x, y) {
    return this.getPixel(y * this.width + x);
  },
  /**
   * Set the value of an entire pixel
   * @memberof Image
   * @instance
   * @param {number} x - x coordinate (0 = left)
   * @param {number} y - y coordinate (0 = top)
   * @param {number[]} value - the new value of this pixel
   * @return {this}
   */
  setPixelXY(x, y, value) {
    return this.setPixel(y * this.width + x, value);
  },
  /**
   * Get the value of an entire pixel
   * @memberof Image
   * @instance
   * @param {number} index - 1D index of the pixel
   * @return {number[]} the value of this pixel
   */
  getPixel(index) {
    const value = new Array(this.channels);
    const target = index * this.channels;
    for (let i2 = 0; i2 < this.channels; i2++) {
      value[i2] = this.data[target + i2];
    }
    return value;
  },
  /**
   * Set the value of an entire pixel
   * @memberof Image
   * @instance
   * @param {number} index - 1D index of the pixel
   * @param {number[]} value - the new value of this pixel
   * @return {this}
   */
  setPixel(index, value) {
    const target = index * this.channels;
    for (let i2 = 0; i2 < value.length; i2++) {
      this.data[target + i2] = value[i2];
    }
    this.computed = null;
    return this;
  }
};
function setValueMethods(Image2) {
  for (const i2 in valueMethods) {
    Image2.prototype[i2] = valueMethods[i2];
  }
}
function getImageParameters(image) {
  return {
    width: image.width,
    height: image.height,
    components: image.components,
    alpha: image.alpha,
    colorModel: image.colorModel,
    bitDepth: image.bitDepth
  };
}
function getOutputImage(thisImage, options, newParameters, internalOptions = {}) {
  const { out } = options;
  if (out === void 0) {
    if (internalOptions.copy) {
      return thisImage.clone();
    } else {
      return Image.createFrom(thisImage, newParameters);
    }
  } else {
    if (!Image.isImage(out)) {
      throw new TypeError("out must be an Image object");
    }
    const requirements = Object.assign(
      getImageParameters(thisImage),
      newParameters
    );
    for (const property in requirements) {
      if (out[property] !== requirements[property]) {
        throw new RangeError(
          `cannot use out. Its ${property} must be "${requirements[property]}" (found "${out[property]}")`
        );
      }
    }
    return out;
  }
}
function getOutputImageOrInPlace(thisImage, options, internalOptions) {
  if (options.inPlace !== void 0 && typeof options.inPlace !== "boolean") {
    throw new TypeError("inPlace option must be a boolean");
  }
  if (options.inPlace) {
    if (options.out !== void 0) {
      throw new TypeError(
        "out option must not be set if inPlace option is true"
      );
    }
    return thisImage;
  }
  return getOutputImage(thisImage, options, null, internalOptions);
}
function abs(options = {}) {
  this.checkProcessable("abs", {
    bitDepth: [32]
  });
  const out = getOutputImageOrInPlace(this, options);
  absolute(this, out);
  return out;
}
function absolute(image, out) {
  for (let i2 = 0; i2 < image.data.length; i2++) {
    out.data[i2] = Math.abs(image.data[i2]);
  }
}
function copyAlphaChannel(from, to) {
  if (from.alpha === 1 && to.alpha === 1) {
    for (let i2 = 0; i2 < from.size; i2++) {
      to.data[i2 * to.channels + to.components] = from.data[i2 * from.channels + from.components];
    }
  }
}
function invert(options = {}) {
  this.checkProcessable("invert", {
    bitDepth: [1, 8, 16]
  });
  const out = getOutputImageOrInPlace(this, options);
  if (this.bitDepth === 1) {
    invertBinary(this, out);
  } else {
    invertColor(this, out);
    if (this !== out) {
      copyAlphaChannel(this, out);
    }
  }
  return out;
}
function invertBinary(image, out) {
  for (let i2 = 0; i2 < image.data.length; i2++) {
    out.data[i2] = ~image.data[i2];
  }
}
function invertColor(image, out) {
  for (let pixel = 0; pixel < image.data.length; pixel += image.channels) {
    for (let c = 0; c < image.components; c++) {
      out.data[pixel + c] = image.maxValue - image.data[pixel + c];
    }
  }
}
function flipX() {
  this.checkProcessable("flipX", {
    bitDepth: [8, 16]
  });
  for (let i2 = 0; i2 < this.height; i2++) {
    let offsetY = i2 * this.width * this.channels;
    for (let j = 0; j < Math.floor(this.width / 2); j++) {
      let posCurrent = j * this.channels + offsetY;
      let posOpposite = (this.width - j - 1) * this.channels + offsetY;
      for (let k = 0; k < this.channels; k++) {
        let tmp = this.data[posCurrent + k];
        this.data[posCurrent + k] = this.data[posOpposite + k];
        this.data[posOpposite + k] = tmp;
      }
    }
  }
  return this;
}
function flipY() {
  this.checkProcessable("flipY", {
    bitDepth: [8, 16]
  });
  for (let i2 = 0; i2 < Math.floor(this.height / 2); i2++) {
    for (let j = 0; j < this.width; j++) {
      let posCurrent = j * this.channels + i2 * this.width * this.channels;
      let posOpposite = j * this.channels + (this.height - 1 - i2) * this.channels * this.width;
      for (let k = 0; k < this.channels; k++) {
        let tmp = this.data[posCurrent + k];
        this.data[posCurrent + k] = this.data[posOpposite + k];
        this.data[posOpposite + k] = tmp;
      }
    }
  }
  return this;
}
function blurFilter(options = {}) {
  const { radius = 1 } = options;
  if (radius < 1) {
    throw new Error("radius must be greater than 1");
  }
  const n = 2 * radius + 1;
  const kernel2 = new Array(n);
  for (let i2 = 0; i2 < n; i2++) {
    kernel2[i2] = new Array(n);
    for (let j = 0; j < n; j++) {
      kernel2[i2][j] = 1 / (n * n);
    }
  }
  return this.convolution(kernel2);
}
var medianQuickselect_min = { exports: {} };
(function(module2) {
  (function() {
    function a(d) {
      for (var e = 0, f = d.length - 1, g = void 0, h = void 0, i2 = void 0, j = c(e, f); true; ) {
        if (f <= e) return d[j];
        if (f == e + 1) return d[e] > d[f] && b(d, e, f), d[j];
        for (g = c(e, f), d[g] > d[f] && b(d, g, f), d[e] > d[f] && b(d, e, f), d[g] > d[e] && b(d, g, e), b(d, g, e + 1), h = e + 1, i2 = f; true; ) {
          do
            h++;
          while (d[e] > d[h]);
          do
            i2--;
          while (d[i2] > d[e]);
          if (i2 < h) break;
          b(d, h, i2);
        }
        b(d, e, i2), i2 <= j && (e = h), i2 >= j && (f = i2 - 1);
      }
    }
    var b = function b2(d, e, f) {
      var _ref;
      return _ref = [d[f], d[e]], d[e] = _ref[0], d[f] = _ref[1], _ref;
    }, c = function c2(d, e) {
      return ~~((d + e) / 2);
    };
    module2.exports ? module2.exports = a : window.median = a;
  })();
})(medianQuickselect_min);
var medianQuickselect_minExports = medianQuickselect_min.exports;
const quickSelectMedian = /* @__PURE__ */ getDefaultExportFromCjs(medianQuickselect_minExports);
function validateArrayOfChannels(image, options = {}) {
  let {
    channels,
    allowAlpha,
    // are we allowing the selection of an alpha channel ?
    defaultAlpha
    // if no channels are selected should we take the alpha channel ?
  } = options;
  if (typeof allowAlpha !== "boolean") {
    allowAlpha = true;
  }
  if (typeof channels === "undefined") {
    return allChannels(image, defaultAlpha);
  } else {
    return validateChannels(image, channels, allowAlpha);
  }
}
function allChannels(image, defaultAlpha) {
  let length = defaultAlpha ? image.channels : image.components;
  let array = new Array(length);
  for (let i2 = 0; i2 < length; i2++) {
    array[i2] = i2;
  }
  return array;
}
function validateChannels(image, channels, allowAlpha) {
  if (!Array.isArray(channels)) {
    channels = [channels];
  }
  for (let c = 0; c < channels.length; c++) {
    channels[c] = validateChannel(image, channels[c], allowAlpha);
  }
  return channels;
}
function validateChannel(image, channel, allowAlpha = true) {
  if (channel === void 0) {
    throw new RangeError(
      `validateChannel : the channel has to be >=0 and <${image.channels}`
    );
  }
  if (typeof channel === "string") {
    switch (image.colorModel) {
      case GREY$1:
        break;
      case RGB$1:
        if ("rgb".includes(channel)) {
          switch (channel) {
            case "r":
              channel = 0;
              break;
            case "g":
              channel = 1;
              break;
            case "b":
              channel = 2;
              break;
          }
        }
        break;
      case HSL:
        if ("hsl".includes(channel)) {
          switch (channel) {
            case "h":
              channel = 0;
              break;
            case "s":
              channel = 1;
              break;
            case "l":
              channel = 2;
              break;
          }
        }
        break;
      case HSV:
        if ("hsv".includes(channel)) {
          switch (channel) {
            case "h":
              channel = 0;
              break;
            case "s":
              channel = 1;
              break;
            case "v":
              channel = 2;
              break;
          }
        }
        break;
      case CMYK$1:
        if ("cmyk".includes(channel)) {
          switch (channel) {
            case "c":
              channel = 0;
              break;
            case "m":
              channel = 1;
              break;
            case "y":
              channel = 2;
              break;
            case "k":
              channel = 3;
              break;
          }
        }
        break;
      default:
        throw new Error(`Unexpected color model: ${image.colorModel}`);
    }
    if (channel === "a") {
      if (!image.alpha) {
        throw new Error(
          "validateChannel : the image does not contain alpha channel"
        );
      }
      channel = image.components;
    }
    if (typeof channel === "string") {
      throw new Error(`validateChannel : undefined channel: ${channel}`);
    }
  }
  if (channel >= image.channels) {
    throw new RangeError(
      `validateChannel : the channel has to be >=0 and <${image.channels}`
    );
  }
  if (!allowAlpha && channel >= image.components) {
    throw new RangeError("validateChannel : alpha channel may not be selected");
  }
  return channel;
}
function medianFilter(options = {}) {
  let { radius = 1, border = "copy", channels } = options;
  this.checkProcessable("medianFilter", {
    bitDepth: [8, 16]
  });
  if (radius < 1) {
    throw new Error("radius must be greater than 0");
  }
  channels = validateArrayOfChannels(this, channels);
  let kWidth = radius;
  let kHeight = radius;
  let newImage = Image.createFrom(this);
  let size = (kWidth * 2 + 1) * (kHeight * 2 + 1);
  let kernel2 = new Array(size);
  for (let channel = 0; channel < channels.length; channel++) {
    let c = channels[channel];
    for (let y = kHeight; y < this.height - kHeight; y++) {
      for (let x = kWidth; x < this.width - kWidth; x++) {
        let n = 0;
        for (let j = -kHeight; j <= kHeight; j++) {
          for (let i2 = -kWidth; i2 <= kWidth; i2++) {
            let index2 = ((y + j) * this.width + x + i2) * this.channels + c;
            kernel2[n++] = this.data[index2];
          }
        }
        let index = (y * this.width + x) * this.channels + c;
        newImage.data[index] = quickSelectMedian(kernel2);
      }
    }
  }
  if (this.alpha && !channels.includes(this.channels)) {
    for (let i2 = this.components; i2 < this.data.length; i2 = i2 + this.channels) {
      newImage.data[i2] = this.data[i2];
    }
  }
  newImage.setBorder({ size: [kWidth, kHeight], algorithm: border });
  return newImage;
}
function gaussianFilter(options = {}) {
  let { radius = 1, sigma, channels, border = "copy" } = options;
  this.checkProcessable("gaussian", {
    bitDepth: [8, 16]
  });
  const kernel2 = getKernel(radius, sigma);
  return this.convolution([kernel2, kernel2], {
    border,
    channels,
    algorithm: "separable"
  });
}
function getKernel(radius, sigma) {
  const n = radius * 2 + 1;
  const kernel2 = new Array(n);
  const sigmaX = sigma ? sigma : ((n - 1) * 0.5 - 1) * 0.3 + 0.8;
  const scale2X = -0.5 / (sigmaX * sigmaX);
  let sum2 = 0;
  for (let i2 = 0; i2 < n; i2++) {
    const x = i2 - radius;
    const t = Math.exp(scale2X * x * x);
    kernel2[i2] = t;
    sum2 += t;
  }
  for (let i2 = 0; i2 < n; i2++) {
    kernel2[i2] /= sum2;
  }
  return kernel2;
}
const SOBEL_X = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1]
];
const SOBEL_Y = [
  [-1, -2, -1],
  [0, 0, 0],
  [1, 2, 1]
];
const SCHARR_X = [
  [3, 0, -3],
  [10, 0, -10],
  [3, 0, -3]
];
const SCHARR_Y = [
  [3, 10, 3],
  [0, 0, 0],
  [-3, -10, -3]
];
var src$2 = {};
var fftlib = {};
(function(exports) {
  (function() {
    var FFT2;
    {
      FFT2 = exports;
    }
    var version2 = {
      release: "0.3.0",
      date: "2013-03"
    };
    FFT2.toString = function() {
      return "version " + version2.release + ", released " + version2.date;
    };
    var _n = 0, _bitrev = null, _cstb = null;
    var core = {
      init: function(n) {
        if (n !== 0 && (n & n - 1) === 0) {
          _n = n;
          core._initArray();
          core._makeBitReversalTable();
          core._makeCosSinTable();
        } else {
          throw new Error("init: radix-2 required");
        }
      },
      // 1D-FFT
      fft1d: function(re, im) {
        core.fft(re, im, 1);
      },
      // 1D-IFFT
      ifft1d: function(re, im) {
        var n = 1 / _n;
        core.fft(re, im, -1);
        for (var i3 = 0; i3 < _n; i3++) {
          re[i3] *= n;
          im[i3] *= n;
        }
      },
      // 1D-IFFT
      bt1d: function(re, im) {
        core.fft(re, im, -1);
      },
      // 2D-FFT Not very useful if the number of rows have to be equal to cols
      fft2d: function(re, im) {
        var tre = [], tim = [], i3 = 0;
        for (var y = 0; y < _n; y++) {
          i3 = y * _n;
          for (var x1 = 0; x1 < _n; x1++) {
            tre[x1] = re[x1 + i3];
            tim[x1] = im[x1 + i3];
          }
          core.fft1d(tre, tim);
          for (var x2 = 0; x2 < _n; x2++) {
            re[x2 + i3] = tre[x2];
            im[x2 + i3] = tim[x2];
          }
        }
        for (var x = 0; x < _n; x++) {
          for (var y1 = 0; y1 < _n; y1++) {
            i3 = x + y1 * _n;
            tre[y1] = re[i3];
            tim[y1] = im[i3];
          }
          core.fft1d(tre, tim);
          for (var y2 = 0; y2 < _n; y2++) {
            i3 = x + y2 * _n;
            re[i3] = tre[y2];
            im[i3] = tim[y2];
          }
        }
      },
      // 2D-IFFT
      ifft2d: function(re, im) {
        var tre = [], tim = [], i3 = 0;
        for (var y = 0; y < _n; y++) {
          i3 = y * _n;
          for (var x1 = 0; x1 < _n; x1++) {
            tre[x1] = re[x1 + i3];
            tim[x1] = im[x1 + i3];
          }
          core.ifft1d(tre, tim);
          for (var x2 = 0; x2 < _n; x2++) {
            re[x2 + i3] = tre[x2];
            im[x2 + i3] = tim[x2];
          }
        }
        for (var x = 0; x < _n; x++) {
          for (var y1 = 0; y1 < _n; y1++) {
            i3 = x + y1 * _n;
            tre[y1] = re[i3];
            tim[y1] = im[i3];
          }
          core.ifft1d(tre, tim);
          for (var y2 = 0; y2 < _n; y2++) {
            i3 = x + y2 * _n;
            re[i3] = tre[y2];
            im[i3] = tim[y2];
          }
        }
      },
      // core operation of FFT
      fft: function(re, im, inv) {
        var d, h, ik, m, tmp, wr, wi, xr, xi, n4 = _n >> 2;
        for (var l = 0; l < _n; l++) {
          m = _bitrev[l];
          if (l < m) {
            tmp = re[l];
            re[l] = re[m];
            re[m] = tmp;
            tmp = im[l];
            im[l] = im[m];
            im[m] = tmp;
          }
        }
        for (var k = 1; k < _n; k <<= 1) {
          h = 0;
          d = _n / (k << 1);
          for (var j = 0; j < k; j++) {
            wr = _cstb[h + n4];
            wi = inv * _cstb[h];
            for (var i3 = j; i3 < _n; i3 += k << 1) {
              ik = i3 + k;
              xr = wr * re[ik] + wi * im[ik];
              xi = wr * im[ik] - wi * re[ik];
              re[ik] = re[i3] - xr;
              re[i3] += xr;
              im[ik] = im[i3] - xi;
              im[i3] += xi;
            }
            h += d;
          }
        }
      },
      // initialize the array (supports TypedArray)
      _initArray: function() {
        if (typeof Uint32Array !== "undefined") {
          _bitrev = new Uint32Array(_n);
        } else {
          _bitrev = [];
        }
        if (typeof Float64Array !== "undefined") {
          _cstb = new Float64Array(_n * 1.25);
        } else {
          _cstb = [];
        }
      },
      // zero padding
      _paddingZero: function() {
      },
      // makes bit reversal table
      _makeBitReversalTable: function() {
        var i3 = 0, j = 0, k = 0;
        _bitrev[0] = 0;
        while (++i3 < _n) {
          k = _n >> 1;
          while (k <= j) {
            j -= k;
            k >>= 1;
          }
          j += k;
          _bitrev[i3] = j;
        }
      },
      // makes trigonometiric function table
      _makeCosSinTable: function() {
        var n2 = _n >> 1, n4 = _n >> 2, n8 = _n >> 3, n2p4 = n2 + n4, t = Math.sin(Math.PI / _n), dc = 2 * t * t, ds = Math.sqrt(dc * (2 - dc)), c = _cstb[n4] = 1, s = _cstb[0] = 0;
        t = 2 * dc;
        for (var i3 = 1; i3 < n8; i3++) {
          c -= dc;
          dc += t * c;
          s += ds;
          ds -= t * s;
          _cstb[i3] = s;
          _cstb[n4 - i3] = c;
        }
        if (n8 !== 0) {
          _cstb[n8] = Math.sqrt(0.5);
        }
        for (var j = 0; j < n4; j++) {
          _cstb[n2 - j] = _cstb[j];
        }
        for (var k = 0; k < n2p4; k++) {
          _cstb[k + n2] = -_cstb[k];
        }
      }
    };
    var apis = ["init", "fft1d", "ifft1d", "fft2d", "ifft2d"];
    for (var i2 = 0; i2 < apis.length; i2++) {
      FFT2[apis[i2]] = core[apis[i2]];
    }
    FFT2.bt = core.bt1d;
    FFT2.fft = core.fft1d;
    FFT2.ifft = core.ifft1d;
    return FFT2;
  }).call(commonjsGlobal);
})(fftlib);
var FFT$1 = fftlib;
var FFTUtils$1 = {
  DEBUG: false,
  /**
   * Calculates the inverse of a 2D Fourier transform
   *
   * @param ft
   * @param ftRows
   * @param ftCols
   * @return
   */
  ifft2DArray: function(ft, ftRows, ftCols) {
    var tempTransform = new Array(ftRows * ftCols);
    var nRows = ftRows / 2;
    var nCols = (ftCols - 1) * 2;
    FFT$1.init(nRows);
    var tmpCols = { re: new Array(nRows), im: new Array(nRows) };
    for (var iCol = 0; iCol < ftCols; iCol++) {
      for (var iRow = nRows - 1; iRow >= 0; iRow--) {
        tmpCols.re[iRow] = ft[iRow * 2 * ftCols + iCol];
        tmpCols.im[iRow] = ft[(iRow * 2 + 1) * ftCols + iCol];
      }
      FFT$1.bt(tmpCols.re, tmpCols.im);
      for (var iRow = nRows - 1; iRow >= 0; iRow--) {
        tempTransform[iRow * 2 * ftCols + iCol] = tmpCols.re[iRow];
        tempTransform[(iRow * 2 + 1) * ftCols + iCol] = tmpCols.im[iRow];
      }
    }
    var finalTransform = new Array(nRows * nCols);
    FFT$1.init(nCols);
    var tmpRows = { re: new Array(nCols), im: new Array(nCols) };
    var scale = nCols * nRows;
    for (var iRow = 0; iRow < ftRows; iRow += 2) {
      tmpRows.re[0] = tempTransform[iRow * ftCols];
      tmpRows.im[0] = tempTransform[(iRow + 1) * ftCols];
      for (var iCol = 1; iCol < ftCols; iCol++) {
        tmpRows.re[iCol] = tempTransform[iRow * ftCols + iCol];
        tmpRows.im[iCol] = tempTransform[(iRow + 1) * ftCols + iCol];
        tmpRows.re[nCols - iCol] = tempTransform[iRow * ftCols + iCol];
        tmpRows.im[nCols - iCol] = -tempTransform[(iRow + 1) * ftCols + iCol];
      }
      FFT$1.bt(tmpRows.re, tmpRows.im);
      var indexB = iRow / 2 * nCols;
      for (var iCol = nCols - 1; iCol >= 0; iCol--) {
        finalTransform[indexB + iCol] = tmpRows.re[iCol] / scale;
      }
    }
    return finalTransform;
  },
  /**
   * Calculates the fourier transform of a matrix of size (nRows,nCols) It is
   * assumed that both nRows and nCols are a power of two
   *
   * On exit the matrix has dimensions (nRows * 2, nCols / 2 + 1) where the
   * even rows contain the real part and the odd rows the imaginary part of the
   * transform
   * @param data
   * @param nRows
   * @param nCols
   * @return
   */
  fft2DArray: function(data, nRows, nCols, opt) {
    Object.assign({}, { inplace: true });
    var ftCols = nCols / 2 + 1;
    var ftRows = nRows * 2;
    var tempTransform = new Array(ftRows * ftCols);
    FFT$1.init(nCols);
    var tmpRows = { re: new Array(nCols), im: new Array(nCols) };
    var row1 = { re: new Array(nCols), im: new Array(nCols) };
    var row2 = { re: new Array(nCols), im: new Array(nCols) };
    var index, iRow0, iRow1, iRow2, iRow3;
    for (var iRow = 0; iRow < nRows / 2; iRow++) {
      index = iRow * 2 * nCols;
      tmpRows.re = data.slice(index, index + nCols);
      index = (iRow * 2 + 1) * nCols;
      tmpRows.im = data.slice(index, index + nCols);
      FFT$1.fft1d(tmpRows.re, tmpRows.im);
      this.reconstructTwoRealFFT(tmpRows, row1, row2);
      iRow0 = iRow * 4 * ftCols;
      iRow1 = (iRow * 4 + 1) * ftCols;
      iRow2 = (iRow * 4 + 2) * ftCols;
      iRow3 = (iRow * 4 + 3) * ftCols;
      for (var k = ftCols - 1; k >= 0; k--) {
        tempTransform[iRow0 + k] = row1.re[k];
        tempTransform[iRow1 + k] = row1.im[k];
        tempTransform[iRow2 + k] = row2.re[k];
        tempTransform[iRow3 + k] = row2.im[k];
      }
    }
    row1 = null;
    row2 = null;
    var finalTransform = new Array(ftRows * ftCols);
    FFT$1.init(nRows);
    var tmpCols = { re: new Array(nRows), im: new Array(nRows) };
    for (var iCol = ftCols - 1; iCol >= 0; iCol--) {
      for (var iRow = nRows - 1; iRow >= 0; iRow--) {
        tmpCols.re[iRow] = tempTransform[iRow * 2 * ftCols + iCol];
        tmpCols.im[iRow] = tempTransform[(iRow * 2 + 1) * ftCols + iCol];
        if (isNaN(tmpCols.re[iRow])) {
          tmpCols.re[iRow] = 0;
        }
        if (isNaN(tmpCols.im[iRow])) {
          tmpCols.im[iRow] = 0;
        }
      }
      FFT$1.fft1d(tmpCols.re, tmpCols.im);
      for (var iRow = nRows - 1; iRow >= 0; iRow--) {
        finalTransform[iRow * 2 * ftCols + iCol] = tmpCols.re[iRow];
        finalTransform[(iRow * 2 + 1) * ftCols + iCol] = tmpCols.im[iRow];
      }
    }
    return finalTransform;
  },
  /**
   *
   * @param fourierTransform
   * @param realTransform1
   * @param realTransform2
   *
   * Reconstructs the individual Fourier transforms of two simultaneously
   * transformed series. Based on the Symmetry relationships (the asterisk
   * denotes the complex conjugate)
   *
   * F_{N-n} = F_n^{*} for a purely real f transformed to F
   *
   * G_{N-n} = G_n^{*} for a purely imaginary g transformed to G
   *
   */
  reconstructTwoRealFFT: function(fourierTransform, realTransform1, realTransform2) {
    var length = fourierTransform.re.length;
    realTransform1.re[0] = fourierTransform.re[0];
    realTransform1.im[0] = 0;
    realTransform2.re[0] = fourierTransform.im[0];
    realTransform2.im[0] = 0;
    var rm, rp, im, ip, j;
    for (var i2 = length / 2; i2 > 0; i2--) {
      j = length - i2;
      rm = 0.5 * (fourierTransform.re[i2] - fourierTransform.re[j]);
      rp = 0.5 * (fourierTransform.re[i2] + fourierTransform.re[j]);
      im = 0.5 * (fourierTransform.im[i2] - fourierTransform.im[j]);
      ip = 0.5 * (fourierTransform.im[i2] + fourierTransform.im[j]);
      realTransform1.re[i2] = rp;
      realTransform1.im[i2] = im;
      realTransform1.re[j] = rp;
      realTransform1.im[j] = -im;
      realTransform2.re[i2] = ip;
      realTransform2.im[i2] = -rm;
      realTransform2.re[j] = ip;
      realTransform2.im[j] = rm;
    }
  },
  /**
   * In place version of convolute 2D
   *
   * @param ftSignal
   * @param ftFilter
   * @param ftRows
   * @param ftCols
   * @return
   */
  convolute2DI: function(ftSignal, ftFilter, ftRows, ftCols) {
    var re, im;
    for (var iRow = 0; iRow < ftRows / 2; iRow++) {
      for (var iCol = 0; iCol < ftCols; iCol++) {
        re = ftSignal[iRow * 2 * ftCols + iCol] * ftFilter[iRow * 2 * ftCols + iCol] - ftSignal[(iRow * 2 + 1) * ftCols + iCol] * ftFilter[(iRow * 2 + 1) * ftCols + iCol];
        im = ftSignal[iRow * 2 * ftCols + iCol] * ftFilter[(iRow * 2 + 1) * ftCols + iCol] + ftSignal[(iRow * 2 + 1) * ftCols + iCol] * ftFilter[iRow * 2 * ftCols + iCol];
        ftSignal[iRow * 2 * ftCols + iCol] = re;
        ftSignal[(iRow * 2 + 1) * ftCols + iCol] = im;
      }
    }
  },
  /**
   *
   * @param data
   * @param kernel
   * @param nRows
   * @param nCols
   * @returns {*}
   */
  convolute: function(data, kernel2, nRows, nCols, opt) {
    var ftSpectrum = new Array(nCols * nRows);
    for (var i2 = 0; i2 < nRows * nCols; i2++) {
      ftSpectrum[i2] = data[i2];
    }
    ftSpectrum = this.fft2DArray(ftSpectrum, nRows, nCols);
    var dimR = kernel2.length;
    var dimC = kernel2[0].length;
    var ftFilterData = new Array(nCols * nRows);
    for (var i2 = 0; i2 < nCols * nRows; i2++) {
      ftFilterData[i2] = 0;
    }
    var iRow, iCol;
    var shiftR = Math.floor((dimR - 1) / 2);
    var shiftC = Math.floor((dimC - 1) / 2);
    for (var ir = 0; ir < dimR; ir++) {
      iRow = (ir - shiftR + nRows) % nRows;
      for (var ic = 0; ic < dimC; ic++) {
        iCol = (ic - shiftC + nCols) % nCols;
        ftFilterData[iRow * nCols + iCol] = kernel2[ir][ic];
      }
    }
    ftFilterData = this.fft2DArray(ftFilterData, nRows, nCols);
    var ftRows = nRows * 2;
    var ftCols = nCols / 2 + 1;
    this.convolute2DI(ftSpectrum, ftFilterData, ftRows, ftCols);
    return this.ifft2DArray(ftSpectrum, ftRows, ftCols);
  },
  toRadix2: function(data, nRows, nCols) {
    var i2, j, irow, icol;
    var cols = nCols, rows = nRows;
    if (!(nCols !== 0 && (nCols & nCols - 1) === 0)) {
      cols = 0;
      while (nCols >> ++cols != 0) ;
      cols = 1 << cols;
    }
    if (!(nRows !== 0 && (nRows & nRows - 1) === 0)) {
      rows = 0;
      while (nRows >> ++rows != 0) ;
      rows = 1 << rows;
    }
    if (rows == nRows && cols == nCols)
      return { data, rows: nRows, cols: nCols };
    var output = new Array(rows * cols);
    var shiftR = Math.floor((rows - nRows) / 2) - nRows;
    var shiftC = Math.floor((cols - nCols) / 2) - nCols;
    for (i2 = 0; i2 < rows; i2++) {
      irow = i2 * cols;
      icol = (i2 - shiftR) % nRows * nCols;
      for (j = 0; j < cols; j++) {
        output[irow + j] = data[icol + (j - shiftC) % nCols];
      }
    }
    return { data: output, rows, cols };
  },
  /**
   * Crop the given matrix to fit the corresponding number of rows and columns
   */
  crop: function(data, rows, cols, nRows, nCols, opt) {
    if (rows == nRows && cols == nCols)
      return data;
    Object.assign({}, opt);
    var output = new Array(nCols * nRows);
    var shiftR = Math.floor((rows - nRows) / 2);
    var shiftC = Math.floor((cols - nCols) / 2);
    var destinyRow, sourceRow, i2, j;
    for (i2 = 0; i2 < nRows; i2++) {
      destinyRow = i2 * nCols;
      sourceRow = (i2 + shiftR) * cols;
      for (j = 0; j < nCols; j++) {
        output[destinyRow + j] = data[sourceRow + (j + shiftC)];
      }
    }
    return output;
  }
};
var FFTUtils_1 = FFTUtils$1;
src$2.FFTUtils = FFTUtils_1;
src$2.FFT = fftlib;
var FFTUtils = src$2.FFTUtils;
function convolutionFFT(input, kernel2, opt) {
  var tmp = matrix2Array(input);
  var inputData = tmp.data;
  var options = Object.assign({ normalize: false, divisor: 1, rows: tmp.rows, cols: tmp.cols }, opt);
  var nRows, nCols;
  if (options.rows && options.cols) {
    nRows = options.rows;
    nCols = options.cols;
  } else {
    throw new Error("Invalid number of rows or columns " + nRows + " " + nCols);
  }
  var divisor = options.divisor;
  var i2, j;
  var kHeight = kernel2.length;
  var kWidth = kernel2[0].length;
  if (options.normalize) {
    divisor = 0;
    for (i2 = 0; i2 < kHeight; i2++)
      for (j = 0; j < kWidth; j++)
        divisor += kernel2[i2][j];
  }
  if (divisor === 0) {
    throw new RangeError("convolution: The divisor is equal to zero");
  }
  var radix2Sized = FFTUtils.toRadix2(inputData, nRows, nCols);
  var conv = FFTUtils.convolute(radix2Sized.data, kernel2, radix2Sized.rows, radix2Sized.cols);
  conv = FFTUtils.crop(conv, radix2Sized.rows, radix2Sized.cols, nRows, nCols);
  if (divisor != 0 && divisor != 1) {
    for (i2 = 0; i2 < conv.length; i2++) {
      conv[i2] /= divisor;
    }
  }
  return conv;
}
function convolutionDirect(input, kernel2, opt) {
  var tmp = matrix2Array(input);
  var inputData = tmp.data;
  var options = Object.assign({ normalize: false, divisor: 1, rows: tmp.rows, cols: tmp.cols }, opt);
  var nRows, nCols;
  if (options.rows && options.cols) {
    nRows = options.rows;
    nCols = options.cols;
  } else {
    throw new Error("Invalid number of rows or columns " + nRows + " " + nCols);
  }
  var divisor = options.divisor;
  var kHeight = kernel2.length;
  var kWidth = kernel2[0].length;
  var i2, j, x, y, index, sum2, kVal, row, col;
  if (options.normalize) {
    divisor = 0;
    for (i2 = 0; i2 < kHeight; i2++)
      for (j = 0; j < kWidth; j++)
        divisor += kernel2[i2][j];
  }
  if (divisor === 0) {
    throw new RangeError("convolution: The divisor is equal to zero");
  }
  var output = new Array(nRows * nCols);
  var hHeight = Math.floor(kHeight / 2);
  var hWidth = Math.floor(kWidth / 2);
  for (y = 0; y < nRows; y++) {
    for (x = 0; x < nCols; x++) {
      sum2 = 0;
      for (j = 0; j < kHeight; j++) {
        for (i2 = 0; i2 < kWidth; i2++) {
          kVal = kernel2[kHeight - j - 1][kWidth - i2 - 1];
          row = (y + j - hHeight + nRows) % nRows;
          col = (x + i2 - hWidth + nCols) % nCols;
          index = row * nCols + col;
          sum2 += inputData[index] * kVal;
        }
      }
      index = y * nCols + x;
      output[index] = sum2 / divisor;
    }
  }
  return output;
}
function LoG(sigma, nPoints, options) {
  var factor = 1e3;
  if (options && options.factor) {
    factor = options.factor;
  }
  var kernel2 = new Array(nPoints);
  var i2, j, tmp, y2;
  factor *= -1;
  var center = (nPoints - 1) / 2;
  var sigma2 = 2 * sigma * sigma;
  for (i2 = 0; i2 < nPoints; i2++) {
    kernel2[i2] = new Array(nPoints);
    y2 = (i2 - center) * (i2 - center);
    for (j = 0; j < nPoints; j++) {
      tmp = -((j - center) * (j - center) + y2) / sigma2;
      kernel2[i2][j] = Math.round(factor * (1 + tmp) * Math.exp(tmp));
    }
  }
  return kernel2;
}
function matrix2Array(input) {
  var inputData = input;
  var nRows, nCols;
  if (typeof input[0] != "number") {
    nRows = input.length;
    nCols = input[0].length;
    inputData = new Array(nRows * nCols);
    for (var i2 = 0; i2 < nRows; i2++) {
      for (var j = 0; j < nCols; j++) {
        inputData[i2 * nCols + j] = input[i2][j];
      }
    }
  } else {
    var tmp = Math.sqrt(input.length);
    if (Number.isInteger(tmp)) {
      nRows = tmp;
      nCols = tmp;
    }
  }
  return { data: inputData, rows: nRows, cols: nCols };
}
var src$1 = {
  fft: convolutionFFT,
  direct: convolutionDirect,
  kernelFactory: { LoG },
  matrix2Array
};
var _isFinite = Number.isFinite || function(value) {
  return !(typeof value !== "number" || value !== value || value === Infinity || value === -Infinity);
};
var isFinite$1 = _isFinite;
var isInteger = Number.isInteger || function(val) {
  return typeof val === "number" && isFinite$1(val) && Math.floor(val) === val;
};
const isInteger$1 = /* @__PURE__ */ getDefaultExportFromCjs(isInteger);
function validateKernel(kernel2) {
  let kHeight, kWidth;
  if (Array.isArray(kernel2)) {
    if (Array.isArray(kernel2[0])) {
      if ((kernel2.length & 1) === 0 || (kernel2[0].length & 1) === 0) {
        throw new RangeError(
          "validateKernel: Kernel rows and columns should be odd numbers"
        );
      } else {
        kHeight = Math.floor(kernel2.length / 2);
        kWidth = Math.floor(kernel2[0].length / 2);
      }
    } else {
      let kernelWidth = Math.sqrt(kernel2.length);
      if (isInteger$1(kernelWidth)) {
        kWidth = kHeight = Math.floor(Math.sqrt(kernel2.length) / 2);
      } else {
        throw new RangeError("validateKernel: Kernel array should be a square");
      }
      let newKernel = new Array(kernelWidth);
      for (let i2 = 0; i2 < kernelWidth; i2++) {
        newKernel[i2] = new Array(kernelWidth);
        for (let j = 0; j < kernelWidth; j++) {
          newKernel[i2][j] = kernel2[i2 * kernelWidth + j];
        }
      }
      kernel2 = newKernel;
    }
  } else {
    throw new Error(`validateKernel: Invalid Kernel: ${kernel2}`);
  }
  return { kernel: kernel2, kWidth, kHeight };
}
function clamp(value, image) {
  return Math.round(Math.min(Math.max(value, 0), image.maxValue));
}
function directConvolution(input, kernel2, output) {
  if (output === void 0) {
    const length = input.length + kernel2.length - 1;
    output = new Array(length);
  }
  fill(output);
  for (var i2 = 0; i2 < input.length; i2++) {
    for (var j = 0; j < kernel2.length; j++) {
      output[i2 + j] += input[i2] * kernel2[j];
    }
  }
  return output;
}
function fill(array) {
  for (var i2 = 0; i2 < array.length; i2++) {
    array[i2] = 0;
  }
}
function FFT(size) {
  this.size = size | 0;
  if (this.size <= 1 || (this.size & this.size - 1) !== 0)
    throw new Error("FFT size must be a power of two and bigger than 1");
  this._csize = size << 1;
  var table = new Array(this.size * 2);
  for (var i2 = 0; i2 < table.length; i2 += 2) {
    const angle = Math.PI * i2 / this.size;
    table[i2] = Math.cos(angle);
    table[i2 + 1] = -Math.sin(angle);
  }
  this.table = table;
  var power = 0;
  for (var t = 1; this.size > t; t <<= 1)
    power++;
  this._width = power % 2 === 0 ? power - 1 : power;
  this._bitrev = new Array(1 << this._width);
  for (var j = 0; j < this._bitrev.length; j++) {
    this._bitrev[j] = 0;
    for (var shift = 0; shift < this._width; shift += 2) {
      var revShift = this._width - shift - 2;
      this._bitrev[j] |= (j >>> shift & 3) << revShift;
    }
  }
  this._out = null;
  this._data = null;
  this._inv = 0;
}
FFT.prototype.fromComplexArray = function fromComplexArray(complex, storage) {
  var res = storage || new Array(complex.length >>> 1);
  for (var i2 = 0; i2 < complex.length; i2 += 2)
    res[i2 >>> 1] = complex[i2];
  return res;
};
FFT.prototype.createComplexArray = function createComplexArray() {
  const res = new Array(this._csize);
  for (var i2 = 0; i2 < res.length; i2++)
    res[i2] = 0;
  return res;
};
FFT.prototype.toComplexArray = function toComplexArray(input, storage) {
  var res = storage || this.createComplexArray();
  for (var i2 = 0; i2 < res.length; i2 += 2) {
    res[i2] = input[i2 >>> 1];
    res[i2 + 1] = 0;
  }
  return res;
};
FFT.prototype.completeSpectrum = function completeSpectrum(spectrum) {
  var size = this._csize;
  var half = size >>> 1;
  for (var i2 = 2; i2 < half; i2 += 2) {
    spectrum[size - i2] = spectrum[i2];
    spectrum[size - i2 + 1] = -spectrum[i2 + 1];
  }
};
FFT.prototype.transform = function transform(out, data) {
  if (out === data)
    throw new Error("Input and output buffers must be different");
  this._out = out;
  this._data = data;
  this._inv = 0;
  this._transform4();
  this._out = null;
  this._data = null;
};
FFT.prototype.realTransform = function realTransform(out, data) {
  if (out === data)
    throw new Error("Input and output buffers must be different");
  this._out = out;
  this._data = data;
  this._inv = 0;
  this._realTransform4();
  this._out = null;
  this._data = null;
};
FFT.prototype.inverseTransform = function inverseTransform(out, data) {
  if (out === data)
    throw new Error("Input and output buffers must be different");
  this._out = out;
  this._data = data;
  this._inv = 1;
  this._transform4();
  for (var i2 = 0; i2 < out.length; i2++)
    out[i2] /= this.size;
  this._out = null;
  this._data = null;
};
FFT.prototype._transform4 = function _transform4() {
  var out = this._out;
  var size = this._csize;
  var width = this._width;
  var step = 1 << width;
  var len = size / step << 1;
  var outOff;
  var t;
  var bitrev = this._bitrev;
  if (len === 4) {
    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
      const off = bitrev[t];
      this._singleTransform2(outOff, off, step);
    }
  } else {
    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
      const off = bitrev[t];
      this._singleTransform4(outOff, off, step);
    }
  }
  var inv = this._inv ? -1 : 1;
  var table = this.table;
  for (step >>= 2; step >= 2; step >>= 2) {
    len = size / step << 1;
    var quarterLen = len >>> 2;
    for (outOff = 0; outOff < size; outOff += len) {
      var limit = outOff + quarterLen;
      for (var i2 = outOff, k = 0; i2 < limit; i2 += 2, k += step) {
        const A = i2;
        const B = A + quarterLen;
        const C = B + quarterLen;
        const D = C + quarterLen;
        const Ar = out[A];
        const Ai = out[A + 1];
        const Br = out[B];
        const Bi = out[B + 1];
        const Cr = out[C];
        const Ci = out[C + 1];
        const Dr = out[D];
        const Di = out[D + 1];
        const MAr = Ar;
        const MAi = Ai;
        const tableBr = table[k];
        const tableBi = inv * table[k + 1];
        const MBr = Br * tableBr - Bi * tableBi;
        const MBi = Br * tableBi + Bi * tableBr;
        const tableCr = table[2 * k];
        const tableCi = inv * table[2 * k + 1];
        const MCr = Cr * tableCr - Ci * tableCi;
        const MCi = Cr * tableCi + Ci * tableCr;
        const tableDr = table[3 * k];
        const tableDi = inv * table[3 * k + 1];
        const MDr = Dr * tableDr - Di * tableDi;
        const MDi = Dr * tableDi + Di * tableDr;
        const T0r = MAr + MCr;
        const T0i = MAi + MCi;
        const T1r = MAr - MCr;
        const T1i = MAi - MCi;
        const T2r = MBr + MDr;
        const T2i = MBi + MDi;
        const T3r = inv * (MBr - MDr);
        const T3i = inv * (MBi - MDi);
        const FAr = T0r + T2r;
        const FAi = T0i + T2i;
        const FCr = T0r - T2r;
        const FCi = T0i - T2i;
        const FBr = T1r + T3i;
        const FBi = T1i - T3r;
        const FDr = T1r - T3i;
        const FDi = T1i + T3r;
        out[A] = FAr;
        out[A + 1] = FAi;
        out[B] = FBr;
        out[B + 1] = FBi;
        out[C] = FCr;
        out[C + 1] = FCi;
        out[D] = FDr;
        out[D + 1] = FDi;
      }
    }
  }
};
FFT.prototype._singleTransform2 = function _singleTransform2(outOff, off, step) {
  const out = this._out;
  const data = this._data;
  const evenR = data[off];
  const evenI = data[off + 1];
  const oddR = data[off + step];
  const oddI = data[off + step + 1];
  const leftR = evenR + oddR;
  const leftI = evenI + oddI;
  const rightR = evenR - oddR;
  const rightI = evenI - oddI;
  out[outOff] = leftR;
  out[outOff + 1] = leftI;
  out[outOff + 2] = rightR;
  out[outOff + 3] = rightI;
};
FFT.prototype._singleTransform4 = function _singleTransform4(outOff, off, step) {
  const out = this._out;
  const data = this._data;
  const inv = this._inv ? -1 : 1;
  const step2 = step * 2;
  const step3 = step * 3;
  const Ar = data[off];
  const Ai = data[off + 1];
  const Br = data[off + step];
  const Bi = data[off + step + 1];
  const Cr = data[off + step2];
  const Ci = data[off + step2 + 1];
  const Dr = data[off + step3];
  const Di = data[off + step3 + 1];
  const T0r = Ar + Cr;
  const T0i = Ai + Ci;
  const T1r = Ar - Cr;
  const T1i = Ai - Ci;
  const T2r = Br + Dr;
  const T2i = Bi + Di;
  const T3r = inv * (Br - Dr);
  const T3i = inv * (Bi - Di);
  const FAr = T0r + T2r;
  const FAi = T0i + T2i;
  const FBr = T1r + T3i;
  const FBi = T1i - T3r;
  const FCr = T0r - T2r;
  const FCi = T0i - T2i;
  const FDr = T1r - T3i;
  const FDi = T1i + T3r;
  out[outOff] = FAr;
  out[outOff + 1] = FAi;
  out[outOff + 2] = FBr;
  out[outOff + 3] = FBi;
  out[outOff + 4] = FCr;
  out[outOff + 5] = FCi;
  out[outOff + 6] = FDr;
  out[outOff + 7] = FDi;
};
FFT.prototype._realTransform4 = function _realTransform4() {
  var out = this._out;
  var size = this._csize;
  var width = this._width;
  var step = 1 << width;
  var len = size / step << 1;
  var outOff;
  var t;
  var bitrev = this._bitrev;
  if (len === 4) {
    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
      const off = bitrev[t];
      this._singleRealTransform2(outOff, off >>> 1, step >>> 1);
    }
  } else {
    for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
      const off = bitrev[t];
      this._singleRealTransform4(outOff, off >>> 1, step >>> 1);
    }
  }
  var inv = this._inv ? -1 : 1;
  var table = this.table;
  for (step >>= 2; step >= 2; step >>= 2) {
    len = size / step << 1;
    var halfLen = len >>> 1;
    var quarterLen = halfLen >>> 1;
    var hquarterLen = quarterLen >>> 1;
    for (outOff = 0; outOff < size; outOff += len) {
      for (var i2 = 0, k = 0; i2 <= hquarterLen; i2 += 2, k += step) {
        var A = outOff + i2;
        var B = A + quarterLen;
        var C = B + quarterLen;
        var D = C + quarterLen;
        var Ar = out[A];
        var Ai = out[A + 1];
        var Br = out[B];
        var Bi = out[B + 1];
        var Cr = out[C];
        var Ci = out[C + 1];
        var Dr = out[D];
        var Di = out[D + 1];
        var MAr = Ar;
        var MAi = Ai;
        var tableBr = table[k];
        var tableBi = inv * table[k + 1];
        var MBr = Br * tableBr - Bi * tableBi;
        var MBi = Br * tableBi + Bi * tableBr;
        var tableCr = table[2 * k];
        var tableCi = inv * table[2 * k + 1];
        var MCr = Cr * tableCr - Ci * tableCi;
        var MCi = Cr * tableCi + Ci * tableCr;
        var tableDr = table[3 * k];
        var tableDi = inv * table[3 * k + 1];
        var MDr = Dr * tableDr - Di * tableDi;
        var MDi = Dr * tableDi + Di * tableDr;
        var T0r = MAr + MCr;
        var T0i = MAi + MCi;
        var T1r = MAr - MCr;
        var T1i = MAi - MCi;
        var T2r = MBr + MDr;
        var T2i = MBi + MDi;
        var T3r = inv * (MBr - MDr);
        var T3i = inv * (MBi - MDi);
        var FAr = T0r + T2r;
        var FAi = T0i + T2i;
        var FBr = T1r + T3i;
        var FBi = T1i - T3r;
        out[A] = FAr;
        out[A + 1] = FAi;
        out[B] = FBr;
        out[B + 1] = FBi;
        if (i2 === 0) {
          var FCr = T0r - T2r;
          var FCi = T0i - T2i;
          out[C] = FCr;
          out[C + 1] = FCi;
          continue;
        }
        if (i2 === hquarterLen)
          continue;
        var ST0r = T1r;
        var ST0i = -T1i;
        var ST1r = T0r;
        var ST1i = -T0i;
        var ST2r = -inv * T3i;
        var ST2i = -inv * T3r;
        var ST3r = -inv * T2i;
        var ST3i = -inv * T2r;
        var SFAr = ST0r + ST2r;
        var SFAi = ST0i + ST2i;
        var SFBr = ST1r + ST3i;
        var SFBi = ST1i - ST3r;
        var SA = outOff + quarterLen - i2;
        var SB = outOff + halfLen - i2;
        out[SA] = SFAr;
        out[SA + 1] = SFAi;
        out[SB] = SFBr;
        out[SB + 1] = SFBi;
      }
    }
  }
};
FFT.prototype._singleRealTransform2 = function _singleRealTransform2(outOff, off, step) {
  const out = this._out;
  const data = this._data;
  const evenR = data[off];
  const oddR = data[off + step];
  const leftR = evenR + oddR;
  const rightR = evenR - oddR;
  out[outOff] = leftR;
  out[outOff + 1] = 0;
  out[outOff + 2] = rightR;
  out[outOff + 3] = 0;
};
FFT.prototype._singleRealTransform4 = function _singleRealTransform4(outOff, off, step) {
  const out = this._out;
  const data = this._data;
  const inv = this._inv ? -1 : 1;
  const step2 = step * 2;
  const step3 = step * 3;
  const Ar = data[off];
  const Br = data[off + step];
  const Cr = data[off + step2];
  const Dr = data[off + step3];
  const T0r = Ar + Cr;
  const T1r = Ar - Cr;
  const T2r = Br + Dr;
  const T3r = inv * (Br - Dr);
  const FAr = T0r + T2r;
  const FBr = T1r;
  const FBi = -T3r;
  const FCr = T0r - T2r;
  const FDr = T1r;
  const FDi = T3r;
  out[outOff] = FAr;
  out[outOff + 1] = 0;
  out[outOff + 2] = FBr;
  out[outOff + 3] = FBi;
  out[outOff + 4] = FCr;
  out[outOff + 5] = 0;
  out[outOff + 6] = FDr;
  out[outOff + 7] = FDi;
};
function convolutionSeparable(data, separatedKernel, width, height) {
  const result = new Array(data.length);
  let tmp, conv, offset, kernel2;
  kernel2 = separatedKernel[1];
  offset = (kernel2.length - 1) / 2;
  conv = new Array(width + kernel2.length - 1);
  tmp = new Array(width);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tmp[x] = data[y * width + x];
    }
    directConvolution(tmp, kernel2, conv);
    for (let x = 0; x < width; x++) {
      result[y * width + x] = conv[offset + x];
    }
  }
  kernel2 = separatedKernel[0];
  offset = (kernel2.length - 1) / 2;
  conv = new Array(height + kernel2.length - 1);
  tmp = new Array(height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      tmp[y] = result[y * width + x];
    }
    directConvolution(tmp, kernel2, conv);
    for (let y = 0; y < height; y++) {
      result[y * width + x] = conv[offset + y];
    }
  }
  return result;
}
var matrix$2 = {};
const toString$1 = Object.prototype.toString;
function isAnyArray$1(value) {
  const tag = toString$1.call(value);
  return tag.endsWith("Array]") && !tag.includes("Big");
}
const libEsm = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  isAnyArray: isAnyArray$1
}, Symbol.toStringTag, { value: "Module" }));
const require$$0$2 = /* @__PURE__ */ getAugmentedNamespace(libEsm);
function max$1(input) {
  var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  if (!isAnyArray$1(input)) {
    throw new TypeError("input must be an array");
  }
  if (input.length === 0) {
    throw new TypeError("input must not be empty");
  }
  var _options$fromIndex = options.fromIndex, fromIndex = _options$fromIndex === void 0 ? 0 : _options$fromIndex, _options$toIndex = options.toIndex, toIndex = _options$toIndex === void 0 ? input.length : _options$toIndex;
  if (fromIndex < 0 || fromIndex >= input.length || !Number.isInteger(fromIndex)) {
    throw new Error("fromIndex must be a positive integer smaller than length");
  }
  if (toIndex <= fromIndex || toIndex > input.length || !Number.isInteger(toIndex)) {
    throw new Error("toIndex must be an integer greater than fromIndex and at most equal to length");
  }
  var maxValue = input[fromIndex];
  for (var i2 = fromIndex + 1; i2 < toIndex; i2++) {
    if (input[i2] > maxValue) maxValue = input[i2];
  }
  return maxValue;
}
function min$1(input) {
  var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  if (!isAnyArray$1(input)) {
    throw new TypeError("input must be an array");
  }
  if (input.length === 0) {
    throw new TypeError("input must not be empty");
  }
  var _options$fromIndex = options.fromIndex, fromIndex = _options$fromIndex === void 0 ? 0 : _options$fromIndex, _options$toIndex = options.toIndex, toIndex = _options$toIndex === void 0 ? input.length : _options$toIndex;
  if (fromIndex < 0 || fromIndex >= input.length || !Number.isInteger(fromIndex)) {
    throw new Error("fromIndex must be a positive integer smaller than length");
  }
  if (toIndex <= fromIndex || toIndex > input.length || !Number.isInteger(toIndex)) {
    throw new Error("toIndex must be an integer greater than fromIndex and at most equal to length");
  }
  var minValue = input[fromIndex];
  for (var i2 = fromIndex + 1; i2 < toIndex; i2++) {
    if (input[i2] < minValue) minValue = input[i2];
  }
  return minValue;
}
function rescale$1(input) {
  var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  if (!isAnyArray$1(input)) {
    throw new TypeError("input must be an array");
  } else if (input.length === 0) {
    throw new TypeError("input must not be empty");
  }
  var output;
  if (options.output !== void 0) {
    if (!isAnyArray$1(options.output)) {
      throw new TypeError("output option must be an array if specified");
    }
    output = options.output;
  } else {
    output = new Array(input.length);
  }
  var currentMin = min$1(input);
  var currentMax = max$1(input);
  if (currentMin === currentMax) {
    throw new RangeError("minimum and maximum input values are equal. Cannot rescale a constant array");
  }
  var _options$min = options.min, minValue = _options$min === void 0 ? options.autoMinMax ? currentMin : 0 : _options$min, _options$max = options.max, maxValue = _options$max === void 0 ? options.autoMinMax ? currentMax : 1 : _options$max;
  if (minValue >= maxValue) {
    throw new RangeError("min option must be smaller than max option");
  }
  var factor = (maxValue - minValue) / (currentMax - currentMin);
  for (var i2 = 0; i2 < input.length; i2++) {
    output[i2] = (input[i2] - currentMin) * factor + minValue;
  }
  return output;
}
const libEs6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: rescale$1
}, Symbol.toStringTag, { value: "Module" }));
const require$$1 = /* @__PURE__ */ getAugmentedNamespace(libEs6);
Object.defineProperty(matrix$2, "__esModule", { value: true });
var isAnyArray = require$$0$2;
var rescale = require$$1;
const indent = " ".repeat(2);
const indentData = " ".repeat(4);
function inspectMatrix() {
  return inspectMatrixWithOptions(this);
}
function inspectMatrixWithOptions(matrix2, options = {}) {
  const {
    maxRows = 15,
    maxColumns = 10,
    maxNumSize = 8,
    padMinus = "auto"
  } = options;
  return `${matrix2.constructor.name} {
${indent}[
${indentData}${inspectData(matrix2, maxRows, maxColumns, maxNumSize, padMinus)}
${indent}]
${indent}rows: ${matrix2.rows}
${indent}columns: ${matrix2.columns}
}`;
}
function inspectData(matrix2, maxRows, maxColumns, maxNumSize, padMinus) {
  const { rows, columns } = matrix2;
  const maxI = Math.min(rows, maxRows);
  const maxJ = Math.min(columns, maxColumns);
  const result = [];
  if (padMinus === "auto") {
    padMinus = false;
    loop: for (let i2 = 0; i2 < maxI; i2++) {
      for (let j = 0; j < maxJ; j++) {
        if (matrix2.get(i2, j) < 0) {
          padMinus = true;
          break loop;
        }
      }
    }
  }
  for (let i2 = 0; i2 < maxI; i2++) {
    let line = [];
    for (let j = 0; j < maxJ; j++) {
      line.push(formatNumber(matrix2.get(i2, j), maxNumSize, padMinus));
    }
    result.push(`${line.join(" ")}`);
  }
  if (maxJ !== columns) {
    result[result.length - 1] += ` ... ${columns - maxColumns} more columns`;
  }
  if (maxI !== rows) {
    result.push(`... ${rows - maxRows} more rows`);
  }
  return result.join(`
${indentData}`);
}
function formatNumber(num, maxNumSize, padMinus) {
  return (num >= 0 && padMinus ? ` ${formatNumber2(num, maxNumSize - 1)}` : formatNumber2(num, maxNumSize)).padEnd(maxNumSize);
}
function formatNumber2(num, len) {
  let str = num.toString();
  if (str.length <= len) return str;
  let fix = num.toFixed(len);
  if (fix.length > len) {
    fix = num.toFixed(Math.max(0, len - (fix.length - len)));
  }
  if (fix.length <= len && !fix.startsWith("0.000") && !fix.startsWith("-0.000")) {
    return fix;
  }
  let exp = num.toExponential(len);
  if (exp.length > len) {
    exp = num.toExponential(Math.max(0, len - (exp.length - len)));
  }
  return exp.slice(0);
}
function installMathOperations(AbstractMatrix3, Matrix2) {
  AbstractMatrix3.prototype.add = function add2(value) {
    if (typeof value === "number") return this.addS(value);
    return this.addM(value);
  };
  AbstractMatrix3.prototype.addS = function addS(value) {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) + value);
      }
    }
    return this;
  };
  AbstractMatrix3.prototype.addM = function addM(matrix2) {
    matrix2 = Matrix2.checkMatrix(matrix2);
    if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
      throw new RangeError("Matrices dimensions must be equal");
    }
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) + matrix2.get(i2, j));
      }
    }
    return this;
  };
  AbstractMatrix3.add = function add2(matrix2, value) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.add(value);
  };
  AbstractMatrix3.prototype.sub = function sub(value) {
    if (typeof value === "number") return this.subS(value);
    return this.subM(value);
  };
  AbstractMatrix3.prototype.subS = function subS(value) {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) - value);
      }
    }
    return this;
  };
  AbstractMatrix3.prototype.subM = function subM(matrix2) {
    matrix2 = Matrix2.checkMatrix(matrix2);
    if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
      throw new RangeError("Matrices dimensions must be equal");
    }
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) - matrix2.get(i2, j));
      }
    }
    return this;
  };
  AbstractMatrix3.sub = function sub(matrix2, value) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.sub(value);
  };
  AbstractMatrix3.prototype.subtract = AbstractMatrix3.prototype.sub;
  AbstractMatrix3.prototype.subtractS = AbstractMatrix3.prototype.subS;
  AbstractMatrix3.prototype.subtractM = AbstractMatrix3.prototype.subM;
  AbstractMatrix3.subtract = AbstractMatrix3.sub;
  AbstractMatrix3.prototype.mul = function mul(value) {
    if (typeof value === "number") return this.mulS(value);
    return this.mulM(value);
  };
  AbstractMatrix3.prototype.mulS = function mulS(value) {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) * value);
      }
    }
    return this;
  };
  AbstractMatrix3.prototype.mulM = function mulM(matrix2) {
    matrix2 = Matrix2.checkMatrix(matrix2);
    if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
      throw new RangeError("Matrices dimensions must be equal");
    }
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) * matrix2.get(i2, j));
      }
    }
    return this;
  };
  AbstractMatrix3.mul = function mul(matrix2, value) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.mul(value);
  };
  AbstractMatrix3.prototype.multiply = AbstractMatrix3.prototype.mul;
  AbstractMatrix3.prototype.multiplyS = AbstractMatrix3.prototype.mulS;
  AbstractMatrix3.prototype.multiplyM = AbstractMatrix3.prototype.mulM;
  AbstractMatrix3.multiply = AbstractMatrix3.mul;
  AbstractMatrix3.prototype.div = function div(value) {
    if (typeof value === "number") return this.divS(value);
    return this.divM(value);
  };
  AbstractMatrix3.prototype.divS = function divS(value) {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) / value);
      }
    }
    return this;
  };
  AbstractMatrix3.prototype.divM = function divM(matrix2) {
    matrix2 = Matrix2.checkMatrix(matrix2);
    if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
      throw new RangeError("Matrices dimensions must be equal");
    }
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) / matrix2.get(i2, j));
      }
    }
    return this;
  };
  AbstractMatrix3.div = function div(matrix2, value) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.div(value);
  };
  AbstractMatrix3.prototype.divide = AbstractMatrix3.prototype.div;
  AbstractMatrix3.prototype.divideS = AbstractMatrix3.prototype.divS;
  AbstractMatrix3.prototype.divideM = AbstractMatrix3.prototype.divM;
  AbstractMatrix3.divide = AbstractMatrix3.div;
  AbstractMatrix3.prototype.mod = function mod(value) {
    if (typeof value === "number") return this.modS(value);
    return this.modM(value);
  };
  AbstractMatrix3.prototype.modS = function modS(value) {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) % value);
      }
    }
    return this;
  };
  AbstractMatrix3.prototype.modM = function modM(matrix2) {
    matrix2 = Matrix2.checkMatrix(matrix2);
    if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
      throw new RangeError("Matrices dimensions must be equal");
    }
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) % matrix2.get(i2, j));
      }
    }
    return this;
  };
  AbstractMatrix3.mod = function mod(matrix2, value) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.mod(value);
  };
  AbstractMatrix3.prototype.modulus = AbstractMatrix3.prototype.mod;
  AbstractMatrix3.prototype.modulusS = AbstractMatrix3.prototype.modS;
  AbstractMatrix3.prototype.modulusM = AbstractMatrix3.prototype.modM;
  AbstractMatrix3.modulus = AbstractMatrix3.mod;
  AbstractMatrix3.prototype.and = function and(value) {
    if (typeof value === "number") return this.andS(value);
    return this.andM(value);
  };
  AbstractMatrix3.prototype.andS = function andS(value) {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) & value);
      }
    }
    return this;
  };
  AbstractMatrix3.prototype.andM = function andM(matrix2) {
    matrix2 = Matrix2.checkMatrix(matrix2);
    if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
      throw new RangeError("Matrices dimensions must be equal");
    }
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) & matrix2.get(i2, j));
      }
    }
    return this;
  };
  AbstractMatrix3.and = function and(matrix2, value) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.and(value);
  };
  AbstractMatrix3.prototype.or = function or(value) {
    if (typeof value === "number") return this.orS(value);
    return this.orM(value);
  };
  AbstractMatrix3.prototype.orS = function orS(value) {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) | value);
      }
    }
    return this;
  };
  AbstractMatrix3.prototype.orM = function orM(matrix2) {
    matrix2 = Matrix2.checkMatrix(matrix2);
    if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
      throw new RangeError("Matrices dimensions must be equal");
    }
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) | matrix2.get(i2, j));
      }
    }
    return this;
  };
  AbstractMatrix3.or = function or(matrix2, value) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.or(value);
  };
  AbstractMatrix3.prototype.xor = function xor(value) {
    if (typeof value === "number") return this.xorS(value);
    return this.xorM(value);
  };
  AbstractMatrix3.prototype.xorS = function xorS(value) {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) ^ value);
      }
    }
    return this;
  };
  AbstractMatrix3.prototype.xorM = function xorM(matrix2) {
    matrix2 = Matrix2.checkMatrix(matrix2);
    if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
      throw new RangeError("Matrices dimensions must be equal");
    }
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) ^ matrix2.get(i2, j));
      }
    }
    return this;
  };
  AbstractMatrix3.xor = function xor(matrix2, value) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.xor(value);
  };
  AbstractMatrix3.prototype.leftShift = function leftShift(value) {
    if (typeof value === "number") return this.leftShiftS(value);
    return this.leftShiftM(value);
  };
  AbstractMatrix3.prototype.leftShiftS = function leftShiftS(value) {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) << value);
      }
    }
    return this;
  };
  AbstractMatrix3.prototype.leftShiftM = function leftShiftM(matrix2) {
    matrix2 = Matrix2.checkMatrix(matrix2);
    if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
      throw new RangeError("Matrices dimensions must be equal");
    }
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) << matrix2.get(i2, j));
      }
    }
    return this;
  };
  AbstractMatrix3.leftShift = function leftShift(matrix2, value) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.leftShift(value);
  };
  AbstractMatrix3.prototype.signPropagatingRightShift = function signPropagatingRightShift(value) {
    if (typeof value === "number") return this.signPropagatingRightShiftS(value);
    return this.signPropagatingRightShiftM(value);
  };
  AbstractMatrix3.prototype.signPropagatingRightShiftS = function signPropagatingRightShiftS(value) {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) >> value);
      }
    }
    return this;
  };
  AbstractMatrix3.prototype.signPropagatingRightShiftM = function signPropagatingRightShiftM(matrix2) {
    matrix2 = Matrix2.checkMatrix(matrix2);
    if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
      throw new RangeError("Matrices dimensions must be equal");
    }
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) >> matrix2.get(i2, j));
      }
    }
    return this;
  };
  AbstractMatrix3.signPropagatingRightShift = function signPropagatingRightShift(matrix2, value) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.signPropagatingRightShift(value);
  };
  AbstractMatrix3.prototype.rightShift = function rightShift(value) {
    if (typeof value === "number") return this.rightShiftS(value);
    return this.rightShiftM(value);
  };
  AbstractMatrix3.prototype.rightShiftS = function rightShiftS(value) {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) >>> value);
      }
    }
    return this;
  };
  AbstractMatrix3.prototype.rightShiftM = function rightShiftM(matrix2) {
    matrix2 = Matrix2.checkMatrix(matrix2);
    if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
      throw new RangeError("Matrices dimensions must be equal");
    }
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) >>> matrix2.get(i2, j));
      }
    }
    return this;
  };
  AbstractMatrix3.rightShift = function rightShift(matrix2, value) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.rightShift(value);
  };
  AbstractMatrix3.prototype.zeroFillRightShift = AbstractMatrix3.prototype.rightShift;
  AbstractMatrix3.prototype.zeroFillRightShiftS = AbstractMatrix3.prototype.rightShiftS;
  AbstractMatrix3.prototype.zeroFillRightShiftM = AbstractMatrix3.prototype.rightShiftM;
  AbstractMatrix3.zeroFillRightShift = AbstractMatrix3.rightShift;
  AbstractMatrix3.prototype.not = function not() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, ~this.get(i2, j));
      }
    }
    return this;
  };
  AbstractMatrix3.not = function not(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.not();
  };
  AbstractMatrix3.prototype.abs = function abs2() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.abs(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.abs = function abs2(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.abs();
  };
  AbstractMatrix3.prototype.acos = function acos() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.acos(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.acos = function acos(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.acos();
  };
  AbstractMatrix3.prototype.acosh = function acosh() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.acosh(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.acosh = function acosh(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.acosh();
  };
  AbstractMatrix3.prototype.asin = function asin() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.asin(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.asin = function asin(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.asin();
  };
  AbstractMatrix3.prototype.asinh = function asinh() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.asinh(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.asinh = function asinh(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.asinh();
  };
  AbstractMatrix3.prototype.atan = function atan() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.atan(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.atan = function atan(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.atan();
  };
  AbstractMatrix3.prototype.atanh = function atanh() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.atanh(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.atanh = function atanh(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.atanh();
  };
  AbstractMatrix3.prototype.cbrt = function cbrt() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.cbrt(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.cbrt = function cbrt(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.cbrt();
  };
  AbstractMatrix3.prototype.ceil = function ceil() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.ceil(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.ceil = function ceil(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.ceil();
  };
  AbstractMatrix3.prototype.clz32 = function clz32() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.clz32(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.clz32 = function clz32(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.clz32();
  };
  AbstractMatrix3.prototype.cos = function cos() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.cos(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.cos = function cos(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.cos();
  };
  AbstractMatrix3.prototype.cosh = function cosh() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.cosh(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.cosh = function cosh(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.cosh();
  };
  AbstractMatrix3.prototype.exp = function exp() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.exp(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.exp = function exp(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.exp();
  };
  AbstractMatrix3.prototype.expm1 = function expm1() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.expm1(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.expm1 = function expm1(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.expm1();
  };
  AbstractMatrix3.prototype.floor = function floor() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.floor(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.floor = function floor(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.floor();
  };
  AbstractMatrix3.prototype.fround = function fround() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.fround(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.fround = function fround(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.fround();
  };
  AbstractMatrix3.prototype.log = function log() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.log(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.log = function log(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.log();
  };
  AbstractMatrix3.prototype.log1p = function log1p() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.log1p(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.log1p = function log1p(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.log1p();
  };
  AbstractMatrix3.prototype.log10 = function log10() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.log10(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.log10 = function log10(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.log10();
  };
  AbstractMatrix3.prototype.log2 = function log2() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.log2(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.log2 = function log2(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.log2();
  };
  AbstractMatrix3.prototype.round = function round2() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.round(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.round = function round2(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.round();
  };
  AbstractMatrix3.prototype.sign = function sign() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.sign(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.sign = function sign(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.sign();
  };
  AbstractMatrix3.prototype.sin = function sin() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.sin(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.sin = function sin(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.sin();
  };
  AbstractMatrix3.prototype.sinh = function sinh() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.sinh(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.sinh = function sinh(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.sinh();
  };
  AbstractMatrix3.prototype.sqrt = function sqrt() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.sqrt(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.sqrt = function sqrt(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.sqrt();
  };
  AbstractMatrix3.prototype.tan = function tan() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.tan(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.tan = function tan(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.tan();
  };
  AbstractMatrix3.prototype.tanh = function tanh() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.tanh(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.tanh = function tanh(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.tanh();
  };
  AbstractMatrix3.prototype.trunc = function trunc() {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, Math.trunc(this.get(i2, j)));
      }
    }
    return this;
  };
  AbstractMatrix3.trunc = function trunc(matrix2) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.trunc();
  };
  AbstractMatrix3.pow = function pow(matrix2, arg0) {
    const newMatrix = new Matrix2(matrix2);
    return newMatrix.pow(arg0);
  };
  AbstractMatrix3.prototype.pow = function pow(value) {
    if (typeof value === "number") return this.powS(value);
    return this.powM(value);
  };
  AbstractMatrix3.prototype.powS = function powS(value) {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) ** value);
      }
    }
    return this;
  };
  AbstractMatrix3.prototype.powM = function powM(matrix2) {
    matrix2 = Matrix2.checkMatrix(matrix2);
    if (this.rows !== matrix2.rows || this.columns !== matrix2.columns) {
      throw new RangeError("Matrices dimensions must be equal");
    }
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) ** matrix2.get(i2, j));
      }
    }
    return this;
  };
}
function checkRowIndex(matrix2, index, outer) {
  let max2 = outer ? matrix2.rows : matrix2.rows - 1;
  if (index < 0 || index > max2) {
    throw new RangeError("Row index out of range");
  }
}
function checkColumnIndex(matrix2, index, outer) {
  let max2 = outer ? matrix2.columns : matrix2.columns - 1;
  if (index < 0 || index > max2) {
    throw new RangeError("Column index out of range");
  }
}
function checkRowVector(matrix2, vector) {
  if (vector.to1DArray) {
    vector = vector.to1DArray();
  }
  if (vector.length !== matrix2.columns) {
    throw new RangeError(
      "vector size must be the same as the number of columns"
    );
  }
  return vector;
}
function checkColumnVector(matrix2, vector) {
  if (vector.to1DArray) {
    vector = vector.to1DArray();
  }
  if (vector.length !== matrix2.rows) {
    throw new RangeError("vector size must be the same as the number of rows");
  }
  return vector;
}
function checkRowIndices(matrix2, rowIndices) {
  if (!isAnyArray.isAnyArray(rowIndices)) {
    throw new TypeError("row indices must be an array");
  }
  for (let i2 = 0; i2 < rowIndices.length; i2++) {
    if (rowIndices[i2] < 0 || rowIndices[i2] >= matrix2.rows) {
      throw new RangeError("row indices are out of range");
    }
  }
}
function checkColumnIndices(matrix2, columnIndices) {
  if (!isAnyArray.isAnyArray(columnIndices)) {
    throw new TypeError("column indices must be an array");
  }
  for (let i2 = 0; i2 < columnIndices.length; i2++) {
    if (columnIndices[i2] < 0 || columnIndices[i2] >= matrix2.columns) {
      throw new RangeError("column indices are out of range");
    }
  }
}
function checkRange(matrix2, startRow, endRow, startColumn, endColumn) {
  if (arguments.length !== 5) {
    throw new RangeError("expected 4 arguments");
  }
  checkNumber("startRow", startRow);
  checkNumber("endRow", endRow);
  checkNumber("startColumn", startColumn);
  checkNumber("endColumn", endColumn);
  if (startRow > endRow || startColumn > endColumn || startRow < 0 || startRow >= matrix2.rows || endRow < 0 || endRow >= matrix2.rows || startColumn < 0 || startColumn >= matrix2.columns || endColumn < 0 || endColumn >= matrix2.columns) {
    throw new RangeError("Submatrix indices are out of range");
  }
}
function newArray$2(length, value = 0) {
  let array = [];
  for (let i2 = 0; i2 < length; i2++) {
    array.push(value);
  }
  return array;
}
function checkNumber(name2, value) {
  if (typeof value !== "number") {
    throw new TypeError(`${name2} must be a number`);
  }
}
function checkNonEmpty(matrix2) {
  if (matrix2.isEmpty()) {
    throw new Error("Empty matrix has no elements to index");
  }
}
function sumByRow(matrix2) {
  let sum2 = newArray$2(matrix2.rows);
  for (let i2 = 0; i2 < matrix2.rows; ++i2) {
    for (let j = 0; j < matrix2.columns; ++j) {
      sum2[i2] += matrix2.get(i2, j);
    }
  }
  return sum2;
}
function sumByColumn(matrix2) {
  let sum2 = newArray$2(matrix2.columns);
  for (let i2 = 0; i2 < matrix2.rows; ++i2) {
    for (let j = 0; j < matrix2.columns; ++j) {
      sum2[j] += matrix2.get(i2, j);
    }
  }
  return sum2;
}
function sumAll(matrix2) {
  let v = 0;
  for (let i2 = 0; i2 < matrix2.rows; i2++) {
    for (let j = 0; j < matrix2.columns; j++) {
      v += matrix2.get(i2, j);
    }
  }
  return v;
}
function productByRow(matrix2) {
  let sum2 = newArray$2(matrix2.rows, 1);
  for (let i2 = 0; i2 < matrix2.rows; ++i2) {
    for (let j = 0; j < matrix2.columns; ++j) {
      sum2[i2] *= matrix2.get(i2, j);
    }
  }
  return sum2;
}
function productByColumn(matrix2) {
  let sum2 = newArray$2(matrix2.columns, 1);
  for (let i2 = 0; i2 < matrix2.rows; ++i2) {
    for (let j = 0; j < matrix2.columns; ++j) {
      sum2[j] *= matrix2.get(i2, j);
    }
  }
  return sum2;
}
function productAll(matrix2) {
  let v = 1;
  for (let i2 = 0; i2 < matrix2.rows; i2++) {
    for (let j = 0; j < matrix2.columns; j++) {
      v *= matrix2.get(i2, j);
    }
  }
  return v;
}
function varianceByRow(matrix2, unbiased, mean2) {
  const rows = matrix2.rows;
  const cols = matrix2.columns;
  const variance = [];
  for (let i2 = 0; i2 < rows; i2++) {
    let sum1 = 0;
    let sum2 = 0;
    let x = 0;
    for (let j = 0; j < cols; j++) {
      x = matrix2.get(i2, j) - mean2[i2];
      sum1 += x;
      sum2 += x * x;
    }
    if (unbiased) {
      variance.push((sum2 - sum1 * sum1 / cols) / (cols - 1));
    } else {
      variance.push((sum2 - sum1 * sum1 / cols) / cols);
    }
  }
  return variance;
}
function varianceByColumn(matrix2, unbiased, mean2) {
  const rows = matrix2.rows;
  const cols = matrix2.columns;
  const variance = [];
  for (let j = 0; j < cols; j++) {
    let sum1 = 0;
    let sum2 = 0;
    let x = 0;
    for (let i2 = 0; i2 < rows; i2++) {
      x = matrix2.get(i2, j) - mean2[j];
      sum1 += x;
      sum2 += x * x;
    }
    if (unbiased) {
      variance.push((sum2 - sum1 * sum1 / rows) / (rows - 1));
    } else {
      variance.push((sum2 - sum1 * sum1 / rows) / rows);
    }
  }
  return variance;
}
function varianceAll(matrix2, unbiased, mean2) {
  const rows = matrix2.rows;
  const cols = matrix2.columns;
  const size = rows * cols;
  let sum1 = 0;
  let sum2 = 0;
  let x = 0;
  for (let i2 = 0; i2 < rows; i2++) {
    for (let j = 0; j < cols; j++) {
      x = matrix2.get(i2, j) - mean2;
      sum1 += x;
      sum2 += x * x;
    }
  }
  if (unbiased) {
    return (sum2 - sum1 * sum1 / size) / (size - 1);
  } else {
    return (sum2 - sum1 * sum1 / size) / size;
  }
}
function centerByRow(matrix2, mean2) {
  for (let i2 = 0; i2 < matrix2.rows; i2++) {
    for (let j = 0; j < matrix2.columns; j++) {
      matrix2.set(i2, j, matrix2.get(i2, j) - mean2[i2]);
    }
  }
}
function centerByColumn(matrix2, mean2) {
  for (let i2 = 0; i2 < matrix2.rows; i2++) {
    for (let j = 0; j < matrix2.columns; j++) {
      matrix2.set(i2, j, matrix2.get(i2, j) - mean2[j]);
    }
  }
}
function centerAll(matrix2, mean2) {
  for (let i2 = 0; i2 < matrix2.rows; i2++) {
    for (let j = 0; j < matrix2.columns; j++) {
      matrix2.set(i2, j, matrix2.get(i2, j) - mean2);
    }
  }
}
function getScaleByRow(matrix2) {
  const scale = [];
  for (let i2 = 0; i2 < matrix2.rows; i2++) {
    let sum2 = 0;
    for (let j = 0; j < matrix2.columns; j++) {
      sum2 += matrix2.get(i2, j) ** 2 / (matrix2.columns - 1);
    }
    scale.push(Math.sqrt(sum2));
  }
  return scale;
}
function scaleByRow(matrix2, scale) {
  for (let i2 = 0; i2 < matrix2.rows; i2++) {
    for (let j = 0; j < matrix2.columns; j++) {
      matrix2.set(i2, j, matrix2.get(i2, j) / scale[i2]);
    }
  }
}
function getScaleByColumn(matrix2) {
  const scale = [];
  for (let j = 0; j < matrix2.columns; j++) {
    let sum2 = 0;
    for (let i2 = 0; i2 < matrix2.rows; i2++) {
      sum2 += matrix2.get(i2, j) ** 2 / (matrix2.rows - 1);
    }
    scale.push(Math.sqrt(sum2));
  }
  return scale;
}
function scaleByColumn(matrix2, scale) {
  for (let i2 = 0; i2 < matrix2.rows; i2++) {
    for (let j = 0; j < matrix2.columns; j++) {
      matrix2.set(i2, j, matrix2.get(i2, j) / scale[j]);
    }
  }
}
function getScaleAll(matrix2) {
  const divider = matrix2.size - 1;
  let sum2 = 0;
  for (let j = 0; j < matrix2.columns; j++) {
    for (let i2 = 0; i2 < matrix2.rows; i2++) {
      sum2 += matrix2.get(i2, j) ** 2 / divider;
    }
  }
  return Math.sqrt(sum2);
}
function scaleAll(matrix2, scale) {
  for (let i2 = 0; i2 < matrix2.rows; i2++) {
    for (let j = 0; j < matrix2.columns; j++) {
      matrix2.set(i2, j, matrix2.get(i2, j) / scale);
    }
  }
}
let AbstractMatrix$1 = class AbstractMatrix2 {
  static from1DArray(newRows, newColumns, newData) {
    let length = newRows * newColumns;
    if (length !== newData.length) {
      throw new RangeError("data length does not match given dimensions");
    }
    let newMatrix = new Matrix$3(newRows, newColumns);
    for (let row = 0; row < newRows; row++) {
      for (let column = 0; column < newColumns; column++) {
        newMatrix.set(row, column, newData[row * newColumns + column]);
      }
    }
    return newMatrix;
  }
  static rowVector(newData) {
    let vector = new Matrix$3(1, newData.length);
    for (let i2 = 0; i2 < newData.length; i2++) {
      vector.set(0, i2, newData[i2]);
    }
    return vector;
  }
  static columnVector(newData) {
    let vector = new Matrix$3(newData.length, 1);
    for (let i2 = 0; i2 < newData.length; i2++) {
      vector.set(i2, 0, newData[i2]);
    }
    return vector;
  }
  static zeros(rows, columns) {
    return new Matrix$3(rows, columns);
  }
  static ones(rows, columns) {
    return new Matrix$3(rows, columns).fill(1);
  }
  static rand(rows, columns, options = {}) {
    if (typeof options !== "object") {
      throw new TypeError("options must be an object");
    }
    const { random = Math.random } = options;
    let matrix2 = new Matrix$3(rows, columns);
    for (let i2 = 0; i2 < rows; i2++) {
      for (let j = 0; j < columns; j++) {
        matrix2.set(i2, j, random());
      }
    }
    return matrix2;
  }
  static randInt(rows, columns, options = {}) {
    if (typeof options !== "object") {
      throw new TypeError("options must be an object");
    }
    const { min: min2 = 0, max: max2 = 1e3, random = Math.random } = options;
    if (!Number.isInteger(min2)) throw new TypeError("min must be an integer");
    if (!Number.isInteger(max2)) throw new TypeError("max must be an integer");
    if (min2 >= max2) throw new RangeError("min must be smaller than max");
    let interval = max2 - min2;
    let matrix2 = new Matrix$3(rows, columns);
    for (let i2 = 0; i2 < rows; i2++) {
      for (let j = 0; j < columns; j++) {
        let value = min2 + Math.round(random() * interval);
        matrix2.set(i2, j, value);
      }
    }
    return matrix2;
  }
  static eye(rows, columns, value) {
    if (columns === void 0) columns = rows;
    if (value === void 0) value = 1;
    let min2 = Math.min(rows, columns);
    let matrix2 = this.zeros(rows, columns);
    for (let i2 = 0; i2 < min2; i2++) {
      matrix2.set(i2, i2, value);
    }
    return matrix2;
  }
  static diag(data, rows, columns) {
    let l = data.length;
    if (rows === void 0) rows = l;
    if (columns === void 0) columns = rows;
    let min2 = Math.min(l, rows, columns);
    let matrix2 = this.zeros(rows, columns);
    for (let i2 = 0; i2 < min2; i2++) {
      matrix2.set(i2, i2, data[i2]);
    }
    return matrix2;
  }
  static min(matrix1, matrix2) {
    matrix1 = this.checkMatrix(matrix1);
    matrix2 = this.checkMatrix(matrix2);
    let rows = matrix1.rows;
    let columns = matrix1.columns;
    let result = new Matrix$3(rows, columns);
    for (let i2 = 0; i2 < rows; i2++) {
      for (let j = 0; j < columns; j++) {
        result.set(i2, j, Math.min(matrix1.get(i2, j), matrix2.get(i2, j)));
      }
    }
    return result;
  }
  static max(matrix1, matrix2) {
    matrix1 = this.checkMatrix(matrix1);
    matrix2 = this.checkMatrix(matrix2);
    let rows = matrix1.rows;
    let columns = matrix1.columns;
    let result = new this(rows, columns);
    for (let i2 = 0; i2 < rows; i2++) {
      for (let j = 0; j < columns; j++) {
        result.set(i2, j, Math.max(matrix1.get(i2, j), matrix2.get(i2, j)));
      }
    }
    return result;
  }
  static checkMatrix(value) {
    return AbstractMatrix2.isMatrix(value) ? value : new Matrix$3(value);
  }
  static isMatrix(value) {
    return value != null && value.klass === "Matrix";
  }
  get size() {
    return this.rows * this.columns;
  }
  apply(callback) {
    if (typeof callback !== "function") {
      throw new TypeError("callback must be a function");
    }
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        callback.call(this, i2, j);
      }
    }
    return this;
  }
  to1DArray() {
    let array = [];
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        array.push(this.get(i2, j));
      }
    }
    return array;
  }
  to2DArray() {
    let copy = [];
    for (let i2 = 0; i2 < this.rows; i2++) {
      copy.push([]);
      for (let j = 0; j < this.columns; j++) {
        copy[i2].push(this.get(i2, j));
      }
    }
    return copy;
  }
  toJSON() {
    return this.to2DArray();
  }
  isRowVector() {
    return this.rows === 1;
  }
  isColumnVector() {
    return this.columns === 1;
  }
  isVector() {
    return this.rows === 1 || this.columns === 1;
  }
  isSquare() {
    return this.rows === this.columns;
  }
  isEmpty() {
    return this.rows === 0 || this.columns === 0;
  }
  isSymmetric() {
    if (this.isSquare()) {
      for (let i2 = 0; i2 < this.rows; i2++) {
        for (let j = 0; j <= i2; j++) {
          if (this.get(i2, j) !== this.get(j, i2)) {
            return false;
          }
        }
      }
      return true;
    }
    return false;
  }
  isDistance() {
    if (!this.isSymmetric()) return false;
    for (let i2 = 0; i2 < this.rows; i2++) {
      if (this.get(i2, i2) !== 0) return false;
    }
    return true;
  }
  isEchelonForm() {
    let i2 = 0;
    let j = 0;
    let previousColumn = -1;
    let isEchelonForm = true;
    let checked = false;
    while (i2 < this.rows && isEchelonForm) {
      j = 0;
      checked = false;
      while (j < this.columns && checked === false) {
        if (this.get(i2, j) === 0) {
          j++;
        } else if (this.get(i2, j) === 1 && j > previousColumn) {
          checked = true;
          previousColumn = j;
        } else {
          isEchelonForm = false;
          checked = true;
        }
      }
      i2++;
    }
    return isEchelonForm;
  }
  isReducedEchelonForm() {
    let i2 = 0;
    let j = 0;
    let previousColumn = -1;
    let isReducedEchelonForm = true;
    let checked = false;
    while (i2 < this.rows && isReducedEchelonForm) {
      j = 0;
      checked = false;
      while (j < this.columns && checked === false) {
        if (this.get(i2, j) === 0) {
          j++;
        } else if (this.get(i2, j) === 1 && j > previousColumn) {
          checked = true;
          previousColumn = j;
        } else {
          isReducedEchelonForm = false;
          checked = true;
        }
      }
      for (let k = j + 1; k < this.rows; k++) {
        if (this.get(i2, k) !== 0) {
          isReducedEchelonForm = false;
        }
      }
      i2++;
    }
    return isReducedEchelonForm;
  }
  echelonForm() {
    let result = this.clone();
    let h = 0;
    let k = 0;
    while (h < result.rows && k < result.columns) {
      let iMax = h;
      for (let i2 = h; i2 < result.rows; i2++) {
        if (result.get(i2, k) > result.get(iMax, k)) {
          iMax = i2;
        }
      }
      if (result.get(iMax, k) === 0) {
        k++;
      } else {
        result.swapRows(h, iMax);
        let tmp = result.get(h, k);
        for (let j = k; j < result.columns; j++) {
          result.set(h, j, result.get(h, j) / tmp);
        }
        for (let i2 = h + 1; i2 < result.rows; i2++) {
          let factor = result.get(i2, k) / result.get(h, k);
          result.set(i2, k, 0);
          for (let j = k + 1; j < result.columns; j++) {
            result.set(i2, j, result.get(i2, j) - result.get(h, j) * factor);
          }
        }
        h++;
        k++;
      }
    }
    return result;
  }
  reducedEchelonForm() {
    let result = this.echelonForm();
    let m = result.columns;
    let n = result.rows;
    let h = n - 1;
    while (h >= 0) {
      if (result.maxRow(h) === 0) {
        h--;
      } else {
        let p = 0;
        let pivot = false;
        while (p < n && pivot === false) {
          if (result.get(h, p) === 1) {
            pivot = true;
          } else {
            p++;
          }
        }
        for (let i2 = 0; i2 < h; i2++) {
          let factor = result.get(i2, p);
          for (let j = p; j < m; j++) {
            let tmp = result.get(i2, j) - factor * result.get(h, j);
            result.set(i2, j, tmp);
          }
        }
        h--;
      }
    }
    return result;
  }
  set() {
    throw new Error("set method is unimplemented");
  }
  get() {
    throw new Error("get method is unimplemented");
  }
  repeat(options = {}) {
    if (typeof options !== "object") {
      throw new TypeError("options must be an object");
    }
    const { rows = 1, columns = 1 } = options;
    if (!Number.isInteger(rows) || rows <= 0) {
      throw new TypeError("rows must be a positive integer");
    }
    if (!Number.isInteger(columns) || columns <= 0) {
      throw new TypeError("columns must be a positive integer");
    }
    let matrix2 = new Matrix$3(this.rows * rows, this.columns * columns);
    for (let i2 = 0; i2 < rows; i2++) {
      for (let j = 0; j < columns; j++) {
        matrix2.setSubMatrix(this, this.rows * i2, this.columns * j);
      }
    }
    return matrix2;
  }
  fill(value) {
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, value);
      }
    }
    return this;
  }
  neg() {
    return this.mulS(-1);
  }
  getRow(index) {
    checkRowIndex(this, index);
    let row = [];
    for (let i2 = 0; i2 < this.columns; i2++) {
      row.push(this.get(index, i2));
    }
    return row;
  }
  getRowVector(index) {
    return Matrix$3.rowVector(this.getRow(index));
  }
  setRow(index, array) {
    checkRowIndex(this, index);
    array = checkRowVector(this, array);
    for (let i2 = 0; i2 < this.columns; i2++) {
      this.set(index, i2, array[i2]);
    }
    return this;
  }
  swapRows(row1, row2) {
    checkRowIndex(this, row1);
    checkRowIndex(this, row2);
    for (let i2 = 0; i2 < this.columns; i2++) {
      let temp = this.get(row1, i2);
      this.set(row1, i2, this.get(row2, i2));
      this.set(row2, i2, temp);
    }
    return this;
  }
  getColumn(index) {
    checkColumnIndex(this, index);
    let column = [];
    for (let i2 = 0; i2 < this.rows; i2++) {
      column.push(this.get(i2, index));
    }
    return column;
  }
  getColumnVector(index) {
    return Matrix$3.columnVector(this.getColumn(index));
  }
  setColumn(index, array) {
    checkColumnIndex(this, index);
    array = checkColumnVector(this, array);
    for (let i2 = 0; i2 < this.rows; i2++) {
      this.set(i2, index, array[i2]);
    }
    return this;
  }
  swapColumns(column1, column2) {
    checkColumnIndex(this, column1);
    checkColumnIndex(this, column2);
    for (let i2 = 0; i2 < this.rows; i2++) {
      let temp = this.get(i2, column1);
      this.set(i2, column1, this.get(i2, column2));
      this.set(i2, column2, temp);
    }
    return this;
  }
  addRowVector(vector) {
    vector = checkRowVector(this, vector);
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) + vector[j]);
      }
    }
    return this;
  }
  subRowVector(vector) {
    vector = checkRowVector(this, vector);
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) - vector[j]);
      }
    }
    return this;
  }
  mulRowVector(vector) {
    vector = checkRowVector(this, vector);
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) * vector[j]);
      }
    }
    return this;
  }
  divRowVector(vector) {
    vector = checkRowVector(this, vector);
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) / vector[j]);
      }
    }
    return this;
  }
  addColumnVector(vector) {
    vector = checkColumnVector(this, vector);
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) + vector[i2]);
      }
    }
    return this;
  }
  subColumnVector(vector) {
    vector = checkColumnVector(this, vector);
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) - vector[i2]);
      }
    }
    return this;
  }
  mulColumnVector(vector) {
    vector = checkColumnVector(this, vector);
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) * vector[i2]);
      }
    }
    return this;
  }
  divColumnVector(vector) {
    vector = checkColumnVector(this, vector);
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        this.set(i2, j, this.get(i2, j) / vector[i2]);
      }
    }
    return this;
  }
  mulRow(index, value) {
    checkRowIndex(this, index);
    for (let i2 = 0; i2 < this.columns; i2++) {
      this.set(index, i2, this.get(index, i2) * value);
    }
    return this;
  }
  mulColumn(index, value) {
    checkColumnIndex(this, index);
    for (let i2 = 0; i2 < this.rows; i2++) {
      this.set(i2, index, this.get(i2, index) * value);
    }
    return this;
  }
  max(by) {
    if (this.isEmpty()) {
      return NaN;
    }
    switch (by) {
      case "row": {
        const max2 = new Array(this.rows).fill(Number.NEGATIVE_INFINITY);
        for (let row = 0; row < this.rows; row++) {
          for (let column = 0; column < this.columns; column++) {
            if (this.get(row, column) > max2[row]) {
              max2[row] = this.get(row, column);
            }
          }
        }
        return max2;
      }
      case "column": {
        const max2 = new Array(this.columns).fill(Number.NEGATIVE_INFINITY);
        for (let row = 0; row < this.rows; row++) {
          for (let column = 0; column < this.columns; column++) {
            if (this.get(row, column) > max2[column]) {
              max2[column] = this.get(row, column);
            }
          }
        }
        return max2;
      }
      case void 0: {
        let max2 = this.get(0, 0);
        for (let row = 0; row < this.rows; row++) {
          for (let column = 0; column < this.columns; column++) {
            if (this.get(row, column) > max2) {
              max2 = this.get(row, column);
            }
          }
        }
        return max2;
      }
      default:
        throw new Error(`invalid option: ${by}`);
    }
  }
  maxIndex() {
    checkNonEmpty(this);
    let v = this.get(0, 0);
    let idx = [0, 0];
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        if (this.get(i2, j) > v) {
          v = this.get(i2, j);
          idx[0] = i2;
          idx[1] = j;
        }
      }
    }
    return idx;
  }
  min(by) {
    if (this.isEmpty()) {
      return NaN;
    }
    switch (by) {
      case "row": {
        const min2 = new Array(this.rows).fill(Number.POSITIVE_INFINITY);
        for (let row = 0; row < this.rows; row++) {
          for (let column = 0; column < this.columns; column++) {
            if (this.get(row, column) < min2[row]) {
              min2[row] = this.get(row, column);
            }
          }
        }
        return min2;
      }
      case "column": {
        const min2 = new Array(this.columns).fill(Number.POSITIVE_INFINITY);
        for (let row = 0; row < this.rows; row++) {
          for (let column = 0; column < this.columns; column++) {
            if (this.get(row, column) < min2[column]) {
              min2[column] = this.get(row, column);
            }
          }
        }
        return min2;
      }
      case void 0: {
        let min2 = this.get(0, 0);
        for (let row = 0; row < this.rows; row++) {
          for (let column = 0; column < this.columns; column++) {
            if (this.get(row, column) < min2) {
              min2 = this.get(row, column);
            }
          }
        }
        return min2;
      }
      default:
        throw new Error(`invalid option: ${by}`);
    }
  }
  minIndex() {
    checkNonEmpty(this);
    let v = this.get(0, 0);
    let idx = [0, 0];
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        if (this.get(i2, j) < v) {
          v = this.get(i2, j);
          idx[0] = i2;
          idx[1] = j;
        }
      }
    }
    return idx;
  }
  maxRow(row) {
    checkRowIndex(this, row);
    if (this.isEmpty()) {
      return NaN;
    }
    let v = this.get(row, 0);
    for (let i2 = 1; i2 < this.columns; i2++) {
      if (this.get(row, i2) > v) {
        v = this.get(row, i2);
      }
    }
    return v;
  }
  maxRowIndex(row) {
    checkRowIndex(this, row);
    checkNonEmpty(this);
    let v = this.get(row, 0);
    let idx = [row, 0];
    for (let i2 = 1; i2 < this.columns; i2++) {
      if (this.get(row, i2) > v) {
        v = this.get(row, i2);
        idx[1] = i2;
      }
    }
    return idx;
  }
  minRow(row) {
    checkRowIndex(this, row);
    if (this.isEmpty()) {
      return NaN;
    }
    let v = this.get(row, 0);
    for (let i2 = 1; i2 < this.columns; i2++) {
      if (this.get(row, i2) < v) {
        v = this.get(row, i2);
      }
    }
    return v;
  }
  minRowIndex(row) {
    checkRowIndex(this, row);
    checkNonEmpty(this);
    let v = this.get(row, 0);
    let idx = [row, 0];
    for (let i2 = 1; i2 < this.columns; i2++) {
      if (this.get(row, i2) < v) {
        v = this.get(row, i2);
        idx[1] = i2;
      }
    }
    return idx;
  }
  maxColumn(column) {
    checkColumnIndex(this, column);
    if (this.isEmpty()) {
      return NaN;
    }
    let v = this.get(0, column);
    for (let i2 = 1; i2 < this.rows; i2++) {
      if (this.get(i2, column) > v) {
        v = this.get(i2, column);
      }
    }
    return v;
  }
  maxColumnIndex(column) {
    checkColumnIndex(this, column);
    checkNonEmpty(this);
    let v = this.get(0, column);
    let idx = [0, column];
    for (let i2 = 1; i2 < this.rows; i2++) {
      if (this.get(i2, column) > v) {
        v = this.get(i2, column);
        idx[0] = i2;
      }
    }
    return idx;
  }
  minColumn(column) {
    checkColumnIndex(this, column);
    if (this.isEmpty()) {
      return NaN;
    }
    let v = this.get(0, column);
    for (let i2 = 1; i2 < this.rows; i2++) {
      if (this.get(i2, column) < v) {
        v = this.get(i2, column);
      }
    }
    return v;
  }
  minColumnIndex(column) {
    checkColumnIndex(this, column);
    checkNonEmpty(this);
    let v = this.get(0, column);
    let idx = [0, column];
    for (let i2 = 1; i2 < this.rows; i2++) {
      if (this.get(i2, column) < v) {
        v = this.get(i2, column);
        idx[0] = i2;
      }
    }
    return idx;
  }
  diag() {
    let min2 = Math.min(this.rows, this.columns);
    let diag = [];
    for (let i2 = 0; i2 < min2; i2++) {
      diag.push(this.get(i2, i2));
    }
    return diag;
  }
  norm(type = "frobenius") {
    switch (type) {
      case "max":
        return this.max();
      case "frobenius":
        return Math.sqrt(this.dot(this));
      default:
        throw new RangeError(`unknown norm type: ${type}`);
    }
  }
  cumulativeSum() {
    let sum2 = 0;
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        sum2 += this.get(i2, j);
        this.set(i2, j, sum2);
      }
    }
    return this;
  }
  dot(vector2) {
    if (AbstractMatrix2.isMatrix(vector2)) vector2 = vector2.to1DArray();
    let vector1 = this.to1DArray();
    if (vector1.length !== vector2.length) {
      throw new RangeError("vectors do not have the same size");
    }
    let dot = 0;
    for (let i2 = 0; i2 < vector1.length; i2++) {
      dot += vector1[i2] * vector2[i2];
    }
    return dot;
  }
  mmul(other) {
    other = Matrix$3.checkMatrix(other);
    let m = this.rows;
    let n = this.columns;
    let p = other.columns;
    let result = new Matrix$3(m, p);
    let Bcolj = new Float64Array(n);
    for (let j = 0; j < p; j++) {
      for (let k = 0; k < n; k++) {
        Bcolj[k] = other.get(k, j);
      }
      for (let i2 = 0; i2 < m; i2++) {
        let s = 0;
        for (let k = 0; k < n; k++) {
          s += this.get(i2, k) * Bcolj[k];
        }
        result.set(i2, j, s);
      }
    }
    return result;
  }
  mpow(scalar) {
    if (!this.isSquare()) {
      throw new RangeError("Matrix must be square");
    }
    if (!Number.isInteger(scalar) || scalar < 0) {
      throw new RangeError("Exponent must be a non-negative integer");
    }
    let result = Matrix$3.eye(this.rows);
    let bb = this;
    for (let e = scalar; e > 1; e /= 2) {
      if ((e & 1) !== 0) {
        result = result.mmul(bb);
      }
      bb = bb.mmul(bb);
    }
    return result;
  }
  strassen2x2(other) {
    other = Matrix$3.checkMatrix(other);
    let result = new Matrix$3(2, 2);
    const a11 = this.get(0, 0);
    const b11 = other.get(0, 0);
    const a12 = this.get(0, 1);
    const b12 = other.get(0, 1);
    const a21 = this.get(1, 0);
    const b21 = other.get(1, 0);
    const a22 = this.get(1, 1);
    const b22 = other.get(1, 1);
    const m1 = (a11 + a22) * (b11 + b22);
    const m2 = (a21 + a22) * b11;
    const m3 = a11 * (b12 - b22);
    const m4 = a22 * (b21 - b11);
    const m5 = (a11 + a12) * b22;
    const m6 = (a21 - a11) * (b11 + b12);
    const m7 = (a12 - a22) * (b21 + b22);
    const c00 = m1 + m4 - m5 + m7;
    const c01 = m3 + m5;
    const c10 = m2 + m4;
    const c11 = m1 - m2 + m3 + m6;
    result.set(0, 0, c00);
    result.set(0, 1, c01);
    result.set(1, 0, c10);
    result.set(1, 1, c11);
    return result;
  }
  strassen3x3(other) {
    other = Matrix$3.checkMatrix(other);
    let result = new Matrix$3(3, 3);
    const a00 = this.get(0, 0);
    const a01 = this.get(0, 1);
    const a02 = this.get(0, 2);
    const a10 = this.get(1, 0);
    const a11 = this.get(1, 1);
    const a12 = this.get(1, 2);
    const a20 = this.get(2, 0);
    const a21 = this.get(2, 1);
    const a22 = this.get(2, 2);
    const b00 = other.get(0, 0);
    const b01 = other.get(0, 1);
    const b02 = other.get(0, 2);
    const b10 = other.get(1, 0);
    const b11 = other.get(1, 1);
    const b12 = other.get(1, 2);
    const b20 = other.get(2, 0);
    const b21 = other.get(2, 1);
    const b22 = other.get(2, 2);
    const m1 = (a00 + a01 + a02 - a10 - a11 - a21 - a22) * b11;
    const m2 = (a00 - a10) * (-b01 + b11);
    const m3 = a11 * (-b00 + b01 + b10 - b11 - b12 - b20 + b22);
    const m4 = (-a00 + a10 + a11) * (b00 - b01 + b11);
    const m5 = (a10 + a11) * (-b00 + b01);
    const m6 = a00 * b00;
    const m7 = (-a00 + a20 + a21) * (b00 - b02 + b12);
    const m8 = (-a00 + a20) * (b02 - b12);
    const m9 = (a20 + a21) * (-b00 + b02);
    const m10 = (a00 + a01 + a02 - a11 - a12 - a20 - a21) * b12;
    const m11 = a21 * (-b00 + b02 + b10 - b11 - b12 - b20 + b21);
    const m12 = (-a02 + a21 + a22) * (b11 + b20 - b21);
    const m13 = (a02 - a22) * (b11 - b21);
    const m14 = a02 * b20;
    const m15 = (a21 + a22) * (-b20 + b21);
    const m16 = (-a02 + a11 + a12) * (b12 + b20 - b22);
    const m17 = (a02 - a12) * (b12 - b22);
    const m18 = (a11 + a12) * (-b20 + b22);
    const m19 = a01 * b10;
    const m20 = a12 * b21;
    const m21 = a10 * b02;
    const m22 = a20 * b01;
    const m23 = a22 * b22;
    const c00 = m6 + m14 + m19;
    const c01 = m1 + m4 + m5 + m6 + m12 + m14 + m15;
    const c02 = m6 + m7 + m9 + m10 + m14 + m16 + m18;
    const c10 = m2 + m3 + m4 + m6 + m14 + m16 + m17;
    const c11 = m2 + m4 + m5 + m6 + m20;
    const c12 = m14 + m16 + m17 + m18 + m21;
    const c20 = m6 + m7 + m8 + m11 + m12 + m13 + m14;
    const c21 = m12 + m13 + m14 + m15 + m22;
    const c22 = m6 + m7 + m8 + m9 + m23;
    result.set(0, 0, c00);
    result.set(0, 1, c01);
    result.set(0, 2, c02);
    result.set(1, 0, c10);
    result.set(1, 1, c11);
    result.set(1, 2, c12);
    result.set(2, 0, c20);
    result.set(2, 1, c21);
    result.set(2, 2, c22);
    return result;
  }
  mmulStrassen(y) {
    y = Matrix$3.checkMatrix(y);
    let x = this.clone();
    let r1 = x.rows;
    let c1 = x.columns;
    let r2 = y.rows;
    let c2 = y.columns;
    if (c1 !== r2) {
      console.warn(
        `Multiplying ${r1} x ${c1} and ${r2} x ${c2} matrix: dimensions do not match.`
      );
    }
    function embed(mat, rows, cols) {
      let r3 = mat.rows;
      let c3 = mat.columns;
      if (r3 === rows && c3 === cols) {
        return mat;
      } else {
        let resultat = AbstractMatrix2.zeros(rows, cols);
        resultat = resultat.setSubMatrix(mat, 0, 0);
        return resultat;
      }
    }
    let r = Math.max(r1, r2);
    let c = Math.max(c1, c2);
    x = embed(x, r, c);
    y = embed(y, r, c);
    function blockMult(a, b, rows, cols) {
      if (rows <= 512 || cols <= 512) {
        return a.mmul(b);
      }
      if (rows % 2 === 1 && cols % 2 === 1) {
        a = embed(a, rows + 1, cols + 1);
        b = embed(b, rows + 1, cols + 1);
      } else if (rows % 2 === 1) {
        a = embed(a, rows + 1, cols);
        b = embed(b, rows + 1, cols);
      } else if (cols % 2 === 1) {
        a = embed(a, rows, cols + 1);
        b = embed(b, rows, cols + 1);
      }
      let halfRows = parseInt(a.rows / 2, 10);
      let halfCols = parseInt(a.columns / 2, 10);
      let a11 = a.subMatrix(0, halfRows - 1, 0, halfCols - 1);
      let b11 = b.subMatrix(0, halfRows - 1, 0, halfCols - 1);
      let a12 = a.subMatrix(0, halfRows - 1, halfCols, a.columns - 1);
      let b12 = b.subMatrix(0, halfRows - 1, halfCols, b.columns - 1);
      let a21 = a.subMatrix(halfRows, a.rows - 1, 0, halfCols - 1);
      let b21 = b.subMatrix(halfRows, b.rows - 1, 0, halfCols - 1);
      let a22 = a.subMatrix(halfRows, a.rows - 1, halfCols, a.columns - 1);
      let b22 = b.subMatrix(halfRows, b.rows - 1, halfCols, b.columns - 1);
      let m1 = blockMult(
        AbstractMatrix2.add(a11, a22),
        AbstractMatrix2.add(b11, b22),
        halfRows,
        halfCols
      );
      let m2 = blockMult(AbstractMatrix2.add(a21, a22), b11, halfRows, halfCols);
      let m3 = blockMult(a11, AbstractMatrix2.sub(b12, b22), halfRows, halfCols);
      let m4 = blockMult(a22, AbstractMatrix2.sub(b21, b11), halfRows, halfCols);
      let m5 = blockMult(AbstractMatrix2.add(a11, a12), b22, halfRows, halfCols);
      let m6 = blockMult(
        AbstractMatrix2.sub(a21, a11),
        AbstractMatrix2.add(b11, b12),
        halfRows,
        halfCols
      );
      let m7 = blockMult(
        AbstractMatrix2.sub(a12, a22),
        AbstractMatrix2.add(b21, b22),
        halfRows,
        halfCols
      );
      let c11 = AbstractMatrix2.add(m1, m4);
      c11.sub(m5);
      c11.add(m7);
      let c12 = AbstractMatrix2.add(m3, m5);
      let c21 = AbstractMatrix2.add(m2, m4);
      let c22 = AbstractMatrix2.sub(m1, m2);
      c22.add(m3);
      c22.add(m6);
      let result = AbstractMatrix2.zeros(2 * c11.rows, 2 * c11.columns);
      result = result.setSubMatrix(c11, 0, 0);
      result = result.setSubMatrix(c12, c11.rows, 0);
      result = result.setSubMatrix(c21, 0, c11.columns);
      result = result.setSubMatrix(c22, c11.rows, c11.columns);
      return result.subMatrix(0, rows - 1, 0, cols - 1);
    }
    return blockMult(x, y, r, c);
  }
  scaleRows(options = {}) {
    if (typeof options !== "object") {
      throw new TypeError("options must be an object");
    }
    const { min: min2 = 0, max: max2 = 1 } = options;
    if (!Number.isFinite(min2)) throw new TypeError("min must be a number");
    if (!Number.isFinite(max2)) throw new TypeError("max must be a number");
    if (min2 >= max2) throw new RangeError("min must be smaller than max");
    let newMatrix = new Matrix$3(this.rows, this.columns);
    for (let i2 = 0; i2 < this.rows; i2++) {
      const row = this.getRow(i2);
      if (row.length > 0) {
        rescale(row, { min: min2, max: max2, output: row });
      }
      newMatrix.setRow(i2, row);
    }
    return newMatrix;
  }
  scaleColumns(options = {}) {
    if (typeof options !== "object") {
      throw new TypeError("options must be an object");
    }
    const { min: min2 = 0, max: max2 = 1 } = options;
    if (!Number.isFinite(min2)) throw new TypeError("min must be a number");
    if (!Number.isFinite(max2)) throw new TypeError("max must be a number");
    if (min2 >= max2) throw new RangeError("min must be smaller than max");
    let newMatrix = new Matrix$3(this.rows, this.columns);
    for (let i2 = 0; i2 < this.columns; i2++) {
      const column = this.getColumn(i2);
      if (column.length) {
        rescale(column, {
          min: min2,
          max: max2,
          output: column
        });
      }
      newMatrix.setColumn(i2, column);
    }
    return newMatrix;
  }
  flipRows() {
    const middle = Math.ceil(this.columns / 2);
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < middle; j++) {
        let first = this.get(i2, j);
        let last = this.get(i2, this.columns - 1 - j);
        this.set(i2, j, last);
        this.set(i2, this.columns - 1 - j, first);
      }
    }
    return this;
  }
  flipColumns() {
    const middle = Math.ceil(this.rows / 2);
    for (let j = 0; j < this.columns; j++) {
      for (let i2 = 0; i2 < middle; i2++) {
        let first = this.get(i2, j);
        let last = this.get(this.rows - 1 - i2, j);
        this.set(i2, j, last);
        this.set(this.rows - 1 - i2, j, first);
      }
    }
    return this;
  }
  kroneckerProduct(other) {
    other = Matrix$3.checkMatrix(other);
    let m = this.rows;
    let n = this.columns;
    let p = other.rows;
    let q = other.columns;
    let result = new Matrix$3(m * p, n * q);
    for (let i2 = 0; i2 < m; i2++) {
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < p; k++) {
          for (let l = 0; l < q; l++) {
            result.set(p * i2 + k, q * j + l, this.get(i2, j) * other.get(k, l));
          }
        }
      }
    }
    return result;
  }
  kroneckerSum(other) {
    other = Matrix$3.checkMatrix(other);
    if (!this.isSquare() || !other.isSquare()) {
      throw new Error("Kronecker Sum needs two Square Matrices");
    }
    let m = this.rows;
    let n = other.rows;
    let AxI = this.kroneckerProduct(Matrix$3.eye(n, n));
    let IxB = Matrix$3.eye(m, m).kroneckerProduct(other);
    return AxI.add(IxB);
  }
  transpose() {
    let result = new Matrix$3(this.columns, this.rows);
    for (let i2 = 0; i2 < this.rows; i2++) {
      for (let j = 0; j < this.columns; j++) {
        result.set(j, i2, this.get(i2, j));
      }
    }
    return result;
  }
  sortRows(compareFunction = compareNumbers) {
    for (let i2 = 0; i2 < this.rows; i2++) {
      this.setRow(i2, this.getRow(i2).sort(compareFunction));
    }
    return this;
  }
  sortColumns(compareFunction = compareNumbers) {
    for (let i2 = 0; i2 < this.columns; i2++) {
      this.setColumn(i2, this.getColumn(i2).sort(compareFunction));
    }
    return this;
  }
  subMatrix(startRow, endRow, startColumn, endColumn) {
    checkRange(this, startRow, endRow, startColumn, endColumn);
    let newMatrix = new Matrix$3(
      endRow - startRow + 1,
      endColumn - startColumn + 1
    );
    for (let i2 = startRow; i2 <= endRow; i2++) {
      for (let j = startColumn; j <= endColumn; j++) {
        newMatrix.set(i2 - startRow, j - startColumn, this.get(i2, j));
      }
    }
    return newMatrix;
  }
  subMatrixRow(indices, startColumn, endColumn) {
    if (startColumn === void 0) startColumn = 0;
    if (endColumn === void 0) endColumn = this.columns - 1;
    if (startColumn > endColumn || startColumn < 0 || startColumn >= this.columns || endColumn < 0 || endColumn >= this.columns) {
      throw new RangeError("Argument out of range");
    }
    let newMatrix = new Matrix$3(indices.length, endColumn - startColumn + 1);
    for (let i2 = 0; i2 < indices.length; i2++) {
      for (let j = startColumn; j <= endColumn; j++) {
        if (indices[i2] < 0 || indices[i2] >= this.rows) {
          throw new RangeError(`Row index out of range: ${indices[i2]}`);
        }
        newMatrix.set(i2, j - startColumn, this.get(indices[i2], j));
      }
    }
    return newMatrix;
  }
  subMatrixColumn(indices, startRow, endRow) {
    if (startRow === void 0) startRow = 0;
    if (endRow === void 0) endRow = this.rows - 1;
    if (startRow > endRow || startRow < 0 || startRow >= this.rows || endRow < 0 || endRow >= this.rows) {
      throw new RangeError("Argument out of range");
    }
    let newMatrix = new Matrix$3(endRow - startRow + 1, indices.length);
    for (let i2 = 0; i2 < indices.length; i2++) {
      for (let j = startRow; j <= endRow; j++) {
        if (indices[i2] < 0 || indices[i2] >= this.columns) {
          throw new RangeError(`Column index out of range: ${indices[i2]}`);
        }
        newMatrix.set(j - startRow, i2, this.get(j, indices[i2]));
      }
    }
    return newMatrix;
  }
  setSubMatrix(matrix2, startRow, startColumn) {
    matrix2 = Matrix$3.checkMatrix(matrix2);
    if (matrix2.isEmpty()) {
      return this;
    }
    let endRow = startRow + matrix2.rows - 1;
    let endColumn = startColumn + matrix2.columns - 1;
    checkRange(this, startRow, endRow, startColumn, endColumn);
    for (let i2 = 0; i2 < matrix2.rows; i2++) {
      for (let j = 0; j < matrix2.columns; j++) {
        this.set(startRow + i2, startColumn + j, matrix2.get(i2, j));
      }
    }
    return this;
  }
  selection(rowIndices, columnIndices) {
    checkRowIndices(this, rowIndices);
    checkColumnIndices(this, columnIndices);
    let newMatrix = new Matrix$3(rowIndices.length, columnIndices.length);
    for (let i2 = 0; i2 < rowIndices.length; i2++) {
      let rowIndex = rowIndices[i2];
      for (let j = 0; j < columnIndices.length; j++) {
        let columnIndex = columnIndices[j];
        newMatrix.set(i2, j, this.get(rowIndex, columnIndex));
      }
    }
    return newMatrix;
  }
  trace() {
    let min2 = Math.min(this.rows, this.columns);
    let trace = 0;
    for (let i2 = 0; i2 < min2; i2++) {
      trace += this.get(i2, i2);
    }
    return trace;
  }
  clone() {
    return this.constructor.copy(this, new Matrix$3(this.rows, this.columns));
  }
  /**
   * @template {AbstractMatrix} M
   * @param {AbstractMatrix} from
   * @param {M} to
   * @return {M}
   */
  static copy(from, to) {
    for (const [row, column, value] of from.entries()) {
      to.set(row, column, value);
    }
    return to;
  }
  sum(by) {
    switch (by) {
      case "row":
        return sumByRow(this);
      case "column":
        return sumByColumn(this);
      case void 0:
        return sumAll(this);
      default:
        throw new Error(`invalid option: ${by}`);
    }
  }
  product(by) {
    switch (by) {
      case "row":
        return productByRow(this);
      case "column":
        return productByColumn(this);
      case void 0:
        return productAll(this);
      default:
        throw new Error(`invalid option: ${by}`);
    }
  }
  mean(by) {
    const sum2 = this.sum(by);
    switch (by) {
      case "row": {
        for (let i2 = 0; i2 < this.rows; i2++) {
          sum2[i2] /= this.columns;
        }
        return sum2;
      }
      case "column": {
        for (let i2 = 0; i2 < this.columns; i2++) {
          sum2[i2] /= this.rows;
        }
        return sum2;
      }
      case void 0:
        return sum2 / this.size;
      default:
        throw new Error(`invalid option: ${by}`);
    }
  }
  variance(by, options = {}) {
    if (typeof by === "object") {
      options = by;
      by = void 0;
    }
    if (typeof options !== "object") {
      throw new TypeError("options must be an object");
    }
    const { unbiased = true, mean: mean2 = this.mean(by) } = options;
    if (typeof unbiased !== "boolean") {
      throw new TypeError("unbiased must be a boolean");
    }
    switch (by) {
      case "row": {
        if (!isAnyArray.isAnyArray(mean2)) {
          throw new TypeError("mean must be an array");
        }
        return varianceByRow(this, unbiased, mean2);
      }
      case "column": {
        if (!isAnyArray.isAnyArray(mean2)) {
          throw new TypeError("mean must be an array");
        }
        return varianceByColumn(this, unbiased, mean2);
      }
      case void 0: {
        if (typeof mean2 !== "number") {
          throw new TypeError("mean must be a number");
        }
        return varianceAll(this, unbiased, mean2);
      }
      default:
        throw new Error(`invalid option: ${by}`);
    }
  }
  standardDeviation(by, options) {
    if (typeof by === "object") {
      options = by;
      by = void 0;
    }
    const variance = this.variance(by, options);
    if (by === void 0) {
      return Math.sqrt(variance);
    } else {
      for (let i2 = 0; i2 < variance.length; i2++) {
        variance[i2] = Math.sqrt(variance[i2]);
      }
      return variance;
    }
  }
  center(by, options = {}) {
    if (typeof by === "object") {
      options = by;
      by = void 0;
    }
    if (typeof options !== "object") {
      throw new TypeError("options must be an object");
    }
    const { center = this.mean(by) } = options;
    switch (by) {
      case "row": {
        if (!isAnyArray.isAnyArray(center)) {
          throw new TypeError("center must be an array");
        }
        centerByRow(this, center);
        return this;
      }
      case "column": {
        if (!isAnyArray.isAnyArray(center)) {
          throw new TypeError("center must be an array");
        }
        centerByColumn(this, center);
        return this;
      }
      case void 0: {
        if (typeof center !== "number") {
          throw new TypeError("center must be a number");
        }
        centerAll(this, center);
        return this;
      }
      default:
        throw new Error(`invalid option: ${by}`);
    }
  }
  scale(by, options = {}) {
    if (typeof by === "object") {
      options = by;
      by = void 0;
    }
    if (typeof options !== "object") {
      throw new TypeError("options must be an object");
    }
    let scale = options.scale;
    switch (by) {
      case "row": {
        if (scale === void 0) {
          scale = getScaleByRow(this);
        } else if (!isAnyArray.isAnyArray(scale)) {
          throw new TypeError("scale must be an array");
        }
        scaleByRow(this, scale);
        return this;
      }
      case "column": {
        if (scale === void 0) {
          scale = getScaleByColumn(this);
        } else if (!isAnyArray.isAnyArray(scale)) {
          throw new TypeError("scale must be an array");
        }
        scaleByColumn(this, scale);
        return this;
      }
      case void 0: {
        if (scale === void 0) {
          scale = getScaleAll(this);
        } else if (typeof scale !== "number") {
          throw new TypeError("scale must be a number");
        }
        scaleAll(this, scale);
        return this;
      }
      default:
        throw new Error(`invalid option: ${by}`);
    }
  }
  toString(options) {
    return inspectMatrixWithOptions(this, options);
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  /**
   * iterator from left to right, from top to bottom
   * yield [row, column, value]
   * @returns {Generator<[number, number, number], void, void>}
   */
  *entries() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        yield [row, col, this.get(row, col)];
      }
    }
  }
  /**
   * iterator from left to right, from top to bottom
   * yield value
   * @returns {Generator<number, void, void>}
   */
  *values() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        yield this.get(row, col);
      }
    }
  }
};
AbstractMatrix$1.prototype.klass = "Matrix";
if (typeof Symbol !== "undefined") {
  AbstractMatrix$1.prototype[Symbol.for("nodejs.util.inspect.custom")] = inspectMatrix;
}
function compareNumbers(a, b) {
  return a - b;
}
function isArrayOfNumbers(array) {
  return array.every((element) => {
    return typeof element === "number";
  });
}
AbstractMatrix$1.random = AbstractMatrix$1.rand;
AbstractMatrix$1.randomInt = AbstractMatrix$1.randInt;
AbstractMatrix$1.diagonal = AbstractMatrix$1.diag;
AbstractMatrix$1.prototype.diagonal = AbstractMatrix$1.prototype.diag;
AbstractMatrix$1.identity = AbstractMatrix$1.eye;
AbstractMatrix$1.prototype.negate = AbstractMatrix$1.prototype.neg;
AbstractMatrix$1.prototype.tensorProduct = AbstractMatrix$1.prototype.kroneckerProduct;
let Matrix$3 = (_a = class extends AbstractMatrix$1 {
  constructor(nRows, nColumns) {
    super();
    __privateAdd(this, _Matrix_instances);
    /**
     * @type {Float64Array[]}
     */
    __publicField(this, "data");
    if (_a.isMatrix(nRows)) {
      __privateMethod(this, _Matrix_instances, initData_fn).call(this, nRows.rows, nRows.columns);
      _a.copy(nRows, this);
    } else if (Number.isInteger(nRows) && nRows >= 0) {
      __privateMethod(this, _Matrix_instances, initData_fn).call(this, nRows, nColumns);
    } else if (isAnyArray.isAnyArray(nRows)) {
      const arrayData = nRows;
      nRows = arrayData.length;
      nColumns = nRows ? arrayData[0].length : 0;
      if (typeof nColumns !== "number") {
        throw new TypeError(
          "Data must be a 2D array with at least one element"
        );
      }
      this.data = [];
      for (let i2 = 0; i2 < nRows; i2++) {
        if (arrayData[i2].length !== nColumns) {
          throw new RangeError("Inconsistent array dimensions");
        }
        if (!isArrayOfNumbers(arrayData[i2])) {
          throw new TypeError("Input data contains non-numeric values");
        }
        this.data.push(Float64Array.from(arrayData[i2]));
      }
      this.rows = nRows;
      this.columns = nColumns;
    } else {
      throw new TypeError(
        "First argument must be a positive number or an array"
      );
    }
  }
  set(rowIndex, columnIndex, value) {
    this.data[rowIndex][columnIndex] = value;
    return this;
  }
  get(rowIndex, columnIndex) {
    return this.data[rowIndex][columnIndex];
  }
  removeRow(index) {
    checkRowIndex(this, index);
    this.data.splice(index, 1);
    this.rows -= 1;
    return this;
  }
  addRow(index, array) {
    if (array === void 0) {
      array = index;
      index = this.rows;
    }
    checkRowIndex(this, index, true);
    array = Float64Array.from(checkRowVector(this, array));
    this.data.splice(index, 0, array);
    this.rows += 1;
    return this;
  }
  removeColumn(index) {
    checkColumnIndex(this, index);
    for (let i2 = 0; i2 < this.rows; i2++) {
      const newRow = new Float64Array(this.columns - 1);
      for (let j = 0; j < index; j++) {
        newRow[j] = this.data[i2][j];
      }
      for (let j = index + 1; j < this.columns; j++) {
        newRow[j - 1] = this.data[i2][j];
      }
      this.data[i2] = newRow;
    }
    this.columns -= 1;
    return this;
  }
  addColumn(index, array) {
    if (typeof array === "undefined") {
      array = index;
      index = this.columns;
    }
    checkColumnIndex(this, index, true);
    array = checkColumnVector(this, array);
    for (let i2 = 0; i2 < this.rows; i2++) {
      const newRow = new Float64Array(this.columns + 1);
      let j = 0;
      for (; j < index; j++) {
        newRow[j] = this.data[i2][j];
      }
      newRow[j++] = array[i2];
      for (; j < this.columns + 1; j++) {
        newRow[j] = this.data[i2][j - 1];
      }
      this.data[i2] = newRow;
    }
    this.columns += 1;
    return this;
  }
}, _Matrix_instances = new WeakSet(), /**
 * Init an empty matrix
 * @param {number} nRows
 * @param {number} nColumns
 */
initData_fn = function(nRows, nColumns) {
  this.data = [];
  if (Number.isInteger(nColumns) && nColumns >= 0) {
    for (let i2 = 0; i2 < nRows; i2++) {
      this.data.push(new Float64Array(nColumns));
    }
  } else {
    throw new TypeError("nColumns must be a positive integer");
  }
  this.rows = nRows;
  this.columns = nColumns;
}, _a);
installMathOperations(AbstractMatrix$1, Matrix$3);
let SymmetricMatrix$1 = (_b = class extends AbstractMatrix$1 {
  /**
   * @param {number | AbstractMatrix | ArrayLike<ArrayLike<number>>} diagonalSize
   * @return {this}
   */
  constructor(diagonalSize) {
    super();
    /** @type {Matrix} */
    __privateAdd(this, _matrix);
    if (Matrix$3.isMatrix(diagonalSize)) {
      if (!diagonalSize.isSymmetric()) {
        throw new TypeError("not symmetric data");
      }
      __privateSet(this, _matrix, Matrix$3.copy(
        diagonalSize,
        new Matrix$3(diagonalSize.rows, diagonalSize.rows)
      ));
    } else if (Number.isInteger(diagonalSize) && diagonalSize >= 0) {
      __privateSet(this, _matrix, new Matrix$3(diagonalSize, diagonalSize));
    } else {
      __privateSet(this, _matrix, new Matrix$3(diagonalSize));
      if (!this.isSymmetric()) {
        throw new TypeError("not symmetric data");
      }
    }
  }
  get size() {
    return __privateGet(this, _matrix).size;
  }
  get rows() {
    return __privateGet(this, _matrix).rows;
  }
  get columns() {
    return __privateGet(this, _matrix).columns;
  }
  get diagonalSize() {
    return this.rows;
  }
  /**
   * not the same as matrix.isSymmetric()
   * Here is to check if it's instanceof SymmetricMatrix without bundling issues
   *
   * @param value
   * @returns {boolean}
   */
  static isSymmetricMatrix(value) {
    return Matrix$3.isMatrix(value) && value.klassType === "SymmetricMatrix";
  }
  /**
   * @param diagonalSize
   * @return {SymmetricMatrix}
   */
  static zeros(diagonalSize) {
    return new this(diagonalSize);
  }
  /**
   * @param diagonalSize
   * @return {SymmetricMatrix}
   */
  static ones(diagonalSize) {
    return new this(diagonalSize).fill(1);
  }
  clone() {
    const matrix2 = new _b(this.diagonalSize);
    for (const [row, col, value] of this.upperRightEntries()) {
      matrix2.set(row, col, value);
    }
    return matrix2;
  }
  toMatrix() {
    return new Matrix$3(this);
  }
  get(rowIndex, columnIndex) {
    return __privateGet(this, _matrix).get(rowIndex, columnIndex);
  }
  set(rowIndex, columnIndex, value) {
    __privateGet(this, _matrix).set(rowIndex, columnIndex, value);
    __privateGet(this, _matrix).set(columnIndex, rowIndex, value);
    return this;
  }
  removeCross(index) {
    __privateGet(this, _matrix).removeRow(index);
    __privateGet(this, _matrix).removeColumn(index);
    return this;
  }
  addCross(index, array) {
    if (array === void 0) {
      array = index;
      index = this.diagonalSize;
    }
    const row = array.slice();
    row.splice(index, 1);
    __privateGet(this, _matrix).addRow(index, row);
    __privateGet(this, _matrix).addColumn(index, array);
    return this;
  }
  /**
   * @param {Mask[]} mask
   */
  applyMask(mask2) {
    if (mask2.length !== this.diagonalSize) {
      throw new RangeError("Mask size do not match with matrix size");
    }
    const sidesToRemove = [];
    for (const [index, passthroughs] of mask2.entries()) {
      if (passthroughs) continue;
      sidesToRemove.push(index);
    }
    sidesToRemove.reverse();
    for (const sideIndex of sidesToRemove) {
      this.removeCross(sideIndex);
    }
    return this;
  }
  /**
   * Compact format upper-right corner of matrix
   * iterate from left to right, from top to bottom.
   *
   * ```
   *   A B C D
   * A 1 2 3 4
   * B 2 5 6 7
   * C 3 6 8 9
   * D 4 7 9 10
   * ```
   *
   * will return compact 1D array `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`
   *
   * length is S(i=0, n=sideSize) => 10 for a 4 sideSized matrix
   *
   * @returns {number[]}
   */
  toCompact() {
    const { diagonalSize } = this;
    const compact = new Array(diagonalSize * (diagonalSize + 1) / 2);
    for (let col = 0, row = 0, index = 0; index < compact.length; index++) {
      compact[index] = this.get(row, col);
      if (++col >= diagonalSize) col = ++row;
    }
    return compact;
  }
  /**
   * @param {number[]} compact
   * @return {SymmetricMatrix}
   */
  static fromCompact(compact) {
    const compactSize = compact.length;
    const diagonalSize = (Math.sqrt(8 * compactSize + 1) - 1) / 2;
    if (!Number.isInteger(diagonalSize)) {
      throw new TypeError(
        `This array is not a compact representation of a Symmetric Matrix, ${JSON.stringify(
          compact
        )}`
      );
    }
    const matrix2 = new _b(diagonalSize);
    for (let col = 0, row = 0, index = 0; index < compactSize; index++) {
      matrix2.set(col, row, compact[index]);
      if (++col >= diagonalSize) col = ++row;
    }
    return matrix2;
  }
  /**
   * half iterator upper-right-corner from left to right, from top to bottom
   * yield [row, column, value]
   *
   * @returns {Generator<[number, number, number], void, void>}
   */
  *upperRightEntries() {
    for (let row = 0, col = 0; row < this.diagonalSize; void 0) {
      const value = this.get(row, col);
      yield [row, col, value];
      if (++col >= this.diagonalSize) col = ++row;
    }
  }
  /**
   * half iterator upper-right-corner from left to right, from top to bottom
   * yield value
   *
   * @returns {Generator<[number, number, number], void, void>}
   */
  *upperRightValues() {
    for (let row = 0, col = 0; row < this.diagonalSize; void 0) {
      const value = this.get(row, col);
      yield value;
      if (++col >= this.diagonalSize) col = ++row;
    }
  }
}, _matrix = new WeakMap(), _b);
SymmetricMatrix$1.prototype.klassType = "SymmetricMatrix";
let DistanceMatrix$1 = class DistanceMatrix2 extends SymmetricMatrix$1 {
  /**
   * not the same as matrix.isSymmetric()
   * Here is to check if it's instanceof SymmetricMatrix without bundling issues
   *
   * @param value
   * @returns {boolean}
   */
  static isDistanceMatrix(value) {
    return SymmetricMatrix$1.isSymmetricMatrix(value) && value.klassSubType === "DistanceMatrix";
  }
  constructor(sideSize) {
    super(sideSize);
    if (!this.isDistance()) {
      throw new TypeError("Provided arguments do no produce a distance matrix");
    }
  }
  set(rowIndex, columnIndex, value) {
    if (rowIndex === columnIndex) value = 0;
    return super.set(rowIndex, columnIndex, value);
  }
  addCross(index, array) {
    if (array === void 0) {
      array = index;
      index = this.diagonalSize;
    }
    array = array.slice();
    array[index] = 0;
    return super.addCross(index, array);
  }
  toSymmetricMatrix() {
    return new SymmetricMatrix$1(this);
  }
  clone() {
    const matrix2 = new DistanceMatrix2(this.diagonalSize);
    for (const [row, col, value] of this.upperRightEntries()) {
      if (row === col) continue;
      matrix2.set(row, col, value);
    }
    return matrix2;
  }
  /**
   * Compact format upper-right corner of matrix
   * no diagonal (only zeros)
   * iterable from left to right, from top to bottom.
   *
   * ```
   *   A B C D
   * A 0 1 2 3
   * B 1 0 4 5
   * C 2 4 0 6
   * D 3 5 6 0
   * ```
   *
   * will return compact 1D array `[1, 2, 3, 4, 5, 6]`
   *
   * length is S(i=0, n=sideSize-1) => 6 for a 4 side sized matrix
   *
   * @returns {number[]}
   */
  toCompact() {
    const { diagonalSize } = this;
    const compactLength = (diagonalSize - 1) * diagonalSize / 2;
    const compact = new Array(compactLength);
    for (let col = 1, row = 0, index = 0; index < compact.length; index++) {
      compact[index] = this.get(row, col);
      if (++col >= diagonalSize) col = ++row + 1;
    }
    return compact;
  }
  /**
   * @param {number[]} compact
   */
  static fromCompact(compact) {
    const compactSize = compact.length;
    if (compactSize === 0) {
      return new this(0);
    }
    const diagonalSize = (Math.sqrt(8 * compactSize + 1) + 1) / 2;
    if (!Number.isInteger(diagonalSize)) {
      throw new TypeError(
        `This array is not a compact representation of a DistanceMatrix, ${JSON.stringify(
          compact
        )}`
      );
    }
    const matrix2 = new this(diagonalSize);
    for (let col = 1, row = 0, index = 0; index < compactSize; index++) {
      matrix2.set(col, row, compact[index]);
      if (++col >= diagonalSize) col = ++row + 1;
    }
    return matrix2;
  }
};
DistanceMatrix$1.prototype.klassSubType = "DistanceMatrix";
class BaseView extends AbstractMatrix$1 {
  constructor(matrix2, rows, columns) {
    super();
    this.matrix = matrix2;
    this.rows = rows;
    this.columns = columns;
  }
}
let MatrixColumnView$1 = class MatrixColumnView2 extends BaseView {
  constructor(matrix2, column) {
    checkColumnIndex(matrix2, column);
    super(matrix2, matrix2.rows, 1);
    this.column = column;
  }
  set(rowIndex, columnIndex, value) {
    this.matrix.set(rowIndex, this.column, value);
    return this;
  }
  get(rowIndex) {
    return this.matrix.get(rowIndex, this.column);
  }
};
let MatrixColumnSelectionView$1 = class MatrixColumnSelectionView2 extends BaseView {
  constructor(matrix2, columnIndices) {
    checkColumnIndices(matrix2, columnIndices);
    super(matrix2, matrix2.rows, columnIndices.length);
    this.columnIndices = columnIndices;
  }
  set(rowIndex, columnIndex, value) {
    this.matrix.set(rowIndex, this.columnIndices[columnIndex], value);
    return this;
  }
  get(rowIndex, columnIndex) {
    return this.matrix.get(rowIndex, this.columnIndices[columnIndex]);
  }
};
let MatrixFlipColumnView$1 = class MatrixFlipColumnView2 extends BaseView {
  constructor(matrix2) {
    super(matrix2, matrix2.rows, matrix2.columns);
  }
  set(rowIndex, columnIndex, value) {
    this.matrix.set(rowIndex, this.columns - columnIndex - 1, value);
    return this;
  }
  get(rowIndex, columnIndex) {
    return this.matrix.get(rowIndex, this.columns - columnIndex - 1);
  }
};
let MatrixFlipRowView$1 = class MatrixFlipRowView2 extends BaseView {
  constructor(matrix2) {
    super(matrix2, matrix2.rows, matrix2.columns);
  }
  set(rowIndex, columnIndex, value) {
    this.matrix.set(this.rows - rowIndex - 1, columnIndex, value);
    return this;
  }
  get(rowIndex, columnIndex) {
    return this.matrix.get(this.rows - rowIndex - 1, columnIndex);
  }
};
let MatrixRowView$1 = class MatrixRowView2 extends BaseView {
  constructor(matrix2, row) {
    checkRowIndex(matrix2, row);
    super(matrix2, 1, matrix2.columns);
    this.row = row;
  }
  set(rowIndex, columnIndex, value) {
    this.matrix.set(this.row, columnIndex, value);
    return this;
  }
  get(rowIndex, columnIndex) {
    return this.matrix.get(this.row, columnIndex);
  }
};
let MatrixRowSelectionView$1 = class MatrixRowSelectionView2 extends BaseView {
  constructor(matrix2, rowIndices) {
    checkRowIndices(matrix2, rowIndices);
    super(matrix2, rowIndices.length, matrix2.columns);
    this.rowIndices = rowIndices;
  }
  set(rowIndex, columnIndex, value) {
    this.matrix.set(this.rowIndices[rowIndex], columnIndex, value);
    return this;
  }
  get(rowIndex, columnIndex) {
    return this.matrix.get(this.rowIndices[rowIndex], columnIndex);
  }
};
let MatrixSelectionView$1 = class MatrixSelectionView2 extends BaseView {
  constructor(matrix2, rowIndices, columnIndices) {
    checkRowIndices(matrix2, rowIndices);
    checkColumnIndices(matrix2, columnIndices);
    super(matrix2, rowIndices.length, columnIndices.length);
    this.rowIndices = rowIndices;
    this.columnIndices = columnIndices;
  }
  set(rowIndex, columnIndex, value) {
    this.matrix.set(
      this.rowIndices[rowIndex],
      this.columnIndices[columnIndex],
      value
    );
    return this;
  }
  get(rowIndex, columnIndex) {
    return this.matrix.get(
      this.rowIndices[rowIndex],
      this.columnIndices[columnIndex]
    );
  }
};
let MatrixSubView$1 = class MatrixSubView2 extends BaseView {
  constructor(matrix2, startRow, endRow, startColumn, endColumn) {
    checkRange(matrix2, startRow, endRow, startColumn, endColumn);
    super(matrix2, endRow - startRow + 1, endColumn - startColumn + 1);
    this.startRow = startRow;
    this.startColumn = startColumn;
  }
  set(rowIndex, columnIndex, value) {
    this.matrix.set(
      this.startRow + rowIndex,
      this.startColumn + columnIndex,
      value
    );
    return this;
  }
  get(rowIndex, columnIndex) {
    return this.matrix.get(
      this.startRow + rowIndex,
      this.startColumn + columnIndex
    );
  }
};
let MatrixTransposeView$2 = class MatrixTransposeView2 extends BaseView {
  constructor(matrix2) {
    super(matrix2, matrix2.columns, matrix2.rows);
  }
  set(rowIndex, columnIndex, value) {
    this.matrix.set(columnIndex, rowIndex, value);
    return this;
  }
  get(rowIndex, columnIndex) {
    return this.matrix.get(columnIndex, rowIndex);
  }
};
let WrapperMatrix1D$1 = class WrapperMatrix1D2 extends AbstractMatrix$1 {
  constructor(data, options = {}) {
    const { rows = 1 } = options;
    if (data.length % rows !== 0) {
      throw new Error("the data length is not divisible by the number of rows");
    }
    super();
    this.rows = rows;
    this.columns = data.length / rows;
    this.data = data;
  }
  set(rowIndex, columnIndex, value) {
    let index = this._calculateIndex(rowIndex, columnIndex);
    this.data[index] = value;
    return this;
  }
  get(rowIndex, columnIndex) {
    let index = this._calculateIndex(rowIndex, columnIndex);
    return this.data[index];
  }
  _calculateIndex(row, column) {
    return row * this.columns + column;
  }
};
let WrapperMatrix2D$1 = class WrapperMatrix2D2 extends AbstractMatrix$1 {
  constructor(data) {
    super();
    this.data = data;
    this.rows = data.length;
    this.columns = data[0].length;
  }
  set(rowIndex, columnIndex, value) {
    this.data[rowIndex][columnIndex] = value;
    return this;
  }
  get(rowIndex, columnIndex) {
    return this.data[rowIndex][columnIndex];
  }
};
function wrap$1(array, options) {
  if (isAnyArray.isAnyArray(array)) {
    if (array[0] && isAnyArray.isAnyArray(array[0])) {
      return new WrapperMatrix2D$1(array);
    } else {
      return new WrapperMatrix1D$1(array, options);
    }
  } else {
    throw new Error("the argument is not an array");
  }
}
let LuDecomposition$1 = class LuDecomposition2 {
  constructor(matrix2) {
    matrix2 = WrapperMatrix2D$1.checkMatrix(matrix2);
    let lu = matrix2.clone();
    let rows = lu.rows;
    let columns = lu.columns;
    let pivotVector = new Float64Array(rows);
    let pivotSign = 1;
    let i2, j, k, p, s, t, v;
    let LUcolj, kmax;
    for (i2 = 0; i2 < rows; i2++) {
      pivotVector[i2] = i2;
    }
    LUcolj = new Float64Array(rows);
    for (j = 0; j < columns; j++) {
      for (i2 = 0; i2 < rows; i2++) {
        LUcolj[i2] = lu.get(i2, j);
      }
      for (i2 = 0; i2 < rows; i2++) {
        kmax = Math.min(i2, j);
        s = 0;
        for (k = 0; k < kmax; k++) {
          s += lu.get(i2, k) * LUcolj[k];
        }
        LUcolj[i2] -= s;
        lu.set(i2, j, LUcolj[i2]);
      }
      p = j;
      for (i2 = j + 1; i2 < rows; i2++) {
        if (Math.abs(LUcolj[i2]) > Math.abs(LUcolj[p])) {
          p = i2;
        }
      }
      if (p !== j) {
        for (k = 0; k < columns; k++) {
          t = lu.get(p, k);
          lu.set(p, k, lu.get(j, k));
          lu.set(j, k, t);
        }
        v = pivotVector[p];
        pivotVector[p] = pivotVector[j];
        pivotVector[j] = v;
        pivotSign = -pivotSign;
      }
      if (j < rows && lu.get(j, j) !== 0) {
        for (i2 = j + 1; i2 < rows; i2++) {
          lu.set(i2, j, lu.get(i2, j) / lu.get(j, j));
        }
      }
    }
    this.LU = lu;
    this.pivotVector = pivotVector;
    this.pivotSign = pivotSign;
  }
  isSingular() {
    let data = this.LU;
    let col = data.columns;
    for (let j = 0; j < col; j++) {
      if (data.get(j, j) === 0) {
        return true;
      }
    }
    return false;
  }
  solve(value) {
    value = Matrix$3.checkMatrix(value);
    let lu = this.LU;
    let rows = lu.rows;
    if (rows !== value.rows) {
      throw new Error("Invalid matrix dimensions");
    }
    if (this.isSingular()) {
      throw new Error("LU matrix is singular");
    }
    let count = value.columns;
    let X = value.subMatrixRow(this.pivotVector, 0, count - 1);
    let columns = lu.columns;
    let i2, j, k;
    for (k = 0; k < columns; k++) {
      for (i2 = k + 1; i2 < columns; i2++) {
        for (j = 0; j < count; j++) {
          X.set(i2, j, X.get(i2, j) - X.get(k, j) * lu.get(i2, k));
        }
      }
    }
    for (k = columns - 1; k >= 0; k--) {
      for (j = 0; j < count; j++) {
        X.set(k, j, X.get(k, j) / lu.get(k, k));
      }
      for (i2 = 0; i2 < k; i2++) {
        for (j = 0; j < count; j++) {
          X.set(i2, j, X.get(i2, j) - X.get(k, j) * lu.get(i2, k));
        }
      }
    }
    return X;
  }
  get determinant() {
    let data = this.LU;
    if (!data.isSquare()) {
      throw new Error("Matrix must be square");
    }
    let determinant2 = this.pivotSign;
    let col = data.columns;
    for (let j = 0; j < col; j++) {
      determinant2 *= data.get(j, j);
    }
    return determinant2;
  }
  get lowerTriangularMatrix() {
    let data = this.LU;
    let rows = data.rows;
    let columns = data.columns;
    let X = new Matrix$3(rows, columns);
    for (let i2 = 0; i2 < rows; i2++) {
      for (let j = 0; j < columns; j++) {
        if (i2 > j) {
          X.set(i2, j, data.get(i2, j));
        } else if (i2 === j) {
          X.set(i2, j, 1);
        } else {
          X.set(i2, j, 0);
        }
      }
    }
    return X;
  }
  get upperTriangularMatrix() {
    let data = this.LU;
    let rows = data.rows;
    let columns = data.columns;
    let X = new Matrix$3(rows, columns);
    for (let i2 = 0; i2 < rows; i2++) {
      for (let j = 0; j < columns; j++) {
        if (i2 <= j) {
          X.set(i2, j, data.get(i2, j));
        } else {
          X.set(i2, j, 0);
        }
      }
    }
    return X;
  }
  get pivotPermutationVector() {
    return Array.from(this.pivotVector);
  }
};
function hypotenuse$1(a, b) {
  let r = 0;
  if (Math.abs(a) > Math.abs(b)) {
    r = b / a;
    return Math.abs(a) * Math.sqrt(1 + r * r);
  }
  if (b !== 0) {
    r = a / b;
    return Math.abs(b) * Math.sqrt(1 + r * r);
  }
  return 0;
}
let QrDecomposition$1 = class QrDecomposition2 {
  constructor(value) {
    value = WrapperMatrix2D$1.checkMatrix(value);
    let qr = value.clone();
    let m = value.rows;
    let n = value.columns;
    let rdiag = new Float64Array(n);
    let i2, j, k, s;
    for (k = 0; k < n; k++) {
      let nrm = 0;
      for (i2 = k; i2 < m; i2++) {
        nrm = hypotenuse$1(nrm, qr.get(i2, k));
      }
      if (nrm !== 0) {
        if (qr.get(k, k) < 0) {
          nrm = -nrm;
        }
        for (i2 = k; i2 < m; i2++) {
          qr.set(i2, k, qr.get(i2, k) / nrm);
        }
        qr.set(k, k, qr.get(k, k) + 1);
        for (j = k + 1; j < n; j++) {
          s = 0;
          for (i2 = k; i2 < m; i2++) {
            s += qr.get(i2, k) * qr.get(i2, j);
          }
          s = -s / qr.get(k, k);
          for (i2 = k; i2 < m; i2++) {
            qr.set(i2, j, qr.get(i2, j) + s * qr.get(i2, k));
          }
        }
      }
      rdiag[k] = -nrm;
    }
    this.QR = qr;
    this.Rdiag = rdiag;
  }
  solve(value) {
    value = Matrix$3.checkMatrix(value);
    let qr = this.QR;
    let m = qr.rows;
    if (value.rows !== m) {
      throw new Error("Matrix row dimensions must agree");
    }
    if (!this.isFullRank()) {
      throw new Error("Matrix is rank deficient");
    }
    let count = value.columns;
    let X = value.clone();
    let n = qr.columns;
    let i2, j, k, s;
    for (k = 0; k < n; k++) {
      for (j = 0; j < count; j++) {
        s = 0;
        for (i2 = k; i2 < m; i2++) {
          s += qr.get(i2, k) * X.get(i2, j);
        }
        s = -s / qr.get(k, k);
        for (i2 = k; i2 < m; i2++) {
          X.set(i2, j, X.get(i2, j) + s * qr.get(i2, k));
        }
      }
    }
    for (k = n - 1; k >= 0; k--) {
      for (j = 0; j < count; j++) {
        X.set(k, j, X.get(k, j) / this.Rdiag[k]);
      }
      for (i2 = 0; i2 < k; i2++) {
        for (j = 0; j < count; j++) {
          X.set(i2, j, X.get(i2, j) - X.get(k, j) * qr.get(i2, k));
        }
      }
    }
    return X.subMatrix(0, n - 1, 0, count - 1);
  }
  isFullRank() {
    let columns = this.QR.columns;
    for (let i2 = 0; i2 < columns; i2++) {
      if (this.Rdiag[i2] === 0) {
        return false;
      }
    }
    return true;
  }
  get upperTriangularMatrix() {
    let qr = this.QR;
    let n = qr.columns;
    let X = new Matrix$3(n, n);
    let i2, j;
    for (i2 = 0; i2 < n; i2++) {
      for (j = 0; j < n; j++) {
        if (i2 < j) {
          X.set(i2, j, qr.get(i2, j));
        } else if (i2 === j) {
          X.set(i2, j, this.Rdiag[i2]);
        } else {
          X.set(i2, j, 0);
        }
      }
    }
    return X;
  }
  get orthogonalMatrix() {
    let qr = this.QR;
    let rows = qr.rows;
    let columns = qr.columns;
    let X = new Matrix$3(rows, columns);
    let i2, j, k, s;
    for (k = columns - 1; k >= 0; k--) {
      for (i2 = 0; i2 < rows; i2++) {
        X.set(i2, k, 0);
      }
      X.set(k, k, 1);
      for (j = k; j < columns; j++) {
        if (qr.get(k, k) !== 0) {
          s = 0;
          for (i2 = k; i2 < rows; i2++) {
            s += qr.get(i2, k) * X.get(i2, j);
          }
          s = -s / qr.get(k, k);
          for (i2 = k; i2 < rows; i2++) {
            X.set(i2, j, X.get(i2, j) + s * qr.get(i2, k));
          }
        }
      }
    }
    return X;
  }
};
let SingularValueDecomposition$1 = class SingularValueDecomposition2 {
  constructor(value, options = {}) {
    value = WrapperMatrix2D$1.checkMatrix(value);
    if (value.isEmpty()) {
      throw new Error("Matrix must be non-empty");
    }
    let m = value.rows;
    let n = value.columns;
    const {
      computeLeftSingularVectors = true,
      computeRightSingularVectors = true,
      autoTranspose = false
    } = options;
    let wantu = Boolean(computeLeftSingularVectors);
    let wantv = Boolean(computeRightSingularVectors);
    let swapped = false;
    let a;
    if (m < n) {
      if (!autoTranspose) {
        a = value.clone();
        console.warn(
          "Computing SVD on a matrix with more columns than rows. Consider enabling autoTranspose"
        );
      } else {
        a = value.transpose();
        m = a.rows;
        n = a.columns;
        swapped = true;
        let aux = wantu;
        wantu = wantv;
        wantv = aux;
      }
    } else {
      a = value.clone();
    }
    let nu = Math.min(m, n);
    let ni = Math.min(m + 1, n);
    let s = new Float64Array(ni);
    let U = new Matrix$3(m, nu);
    let V = new Matrix$3(n, n);
    let e = new Float64Array(n);
    let work2 = new Float64Array(m);
    let si = new Float64Array(ni);
    for (let i2 = 0; i2 < ni; i2++) si[i2] = i2;
    let nct = Math.min(m - 1, n);
    let nrt = Math.max(0, Math.min(n - 2, m));
    let mrc = Math.max(nct, nrt);
    for (let k = 0; k < mrc; k++) {
      if (k < nct) {
        s[k] = 0;
        for (let i2 = k; i2 < m; i2++) {
          s[k] = hypotenuse$1(s[k], a.get(i2, k));
        }
        if (s[k] !== 0) {
          if (a.get(k, k) < 0) {
            s[k] = -s[k];
          }
          for (let i2 = k; i2 < m; i2++) {
            a.set(i2, k, a.get(i2, k) / s[k]);
          }
          a.set(k, k, a.get(k, k) + 1);
        }
        s[k] = -s[k];
      }
      for (let j = k + 1; j < n; j++) {
        if (k < nct && s[k] !== 0) {
          let t = 0;
          for (let i2 = k; i2 < m; i2++) {
            t += a.get(i2, k) * a.get(i2, j);
          }
          t = -t / a.get(k, k);
          for (let i2 = k; i2 < m; i2++) {
            a.set(i2, j, a.get(i2, j) + t * a.get(i2, k));
          }
        }
        e[j] = a.get(k, j);
      }
      if (wantu && k < nct) {
        for (let i2 = k; i2 < m; i2++) {
          U.set(i2, k, a.get(i2, k));
        }
      }
      if (k < nrt) {
        e[k] = 0;
        for (let i2 = k + 1; i2 < n; i2++) {
          e[k] = hypotenuse$1(e[k], e[i2]);
        }
        if (e[k] !== 0) {
          if (e[k + 1] < 0) {
            e[k] = 0 - e[k];
          }
          for (let i2 = k + 1; i2 < n; i2++) {
            e[i2] /= e[k];
          }
          e[k + 1] += 1;
        }
        e[k] = -e[k];
        if (k + 1 < m && e[k] !== 0) {
          for (let i2 = k + 1; i2 < m; i2++) {
            work2[i2] = 0;
          }
          for (let i2 = k + 1; i2 < m; i2++) {
            for (let j = k + 1; j < n; j++) {
              work2[i2] += e[j] * a.get(i2, j);
            }
          }
          for (let j = k + 1; j < n; j++) {
            let t = -e[j] / e[k + 1];
            for (let i2 = k + 1; i2 < m; i2++) {
              a.set(i2, j, a.get(i2, j) + t * work2[i2]);
            }
          }
        }
        if (wantv) {
          for (let i2 = k + 1; i2 < n; i2++) {
            V.set(i2, k, e[i2]);
          }
        }
      }
    }
    let p = Math.min(n, m + 1);
    if (nct < n) {
      s[nct] = a.get(nct, nct);
    }
    if (m < p) {
      s[p - 1] = 0;
    }
    if (nrt + 1 < p) {
      e[nrt] = a.get(nrt, p - 1);
    }
    e[p - 1] = 0;
    if (wantu) {
      for (let j = nct; j < nu; j++) {
        for (let i2 = 0; i2 < m; i2++) {
          U.set(i2, j, 0);
        }
        U.set(j, j, 1);
      }
      for (let k = nct - 1; k >= 0; k--) {
        if (s[k] !== 0) {
          for (let j = k + 1; j < nu; j++) {
            let t = 0;
            for (let i2 = k; i2 < m; i2++) {
              t += U.get(i2, k) * U.get(i2, j);
            }
            t = -t / U.get(k, k);
            for (let i2 = k; i2 < m; i2++) {
              U.set(i2, j, U.get(i2, j) + t * U.get(i2, k));
            }
          }
          for (let i2 = k; i2 < m; i2++) {
            U.set(i2, k, -U.get(i2, k));
          }
          U.set(k, k, 1 + U.get(k, k));
          for (let i2 = 0; i2 < k - 1; i2++) {
            U.set(i2, k, 0);
          }
        } else {
          for (let i2 = 0; i2 < m; i2++) {
            U.set(i2, k, 0);
          }
          U.set(k, k, 1);
        }
      }
    }
    if (wantv) {
      for (let k = n - 1; k >= 0; k--) {
        if (k < nrt && e[k] !== 0) {
          for (let j = k + 1; j < n; j++) {
            let t = 0;
            for (let i2 = k + 1; i2 < n; i2++) {
              t += V.get(i2, k) * V.get(i2, j);
            }
            t = -t / V.get(k + 1, k);
            for (let i2 = k + 1; i2 < n; i2++) {
              V.set(i2, j, V.get(i2, j) + t * V.get(i2, k));
            }
          }
        }
        for (let i2 = 0; i2 < n; i2++) {
          V.set(i2, k, 0);
        }
        V.set(k, k, 1);
      }
    }
    let pp = p - 1;
    let eps = Number.EPSILON;
    while (p > 0) {
      let k, kase;
      for (k = p - 2; k >= -1; k--) {
        if (k === -1) {
          break;
        }
        const alpha = Number.MIN_VALUE + eps * Math.abs(s[k] + Math.abs(s[k + 1]));
        if (Math.abs(e[k]) <= alpha || Number.isNaN(e[k])) {
          e[k] = 0;
          break;
        }
      }
      if (k === p - 2) {
        kase = 4;
      } else {
        let ks;
        for (ks = p - 1; ks >= k; ks--) {
          if (ks === k) {
            break;
          }
          let t = (ks !== p ? Math.abs(e[ks]) : 0) + (ks !== k + 1 ? Math.abs(e[ks - 1]) : 0);
          if (Math.abs(s[ks]) <= eps * t) {
            s[ks] = 0;
            break;
          }
        }
        if (ks === k) {
          kase = 3;
        } else if (ks === p - 1) {
          kase = 1;
        } else {
          kase = 2;
          k = ks;
        }
      }
      k++;
      switch (kase) {
        case 1: {
          let f = e[p - 2];
          e[p - 2] = 0;
          for (let j = p - 2; j >= k; j--) {
            let t = hypotenuse$1(s[j], f);
            let cs = s[j] / t;
            let sn = f / t;
            s[j] = t;
            if (j !== k) {
              f = -sn * e[j - 1];
              e[j - 1] = cs * e[j - 1];
            }
            if (wantv) {
              for (let i2 = 0; i2 < n; i2++) {
                t = cs * V.get(i2, j) + sn * V.get(i2, p - 1);
                V.set(i2, p - 1, -sn * V.get(i2, j) + cs * V.get(i2, p - 1));
                V.set(i2, j, t);
              }
            }
          }
          break;
        }
        case 2: {
          let f = e[k - 1];
          e[k - 1] = 0;
          for (let j = k; j < p; j++) {
            let t = hypotenuse$1(s[j], f);
            let cs = s[j] / t;
            let sn = f / t;
            s[j] = t;
            f = -sn * e[j];
            e[j] = cs * e[j];
            if (wantu) {
              for (let i2 = 0; i2 < m; i2++) {
                t = cs * U.get(i2, j) + sn * U.get(i2, k - 1);
                U.set(i2, k - 1, -sn * U.get(i2, j) + cs * U.get(i2, k - 1));
                U.set(i2, j, t);
              }
            }
          }
          break;
        }
        case 3: {
          const scale = Math.max(
            Math.abs(s[p - 1]),
            Math.abs(s[p - 2]),
            Math.abs(e[p - 2]),
            Math.abs(s[k]),
            Math.abs(e[k])
          );
          const sp = s[p - 1] / scale;
          const spm1 = s[p - 2] / scale;
          const epm1 = e[p - 2] / scale;
          const sk = s[k] / scale;
          const ek = e[k] / scale;
          const b = ((spm1 + sp) * (spm1 - sp) + epm1 * epm1) / 2;
          const c = sp * epm1 * (sp * epm1);
          let shift = 0;
          if (b !== 0 || c !== 0) {
            if (b < 0) {
              shift = 0 - Math.sqrt(b * b + c);
            } else {
              shift = Math.sqrt(b * b + c);
            }
            shift = c / (b + shift);
          }
          let f = (sk + sp) * (sk - sp) + shift;
          let g = sk * ek;
          for (let j = k; j < p - 1; j++) {
            let t = hypotenuse$1(f, g);
            if (t === 0) t = Number.MIN_VALUE;
            let cs = f / t;
            let sn = g / t;
            if (j !== k) {
              e[j - 1] = t;
            }
            f = cs * s[j] + sn * e[j];
            e[j] = cs * e[j] - sn * s[j];
            g = sn * s[j + 1];
            s[j + 1] = cs * s[j + 1];
            if (wantv) {
              for (let i2 = 0; i2 < n; i2++) {
                t = cs * V.get(i2, j) + sn * V.get(i2, j + 1);
                V.set(i2, j + 1, -sn * V.get(i2, j) + cs * V.get(i2, j + 1));
                V.set(i2, j, t);
              }
            }
            t = hypotenuse$1(f, g);
            if (t === 0) t = Number.MIN_VALUE;
            cs = f / t;
            sn = g / t;
            s[j] = t;
            f = cs * e[j] + sn * s[j + 1];
            s[j + 1] = -sn * e[j] + cs * s[j + 1];
            g = sn * e[j + 1];
            e[j + 1] = cs * e[j + 1];
            if (wantu && j < m - 1) {
              for (let i2 = 0; i2 < m; i2++) {
                t = cs * U.get(i2, j) + sn * U.get(i2, j + 1);
                U.set(i2, j + 1, -sn * U.get(i2, j) + cs * U.get(i2, j + 1));
                U.set(i2, j, t);
              }
            }
          }
          e[p - 2] = f;
          break;
        }
        case 4: {
          if (s[k] <= 0) {
            s[k] = s[k] < 0 ? -s[k] : 0;
            if (wantv) {
              for (let i2 = 0; i2 <= pp; i2++) {
                V.set(i2, k, -V.get(i2, k));
              }
            }
          }
          while (k < pp) {
            if (s[k] >= s[k + 1]) {
              break;
            }
            let t = s[k];
            s[k] = s[k + 1];
            s[k + 1] = t;
            if (wantv && k < n - 1) {
              for (let i2 = 0; i2 < n; i2++) {
                t = V.get(i2, k + 1);
                V.set(i2, k + 1, V.get(i2, k));
                V.set(i2, k, t);
              }
            }
            if (wantu && k < m - 1) {
              for (let i2 = 0; i2 < m; i2++) {
                t = U.get(i2, k + 1);
                U.set(i2, k + 1, U.get(i2, k));
                U.set(i2, k, t);
              }
            }
            k++;
          }
          p--;
          break;
        }
      }
    }
    if (swapped) {
      let tmp = V;
      V = U;
      U = tmp;
    }
    this.m = m;
    this.n = n;
    this.s = s;
    this.U = U;
    this.V = V;
  }
  solve(value) {
    let Y = value;
    let e = this.threshold;
    let scols = this.s.length;
    let Ls = Matrix$3.zeros(scols, scols);
    for (let i2 = 0; i2 < scols; i2++) {
      if (Math.abs(this.s[i2]) <= e) {
        Ls.set(i2, i2, 0);
      } else {
        Ls.set(i2, i2, 1 / this.s[i2]);
      }
    }
    let U = this.U;
    let V = this.rightSingularVectors;
    let VL = V.mmul(Ls);
    let vrows = V.rows;
    let urows = U.rows;
    let VLU = Matrix$3.zeros(vrows, urows);
    for (let i2 = 0; i2 < vrows; i2++) {
      for (let j = 0; j < urows; j++) {
        let sum2 = 0;
        for (let k = 0; k < scols; k++) {
          sum2 += VL.get(i2, k) * U.get(j, k);
        }
        VLU.set(i2, j, sum2);
      }
    }
    return VLU.mmul(Y);
  }
  solveForDiagonal(value) {
    return this.solve(Matrix$3.diag(value));
  }
  inverse() {
    let V = this.V;
    let e = this.threshold;
    let vrows = V.rows;
    let vcols = V.columns;
    let X = new Matrix$3(vrows, this.s.length);
    for (let i2 = 0; i2 < vrows; i2++) {
      for (let j = 0; j < vcols; j++) {
        if (Math.abs(this.s[j]) > e) {
          X.set(i2, j, V.get(i2, j) / this.s[j]);
        }
      }
    }
    let U = this.U;
    let urows = U.rows;
    let ucols = U.columns;
    let Y = new Matrix$3(vrows, urows);
    for (let i2 = 0; i2 < vrows; i2++) {
      for (let j = 0; j < urows; j++) {
        let sum2 = 0;
        for (let k = 0; k < ucols; k++) {
          sum2 += X.get(i2, k) * U.get(j, k);
        }
        Y.set(i2, j, sum2);
      }
    }
    return Y;
  }
  get condition() {
    return this.s[0] / this.s[Math.min(this.m, this.n) - 1];
  }
  get norm2() {
    return this.s[0];
  }
  get rank() {
    let tol = Math.max(this.m, this.n) * this.s[0] * Number.EPSILON;
    let r = 0;
    let s = this.s;
    for (let i2 = 0, ii = s.length; i2 < ii; i2++) {
      if (s[i2] > tol) {
        r++;
      }
    }
    return r;
  }
  get diagonal() {
    return Array.from(this.s);
  }
  get threshold() {
    return Number.EPSILON / 2 * Math.max(this.m, this.n) * this.s[0];
  }
  get leftSingularVectors() {
    return this.U;
  }
  get rightSingularVectors() {
    return this.V;
  }
  get diagonalMatrix() {
    return Matrix$3.diag(this.s);
  }
};
function inverse$1(matrix2, useSVD = false) {
  matrix2 = WrapperMatrix2D$1.checkMatrix(matrix2);
  if (useSVD) {
    return new SingularValueDecomposition$1(matrix2).inverse();
  } else {
    return solve$1(matrix2, Matrix$3.eye(matrix2.rows));
  }
}
function solve$1(leftHandSide, rightHandSide, useSVD = false) {
  leftHandSide = WrapperMatrix2D$1.checkMatrix(leftHandSide);
  rightHandSide = WrapperMatrix2D$1.checkMatrix(rightHandSide);
  if (useSVD) {
    return new SingularValueDecomposition$1(leftHandSide).solve(rightHandSide);
  } else {
    return leftHandSide.isSquare() ? new LuDecomposition$1(leftHandSide).solve(rightHandSide) : new QrDecomposition$1(leftHandSide).solve(rightHandSide);
  }
}
function determinant$1(matrix2) {
  matrix2 = Matrix$3.checkMatrix(matrix2);
  if (matrix2.isSquare()) {
    if (matrix2.columns === 0) {
      return 1;
    }
    let a, b, c, d;
    if (matrix2.columns === 2) {
      a = matrix2.get(0, 0);
      b = matrix2.get(0, 1);
      c = matrix2.get(1, 0);
      d = matrix2.get(1, 1);
      return a * d - b * c;
    } else if (matrix2.columns === 3) {
      let subMatrix0, subMatrix1, subMatrix2;
      subMatrix0 = new MatrixSelectionView$1(matrix2, [1, 2], [1, 2]);
      subMatrix1 = new MatrixSelectionView$1(matrix2, [1, 2], [0, 2]);
      subMatrix2 = new MatrixSelectionView$1(matrix2, [1, 2], [0, 1]);
      a = matrix2.get(0, 0);
      b = matrix2.get(0, 1);
      c = matrix2.get(0, 2);
      return a * determinant$1(subMatrix0) - b * determinant$1(subMatrix1) + c * determinant$1(subMatrix2);
    } else {
      return new LuDecomposition$1(matrix2).determinant;
    }
  } else {
    throw Error("determinant can only be calculated for a square matrix");
  }
}
function xrange(n, exception) {
  let range = [];
  for (let i2 = 0; i2 < n; i2++) {
    if (i2 !== exception) {
      range.push(i2);
    }
  }
  return range;
}
function dependenciesOneRow(error, matrix2, index, thresholdValue = 1e-9, thresholdError = 1e-9) {
  if (error > thresholdError) {
    return new Array(matrix2.rows + 1).fill(0);
  } else {
    let returnArray = matrix2.addRow(index, [0]);
    for (let i2 = 0; i2 < returnArray.rows; i2++) {
      if (Math.abs(returnArray.get(i2, 0)) < thresholdValue) {
        returnArray.set(i2, 0, 0);
      }
    }
    return returnArray.to1DArray();
  }
}
function linearDependencies$1(matrix2, options = {}) {
  const { thresholdValue = 1e-9, thresholdError = 1e-9 } = options;
  matrix2 = Matrix$3.checkMatrix(matrix2);
  let n = matrix2.rows;
  let results = new Matrix$3(n, n);
  for (let i2 = 0; i2 < n; i2++) {
    let b = Matrix$3.columnVector(matrix2.getRow(i2));
    let Abis = matrix2.subMatrixRow(xrange(n, i2)).transpose();
    let svd = new SingularValueDecomposition$1(Abis);
    let x = svd.solve(b);
    let error = Matrix$3.sub(b, Abis.mmul(x)).abs().max();
    results.setRow(
      i2,
      dependenciesOneRow(error, x, i2, thresholdValue, thresholdError)
    );
  }
  return results;
}
function pseudoInverse$1(matrix2, threshold = Number.EPSILON) {
  matrix2 = Matrix$3.checkMatrix(matrix2);
  if (matrix2.isEmpty()) {
    return matrix2.transpose();
  }
  let svdSolution = new SingularValueDecomposition$1(matrix2, { autoTranspose: true });
  let U = svdSolution.leftSingularVectors;
  let V = svdSolution.rightSingularVectors;
  let s = svdSolution.diagonal;
  for (let i2 = 0; i2 < s.length; i2++) {
    if (Math.abs(s[i2]) > threshold) {
      s[i2] = 1 / s[i2];
    } else {
      s[i2] = 0;
    }
  }
  return V.mmul(Matrix$3.diag(s).mmul(U.transpose()));
}
function covariance$1(xMatrix, yMatrix = xMatrix, options = {}) {
  xMatrix = new Matrix$3(xMatrix);
  let yIsSame = false;
  if (typeof yMatrix === "object" && !Matrix$3.isMatrix(yMatrix) && !isAnyArray.isAnyArray(yMatrix)) {
    options = yMatrix;
    yMatrix = xMatrix;
    yIsSame = true;
  } else {
    yMatrix = new Matrix$3(yMatrix);
  }
  if (xMatrix.rows !== yMatrix.rows) {
    throw new TypeError("Both matrices must have the same number of rows");
  }
  const { center = true } = options;
  if (center) {
    xMatrix = xMatrix.center("column");
    if (!yIsSame) {
      yMatrix = yMatrix.center("column");
    }
  }
  const cov = xMatrix.transpose().mmul(yMatrix);
  for (let i2 = 0; i2 < cov.rows; i2++) {
    for (let j = 0; j < cov.columns; j++) {
      cov.set(i2, j, cov.get(i2, j) * (1 / (xMatrix.rows - 1)));
    }
  }
  return cov;
}
function correlation$1(xMatrix, yMatrix = xMatrix, options = {}) {
  xMatrix = new Matrix$3(xMatrix);
  let yIsSame = false;
  if (typeof yMatrix === "object" && !Matrix$3.isMatrix(yMatrix) && !isAnyArray.isAnyArray(yMatrix)) {
    options = yMatrix;
    yMatrix = xMatrix;
    yIsSame = true;
  } else {
    yMatrix = new Matrix$3(yMatrix);
  }
  if (xMatrix.rows !== yMatrix.rows) {
    throw new TypeError("Both matrices must have the same number of rows");
  }
  const { center = true, scale = true } = options;
  if (center) {
    xMatrix.center("column");
    if (!yIsSame) {
      yMatrix.center("column");
    }
  }
  if (scale) {
    xMatrix.scale("column");
    if (!yIsSame) {
      yMatrix.scale("column");
    }
  }
  const sdx = xMatrix.standardDeviation("column", { unbiased: true });
  const sdy = yIsSame ? sdx : yMatrix.standardDeviation("column", { unbiased: true });
  const corr = xMatrix.transpose().mmul(yMatrix);
  for (let i2 = 0; i2 < corr.rows; i2++) {
    for (let j = 0; j < corr.columns; j++) {
      corr.set(
        i2,
        j,
        corr.get(i2, j) * (1 / (sdx[i2] * sdy[j])) * (1 / (xMatrix.rows - 1))
      );
    }
  }
  return corr;
}
let EigenvalueDecomposition$1 = class EigenvalueDecomposition2 {
  constructor(matrix2, options = {}) {
    const { assumeSymmetric = false } = options;
    matrix2 = WrapperMatrix2D$1.checkMatrix(matrix2);
    if (!matrix2.isSquare()) {
      throw new Error("Matrix is not a square matrix");
    }
    if (matrix2.isEmpty()) {
      throw new Error("Matrix must be non-empty");
    }
    let n = matrix2.columns;
    let V = new Matrix$3(n, n);
    let d = new Float64Array(n);
    let e = new Float64Array(n);
    let value = matrix2;
    let i2, j;
    let isSymmetric = false;
    if (assumeSymmetric) {
      isSymmetric = true;
    } else {
      isSymmetric = matrix2.isSymmetric();
    }
    if (isSymmetric) {
      for (i2 = 0; i2 < n; i2++) {
        for (j = 0; j < n; j++) {
          V.set(i2, j, value.get(i2, j));
        }
      }
      tred2(n, e, d, V);
      tql2(n, e, d, V);
    } else {
      let H = new Matrix$3(n, n);
      let ort = new Float64Array(n);
      for (j = 0; j < n; j++) {
        for (i2 = 0; i2 < n; i2++) {
          H.set(i2, j, value.get(i2, j));
        }
      }
      orthes(n, H, ort, V);
      hqr2(n, e, d, V, H);
    }
    this.n = n;
    this.e = e;
    this.d = d;
    this.V = V;
  }
  get realEigenvalues() {
    return Array.from(this.d);
  }
  get imaginaryEigenvalues() {
    return Array.from(this.e);
  }
  get eigenvectorMatrix() {
    return this.V;
  }
  get diagonalMatrix() {
    let n = this.n;
    let e = this.e;
    let d = this.d;
    let X = new Matrix$3(n, n);
    let i2, j;
    for (i2 = 0; i2 < n; i2++) {
      for (j = 0; j < n; j++) {
        X.set(i2, j, 0);
      }
      X.set(i2, i2, d[i2]);
      if (e[i2] > 0) {
        X.set(i2, i2 + 1, e[i2]);
      } else if (e[i2] < 0) {
        X.set(i2, i2 - 1, e[i2]);
      }
    }
    return X;
  }
};
function tred2(n, e, d, V) {
  let f, g, h, i2, j, k, hh, scale;
  for (j = 0; j < n; j++) {
    d[j] = V.get(n - 1, j);
  }
  for (i2 = n - 1; i2 > 0; i2--) {
    scale = 0;
    h = 0;
    for (k = 0; k < i2; k++) {
      scale = scale + Math.abs(d[k]);
    }
    if (scale === 0) {
      e[i2] = d[i2 - 1];
      for (j = 0; j < i2; j++) {
        d[j] = V.get(i2 - 1, j);
        V.set(i2, j, 0);
        V.set(j, i2, 0);
      }
    } else {
      for (k = 0; k < i2; k++) {
        d[k] /= scale;
        h += d[k] * d[k];
      }
      f = d[i2 - 1];
      g = Math.sqrt(h);
      if (f > 0) {
        g = -g;
      }
      e[i2] = scale * g;
      h = h - f * g;
      d[i2 - 1] = f - g;
      for (j = 0; j < i2; j++) {
        e[j] = 0;
      }
      for (j = 0; j < i2; j++) {
        f = d[j];
        V.set(j, i2, f);
        g = e[j] + V.get(j, j) * f;
        for (k = j + 1; k <= i2 - 1; k++) {
          g += V.get(k, j) * d[k];
          e[k] += V.get(k, j) * f;
        }
        e[j] = g;
      }
      f = 0;
      for (j = 0; j < i2; j++) {
        e[j] /= h;
        f += e[j] * d[j];
      }
      hh = f / (h + h);
      for (j = 0; j < i2; j++) {
        e[j] -= hh * d[j];
      }
      for (j = 0; j < i2; j++) {
        f = d[j];
        g = e[j];
        for (k = j; k <= i2 - 1; k++) {
          V.set(k, j, V.get(k, j) - (f * e[k] + g * d[k]));
        }
        d[j] = V.get(i2 - 1, j);
        V.set(i2, j, 0);
      }
    }
    d[i2] = h;
  }
  for (i2 = 0; i2 < n - 1; i2++) {
    V.set(n - 1, i2, V.get(i2, i2));
    V.set(i2, i2, 1);
    h = d[i2 + 1];
    if (h !== 0) {
      for (k = 0; k <= i2; k++) {
        d[k] = V.get(k, i2 + 1) / h;
      }
      for (j = 0; j <= i2; j++) {
        g = 0;
        for (k = 0; k <= i2; k++) {
          g += V.get(k, i2 + 1) * V.get(k, j);
        }
        for (k = 0; k <= i2; k++) {
          V.set(k, j, V.get(k, j) - g * d[k]);
        }
      }
    }
    for (k = 0; k <= i2; k++) {
      V.set(k, i2 + 1, 0);
    }
  }
  for (j = 0; j < n; j++) {
    d[j] = V.get(n - 1, j);
    V.set(n - 1, j, 0);
  }
  V.set(n - 1, n - 1, 1);
  e[0] = 0;
}
function tql2(n, e, d, V) {
  let g, h, i2, j, k, l, m, p, r, dl1, c, c2, c3, el1, s, s2;
  for (i2 = 1; i2 < n; i2++) {
    e[i2 - 1] = e[i2];
  }
  e[n - 1] = 0;
  let f = 0;
  let tst1 = 0;
  let eps = Number.EPSILON;
  for (l = 0; l < n; l++) {
    tst1 = Math.max(tst1, Math.abs(d[l]) + Math.abs(e[l]));
    m = l;
    while (m < n) {
      if (Math.abs(e[m]) <= eps * tst1) {
        break;
      }
      m++;
    }
    if (m > l) {
      do {
        g = d[l];
        p = (d[l + 1] - g) / (2 * e[l]);
        r = hypotenuse$1(p, 1);
        if (p < 0) {
          r = -r;
        }
        d[l] = e[l] / (p + r);
        d[l + 1] = e[l] * (p + r);
        dl1 = d[l + 1];
        h = g - d[l];
        for (i2 = l + 2; i2 < n; i2++) {
          d[i2] -= h;
        }
        f = f + h;
        p = d[m];
        c = 1;
        c2 = c;
        c3 = c;
        el1 = e[l + 1];
        s = 0;
        s2 = 0;
        for (i2 = m - 1; i2 >= l; i2--) {
          c3 = c2;
          c2 = c;
          s2 = s;
          g = c * e[i2];
          h = c * p;
          r = hypotenuse$1(p, e[i2]);
          e[i2 + 1] = s * r;
          s = e[i2] / r;
          c = p / r;
          p = c * d[i2] - s * g;
          d[i2 + 1] = h + s * (c * g + s * d[i2]);
          for (k = 0; k < n; k++) {
            h = V.get(k, i2 + 1);
            V.set(k, i2 + 1, s * V.get(k, i2) + c * h);
            V.set(k, i2, c * V.get(k, i2) - s * h);
          }
        }
        p = -s * s2 * c3 * el1 * e[l] / dl1;
        e[l] = s * p;
        d[l] = c * p;
      } while (Math.abs(e[l]) > eps * tst1);
    }
    d[l] = d[l] + f;
    e[l] = 0;
  }
  for (i2 = 0; i2 < n - 1; i2++) {
    k = i2;
    p = d[i2];
    for (j = i2 + 1; j < n; j++) {
      if (d[j] < p) {
        k = j;
        p = d[j];
      }
    }
    if (k !== i2) {
      d[k] = d[i2];
      d[i2] = p;
      for (j = 0; j < n; j++) {
        p = V.get(j, i2);
        V.set(j, i2, V.get(j, k));
        V.set(j, k, p);
      }
    }
  }
}
function orthes(n, H, ort, V) {
  let low = 0;
  let high = n - 1;
  let f, g, h, i2, j, m;
  let scale;
  for (m = low + 1; m <= high - 1; m++) {
    scale = 0;
    for (i2 = m; i2 <= high; i2++) {
      scale = scale + Math.abs(H.get(i2, m - 1));
    }
    if (scale !== 0) {
      h = 0;
      for (i2 = high; i2 >= m; i2--) {
        ort[i2] = H.get(i2, m - 1) / scale;
        h += ort[i2] * ort[i2];
      }
      g = Math.sqrt(h);
      if (ort[m] > 0) {
        g = -g;
      }
      h = h - ort[m] * g;
      ort[m] = ort[m] - g;
      for (j = m; j < n; j++) {
        f = 0;
        for (i2 = high; i2 >= m; i2--) {
          f += ort[i2] * H.get(i2, j);
        }
        f = f / h;
        for (i2 = m; i2 <= high; i2++) {
          H.set(i2, j, H.get(i2, j) - f * ort[i2]);
        }
      }
      for (i2 = 0; i2 <= high; i2++) {
        f = 0;
        for (j = high; j >= m; j--) {
          f += ort[j] * H.get(i2, j);
        }
        f = f / h;
        for (j = m; j <= high; j++) {
          H.set(i2, j, H.get(i2, j) - f * ort[j]);
        }
      }
      ort[m] = scale * ort[m];
      H.set(m, m - 1, scale * g);
    }
  }
  for (i2 = 0; i2 < n; i2++) {
    for (j = 0; j < n; j++) {
      V.set(i2, j, i2 === j ? 1 : 0);
    }
  }
  for (m = high - 1; m >= low + 1; m--) {
    if (H.get(m, m - 1) !== 0) {
      for (i2 = m + 1; i2 <= high; i2++) {
        ort[i2] = H.get(i2, m - 1);
      }
      for (j = m; j <= high; j++) {
        g = 0;
        for (i2 = m; i2 <= high; i2++) {
          g += ort[i2] * V.get(i2, j);
        }
        g = g / ort[m] / H.get(m, m - 1);
        for (i2 = m; i2 <= high; i2++) {
          V.set(i2, j, V.get(i2, j) + g * ort[i2]);
        }
      }
    }
  }
}
function hqr2(nn, e, d, V, H) {
  let n = nn - 1;
  let low = 0;
  let high = nn - 1;
  let eps = Number.EPSILON;
  let exshift = 0;
  let norm = 0;
  let p = 0;
  let q = 0;
  let r = 0;
  let s = 0;
  let z = 0;
  let iter = 0;
  let i2, j, k, l, m, t, w, x, y;
  let ra, sa, vr, vi;
  let notlast, cdivres;
  for (i2 = 0; i2 < nn; i2++) {
    if (i2 < low || i2 > high) {
      d[i2] = H.get(i2, i2);
      e[i2] = 0;
    }
    for (j = Math.max(i2 - 1, 0); j < nn; j++) {
      norm = norm + Math.abs(H.get(i2, j));
    }
  }
  while (n >= low) {
    l = n;
    while (l > low) {
      s = Math.abs(H.get(l - 1, l - 1)) + Math.abs(H.get(l, l));
      if (s === 0) {
        s = norm;
      }
      if (Math.abs(H.get(l, l - 1)) < eps * s) {
        break;
      }
      l--;
    }
    if (l === n) {
      H.set(n, n, H.get(n, n) + exshift);
      d[n] = H.get(n, n);
      e[n] = 0;
      n--;
      iter = 0;
    } else if (l === n - 1) {
      w = H.get(n, n - 1) * H.get(n - 1, n);
      p = (H.get(n - 1, n - 1) - H.get(n, n)) / 2;
      q = p * p + w;
      z = Math.sqrt(Math.abs(q));
      H.set(n, n, H.get(n, n) + exshift);
      H.set(n - 1, n - 1, H.get(n - 1, n - 1) + exshift);
      x = H.get(n, n);
      if (q >= 0) {
        z = p >= 0 ? p + z : p - z;
        d[n - 1] = x + z;
        d[n] = d[n - 1];
        if (z !== 0) {
          d[n] = x - w / z;
        }
        e[n - 1] = 0;
        e[n] = 0;
        x = H.get(n, n - 1);
        s = Math.abs(x) + Math.abs(z);
        p = x / s;
        q = z / s;
        r = Math.sqrt(p * p + q * q);
        p = p / r;
        q = q / r;
        for (j = n - 1; j < nn; j++) {
          z = H.get(n - 1, j);
          H.set(n - 1, j, q * z + p * H.get(n, j));
          H.set(n, j, q * H.get(n, j) - p * z);
        }
        for (i2 = 0; i2 <= n; i2++) {
          z = H.get(i2, n - 1);
          H.set(i2, n - 1, q * z + p * H.get(i2, n));
          H.set(i2, n, q * H.get(i2, n) - p * z);
        }
        for (i2 = low; i2 <= high; i2++) {
          z = V.get(i2, n - 1);
          V.set(i2, n - 1, q * z + p * V.get(i2, n));
          V.set(i2, n, q * V.get(i2, n) - p * z);
        }
      } else {
        d[n - 1] = x + p;
        d[n] = x + p;
        e[n - 1] = z;
        e[n] = -z;
      }
      n = n - 2;
      iter = 0;
    } else {
      x = H.get(n, n);
      y = 0;
      w = 0;
      if (l < n) {
        y = H.get(n - 1, n - 1);
        w = H.get(n, n - 1) * H.get(n - 1, n);
      }
      if (iter === 10) {
        exshift += x;
        for (i2 = low; i2 <= n; i2++) {
          H.set(i2, i2, H.get(i2, i2) - x);
        }
        s = Math.abs(H.get(n, n - 1)) + Math.abs(H.get(n - 1, n - 2));
        x = y = 0.75 * s;
        w = -0.4375 * s * s;
      }
      if (iter === 30) {
        s = (y - x) / 2;
        s = s * s + w;
        if (s > 0) {
          s = Math.sqrt(s);
          if (y < x) {
            s = -s;
          }
          s = x - w / ((y - x) / 2 + s);
          for (i2 = low; i2 <= n; i2++) {
            H.set(i2, i2, H.get(i2, i2) - s);
          }
          exshift += s;
          x = y = w = 0.964;
        }
      }
      iter = iter + 1;
      m = n - 2;
      while (m >= l) {
        z = H.get(m, m);
        r = x - z;
        s = y - z;
        p = (r * s - w) / H.get(m + 1, m) + H.get(m, m + 1);
        q = H.get(m + 1, m + 1) - z - r - s;
        r = H.get(m + 2, m + 1);
        s = Math.abs(p) + Math.abs(q) + Math.abs(r);
        p = p / s;
        q = q / s;
        r = r / s;
        if (m === l) {
          break;
        }
        if (Math.abs(H.get(m, m - 1)) * (Math.abs(q) + Math.abs(r)) < eps * (Math.abs(p) * (Math.abs(H.get(m - 1, m - 1)) + Math.abs(z) + Math.abs(H.get(m + 1, m + 1))))) {
          break;
        }
        m--;
      }
      for (i2 = m + 2; i2 <= n; i2++) {
        H.set(i2, i2 - 2, 0);
        if (i2 > m + 2) {
          H.set(i2, i2 - 3, 0);
        }
      }
      for (k = m; k <= n - 1; k++) {
        notlast = k !== n - 1;
        if (k !== m) {
          p = H.get(k, k - 1);
          q = H.get(k + 1, k - 1);
          r = notlast ? H.get(k + 2, k - 1) : 0;
          x = Math.abs(p) + Math.abs(q) + Math.abs(r);
          if (x !== 0) {
            p = p / x;
            q = q / x;
            r = r / x;
          }
        }
        if (x === 0) {
          break;
        }
        s = Math.sqrt(p * p + q * q + r * r);
        if (p < 0) {
          s = -s;
        }
        if (s !== 0) {
          if (k !== m) {
            H.set(k, k - 1, -s * x);
          } else if (l !== m) {
            H.set(k, k - 1, -H.get(k, k - 1));
          }
          p = p + s;
          x = p / s;
          y = q / s;
          z = r / s;
          q = q / p;
          r = r / p;
          for (j = k; j < nn; j++) {
            p = H.get(k, j) + q * H.get(k + 1, j);
            if (notlast) {
              p = p + r * H.get(k + 2, j);
              H.set(k + 2, j, H.get(k + 2, j) - p * z);
            }
            H.set(k, j, H.get(k, j) - p * x);
            H.set(k + 1, j, H.get(k + 1, j) - p * y);
          }
          for (i2 = 0; i2 <= Math.min(n, k + 3); i2++) {
            p = x * H.get(i2, k) + y * H.get(i2, k + 1);
            if (notlast) {
              p = p + z * H.get(i2, k + 2);
              H.set(i2, k + 2, H.get(i2, k + 2) - p * r);
            }
            H.set(i2, k, H.get(i2, k) - p);
            H.set(i2, k + 1, H.get(i2, k + 1) - p * q);
          }
          for (i2 = low; i2 <= high; i2++) {
            p = x * V.get(i2, k) + y * V.get(i2, k + 1);
            if (notlast) {
              p = p + z * V.get(i2, k + 2);
              V.set(i2, k + 2, V.get(i2, k + 2) - p * r);
            }
            V.set(i2, k, V.get(i2, k) - p);
            V.set(i2, k + 1, V.get(i2, k + 1) - p * q);
          }
        }
      }
    }
  }
  if (norm === 0) {
    return;
  }
  for (n = nn - 1; n >= 0; n--) {
    p = d[n];
    q = e[n];
    if (q === 0) {
      l = n;
      H.set(n, n, 1);
      for (i2 = n - 1; i2 >= 0; i2--) {
        w = H.get(i2, i2) - p;
        r = 0;
        for (j = l; j <= n; j++) {
          r = r + H.get(i2, j) * H.get(j, n);
        }
        if (e[i2] < 0) {
          z = w;
          s = r;
        } else {
          l = i2;
          if (e[i2] === 0) {
            H.set(i2, n, w !== 0 ? -r / w : -r / (eps * norm));
          } else {
            x = H.get(i2, i2 + 1);
            y = H.get(i2 + 1, i2);
            q = (d[i2] - p) * (d[i2] - p) + e[i2] * e[i2];
            t = (x * s - z * r) / q;
            H.set(i2, n, t);
            H.set(
              i2 + 1,
              n,
              Math.abs(x) > Math.abs(z) ? (-r - w * t) / x : (-s - y * t) / z
            );
          }
          t = Math.abs(H.get(i2, n));
          if (eps * t * t > 1) {
            for (j = i2; j <= n; j++) {
              H.set(j, n, H.get(j, n) / t);
            }
          }
        }
      }
    } else if (q < 0) {
      l = n - 1;
      if (Math.abs(H.get(n, n - 1)) > Math.abs(H.get(n - 1, n))) {
        H.set(n - 1, n - 1, q / H.get(n, n - 1));
        H.set(n - 1, n, -(H.get(n, n) - p) / H.get(n, n - 1));
      } else {
        cdivres = cdiv(0, -H.get(n - 1, n), H.get(n - 1, n - 1) - p, q);
        H.set(n - 1, n - 1, cdivres[0]);
        H.set(n - 1, n, cdivres[1]);
      }
      H.set(n, n - 1, 0);
      H.set(n, n, 1);
      for (i2 = n - 2; i2 >= 0; i2--) {
        ra = 0;
        sa = 0;
        for (j = l; j <= n; j++) {
          ra = ra + H.get(i2, j) * H.get(j, n - 1);
          sa = sa + H.get(i2, j) * H.get(j, n);
        }
        w = H.get(i2, i2) - p;
        if (e[i2] < 0) {
          z = w;
          r = ra;
          s = sa;
        } else {
          l = i2;
          if (e[i2] === 0) {
            cdivres = cdiv(-ra, -sa, w, q);
            H.set(i2, n - 1, cdivres[0]);
            H.set(i2, n, cdivres[1]);
          } else {
            x = H.get(i2, i2 + 1);
            y = H.get(i2 + 1, i2);
            vr = (d[i2] - p) * (d[i2] - p) + e[i2] * e[i2] - q * q;
            vi = (d[i2] - p) * 2 * q;
            if (vr === 0 && vi === 0) {
              vr = eps * norm * (Math.abs(w) + Math.abs(q) + Math.abs(x) + Math.abs(y) + Math.abs(z));
            }
            cdivres = cdiv(
              x * r - z * ra + q * sa,
              x * s - z * sa - q * ra,
              vr,
              vi
            );
            H.set(i2, n - 1, cdivres[0]);
            H.set(i2, n, cdivres[1]);
            if (Math.abs(x) > Math.abs(z) + Math.abs(q)) {
              H.set(
                i2 + 1,
                n - 1,
                (-ra - w * H.get(i2, n - 1) + q * H.get(i2, n)) / x
              );
              H.set(
                i2 + 1,
                n,
                (-sa - w * H.get(i2, n) - q * H.get(i2, n - 1)) / x
              );
            } else {
              cdivres = cdiv(
                -r - y * H.get(i2, n - 1),
                -s - y * H.get(i2, n),
                z,
                q
              );
              H.set(i2 + 1, n - 1, cdivres[0]);
              H.set(i2 + 1, n, cdivres[1]);
            }
          }
          t = Math.max(Math.abs(H.get(i2, n - 1)), Math.abs(H.get(i2, n)));
          if (eps * t * t > 1) {
            for (j = i2; j <= n; j++) {
              H.set(j, n - 1, H.get(j, n - 1) / t);
              H.set(j, n, H.get(j, n) / t);
            }
          }
        }
      }
    }
  }
  for (i2 = 0; i2 < nn; i2++) {
    if (i2 < low || i2 > high) {
      for (j = i2; j < nn; j++) {
        V.set(i2, j, H.get(i2, j));
      }
    }
  }
  for (j = nn - 1; j >= low; j--) {
    for (i2 = low; i2 <= high; i2++) {
      z = 0;
      for (k = low; k <= Math.min(j, high); k++) {
        z = z + V.get(i2, k) * H.get(k, j);
      }
      V.set(i2, j, z);
    }
  }
}
function cdiv(xr, xi, yr, yi) {
  let r, d;
  if (Math.abs(yr) > Math.abs(yi)) {
    r = yi / yr;
    d = yr + r * yi;
    return [(xr + r * xi) / d, (xi - r * xr) / d];
  } else {
    r = yr / yi;
    d = yi + r * yr;
    return [(r * xr + xi) / d, (r * xi - xr) / d];
  }
}
let CholeskyDecomposition$1 = class CholeskyDecomposition2 {
  constructor(value) {
    value = WrapperMatrix2D$1.checkMatrix(value);
    if (!value.isSymmetric()) {
      throw new Error("Matrix is not symmetric");
    }
    let a = value;
    let dimension = a.rows;
    let l = new Matrix$3(dimension, dimension);
    let positiveDefinite = true;
    let i2, j, k;
    for (j = 0; j < dimension; j++) {
      let d = 0;
      for (k = 0; k < j; k++) {
        let s = 0;
        for (i2 = 0; i2 < k; i2++) {
          s += l.get(k, i2) * l.get(j, i2);
        }
        s = (a.get(j, k) - s) / l.get(k, k);
        l.set(j, k, s);
        d = d + s * s;
      }
      d = a.get(j, j) - d;
      positiveDefinite && (positiveDefinite = d > 0);
      l.set(j, j, Math.sqrt(Math.max(d, 0)));
      for (k = j + 1; k < dimension; k++) {
        l.set(j, k, 0);
      }
    }
    this.L = l;
    this.positiveDefinite = positiveDefinite;
  }
  isPositiveDefinite() {
    return this.positiveDefinite;
  }
  solve(value) {
    value = WrapperMatrix2D$1.checkMatrix(value);
    let l = this.L;
    let dimension = l.rows;
    if (value.rows !== dimension) {
      throw new Error("Matrix dimensions do not match");
    }
    if (this.isPositiveDefinite() === false) {
      throw new Error("Matrix is not positive definite");
    }
    let count = value.columns;
    let B = value.clone();
    let i2, j, k;
    for (k = 0; k < dimension; k++) {
      for (j = 0; j < count; j++) {
        for (i2 = 0; i2 < k; i2++) {
          B.set(k, j, B.get(k, j) - B.get(i2, j) * l.get(k, i2));
        }
        B.set(k, j, B.get(k, j) / l.get(k, k));
      }
    }
    for (k = dimension - 1; k >= 0; k--) {
      for (j = 0; j < count; j++) {
        for (i2 = k + 1; i2 < dimension; i2++) {
          B.set(k, j, B.get(k, j) - B.get(i2, j) * l.get(i2, k));
        }
        B.set(k, j, B.get(k, j) / l.get(k, k));
      }
    }
    return B;
  }
  get lowerTriangularMatrix() {
    return this.L;
  }
};
class nipals {
  constructor(X, options = {}) {
    X = WrapperMatrix2D$1.checkMatrix(X);
    let { Y } = options;
    const {
      scaleScores = false,
      maxIterations = 1e3,
      terminationCriteria = 1e-10
    } = options;
    let u;
    if (Y) {
      if (isAnyArray.isAnyArray(Y) && typeof Y[0] === "number") {
        Y = Matrix$3.columnVector(Y);
      } else {
        Y = WrapperMatrix2D$1.checkMatrix(Y);
      }
      if (Y.rows !== X.rows) {
        throw new Error("Y should have the same number of rows as X");
      }
      u = Y.getColumnVector(0);
    } else {
      u = X.getColumnVector(0);
    }
    let diff = 1;
    let t, q, w, tOld;
    for (let counter = 0; counter < maxIterations && diff > terminationCriteria; counter++) {
      w = X.transpose().mmul(u).div(u.transpose().mmul(u).get(0, 0));
      w = w.div(w.norm());
      t = X.mmul(w).div(w.transpose().mmul(w).get(0, 0));
      if (counter > 0) {
        diff = t.clone().sub(tOld).pow(2).sum();
      }
      tOld = t.clone();
      if (Y) {
        q = Y.transpose().mmul(t).div(t.transpose().mmul(t).get(0, 0));
        q = q.div(q.norm());
        u = Y.mmul(q).div(q.transpose().mmul(q).get(0, 0));
      } else {
        u = t;
      }
    }
    if (Y) {
      let p = X.transpose().mmul(t).div(t.transpose().mmul(t).get(0, 0));
      p = p.div(p.norm());
      let xResidual = X.clone().sub(t.clone().mmul(p.transpose()));
      let residual = u.transpose().mmul(t).div(t.transpose().mmul(t).get(0, 0));
      let yResidual = Y.clone().sub(
        t.clone().mulS(residual.get(0, 0)).mmul(q.transpose())
      );
      this.t = t;
      this.p = p.transpose();
      this.w = w.transpose();
      this.q = q;
      this.u = u;
      this.s = t.transpose().mmul(t);
      this.xResidual = xResidual;
      this.yResidual = yResidual;
      this.betas = residual;
    } else {
      this.w = w.transpose();
      this.s = t.transpose().mmul(t).sqrt();
      if (scaleScores) {
        this.t = t.clone().div(this.s.get(0, 0));
      } else {
        this.t = t;
      }
      this.xResidual = X.sub(t.mmul(w.transpose()));
    }
  }
}
var AbstractMatrix_1 = matrix$2.AbstractMatrix = AbstractMatrix$1;
var CHO$1 = matrix$2.CHO = CholeskyDecomposition$1;
var CholeskyDecomposition_1 = matrix$2.CholeskyDecomposition = CholeskyDecomposition$1;
var DistanceMatrix_1 = matrix$2.DistanceMatrix = DistanceMatrix$1;
var EVD$1 = matrix$2.EVD = EigenvalueDecomposition$1;
var EigenvalueDecomposition_1 = matrix$2.EigenvalueDecomposition = EigenvalueDecomposition$1;
var LU$1 = matrix$2.LU = LuDecomposition$1;
var LuDecomposition_1 = matrix$2.LuDecomposition = LuDecomposition$1;
var Matrix_1 = matrix$2.Matrix = Matrix$3;
var MatrixColumnSelectionView_1 = matrix$2.MatrixColumnSelectionView = MatrixColumnSelectionView$1;
var MatrixColumnView_1 = matrix$2.MatrixColumnView = MatrixColumnView$1;
var MatrixFlipColumnView_1 = matrix$2.MatrixFlipColumnView = MatrixFlipColumnView$1;
var MatrixFlipRowView_1 = matrix$2.MatrixFlipRowView = MatrixFlipRowView$1;
var MatrixRowSelectionView_1 = matrix$2.MatrixRowSelectionView = MatrixRowSelectionView$1;
var MatrixRowView_1 = matrix$2.MatrixRowView = MatrixRowView$1;
var MatrixSelectionView_1 = matrix$2.MatrixSelectionView = MatrixSelectionView$1;
var MatrixSubView_1 = matrix$2.MatrixSubView = MatrixSubView$1;
var MatrixTransposeView_1 = matrix$2.MatrixTransposeView = MatrixTransposeView$2;
var NIPALS$1 = matrix$2.NIPALS = nipals;
var Nipals$1 = matrix$2.Nipals = nipals;
var QR$1 = matrix$2.QR = QrDecomposition$1;
var QrDecomposition_1 = matrix$2.QrDecomposition = QrDecomposition$1;
var SVD$1 = matrix$2.SVD = SingularValueDecomposition$1;
var SingularValueDecomposition_1 = matrix$2.SingularValueDecomposition = SingularValueDecomposition$1;
var SymmetricMatrix_1 = matrix$2.SymmetricMatrix = SymmetricMatrix$1;
var WrapperMatrix1D_1 = matrix$2.WrapperMatrix1D = WrapperMatrix1D$1;
var WrapperMatrix2D_1 = matrix$2.WrapperMatrix2D = WrapperMatrix2D$1;
var correlation_1 = matrix$2.correlation = correlation$1;
var covariance_1 = matrix$2.covariance = covariance$1;
var _default = matrix$2.default = Matrix$3;
var determinant_1 = matrix$2.determinant = determinant$1;
var inverse_1 = matrix$2.inverse = inverse$1;
var linearDependencies_1 = matrix$2.linearDependencies = linearDependencies$1;
var pseudoInverse_1 = matrix$2.pseudoInverse = pseudoInverse$1;
var solve_1 = matrix$2.solve = solve$1;
var wrap_1 = matrix$2.wrap = wrap$1;
const AbstractMatrix = AbstractMatrix_1;
const CHO = CHO$1;
const CholeskyDecomposition = CholeskyDecomposition_1;
const DistanceMatrix = DistanceMatrix_1;
const EVD = EVD$1;
const EigenvalueDecomposition = EigenvalueDecomposition_1;
const LU = LU$1;
const LuDecomposition = LuDecomposition_1;
const Matrix$2 = Matrix_1;
const MatrixColumnSelectionView = MatrixColumnSelectionView_1;
const MatrixColumnView = MatrixColumnView_1;
const MatrixFlipColumnView = MatrixFlipColumnView_1;
const MatrixFlipRowView = MatrixFlipRowView_1;
const MatrixRowSelectionView = MatrixRowSelectionView_1;
const MatrixRowView = MatrixRowView_1;
const MatrixSelectionView = MatrixSelectionView_1;
const MatrixSubView = MatrixSubView_1;
const MatrixTransposeView$1 = MatrixTransposeView_1;
const NIPALS = NIPALS$1;
const Nipals = Nipals$1;
const QR = QR$1;
const QrDecomposition = QrDecomposition_1;
const SVD = SVD$1;
const SingularValueDecomposition = SingularValueDecomposition_1;
const SymmetricMatrix = SymmetricMatrix_1;
const WrapperMatrix1D = WrapperMatrix1D_1;
const WrapperMatrix2D = WrapperMatrix2D_1;
const correlation = correlation_1;
const covariance = covariance_1;
const matrix = _default.Matrix ? _default.Matrix : Matrix_1;
const determinant = determinant_1;
const inverse = inverse_1;
const linearDependencies = linearDependencies_1;
const pseudoInverse = pseudoInverse_1;
const solve = solve_1;
const wrap = wrap_1;
const matrix$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  AbstractMatrix,
  CHO,
  CholeskyDecomposition,
  DistanceMatrix,
  EVD,
  EigenvalueDecomposition,
  LU,
  LuDecomposition,
  Matrix: Matrix$2,
  MatrixColumnSelectionView,
  MatrixColumnView,
  MatrixFlipColumnView,
  MatrixFlipRowView,
  MatrixRowSelectionView,
  MatrixRowView,
  MatrixSelectionView,
  MatrixSubView,
  MatrixTransposeView: MatrixTransposeView$1,
  NIPALS,
  Nipals,
  QR,
  QrDecomposition,
  SVD,
  SingularValueDecomposition,
  SymmetricMatrix,
  WrapperMatrix1D,
  WrapperMatrix2D,
  correlation,
  covariance,
  default: matrix,
  determinant,
  inverse,
  linearDependencies,
  pseudoInverse,
  solve,
  wrap
}, Symbol.toStringTag, { value: "Module" }));
function getSeparatedKernel(kernel2) {
  const svd = new SVD(kernel2, { autoTranspose: true });
  if (svd.rank !== 1) return null;
  const s = Math.sqrt(svd.s[0]);
  const v = svd.U.to2DArray().map((v2) => v2[0] * s);
  const h = svd.V.to2DArray().map((h2) => h2[0] * s);
  return [v, h];
}
function convolution(kernel2, options = {}) {
  let {
    channels,
    bitDepth,
    normalize: normalize2 = false,
    divisor = 1,
    border = "copy",
    algorithm = "auto"
  } = options;
  let createOptions = {};
  if (bitDepth) createOptions.bitDepth = bitDepth;
  let newImage = Image.createFrom(this, createOptions);
  channels = validateArrayOfChannels(this, channels);
  if (algorithm !== "separable") {
    ({ kernel: kernel2 } = validateKernel(kernel2));
  } else if (!Array.isArray(kernel2) || kernel2.length !== 2) {
    throw new RangeError(
      "separable convolution requires two arrays of numbers to represent the kernel"
    );
  }
  if (algorithm === "auto") {
    let separatedKernel = getSeparatedKernel(kernel2);
    if (separatedKernel !== null) {
      algorithm = "separable";
      kernel2 = separatedKernel;
    } else if ((kernel2.length > 9 || kernel2[0].length > 9) && this.width <= 4096 && this.height <= 4096) {
      algorithm = "fft";
    } else {
      algorithm = "direct";
    }
  }
  let halfHeight, halfWidth;
  if (algorithm === "separable") {
    halfHeight = Math.floor(kernel2[0].length / 2);
    halfWidth = Math.floor(kernel2[1].length / 2);
  } else {
    halfHeight = Math.floor(kernel2.length / 2);
    halfWidth = Math.floor(kernel2[0].length / 2);
  }
  let clamped = newImage.isClamped;
  let tmpData = new Array(this.height * this.width);
  let index, x, y, channel, c, tmpResult;
  for (channel = 0; channel < channels.length; channel++) {
    c = channels[channel];
    for (y = 0; y < this.height; y++) {
      for (x = 0; x < this.width; x++) {
        index = y * this.width + x;
        tmpData[index] = this.data[index * this.channels + c];
      }
    }
    if (algorithm === "direct") {
      tmpResult = src$1.direct(tmpData, kernel2, {
        rows: this.height,
        cols: this.width,
        normalize: normalize2,
        divisor
      });
    } else if (algorithm === "separable") {
      tmpResult = convolutionSeparable(
        tmpData,
        kernel2,
        this.width,
        this.height
      );
      if (normalize2) {
        divisor = 0;
        for (let i2 = 0; i2 < kernel2[0].length; i2++) {
          for (let j = 0; j < kernel2[1].length; j++) {
            divisor += kernel2[0][i2] * kernel2[1][j];
          }
        }
      }
      if (divisor !== 1) {
        for (let i2 = 0; i2 < tmpResult.length; i2++) {
          tmpResult[i2] /= divisor;
        }
      }
    } else {
      tmpResult = src$1.fft(tmpData, kernel2, {
        rows: this.height,
        cols: this.width,
        normalize: normalize2,
        divisor
      });
    }
    for (y = 0; y < this.height; y++) {
      for (x = 0; x < this.width; x++) {
        index = y * this.width + x;
        if (clamped) {
          newImage.data[index * this.channels + c] = clamp(
            tmpResult[index],
            newImage
          );
        } else {
          newImage.data[index * this.channels + c] = tmpResult[index];
        }
      }
    }
  }
  if (this.alpha && !channels.includes(this.channels)) {
    for (x = this.components; x < this.data.length; x = x + this.channels) {
      newImage.data[x] = this.data[x];
    }
  }
  if (border !== "periodic") {
    newImage.setBorder({ size: [halfWidth, halfHeight], algorithm: border });
  }
  return newImage;
}
function gradientFilter(options = {}) {
  let {
    direction = "xy",
    border = "copy",
    kernelX,
    kernelY,
    channels,
    bitDepth = this.bitDepth
  } = options;
  this.checkProcessable("gradientFilter", {
    bitDepth: [8, 16]
  });
  switch (direction) {
    case "x":
      if (!kernelX) throw new Error("kernelX option is missing");
      return convolution.call(this, kernelX, {
        channels,
        border,
        bitDepth
      });
    case "y":
      if (!kernelY) throw new Error("kernelY option is missing");
      return convolution.call(this, kernelY, {
        channels,
        border,
        bitDepth
      });
    case "xy": {
      if (!kernelX) throw new Error("kernelX option is missing");
      if (!kernelY) throw new Error("kernelY option is missing");
      const gX = convolution.call(this, kernelX, {
        channels,
        border,
        bitDepth: 32
      });
      const gY = convolution.call(this, kernelY, {
        channels,
        border,
        bitDepth: 32
      });
      return gX.hypotenuse(gY, { bitDepth, channels });
    }
    default:
      throw new Error(`Unknown parameter direction: ${direction}`);
  }
}
function sobelFilter(options) {
  return gradientFilter.call(
    this,
    Object.assign({}, options, {
      kernelX: SOBEL_X,
      kernelY: SOBEL_Y
    })
  );
}
function scharrFilter(options) {
  return gradientFilter.call(
    this,
    Object.assign({}, options, {
      kernelX: SCHARR_X,
      kernelY: SCHARR_Y
    })
  );
}
var newArray_1 = newArray;
function newArray(n, value) {
  n = n || 0;
  var array = new Array(n);
  for (var i2 = 0; i2 < n; i2++) {
    array[i2] = value;
  }
  return array;
}
const newArray$1 = /* @__PURE__ */ getDefaultExportFromCjs(newArray_1);
function level(options = {}) {
  let {
    algorithm = "range",
    channels,
    min: min2 = this.min,
    max: max2 = this.max
  } = options;
  this.checkProcessable("level", {
    bitDepth: [8, 16, 32]
  });
  channels = validateArrayOfChannels(this, { channels });
  if (channels.length !== this.channel) {
    if (Array.isArray(min2) && min2.length === this.channels) {
      min2 = min2.filter((a, index) => channels.includes(index));
    }
    if (Array.isArray(max2) && max2.length === this.channels) {
      max2 = max2.filter((a, index) => channels.includes(index));
    }
  }
  switch (algorithm) {
    case "range":
      if (min2 < 0) {
        min2 = 0;
      }
      if (max2 > this.maxValue) {
        max2 = this.maxValue;
      }
      if (!Array.isArray(min2)) {
        min2 = newArray$1(channels.length, min2);
      }
      if (!Array.isArray(max2)) {
        max2 = newArray$1(channels.length, max2);
      }
      processImage(this, min2, max2, channels);
      break;
    default:
      throw new Error(`level: algorithm not implement: ${algorithm}`);
  }
  return this;
}
function processImage(image, min2, max2, channels) {
  let delta = 1e-5;
  let factor = new Array(channels.length);
  for (let i2 = 0; i2 < channels.length; i2++) {
    if (min2[i2] === 0 && max2[i2] === image.maxValue) {
      factor[i2] = 0;
    } else if (max2[i2] === min2[i2]) {
      factor[i2] = 0;
    } else {
      factor[i2] = (image.maxValue + 1 - delta) / (max2[i2] - min2[i2]);
    }
    min2[i2] += (0.5 - delta / 2) / factor[i2];
  }
  for (let j = 0; j < channels.length; j++) {
    let c = channels[j];
    if (factor[j] !== 0) {
      for (let i2 = 0; i2 < image.data.length; i2 += image.channels) {
        image.data[i2 + c] = Math.min(
          Math.max(0, (image.data[i2 + c] - min2[j]) * factor[j] + 0.5 | 0),
          image.maxValue
        );
      }
    }
  }
}
var toString = Object.prototype.toString;
var isArrayType = function isArrayType2(value) {
  return toString.call(value).substr(-6, 5) === "Array";
};
const isArray = /* @__PURE__ */ getDefaultExportFromCjs(isArrayType);
function checkNumberArray(value) {
  if (!isNaN(value)) {
    if (value <= 0) {
      throw new Error("checkNumberArray: the value must be greater than 0");
    }
    return value;
  } else {
    if (value instanceof Image) {
      return value.data;
    }
    if (!isArray(value)) {
      throw new Error(
        "checkNumberArray: the value should be either a number, array or Image"
      );
    }
    return value;
  }
}
function add(value, options = {}) {
  let { channels } = options;
  this.checkProcessable("add", {
    bitDepth: [8, 16]
  });
  channels = validateArrayOfChannels(this, { channels });
  value = checkNumberArray(value);
  if (!isNaN(value)) {
    for (let j = 0; j < channels.length; j++) {
      let c = channels[j];
      for (let i2 = 0; i2 < this.data.length; i2 += this.channels) {
        this.data[i2 + c] = Math.min(
          this.maxValue,
          this.data[i2 + c] + value >> 0
        );
      }
    }
  } else {
    if (this.data.length !== value.length) {
      throw new Error("add: the data size is different");
    }
    for (let j = 0; j < channels.length; j++) {
      let c = channels[j];
      for (let i2 = 0; i2 < this.data.length; i2 += this.channels) {
        this.data[i2 + c] = Math.max(
          0,
          Math.min(this.maxValue, this.data[i2 + c] + value[i2 + c] >> 0)
        );
      }
    }
  }
  return this;
}
function subtract(value, options = {}) {
  let { channels } = options;
  this.checkProcessable("subtract", {
    bitDepth: [8, 16]
  });
  channels = validateArrayOfChannels(this, { channels });
  value = checkNumberArray(value);
  if (!isNaN(value)) {
    for (let j = 0; j < channels.length; j++) {
      let c = channels[j];
      for (let i2 = 0; i2 < this.data.length; i2 += this.channels) {
        this.data[i2 + c] = Math.max(0, this.data[i2 + c] - value >> 0);
      }
    }
  } else {
    if (this.data.length !== value.length) {
      throw new Error("subtract: the data size is different");
    }
    for (let j = 0; j < channels.length; j++) {
      let c = channels[j];
      for (let i2 = 0; i2 < this.data.length; i2 += this.channels) {
        this.data[i2 + c] = Math.max(
          0,
          Math.min(this.maxValue, this.data[i2 + c] - value[i2 + c] >> 0)
        );
      }
    }
  }
  return this;
}
function subtractImage(otherImage, options = {}) {
  let { channels, absolute: absolute2 = false } = options;
  this.checkProcessable("subtractImage", {
    bitDepth: [8, 16]
  });
  if (this.width !== otherImage.width || this.height !== otherImage.height) {
    throw new Error("subtractImage: both images must have the same size");
  }
  if (this.alpha !== otherImage.alpha || this.bitDepth !== otherImage.bitDepth) {
    throw new Error(
      "subtractImage: both images must have the same alpha and bitDepth"
    );
  }
  if (this.channels !== otherImage.channels) {
    throw new Error(
      "subtractImage: both images must have the same number of channels"
    );
  }
  let newImage = this.clone();
  channels = validateArrayOfChannels(this, { channels });
  for (let j = 0; j < channels.length; j++) {
    let c = channels[j];
    for (let i2 = c; i2 < this.data.length; i2 += this.channels) {
      let value = this.data[i2] - otherImage.data[i2];
      if (absolute2) {
        newImage.data[i2] = Math.abs(value);
      } else {
        newImage.data[i2] = Math.max(value, 0);
      }
    }
  }
  return newImage;
}
function hypotenuse(otherImage, options = {}) {
  let { bitDepth = this.bitDepth, channels } = options;
  this.checkProcessable("hypotenuse", {
    bitDepth: [8, 16, 32]
  });
  if (this.width !== otherImage.width || this.height !== otherImage.height) {
    throw new Error("hypotenuse: both images must have the same size");
  }
  if (this.alpha !== otherImage.alpha || this.bitDepth !== otherImage.bitDepth) {
    throw new Error(
      "hypotenuse: both images must have the same alpha and bitDepth"
    );
  }
  if (this.channels !== otherImage.channels) {
    throw new Error(
      "hypotenuse: both images must have the same number of channels"
    );
  }
  let newImage = Image.createFrom(this, { bitDepth });
  channels = validateArrayOfChannels(this, { channels });
  let clamped = newImage.isClamped;
  for (let j = 0; j < channels.length; j++) {
    let c = channels[j];
    for (let i2 = c; i2 < this.data.length; i2 += this.channels) {
      let value = Math.hypot(this.data[i2], otherImage.data[i2]);
      if (clamped) {
        newImage.data[i2] = Math.min(
          Math.max(Math.round(value), 0),
          newImage.maxValue
        );
      } else {
        newImage.data[i2] = value;
      }
    }
  }
  return newImage;
}
function multiply(value, options = {}) {
  let { channels } = options;
  this.checkProcessable("multiply", {
    bitDepth: [8, 16]
  });
  if (value <= 0) {
    throw new Error("multiply: the value must be greater than 0");
  }
  channels = validateArrayOfChannels(this, { channels });
  value = checkNumberArray(value);
  if (!isNaN(value)) {
    for (let j = 0; j < channels.length; j++) {
      let c = channels[j];
      for (let i2 = 0; i2 < this.data.length; i2 += this.channels) {
        this.data[i2 + c] = Math.min(
          this.maxValue,
          this.data[i2 + c] * value >> 0
        );
      }
    }
  } else {
    if (this.data.length !== value.length) {
      throw new Error("multiply: the data size is different");
    }
    for (let j = 0; j < channels.length; j++) {
      let c = channels[j];
      for (let i2 = 0; i2 < this.data.length; i2 += this.channels) {
        this.data[i2 + c] = Math.max(
          0,
          Math.min(this.maxValue, this.data[i2 + c] * value[i2 + c] >> 0)
        );
      }
    }
  }
  return this;
}
function divide(value, options = {}) {
  let { channels } = options;
  this.checkProcessable("divide", {
    bitDepth: [8, 16]
  });
  channels = validateArrayOfChannels(this, { channels });
  value = checkNumberArray(value);
  if (!isNaN(value)) {
    for (let j = 0; j < channels.length; j++) {
      let c = channels[j];
      for (let i2 = 0; i2 < this.data.length; i2 += this.channels) {
        this.data[i2 + c] = Math.min(
          this.maxValue,
          this.data[i2 + c] / value >> 0
        );
      }
    }
  } else {
    if (this.data.length !== value.length) {
      throw new Error("divide: the: the data size is different");
    }
    for (let j = 0; j < channels.length; j++) {
      let c = channels[j];
      for (let i2 = 0; i2 < this.data.length; i2 += this.channels) {
        this.data[i2 + c] = Math.max(
          0,
          Math.min(this.maxValue, this.data[i2 + c] / value[i2 + c] >> 0)
        );
      }
    }
  }
  return this;
}
class BaseRegression {
  constructor() {
    if (new.target === BaseRegression) {
      throw new Error("BaseRegression must be subclassed");
    }
  }
  predict(x) {
    if (typeof x === "number") {
      return this._predict(x);
    } else if (isAnyArray$1(x)) {
      const y = [];
      for (let i2 = 0; i2 < x.length; i2++) {
        y.push(this._predict(x[i2]));
      }
      return y;
    } else {
      throw new TypeError("x must be a number or array");
    }
  }
  _predict() {
    throw new Error("_predict must be implemented");
  }
  train() {
  }
  toString() {
    return "";
  }
  toLaTeX() {
    return "";
  }
  /**
   * Return the correlation coefficient of determination (r) and chi-square.
   * @param {Array<number>} x
   * @param {Array<number>} y
   * @return {object}
   */
  score(x, y) {
    if (!isAnyArray$1(x) || !isAnyArray$1(y) || x.length !== y.length) {
      throw new Error("x and y must be arrays of the same length");
    }
    const n = x.length;
    const y2 = new Array(n);
    for (let i2 = 0; i2 < n; i2++) {
      y2[i2] = this._predict(x[i2]);
    }
    let xSum = 0;
    let ySum = 0;
    let chi2 = 0;
    let rmsd = 0;
    let xSquared = 0;
    let ySquared = 0;
    let xY = 0;
    for (let i2 = 0; i2 < n; i2++) {
      xSum += y2[i2];
      ySum += y[i2];
      xSquared += y2[i2] * y2[i2];
      ySquared += y[i2] * y[i2];
      xY += y2[i2] * y[i2];
      if (y[i2] !== 0) {
        chi2 += (y[i2] - y2[i2]) * (y[i2] - y2[i2]) / y[i2];
      }
      rmsd += (y[i2] - y2[i2]) * (y[i2] - y2[i2]);
    }
    const r = (n * xY - xSum * ySum) / Math.sqrt((n * xSquared - xSum * xSum) * (n * ySquared - ySum * ySum));
    return {
      r,
      r2: r * r,
      chi2,
      rmsd: Math.sqrt(rmsd / n)
    };
  }
}
const require$$0$1 = /* @__PURE__ */ getAugmentedNamespace(matrix$1);
function squaredEuclidean$4(p, q) {
  let d = 0;
  for (let i2 = 0; i2 < p.length; i2++) {
    d += (p[i2] - q[i2]) * (p[i2] - q[i2]);
  }
  return d;
}
function euclidean$2(p, q) {
  return Math.sqrt(squaredEuclidean$4(p, q));
}
const euclidean$3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  euclidean: euclidean$2,
  squaredEuclidean: squaredEuclidean$4
}, Symbol.toStringTag, { value: "Module" }));
const require$$0 = /* @__PURE__ */ getAugmentedNamespace(euclidean$3);
const { squaredEuclidean: squaredEuclidean$3 } = require$$0;
const defaultOptions$b = {
  sigma: 1
};
let GaussianKernel$1 = class GaussianKernel2 {
  constructor(options) {
    options = Object.assign({}, defaultOptions$b, options);
    this.sigma = options.sigma;
    this.divisor = 2 * options.sigma * options.sigma;
  }
  compute(x, y) {
    const distance = squaredEuclidean$3(x, y);
    return Math.exp(-distance / this.divisor);
  }
};
var gaussianKernel = GaussianKernel$1;
const defaultOptions$a = {
  degree: 1,
  constant: 1,
  scale: 1
};
let PolynomialKernel$1 = class PolynomialKernel2 {
  constructor(options) {
    options = Object.assign({}, defaultOptions$a, options);
    this.degree = options.degree;
    this.constant = options.constant;
    this.scale = options.scale;
  }
  compute(x, y) {
    var sum2 = 0;
    for (var i2 = 0; i2 < x.length; i2++) {
      sum2 += x[i2] * y[i2];
    }
    return Math.pow(this.scale * sum2 + this.constant, this.degree);
  }
};
var polynomialKernel = PolynomialKernel$1;
const defaultOptions$9 = {
  alpha: 0.01,
  constant: -Math.E
};
let SigmoidKernel$1 = class SigmoidKernel2 {
  constructor(options) {
    options = Object.assign({}, defaultOptions$9, options);
    this.alpha = options.alpha;
    this.constant = options.constant;
  }
  compute(x, y) {
    var sum2 = 0;
    for (var i2 = 0; i2 < x.length; i2++) {
      sum2 += x[i2] * y[i2];
    }
    return Math.tanh(this.alpha * sum2 + this.constant);
  }
};
var sigmoidKernel = SigmoidKernel$1;
const defaultOptions$8 = {
  sigma: 1,
  degree: 1
};
let ANOVAKernel$1 = class ANOVAKernel2 {
  constructor(options) {
    options = Object.assign({}, defaultOptions$8, options);
    this.sigma = options.sigma;
    this.degree = options.degree;
  }
  compute(x, y) {
    var sum2 = 0;
    var len = Math.min(x.length, y.length);
    for (var i2 = 1; i2 <= len; ++i2) {
      sum2 += Math.pow(
        Math.exp(
          -this.sigma * Math.pow(Math.pow(x[i2 - 1], i2) - Math.pow(y[i2 - 1], i2), 2)
        ),
        this.degree
      );
    }
    return sum2;
  }
};
var anovaKernel = ANOVAKernel$1;
const { squaredEuclidean: squaredEuclidean$2 } = require$$0;
const defaultOptions$7 = {
  sigma: 1
};
let CauchyKernel$1 = class CauchyKernel2 {
  constructor(options) {
    options = Object.assign({}, defaultOptions$7, options);
    this.sigma = options.sigma;
  }
  compute(x, y) {
    return 1 / (1 + squaredEuclidean$2(x, y) / (this.sigma * this.sigma));
  }
};
var cauchyKernel = CauchyKernel$1;
const { euclidean: euclidean$1 } = require$$0;
const defaultOptions$6 = {
  sigma: 1
};
let ExponentialKernel$1 = class ExponentialKernel2 {
  constructor(options) {
    options = Object.assign({}, defaultOptions$6, options);
    this.sigma = options.sigma;
    this.divisor = 2 * options.sigma * options.sigma;
  }
  compute(x, y) {
    const distance = euclidean$1(x, y);
    return Math.exp(-distance / this.divisor);
  }
};
var exponentialKernel = ExponentialKernel$1;
class HistogramIntersectionKernel {
  compute(x, y) {
    var min2 = Math.min(x.length, y.length);
    var sum2 = 0;
    for (var i2 = 0; i2 < min2; ++i2) {
      sum2 += Math.min(x[i2], y[i2]);
    }
    return sum2;
  }
}
var histogramIntersectionKernel = HistogramIntersectionKernel;
const { euclidean } = require$$0;
const defaultOptions$5 = {
  sigma: 1
};
let LaplacianKernel$1 = class LaplacianKernel2 {
  constructor(options) {
    options = Object.assign({}, defaultOptions$5, options);
    this.sigma = options.sigma;
  }
  compute(x, y) {
    const distance = euclidean(x, y);
    return Math.exp(-distance / this.sigma);
  }
};
var laplacianKernel = LaplacianKernel$1;
const { squaredEuclidean: squaredEuclidean$1 } = require$$0;
const defaultOptions$4 = {
  constant: 1
};
let MultiquadraticKernel$1 = class MultiquadraticKernel2 {
  constructor(options) {
    options = Object.assign({}, defaultOptions$4, options);
    this.constant = options.constant;
  }
  compute(x, y) {
    return Math.sqrt(squaredEuclidean$1(x, y) + this.constant * this.constant);
  }
};
var multiquadraticKernel = MultiquadraticKernel$1;
const { squaredEuclidean } = require$$0;
const defaultOptions$3 = {
  constant: 1
};
class RationalQuadraticKernel {
  constructor(options) {
    options = Object.assign({}, defaultOptions$3, options);
    this.constant = options.constant;
  }
  compute(x, y) {
    const distance = squaredEuclidean(x, y);
    return 1 - distance / (distance + this.constant);
  }
}
var rationalQuadraticKernel = RationalQuadraticKernel;
const { Matrix: Matrix$1, MatrixTransposeView } = require$$0$1;
const GaussianKernel = gaussianKernel;
const PolynomialKernel = polynomialKernel;
const SigmoidKernel = sigmoidKernel;
const ANOVAKernel = anovaKernel;
const CauchyKernel = cauchyKernel;
const ExponentialKernel = exponentialKernel;
const HistogramKernel = histogramIntersectionKernel;
const LaplacianKernel = laplacianKernel;
const MultiquadraticKernel = multiquadraticKernel;
const RationalKernel = rationalQuadraticKernel;
const kernelType = {
  gaussian: GaussianKernel,
  rbf: GaussianKernel,
  polynomial: PolynomialKernel,
  poly: PolynomialKernel,
  anova: ANOVAKernel,
  cauchy: CauchyKernel,
  exponential: ExponentialKernel,
  histogram: HistogramKernel,
  min: HistogramKernel,
  laplacian: LaplacianKernel,
  multiquadratic: MultiquadraticKernel,
  rational: RationalKernel,
  sigmoid: SigmoidKernel,
  mlp: SigmoidKernel
};
class Kernel {
  constructor(type, options) {
    this.kernelType = type;
    if (type === "linear") return;
    if (typeof type === "string") {
      type = type.toLowerCase();
      var KernelConstructor = kernelType[type];
      if (KernelConstructor) {
        this.kernelFunction = new KernelConstructor(options);
      } else {
        throw new Error(`unsupported kernel type: ${type}`);
      }
    } else if (typeof type === "object" && typeof type.compute === "function") {
      this.kernelFunction = type;
    } else {
      throw new TypeError(
        "first argument must be a valid kernel type or instance"
      );
    }
  }
  compute(inputs, landmarks) {
    inputs = Matrix$1.checkMatrix(inputs);
    if (landmarks === void 0) {
      landmarks = inputs;
    } else {
      landmarks = Matrix$1.checkMatrix(landmarks);
    }
    if (this.kernelType === "linear") {
      return inputs.mmul(new MatrixTransposeView(landmarks));
    }
    const kernelMatrix = new Matrix$1(inputs.rows, landmarks.rows);
    if (inputs === landmarks) {
      for (let i2 = 0; i2 < inputs.rows; i2++) {
        for (let j = i2; j < inputs.rows; j++) {
          const value = this.kernelFunction.compute(
            inputs.getRow(i2),
            inputs.getRow(j)
          );
          kernelMatrix.set(i2, j, value);
          kernelMatrix.set(j, i2, value);
        }
      }
    } else {
      for (let i2 = 0; i2 < inputs.rows; i2++) {
        for (let j = 0; j < landmarks.rows; j++) {
          kernelMatrix.set(
            i2,
            j,
            this.kernelFunction.compute(inputs.getRow(i2), landmarks.getRow(j))
          );
        }
      }
    }
    return kernelMatrix;
  }
}
var kernel = Kernel;
const Kernel$1 = /* @__PURE__ */ getDefaultExportFromCjs(kernel);
const defaultOptions$2 = {
  lambda: 0.1,
  kernelType: "gaussian",
  kernelOptions: {},
  computeCoefficient: false
};
class KernelRidgeRegression extends BaseRegression {
  constructor(inputs, outputs, options) {
    super();
    if (inputs === true) {
      this.alpha = outputs.alpha;
      this.inputs = outputs.inputs;
      this.kernelType = outputs.kernelType;
      this.kernelOptions = outputs.kernelOptions;
      this.kernel = new Kernel$1(outputs.kernelType, outputs.kernelOptions);
    } else {
      inputs = Matrix$2.checkMatrix(inputs);
      options = Object.assign({}, defaultOptions$2, options);
      const kernelFunction = new Kernel$1(
        options.kernelType,
        options.kernelOptions
      );
      const K = kernelFunction.compute(inputs);
      const n = inputs.rows;
      K.add(Matrix$2.eye(n, n).mul(options.lambda));
      this.alpha = solve(K, outputs);
      this.inputs = inputs;
      this.kernelType = options.kernelType;
      this.kernelOptions = options.kernelOptions;
      this.kernel = kernelFunction;
    }
  }
  _predict(newInputs) {
    return this.kernel.compute([newInputs], this.inputs).mmul(this.alpha).getRow(0);
  }
  toJSON() {
    return {
      name: "kernelRidgeRegression",
      alpha: this.alpha,
      inputs: this.inputs,
      kernelType: this.kernelType,
      kernelOptions: this.kernelOptions
    };
  }
  static load(json) {
    if (json.name !== "kernelRidgeRegression") {
      throw new TypeError("not a KRR model");
    }
    return new KernelRidgeRegression(true, json);
  }
}
function background$1(coordinates, values, options) {
  const model = new KernelRidgeRegression(coordinates, values, options);
  const allCoordinates = new Array(this.size);
  for (let i2 = 0; i2 < this.width; i2++) {
    for (let j = 0; j < this.height; j++) {
      allCoordinates[j * this.width + i2] = [i2, j];
    }
  }
  const result = model.predict(allCoordinates);
  const background2 = Image.createFrom(this);
  for (let i2 = 0; i2 < this.size; i2++) {
    background2.data[i2] = Math.min(this.maxValue, Math.max(0, result[i2][0]));
  }
  return background2;
}
function dilate(options = {}) {
  let {
    kernel: kernel2 = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ],
    iterations = 1
  } = options;
  this.checkProcessable("dilate", {
    bitDepth: [1, 8, 16],
    components: 1,
    alpha: 0
  });
  if (kernel2.columns % 2 === 0 || kernel2.rows % 2 === 0) {
    throw new TypeError(
      "dilate: The number of rows and columns of the kernel must be odd"
    );
  }
  let onlyOnes = true;
  outer: for (const row of kernel2) {
    for (const value of row) {
      if (value !== 1) {
        onlyOnes = false;
        break outer;
      }
    }
  }
  let result = this;
  for (let i2 = 0; i2 < iterations; i2++) {
    if (this.bitDepth === 1) {
      if (onlyOnes) {
        const newImage = result.clone();
        result = dilateOnceBinaryOnlyOnes(
          result,
          newImage,
          kernel2.length,
          kernel2[0].length
        );
      } else {
        const newImage = Image.createFrom(result);
        result = dilateOnceBinary(result, newImage, kernel2);
      }
    } else if (onlyOnes) {
      const newImage = Image.createFrom(result);
      result = dilateOnceGreyOnlyOnes(
        result,
        newImage,
        kernel2.length,
        kernel2[0].length
      );
    } else {
      const newImage = Image.createFrom(result);
      result = dilateOnceGrey(result, newImage, kernel2);
    }
  }
  return result;
}
function dilateOnceGrey(img, newImage, kernel2) {
  const kernelWidth = kernel2.length;
  const kernelHeight = kernel2[0].length;
  let radiusX = (kernelWidth - 1) / 2;
  let radiusY = (kernelHeight - 1) / 2;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let max2 = 0;
      for (let jj = 0; jj < kernelHeight; jj++) {
        for (let ii = 0; ii < kernelWidth; ii++) {
          if (kernel2[ii][jj] !== 1) continue;
          let i2 = ii - radiusX + x;
          let j = jj - radiusY + y;
          if (i2 < 0 || j < 0 || i2 >= img.width || j >= img.height) continue;
          const value = img.getValueXY(i2, j, 0);
          if (value > max2) max2 = value;
        }
      }
      newImage.setValueXY(x, y, 0, max2);
    }
  }
  return newImage;
}
function dilateOnceGreyOnlyOnes(img, newImage, kernelWidth, kernelHeight) {
  const radiusX = (kernelWidth - 1) / 2;
  const radiusY = (kernelHeight - 1) / 2;
  const maxList = [];
  for (let x = 0; x < img.width; x++) {
    maxList.push(0);
  }
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let max2 = 0;
      for (let h = Math.max(0, y - radiusY); h < Math.min(img.height, y + radiusY + 1); h++) {
        const value = img.getValueXY(x, h, 0);
        if (value > max2) {
          max2 = value;
        }
      }
      maxList[x] = max2;
    }
    for (let x = 0; x < img.width; x++) {
      let max2 = 0;
      for (let i2 = Math.max(0, x - radiusX); i2 < Math.min(img.width, x + radiusX + 1); i2++) {
        if (maxList[i2] > max2) {
          max2 = maxList[i2];
        }
      }
      newImage.setValueXY(x, y, 0, max2);
    }
  }
  return newImage;
}
function dilateOnceBinary(img, newImage, kernel2) {
  const kernelWidth = kernel2.length;
  const kernelHeight = kernel2[0].length;
  let radiusX = (kernelWidth - 1) / 2;
  let radiusY = (kernelHeight - 1) / 2;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let max2 = 0;
      intLoop: for (let jj = 0; jj < kernelHeight; jj++) {
        for (let ii = 0; ii < kernelWidth; ii++) {
          if (kernel2[ii][jj] !== 1) continue;
          let i2 = ii - radiusX + x;
          let j = jj - radiusY + y;
          if (j < 0 || i2 < 0 || i2 >= img.width || j >= img.height) continue;
          const value = img.getBitXY(i2, j);
          if (value === 1) {
            max2 = 1;
            break intLoop;
          }
        }
      }
      if (max2 === 1) {
        newImage.setBitXY(x, y);
      }
    }
  }
  return newImage;
}
function dilateOnceBinaryOnlyOnes(img, newImage, kernelWidth, kernelHeight) {
  const radiusX = (kernelWidth - 1) / 2;
  const radiusY = (kernelHeight - 1) / 2;
  const maxList = [];
  for (let x = 0; x < img.width; x++) {
    maxList.push(1);
  }
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      maxList[x] = 0;
      for (let h = Math.max(0, y - radiusY); h < Math.min(img.height, y + radiusY + 1); h++) {
        if (img.getBitXY(x, h) === 1) {
          maxList[x] = 1;
          break;
        }
      }
    }
    for (let x = 0; x < img.width; x++) {
      if (newImage.getBitXY(x, y) === 1) continue;
      for (let i2 = Math.max(0, x - radiusX); i2 < Math.min(img.width, x + radiusX + 1); i2++) {
        if (maxList[i2] === 1) {
          newImage.setBitXY(x, y);
          break;
        }
      }
    }
  }
  return newImage;
}
function erode(options = {}) {
  let {
    kernel: kernel2 = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ],
    iterations = 1
  } = options;
  this.checkProcessable("erode", {
    bitDepth: [1, 8, 16],
    components: 1,
    alpha: 0
  });
  if (kernel2.columns % 2 === 0 || kernel2.rows % 2 === 0) {
    throw new TypeError(
      "erode: The number of rows and columns of the kernel must be odd"
    );
  }
  let onlyOnes = true;
  outer: for (const row of kernel2) {
    for (const value of row) {
      if (value !== 1) {
        onlyOnes = false;
        break outer;
      }
    }
  }
  let result = this;
  for (let i2 = 0; i2 < iterations; i2++) {
    if (this.bitDepth === 1) {
      if (onlyOnes) {
        const newImage = result.clone();
        result = erodeOnceBinaryOnlyOnes(
          result,
          newImage,
          kernel2.length,
          kernel2[0].length
        );
      } else {
        const newImage = Image.createFrom(result);
        result = erodeOnceBinary(result, newImage, kernel2);
      }
    } else if (onlyOnes) {
      const newImage = Image.createFrom(result);
      result = erodeOnceGreyOnlyOnes(
        result,
        newImage,
        kernel2.length,
        kernel2[0].length
      );
    } else {
      const newImage = Image.createFrom(result);
      result = erodeOnceGrey(result, newImage, kernel2);
    }
  }
  return result;
}
function erodeOnceGrey(img, newImage, kernel2) {
  const kernelWidth = kernel2.length;
  const kernelHeight = kernel2[0].length;
  let radiusX = (kernelWidth - 1) / 2;
  let radiusY = (kernelHeight - 1) / 2;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let min2 = img.maxValue;
      for (let jj = 0; jj < kernelHeight; jj++) {
        for (let ii = 0; ii < kernelWidth; ii++) {
          if (kernel2[ii][jj] !== 1) continue;
          let i2 = ii - radiusX + x;
          let j = jj - radiusY + y;
          if (i2 < 0 || j < 0 || i2 >= img.width || j >= img.height) continue;
          const value = img.getValueXY(i2, j, 0);
          if (value < min2) min2 = value;
        }
      }
      newImage.setValueXY(x, y, 0, min2);
    }
  }
  return newImage;
}
function erodeOnceGreyOnlyOnes(img, newImage, kernelWidth, kernelHeight) {
  const radiusX = (kernelWidth - 1) / 2;
  const radiusY = (kernelHeight - 1) / 2;
  const minList = [];
  for (let x = 0; x < img.width; x++) {
    minList.push(0);
  }
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let min2 = img.maxValue;
      for (let h = Math.max(0, y - radiusY); h < Math.min(img.height, y + radiusY + 1); h++) {
        const value = img.getValueXY(x, h, 0);
        if (value < min2) {
          min2 = value;
        }
      }
      minList[x] = min2;
    }
    for (let x = 0; x < img.width; x++) {
      let min2 = img.maxValue;
      for (let i2 = Math.max(0, x - radiusX); i2 < Math.min(img.width, x + radiusX + 1); i2++) {
        if (minList[i2] < min2) {
          min2 = minList[i2];
        }
      }
      newImage.setValueXY(x, y, 0, min2);
    }
  }
  return newImage;
}
function erodeOnceBinary(img, newImage, kernel2) {
  const kernelWidth = kernel2.length;
  const kernelHeight = kernel2[0].length;
  let radiusX = (kernelWidth - 1) / 2;
  let radiusY = (kernelHeight - 1) / 2;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let min2 = 1;
      intLoop: for (let jj = 0; jj < kernelHeight; jj++) {
        for (let ii = 0; ii < kernelWidth; ii++) {
          if (kernel2[ii][jj] !== 1) continue;
          let i2 = ii - radiusX + x;
          let j = jj - radiusY + y;
          if (j < 0 || i2 < 0 || i2 >= img.width || j >= img.height) continue;
          const value = img.getBitXY(i2, j);
          if (value === 0) {
            min2 = 0;
            break intLoop;
          }
        }
      }
      if (min2 === 1) {
        newImage.setBitXY(x, y);
      }
    }
  }
  return newImage;
}
function erodeOnceBinaryOnlyOnes(img, newImage, kernelWidth, kernelHeight) {
  const radiusX = (kernelWidth - 1) / 2;
  const radiusY = (kernelHeight - 1) / 2;
  const minList = [];
  for (let x = 0; x < img.width; x++) {
    minList.push(0);
  }
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      minList[x] = 1;
      for (let h = Math.max(0, y - radiusY); h < Math.min(img.height, y + radiusY + 1); h++) {
        if (img.getBitXY(x, h) === 0) {
          minList[x] = 0;
          break;
        }
      }
    }
    for (let x = 0; x < img.width; x++) {
      if (newImage.getBitXY(x, y) === 0) continue;
      for (let i2 = Math.max(0, x - radiusX); i2 < Math.min(img.width, x + radiusX + 1); i2++) {
        if (minList[i2] === 0) {
          newImage.clearBitXY(x, y);
          break;
        }
      }
    }
  }
  return newImage;
}
function open(options = {}) {
  let {
    kernel: kernel2 = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ],
    iterations = 1
  } = options;
  this.checkProcessable("open", {
    bitDepth: [8, 16],
    components: 1,
    alpha: 0
  });
  if (kernel2.columns % 2 === 0 || kernel2.rows % 2 === 0) {
    throw new TypeError(
      "open: The number of rows and columns of the kernel must be odd"
    );
  }
  let newImage = this;
  for (let i2 = 0; i2 < iterations; i2++) {
    newImage = newImage.erode({ kernel: kernel2 });
    newImage = newImage.dilate({ kernel: kernel2 });
  }
  return newImage;
}
function close(options = {}) {
  let {
    kernel: kernel2 = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ],
    iterations = 1
  } = options;
  this.checkProcessable("close", {
    bitDepth: [1, 8, 16],
    components: 1,
    alpha: 0
  });
  if (kernel2.columns % 2 === 0 || kernel2.rows % 2 === 0) {
    throw new TypeError(
      "close: The number of rows and columns of the kernel must be odd"
    );
  }
  let newImage = this;
  for (let i2 = 0; i2 < iterations; i2++) {
    newImage = newImage.dilate({ kernel: kernel2 }).erode({ kernel: kernel2 });
  }
  return newImage;
}
function topHat(options = {}) {
  let {
    kernel: kernel2 = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ],
    iterations = 1
  } = options;
  this.checkProcessable("topHat", {
    bitDepth: [8, 16],
    components: 1,
    alpha: 0
  });
  if (kernel2.length % 2 === 0 || kernel2[0].length % 2 === 0) {
    throw new TypeError(
      "topHat: The number of rows and columns of the kernel must be odd"
    );
  }
  let newImage = this;
  for (let i2 = 0; i2 < iterations; i2++) {
    let openImage = newImage.open({ kernel: kernel2 });
    newImage = openImage.subtractImage(newImage, { absolute: true });
  }
  return newImage;
}
function blackHat(options = {}) {
  let {
    kernel: kernel2 = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ],
    iterations = 1
  } = options;
  this.checkProcessable("blackHat", {
    bitDepth: [8, 16],
    components: 1,
    alpha: 0
  });
  if (kernel2.columns % 2 === 0 || kernel2.rows % 2 === 0) {
    throw new TypeError(
      "blackHat: The number of rows and columns of the kernel must be odd"
    );
  }
  let newImage = this;
  for (let i2 = 0; i2 < iterations; i2++) {
    const closeImage = newImage.close({ kernel: kernel2 });
    newImage = closeImage.subtractImage(newImage, { absolute: true });
  }
  return newImage;
}
function morphologicalGradient(options = {}) {
  let {
    kernel: kernel2 = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ],
    iterations = 1
  } = options;
  this.checkProcessable("morphologicalGradient", {
    bitDepth: [8, 16],
    components: 1,
    alpha: 0
  });
  if (kernel2.columns % 2 === 0 || kernel2.rows % 2 === 0) {
    throw new TypeError(
      "morphologicalGradient: The number of rows and columns of the kernel must be odd"
    );
  }
  let newImage = this;
  for (let i2 = 0; i2 < iterations; i2++) {
    let dilatedImage = newImage.dilate({ kernel: kernel2 });
    let erodedImage = newImage.erode({ kernel: kernel2 });
    newImage = dilatedImage.subtractImage(erodedImage, { absolute: true });
  }
  return newImage;
}
function order4Points(pts) {
  let tl = 0;
  let tr = 0;
  let br = 0;
  let bl = 0;
  let minX = pts[0][0];
  let indexMinX = 0;
  for (let i2 = 1; i2 < pts.length; i2++) {
    if (pts[i2][0] < minX) {
      minX = pts[i2][0];
      indexMinX = i2;
    }
  }
  let minX2 = pts[(indexMinX + 1) % pts.length][0];
  let indexMinX2 = (indexMinX + 1) % pts.length;
  for (let i2 = 1; i2 < pts.length; i2++) {
    if (pts[i2][0] < minX2 && i2 !== indexMinX) {
      minX2 = pts[i2][0];
      indexMinX2 = i2;
    }
  }
  if (pts[indexMinX2][1] < pts[indexMinX][1]) {
    tl = pts[indexMinX2];
    bl = pts[indexMinX];
    if (indexMinX !== (indexMinX2 + 1) % 4) {
      tr = pts[(indexMinX2 + 1) % 4];
      br = pts[(indexMinX2 + 2) % 4];
    } else {
      tr = pts[(indexMinX2 + 2) % 4];
      br = pts[(indexMinX2 + 3) % 4];
    }
  } else {
    bl = pts[indexMinX2];
    tl = pts[indexMinX];
    if (indexMinX2 !== (indexMinX + 1) % 4) {
      tr = pts[(indexMinX + 1) % 4];
      br = pts[(indexMinX + 2) % 4];
    } else {
      tr = pts[(indexMinX + 2) % 4];
      br = pts[(indexMinX + 3) % 4];
    }
  }
  return [tl, tr, br, bl];
}
function distance2Points(p1, p2) {
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}
function crossVect(u, v) {
  let result = [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0]
  ];
  return result;
}
function dotVect(u, v) {
  let result = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  return result;
}
function computeWidthAndHeigth(tl, tr, br, bl, widthImage, heightImage) {
  let w = Math.max(distance2Points(tl, tr), distance2Points(bl, br));
  let h = Math.max(distance2Points(tl, bl), distance2Points(tr, br));
  let finalW = 0;
  let finalH = 0;
  let u0 = Math.ceil(widthImage / 2);
  let v0 = Math.ceil(heightImage / 2);
  let arVis = w / h;
  let m1 = [tl[0], tl[1], 1];
  let m2 = [tr[0], tr[1], 1];
  let m3 = [bl[0], bl[1], 1];
  let m4 = [br[0], br[1], 1];
  let k2 = dotVect(crossVect(m1, m4), m3) / dotVect(crossVect(m2, m4), m3);
  let k3 = dotVect(crossVect(m1, m4), m2) / dotVect(crossVect(m3, m4), m2);
  let n2 = [k2 * m2[0] - m1[0], k2 * m2[1] - m1[1], k2 * m2[2] - m1[2]];
  let n3 = [k3 * m3[0] - m1[0], k3 * m3[1] - m1[1], k3 * m3[2] - m1[2]];
  let n21 = n2[0];
  let n22 = n2[1];
  let n23 = n2[2];
  let n31 = n3[0];
  let n32 = n3[1];
  let n33 = n3[2];
  let f = 1 / (n23 * n33) * (n21 * n31 - (n21 * n33 + n23 * n31) * u0 + n23 * n33 * u0 * u0 + (n22 * n32 - (n22 * n33 + n23 * n32) * v0 + n23 * n33 * v0 * v0));
  if (f >= 0) {
    f = Math.sqrt(f);
  } else {
    f = Math.sqrt(-f);
  }
  let A = new Matrix$2([
    [f, 0, u0],
    [0, f, v0],
    [0, 0, 1]
  ]);
  let At = A.transpose();
  let Ati = inverse(At);
  let Ai = inverse(A);
  let n2R = Matrix$2.rowVector(n2);
  let n3R = Matrix$2.rowVector(n3);
  let arReal = Math.sqrt(
    dotVect(n2R.mmul(Ati).mmul(Ai).to1DArray(), n2) / dotVect(n3R.mmul(Ati).mmul(Ai).to1DArray(), n3)
  );
  if (arReal === 0 || arVis === 0) {
    finalW = Math.ceil(w);
    finalH = Math.ceil(h);
  } else if (arReal < arVis) {
    finalW = Math.ceil(w);
    finalH = Math.ceil(finalW / arReal);
  } else {
    finalH = Math.ceil(h);
    finalW = Math.ceil(arReal * finalH);
  }
  return [finalW, finalH];
}
function projectionPoint(x, y, a, b, c, d, e, f, g, h, image, channel) {
  let [newX, newY] = [
    (a * x + b * y + c) / (g * x + h * y + 1),
    (d * x + e * y + f) / (g * x + h * y + 1)
  ];
  return image.getValueXY(Math.floor(newX), Math.floor(newY), channel);
}
function warpingFourPoints(pts, options = {}) {
  let { calculateRatio = true } = options;
  if (pts.length !== 4) {
    throw new Error(
      `The array pts must have four elements, which are the four corners. Currently, pts have ${pts.length} elements`
    );
  }
  let [pt1, pt2, pt3, pt4] = pts;
  let quadrilaterial = [pt1, pt2, pt3, pt4];
  let [tl, tr, br, bl] = order4Points(quadrilaterial);
  let widthRect;
  let heightRect;
  if (calculateRatio) {
    [widthRect, heightRect] = computeWidthAndHeigth(
      tl,
      tr,
      br,
      bl,
      this.width,
      this.height
    );
  } else {
    widthRect = Math.ceil(
      Math.max(distance2Points(tl, tr), distance2Points(bl, br))
    );
    heightRect = Math.ceil(
      Math.max(distance2Points(tl, bl), distance2Points(tr, br))
    );
  }
  let newImage = Image.createFrom(this, {
    width: widthRect,
    height: heightRect
  });
  let [X1, Y1] = tl;
  let [X2, Y2] = tr;
  let [X3, Y3] = br;
  let [X4, Y4] = bl;
  let [x1, y1] = [0, 0];
  let [x2, y2] = [0, widthRect - 1];
  let [x3, y3] = [heightRect - 1, widthRect - 1];
  let [x4, y4] = [heightRect - 1, 0];
  let S = new Matrix$2([
    [x1, y1, 1, 0, 0, 0, -x1 * X1, -y1 * X1],
    [x2, y2, 1, 0, 0, 0, -x2 * X2, -y2 * X2],
    [x3, y3, 1, 0, 0, 0, -x3 * X3, -y1 * X3],
    [x4, y4, 1, 0, 0, 0, -x4 * X4, -y4 * X4],
    [0, 0, 0, x1, y1, 1, -x1 * Y1, -y1 * Y1],
    [0, 0, 0, x2, y2, 1, -x2 * Y2, -y2 * Y2],
    [0, 0, 0, x3, y3, 1, -x3 * Y3, -y3 * Y3],
    [0, 0, 0, x4, y4, 1, -x4 * Y4, -y4 * Y4]
  ]);
  let D = Matrix$2.columnVector([X1, X2, X3, X4, Y1, Y2, Y3, Y4]);
  let svd = new SingularValueDecomposition(S);
  let T = svd.solve(D);
  let [a, b, c, d, e, f, g, h] = T.to1DArray();
  let Xt = new Matrix$2(heightRect, widthRect);
  for (let channel = 0; channel < this.channels; channel++) {
    for (let i2 = 0; i2 < heightRect; i2++) {
      for (let j = 0; j < widthRect; j++) {
        Xt.set(
          i2,
          j,
          projectionPoint(i2, j, a, b, c, d, e, f, g, h, this, channel)
        );
      }
    }
    newImage.setMatrix(Xt, { channel });
  }
  return newImage;
}
function crop(options = {}) {
  let {
    x = 0,
    y = 0,
    width = this.width - x,
    height = this.height - y
  } = options;
  this.checkProcessable("crop", {
    bitDepth: [1, 8, 16]
  });
  x = Math.round(x);
  y = Math.round(y);
  width = Math.round(width);
  height = Math.round(height);
  if (x > this.width - 1 || y > this.height - 1) {
    throw new RangeError(
      `crop: origin (x:${x}, y:${y}) out of range (${this.width - 1}; ${this.height - 1})`
    );
  }
  if (width <= 0 || height <= 0) {
    throw new RangeError(
      `crop: width and height (width:${width}; height:${height}) must be positive numbers`
    );
  }
  if (x < 0 || y < 0) {
    throw new RangeError(
      `crop: x and y (x:${x}, y:${y}) must be positive numbers`
    );
  }
  if (width > this.width - x || height > this.height - y) {
    throw new RangeError(
      `crop: (x: ${x}, y:${y}, width:${width}, height:${height}) size is out of range`
    );
  }
  let result = this;
  if (this.bitDepth === 1) {
    const newImage = new Image(width, height, {
      kind: "BINARY",
      parent: this
    });
    result = cropBinary(this, newImage, x, y, width, height);
  } else {
    const newImage = Image.createFrom(this, {
      width,
      height,
      position: [x, y]
    });
    result = cropDefault(this, newImage, x, y, width, height);
  }
  return result;
}
function cropDefault(img, newImage, x, y, width, height) {
  let xWidth = width * img.channels;
  let y1 = y + height;
  let ptr = 0;
  let jLeft = x * img.channels;
  for (let i2 = y; i2 < y1; i2++) {
    let j = i2 * img.width * img.channels + jLeft;
    let jL = j + xWidth;
    for (; j < jL; j++) {
      newImage.data[ptr++] = img.data[j];
    }
  }
  return newImage;
}
function cropBinary(img, newImage, x, y, width, height) {
  let xWidth = width * img.channels;
  let y1 = y + height;
  let ptr = 0;
  let jLeft = x * img.channels;
  for (let i2 = y; i2 < y1; i2++) {
    let j = i2 * img.width * img.channels + jLeft;
    let jL = j + xWidth;
    for (; j < jL; j++) {
      if (img.getBit(j)) {
        newImage.setBit(ptr);
      }
      ++ptr;
    }
  }
  return newImage;
}
function cropAlpha(options = {}) {
  this.checkProcessable("cropAlpha", {
    alpha: 1
  });
  const { threshold = this.maxValue } = options;
  let left = findLeft(this, threshold, this.components);
  if (left === -1) {
    throw new Error(
      "Could not find new dimensions. Threshold may be too high."
    );
  }
  let top = findTop(this, threshold, this.components, left);
  let bottom = findBottom(this, threshold, this.components, left);
  let right = findRight(this, threshold, this.components, left, top, bottom);
  return this.crop({
    x: left,
    y: top,
    width: right - left + 1,
    height: bottom - top + 1
  });
}
function findLeft(image, threshold, channel) {
  for (let x = 0; x < image.width; x++) {
    for (let y = 0; y < image.height; y++) {
      if (image.getValueXY(x, y, channel) >= threshold) {
        return x;
      }
    }
  }
  return -1;
}
function findTop(image, threshold, channel, left) {
  for (let y = 0; y < image.height; y++) {
    for (let x = left; x < image.width; x++) {
      if (image.getValueXY(x, y, channel) >= threshold) {
        return y;
      }
    }
  }
  return -1;
}
function findBottom(image, threshold, channel, left) {
  for (let y = image.height - 1; y >= 0; y--) {
    for (let x = left; x < image.width; x++) {
      if (image.getValueXY(x, y, channel) >= threshold) {
        return y;
      }
    }
  }
  return -1;
}
function findRight(image, threshold, channel, left, top, bottom) {
  for (let x = image.width - 1; x >= left; x--) {
    for (let y = top; y <= bottom; y++) {
      if (image.getValueXY(x, y, channel) >= threshold) {
        return x;
      }
    }
  }
  return -1;
}
function getFactor(value) {
  if (typeof value === "string") {
    const last = value[value.length - 1];
    value = parseFloat(value);
    if (last === "%") {
      value /= 100;
    }
  }
  return value;
}
function getThreshold$1(value, maxValue) {
  if (!maxValue) {
    throw Error("getThreshold : the maxValue should be specified");
  }
  if (typeof value === "string") {
    let last = value[value.length - 1];
    if (last !== "%") {
      throw Error(
        "getThreshold : if the value is a string it must finish by %"
      );
    }
    return parseFloat(value) / 100 * maxValue;
  } else if (typeof value === "number") {
    if (value < 1) {
      return value * maxValue;
    }
    return value;
  } else {
    throw Error("getThreshold : the value is not valid");
  }
}
function factorDimensions(factor, width, height) {
  factor = getFactor(factor);
  let newWidth = Math.round(factor * width);
  let newHeight = Math.round(factor * height);
  if (newWidth <= 0) {
    newWidth = 1;
  }
  if (newHeight <= 0) {
    newHeight = 1;
  }
  return {
    width: newWidth,
    height: newHeight
  };
}
function checkRow(image, row) {
  if (row < 0 || row >= image.height) {
    throw new RangeError(
      `row must be included between 0 and ${image.height - 1}. Current value: ${row}`
    );
  }
}
function checkColumn(image, column) {
  if (column < 0 || column >= image.width) {
    throw new RangeError(
      `column must be included between 0 and ${image.width - 1}. Current value: ${column}`
    );
  }
}
function checkChannel(image, channel) {
  if (channel < 0 || channel >= image.channels) {
    throw new RangeError(
      `channel must be included between 0 and ${image.channels - 1}. Current value: ${channel}`
    );
  }
}
const validInterpolations = {
  nearestneighbor: "nearestNeighbor",
  nearestneighbour: "nearestNeighbor",
  bilinear: "bilinear"
};
function checkInterpolation(interpolation) {
  if (typeof interpolation !== "string") {
    throw new TypeError("interpolation must be a string");
  }
  interpolation = interpolation.toLowerCase();
  if (!validInterpolations[interpolation]) {
    throw new RangeError(`invalid interpolation algorithm: ${interpolation}`);
  }
  return validInterpolations[interpolation];
}
function nearestNeighbor(newImage, newWidth, newHeight) {
  const wRatio = this.width / newWidth;
  const hRatio = this.height / newHeight;
  if (this.bitDepth > 1) {
    for (let i2 = 0; i2 < newWidth; i2++) {
      const w = Math.floor((i2 + 0.5) * wRatio);
      for (let j = 0; j < newHeight; j++) {
        const h = Math.floor((j + 0.5) * hRatio);
        for (let c = 0; c < this.channels; c++) {
          newImage.setValueXY(i2, j, c, this.getValueXY(w, h, c));
        }
      }
    }
  } else {
    for (let i2 = 0; i2 < newWidth; i2++) {
      const w = Math.floor((i2 + 0.5) * wRatio);
      for (let j = 0; j < newHeight; j++) {
        const h = Math.floor((j + 0.5) * hRatio);
        if (this.getBitXY(w, h)) {
          newImage.setBitXY(i2, j);
        }
      }
    }
  }
}
function resize(options = {}) {
  const {
    factor = 1,
    interpolation = validInterpolations.nearestneighbor,
    preserveAspectRatio = true
  } = options;
  const interpolationToUse = checkInterpolation(interpolation);
  let width = options.width;
  let height = options.height;
  if (!width) {
    if (height && preserveAspectRatio) {
      width = Math.round(height * (this.width / this.height));
    } else {
      width = this.width;
    }
  }
  if (!height) {
    if (preserveAspectRatio) {
      height = Math.round(width * (this.height / this.width));
    } else {
      height = this.height;
    }
  }
  ({ width, height } = factorDimensions(factor, width, height));
  if (width === this.width && height === this.height) {
    const newImage2 = this.clone();
    newImage2.position = [0, 0];
    return newImage2;
  }
  let shiftX = Math.round((this.width - width) / 2);
  let shiftY = Math.round((this.height - height) / 2);
  const newImage = Image.createFrom(this, {
    width,
    height,
    position: [shiftX, shiftY]
  });
  switch (interpolationToUse) {
    case validInterpolations.nearestneighbor:
      nearestNeighbor.call(this, newImage, width, height);
      break;
    default:
      throw new Error(
        `unsupported resize interpolation: ${interpolationToUse}`
      );
  }
  return newImage;
}
function hsv() {
  this.checkProcessable("hsv", {
    bitDepth: [8, 16],
    alpha: [0, 1],
    colorModel: [RGB$1]
  });
  let newImage = Image.createFrom(this, {
    colorModel: HSV
  });
  let ptr = 0;
  let data = this.data;
  for (let i2 = 0; i2 < data.length; i2 += this.channels) {
    let red = data[i2];
    let green = data[i2 + 1];
    let blue = data[i2 + 2];
    let min2 = Math.min(red, green, blue);
    let max2 = Math.max(red, green, blue);
    let delta = max2 - min2;
    let hue = 0;
    let saturation = max2 === 0 ? 0 : delta / max2;
    let value = max2;
    if (max2 !== min2) {
      switch (max2) {
        case red:
          hue = (green - blue) / delta + (green < blue ? 6 : 0);
          break;
        case green:
          hue = (blue - red) / delta + 2;
          break;
        case blue:
          hue = (red - green) / delta + 4;
          break;
        default:
          throw new Error("unreachable");
      }
      hue /= 6;
    }
    newImage.data[ptr++] = hue * this.maxValue;
    newImage.data[ptr++] = saturation * this.maxValue;
    newImage.data[ptr++] = value;
    if (this.alpha) {
      newImage.data[ptr++] = data[i2 + 3];
    }
  }
  return newImage;
}
function hsl$1() {
  this.checkProcessable("hsl", {
    bitDepth: [8, 16],
    alpha: [0, 1],
    colorModel: [RGB$1]
  });
  let newImage = Image.createFrom(this, {
    colorModel: HSL
  });
  let threshold = Math.floor(this.maxValue / 2);
  let ptr = 0;
  let data = this.data;
  for (let i2 = 0; i2 < data.length; i2 += this.channels) {
    let red = data[i2];
    let green = data[i2 + 1];
    let blue = data[i2 + 2];
    let max2 = Math.max(red, green, blue);
    let min2 = Math.min(red, green, blue);
    let hue = 0;
    let saturation = 0;
    let luminance = (max2 + min2) / 2;
    if (max2 !== min2) {
      let delta = max2 - min2;
      saturation = luminance > threshold ? delta / (2 - max2 - min2) : delta / (max2 + min2);
      switch (max2) {
        case red:
          hue = (green - blue) / delta + (green < blue ? 6 : 0);
          break;
        case green:
          hue = (blue - red) / delta + 2;
          break;
        case blue:
          hue = (red - green) / delta + 4;
          break;
        default:
          throw new Error("unreachable");
      }
      hue /= 6;
    }
    newImage.data[ptr++] = hue * this.maxValue;
    newImage.data[ptr++] = saturation * this.maxValue;
    newImage.data[ptr++] = luminance;
    if (this.alpha) {
      newImage.data[ptr++] = data[i2 + 3];
    }
  }
  return newImage;
}
function cmyk() {
  this.checkProcessable("cmyk", {
    bitDepth: [8, 16],
    alpha: [0, 1],
    colorModel: [RGB$1]
  });
  let newImage = Image.createFrom(this, {
    components: 4,
    colorModel: CMYK$1
  });
  let ptr = 0;
  let data = this.data;
  for (let i2 = 0; i2 < data.length; i2 += this.channels) {
    let red = data[i2];
    let green = data[i2 + 1];
    let blue = data[i2 + 2];
    let black = Math.min(
      this.maxValue - red,
      this.maxValue - green,
      this.maxValue - blue
    );
    let cyan = (this.maxValue - red - black) / (1 - black / this.maxValue);
    let magenta = (this.maxValue - green - black) / (1 - black / this.maxValue);
    let yellow = (this.maxValue - blue - black) / (1 - black / this.maxValue);
    newImage.data[ptr++] = Math.round(cyan);
    newImage.data[ptr++] = Math.round(magenta);
    newImage.data[ptr++] = Math.round(yellow);
    newImage.data[ptr++] = Math.round(black);
    if (this.alpha) {
      newImage.data[ptr++] = data[i2 + 3];
    }
  }
  return newImage;
}
function rgba8() {
  return new Image(this.width, this.height, this.getRGBAData(), {
    kind: "RGBA",
    parent: this
  });
}
const methods$1 = {
  luma709(red, green, blue) {
    return red * 6966 + green * 23436 + blue * 2366 >> 15;
  },
  luma601(red, green, blue) {
    return red * 9798 + green * 19235 + blue * 3735 >> 15;
  },
  maximum(red, green, blue) {
    return Math.max(red, green, blue);
  },
  minimum(red, green, blue) {
    return Math.min(red, green, blue);
  },
  average(red, green, blue) {
    return (red + green + blue) / 3 >> 0;
  },
  minmax(red, green, blue) {
    return (Math.max(red, green, blue) + Math.min(red, green, blue)) / 2;
  },
  red(red) {
    return red;
  },
  green(red, green) {
    return green;
  },
  blue(red, green, blue) {
    return blue;
  },
  cyan(red, green, blue, image) {
    let black = methods$1.black(red, green, blue, image);
    return (image.maxValue - red - black) / (1 - black / image.maxValue) >> 0;
  },
  magenta(red, green, blue, image) {
    let black = methods$1.black(red, green, blue, image);
    return (image.maxValue - green - black) / (1 - black / image.maxValue) >> 0;
  },
  yellow(red, green, blue, image) {
    let black = methods$1.black(red, green, blue, image);
    return (image.maxValue - blue - black) / (1 - black / image.maxValue) >> 0;
  },
  black(red, green, blue, image) {
    return Math.min(
      image.maxValue - red,
      image.maxValue - green,
      image.maxValue - blue
    );
  },
  hue(red, green, blue, image) {
    let min2 = methods$1.min(red, green, blue);
    let max2 = methods$1.max(red, green, blue);
    if (max2 === min2) {
      return 0;
    }
    let hue = 0;
    let delta = max2 - min2;
    switch (max2) {
      case red:
        hue = (green - blue) / delta + (green < blue ? 6 : 0);
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      case blue:
        hue = (red - green) / delta + 4;
        break;
      default:
        throw new Error("unreachable");
    }
    return hue / 6 * image.maxValue >> 0;
  },
  saturation(red, green, blue, image) {
    let min2 = methods$1.min(red, green, blue);
    let max2 = methods$1.max(red, green, blue);
    let delta = max2 - min2;
    return max2 === 0 ? 0 : delta / max2 * image.maxValue;
  },
  lightness(red, green, blue) {
    let min2 = methods$1.min(red, green, blue);
    let max2 = methods$1.max(red, green, blue);
    return (max2 + min2) / 2;
  }
};
Object.defineProperty(methods$1, "luminosity", {
  enumerable: false,
  value: methods$1.lightness
});
Object.defineProperty(methods$1, "luminance", {
  enumerable: false,
  value: methods$1.lightness
});
Object.defineProperty(methods$1, "min", {
  enumerable: false,
  value: methods$1.minimum
});
Object.defineProperty(methods$1, "max", {
  enumerable: false,
  value: methods$1.maximum
});
Object.defineProperty(methods$1, "brightness", {
  enumerable: false,
  value: methods$1.maximum
});
Object.keys(methods$1).forEach((name2) => {
});
function grey(options = {}) {
  let { algorithm = "luma709", keepAlpha = false, mergeAlpha = true } = options;
  if (typeof algorithm !== "string" && typeof algorithm !== "function") {
    throw new TypeError("algorithm must be a string or a function");
  }
  this.checkProcessable("grey", {
    bitDepth: [8, 16],
    alpha: [0, 1]
  });
  if (this.components === 1) {
    algorithm = "red";
  }
  keepAlpha &= this.alpha;
  mergeAlpha &= this.alpha;
  if (keepAlpha) {
    mergeAlpha = false;
  }
  let newImage = getOutputImage(this, options, {
    components: 1,
    alpha: keepAlpha,
    colorModel: GREY$1
  });
  let method;
  if (typeof algorithm === "function") {
    method = algorithm;
  } else {
    method = methods$1[algorithm.toLowerCase()];
    if (!method) {
      throw new Error(`unsupported grey algorithm: ${algorithm}`);
    }
  }
  let ptr = 0;
  for (let i2 = 0; i2 < this.data.length; i2 += this.channels) {
    if (mergeAlpha) {
      newImage.data[ptr++] = clamp(
        method(this.data[i2], this.data[i2 + 1], this.data[i2 + 2], this) * this.data[i2 + this.components] / this.maxValue,
        this
      );
    } else {
      newImage.data[ptr++] = clamp(
        method(this.data[i2], this.data[i2 + 1], this.data[i2 + 2], this),
        this
      );
      if (newImage.alpha) {
        newImage.data[ptr++] = this.data[i2 + this.components];
      }
    }
  }
  return newImage;
}
function huang(histogram2) {
  let firstBin = 0;
  for (let ih = 0; ih < histogram2.length; ih++) {
    if (histogram2[ih] !== 0) {
      firstBin = ih;
      break;
    }
  }
  let lastBin = histogram2.length - 1;
  for (let ih = histogram2.length - 1; ih >= firstBin; ih--) {
    if (histogram2[ih] !== 0) {
      lastBin = ih;
      break;
    }
  }
  let term = 1 / (lastBin - firstBin);
  let mu0 = new Array(histogram2.length);
  let sumPix = 0;
  let numPix = 0;
  for (let ih = firstBin; ih < histogram2.length; ih++) {
    sumPix += ih * histogram2[ih];
    numPix += histogram2[ih];
    mu0[ih] = sumPix / numPix;
  }
  let mu1 = new Array(histogram2.length);
  sumPix = numPix = 0;
  for (let ih = lastBin; ih > 0; ih--) {
    sumPix += ih * histogram2[ih];
    numPix += histogram2[ih];
    mu1[ih - 1] = sumPix / numPix;
  }
  let threshold = -1;
  let minEnt = Number.MAX_VALUE;
  for (let it = 0; it < histogram2.length; it++) {
    let ent = 0;
    let muX;
    for (let ih = 0; ih <= it; ih++) {
      muX = 1 / (1 + term * Math.abs(ih - mu0[it]));
      if (!(muX < 1e-6 || muX > 0.999999)) {
        ent += histogram2[ih] * (-muX * Math.log(muX) - (1 - muX) * Math.log(1 - muX));
      }
    }
    for (let ih = it + 1; ih < histogram2.length; ih++) {
      muX = 1 / (1 + term * Math.abs(ih - mu1[it]));
      if (!(muX < 1e-6 || muX > 0.999999)) {
        ent += histogram2[ih] * (-muX * Math.log(muX) - (1 - muX) * Math.log(1 - muX));
      }
    }
    if (ent < minEnt) {
      minEnt = ent;
      threshold = it;
    }
  }
  return threshold;
}
function intermodes(histogram2) {
  let iHisto = histogram2.slice();
  let iter = 0;
  while (!bimodalTest$1(iHisto)) {
    let previous = 0;
    let current = 0;
    let next = iHisto[0];
    for (let i2 = 0; i2 < histogram2.length - 1; i2++) {
      previous = current;
      current = next;
      next = iHisto[i2 + 1];
      iHisto[i2] = (previous + current + next) / 3;
    }
    iHisto[histogram2.length - 1] = (current + next) / 3;
    iter++;
    if (iter > 1e4) {
      throw new Error("Intermodes Threshold not found after 10000 iterations");
    }
  }
  let tt = 0;
  for (let i2 = 1; i2 < histogram2.length - 1; i2++) {
    if (iHisto[i2 - 1] < iHisto[i2] && iHisto[i2 + 1] < iHisto[i2]) {
      tt += i2;
    }
  }
  return Math.floor(tt / 2);
}
function bimodalTest$1(iHisto) {
  let b = false;
  let modes = 0;
  for (let k = 1; k < iHisto.length - 1; k++) {
    if (iHisto[k - 1] < iHisto[k] && iHisto[k + 1] < iHisto[k]) {
      modes++;
      if (modes > 2) {
        return false;
      }
    }
  }
  if (modes === 2) {
    b = true;
  }
  return b;
}
function isodata(histogram2) {
  let l;
  let toth;
  let totl;
  let h;
  let g = 0;
  for (let i2 = 1; i2 < histogram2.length; i2++) {
    if (histogram2[i2] > 0) {
      g = i2 + 1;
      break;
    }
  }
  while (true) {
    l = 0;
    totl = 0;
    for (let i2 = 0; i2 < g; i2++) {
      totl = totl + histogram2[i2];
      l = l + histogram2[i2] * i2;
    }
    h = 0;
    toth = 0;
    for (let i2 = g + 1; i2 < histogram2.length; i2++) {
      toth += histogram2[i2];
      h += histogram2[i2] * i2;
    }
    if (totl > 0 && toth > 0) {
      l /= totl;
      h /= toth;
      if (g === Math.round((l + h) / 2)) {
        break;
      }
    }
    g++;
    if (g > histogram2.length - 2) {
      throw new Error("Threshold not found");
    }
  }
  return g;
}
function li(histogram2, total) {
  let threshold;
  let sumBack;
  let sumObj;
  let numBack;
  let numObj;
  let oldThresh;
  let newThresh;
  let meanBack;
  let meanObj;
  let mean2;
  let tolerance;
  let temp;
  tolerance = 0.5;
  mean2 = 0;
  for (let ih = 0; ih < histogram2.length; ih++) {
    mean2 += ih * histogram2[ih];
  }
  mean2 /= total;
  newThresh = mean2;
  do {
    oldThresh = newThresh;
    threshold = oldThresh + 0.5 | 0;
    sumBack = 0;
    numBack = 0;
    for (let ih = 0; ih <= threshold; ih++) {
      sumBack += ih * histogram2[ih];
      numBack += histogram2[ih];
    }
    meanBack = numBack === 0 ? 0 : sumBack / numBack;
    sumObj = 0;
    numObj = 0;
    for (let ih = threshold + 1; ih < histogram2.length; ih++) {
      sumObj += ih * histogram2[ih];
      numObj += histogram2[ih];
    }
    meanObj = numObj === 0 ? 0 : sumObj / numObj;
    temp = (meanBack - meanObj) / (Math.log(meanBack) - Math.log(meanObj));
    if (temp < -Number.EPSILON) {
      newThresh = temp - 0.5 | 0;
    } else {
      newThresh = temp + 0.5 | 0;
    }
  } while (Math.abs(newThresh - oldThresh) > tolerance);
  return threshold;
}
function maxEntropy(histogram2, total) {
  let normHisto = new Array(histogram2.length);
  for (let ih = 0; ih < histogram2.length; ih++) {
    normHisto[ih] = histogram2[ih] / total;
  }
  let P1 = new Array(histogram2.length);
  let P2 = new Array(histogram2.length);
  P1[0] = normHisto[0];
  P2[0] = 1 - P1[0];
  for (let ih = 1; ih < histogram2.length; ih++) {
    P1[ih] = P1[ih - 1] + normHisto[ih];
    P2[ih] = 1 - P1[ih];
  }
  let firstBin = 0;
  for (let ih = 0; ih < histogram2.length; ih++) {
    if (Math.abs(P1[ih]) >= Number.EPSILON) {
      firstBin = ih;
      break;
    }
  }
  let lastBin = histogram2.length - 1;
  for (let ih = histogram2.length - 1; ih >= firstBin; ih--) {
    if (Math.abs(P2[ih]) >= Number.EPSILON) {
      lastBin = ih;
      break;
    }
  }
  let threshold = -1;
  let totEnt;
  let maxEnt = Number.MIN_VALUE;
  let entBack;
  let entObj;
  for (let it = firstBin; it <= lastBin; it++) {
    entBack = 0;
    for (let ih = 0; ih <= it; ih++) {
      if (histogram2[ih] !== 0) {
        entBack -= normHisto[ih] / P1[it] * Math.log(normHisto[ih] / P1[it]);
      }
    }
    entObj = 0;
    for (let ih = it + 1; ih < histogram2.length; ih++) {
      if (histogram2[ih] !== 0) {
        entObj -= normHisto[ih] / P2[it] * Math.log(normHisto[ih] / P2[it]);
      }
    }
    totEnt = entBack + entObj;
    if (maxEnt < totEnt) {
      maxEnt = totEnt;
      threshold = it;
    }
  }
  return threshold;
}
function mean$1(histogram2, total) {
  let sum2 = 0;
  for (let i2 = 0; i2 < histogram2.length; i2++) {
    sum2 += i2 * histogram2[i2];
  }
  return Math.floor(sum2 / total);
}
function minError(histogram2, total) {
  let threshold;
  let Tprev = -2;
  let mu, nu, p, q, sigma2, tau2, w0, w1, w2, sqterm, temp;
  let mean2 = 0;
  for (let ih = 0; ih < histogram2.length; ih++) {
    mean2 += ih * histogram2[ih];
  }
  mean2 /= total;
  threshold = mean2;
  while (threshold !== Tprev) {
    let sumA1 = sumA(histogram2, threshold);
    let sumA2 = sumA(histogram2, histogram2.length - 1);
    let sumB1 = sumB(histogram2, threshold);
    let sumB2 = sumB(histogram2, histogram2.length - 1);
    let sumC1 = sumC(histogram2, threshold);
    let sumC2 = sumC(histogram2, histogram2.length - 1);
    mu = sumB1 / sumA1;
    nu = (sumB2 - sumB1) / (sumA2 - sumA1);
    p = sumA1 / sumA2;
    q = (sumA2 - sumA1) / sumA2;
    sigma2 = sumC1 / sumA1 - mu * mu;
    tau2 = (sumC2 - sumC1) / (sumA2 - sumA1) - nu * nu;
    w0 = 1 / sigma2 - 1 / tau2;
    w1 = mu / sigma2 - nu / tau2;
    w2 = mu * mu / sigma2 - nu * nu / tau2 + Math.log10(sigma2 * (q * q) / (tau2 * (p * p)));
    sqterm = w1 * w1 - w0 * w2;
    if (sqterm < 0) {
      return threshold;
    }
    Tprev = threshold;
    temp = (w1 + Math.sqrt(sqterm)) / w0;
    if (isNaN(temp)) {
      threshold = Tprev;
    } else {
      threshold = Math.floor(temp);
    }
  }
  return threshold;
}
function sumA(y, j) {
  let x = 0;
  for (let i2 = 0; i2 <= j; i2++) {
    x += y[i2];
  }
  return x;
}
function sumB(y, j) {
  let x = 0;
  for (let i2 = 0; i2 <= j; i2++) {
    x += i2 * y[i2];
  }
  return x;
}
function sumC(y, j) {
  let x = 0;
  for (let i2 = 0; i2 <= j; i2++) {
    x += i2 * i2 * y[i2];
  }
  return x;
}
function minimum(histogram2) {
  if (histogram2.length < 2) {
    return 0;
  }
  let iterations = 0;
  let threshold = -1;
  let max2 = -1;
  let histogramCopy = new Array(histogram2.length);
  for (let i2 = 0; i2 < histogram2.length; i2++) {
    histogramCopy[i2] = histogram2[i2];
    if (histogram2[i2] > 0) {
      max2 = i2;
    }
  }
  while (!bimodalTest(histogramCopy)) {
    histogramCopy = smoothed(histogramCopy);
    iterations++;
    if (iterations > 1e4) {
      return threshold;
    }
  }
  threshold = minimumBetweenPeeks(histogramCopy, max2);
  return threshold;
}
function smoothed(histogram2) {
  let auHistogram = new Array(histogram2.length);
  for (let i2 = 1; i2 < histogram2.length - 1; i2++) {
    auHistogram[i2] = (histogram2[i2 - 1] + histogram2[i2] + histogram2[i2 + 1]) / 3;
  }
  auHistogram[0] = (histogram2[0] + histogram2[1]) / 3;
  auHistogram[histogram2.length - 1] = (histogram2[histogram2.length - 2] + histogram2[histogram2.length - 1]) / 3;
  return auHistogram;
}
function minimumBetweenPeeks(histogramBimodal, max2) {
  let threshold;
  for (let i2 = 1; i2 < max2; i2++) {
    if (histogramBimodal[i2 - 1] > histogramBimodal[i2] && histogramBimodal[i2 + 1] >= histogramBimodal[i2]) {
      threshold = i2;
      break;
    }
  }
  return threshold;
}
function bimodalTest(histogram2) {
  let len = histogram2.length;
  let isBimodal = false;
  let peaks = 0;
  for (let k = 1; k < len - 1; k++) {
    if (histogram2[k - 1] < histogram2[k] && histogram2[k + 1] < histogram2[k]) {
      peaks++;
      if (peaks > 2) {
        return false;
      }
    }
  }
  if (peaks === 2) {
    isBimodal = true;
  }
  return isBimodal;
}
function moments(histogram2, total) {
  let m0 = 1;
  let m1 = 0;
  let m2 = 0;
  let m3 = 0;
  let sum2 = 0;
  let p0;
  let cd, c0, c1, z0, z1;
  let threshold = -1;
  let histogramLength = histogram2.length;
  let normalizedHistogram = new Array(histogramLength);
  for (let i2 = 0; i2 < histogramLength; i2++) {
    normalizedHistogram[i2] = histogram2[i2] / total;
  }
  for (let i2 = 0; i2 < histogramLength; i2++) {
    m1 += i2 * normalizedHistogram[i2];
    m2 += i2 * i2 * normalizedHistogram[i2];
    m3 += i2 * i2 * i2 * normalizedHistogram[i2];
  }
  cd = m0 * m2 - m1 * m1;
  c0 = (-m2 * m2 + m1 * m3) / cd;
  c1 = (m0 * -m3 + m2 * m1) / cd;
  z0 = 0.5 * (-c1 - Math.sqrt(c1 * c1 - 4 * c0));
  z1 = 0.5 * (-c1 + Math.sqrt(c1 * c1 - 4 * c0));
  p0 = (z1 - m1) / (z1 - z0);
  for (let i2 = 0; i2 < histogramLength; i2++) {
    sum2 += normalizedHistogram[i2];
    if (sum2 > p0) {
      threshold = i2;
      break;
    }
  }
  return threshold;
}
function otsu(histogramCounts, total) {
  let sumB2 = 0;
  let wB = 0;
  let maximum = 0;
  let level2 = 0;
  let sum1 = 0;
  for (let i2 = 0; i2 < histogramCounts.length; i2++) {
    sum1 += i2 * histogramCounts[i2];
  }
  for (let ii = 0; ii < histogramCounts.length; ii++) {
    wB = wB + histogramCounts[ii];
    const wF = total - wB;
    if (wB === 0 || wF === 0) {
      continue;
    }
    sumB2 = sumB2 + ii * histogramCounts[ii];
    const mF = (sum1 - sumB2) / wF;
    const between = wB * wF * (sumB2 / wB - mF) * (sumB2 / wB - mF);
    if (between >= maximum) {
      level2 = ii;
      maximum = between;
    }
  }
  return level2;
}
function percentile(histogram2) {
  let threshold = -1;
  let percentile2 = 0.5;
  let avec = new Array(histogram2.length);
  let total = partialSum(histogram2, histogram2.length - 1);
  let temp = 1;
  for (let i2 = 0; i2 < histogram2.length; i2++) {
    avec[i2] = Math.abs(partialSum(histogram2, i2) / total - percentile2);
    if (avec[i2] < temp) {
      temp = avec[i2];
      threshold = i2;
    }
  }
  return threshold;
}
function partialSum(histogram2, endIndex) {
  let x = 0;
  for (let i2 = 0; i2 <= endIndex; i2++) {
    x += histogram2[i2];
  }
  return x;
}
function renyiEntropy(histogram2, total) {
  let optThreshold;
  let firstBin;
  let lastBin;
  let normHisto = new Array(histogram2.length);
  let P1 = new Array(histogram2.length);
  let P2 = new Array(histogram2.length);
  let threshold1 = 0;
  let threshold2 = 0;
  let threshold3 = 0;
  let maxEnt1 = 0;
  let maxEnt2 = 0;
  let maxEnt3 = 0;
  let alpha2 = 0.5;
  let term2 = 1 / (1 - alpha2);
  let alpha3 = 2;
  let term3 = 1 / (1 - alpha3);
  for (let ih = 0; ih < histogram2.length; ih++) {
    normHisto[ih] = histogram2[ih] / total;
  }
  P1[0] = normHisto[0];
  P2[0] = 1 - P1[0];
  for (let ih = 1; ih < histogram2.length; ih++) {
    P1[ih] = P1[ih - 1] + normHisto[ih];
    P2[ih] = 1 - P1[ih];
  }
  firstBin = 0;
  for (let ih = 0; ih < histogram2.length; ih++) {
    if (Math.abs(P1[ih]) >= Number.EPSILON) {
      firstBin = ih;
      break;
    }
  }
  lastBin = histogram2.length - 1;
  for (let ih = histogram2.length - 1; ih >= firstBin; ih--) {
    if (Math.abs(P2[ih]) >= Number.EPSILON) {
      lastBin = ih;
      break;
    }
  }
  for (let it = firstBin; it <= lastBin; it++) {
    let entBack1 = 0;
    let entBack2 = 0;
    let entBack3 = 0;
    for (let ih = 0; ih <= it; ih++) {
      if (histogram2[ih] !== 0) {
        entBack1 -= normHisto[ih] / P1[it] * Math.log(normHisto[ih] / P1[it]);
      }
      entBack2 += Math.sqrt(normHisto[ih] / P1[it]);
      entBack3 += normHisto[ih] * normHisto[ih] / (P1[it] * P1[it]);
    }
    let entObj1 = 0;
    let entObj2 = 0;
    let entObj3 = 0;
    for (let ih = it + 1; ih < histogram2.length; ih++) {
      if (histogram2[ih] !== 0) {
        entObj1 -= normHisto[ih] / P2[it] * Math.log(normHisto[ih] / P2[it]);
      }
      entObj2 += Math.sqrt(normHisto[ih] / P2[it]);
      entObj3 += normHisto[ih] * normHisto[ih] / (P2[it] * P2[it]);
    }
    let totEnt1 = entBack1 + entObj1;
    let totEnt2 = term2 * (entBack2 * entObj2 > 0 ? Math.log(entBack2 * entObj2) : 0);
    let totEnt3 = term3 * (entBack3 * entObj3 > 0 ? Math.log(entBack3 * entObj3) : 0);
    if (totEnt1 > maxEnt1) {
      maxEnt1 = totEnt1;
      threshold1 = it;
    }
    if (totEnt2 > maxEnt2) {
      maxEnt2 = totEnt2;
      threshold2 = it;
    }
    if (totEnt3 > maxEnt3) {
      maxEnt3 = totEnt3;
      threshold3 = it;
    }
  }
  let tStars = [threshold1, threshold2, threshold3];
  tStars.sort((a, b) => a - b);
  let betas;
  if (Math.abs(tStars[0] - tStars[1]) <= 5) {
    if (Math.abs(tStars[1] - tStars[2]) <= 5) {
      betas = [1, 2, 1];
    } else {
      betas = [0, 1, 3];
    }
  } else {
    if (Math.abs(tStars[1] - tStars[2]) <= 5) {
      betas = [3, 1, 0];
    } else {
      betas = [1, 2, 1];
    }
  }
  let omega = P1[tStars[2]] - P1[tStars[0]];
  optThreshold = Math.round(
    tStars[0] * (P1[tStars[0]] + 0.25 * omega * betas[0]) + 0.25 * tStars[1] * omega * betas[1] + tStars[2] * (P2[tStars[2]] + 0.25 * omega * betas[2])
  );
  return optThreshold;
}
function shanbhag(histogram2, total) {
  let normHisto = new Array(histogram2.length);
  for (let ih = 0; ih < histogram2.length; ih++) {
    normHisto[ih] = histogram2[ih] / total;
  }
  let P1 = new Array(histogram2.length);
  let P2 = new Array(histogram2.length);
  P1[0] = normHisto[0];
  P2[0] = 1 - P1[0];
  for (let ih = 1; ih < histogram2.length; ih++) {
    P1[ih] = P1[ih - 1] + normHisto[ih];
    P2[ih] = 1 - P1[ih];
  }
  let firstBin = 0;
  for (let ih = 0; ih < histogram2.length; ih++) {
    if (Math.abs(P1[ih]) >= Number.EPSILON) {
      firstBin = ih;
      break;
    }
  }
  let lastBin = histogram2.length - 1;
  for (let ih = histogram2.length - 1; ih >= firstBin; ih--) {
    if (Math.abs(P2[ih]) >= Number.EPSILON) {
      lastBin = ih;
      break;
    }
  }
  let threshold = -1;
  let minEnt = Number.MAX_VALUE;
  let term;
  let totEnt;
  let entBack;
  let entObj;
  for (let it = firstBin; it <= lastBin; it++) {
    entBack = 0;
    term = 0.5 / P1[it];
    for (let ih = 1; ih <= it; ih++) {
      entBack -= normHisto[ih] * Math.log(1 - term * P1[ih - 1]);
    }
    entBack *= term;
    entObj = 0;
    term = 0.5 / P2[it];
    for (let ih = it + 1; ih < histogram2.length; ih++) {
      entObj -= normHisto[ih] * Math.log(1 - term * P2[ih]);
    }
    entObj *= term;
    totEnt = Math.abs(entBack - entObj);
    if (totEnt < minEnt) {
      minEnt = totEnt;
      threshold = it;
    }
  }
  return threshold;
}
function triangle$1(histogram2) {
  let min2 = 0;
  let dmax = 0;
  let max2 = 0;
  let min22 = 0;
  for (let i2 = 0; i2 < histogram2.length; i2++) {
    if (histogram2[i2] > 0) {
      min2 = i2;
      break;
    }
  }
  if (min2 > 0) {
    min2--;
  }
  for (let i2 = histogram2.length - 1; i2 > 0; i2--) {
    if (histogram2[i2] > 0) {
      min22 = i2;
      break;
    }
  }
  if (min22 < histogram2.length - 1) {
    min22++;
  }
  for (let i2 = 0; i2 < histogram2.length; i2++) {
    if (histogram2[i2] > dmax) {
      max2 = i2;
      dmax = histogram2[i2];
    }
  }
  let inverted = false;
  if (max2 - min2 < min22 - max2) {
    inverted = true;
    let left = 0;
    let right = histogram2.length - 1;
    while (left < right) {
      let temp = histogram2[left];
      histogram2[left] = histogram2[right];
      histogram2[right] = temp;
      left++;
      right--;
    }
    min2 = histogram2.length - 1 - min22;
    max2 = histogram2.length - 1 - max2;
  }
  if (min2 === max2) {
    return min2;
  }
  let nx, ny, d;
  nx = histogram2[max2];
  ny = min2 - max2;
  d = Math.sqrt(nx * nx + ny * ny);
  nx /= d;
  ny /= d;
  d = nx * min2 + ny * histogram2[min2];
  let split2 = min2;
  let splitDistance = 0;
  for (let i2 = min2 + 1; i2 <= max2; i2++) {
    let newDistance = nx * i2 + ny * histogram2[i2] - d;
    if (newDistance > splitDistance) {
      split2 = i2;
      splitDistance = newDistance;
    }
  }
  split2--;
  if (inverted) {
    let left = 0;
    let right = histogram2.length - 1;
    while (left < right) {
      let temp = histogram2[left];
      histogram2[left] = histogram2[right];
      histogram2[right] = temp;
      left++;
      right--;
    }
    return histogram2.length - 1 - split2;
  } else {
    return split2;
  }
}
function yen(histogram2, total) {
  let normHisto = new Array(histogram2.length);
  for (let ih = 0; ih < histogram2.length; ih++) {
    normHisto[ih] = histogram2[ih] / total;
  }
  let P1 = new Array(histogram2.length);
  P1[0] = normHisto[0];
  for (let ih = 1; ih < histogram2.length; ih++) {
    P1[ih] = P1[ih - 1] + normHisto[ih];
  }
  let P1Sq = new Array(histogram2.length);
  P1Sq[0] = normHisto[0] * normHisto[0];
  for (let ih = 1; ih < histogram2.length; ih++) {
    P1Sq[ih] = P1Sq[ih - 1] + normHisto[ih] * normHisto[ih];
  }
  let P2Sq = new Array(histogram2.length);
  P2Sq[histogram2.length - 1] = 0;
  for (let ih = histogram2.length - 2; ih >= 0; ih--) {
    P2Sq[ih] = P2Sq[ih + 1] + normHisto[ih + 1] * normHisto[ih + 1];
  }
  let threshold = -1;
  let maxCrit = Number.MIN_VALUE;
  let crit;
  for (let it = 0; it < histogram2.length; it++) {
    crit = -1 * (P1Sq[it] * P2Sq[it] > 0 ? Math.log(P1Sq[it] * P2Sq[it]) : 0) + 2 * (P1[it] * (1 - P1[it]) > 0 ? Math.log(P1[it] * (1 - P1[it])) : 0);
    if (crit > maxCrit) {
      maxCrit = crit;
      threshold = it;
    }
  }
  return threshold;
}
const methods = {
  huang,
  intermodes,
  isodata,
  li,
  maxentropy: maxEntropy,
  mean: mean$1,
  minerror: minError,
  minimum,
  moments,
  otsu,
  percentile,
  renyientropy: renyiEntropy,
  shanbhag,
  triangle: triangle$1,
  yen
};
const names = {};
Object.keys(methods).forEach((name2) => {
  names[name2] = name2;
});
function getThreshold(options = {}) {
  let { algorithm = names.otsu } = options;
  this.checkProcessable("getThreshold", {
    components: 1,
    bitDepth: [8, 16]
  });
  let method = methods[algorithm.toLowerCase()];
  if (method) {
    let histogram2 = this.getHistogram();
    return method(histogram2, this.size);
  } else {
    throw new Error(`unknown thresholding algorithm: ${algorithm}`);
  }
}
const THRESHOLD = "threshold";
function mask(options = {}) {
  let {
    algorithm = THRESHOLD,
    threshold = 0.5,
    useAlpha = true,
    invert: invert2 = false
  } = options;
  this.checkProcessable("mask", {
    components: 1,
    bitDepth: [8, 16]
  });
  if (algorithm === THRESHOLD) {
    threshold = getThreshold$1(threshold, this.maxValue);
  } else {
    threshold = getThreshold.call(this, options);
  }
  let newImage = new Image(this.width, this.height, {
    kind: "BINARY",
    parent: this
  });
  let ptr = 0;
  if (this.alpha && useAlpha) {
    for (let i2 = 0; i2 < this.data.length; i2 += this.channels) {
      let value = this.data[i2] + (this.maxValue - this.data[i2]) * (this.maxValue - this.data[i2 + 1]) / this.maxValue;
      if (invert2 && value <= threshold || !invert2 && value >= threshold) {
        newImage.setBit(ptr);
      }
      ptr++;
    }
  } else {
    for (let i2 = 0; i2 < this.data.length; i2 += this.channels) {
      if (invert2 && this.data[i2] <= threshold || !invert2 && this.data[i2] >= threshold) {
        newImage.setBit(ptr);
      }
      ptr++;
    }
  }
  return newImage;
}
function copyImage(fromImage, toImage, x, y) {
  let fromWidth = fromImage.width;
  let fromHeight = fromImage.height;
  let toWidth = toImage.width;
  let channels = fromImage.channels;
  for (let i2 = 0; i2 < fromWidth; i2++) {
    for (let j = 0; j < fromHeight; j++) {
      for (let k = 0; k < channels; k++) {
        let source = (j * fromWidth + i2) * channels + k;
        let target = ((y + j) * toWidth + x + i2) * channels + k;
        toImage.data[target] = fromImage.data[source];
      }
    }
  }
}
function pad(options = {}) {
  let { size = 0, algorithm = "copy", color } = options;
  this.checkProcessable("pad", {
    bitDepth: [8, 16]
  });
  if (algorithm === "set") {
    if (color.length !== this.channels) {
      throw new Error(
        `pad: the color array must have the same length as the number of channels. Here: ${this.channels}`
      );
    }
    for (let i2 = 0; i2 < color.length; i2++) {
      if (color[i2] === 0) {
        color[i2] = 1e-3;
      }
    }
  } else {
    color = newArray$1(this.channels, null);
  }
  if (!Array.isArray(size)) {
    size = [size, size];
  }
  let newWidth = this.width + size[0] * 2;
  let newHeight = this.height + size[1] * 2;
  let channels = this.channels;
  let newImage = Image.createFrom(this, { width: newWidth, height: newHeight });
  copyImage(this, newImage, size[0], size[1]);
  for (let i2 = size[0]; i2 < newWidth - size[0]; i2++) {
    for (let k = 0; k < channels; k++) {
      let value = color[k] || newImage.data[(size[1] * newWidth + i2) * channels + k];
      for (let j = 0; j < size[1]; j++) {
        newImage.data[(j * newWidth + i2) * channels + k] = value;
      }
      value = color[k] || newImage.data[((newHeight - size[1] - 1) * newWidth + i2) * channels + k];
      for (let j = newHeight - size[1]; j < newHeight; j++) {
        newImage.data[(j * newWidth + i2) * channels + k] = value;
      }
    }
  }
  for (let j = 0; j < newHeight; j++) {
    for (let k = 0; k < channels; k++) {
      let value = color[k] || newImage.data[(j * newWidth + size[0]) * channels + k];
      for (let i2 = 0; i2 < size[0]; i2++) {
        newImage.data[(j * newWidth + i2) * channels + k] = value;
      }
      value = color[k] || newImage.data[(j * newWidth + newWidth - size[0] - 1) * channels + k];
      for (let i2 = newWidth - size[0]; i2 < newWidth; i2++) {
        newImage.data[(j * newWidth + i2) * channels + k] = value;
      }
    }
  }
  return newImage;
}
function colorDepth(newColorDepth = 8) {
  this.checkProcessable("colorDepth", {
    bitDepth: [1, 8, 16]
  });
  if (![8, 16].includes(newColorDepth)) {
    throw Error("You need to specify the new colorDepth as 8 or 16");
  }
  if (this.bitDepth === newColorDepth) {
    return this.clone();
  }
  let newImage = Image.createFrom(this, { bitDepth: newColorDepth });
  switch (newColorDepth) {
    case 8:
      if (this.bitDepth === 1) {
        for (let i2 = 0; i2 < this.size; i2++) {
          if (this.getBit(i2)) {
            newImage.data[i2] = 255;
          }
        }
      } else {
        for (let i2 = 0; i2 < this.data.length; i2++) {
          newImage.data[i2] = this.data[i2] >> 8;
        }
      }
      break;
    case 16:
      if (this.bitDepth === 1) {
        for (let i2 = 0; i2 < this.size; i2++) {
          if (this.getBit(i2)) {
            newImage.data[i2] = 65535;
          }
        }
      } else {
        for (let i2 = 0; i2 < this.data.length; i2++) {
          newImage.data[i2] = this.data[i2] << 8 | this.data[i2];
        }
      }
      break;
    default:
      throw new Error("colorDepth conversion unexpected case");
  }
  return newImage;
}
function rotateFree(degrees, options = {}) {
  const {
    interpolation = validInterpolations.nearestneighbor,
    width = this.width,
    height = this.height
  } = options;
  if (typeof degrees !== "number") {
    throw new TypeError("degrees must be a number");
  }
  const interpolationToUse = checkInterpolation(interpolation);
  const radians = degrees * Math.PI / 180;
  const newWidth = Math.floor(
    Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians))
  );
  const newHeight = Math.floor(
    Math.abs(height * Math.cos(radians)) + Math.abs(width * Math.sin(radians))
  );
  const cos = Math.cos(-radians);
  const sin = Math.sin(-radians);
  let x0 = newWidth / 2;
  let y0 = newHeight / 2;
  if (newWidth % 2 === 0) {
    x0 = x0 - 0.5;
    if (newHeight % 2 === 0) {
      y0 = y0 - 0.5;
    } else {
      y0 = Math.floor(y0);
    }
  } else {
    x0 = Math.floor(x0);
    if (newHeight % 2 === 0) {
      y0 = y0 - 0.5;
    } else {
      y0 = Math.floor(y0);
    }
  }
  const incrementX = Math.floor(width / 2 - x0);
  const incrementY = Math.floor(height / 2 - y0);
  if (this.bitDepth === 1) {
    const newImage = new Image(newWidth, newHeight, {
      kind: "BINARY",
      parent: this
    });
    switch (interpolationToUse) {
      case validInterpolations.nearestneighbor:
        return rotateBinaryNearestNeighbor(
          this,
          newImage,
          incrementX,
          incrementY,
          x0,
          y0,
          cos,
          sin
        );
      case validInterpolations.bilinear:
        return rotateBinaryBilinear(
          this,
          newImage,
          incrementX,
          incrementY,
          x0,
          y0,
          cos,
          sin
        );
      default:
        throw new Error(
          `unsupported rotate interpolation: ${interpolationToUse}`
        );
    }
  } else {
    const newImage = Image.createFrom(this, {
      width: newWidth,
      height: newHeight
    });
    switch (interpolationToUse) {
      case validInterpolations.nearestneighbor:
        return rotateNearestNeighbor(
          this,
          newImage,
          incrementX,
          incrementY,
          x0,
          y0,
          cos,
          sin
        );
      case validInterpolations.bilinear:
        return rotateBilinear(
          this,
          newImage,
          incrementX,
          incrementY,
          x0,
          y0,
          cos,
          sin
        );
      default:
        throw new Error(
          `unsupported rotate interpolation: ${interpolationToUse}`
        );
    }
  }
}
function rotateNearestNeighbor(thisImage, newImage, incrementX, incrementY, x0, y0, cos, sin) {
  for (let i2 = 0; i2 < newImage.width; i2 += 1) {
    for (let j = 0; j < newImage.height; j += 1) {
      for (let c = 0; c < thisImage.channels; c++) {
        let x = Math.round((i2 - x0) * cos - (j - y0) * sin + x0) + incrementX;
        let y = Math.round((j - y0) * cos + (i2 - x0) * sin + y0) + incrementY;
        if (x < 0 || x >= thisImage.width || y < 0 || y >= thisImage.height) {
          if (thisImage.alpha === 1 && c === thisImage.channels - 1) {
            newImage.setValueXY(i2, j, c, 0);
          } else {
            newImage.setValueXY(i2, j, c, thisImage.maxValue);
          }
        } else {
          newImage.setValueXY(i2, j, c, thisImage.getValueXY(x, y, c));
        }
      }
    }
  }
  return newImage;
}
function rotateBinaryNearestNeighbor(thisImage, newImage, incrementX, incrementY, x0, y0, cos, sin) {
  for (let i2 = 0; i2 < newImage.width; i2 += 1) {
    for (let j = 0; j < newImage.height; j += 1) {
      let x = Math.round((i2 - x0) * cos - (j - y0) * sin + x0) + incrementX;
      let y = Math.round((j - y0) * cos + (i2 - x0) * sin + y0) + incrementY;
      if (x < 0 || x >= thisImage.width || y < 0 || y >= thisImage.height || thisImage.getBitXY(x, y)) {
        newImage.setBitXY(i2, j);
      }
    }
  }
  return newImage;
}
function rotateBilinear(thisImage, newImage, incrementX, incrementY, x0, y0, cos, sin) {
  let stride = thisImage.width * thisImage.channels;
  for (let j = 0; j < newImage.height; j++) {
    for (let i2 = 0; i2 < newImage.width; i2++) {
      let x = (i2 - x0) * cos - (j - y0) * sin + x0 + incrementX;
      let y = (j - y0) * cos + (i2 - x0) * sin + y0 + incrementY;
      let x1 = x | 0;
      let y1 = y | 0;
      let xDiff = x - x1;
      let yDiff = y - y1;
      for (let c = 0; c < thisImage.channels; c++) {
        if (x < 0 || x >= thisImage.width || y < 0 || y >= thisImage.height) {
          if (thisImage.alpha === 1 && c === thisImage.channels - 1) {
            newImage.setValueXY(i2, j, c, 0);
          } else {
            newImage.setValueXY(i2, j, c, thisImage.maxValue);
          }
        } else {
          let index = (y1 * thisImage.width + x1) * thisImage.channels + c;
          let A = thisImage.data[index];
          let B = thisImage.data[index + thisImage.channels];
          let C = thisImage.data[index + stride];
          let D = thisImage.data[index + stride + thisImage.channels];
          let result = A + xDiff * (B - A) + yDiff * (C - A) + xDiff * yDiff * (A - B - C + D) | 0;
          newImage.setValueXY(i2, j, c, result);
        }
      }
    }
  }
  return newImage;
}
function rotateBinaryBilinear(thisImage, newImage, incrementX, incrementY, x0, y0, cos, sin) {
  let stride = thisImage.width;
  for (let j = 0; j < newImage.height; j++) {
    for (let i2 = 0; i2 < newImage.width; i2++) {
      let x = (i2 - x0) * cos - (j - y0) * sin + x0 + incrementX;
      let y = (j - y0) * cos + (i2 - x0) * sin + y0 + incrementY;
      let x1 = x | 0;
      let y1 = y | 0;
      let xDiff = x - x1;
      let yDiff = y - y1;
      if (x < 0 || x >= thisImage.width || y < 0 || y >= thisImage.height) {
        newImage.setBitXY(i2, j);
      } else {
        let index = y1 * thisImage.width + x1;
        let A = thisImage.getBit(index);
        let B = thisImage.getBit(index + 1);
        let C = thisImage.getBit(index + stride);
        let D = thisImage.getBit(index + 1 + stride);
        let result = A | xDiff & B - A | yDiff & C - A | xDiff & yDiff & A - B - C + D;
        if (result > 0) newImage.setBitXY(i2, j);
      }
    }
  }
  return newImage;
}
function rotate$1(angle, options) {
  this.checkProcessable("rotate", {
    bitDepth: [1, 8, 16]
  });
  if (typeof angle !== "number") {
    throw new TypeError("angle must be a number");
  }
  if (angle < 0) {
    angle = Math.ceil(-angle / 360) * 360 + angle;
  }
  switch (angle % 360) {
    case 0:
      return this.clone();
    case 90:
      return rotateRight.call(this);
    case 180:
      return rotate180.call(this);
    case 270:
      return rotateLeft.call(this);
    default:
      return rotateFree.call(this, angle, options);
  }
}
function rotateLeft() {
  if (this.bitDepth === 1) {
    const newImage = new Image(this.height, this.width, {
      kind: "BINARY",
      parent: this
    });
    const newMaxHeight = newImage.height - 1;
    for (let i2 = 0; i2 < this.height; i2++) {
      for (let j = 0; j < this.width; j++) {
        if (this.getBitXY(j, i2)) {
          newImage.setBitXY(i2, newMaxHeight - j);
        }
      }
    }
    return newImage;
  } else {
    const newImage = Image.createFrom(this, {
      width: this.height,
      height: this.width
    });
    const newMaxHeight = newImage.height - 1;
    for (let i2 = 0; i2 < this.height; i2++) {
      for (let j = 0; j < this.width; j++) {
        for (let k = 0; k < this.channels; k++) {
          newImage.setValueXY(i2, newMaxHeight - j, k, this.getValueXY(j, i2, k));
        }
      }
    }
    return newImage;
  }
}
function rotateRight() {
  if (this.bitDepth === 1) {
    const newImage = new Image(this.height, this.width, {
      kind: "BINARY",
      parent: this
    });
    const newMaxWidth = newImage.width - 1;
    for (let i2 = 0; i2 < this.height; i2++) {
      for (let j = 0; j < this.width; j++) {
        if (this.getBitXY(j, i2)) {
          newImage.setBitXY(newMaxWidth - i2, j);
        }
      }
    }
    return newImage;
  } else {
    const newImage = Image.createFrom(this, {
      width: this.height,
      height: this.width
    });
    const newMaxWidth = newImage.width - 1;
    for (let i2 = 0; i2 < this.height; i2++) {
      for (let j = 0; j < this.width; j++) {
        for (let k = 0; k < this.channels; k++) {
          newImage.setValueXY(newMaxWidth - i2, j, k, this.getValueXY(j, i2, k));
        }
      }
    }
    return newImage;
  }
}
function rotate180() {
  if (this.bitDepth === 1) {
    const newImage = new Image(this.width, this.height, {
      kind: "BINARY",
      parent: this
    });
    const newMaxWidth = newImage.width - 1;
    const newMaxHeight = newImage.height - 1;
    for (let i2 = 0; i2 < this.height; i2++) {
      for (let j = 0; j < this.width; j++) {
        if (this.getBitXY(j, i2)) {
          newImage.setBitXY(newMaxWidth - j, newMaxHeight - i2);
        }
      }
    }
    return newImage;
  } else {
    const newImage = Image.createFrom(this);
    const newMaxWidth = newImage.width - 1;
    const newMaxHeight = newImage.height - 1;
    for (let i2 = 0; i2 < this.height; i2++) {
      for (let j = 0; j < this.width; j++) {
        for (let k = 0; k < this.channels; k++) {
          newImage.setValueXY(
            newMaxWidth - j,
            newMaxHeight - i2,
            k,
            this.getValueXY(j, i2, k)
          );
        }
      }
    }
    return newImage;
  }
}
function insert(toInsert, options = {}) {
  const parameters = getImageParameters(toInsert);
  this.checkProcessable("insert", parameters);
  let { x = 0, y = 0 } = options;
  const out = getOutputImageOrInPlace(this, options, { copy: true });
  const maxY = Math.min(out.height, y + toInsert.height);
  const maxX = Math.min(out.width, x + toInsert.width);
  if (out.bitDepth === 1) {
    for (let j = y; j < maxY; j++) {
      for (let i2 = x; i2 < maxX; i2++) {
        const val = toInsert.getBitXY(i2 - x, j - y);
        if (val) out.setBitXY(i2, j);
        else out.clearBitXY(i2, j);
      }
    }
  } else {
    for (let j = y; j < maxY; j++) {
      for (let i2 = x; i2 < maxX; i2++) {
        out.setPixelXY(i2, j, toInsert.getPixelXY(i2 - x, j - y));
      }
    }
  }
  return out;
}
function setBorder(options = {}) {
  let { size = 0, algorithm = "copy", color } = options;
  this.checkProcessable("setBorder", {
    bitDepth: [8, 16, 32, 64]
  });
  if (algorithm === "set") {
    if (color.length !== this.channels) {
      throw new Error(
        `setBorder: the color array must have the same length as the number of channels. Here: ${this.channels}`
      );
    }
    for (let i2 = 0; i2 < color.length; i2++) {
      if (color[i2] === 0) {
        color[i2] = 1e-3;
      }
    }
  } else {
    color = newArray$1(this.channels, null);
  }
  if (!Array.isArray(size)) {
    size = [size, size];
  }
  let leftRightSize = size[0];
  let topBottomSize = size[1];
  let channels = this.channels;
  for (let i2 = leftRightSize; i2 < this.width - leftRightSize; i2++) {
    for (let k = 0; k < channels; k++) {
      let value = color[k] || this.data[(i2 + this.width * topBottomSize) * channels + k];
      for (let j = 0; j < topBottomSize; j++) {
        this.data[(j * this.width + i2) * channels + k] = value;
      }
      value = color[k] || this.data[(i2 + this.width * (this.height - topBottomSize - 1)) * channels + k];
      for (let j = this.height - topBottomSize; j < this.height; j++) {
        this.data[(j * this.width + i2) * channels + k] = value;
      }
    }
  }
  for (let j = 0; j < this.height; j++) {
    for (let k = 0; k < channels; k++) {
      let value = color[k] || this.data[(j * this.width + leftRightSize) * channels + k];
      for (let i2 = 0; i2 < leftRightSize; i2++) {
        this.data[(j * this.width + i2) * channels + k] = value;
      }
      value = color[k] || this.data[(j * this.width + this.width - leftRightSize - 1) * channels + k];
      for (let i2 = this.width - leftRightSize; i2 < this.width; i2++) {
        this.data[(j * this.width + i2) * channels + k] = value;
      }
    }
  }
  return this;
}
function split(options = {}) {
  let { preserveAlpha = true } = options;
  this.checkProcessable("split", {
    bitDepth: [8, 16]
  });
  if (this.components === 1) {
    return new Stack([this.clone()]);
  }
  let images = new Stack();
  let data = this.data;
  if (this.alpha && preserveAlpha) {
    for (let i2 = 0; i2 < this.components; i2++) {
      let newImage = Image.createFrom(this, {
        components: 1,
        alpha: true,
        colorModel: GREY$1
      });
      let ptr = 0;
      for (let j = 0; j < data.length; j += this.channels) {
        newImage.data[ptr++] = data[j + i2];
        newImage.data[ptr++] = data[j + this.components];
      }
      images.push(newImage);
    }
  } else {
    for (let i2 = 0; i2 < this.channels; i2++) {
      let newImage = Image.createFrom(this, {
        components: 1,
        alpha: false,
        colorModel: GREY$1
      });
      let ptr = 0;
      for (let j = 0; j < data.length; j += this.channels) {
        newImage.data[ptr++] = data[j + i2];
      }
      images.push(newImage);
    }
  }
  return images;
}
function getChannel(channel, options = {}) {
  let { keepAlpha = false, mergeAlpha = false } = options;
  keepAlpha &= this.alpha;
  mergeAlpha &= this.alpha;
  this.checkProcessable("getChannel", {
    bitDepth: [8, 16]
  });
  channel = validateChannel(this, channel);
  let newImage = Image.createFrom(this, {
    components: 1,
    alpha: keepAlpha,
    colorModel: GREY$1
  });
  let ptr = 0;
  for (let j = 0; j < this.data.length; j += this.channels) {
    if (mergeAlpha) {
      newImage.data[ptr++] = this.data[j + channel] * this.data[j + this.components] / this.maxValue;
    } else {
      newImage.data[ptr++] = this.data[j + channel];
      if (keepAlpha) {
        newImage.data[ptr++] = this.data[j + this.components];
      }
    }
  }
  return newImage;
}
function combineChannels(method = defaultCombineMethod, options = {}) {
  let { mergeAlpha = false, keepAlpha = false } = options;
  mergeAlpha &= this.alpha;
  keepAlpha &= this.alpha;
  this.checkProcessable("combineChannels", {
    bitDepth: [8, 16]
  });
  let newImage = Image.createFrom(this, {
    components: 1,
    alpha: keepAlpha,
    colorModel: GREY$1
  });
  let ptr = 0;
  for (let i2 = 0; i2 < this.size; i2++) {
    let value = method(this.getPixel(i2));
    if (mergeAlpha) {
      newImage.data[ptr++] = value * this.data[i2 * this.channels + this.components] / this.maxValue;
    } else {
      newImage.data[ptr++] = value;
      if (keepAlpha) {
        newImage.data[ptr++] = this.data[i2 * this.channels + this.components];
      }
    }
  }
  return newImage;
}
function defaultCombineMethod(pixel) {
  return (pixel[0] + pixel[1] + pixel[2]) / 3;
}
function setChannel(channel, image) {
  this.checkProcessable("setChannel", {
    bitDepth: [8, 16]
  });
  image.checkProcessable("setChannel (image parameter check)", {
    bitDepth: [this.bitDepth],
    alpha: [0],
    components: [1]
  });
  if (image.width !== this.width || image.height !== this.height) {
    throw new Error("Images must have exactly the same width and height");
  }
  channel = validateChannel(this, channel);
  let ptr = channel;
  for (let i2 = 0; i2 < image.data.length; i2++) {
    this.data[ptr] = image.data[i2];
    ptr += this.channels;
  }
  return this;
}
function getSimilarity(image, options = {}) {
  let {
    shift = [0, 0],
    average,
    channels,
    defaultAlpha,
    normalize: normalize2,
    border = [0, 0]
  } = options;
  this.checkProcessable("getSimilarity", {
    bitDepth: [8, 16]
  });
  if (!Array.isArray(border)) {
    border = [border, border];
  }
  channels = validateArrayOfChannels(this, {
    channels,
    defaultAlpha
  });
  if (this.bitDepth !== image.bitDepth) {
    throw new Error("Both images must have the same bitDepth");
  }
  if (this.channels !== image.channels) {
    throw new Error("Both images must have the same number of channels");
  }
  if (this.colorModel !== image.colorModel) {
    throw new Error("Both images must have the same colorModel");
  }
  if (typeof average === "undefined") {
    average = true;
  }
  let minX = Math.max(border[0], -shift[0]);
  let maxX = Math.min(this.width - border[0], this.width - shift[0]);
  let minY = Math.max(border[1], -shift[1]);
  let maxY = Math.min(this.height - border[1], this.height - shift[1]);
  let results = newArray$1(channels.length, 0);
  for (let i2 = 0; i2 < channels.length; i2++) {
    let c = channels[i2];
    let sumThis = normalize2 ? this.sum[c] : Math.max(this.sum[c], image.sum[c]);
    let sumImage = normalize2 ? image.sum[c] : Math.max(this.sum[c], image.sum[c]);
    if (sumThis !== 0 && sumImage !== 0) {
      for (let x = minX; x < maxX; x++) {
        for (let y = minY; y < maxY; y++) {
          let indexThis = x * this.multiplierX + y * this.multiplierY + c;
          let indexImage = indexThis + shift[0] * this.multiplierX + shift[1] * this.multiplierY;
          results[i2] += Math.min(
            this.data[indexThis] / sumThis,
            image.data[indexImage] / sumImage
          );
        }
      }
    }
  }
  if (average) {
    return results.reduce((sum2, x) => sum2 + x) / results.length;
  }
  return results;
}
function getPixelsGrid(options = {}) {
  let { sampling = [10, 10], painted = false, mask: mask2 } = options;
  this.checkProcessable("getPixelsGrid", {
    bitDepth: [8, 16],
    channels: 1
  });
  if (!Array.isArray(sampling)) {
    sampling = [sampling, sampling];
  }
  const xSampling = sampling[0];
  const ySampling = sampling[1];
  const xyS = [];
  const zS = [];
  const xStep = this.width / xSampling;
  const yStep = this.height / ySampling;
  let currentX = Math.floor(xStep / 2);
  for (let i2 = 0; i2 < xSampling; i2++) {
    let currentY = Math.floor(yStep / 2);
    for (let j = 0; j < ySampling; j++) {
      let x = Math.round(currentX);
      let y = Math.round(currentY);
      if (!mask2 || mask2.getBitXY(x, y)) {
        xyS.push([x, y]);
        zS.push(this.getPixelXY(x, y));
      }
      currentY += yStep;
    }
    currentX += xStep;
  }
  const toReturn = { xyS, zS };
  if (painted) {
    toReturn.painted = this.rgba8().paintPoints(xyS);
  }
  return toReturn;
}
function Matrix(width, height, defaultValue) {
  const matrix2 = new Array(width);
  for (let x = 0; x < width; x++) {
    matrix2[x] = new Array(height);
  }
  if (defaultValue) {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        matrix2[x][y] = defaultValue;
      }
    }
  }
  matrix2.width = width;
  matrix2.height = height;
  Object.setPrototypeOf(matrix2, Matrix.prototype);
  return matrix2;
}
Matrix.prototype.localMin = function(x, y) {
  let min2 = this[x][y];
  let position = [x, y];
  for (let i2 = Math.max(0, x - 1); i2 < Math.min(this.length, x + 2); i2++) {
    for (let j = Math.max(0, y - 1); j < Math.min(this[0].length, y + 2); j++) {
      if (this[i2][j] < min2) {
        min2 = this[i2][j];
        position = [i2, j];
      }
    }
  }
  return {
    position,
    value: min2
  };
};
Matrix.prototype.localMax = function(x, y) {
  let max2 = this[x][y];
  let position = [x, y];
  for (let i2 = Math.max(0, x - 1); i2 < Math.min(this.length, x + 2); i2++) {
    for (let j = Math.max(0, y - 1); j < Math.min(this[0].length, y + 2); j++) {
      if (this[i2][j] > max2) {
        max2 = this[i2][j];
        position = [i2, j];
      }
    }
  }
  return {
    position,
    value: max2
  };
};
Matrix.prototype.localSearch = function(x, y, value) {
  let results = [];
  for (let i2 = Math.max(0, x - 1); i2 < Math.min(this.length, x + 2); i2++) {
    for (let j = Math.max(0, y - 1); j < Math.min(this[0].length, y + 2); j++) {
      if (this[i2][j] === value) {
        results.push([i2, j]);
      }
    }
  }
  return results;
};
function getBestMatch(image, options = {}) {
  let { border } = options;
  this.checkProcessable("getChannel", {
    bitDepth: [8, 16]
  });
  if (this.bitDepth !== image.bitDepth) {
    throw new Error("Both images must have the same bitDepth");
  }
  if (this.channels !== image.channels) {
    throw new Error("Both images must have the same number of channels");
  }
  if (this.colorModel !== image.colorModel) {
    throw new Error("Both images must have the same colorModel");
  }
  let similarityMatrix = new Matrix(image.width, image.height, -Infinity);
  let currentX = Math.floor(image.width / 2);
  let currentY = Math.floor(image.height / 2);
  let middleX = currentX;
  let middleY = currentY;
  let theEnd = false;
  while (!theEnd) {
    let toCalculatePositions = similarityMatrix.localSearch(
      currentX,
      currentY,
      -Infinity
    );
    for (let i2 = 0; i2 < toCalculatePositions.length; i2++) {
      let position = toCalculatePositions[i2];
      let similarity = this.getSimilarity(image, {
        border,
        shift: [middleX - position[0], middleY - position[1]]
      });
      similarityMatrix[position[0]][position[1]] = similarity;
    }
    let max2 = similarityMatrix.localMax(currentX, currentY);
    if (max2.position[0] !== currentX || max2.position[1] !== currentY) {
      currentX = max2.position[0];
      currentY = max2.position[1];
    } else {
      theEnd = true;
    }
  }
  return [currentX - middleX, currentY - middleY];
}
function getRow(row, channel = 0) {
  this.checkProcessable("getRow", {
    bitDepth: [8, 16]
  });
  checkRow(this, row);
  checkChannel(this, channel);
  let array = new Array(this.width);
  let ptr = 0;
  let begin = row * this.width * this.channels + channel;
  let end = begin + this.width * this.channels;
  for (let j = begin; j < end; j += this.channels) {
    array[ptr++] = this.data[j];
  }
  return array;
}
function getColumn(column, channel = 0) {
  this.checkProcessable("getColumn", {
    bitDepth: [8, 16]
  });
  checkColumn(this, column);
  checkChannel(this, channel);
  let array = new Array(this.height);
  let ptr = 0;
  let step = this.width * this.channels;
  for (let j = channel + column * this.channels; j < this.data.length; j += step) {
    array[ptr++] = this.data[j];
  }
  return array;
}
function getMatrix(options = {}) {
  let { channel } = options;
  this.checkProcessable("getMatrix", {
    bitDepth: [8, 16]
  });
  if (channel === void 0) {
    if (this.components > 1) {
      throw new RangeError(
        "You need to define the channel for an image that contains more than one channel"
      );
    }
    channel = 0;
  }
  let matrix2 = new Matrix$2(this.height, this.width);
  for (let x = 0; x < this.height; x++) {
    for (let y = 0; y < this.width; y++) {
      matrix2.set(x, y, this.getValueXY(y, x, channel));
    }
  }
  return matrix2;
}
function setMatrix(matrix2, options = {}) {
  matrix2 = new Matrix$2(matrix2);
  let { channel } = options;
  this.checkProcessable("getMatrix", {
    bitDepth: [8, 16]
  });
  if (channel === void 0) {
    if (this.components > 1) {
      throw new RangeError(
        "You need to define the channel for an image that contains more than one channel"
      );
    }
    channel = 0;
  }
  if (this.width !== matrix2.columns || this.height !== matrix2.rows) {
    throw new RangeError(
      "The size of the matrix must be equal to the size of the image"
    );
  }
  for (let x = 0; x < this.height; x++) {
    for (let y = 0; y < this.width; y++) {
      this.setValueXY(y, x, channel, matrix2.get(x, y));
    }
  }
  return this;
}
function getPixelsArray() {
  this.checkProcessable("getPixelsArray", {
    bitDepth: [8, 16, 32]
  });
  let array = new Array(this.size);
  let ptr = 0;
  for (let i2 = 0; i2 < this.data.length; i2 += this.channels) {
    let pixel = new Array(this.components);
    for (let j = 0; j < this.components; j++) {
      pixel[j] = this.data[i2 + j];
    }
    array[ptr++] = pixel;
  }
  return array;
}
function getIntersection(mask2) {
  let mask1 = this;
  let closestParent = mask1.getClosestCommonParent(mask2);
  let startPos1 = mask1.getRelativePosition(closestParent, {
    defaultFurther: true
  });
  let allRelPos1 = getRelativePositionForAllPixels(mask1, startPos1);
  let startPos2 = mask2.getRelativePosition(closestParent, {
    defaultFurther: true
  });
  let allRelPos2 = getRelativePositionForAllPixels(mask2, startPos2);
  let commonSurface = getCommonSurface(allRelPos1, allRelPos2);
  let intersection = {
    whitePixelsMask1: [],
    whitePixelsMask2: [],
    commonWhitePixels: []
  };
  for (let i2 = 0; i2 < commonSurface.length; i2++) {
    let currentRelativePos = commonSurface[i2];
    let realPos1 = [
      currentRelativePos[0] - startPos1[0],
      currentRelativePos[1] - startPos1[1]
    ];
    let realPos2 = [
      currentRelativePos[0] - startPos2[0],
      currentRelativePos[1] - startPos2[1]
    ];
    let valueBitMask1 = mask1.getBitXY(realPos1[0], realPos1[1]);
    let valueBitMask2 = mask2.getBitXY(realPos2[0], realPos2[1]);
    if (valueBitMask1 === 1 && valueBitMask2 === 1) {
      intersection.commonWhitePixels.push(currentRelativePos);
    }
  }
  for (let i2 = 0; i2 < allRelPos1.length; i2++) {
    let posX;
    let posY;
    if (i2 !== 0) {
      posX = Math.floor(i2 / mask1.width);
      posY = i2 % mask1.width;
    }
    if (mask1.getBitXY(posX, posY) === 1) {
      intersection.whitePixelsMask1.push(allRelPos1[i2]);
    }
  }
  for (let i2 = 0; i2 < allRelPos2.length; i2++) {
    let posX = 0;
    let posY = 0;
    if (i2 !== 0) {
      posX = Math.floor(i2 / mask2.width);
      posY = i2 % mask2.width;
    }
    if (mask2.getBitXY(posX, posY) === 1) {
      intersection.whitePixelsMask2.push(allRelPos2[i2]);
    }
  }
  return intersection;
}
function getRelativePositionForAllPixels(mask2, startPosition) {
  let relativePositions = [];
  for (let i2 = 0; i2 < mask2.height; i2++) {
    for (let j = 0; j < mask2.width; j++) {
      let originalPos = [i2, j];
      relativePositions.push([
        originalPos[0] + startPosition[0],
        originalPos[1] + startPosition[1]
      ]);
    }
  }
  return relativePositions;
}
function getCommonSurface(positionArray1, positionArray2) {
  let i2 = 0;
  let j = 0;
  let commonSurface = [];
  while (i2 < positionArray1.length && j < positionArray2.length) {
    if (positionArray1[i2][0] === positionArray2[j][0] && positionArray1[i2][1] === positionArray2[j][1]) {
      commonSurface.push(positionArray1[i2]);
      i2++;
      j++;
    } else if (positionArray1[i2][0] < positionArray2[j][0] || positionArray1[i2][0] === positionArray2[j][0] && positionArray1[i2][1] < positionArray2[j][1]) {
      i2++;
    } else {
      j++;
    }
  }
  return commonSurface;
}
function getClosestCommonParent(mask2) {
  let depthMask1 = getDepth(this);
  let depthMask2 = getDepth(mask2);
  let furthestParent;
  if (depthMask1 >= depthMask2) {
    furthestParent = getFurthestParent(this, depthMask1);
  } else {
    furthestParent = getFurthestParent(mask2, depthMask2);
  }
  if (depthMask1 === 0 || depthMask2 === 0) {
    return furthestParent;
  }
  let m1 = this;
  let m2 = mask2;
  while (depthMask1 !== depthMask2) {
    if (depthMask1 > depthMask2) {
      m1 = m1.parent;
      if (m1 === null) {
        return furthestParent;
      }
      depthMask1 = depthMask1 - 1;
    } else {
      m2 = m2.parent;
      if (m2 === null) {
        return furthestParent;
      }
      depthMask2 = depthMask2 - 1;
    }
  }
  while (m1 !== m2 && m1 !== null && m2 !== null) {
    m1 = m1.parent;
    m2 = m2.parent;
    if (m1 === null || m2 === null) {
      return furthestParent;
    }
  }
  if (m1 !== m2) {
    return furthestParent;
  }
  return m1;
}
function getDepth(mask2) {
  let d = 0;
  let m = mask2;
  while (m.parent != null) {
    m = m.parent;
    d++;
  }
  return d;
}
function getFurthestParent(mask2, depth) {
  let m = mask2;
  while (depth > 0) {
    m = m.parent;
    depth = depth - 1;
  }
  return m;
}
const defaultOptions$1 = {
  lowThreshold: 10,
  highThreshold: 30,
  gaussianBlur: 1.1
};
const Gx = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1]
];
const Gy = [
  [-1, -2, -1],
  [0, 0, 0],
  [1, 2, 1]
];
const convOptions = {
  bitDepth: 32,
  mode: "periodic"
};
function cannyEdgeDetector(image, options) {
  image.checkProcessable("Canny edge detector", {
    bitDepth: 8,
    channels: 1,
    components: 1
  });
  options = Object.assign({}, defaultOptions$1, options);
  const width = image.width;
  const height = image.height;
  const brightness = image.maxValue;
  const gfOptions = {
    sigma: options.gaussianBlur,
    radius: 3
  };
  const gf = image.gaussianFilter(gfOptions);
  const gradientX = gf.convolution(Gy, convOptions);
  const gradientY = gf.convolution(Gx, convOptions);
  const G = gradientY.hypotenuse(gradientX);
  const Image2 = image.constructor;
  const nms = new Image2(width, height, {
    kind: "GREY",
    bitDepth: 32
  });
  const edges = new Image2(width, height, {
    kind: "GREY",
    bitDepth: 32
  });
  const finalImage = new Image2(width, height, {
    kind: "GREY"
  });
  for (var i2 = 1; i2 < width - 1; i2++) {
    for (var j = 1; j < height - 1; j++) {
      var dir = (Math.round(Math.atan2(gradientY.getValueXY(i2, j, 0), gradientX.getValueXY(i2, j, 0)) * (5 / Math.PI)) + 5) % 5;
      if (!(dir === 0 && (G.getValueXY(i2, j, 0) <= G.getValueXY(i2, j - 1, 0) || G.getValueXY(i2, j, 0) <= G.getValueXY(i2, j + 1, 0)) || dir === 1 && (G.getValueXY(i2, j, 0) <= G.getValueXY(i2 - 1, j + 1, 0) || G.getValueXY(i2, j, 0) <= G.getValueXY(i2 + 1, j - 1, 0)) || dir === 2 && (G.getValueXY(i2, j, 0) <= G.getValueXY(i2 - 1, j, 0) || G.getValueXY(i2, j, 0) <= G.getValueXY(i2 + 1, j, 0)) || dir === 3 && (G.getValueXY(i2, j, 0) <= G.getValueXY(i2 - 1, j - 1, 0) || G.getValueXY(i2, j, 0) <= G.getValueXY(i2 + 1, j + 1, 0)))) {
        nms.setValueXY(i2, j, 0, G.getValueXY(i2, j, 0));
      }
    }
  }
  for (i2 = 0; i2 < width * height; ++i2) {
    var currentNms = nms.data[i2];
    var currentEdge = 0;
    if (currentNms > options.highThreshold) {
      currentEdge++;
      finalImage.data[i2] = brightness;
    }
    if (currentNms > options.lowThreshold) {
      currentEdge++;
    }
    edges.data[i2] = currentEdge;
  }
  var currentPixels = [];
  for (i2 = 1; i2 < width - 1; ++i2) {
    for (j = 1; j < height - 1; ++j) {
      if (edges.getValueXY(i2, j, 0) !== 1) {
        continue;
      }
      outer: for (var k = i2 - 1; k < i2 + 2; ++k) {
        for (var l = j - 1; l < j + 2; ++l) {
          if (edges.getValueXY(k, l, 0) === 2) {
            currentPixels.push([i2, j]);
            finalImage.setValueXY(i2, j, 0, brightness);
            break outer;
          }
        }
      }
    }
  }
  while (currentPixels.length > 0) {
    var newPixels = [];
    for (i2 = 0; i2 < currentPixels.length; ++i2) {
      for (j = -1; j < 2; ++j) {
        for (k = -1; k < 2; ++k) {
          if (j === 0 && k === 0) {
            continue;
          }
          var row = currentPixels[i2][0] + j;
          var col = currentPixels[i2][1] + k;
          if (edges.getValueXY(row, col, 0) === 1 && finalImage.getValueXY(row, col, 0) === 0) {
            newPixels.push([row, col]);
            finalImage.setValueXY(row, col, 0, brightness);
          }
        }
      }
    }
    currentPixels = newPixels;
  }
  return finalImage;
}
function cannyEdge(options) {
  return cannyEdgeDetector(this, options);
}
function extract(mask2, options = {}) {
  let { position } = options;
  this.checkProcessable("extract", {
    bitDepth: [1, 8, 16]
  });
  if (!position) {
    position = mask2.getRelativePosition(this);
    if (!position) {
      throw new Error(
        "extract : can not extract an image because the relative position can not be determined, try to specify manually the position as an array of 2 elements [x,y]."
      );
    }
  }
  if (this.bitDepth > 1) {
    let extract2 = Image.createFrom(this, {
      width: mask2.width,
      height: mask2.height,
      alpha: 1,
      // we force the alpha, otherwise difficult to extract a mask ...
      position,
      parent: this
    });
    for (let x = 0; x < mask2.width; x++) {
      for (let y = 0; y < mask2.height; y++) {
        for (let channel = 0; channel < this.channels; channel++) {
          let value = this.getValueXY(
            x + position[0],
            y + position[1],
            channel
          );
          extract2.setValueXY(x, y, channel, value);
        }
        if (!mask2.getBitXY(x, y)) {
          extract2.setValueXY(x, y, this.components, 0);
        }
      }
    }
    return extract2;
  } else {
    let extract2 = Image.createFrom(this, {
      width: mask2.width,
      height: mask2.height,
      position,
      parent: this
    });
    for (let y = 0; y < mask2.height; y++) {
      for (let x = 0; x < mask2.width; x++) {
        if (mask2.getBitXY(x, y)) {
          if (this.getBitXY(x + position[0], y + position[1])) {
            extract2.setBitXY(x, y);
          }
        }
      }
    }
    return extract2;
  }
}
var fastList = { exports: {} };
(function(module2, exports) {
  (function() {
    function Item(data, prev, next) {
      this.next = next;
      if (next) next.prev = this;
      this.prev = prev;
      if (prev) prev.next = this;
      this.data = data;
    }
    function FastList() {
      if (!(this instanceof FastList)) return new FastList();
      this._head = null;
      this._tail = null;
      this.length = 0;
    }
    FastList.prototype = {
      push: function(data) {
        this._tail = new Item(data, this._tail, null);
        if (!this._head) this._head = this._tail;
        this.length++;
      },
      pop: function() {
        if (this.length === 0) return void 0;
        var t = this._tail;
        this._tail = t.prev;
        if (t.prev) {
          t.prev = this._tail.next = null;
        }
        this.length--;
        if (this.length === 1) this._head = this._tail;
        else if (this.length === 0) this._head = this._tail = null;
        return t.data;
      },
      unshift: function(data) {
        this._head = new Item(data, null, this._head);
        if (!this._tail) this._tail = this._head;
        this.length++;
      },
      shift: function() {
        if (this.length === 0) return void 0;
        var h = this._head;
        this._head = h.next;
        if (h.next) {
          h.next = this._head.prev = null;
        }
        this.length--;
        if (this.length === 1) this._tail = this._head;
        else if (this.length === 0) this._head = this._tail = null;
        return h.data;
      },
      item: function(n) {
        if (n < 0) n = this.length + n;
        var h = this._head;
        while (n-- > 0 && h) h = h.next;
        return h ? h.data : void 0;
      },
      slice: function(n, m) {
        if (!n) n = 0;
        if (!m) m = this.length;
        if (m < 0) m = this.length + m;
        if (n < 0) n = this.length + n;
        if (m === n) {
          return [];
        }
        if (m < n) {
          throw new Error("invalid offset: " + n + "," + m + " (length=" + this.length + ")");
        }
        var len = m - n, ret = new Array(len), i2 = 0, h = this._head;
        while (n-- > 0 && h) h = h.next;
        while (i2 < len && h) {
          ret[i2++] = h.data;
          h = h.next;
        }
        return ret;
      },
      drop: function() {
        FastList.call(this);
      },
      forEach: function(fn, thisp) {
        var p = this._head, i2 = 0, len = this.length;
        while (i2 < len && p) {
          fn.call(thisp || this, p.data, i2, this);
          p = p.next;
          i2++;
        }
      },
      map: function(fn, thisp) {
        var n = new FastList();
        this.forEach(function(v, i2, me) {
          n.push(fn.call(thisp || me, v, i2, me));
        });
        return n;
      },
      filter: function(fn, thisp) {
        var n = new FastList();
        this.forEach(function(v, i2, me) {
          if (fn.call(thisp || me, v, i2, me)) n.push(v);
        });
        return n;
      },
      reduce: function(fn, val, thisp) {
        var i2 = 0, p = this._head, len = this.length;
        if (!val) {
          i2 = 1;
          val = p && p.data;
          p = p && p.next;
        }
        while (i2 < len && p) {
          val = fn.call(thisp || this, val, p.data, this);
          i2++;
          p = p.next;
        }
        return val;
      }
    };
    module2.exports = FastList;
  })();
})(fastList);
var fastListExports = fastList.exports;
const LinkedList = /* @__PURE__ */ getDefaultExportFromCjs(fastListExports);
function floodFill(options = {}) {
  const { x = 0, y = 0, inPlace = true } = options;
  const destination = inPlace ? this : Image.createFrom(this);
  this.checkProcessable("floodFill", { bitDepth: 1 });
  const bit = this.getBitXY(x, y);
  if (bit) return destination;
  const queue = new LinkedList();
  queue.push(new Node(x, y));
  while (queue.length > 0) {
    const node = queue.shift();
    destination.setBitXY(node.x, node.y);
    for (let i2 = node.x + 1; i2 < this.width; i2++) {
      if (!destination.getBitXY(i2, node.y) && !this.getBitXY(i2, node.y)) {
        destination.setBitXY(i2, node.y);
        if (node.y + 1 < this.height && !this.getBitXY(i2, node.y + 1)) {
          queue.push(new Node(i2, node.y + 1));
        }
        if (node.y - 1 >= 0 && !this.getBitXY(i2, node.y - 1)) {
          queue.push(new Node(i2, node.y - 1));
        }
      } else {
        break;
      }
    }
    for (let i2 = node.x - 1; i2 >= 0; i2++) {
      if (!destination.getBitXY(i2, node.y) && !this.getBitXY(i2, node.y)) {
        destination.setBitXY(i2, node.y);
        if (node.y + 1 < this.height && !this.getBitXY(i2, node.y + 1)) {
          queue.push(new Node(i2, node.y + 1));
        }
        if (node.y - 1 >= 0 && !this.getBitXY(i2, node.y - 1)) {
          queue.push(new Node(i2, node.y - 1));
        }
      } else {
        break;
      }
    }
  }
  return destination;
}
function Node(x, y) {
  this.x = x;
  this.y = y;
}
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}
function hsv2rgb(h, s, v) {
  s = s / 100;
  v = v / 100;
  var rgb2 = [];
  var c = v * s;
  var hh = h / 60;
  var x = c * (1 - Math.abs(hh % 2 - 1));
  var m = v - c;
  if (hh >= 0 && hh < 1) {
    rgb2 = [c, x, 0];
  } else if (hh >= 1 && hh < 2) {
    rgb2 = [x, c, 0];
  } else if (hh >= 2 && hh < 3) {
    rgb2 = [0, c, x];
  } else if (h >= 3 && hh < 4) {
    rgb2 = [0, x, c];
  } else if (h >= 4 && hh < 5) {
    rgb2 = [x, 0, c];
  } else if (h >= 5 && hh <= 6) {
    rgb2 = [c, 0, x];
  } else {
    rgb2 = [0, 0, 0];
  }
  return {
    r: Math.round(255 * (rgb2[0] + m)),
    g: Math.round(255 * (rgb2[1] + m)),
    b: Math.round(255 * (rgb2[2] + m))
  };
}
function hsl2hsv(h, s, l) {
  s *= (l < 50 ? l : 100 - l) / 100;
  return {
    h,
    s: 2 * s / (l + s) * 100,
    v: l + s
  };
}
function hsl2rgb$1(h, s, l) {
  var hsv2 = hsl2hsv(h, s, l);
  return hsv2rgb(hsv2.h, hsv2.s, hsv2.v);
}
var colors = {
  aliceblue: [240, 248, 255],
  antiquewhite: [250, 235, 215],
  aqua: [0, 255, 255],
  aquamarine: [127, 255, 212],
  azure: [240, 255, 255],
  beige: [245, 245, 220],
  bisque: [255, 228, 196],
  black: [0, 0, 0],
  blanchedalmond: [255, 235, 205],
  blue: [0, 0, 255],
  blueviolet: [138, 43, 226],
  brown: [165, 42, 42],
  burlywood: [222, 184, 135],
  cadetblue: [95, 158, 160],
  chartreuse: [127, 255, 0],
  chocolate: [210, 105, 30],
  coral: [255, 127, 80],
  cornflowerblue: [100, 149, 237],
  cornsilk: [255, 248, 220],
  crimson: [220, 20, 60],
  cyan: [0, 255, 255],
  darkblue: [0, 0, 139],
  darkcyan: [0, 139, 139],
  darkgoldenrod: [184, 132, 11],
  darkgray: [169, 169, 169],
  darkgreen: [0, 100, 0],
  darkgrey: [169, 169, 169],
  darkkhaki: [189, 183, 107],
  darkmagenta: [139, 0, 139],
  darkolivegreen: [85, 107, 47],
  darkorange: [255, 140, 0],
  darkorchid: [153, 50, 204],
  darkred: [139, 0, 0],
  darksalmon: [233, 150, 122],
  darkseagreen: [143, 188, 143],
  darkslateblue: [72, 61, 139],
  darkslategray: [47, 79, 79],
  darkslategrey: [47, 79, 79],
  darkturquoise: [0, 206, 209],
  darkviolet: [148, 0, 211],
  deeppink: [255, 20, 147],
  deepskyblue: [0, 191, 255],
  dimgray: [105, 105, 105],
  dimgrey: [105, 105, 105],
  dodgerblue: [30, 144, 255],
  firebrick: [178, 34, 34],
  floralwhite: [255, 255, 240],
  forestgreen: [34, 139, 34],
  fuchsia: [255, 0, 255],
  gainsboro: [220, 220, 220],
  ghostwhite: [248, 248, 255],
  gold: [255, 215, 0],
  goldenrod: [218, 165, 32],
  gray: [128, 128, 128],
  green: [0, 128, 0],
  greenyellow: [173, 255, 47],
  grey: [128, 128, 128],
  honeydew: [240, 255, 240],
  hotpink: [255, 105, 180],
  indianred: [205, 92, 92],
  indigo: [75, 0, 130],
  ivory: [255, 255, 240],
  khaki: [240, 230, 140],
  lavender: [230, 230, 250],
  lavenderblush: [255, 240, 245],
  lawngreen: [124, 252, 0],
  lemonchiffon: [255, 250, 205],
  lightblue: [173, 216, 230],
  lightcoral: [240, 128, 128],
  lightcyan: [224, 255, 255],
  lightgoldenrodyellow: [250, 250, 210],
  lightgray: [211, 211, 211],
  lightgreen: [144, 238, 144],
  lightgrey: [211, 211, 211],
  lightpink: [255, 182, 193],
  lightsalmon: [255, 160, 122],
  lightseagreen: [32, 178, 170],
  lightskyblue: [135, 206, 250],
  lightslategray: [119, 136, 153],
  lightslategrey: [119, 136, 153],
  lightsteelblue: [176, 196, 222],
  lightyellow: [255, 255, 224],
  lime: [0, 255, 0],
  limegreen: [50, 205, 50],
  linen: [250, 240, 230],
  magenta: [255, 0, 255],
  maroon: [128, 0, 0],
  mediumaquamarine: [102, 205, 170],
  mediumblue: [0, 0, 205],
  mediumorchid: [186, 85, 211],
  mediumpurple: [147, 112, 219],
  mediumseagreen: [60, 179, 113],
  mediumslateblue: [123, 104, 238],
  mediumspringgreen: [0, 250, 154],
  mediumturquoise: [72, 209, 204],
  mediumvioletred: [199, 21, 133],
  midnightblue: [25, 25, 112],
  mintcream: [245, 255, 250],
  mistyrose: [255, 228, 225],
  moccasin: [255, 228, 181],
  navajowhite: [255, 222, 173],
  navy: [0, 0, 128],
  oldlace: [253, 245, 230],
  olive: [128, 128, 0],
  olivedrab: [107, 142, 35],
  orange: [255, 165, 0],
  orangered: [255, 69, 0],
  orchid: [218, 112, 214],
  palegoldenrod: [238, 232, 170],
  palegreen: [152, 251, 152],
  paleturquoise: [175, 238, 238],
  palevioletred: [219, 112, 147],
  papayawhip: [255, 239, 213],
  peachpuff: [255, 218, 185],
  peru: [205, 133, 63],
  pink: [255, 192, 203],
  plum: [221, 160, 203],
  powderblue: [176, 224, 230],
  purple: [128, 0, 128],
  rebeccapurple: [102, 51, 153],
  red: [255, 0, 0],
  rosybrown: [188, 143, 143],
  royalblue: [65, 105, 225],
  saddlebrown: [139, 69, 19],
  salmon: [250, 128, 114],
  sandybrown: [244, 164, 96],
  seagreen: [46, 139, 87],
  seashell: [255, 245, 238],
  sienna: [160, 82, 45],
  silver: [192, 192, 192],
  skyblue: [135, 206, 235],
  slateblue: [106, 90, 205],
  slategray: [119, 128, 144],
  slategrey: [119, 128, 144],
  snow: [255, 255, 250],
  springgreen: [0, 255, 127],
  steelblue: [70, 130, 180],
  tan: [210, 180, 140],
  teal: [0, 128, 128],
  thistle: [216, 191, 216],
  tomato: [255, 99, 71],
  turquoise: [64, 224, 208],
  violet: [238, 130, 238],
  wheat: [245, 222, 179],
  white: [255, 255, 255],
  whitesmoke: [245, 245, 245],
  yellow: [255, 255, 0],
  yellowgreen: [154, 205, 5]
};
function parse(str) {
  return named(str) || hex3(str) || hex6(str) || rgb(str) || rgba$1(str) || hsl(str) || hsla(str);
}
function named(str) {
  var c = colors[str.toLowerCase()];
  if (!c) return;
  return {
    r: c[0],
    g: c[1],
    b: c[2],
    a: 100
  };
}
function rgb(str) {
  var m = str.match(/rgb\(([^)]+)\)/);
  if (m) {
    var parts = m[1].split(/ *, */).map(Number);
    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: 100
    };
  }
}
function rgba$1(str) {
  var m = str.match(/rgba\(([^)]+)\)/);
  if (m) {
    var parts = m[1].split(/ *, */).map(Number);
    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: parts[3] * 100
    };
  }
}
function hex6(str) {
  if ("#" === str[0] && 7 === str.length) {
    return {
      r: parseInt(str.slice(1, 3), 16),
      g: parseInt(str.slice(3, 5), 16),
      b: parseInt(str.slice(5, 7), 16),
      a: 100
    };
  }
}
function hex3(str) {
  if ("#" === str[0] && 4 === str.length) {
    return {
      r: parseInt(str[1] + str[1], 16),
      g: parseInt(str[2] + str[2], 16),
      b: parseInt(str[3] + str[3], 16),
      a: 100
    };
  }
}
function hsl(str) {
  var m = str.match(/hsl\(([^)]+)\)/);
  if (m) {
    var parts = m[1].split(/ *, */);
    var h = parseInt(parts[0], 10);
    var s = parseInt(parts[1], 10);
    var l = parseInt(parts[2], 10);
    var _rgb = hsl2rgb$1(h, s, l);
    return _extends({}, _rgb, {
      a: 100
    });
  }
}
function hsla(str) {
  var m = str.match(/hsla\(([^)]+)\)/);
  if (m) {
    var parts = m[1].split(/ *, */);
    var h = parseInt(parts[0], 10);
    var s = parseInt(parts[1], 10);
    var l = parseInt(parts[2], 10);
    var a = parseInt(parseFloat(parts[3]) * 100, 10);
    var _rgb2 = hsl2rgb$1(h, s, l);
    return _extends({}, _rgb2, {
      a
    });
  }
}
function css2array(string) {
  let color = parse(string);
  return [color.r, color.g, color.b, Math.round(color.a * 255 / 100)];
}
function hue2rgb(p, q, t) {
  if (t < 0) {
    t += 1;
  }
  if (t > 1) {
    t -= 1;
  }
  if (t < 1 / 6) {
    return p + (q - p) * 6 * t;
  }
  if (t < 1 / 2) {
    return q;
  }
  if (t < 2 / 3) {
    return p + (q - p) * (2 / 3 - t) * 6;
  }
  return p;
}
function hsl2rgb(h, s, l) {
  let m1, m2, hue, r, g, b;
  s /= 100;
  l /= 100;
  if (s === 0) {
    r = g = b = l * 255;
  } else {
    if (l <= 0.5) {
      m2 = l * (s + 1);
    } else {
      m2 = l + s - l * s;
    }
    m1 = l * 2 - m2;
    hue = h / 360;
    r = hue2rgb(m1, m2, hue + 1 / 3);
    g = hue2rgb(m1, m2, hue);
    b = hue2rgb(m1, m2, hue - 1 / 3);
  }
  return { r, g, b };
}
function getDistinctColors(numColors) {
  let colors2 = new Array(numColors);
  let j = 0;
  for (let i2 = 0; i2 < 360; i2 += 360 / numColors) {
    j++;
    let color = hsl2rgb(i2, 100, 30 + j % 4 * 15);
    colors2[j - 1] = [
      Math.round(color.r * 255),
      Math.round(color.g * 255),
      Math.round(color.b * 255)
    ];
  }
  return colors2;
}
function getRandomColor() {
  return [
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256)
  ];
}
function getColors(options) {
  let {
    color,
    colors: colors2,
    randomColors,
    // true / false
    numberColors = 50
  } = options;
  if (color && !Array.isArray(color)) {
    color = css2array(color);
  }
  if (color) {
    return [color];
  }
  if (colors2) {
    colors2 = colors2.map(function(color2) {
      if (!Array.isArray(color2)) {
        return css2array(color2);
      }
      return color2;
    });
    return colors2;
  }
  if (randomColors) {
    colors2 = new Array(numberColors);
    for (let i2 = 0; i2 < numberColors; i2++) {
      colors2[i2] = getRandomColor();
    }
  }
  return getDistinctColors(numberColors);
}
function paintLabels(labels, positions, options = {}) {
  let { color = "blue", colors: colors2, font = "12px Helvetica", rotate: rotate2 = 0 } = options;
  this.checkProcessable("paintMasks", {
    channels: [3, 4],
    bitDepth: [8, 16],
    colorModel: RGB$1
  });
  if (!Array.isArray(labels)) {
    throw Error("paintLabels: labels must be an array");
  }
  if (!Array.isArray(positions)) {
    throw Error("paintLabels: positions must be an array");
  }
  if (color && !Array.isArray(color)) {
    color = css2array(color);
  }
  if (colors2) {
    colors2 = colors2.map(function(color2) {
      if (!Array.isArray(color2)) {
        return css2array(color2);
      }
      return color2;
    });
  } else {
    colors2 = [color];
  }
  if (labels.length !== positions.length) {
    throw Error(
      "paintLabels: positions and labels must be arrays from the same size"
    );
  }
  if (!Array.isArray(font)) font = [font];
  if (!Array.isArray(rotate2)) rotate2 = [rotate2];
  let canvas = this.getCanvas();
  let ctx = canvas.getContext("2d");
  for (let i2 = 0; i2 < labels.length; i2++) {
    ctx.save();
    let color2 = colors2[i2 % colors2.length];
    ctx.fillStyle = `rgba(${color2[0]},${color2[1]},${color2[2]},${color2[3] / this.maxValue})`;
    ctx.font = font[i2 % font.length];
    let position = positions[i2];
    ctx.translate(position[0], position[1]);
    ctx.rotate(rotate2[i2 % rotate2.length] / 180 * Math.PI);
    ctx.fillText(labels[i2], 0, 0);
    ctx.restore();
  }
  this.data = Uint8Array.from(
    ctx.getImageData(0, 0, this.width, this.height).data
  );
  return this;
}
function paintMasks(masks, options = {}) {
  let {
    alpha = 255,
    labels = [],
    labelsPosition = [],
    labelColor = "blue",
    labelFont = "12px Helvetica"
  } = options;
  this.checkProcessable("paintMasks", {
    channels: [3, 4],
    bitDepth: [8, 16],
    colorModel: RGB$1
  });
  let colors2 = getColors(
    Object.assign({}, options, { numberColors: masks.length })
  );
  if (!Array.isArray(masks)) {
    masks = [masks];
  }
  for (let i2 = 0; i2 < masks.length; i2++) {
    let mask2 = masks[i2];
    let color = colors2[i2 % colors2.length];
    for (let x = 0; x < mask2.width; x++) {
      for (let y = 0; y < mask2.height; y++) {
        if (mask2.getBitXY(x, y)) {
          for (let component = 0; component < Math.min(this.components, color.length); component++) {
            if (alpha === 255) {
              this.setValueXY(
                x + mask2.position[0],
                y + mask2.position[1],
                component,
                color[component]
              );
            } else {
              let value = this.getValueXY(
                x + mask2.position[0],
                y + mask2.position[1],
                component
              );
              value = Math.round(
                (value * (255 - alpha) + color[component] * alpha) / 255
              );
              this.setValueXY(
                x + mask2.position[0],
                y + mask2.position[1],
                component,
                value
              );
            }
          }
        }
      }
    }
  }
  if (Array.isArray(labels) && labels.length > 0) {
    let canvas = this.getCanvas();
    let ctx = canvas.getContext("2d");
    ctx.fillStyle = labelColor;
    ctx.font = labelFont;
    for (let i2 = 0; i2 < Math.min(masks.length, labels.length); i2++) {
      let position = labelsPosition[i2] ? labelsPosition[i2] : masks[i2].position;
      ctx.fillText(labels[i2], position[0], position[1]);
    }
    this.data = Uint8Array.from(
      ctx.getImageData(0, 0, this.width, this.height).data
    );
  }
  return this;
}
function zerosMatrix(height, width) {
  let matrix2 = new Array(height);
  for (let i2 = 0; i2 < height; i2++) {
    matrix2[i2] = new Array(width).fill(0);
  }
  return matrix2;
}
const cross = [
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [1, 1, 1, 1, 1],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0]
];
const smallCross = [
  [0, 1, 0],
  [1, 1, 1],
  [0, 1, 0]
];
class Shape {
  constructor(options = {}) {
    let { kind = "cross", shape, size, width, height, filled = true } = options;
    if (size) {
      width = size;
      height = size;
    }
    if (shape) {
      switch (shape.toLowerCase()) {
        case "square":
        case "rectangle":
          this.matrix = rectangle(width, height, { filled });
          break;
        case "circle":
        case "ellipse":
          this.matrix = ellipse(width, height, { filled });
          break;
        case "triangle":
          this.matrix = triangle(width, height, { filled });
          break;
        default:
          throw new Error(`Shape: unexpected shape: ${shape}`);
      }
    } else if (kind) {
      switch (kind.toLowerCase()) {
        case "cross":
          this.matrix = cross;
          break;
        case "smallcross":
          this.matrix = smallCross;
          break;
        default:
          throw new Error(`Shape: unexpected kind: ${kind}`);
      }
    } else {
      throw new Error("Shape: expected a kind or a shape option");
    }
    this.height = this.matrix.length;
    this.width = this.matrix[0].length;
    this.halfHeight = this.height / 2 >> 0;
    this.halfWidth = this.width / 2 >> 0;
  }
  /**
   * Returns an array of [x,y] points
   * @return {Array<Array<number>>} - Array of [x,y] points
   */
  getPoints() {
    let matrix2 = this.matrix;
    let points2 = [];
    for (let y = 0; y < matrix2.length; y++) {
      for (let x = 0; x < matrix2[0].length; x++) {
        if (matrix2[y][x]) {
          points2.push([x - this.halfWidth, y - this.halfHeight]);
        }
      }
    }
    return points2;
  }
  /**
   * Returns a Mask (1 bit Image) corresponding to this shape.
   * @return {Image}
   */
  getMask() {
    let img = new Image(this.width, this.height, {
      kind: BINARY
    });
    for (let y = 0; y < this.matrix.length; y++) {
      for (let x = 0; x < this.matrix[0].length; x++) {
        if (this.matrix[y][x]) {
          img.setBitXY(x, y);
        }
      }
    }
    return img;
  }
}
function rectangle(width, height, options) {
  const matrix2 = zerosMatrix(height, width);
  if (options.filled) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        matrix2[y][x] = 1;
      }
    }
  } else {
    for (let y of [0, height - 1]) {
      for (let x = 0; x < width; x++) {
        matrix2[y][x] = 1;
      }
    }
    for (let y = 0; y < height; y++) {
      for (let x of [0, width - 1]) {
        matrix2[y][x] = 1;
      }
    }
  }
  return matrix2;
}
function ellipse(width, height, options) {
  const matrix2 = zerosMatrix(height, width);
  let yEven = 1 - height % 2;
  let xEven = 1 - width % 2;
  let a = Math.floor((width - 1) / 2);
  let b = Math.floor((height - 1) / 2);
  let a2 = a * a;
  let b2 = b * b;
  if (options.filled) {
    for (let y = 0; y <= b; y++) {
      let shift = Math.floor(Math.sqrt(a2 - a2 * y * y / b2));
      for (let x = a - shift; x <= a; x++) {
        matrix2[b - y][x] = 1;
        matrix2[b + y + yEven][x] = 1;
        matrix2[b - y][width - x - 1] = 1;
        matrix2[b + y + yEven][width - x - 1] = 1;
      }
    }
  } else {
    for (let y = 0; y <= b; y++) {
      let shift = Math.floor(Math.sqrt(a2 - a2 * y * y / b2));
      let x = a - shift;
      matrix2[b - y][x] = 1;
      matrix2[b + y + yEven][x] = 1;
      matrix2[b - y][width - x - 1] = 1;
      matrix2[b + y + yEven][width - x - 1] = 1;
    }
    for (let x = 0; x <= a; x++) {
      let shift = Math.floor(Math.sqrt(b2 - b2 * x * x / a2));
      let y = b - shift;
      matrix2[y][a - x] = 1;
      matrix2[y][a + x + xEven] = 1;
      matrix2[height - y - 1][a - x] = 1;
      matrix2[height - y - 1][a + x + xEven] = 1;
    }
  }
  return matrix2;
}
function triangle(width, height, options) {
  if (!options.filled) {
    throw new Error("Non filled triangle is not implemented");
  }
  const matrix2 = zerosMatrix(height, width);
  for (let y = 0; y < height; y++) {
    let shift = Math.floor((1 - y / height) * width / 2);
    for (let x = shift; x < width - shift; x++) {
      matrix2[y][x] = 1;
    }
  }
  return matrix2;
}
function paintPoints(points2, options = {}) {
  let { shape } = options;
  this.checkProcessable("paintPoints", {
    bitDepth: [8, 16]
  });
  let colors2 = getColors(
    Object.assign({}, options, { numberColors: points2.length })
  );
  let shapePixels = new Shape(shape).getPoints();
  let numberChannels = Math.min(this.channels, colors2[0].length);
  for (let i2 = 0; i2 < points2.length; i2++) {
    let color = colors2[i2 % colors2.length];
    let xP = points2[i2][0];
    let yP = points2[i2][1];
    for (let j = 0; j < shapePixels.length; j++) {
      let xS = shapePixels[j][0];
      let yS = shapePixels[j][1];
      if (xP + xS >= 0 && yP + yS >= 0 && xP + xS < this.width && yP + yS < this.height) {
        let position = (xP + xS + (yP + yS) * this.width) * this.channels;
        for (let channel = 0; channel < numberChannels; channel++) {
          this.data[position + channel] = color[channel];
        }
      }
    }
  }
  return this;
}
function paintPolyline(points2, options = {}) {
  let { color = [this.maxValue, 0, 0], closed = false } = options;
  this.checkProcessable("paintPoints", {
    bitDepth: [1, 8, 16]
  });
  let numberChannels = Math.min(this.channels, color.length);
  for (let i2 = 0; i2 < points2.length - 1 + closed; i2++) {
    let from = points2[i2];
    let to = points2[(i2 + 1) % points2.length];
    let dx = to[0] - from[0];
    let dy = to[1] - from[1];
    let steps = Math.max(Math.abs(dx), Math.abs(dy));
    let xIncrement = dx / steps;
    let yIncrement = dy / steps;
    let x = from[0];
    let y = from[1];
    for (let j = 0; j <= steps; j++) {
      let xPoint = Math.round(x);
      let yPoint = Math.round(y);
      if (xPoint >= 0 && yPoint >= 0 && xPoint < this.width && yPoint < this.height) {
        if (this.bitDepth === 1) {
          this.setBitXY(xPoint, yPoint);
        } else {
          let position = (xPoint + yPoint * this.width) * this.channels;
          for (let channel = 0; channel < numberChannels; channel++) {
            this.data[position + channel] = color[channel];
          }
        }
      }
      x = x + xIncrement;
      y = y + yIncrement;
    }
  }
  return this;
}
function paintPolylines(polylines, options = {}) {
  let optionsCopy = Object.assign({}, options);
  this.checkProcessable("paintPolylines", {
    bitDepth: [8, 16]
  });
  let colors2 = getColors(
    Object.assign({}, options, { numberColors: polylines.length })
  );
  for (let i2 = 0; i2 < polylines.length; i2++) {
    optionsCopy.color = colors2[i2 % colors2.length];
    this.paintPolyline(polylines[i2], optionsCopy);
  }
  return this;
}
function paintPolygon(points2, options = {}) {
  let { color = [this.maxValue, 0, 0], filled = false } = options;
  this.checkProcessable("paintPoints", {
    bitDepth: [1, 8, 16]
  });
  options.closed = true;
  let filteredPoints = deleteDouble(points2);
  if (filled === false) {
    return this.paintPolyline(points2, options);
  } else {
    let matrixBinary = Array(this.height);
    for (let i2 = 0; i2 < this.height; i2++) {
      matrixBinary[i2] = [];
      for (let j = 0; j < this.width; j++) {
        matrixBinary[i2].push(0);
      }
    }
    for (let p = 0; p < filteredPoints.length; p++) {
      const line = lineBetweenTwoPoints(
        filteredPoints[p],
        filteredPoints[(p + 1) % filteredPoints.length]
      );
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (isAtTheRightOfTheLine(x, y, line, this.height)) {
            matrixBinary[y][x] = matrixBinary[y][x] === 0 ? 1 : 0;
          }
        }
      }
    }
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (matrixBinary[y][x] === 1) {
          if (this.bitDepth === 1) {
            this.setBitXY(x, y);
          } else {
            let numberChannels = Math.min(this.channels, color.length);
            let position = (x + y * this.width) * this.channels;
            for (let channel = 0; channel < numberChannels; channel++) {
              this.data[position + channel] = color[channel];
            }
          }
        }
      }
    }
    return this.paintPolyline(points2, options);
  }
}
function deleteDouble(points2) {
  let finalPoints = [];
  for (let i2 = 0; i2 < points2.length; i2++) {
    if (points2[i2][0] === points2[(i2 + 1) % points2.length][0] && points2[i2][1] === points2[(i2 + 1) % points2.length][1]) {
      continue;
    } else if (points2[i2][0] === points2[(i2 - 1 + points2.length) % points2.length][0] && points2[i2][1] === points2[(i2 - 1 + points2.length) % points2.length][1]) {
      continue;
    } else if (points2[(i2 + 1) % points2.length][0] === points2[(i2 - 1 + points2.length) % points2.length][0] && points2[(i2 - 1 + points2.length) % points2.length][1] === points2[(i2 + 1) % points2.length][1]) {
      continue;
    } else {
      finalPoints.push(points2[i2]);
    }
  }
  return finalPoints;
}
function lineBetweenTwoPoints(p1, p2) {
  if (p1[0] === p2[0]) {
    return { a: 0, b: p1[0], vertical: true };
  } else {
    const coeffA = (p2[1] - p1[1]) / (p2[0] - p1[0]);
    const coeffB = p1[1] - coeffA * p1[0];
    return { a: coeffA, b: coeffB, vertical: false };
  }
}
function isAtTheRightOfTheLine(x, y, line, height) {
  if (line.vertical === true) {
    return line.b <= x;
  } else {
    if (line.a === 0) {
      return false;
    } else {
      const xline = (y - line.b) / line.a;
      return xline < x && xline >= 0 && xline <= height;
    }
  }
}
function paintPolygons(polygons, options = {}) {
  let optionsCopy = Object.assign({}, options);
  this.checkProcessable("paintPolygons", {
    bitDepth: [8, 16]
  });
  let colors2 = getColors(
    Object.assign({}, options, { numberColors: polygons.length })
  );
  for (let i2 = 0; i2 < polygons.length; i2++) {
    optionsCopy.color = colors2[i2 % colors2.length];
    this.paintPolygon(polygons[i2], optionsCopy);
  }
  return this;
}
function getHistogram(options = {}) {
  let { maxSlots = 256, channel, useAlpha = true } = options;
  this.checkProcessable("getHistogram", {
    bitDepth: [1, 8, 16]
  });
  if (channel === void 0) {
    if (this.components > 1) {
      throw new RangeError(
        "You need to define the channel for an image that contains more than one channel"
      );
    }
    channel = 0;
  }
  return getChannelHistogram.call(this, channel, { useAlpha, maxSlots });
}
function getHistograms(options = {}) {
  const { maxSlots = 256, useAlpha = true } = options;
  this.checkProcessable("getHistograms", {
    bitDepth: [8, 16]
  });
  let results = new Array(useAlpha ? this.components : this.channels);
  for (let i2 = 0; i2 < results.length; i2++) {
    results[i2] = getChannelHistogram.call(this, i2, { useAlpha, maxSlots });
  }
  return results;
}
function getChannelHistogram(channel, options) {
  let { useAlpha, maxSlots } = options;
  if (this.bitDepth === 1) {
    let blackWhiteCount = [0, 0];
    for (let i2 = 0; i2 < this.height; i2++) {
      for (let j = 0; j < this.width; j++) {
        let value = this.getBitXY(i2, j);
        if (value === 0) {
          blackWhiteCount[0] += 1;
        } else if (value === 1) {
          blackWhiteCount[1] += 1;
        }
      }
    }
    return blackWhiteCount;
  }
  let bitSlots = Math.log2(maxSlots);
  if (!isInteger$1(bitSlots)) {
    throw new RangeError(
      "maxSlots must be a power of 2, for example: 64, 256, 1024"
    );
  }
  let bitShift = 0;
  if (this.bitDepth > bitSlots) {
    bitShift = this.bitDepth - bitSlots;
  }
  let data = this.data;
  let result = newArray$1(Math.pow(2, Math.min(this.bitDepth, bitSlots)), 0);
  if (useAlpha && this.alpha) {
    let alphaChannelDiff = this.channels - channel - 1;
    for (let i2 = channel; i2 < data.length; i2 += this.channels) {
      result[data[i2] >> bitShift] += data[i2 + alphaChannelDiff] / this.maxValue;
    }
  } else {
    for (let i2 = channel; i2 < data.length; i2 += this.channels) {
      result[data[i2] >> bitShift]++;
    }
  }
  return result;
}
function getColorHistogram(options = {}) {
  let { useAlpha = true, nbSlots = 512 } = options;
  this.checkProcessable("getColorHistogram", {
    bitDepth: [8, 16],
    components: [3]
  });
  let nbSlotsCheck = Math.log(nbSlots) / Math.log(8);
  if (nbSlotsCheck !== Math.floor(nbSlotsCheck)) {
    throw new RangeError(
      "nbSlots must be a power of 8. Usually 8, 64, 512 or 4096"
    );
  }
  let bitShift = this.bitDepth - nbSlotsCheck;
  let data = this.data;
  let result = newArray$1(Math.pow(8, nbSlotsCheck), 0);
  let factor2 = Math.pow(2, nbSlotsCheck * 2);
  let factor1 = Math.pow(2, nbSlotsCheck);
  for (let i2 = 0; i2 < data.length; i2 += this.channels) {
    let slot = (data[i2] >> bitShift) * factor2 + (data[i2 + 1] >> bitShift) * factor1 + (data[i2 + 2] >> bitShift);
    if (useAlpha && this.alpha) {
      result[slot] += data[i2 + this.channels - 1] / this.maxValue;
    } else {
      result[slot]++;
    }
  }
  return result;
}
function min() {
  this.checkProcessable("min", {
    bitDepth: [8, 16, 32]
  });
  let result = newArray$1(this.channels, Infinity);
  for (let i2 = 0; i2 < this.data.length; i2 += this.channels) {
    for (let c = 0; c < this.channels; c++) {
      if (this.data[i2 + c] < result[c]) {
        result[c] = this.data[i2 + c];
      }
    }
  }
  return result;
}
function max() {
  this.checkProcessable("max", {
    bitDepth: [8, 16, 32]
  });
  let result = newArray$1(this.channels, -Infinity);
  for (let i2 = 0; i2 < this.data.length; i2 += this.channels) {
    for (let c = 0; c < this.channels; c++) {
      if (this.data[i2 + c] > result[c]) {
        result[c] = this.data[i2 + c];
      }
    }
  }
  return result;
}
function sum() {
  this.checkProcessable("sum", {
    bitDepth: [8, 16]
  });
  let result = newArray$1(this.channels, 0);
  for (let i2 = 0; i2 < this.data.length; i2 += this.channels) {
    for (let c = 0; c < this.channels; c++) {
      result[c] += this.data[i2 + c];
    }
  }
  return result;
}
function getMoment(xPower = 0, yPower = 0) {
  this.checkProcessable("getMoment", {
    bitDepth: [1]
  });
  let m = 0;
  for (let x = 0; x < this.width; x++) {
    for (let y = 0; y < this.height; y++) {
      if (this.getBitXY(x, y) === 1) {
        m += x ** xPower * y ** yPower;
      }
    }
  }
  return m;
}
function localMaxima(options = {}) {
  let {
    mask: mask2,
    region = 3,
    removeClosePoints = 0,
    invert: invert2 = false,
    maxEquals = 2
  } = options;
  let image = this;
  this.checkProcessable("localMaxima", {
    bitDepth: [8, 16],
    components: 1
  });
  region *= 4;
  let maskExpectedValue = invert2 ? 0 : 1;
  let dx = [1, 0, -1, 0, 1, 1, -1, -1, 2, 0, -2, 0, 2, 2, -2, -2];
  let dy = [0, 1, 0, -1, 1, -1, 1, -1, 0, 2, 0, -2, 2, -2, 2, -2];
  let shift = region <= 8 ? 1 : 2;
  let points2 = [];
  for (let currentY = shift; currentY < image.height - shift; currentY++) {
    for (let currentX = shift; currentX < image.width - shift; currentX++) {
      if (mask2 && mask2.getBitXY(currentX, currentY) !== maskExpectedValue) {
        continue;
      }
      let counter = 0;
      let nbEquals = 0;
      let currentValue = image.data[currentX + currentY * image.width];
      for (let dir = 0; dir < region; dir++) {
        if (invert2) {
          if (image.data[currentX + dx[dir] + (currentY + dy[dir]) * image.width] > currentValue) {
            counter++;
          }
        } else {
          if (image.data[currentX + dx[dir] + (currentY + dy[dir]) * image.width] < currentValue) {
            counter++;
          }
        }
        if (image.data[currentX + dx[dir] + (currentY + dy[dir]) * image.width] === currentValue) {
          nbEquals++;
        }
      }
      if (counter + nbEquals === region && nbEquals <= maxEquals) {
        points2.push([currentX, currentY]);
      }
    }
  }
  if (removeClosePoints > 0) {
    for (let i2 = 0; i2 < points2.length; i2++) {
      for (let j = i2 + 1; j < points2.length; j++) {
        if (Math.sqrt(
          Math.pow(points2[i2][0] - points2[j][0], 2) + Math.pow(points2[i2][1] - points2[j][1], 2)
        ) < removeClosePoints) {
          points2[i2][0] = points2[i2][0] + points2[j][0] >> 1;
          points2[i2][1] = points2[i2][1] + points2[j][1] >> 1;
          points2.splice(j, 1);
          j--;
        }
      }
    }
  }
  return points2;
}
function mean() {
  let histograms2 = this.getHistograms({ maxSlots: this.maxValue + 1 });
  let result = new Array(histograms2.length);
  for (let c = 0; c < histograms2.length; c++) {
    let histogram2 = histograms2[c];
    result[c] = mean$2(histogram2);
  }
  return result;
}
function median() {
  let histograms2 = this.getHistograms({ maxSlots: this.maxValue + 1 });
  let result = new Array(histograms2.length);
  for (let c = 0; c < histograms2.length; c++) {
    let histogram2 = histograms2[c];
    result[c] = median$2(histogram2);
  }
  return result;
}
function points() {
  this.checkProcessable("points", {
    bitDepth: [1]
  });
  const pixels = [];
  for (let x = 0; x < this.width; x++) {
    for (let y = 0; y < this.height; y++) {
      if (this.getBitXY(x, y) === 1) {
        pixels.push([x, y]);
      }
    }
  }
  return pixels;
}
function extendedPoints() {
  this.checkProcessable("extendedPoints", {
    bitDepth: [1]
  });
  const pixels = [];
  for (let y = 0; y < this.height; y++) {
    for (let x = 0; x < this.width; x++) {
      if (this.getBitXY(x, y) === 1) {
        pixels.push([x, y]);
        if (this.getBitXY(x + 1, y) !== 1) {
          pixels.push([x + 1, y]);
          pixels.push([x + 1, y + 1]);
          if (this.getBitXY(x, y + 1) !== 1) {
            pixels.push([x, y + 1]);
          }
        } else {
          if (this.getBitXY(x, y + 1) !== 1) {
            pixels.push([x, y + 1]);
            pixels.push([x + 1, y + 1]);
          }
        }
        while (x < this.width - 2 && this.getBitXY(x + 1, y) === 1 && this.getBitXY(x + 2, y) === 1) {
          x++;
        }
      }
    }
  }
  return pixels;
}
function getRelativePosition(targetImage, options = {}) {
  if (this === targetImage) {
    return [0, 0];
  }
  let position = [0, 0];
  let currentImage = this;
  while (currentImage) {
    if (currentImage === targetImage) {
      return position;
    }
    if (currentImage.position) {
      position[0] += currentImage.position[0];
      position[1] += currentImage.position[1];
    }
    currentImage = currentImage.parent;
  }
  if (options.defaultFurther) return position;
  return false;
}
function countAlphaPixels(options = {}) {
  let { alpha = 1 } = options;
  this.checkProcessable("countAlphaPixels", {
    bitDepth: [8, 16],
    alpha: 1
  });
  let count = 0;
  if (alpha !== void 0) {
    for (let i2 = this.components; i2 < this.data.length; i2 += this.channels) {
      if (this.data[i2] === alpha) {
        count++;
      }
    }
    return count;
  } else {
    return this.size;
  }
}
function monotoneChainConvexHull$1(points2, options = {}) {
  const { sorted } = options;
  if (!sorted) {
    points2 = points2.slice().sort(byXThenY);
  }
  const n = points2.length;
  const result = new Array(n * 2);
  let k = 0;
  for (let i2 = 0; i2 < n; i2++) {
    const point = points2[i2];
    while (k >= 2 && cw(result[k - 2], result[k - 1], point) <= 0) {
      k--;
    }
    result[k++] = point;
  }
  const t = k + 1;
  for (let i2 = n - 2; i2 >= 0; i2--) {
    const point = points2[i2];
    while (k >= t && cw(result[k - 2], result[k - 1], point) <= 0) {
      k--;
    }
    result[k++] = point;
  }
  return result.slice(0, k - 1);
}
function cw(p1, p2, p3) {
  return (p2[1] - p1[1]) * (p3[0] - p1[0]) - (p2[0] - p1[0]) * (p3[1] - p1[1]);
}
function byXThenY(point1, point2) {
  if (point1[0] === point2[0]) {
    return point1[1] - point2[1];
  }
  return point1[0] - point2[0];
}
function monotoneChainConvexHull() {
  return monotoneChainConvexHull$1(this.extendedPoints, { sorted: false });
}
function round(points2) {
  for (let i2 = 0; i2 < points2.length; i2++) {
    points2[i2][0] = Math.round(points2[i2][0]);
    points2[i2][1] = Math.round(points2[i2][1]);
  }
  return points2;
}
function difference(p1, p2) {
  return [p1[0] - p2[0], p1[1] - p2[1]];
}
function normalize(p) {
  let length = Math.sqrt(p[0] ** 2 + p[1] ** 2);
  return [p[0] / length, p[1] / length];
}
function rotate(radians, srcPoints, destPoints) {
  if (destPoints === void 0) destPoints = new Array(srcPoints.length);
  let cos = Math.cos(radians);
  let sin = Math.sin(radians);
  for (let i2 = 0; i2 < destPoints.length; ++i2) {
    destPoints[i2] = [
      cos * srcPoints[i2][0] - sin * srcPoints[i2][1],
      sin * srcPoints[i2][0] + cos * srcPoints[i2][1]
    ];
  }
  return destPoints;
}
function perimeter(vertices) {
  let total = 0;
  for (let i2 = 0; i2 < vertices.length; i2++) {
    let fromX = vertices[i2][0];
    let fromY = vertices[i2][1];
    let toX = vertices[i2 === vertices.length - 1 ? 0 : i2 + 1][0];
    let toY = vertices[i2 === vertices.length - 1 ? 0 : i2 + 1][1];
    total += Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
  }
  return total;
}
function surface(vertices) {
  let total = 0;
  for (let i2 = 0; i2 < vertices.length; i2++) {
    let addX = vertices[i2][0];
    let addY = vertices[i2 === vertices.length - 1 ? 0 : i2 + 1][1];
    let subX = vertices[i2 === vertices.length - 1 ? 0 : i2 + 1][0];
    let subY = vertices[i2][1];
    total += addX * addY * 0.5;
    total -= subX * subY * 0.5;
  }
  return Math.abs(total);
}
function minMax(points2) {
  let xMin = Infinity;
  let yMin = Infinity;
  let xMax = -Infinity;
  let yMax = -Infinity;
  for (let i2 = 0; i2 < points2.length; i2++) {
    if (points2[i2][0] < xMin) xMin = points2[i2][0];
    if (points2[i2][0] > xMax) xMax = points2[i2][0];
    if (points2[i2][1] < yMin) yMin = points2[i2][1];
    if (points2[i2][1] > yMax) yMax = points2[i2][1];
  }
  return [
    [xMin, yMin],
    [xMax, yMax]
  ];
}
function moveToZeroZero(srcPoints, destPoints) {
  if (destPoints === void 0) {
    destPoints = new Array(srcPoints.length).fill(0).map(() => []);
  }
  let minMaxValues = minMax(srcPoints);
  let xMin = minMaxValues[0][0];
  let yMin = minMaxValues[0][1];
  for (let i2 = 0; i2 < srcPoints.length; i2++) {
    destPoints[i2][0] = srcPoints[i2][0] - xMin;
    destPoints[i2][1] = srcPoints[i2][1] - yMin;
  }
  return destPoints;
}
function minimalBoundingRectangle(options = {}) {
  const { originalPoints = monotoneChainConvexHull.call(this) } = options;
  if (originalPoints.length === 0) {
    return [];
  }
  if (originalPoints.length === 1) {
    return [
      originalPoints[0],
      originalPoints[0],
      originalPoints[0],
      originalPoints[0]
    ];
  }
  const p = new Array(originalPoints.length);
  let minSurface = Infinity;
  let minSurfaceAngle = 0;
  let mbr;
  for (let i2 = 0; i2 < p.length; i2++) {
    let angle = getAngle$1(originalPoints[i2], originalPoints[(i2 + 1) % p.length]);
    rotate(-angle, originalPoints, p);
    let aX = p[i2][0];
    let aY = p[i2][1];
    let bX = p[(i2 + 1) % p.length][0];
    let bY = p[(i2 + 1) % p.length][1];
    let tUndefined = true;
    let tMin = 0;
    let tMax = 0;
    let maxWidth = 0;
    for (let j = 0; j < p.length; j++) {
      let cX = p[j][0];
      let cY = p[j][1];
      let t = (cX - aX) / (bX - aX);
      if (tUndefined === true) {
        tUndefined = false;
        tMin = t;
        tMax = t;
      } else {
        if (t < tMin) tMin = t;
        if (t > tMax) tMax = t;
      }
      let width = (-(bX - aX) * cY + bX * aY - bY * aX) / (bX - aX);
      if (Math.abs(width) > Math.abs(maxWidth)) maxWidth = width;
    }
    let pMin = [aX + tMin * (bX - aX), aY];
    let pMax = [aX + tMax * (bX - aX), aY];
    let currentSurface = Math.abs(maxWidth * (tMin - tMax) * (bX - aX));
    if (currentSurface < minSurface) {
      minSurfaceAngle = angle;
      minSurface = currentSurface;
      mbr = [
        pMin,
        pMax,
        [pMax[0], pMax[1] - maxWidth],
        [pMin[0], pMin[1] - maxWidth]
      ];
    }
  }
  rotate(minSurfaceAngle, mbr, mbr);
  return mbr;
}
function getAngle$1(p1, p2) {
  let diff = difference(p2, p1);
  let vector = normalize(diff);
  let angle = Math.acos(vector[0]);
  if (vector[1] < 0) return -angle;
  return angle;
}
function extend$1(Image2) {
  let inPlace = { inPlace: true };
  Image2.extendMethod("invert", invert);
  Image2.extendMethod("abs", abs);
  Image2.extendMethod("level", level, inPlace);
  Image2.extendMethod("add", add, inPlace);
  Image2.extendMethod("subtract", subtract, inPlace);
  Image2.extendMethod("subtractImage", subtractImage);
  Image2.extendMethod("multiply", multiply, inPlace);
  Image2.extendMethod("divide", divide, inPlace);
  Image2.extendMethod("hypotenuse", hypotenuse);
  Image2.extendMethod("background", background$1);
  Image2.extendMethod("flipX", flipX);
  Image2.extendMethod("flipY", flipY);
  Image2.extendMethod("blurFilter", blurFilter);
  Image2.extendMethod("medianFilter", medianFilter);
  Image2.extendMethod("gaussianFilter", gaussianFilter);
  Image2.extendMethod("sobelFilter", sobelFilter);
  Image2.extendMethod("gradientFilter", gradientFilter);
  Image2.extendMethod("scharrFilter", scharrFilter);
  Image2.extendMethod("dilate", dilate);
  Image2.extendMethod("erode", erode);
  Image2.extendMethod("open", open);
  Image2.extendMethod("close", close);
  Image2.extendMethod("topHat", topHat);
  Image2.extendMethod("blackHat", blackHat);
  Image2.extendMethod("morphologicalGradient", morphologicalGradient);
  Image2.extendMethod("warpingFourPoints", warpingFourPoints);
  Image2.extendMethod("crop", crop);
  Image2.extendMethod("cropAlpha", cropAlpha);
  Image2.extendMethod("resize", resize).extendMethod("scale", resize);
  Image2.extendMethod("hsv", hsv);
  Image2.extendMethod("hsl", hsl$1);
  Image2.extendMethod("cmyk", cmyk);
  Image2.extendMethod("rgba8", rgba8);
  Image2.extendMethod("grey", grey).extendMethod("gray", grey);
  Image2.extendMethod("mask", mask);
  Image2.extendMethod("pad", pad);
  Image2.extendMethod("colorDepth", colorDepth);
  Image2.extendMethod("setBorder", setBorder, inPlace);
  Image2.extendMethod("rotate", rotate$1);
  Image2.extendMethod("rotateLeft", rotateLeft);
  Image2.extendMethod("rotateRight", rotateRight);
  Image2.extendMethod("insert", insert);
  Image2.extendMethod("getRow", getRow);
  Image2.extendMethod("getColumn", getColumn);
  Image2.extendMethod("getMatrix", getMatrix);
  Image2.extendMethod("setMatrix", setMatrix);
  Image2.extendMethod("getPixelsArray", getPixelsArray);
  Image2.extendMethod("getIntersection", getIntersection);
  Image2.extendMethod("getClosestCommonParent", getClosestCommonParent);
  Image2.extendMethod("getThreshold", getThreshold);
  Image2.extendMethod("split", split);
  Image2.extendMethod("getChannel", getChannel);
  Image2.extendMethod("combineChannels", combineChannels);
  Image2.extendMethod("setChannel", setChannel);
  Image2.extendMethod("getSimilarity", getSimilarity);
  Image2.extendMethod("getPixelsGrid", getPixelsGrid);
  Image2.extendMethod("getBestMatch", getBestMatch);
  Image2.extendMethod("cannyEdge", cannyEdge);
  Image2.extendMethod("convolution", convolution);
  Image2.extendMethod("extract", extract);
  Image2.extendMethod("floodFill", floodFill);
  Image2.extendMethod("paintLabels", paintLabels, inPlace);
  Image2.extendMethod("paintMasks", paintMasks, inPlace);
  Image2.extendMethod("paintPoints", paintPoints, inPlace);
  Image2.extendMethod("paintPolyline", paintPolyline, inPlace);
  Image2.extendMethod("paintPolylines", paintPolylines, inPlace);
  Image2.extendMethod("paintPolygon", paintPolygon, inPlace);
  Image2.extendMethod("paintPolygons", paintPolygons, inPlace);
  Image2.extendMethod("countAlphaPixels", countAlphaPixels);
  Image2.extendMethod("monotoneChainConvexHull", monotoneChainConvexHull);
  Image2.extendMethod("minimalBoundingRectangle", minimalBoundingRectangle);
  Image2.extendMethod("getHistogram", getHistogram).extendProperty(
    "histogram",
    getHistogram
  );
  Image2.extendMethod("getHistograms", getHistograms).extendProperty(
    "histograms",
    getHistograms
  );
  Image2.extendMethod("getColorHistogram", getColorHistogram).extendProperty(
    "colorHistogram",
    getColorHistogram
  );
  Image2.extendMethod("getMin", min).extendProperty("min", min);
  Image2.extendMethod("getMax", max).extendProperty("max", max);
  Image2.extendMethod("getSum", sum).extendProperty("sum", sum);
  Image2.extendMethod("getMoment", getMoment).extendProperty(
    "moment",
    getMoment
  );
  Image2.extendMethod("getLocalMaxima", localMaxima);
  Image2.extendMethod("getMedian", median).extendProperty(
    "median",
    median
  );
  Image2.extendMethod("getMean", mean).extendProperty("mean", mean);
  Image2.extendMethod("getPoints", points).extendProperty(
    "points",
    points
  );
  Image2.extendMethod("getExtendedPoints", extendedPoints).extendProperty(
    "extendedPoints",
    extendedPoints
  );
  Image2.extendMethod("getRelativePosition", getRelativePosition);
}
var quantities = { exports: {} };
(function(module2, exports) {
  (function(global2, factory) {
    module2.exports = factory();
  })(commonjsGlobal, function() {
    function isString(value) {
      return typeof value === "string" || value instanceof String;
    }
    var isFiniteImpl = Number.isFinite || window.isFinite;
    function isNumber(value) {
      return isFiniteImpl(value);
    }
    function identity(value) {
      return value;
    }
    function uniq(strings2) {
      var seen = {};
      return strings2.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : seen[item] = true;
      });
    }
    function compareArray(array1, array2) {
      if (array2.length !== array1.length) {
        return false;
      }
      for (var i3 = 0; i3 < array1.length; i3++) {
        if (array2[i3].compareArray) {
          if (!array2[i3].compareArray(array1[i3])) {
            return false;
          }
        }
        if (array2[i3] !== array1[i3]) {
          return false;
        }
      }
      return true;
    }
    function assign2(target, properties) {
      Object.keys(properties).forEach(function(key) {
        target[key] = properties[key];
      });
    }
    function mulSafe() {
      var result = 1, decimals = 0;
      for (var i3 = 0; i3 < arguments.length; i3++) {
        var arg = arguments[i3];
        decimals = decimals + getFractional(arg);
        result *= arg;
      }
      return decimals !== 0 ? round2(result, decimals) : result;
    }
    function divSafe(num, den) {
      if (den === 0) {
        throw new Error("Divide by zero");
      }
      var factor = Math.pow(10, getFractional(den));
      var invDen = factor / (factor * den);
      return mulSafe(num, invDen);
    }
    function round2(val, decimals) {
      return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }
    function getFractional(num) {
      if (!isFinite(num)) {
        return 0;
      }
      var count = 0;
      while (num % 1 !== 0) {
        num *= 10;
        count++;
      }
      return count;
    }
    function QtyError() {
      var err2;
      if (!this) {
        err2 = Object.create(QtyError.prototype);
        QtyError.apply(err2, arguments);
        return err2;
      }
      err2 = Error.apply(this, arguments);
      this.name = "QtyError";
      this.message = err2.message;
      this.stack = err2.stack;
    }
    QtyError.prototype = Object.create(Error.prototype, { constructor: { value: QtyError } });
    function throwIncompatibleUnits(left, right) {
      throw new QtyError("Incompatible units: " + left + " and " + right);
    }
    var UNITS = {
      /* prefixes */
      "<googol>": [["googol"], 1e100, "prefix"],
      "<kibi>": [["Ki", "Kibi", "kibi"], Math.pow(2, 10), "prefix"],
      "<mebi>": [["Mi", "Mebi", "mebi"], Math.pow(2, 20), "prefix"],
      "<gibi>": [["Gi", "Gibi", "gibi"], Math.pow(2, 30), "prefix"],
      "<tebi>": [["Ti", "Tebi", "tebi"], Math.pow(2, 40), "prefix"],
      "<pebi>": [["Pi", "Pebi", "pebi"], Math.pow(2, 50), "prefix"],
      "<exi>": [["Ei", "Exi", "exi"], Math.pow(2, 60), "prefix"],
      "<zebi>": [["Zi", "Zebi", "zebi"], Math.pow(2, 70), "prefix"],
      "<yebi>": [["Yi", "Yebi", "yebi"], Math.pow(2, 80), "prefix"],
      "<yotta>": [["Y", "Yotta", "yotta"], 1e24, "prefix"],
      "<zetta>": [["Z", "Zetta", "zetta"], 1e21, "prefix"],
      "<exa>": [["E", "Exa", "exa"], 1e18, "prefix"],
      "<peta>": [["P", "Peta", "peta"], 1e15, "prefix"],
      "<tera>": [["T", "Tera", "tera"], 1e12, "prefix"],
      "<giga>": [["G", "Giga", "giga"], 1e9, "prefix"],
      "<mega>": [["M", "Mega", "mega"], 1e6, "prefix"],
      "<kilo>": [["k", "kilo"], 1e3, "prefix"],
      "<hecto>": [["h", "Hecto", "hecto"], 100, "prefix"],
      "<deca>": [["da", "Deca", "deca", "deka"], 10, "prefix"],
      "<deci>": [["d", "Deci", "deci"], 0.1, "prefix"],
      "<centi>": [["c", "Centi", "centi"], 0.01, "prefix"],
      "<milli>": [["m", "Milli", "milli"], 1e-3, "prefix"],
      "<micro>": [
        ["u", "μ", "µ", "Micro", "mc", "micro"],
        1e-6,
        "prefix"
      ],
      "<nano>": [["n", "Nano", "nano"], 1e-9, "prefix"],
      "<pico>": [["p", "Pico", "pico"], 1e-12, "prefix"],
      "<femto>": [["f", "Femto", "femto"], 1e-15, "prefix"],
      "<atto>": [["a", "Atto", "atto"], 1e-18, "prefix"],
      "<zepto>": [["z", "Zepto", "zepto"], 1e-21, "prefix"],
      "<yocto>": [["y", "Yocto", "yocto"], 1e-24, "prefix"],
      "<1>": [["1", "<1>"], 1, ""],
      /* length units */
      "<meter>": [["m", "meter", "meters", "metre", "metres"], 1, "length", ["<meter>"]],
      "<inch>": [["in", "inch", "inches", '"'], 0.0254, "length", ["<meter>"]],
      "<foot>": [["ft", "foot", "feet", "'"], 0.3048, "length", ["<meter>"]],
      "<yard>": [["yd", "yard", "yards"], 0.9144, "length", ["<meter>"]],
      "<mile>": [["mi", "mile", "miles"], 1609.344, "length", ["<meter>"]],
      "<naut-mile>": [["nmi", "naut-mile"], 1852, "length", ["<meter>"]],
      "<league>": [["league", "leagues"], 4828, "length", ["<meter>"]],
      "<furlong>": [["furlong", "furlongs"], 201.2, "length", ["<meter>"]],
      "<rod>": [["rd", "rod", "rods"], 5.029, "length", ["<meter>"]],
      "<mil>": [["mil", "mils"], 254e-7, "length", ["<meter>"]],
      "<angstrom>": [["ang", "angstrom", "angstroms"], 1e-10, "length", ["<meter>"]],
      "<fathom>": [["fathom", "fathoms"], 1.829, "length", ["<meter>"]],
      "<pica>": [["pica", "picas"], 0.00423333333, "length", ["<meter>"]],
      "<point>": [["pt", "point", "points"], 352777778e-12, "length", ["<meter>"]],
      "<redshift>": [["z", "red-shift", "redshift"], 1302773e20, "length", ["<meter>"]],
      "<AU>": [["AU", "astronomical-unit"], 1495979e5, "length", ["<meter>"]],
      "<light-second>": [["ls", "light-second"], 299792500, "length", ["<meter>"]],
      "<light-minute>": [["lmin", "light-minute"], 1798755e4, "length", ["<meter>"]],
      "<light-year>": [["ly", "light-year"], 9460528e9, "length", ["<meter>"]],
      "<parsec>": [["pc", "parsec", "parsecs"], 3085678e10, "length", ["<meter>"]],
      "<datamile>": [["DM", "datamile"], 1828.8, "length", ["<meter>"]],
      /* mass */
      "<kilogram>": [["kg", "kilogram", "kilograms"], 1, "mass", ["<kilogram>"]],
      "<AMU>": [["u", "AMU", "amu"], 1660538921e-36, "mass", ["<kilogram>"]],
      "<dalton>": [["Da", "Dalton", "Daltons", "dalton", "daltons"], 1660538921e-36, "mass", ["<kilogram>"]],
      "<slug>": [["slug", "slugs"], 14.5939029, "mass", ["<kilogram>"]],
      "<short-ton>": [["tn", "ton", "short-ton"], 907.18474, "mass", ["<kilogram>"]],
      "<metric-ton>": [["t", "tonne", "metric-ton"], 1e3, "mass", ["<kilogram>"]],
      "<carat>": [["ct", "carat", "carats"], 2e-4, "mass", ["<kilogram>"]],
      "<pound>": [["lbs", "lb", "pound", "pounds", "#"], 0.45359237, "mass", ["<kilogram>"]],
      "<ounce>": [["oz", "ounce", "ounces"], 0.0283495231, "mass", ["<kilogram>"]],
      "<gram>": [["g", "gram", "grams", "gramme", "grammes"], 1e-3, "mass", ["<kilogram>"]],
      "<grain>": [["grain", "grains", "gr"], 6479891e-11, "mass", ["<kilogram>"]],
      "<dram>": [["dram", "drams", "dr"], 0.0017718452, "mass", ["<kilogram>"]],
      "<stone>": [["stone", "stones", "st"], 6.35029318, "mass", ["<kilogram>"]],
      /* area */
      "<hectare>": [["hectare"], 1e4, "area", ["<meter>", "<meter>"]],
      "<acre>": [["acre", "acres"], 4046.85642, "area", ["<meter>", "<meter>"]],
      "<sqft>": [["sqft"], 1, "area", ["<foot>", "<foot>"]],
      /* volume */
      "<liter>": [["l", "L", "liter", "liters", "litre", "litres"], 1e-3, "volume", ["<meter>", "<meter>", "<meter>"]],
      "<gallon>": [["gal", "gallon", "gallons"], 0.0037854118, "volume", ["<meter>", "<meter>", "<meter>"]],
      "<gallon-imp>": [["galimp", "gallon-imp", "gallons-imp"], 454609e-8, "volume", ["<meter>", "<meter>", "<meter>"]],
      "<quart>": [["qt", "quart", "quarts"], 94635295e-11, "volume", ["<meter>", "<meter>", "<meter>"]],
      "<pint>": [["pt", "pint", "pints"], 473176475e-12, "volume", ["<meter>", "<meter>", "<meter>"]],
      "<pint-imp>": [["ptimp", "pint-imp", "pints-imp"], 56826125e-11, "volume", ["<meter>", "<meter>", "<meter>"]],
      "<cup>": [["cu", "cup", "cups"], 236588238e-12, "volume", ["<meter>", "<meter>", "<meter>"]],
      "<fluid-ounce>": [["floz", "fluid-ounce", "fluid-ounces"], 295735297e-13, "volume", ["<meter>", "<meter>", "<meter>"]],
      "<fluid-ounce-imp>": [["flozimp", "floz-imp", "fluid-ounce-imp", "fluid-ounces-imp"], 284130625e-13, "volume", ["<meter>", "<meter>", "<meter>"]],
      "<tablespoon>": [["tb", "tbsp", "tbs", "tablespoon", "tablespoons"], 147867648e-13, "volume", ["<meter>", "<meter>", "<meter>"]],
      "<teaspoon>": [["tsp", "teaspoon", "teaspoons"], 492892161e-14, "volume", ["<meter>", "<meter>", "<meter>"]],
      "<bushel>": [["bu", "bsh", "bushel", "bushels"], 0.035239072, "volume", ["<meter>", "<meter>", "<meter>"]],
      "<oilbarrel>": [["bbl", "oilbarrel", "oilbarrels", "oil-barrel", "oil-barrels"], 0.158987294928, "volume", ["<meter>", "<meter>", "<meter>"]],
      "<beerbarrel>": [["bl", "bl-us", "beerbarrel", "beerbarrels", "beer-barrel", "beer-barrels"], 0.1173477658, "volume", ["<meter>", "<meter>", "<meter>"]],
      "<beerbarrel-imp>": [["blimp", "bl-imp", "beerbarrel-imp", "beerbarrels-imp", "beer-barrel-imp", "beer-barrels-imp"], 0.16365924, "volume", ["<meter>", "<meter>", "<meter>"]],
      /* speed */
      "<kph>": [["kph"], 0.277777778, "speed", ["<meter>"], ["<second>"]],
      "<mph>": [["mph"], 0.44704, "speed", ["<meter>"], ["<second>"]],
      "<knot>": [["kt", "kn", "kts", "knot", "knots"], 0.514444444, "speed", ["<meter>"], ["<second>"]],
      "<fps>": [["fps"], 0.3048, "speed", ["<meter>"], ["<second>"]],
      /* acceleration */
      "<gee>": [["gee"], 9.80665, "acceleration", ["<meter>"], ["<second>", "<second>"]],
      "<Gal>": [["Gal"], 0.01, "acceleration", ["<meter>"], ["<second>", "<second>"]],
      /* temperature_difference */
      "<kelvin>": [["degK", "kelvin"], 1, "temperature", ["<kelvin>"]],
      "<celsius>": [["degC", "celsius", "celsius", "centigrade"], 1, "temperature", ["<kelvin>"]],
      "<fahrenheit>": [["degF", "fahrenheit"], 5 / 9, "temperature", ["<kelvin>"]],
      "<rankine>": [["degR", "rankine"], 5 / 9, "temperature", ["<kelvin>"]],
      "<temp-K>": [["tempK", "temp-K"], 1, "temperature", ["<temp-K>"]],
      "<temp-C>": [["tempC", "temp-C"], 1, "temperature", ["<temp-K>"]],
      "<temp-F>": [["tempF", "temp-F"], 5 / 9, "temperature", ["<temp-K>"]],
      "<temp-R>": [["tempR", "temp-R"], 5 / 9, "temperature", ["<temp-K>"]],
      /* time */
      "<second>": [["s", "sec", "secs", "second", "seconds"], 1, "time", ["<second>"]],
      "<minute>": [["min", "mins", "minute", "minutes"], 60, "time", ["<second>"]],
      "<hour>": [["h", "hr", "hrs", "hour", "hours"], 3600, "time", ["<second>"]],
      "<day>": [["d", "day", "days"], 3600 * 24, "time", ["<second>"]],
      "<week>": [["wk", "week", "weeks"], 7 * 3600 * 24, "time", ["<second>"]],
      "<fortnight>": [["fortnight", "fortnights"], 1209600, "time", ["<second>"]],
      "<year>": [["y", "yr", "year", "years", "annum"], 31556926, "time", ["<second>"]],
      "<decade>": [["decade", "decades"], 315569260, "time", ["<second>"]],
      "<century>": [["century", "centuries"], 3155692600, "time", ["<second>"]],
      /* pressure */
      "<pascal>": [["Pa", "pascal", "Pascal"], 1, "pressure", ["<kilogram>"], ["<meter>", "<second>", "<second>"]],
      "<bar>": [["bar", "bars"], 1e5, "pressure", ["<kilogram>"], ["<meter>", "<second>", "<second>"]],
      "<mmHg>": [["mmHg"], 133.322368, "pressure", ["<kilogram>"], ["<meter>", "<second>", "<second>"]],
      "<inHg>": [["inHg"], 3386.3881472, "pressure", ["<kilogram>"], ["<meter>", "<second>", "<second>"]],
      "<torr>": [["torr"], 133.322368, "pressure", ["<kilogram>"], ["<meter>", "<second>", "<second>"]],
      "<atm>": [["atm", "ATM", "atmosphere", "atmospheres"], 101325, "pressure", ["<kilogram>"], ["<meter>", "<second>", "<second>"]],
      "<psi>": [["psi"], 6894.76, "pressure", ["<kilogram>"], ["<meter>", "<second>", "<second>"]],
      "<cmh2o>": [["cmH2O", "cmh2o"], 98.0638, "pressure", ["<kilogram>"], ["<meter>", "<second>", "<second>"]],
      "<inh2o>": [["inH2O", "inh2o"], 249.082052, "pressure", ["<kilogram>"], ["<meter>", "<second>", "<second>"]],
      /* viscosity */
      "<poise>": [["P", "poise"], 0.1, "viscosity", ["<kilogram>"], ["<meter>", "<second>"]],
      "<stokes>": [["St", "stokes"], 1e-4, "viscosity", ["<meter>", "<meter>"], ["<second>"]],
      /* substance */
      "<mole>": [["mol", "mole"], 1, "substance", ["<mole>"]],
      /* molar_concentration */
      "<molar>": [["M", "molar"], 1e3, "molar_concentration", ["<mole>"], ["<meter>", "<meter>", "<meter>"]],
      "<wtpercent>": [["wt%", "wtpercent"], 10, "molar_concentration", ["<kilogram>"], ["<meter>", "<meter>", "<meter>"]],
      /* activity */
      "<katal>": [["kat", "katal", "Katal"], 1, "activity", ["<mole>"], ["<second>"]],
      "<unit>": [["U", "enzUnit", "unit"], 16667e-19, "activity", ["<mole>"], ["<second>"]],
      /* capacitance */
      "<farad>": [["F", "farad", "Farad"], 1, "capacitance", ["<second>", "<second>", "<second>", "<second>", "<ampere>", "<ampere>"], ["<meter>", "<meter>", "<kilogram>"]],
      /* charge */
      "<coulomb>": [["C", "coulomb", "Coulomb"], 1, "charge", ["<ampere>", "<second>"]],
      "<Ah>": [["Ah"], 3600, "charge", ["<ampere>", "<second>"]],
      /* current */
      "<ampere>": [["A", "Ampere", "ampere", "amp", "amps"], 1, "current", ["<ampere>"]],
      /* conductance */
      "<siemens>": [["S", "Siemens", "siemens"], 1, "conductance", ["<second>", "<second>", "<second>", "<ampere>", "<ampere>"], ["<kilogram>", "<meter>", "<meter>"]],
      /* inductance */
      "<henry>": [["H", "Henry", "henry"], 1, "inductance", ["<meter>", "<meter>", "<kilogram>"], ["<second>", "<second>", "<ampere>", "<ampere>"]],
      /* potential */
      "<volt>": [["V", "Volt", "volt", "volts"], 1, "potential", ["<meter>", "<meter>", "<kilogram>"], ["<second>", "<second>", "<second>", "<ampere>"]],
      /* resistance */
      "<ohm>": [
        [
          "Ohm",
          "ohm",
          "Ω",
          "Ω"
          /*Ω as ohm sign*/
        ],
        1,
        "resistance",
        ["<meter>", "<meter>", "<kilogram>"],
        ["<second>", "<second>", "<second>", "<ampere>", "<ampere>"]
      ],
      /* magnetism */
      "<weber>": [["Wb", "weber", "webers"], 1, "magnetism", ["<meter>", "<meter>", "<kilogram>"], ["<second>", "<second>", "<ampere>"]],
      "<tesla>": [["T", "tesla", "teslas"], 1, "magnetism", ["<kilogram>"], ["<second>", "<second>", "<ampere>"]],
      "<gauss>": [["G", "gauss"], 1e-4, "magnetism", ["<kilogram>"], ["<second>", "<second>", "<ampere>"]],
      "<maxwell>": [["Mx", "maxwell", "maxwells"], 1e-8, "magnetism", ["<meter>", "<meter>", "<kilogram>"], ["<second>", "<second>", "<ampere>"]],
      "<oersted>": [["Oe", "oersted", "oersteds"], 250 / Math.PI, "magnetism", ["<ampere>"], ["<meter>"]],
      /* energy */
      "<joule>": [["J", "joule", "Joule", "joules", "Joules"], 1, "energy", ["<meter>", "<meter>", "<kilogram>"], ["<second>", "<second>"]],
      "<erg>": [["erg", "ergs"], 1e-7, "energy", ["<meter>", "<meter>", "<kilogram>"], ["<second>", "<second>"]],
      "<btu>": [["BTU", "btu", "BTUs"], 1055.056, "energy", ["<meter>", "<meter>", "<kilogram>"], ["<second>", "<second>"]],
      "<calorie>": [["cal", "calorie", "calories"], 4.184, "energy", ["<meter>", "<meter>", "<kilogram>"], ["<second>", "<second>"]],
      "<Calorie>": [["Cal", "Calorie", "Calories"], 4184, "energy", ["<meter>", "<meter>", "<kilogram>"], ["<second>", "<second>"]],
      "<therm-US>": [["th", "therm", "therms", "Therm", "therm-US"], 105480400, "energy", ["<meter>", "<meter>", "<kilogram>"], ["<second>", "<second>"]],
      "<Wh>": [["Wh"], 3600, "energy", ["<meter>", "<meter>", "<kilogram>"], ["<second>", "<second>"]],
      "<electronvolt>": [["eV", "electronvolt", "electronvolts"], 1602176634e-28, "energy", ["<meter>", "<meter>", "<kilogram>"], ["<second>", "<second>"]],
      /* force */
      "<newton>": [["N", "Newton", "newton"], 1, "force", ["<kilogram>", "<meter>"], ["<second>", "<second>"]],
      "<dyne>": [["dyn", "dyne"], 1e-5, "force", ["<kilogram>", "<meter>"], ["<second>", "<second>"]],
      "<pound-force>": [["lbf", "pound-force"], 4.448222, "force", ["<kilogram>", "<meter>"], ["<second>", "<second>"]],
      /* frequency */
      "<hertz>": [["Hz", "hertz", "Hertz"], 1, "frequency", ["<1>"], ["<second>"]],
      /* angle */
      "<radian>": [["rad", "radian", "radians"], 1, "angle", ["<radian>"]],
      "<degree>": [["deg", "degree", "degrees"], Math.PI / 180, "angle", ["<radian>"]],
      "<arcminute>": [["arcmin", "arcminute", "arcminutes"], Math.PI / 10800, "angle", ["<radian>"]],
      "<arcsecond>": [["arcsec", "arcsecond", "arcseconds"], Math.PI / 648e3, "angle", ["<radian>"]],
      "<gradian>": [["gon", "grad", "gradian", "grads"], Math.PI / 200, "angle", ["<radian>"]],
      "<steradian>": [["sr", "steradian", "steradians"], 1, "solid_angle", ["<steradian>"]],
      /* rotation */
      "<rotation>": [["rotation"], 2 * Math.PI, "angle", ["<radian>"]],
      "<rpm>": [["rpm"], 2 * Math.PI / 60, "angular_velocity", ["<radian>"], ["<second>"]],
      /* information */
      "<byte>": [["B", "byte", "bytes"], 1, "information", ["<byte>"]],
      "<bit>": [["b", "bit", "bits"], 0.125, "information", ["<byte>"]],
      /* information rate */
      "<Bps>": [["Bps"], 1, "information_rate", ["<byte>"], ["<second>"]],
      "<bps>": [["bps"], 0.125, "information_rate", ["<byte>"], ["<second>"]],
      /* currency */
      "<dollar>": [["USD", "dollar"], 1, "currency", ["<dollar>"]],
      "<cents>": [["cents"], 0.01, "currency", ["<dollar>"]],
      /* luminosity */
      "<candela>": [["cd", "candela"], 1, "luminosity", ["<candela>"]],
      "<lumen>": [["lm", "lumen"], 1, "luminous_power", ["<candela>", "<steradian>"]],
      "<lux>": [["lux"], 1, "illuminance", ["<candela>", "<steradian>"], ["<meter>", "<meter>"]],
      /* power */
      "<watt>": [["W", "watt", "watts"], 1, "power", ["<kilogram>", "<meter>", "<meter>"], ["<second>", "<second>", "<second>"]],
      "<volt-ampere>": [["VA", "volt-ampere"], 1, "power", ["<kilogram>", "<meter>", "<meter>"], ["<second>", "<second>", "<second>"]],
      "<volt-ampere-reactive>": [["var", "Var", "VAr", "VAR", "volt-ampere-reactive"], 1, "power", ["<kilogram>", "<meter>", "<meter>"], ["<second>", "<second>", "<second>"]],
      "<horsepower>": [["hp", "horsepower"], 745.699872, "power", ["<kilogram>", "<meter>", "<meter>"], ["<second>", "<second>", "<second>"]],
      /* radiation */
      "<gray>": [["Gy", "gray", "grays"], 1, "radiation", ["<meter>", "<meter>"], ["<second>", "<second>"]],
      "<roentgen>": [["R", "roentgen"], 933e-5, "radiation", ["<meter>", "<meter>"], ["<second>", "<second>"]],
      "<sievert>": [["Sv", "sievert", "sieverts"], 1, "radiation", ["<meter>", "<meter>"], ["<second>", "<second>"]],
      "<becquerel>": [["Bq", "becquerel", "becquerels"], 1, "radiation", ["<1>"], ["<second>"]],
      "<curie>": [["Ci", "curie", "curies"], 37e9, "radiation", ["<1>"], ["<second>"]],
      /* rate */
      "<cpm>": [["cpm"], 1 / 60, "rate", ["<count>"], ["<second>"]],
      "<dpm>": [["dpm"], 1 / 60, "rate", ["<count>"], ["<second>"]],
      "<bpm>": [["bpm"], 1 / 60, "rate", ["<count>"], ["<second>"]],
      /* resolution / typography */
      "<dot>": [["dot", "dots"], 1, "resolution", ["<each>"]],
      "<pixel>": [["pixel", "px"], 1, "resolution", ["<each>"]],
      "<ppi>": [["ppi"], 1, "resolution", ["<pixel>"], ["<inch>"]],
      "<dpi>": [["dpi"], 1, "typography", ["<dot>"], ["<inch>"]],
      /* other */
      "<cell>": [["cells", "cell"], 1, "counting", ["<each>"]],
      "<each>": [["each"], 1, "counting", ["<each>"]],
      "<count>": [["count"], 1, "counting", ["<each>"]],
      "<base-pair>": [["bp", "base-pair"], 1, "counting", ["<each>"]],
      "<nucleotide>": [["nt", "nucleotide"], 1, "counting", ["<each>"]],
      "<molecule>": [["molecule", "molecules"], 1, "counting", ["<1>"]],
      "<dozen>": [["doz", "dz", "dozen"], 12, "prefix_only", ["<each>"]],
      "<percent>": [["%", "percent"], 0.01, "prefix_only", ["<1>"]],
      "<ppm>": [["ppm"], 1e-6, "prefix_only", ["<1>"]],
      "<ppb>": [["ppb"], 1e-9, "prefix_only", ["<1>"]],
      "<ppt>": [["ppt"], 1e-12, "prefix_only", ["<1>"]],
      "<ppq>": [["ppq"], 1e-15, "prefix_only", ["<1>"]],
      "<gross>": [["gr", "gross"], 144, "prefix_only", ["<dozen>", "<dozen>"]],
      "<decibel>": [["dB", "decibel", "decibels"], 1, "logarithmic", ["<decibel>"]]
    };
    var BASE_UNITS = ["<meter>", "<kilogram>", "<second>", "<mole>", "<ampere>", "<radian>", "<kelvin>", "<temp-K>", "<byte>", "<dollar>", "<candela>", "<each>", "<steradian>", "<decibel>"];
    var UNITY = "<1>";
    var UNITY_ARRAY = [UNITY];
    function validateUnitDefinition(unitDef2, definition2) {
      var scalar = definition2[1];
      var numerator = definition2[3] || [];
      var denominator = definition2[4] || [];
      if (!isNumber(scalar)) {
        throw new QtyError(unitDef2 + ": Invalid unit definition. 'scalar' must be a number");
      }
      numerator.forEach(function(unit) {
        if (UNITS[unit] === void 0) {
          throw new QtyError(unitDef2 + ": Invalid unit definition. Unit " + unit + " in 'numerator' is not recognized");
        }
      });
      denominator.forEach(function(unit) {
        if (UNITS[unit] === void 0) {
          throw new QtyError(unitDef2 + ": Invalid unit definition. Unit " + unit + " in 'denominator' is not recognized");
        }
      });
    }
    var PREFIX_VALUES = {};
    var PREFIX_MAP = {};
    var UNIT_VALUES = {};
    var UNIT_MAP = {};
    var OUTPUT_MAP = {};
    for (var unitDef in UNITS) {
      if (UNITS.hasOwnProperty(unitDef)) {
        var definition = UNITS[unitDef];
        if (definition[2] === "prefix") {
          PREFIX_VALUES[unitDef] = definition[1];
          for (var i2 = 0; i2 < definition[0].length; i2++) {
            PREFIX_MAP[definition[0][i2]] = unitDef;
          }
        } else {
          validateUnitDefinition(unitDef, definition);
          UNIT_VALUES[unitDef] = {
            scalar: definition[1],
            numerator: definition[3],
            denominator: definition[4]
          };
          for (var j = 0; j < definition[0].length; j++) {
            UNIT_MAP[definition[0][j]] = unitDef;
          }
        }
        OUTPUT_MAP[unitDef] = definition[0][0];
      }
    }
    function getUnits(kind) {
      var i3;
      var units = [];
      var unitKeys = Object.keys(UNITS);
      if (typeof kind === "undefined") {
        for (i3 = 0; i3 < unitKeys.length; i3++) {
          if (["", "prefix"].indexOf(UNITS[unitKeys[i3]][2]) === -1) {
            units.push(unitKeys[i3].substr(1, unitKeys[i3].length - 2));
          }
        }
      } else if (this.getKinds().indexOf(kind) === -1) {
        throw new QtyError("Kind not recognized");
      } else {
        for (i3 = 0; i3 < unitKeys.length; i3++) {
          if (UNITS[unitKeys[i3]][2] === kind) {
            units.push(unitKeys[i3].substr(1, unitKeys[i3].length - 2));
          }
        }
      }
      return units.sort(function(a, b) {
        if (a.toLowerCase() < b.toLowerCase()) {
          return -1;
        }
        if (a.toLowerCase() > b.toLowerCase()) {
          return 1;
        }
        return 0;
      });
    }
    function getAliases(unitName) {
      if (!UNIT_MAP[unitName]) {
        throw new QtyError("Unit not recognized");
      }
      return UNITS[UNIT_MAP[unitName]][0];
    }
    var SIGNATURE_VECTOR = ["length", "time", "temperature", "mass", "current", "substance", "luminosity", "currency", "information", "angle"];
    function unitSignature() {
      if (this.signature) {
        return this.signature;
      }
      var vector = unitSignatureVector.call(this);
      for (var i3 = 0; i3 < vector.length; i3++) {
        vector[i3] *= Math.pow(20, i3);
      }
      return vector.reduce(
        function(previous, current) {
          return previous + current;
        },
        0
      );
    }
    function unitSignatureVector() {
      if (!this.isBase()) {
        return unitSignatureVector.call(this.toBase());
      }
      var vector = new Array(SIGNATURE_VECTOR.length);
      for (var i3 = 0; i3 < vector.length; i3++) {
        vector[i3] = 0;
      }
      var r, n;
      for (var j2 = 0; j2 < this.numerator.length; j2++) {
        if (r = UNITS[this.numerator[j2]]) {
          n = SIGNATURE_VECTOR.indexOf(r[2]);
          if (n >= 0) {
            vector[n] = vector[n] + 1;
          }
        }
      }
      for (var k = 0; k < this.denominator.length; k++) {
        if (r = UNITS[this.denominator[k]]) {
          n = SIGNATURE_VECTOR.indexOf(r[2]);
          if (n >= 0) {
            vector[n] = vector[n] - 1;
          }
        }
      }
      return vector;
    }
    var SIGN = "[+-]";
    var INTEGER = "\\d+";
    var SIGNED_INTEGER = SIGN + "?" + INTEGER;
    var FRACTION = "\\." + INTEGER;
    var FLOAT = "(?:" + INTEGER + "(?:" + FRACTION + ")?)|(?:" + FRACTION + ")";
    var EXPONENT = "[Ee]" + SIGNED_INTEGER;
    var SCI_NUMBER = "(?:" + FLOAT + ")(?:" + EXPONENT + ")?";
    var SIGNED_NUMBER = SIGN + "?\\s*" + SCI_NUMBER;
    var QTY_STRING = "(" + SIGNED_NUMBER + ")?\\s*([^/]*)(?:/(.+))?";
    var QTY_STRING_REGEX = new RegExp("^" + QTY_STRING + "$");
    var POWER_OP = "\\^|\\*{2}";
    var SAFE_POWER = "[01234]";
    var TOP_REGEX = new RegExp("([^ \\*\\d]+?)(?:" + POWER_OP + ")?(-?" + SAFE_POWER + "(?![a-zA-Z]))");
    var BOTTOM_REGEX = new RegExp("([^ \\*\\d]+?)(?:" + POWER_OP + ")?(" + SAFE_POWER + "(?![a-zA-Z]))");
    function parse2(val) {
      if (!isString(val)) {
        val = val.toString();
      }
      val = val.trim();
      var result = QTY_STRING_REGEX.exec(val);
      if (!result) {
        throw new QtyError(val + ": Quantity not recognized");
      }
      var scalarMatch = result[1];
      if (scalarMatch) {
        scalarMatch = scalarMatch.replace(/\s/g, "");
        this.scalar = parseFloat(scalarMatch);
      } else {
        this.scalar = 1;
      }
      var top = result[2];
      var bottom = result[3];
      var n, x, nx;
      while (result = TOP_REGEX.exec(top)) {
        n = parseFloat(result[2]);
        if (isNaN(n)) {
          throw new QtyError("Unit exponent is not a number");
        }
        if (n === 0 && !UNIT_TEST_REGEX.test(result[1])) {
          throw new QtyError("Unit not recognized");
        }
        x = result[1] + " ";
        nx = "";
        for (var i3 = 0; i3 < Math.abs(n); i3++) {
          nx += x;
        }
        if (n >= 0) {
          top = top.replace(result[0], nx);
        } else {
          bottom = bottom ? bottom + nx : nx;
          top = top.replace(result[0], "");
        }
      }
      while (result = BOTTOM_REGEX.exec(bottom)) {
        n = parseFloat(result[2]);
        if (isNaN(n)) {
          throw new QtyError("Unit exponent is not a number");
        }
        if (n === 0 && !UNIT_TEST_REGEX.test(result[1])) {
          throw new QtyError("Unit not recognized");
        }
        x = result[1] + " ";
        nx = "";
        for (var j2 = 0; j2 < n; j2++) {
          nx += x;
        }
        bottom = bottom.replace(result[0], nx);
      }
      if (top) {
        this.numerator = parseUnits(top.trim());
      }
      if (bottom) {
        this.denominator = parseUnits(bottom.trim());
      }
    }
    var PREFIX_REGEX = Object.keys(PREFIX_MAP).sort(function(a, b) {
      return b.length - a.length;
    }).join("|");
    var UNIT_REGEX = Object.keys(UNIT_MAP).sort(function(a, b) {
      return b.length - a.length;
    }).join("|");
    var BOUNDARY_REGEX = "\\b|$";
    var UNIT_MATCH = "(" + PREFIX_REGEX + ")??(" + UNIT_REGEX + ")(?:" + BOUNDARY_REGEX + ")";
    var UNIT_TEST_REGEX = new RegExp("^\\s*(" + UNIT_MATCH + "[\\s\\*]*)+$");
    var UNIT_MATCH_REGEX = new RegExp(UNIT_MATCH, "g");
    var parsedUnitsCache = {};
    function parseUnits(units) {
      var cached = parsedUnitsCache[units];
      if (cached) {
        return cached;
      }
      var unitMatch, normalizedUnits = [];
      if (!UNIT_TEST_REGEX.test(units)) {
        throw new QtyError("Unit not recognized");
      }
      while (unitMatch = UNIT_MATCH_REGEX.exec(units)) {
        normalizedUnits.push(unitMatch.slice(1));
      }
      normalizedUnits = normalizedUnits.map(function(item) {
        return PREFIX_MAP[item[0]] ? [PREFIX_MAP[item[0]], UNIT_MAP[item[1]]] : [UNIT_MAP[item[1]]];
      });
      normalizedUnits = normalizedUnits.reduce(function(a, b) {
        return a.concat(b);
      }, []);
      normalizedUnits = normalizedUnits.filter(function(item) {
        return item;
      });
      parsedUnitsCache[units] = normalizedUnits;
      return normalizedUnits;
    }
    function globalParse(value) {
      if (!isString(value)) {
        throw new QtyError("Argument should be a string");
      }
      try {
        return this(value);
      } catch (e) {
        return null;
      }
    }
    function isQty(value) {
      return value instanceof Qty2;
    }
    function Qty2(initValue, initUnits) {
      assertValidConstructorArgs.apply(null, arguments);
      if (!isQty(this)) {
        return new Qty2(initValue, initUnits);
      }
      this.scalar = null;
      this.baseScalar = null;
      this.signature = null;
      this._conversionCache = {};
      this.numerator = UNITY_ARRAY;
      this.denominator = UNITY_ARRAY;
      if (isDefinitionObject(initValue)) {
        this.scalar = initValue.scalar;
        this.numerator = initValue.numerator && initValue.numerator.length !== 0 ? initValue.numerator : UNITY_ARRAY;
        this.denominator = initValue.denominator && initValue.denominator.length !== 0 ? initValue.denominator : UNITY_ARRAY;
      } else if (initUnits) {
        parse2.call(this, initUnits);
        this.scalar = initValue;
      } else {
        parse2.call(this, initValue);
      }
      if (this.denominator.join("*").indexOf("temp") >= 0) {
        throw new QtyError("Cannot divide with temperatures");
      }
      if (this.numerator.join("*").indexOf("temp") >= 0) {
        if (this.numerator.length > 1) {
          throw new QtyError("Cannot multiply by temperatures");
        }
        if (!compareArray(this.denominator, UNITY_ARRAY)) {
          throw new QtyError("Cannot divide with temperatures");
        }
      }
      this.initValue = initValue;
      updateBaseScalar.call(this);
      if (this.isTemperature() && this.baseScalar < 0) {
        throw new QtyError("Temperatures must not be less than absolute zero");
      }
    }
    Qty2.prototype = {
      // Properly set up constructor
      constructor: Qty2
    };
    function assertValidConstructorArgs(value, units) {
      if (units) {
        if (!(isNumber(value) && isString(units))) {
          throw new QtyError("Only number accepted as initialization value when units are explicitly provided");
        }
      } else {
        if (!(isString(value) || isNumber(value) || isQty(value) || isDefinitionObject(value))) {
          throw new QtyError("Only string, number or quantity accepted as single initialization value");
        }
      }
    }
    function isDefinitionObject(value) {
      return value && typeof value === "object" && value.hasOwnProperty("scalar");
    }
    function updateBaseScalar() {
      if (this.baseScalar) {
        return this.baseScalar;
      }
      if (this.isBase()) {
        this.baseScalar = this.scalar;
        this.signature = unitSignature.call(this);
      } else {
        var base = this.toBase();
        this.baseScalar = base.scalar;
        this.signature = base.signature;
      }
    }
    var KINDS = {
      "-312078": "elastance",
      "-312058": "resistance",
      "-312038": "inductance",
      "-152058": "potential",
      "-152040": "magnetism",
      "-152038": "magnetism",
      "-7997": "specific_volume",
      "-79": "snap",
      "-59": "jolt",
      "-39": "acceleration",
      "-38": "radiation",
      "-20": "frequency",
      "-19": "speed",
      "-18": "viscosity",
      "-17": "volumetric_flow",
      "-1": "wavenumber",
      "0": "unitless",
      "1": "length",
      "2": "area",
      "3": "volume",
      "20": "time",
      "400": "temperature",
      "7941": "yank",
      "7942": "power",
      "7959": "pressure",
      "7961": "force",
      "7962": "energy",
      "7979": "viscosity",
      "7981": "momentum",
      "7982": "angular_momentum",
      "7997": "density",
      "7998": "area_density",
      "8000": "mass",
      "152020": "radiation_exposure",
      "159999": "magnetism",
      "160000": "current",
      "160020": "charge",
      "312058": "conductance",
      "312078": "capacitance",
      "3199980": "activity",
      "3199997": "molar_concentration",
      "3200000": "substance",
      "63999998": "illuminance",
      "64000000": "luminous_power",
      "1280000000": "currency",
      "25599999980": "information_rate",
      "25600000000": "information",
      "511999999980": "angular_velocity",
      "512000000000": "angle"
    };
    function getKinds() {
      return uniq(Object.keys(KINDS).map(function(knownSignature) {
        return KINDS[knownSignature];
      }));
    }
    Qty2.prototype.kind = function() {
      return KINDS[this.signature.toString()];
    };
    assign2(Qty2.prototype, {
      isDegrees: function() {
        return (this.signature === null || this.signature === 400) && this.numerator.length === 1 && compareArray(this.denominator, UNITY_ARRAY) && (this.numerator[0].match(/<temp-[CFRK]>/) || this.numerator[0].match(/<(kelvin|celsius|rankine|fahrenheit)>/));
      },
      isTemperature: function() {
        return this.isDegrees() && this.numerator[0].match(/<temp-[CFRK]>/);
      }
    });
    function subtractTemperatures(lhs, rhs) {
      var lhsUnits = lhs.units();
      var rhsConverted = rhs.to(lhsUnits);
      var dstDegrees = Qty2(getDegreeUnits(lhsUnits));
      return Qty2({ "scalar": lhs.scalar - rhsConverted.scalar, "numerator": dstDegrees.numerator, "denominator": dstDegrees.denominator });
    }
    function subtractTempDegrees(temp, deg) {
      var tempDegrees = deg.to(getDegreeUnits(temp.units()));
      return Qty2({ "scalar": temp.scalar - tempDegrees.scalar, "numerator": temp.numerator, "denominator": temp.denominator });
    }
    function addTempDegrees(temp, deg) {
      var tempDegrees = deg.to(getDegreeUnits(temp.units()));
      return Qty2({ "scalar": temp.scalar + tempDegrees.scalar, "numerator": temp.numerator, "denominator": temp.denominator });
    }
    function getDegreeUnits(units) {
      if (units === "tempK") {
        return "degK";
      } else if (units === "tempC") {
        return "degC";
      } else if (units === "tempF") {
        return "degF";
      } else if (units === "tempR") {
        return "degR";
      } else {
        throw new QtyError("Unknown type for temp conversion from: " + units);
      }
    }
    function toDegrees(src2, dst) {
      var srcDegK = toDegK(src2);
      var dstUnits = dst.units();
      var dstScalar;
      if (dstUnits === "degK") {
        dstScalar = srcDegK.scalar;
      } else if (dstUnits === "degC") {
        dstScalar = srcDegK.scalar;
      } else if (dstUnits === "degF") {
        dstScalar = srcDegK.scalar * 9 / 5;
      } else if (dstUnits === "degR") {
        dstScalar = srcDegK.scalar * 9 / 5;
      } else {
        throw new QtyError("Unknown type for degree conversion to: " + dstUnits);
      }
      return Qty2({ "scalar": dstScalar, "numerator": dst.numerator, "denominator": dst.denominator });
    }
    function toDegK(qty) {
      var units = qty.units();
      var q;
      if (units.match(/(deg)[CFRK]/)) {
        q = qty.baseScalar;
      } else if (units === "tempK") {
        q = qty.scalar;
      } else if (units === "tempC") {
        q = qty.scalar;
      } else if (units === "tempF") {
        q = qty.scalar * 5 / 9;
      } else if (units === "tempR") {
        q = qty.scalar * 5 / 9;
      } else {
        throw new QtyError("Unknown type for temp conversion from: " + units);
      }
      return Qty2({ "scalar": q, "numerator": ["<kelvin>"], "denominator": UNITY_ARRAY });
    }
    function toTemp(src2, dst) {
      var dstUnits = dst.units();
      var dstScalar;
      if (dstUnits === "tempK") {
        dstScalar = src2.baseScalar;
      } else if (dstUnits === "tempC") {
        dstScalar = src2.baseScalar - 273.15;
      } else if (dstUnits === "tempF") {
        dstScalar = src2.baseScalar * 9 / 5 - 459.67;
      } else if (dstUnits === "tempR") {
        dstScalar = src2.baseScalar * 9 / 5;
      } else {
        throw new QtyError("Unknown type for temp conversion to: " + dstUnits);
      }
      return Qty2({ "scalar": dstScalar, "numerator": dst.numerator, "denominator": dst.denominator });
    }
    function toTempK(qty) {
      var units = qty.units();
      var q;
      if (units.match(/(deg)[CFRK]/)) {
        q = qty.baseScalar;
      } else if (units === "tempK") {
        q = qty.scalar;
      } else if (units === "tempC") {
        q = qty.scalar + 273.15;
      } else if (units === "tempF") {
        q = (qty.scalar + 459.67) * 5 / 9;
      } else if (units === "tempR") {
        q = qty.scalar * 5 / 9;
      } else {
        throw new QtyError("Unknown type for temp conversion from: " + units);
      }
      return Qty2({ "scalar": q, "numerator": ["<temp-K>"], "denominator": UNITY_ARRAY });
    }
    assign2(Qty2.prototype, {
      /**
       * Converts to other compatible units.
       * Instance's converted quantities are cached for faster subsequent calls.
       *
       * @param {(string|Qty)} other - Target units as string or retrieved from
       *                               other Qty instance (scalar is ignored)
       *
       * @returns {Qty} New converted Qty instance with target units
       *
       * @throws {QtyError} if target units are incompatible
       *
       * @example
       * var weight = Qty("25 kg");
       * weight.to("lb"); // => Qty("55.11556554621939 lbs");
       * weight.to(Qty("3 g")); // => Qty("25000 g"); // scalar of passed Qty is ignored
       */
      to: function(other) {
        var cached, target;
        if (other === void 0 || other === null) {
          return this;
        }
        if (!isString(other)) {
          return this.to(other.units());
        }
        cached = this._conversionCache[other];
        if (cached) {
          return cached;
        }
        target = Qty2(other);
        if (target.units() === this.units()) {
          return this;
        }
        if (!this.isCompatible(target)) {
          if (this.isInverse(target)) {
            target = this.inverse().to(other);
          } else {
            throwIncompatibleUnits(this.units(), target.units());
          }
        } else {
          if (target.isTemperature()) {
            target = toTemp(this, target);
          } else if (target.isDegrees()) {
            target = toDegrees(this, target);
          } else {
            var q = divSafe(this.baseScalar, target.baseScalar);
            target = Qty2({ "scalar": q, "numerator": target.numerator, "denominator": target.denominator });
          }
        }
        this._conversionCache[other] = target;
        return target;
      },
      // convert to base SI units
      // results of the conversion are cached so subsequent calls to this will be fast
      toBase: function() {
        if (this.isBase()) {
          return this;
        }
        if (this.isTemperature()) {
          return toTempK(this);
        }
        var cached = baseUnitCache[this.units()];
        if (!cached) {
          cached = toBaseUnits(this.numerator, this.denominator);
          baseUnitCache[this.units()] = cached;
        }
        return cached.mul(this.scalar);
      },
      // Converts the unit back to a float if it is unitless.  Otherwise raises an exception
      toFloat: function() {
        if (this.isUnitless()) {
          return this.scalar;
        }
        throw new QtyError("Can't convert to Float unless unitless.  Use Unit#scalar");
      },
      /**
       * Returns the nearest multiple of quantity passed as
       * precision
       *
       * @param {(Qty|string|number)} precQuantity - Quantity, string formated
       *   quantity or number as expected precision
       *
       * @returns {Qty} Nearest multiple of precQuantity
       *
       * @example
       * Qty('5.5 ft').toPrec('2 ft'); // returns 6 ft
       * Qty('0.8 cu').toPrec('0.25 cu'); // returns 0.75 cu
       * Qty('6.3782 m').toPrec('cm'); // returns 6.38 m
       * Qty('1.146 MPa').toPrec('0.1 bar'); // returns 1.15 MPa
       *
       */
      toPrec: function(precQuantity) {
        if (isString(precQuantity)) {
          precQuantity = Qty2(precQuantity);
        }
        if (isNumber(precQuantity)) {
          precQuantity = Qty2(precQuantity + " " + this.units());
        }
        if (!this.isUnitless()) {
          precQuantity = precQuantity.to(this.units());
        } else if (!precQuantity.isUnitless()) {
          throwIncompatibleUnits(this.units(), precQuantity.units());
        }
        if (precQuantity.scalar === 0) {
          throw new QtyError("Divide by zero");
        }
        var precRoundedResult = mulSafe(
          Math.round(this.scalar / precQuantity.scalar),
          precQuantity.scalar
        );
        return Qty2(precRoundedResult + this.units());
      }
    });
    function swiftConverter(srcUnits, dstUnits) {
      var srcQty = Qty2(srcUnits);
      var dstQty = Qty2(dstUnits);
      if (srcQty.eq(dstQty)) {
        return identity;
      }
      var convert;
      if (!srcQty.isTemperature()) {
        convert = function(value) {
          return value * srcQty.baseScalar / dstQty.baseScalar;
        };
      } else {
        convert = function(value) {
          return srcQty.mul(value).to(dstQty).scalar;
        };
      }
      return function converter(value) {
        var i3, length, result;
        if (!Array.isArray(value)) {
          return convert(value);
        } else {
          length = value.length;
          result = [];
          for (i3 = 0; i3 < length; i3++) {
            result.push(convert(value[i3]));
          }
          return result;
        }
      };
    }
    var baseUnitCache = {};
    function toBaseUnits(numerator, denominator) {
      var num = [];
      var den = [];
      var q = 1;
      var unit;
      for (var i3 = 0; i3 < numerator.length; i3++) {
        unit = numerator[i3];
        if (PREFIX_VALUES[unit]) {
          q = mulSafe(q, PREFIX_VALUES[unit]);
        } else {
          if (UNIT_VALUES[unit]) {
            q *= UNIT_VALUES[unit].scalar;
            if (UNIT_VALUES[unit].numerator) {
              num.push(UNIT_VALUES[unit].numerator);
            }
            if (UNIT_VALUES[unit].denominator) {
              den.push(UNIT_VALUES[unit].denominator);
            }
          }
        }
      }
      for (var j2 = 0; j2 < denominator.length; j2++) {
        unit = denominator[j2];
        if (PREFIX_VALUES[unit]) {
          q /= PREFIX_VALUES[unit];
        } else {
          if (UNIT_VALUES[unit]) {
            q /= UNIT_VALUES[unit].scalar;
            if (UNIT_VALUES[unit].numerator) {
              den.push(UNIT_VALUES[unit].numerator);
            }
            if (UNIT_VALUES[unit].denominator) {
              num.push(UNIT_VALUES[unit].denominator);
            }
          }
        }
      }
      num = num.reduce(function(a, b) {
        return a.concat(b);
      }, []);
      den = den.reduce(function(a, b) {
        return a.concat(b);
      }, []);
      return Qty2({ "scalar": q, "numerator": num, "denominator": den });
    }
    Qty2.parse = globalParse;
    Qty2.getUnits = getUnits;
    Qty2.getAliases = getAliases;
    Qty2.mulSafe = mulSafe;
    Qty2.divSafe = divSafe;
    Qty2.getKinds = getKinds;
    Qty2.swiftConverter = swiftConverter;
    Qty2.Error = QtyError;
    assign2(Qty2.prototype, {
      // Returns new instance with units of this
      add: function(other) {
        if (isString(other)) {
          other = Qty2(other);
        }
        if (!this.isCompatible(other)) {
          throwIncompatibleUnits(this.units(), other.units());
        }
        if (this.isTemperature() && other.isTemperature()) {
          throw new QtyError("Cannot add two temperatures");
        } else if (this.isTemperature()) {
          return addTempDegrees(this, other);
        } else if (other.isTemperature()) {
          return addTempDegrees(other, this);
        }
        return Qty2({ "scalar": this.scalar + other.to(this).scalar, "numerator": this.numerator, "denominator": this.denominator });
      },
      sub: function(other) {
        if (isString(other)) {
          other = Qty2(other);
        }
        if (!this.isCompatible(other)) {
          throwIncompatibleUnits(this.units(), other.units());
        }
        if (this.isTemperature() && other.isTemperature()) {
          return subtractTemperatures(this, other);
        } else if (this.isTemperature()) {
          return subtractTempDegrees(this, other);
        } else if (other.isTemperature()) {
          throw new QtyError("Cannot subtract a temperature from a differential degree unit");
        }
        return Qty2({ "scalar": this.scalar - other.to(this).scalar, "numerator": this.numerator, "denominator": this.denominator });
      },
      mul: function(other) {
        if (isNumber(other)) {
          return Qty2({ "scalar": mulSafe(this.scalar, other), "numerator": this.numerator, "denominator": this.denominator });
        } else if (isString(other)) {
          other = Qty2(other);
        }
        if ((this.isTemperature() || other.isTemperature()) && !(this.isUnitless() || other.isUnitless())) {
          throw new QtyError("Cannot multiply by temperatures");
        }
        var op1 = this;
        var op2 = other;
        if (op1.isCompatible(op2) && op1.signature !== 400) {
          op2 = op2.to(op1);
        }
        var numdenscale = cleanTerms(op1.numerator, op1.denominator, op2.numerator, op2.denominator);
        return Qty2({ "scalar": mulSafe(op1.scalar, op2.scalar, numdenscale[2]), "numerator": numdenscale[0], "denominator": numdenscale[1] });
      },
      div: function(other) {
        if (isNumber(other)) {
          if (other === 0) {
            throw new QtyError("Divide by zero");
          }
          return Qty2({ "scalar": this.scalar / other, "numerator": this.numerator, "denominator": this.denominator });
        } else if (isString(other)) {
          other = Qty2(other);
        }
        if (other.scalar === 0) {
          throw new QtyError("Divide by zero");
        }
        if (other.isTemperature()) {
          throw new QtyError("Cannot divide with temperatures");
        } else if (this.isTemperature() && !other.isUnitless()) {
          throw new QtyError("Cannot divide with temperatures");
        }
        var op1 = this;
        var op2 = other;
        if (op1.isCompatible(op2) && op1.signature !== 400) {
          op2 = op2.to(op1);
        }
        var numdenscale = cleanTerms(op1.numerator, op1.denominator, op2.denominator, op2.numerator);
        return Qty2({ "scalar": mulSafe(op1.scalar, numdenscale[2]) / op2.scalar, "numerator": numdenscale[0], "denominator": numdenscale[1] });
      },
      // Returns a Qty that is the inverse of this Qty,
      inverse: function() {
        if (this.isTemperature()) {
          throw new QtyError("Cannot divide with temperatures");
        }
        if (this.scalar === 0) {
          throw new QtyError("Divide by zero");
        }
        return Qty2({ "scalar": 1 / this.scalar, "numerator": this.denominator, "denominator": this.numerator });
      }
    });
    function cleanTerms(num1, den1, num2, den2) {
      function notUnity(val) {
        return val !== UNITY;
      }
      num1 = num1.filter(notUnity);
      num2 = num2.filter(notUnity);
      den1 = den1.filter(notUnity);
      den2 = den2.filter(notUnity);
      var combined = {};
      function combineTerms(terms, direction) {
        var k;
        var prefix;
        var prefixValue;
        for (var i3 = 0; i3 < terms.length; i3++) {
          if (PREFIX_VALUES[terms[i3]]) {
            k = terms[i3 + 1];
            prefix = terms[i3];
            prefixValue = PREFIX_VALUES[prefix];
            i3++;
          } else {
            k = terms[i3];
            prefix = null;
            prefixValue = 1;
          }
          if (k && k !== UNITY) {
            if (combined[k]) {
              combined[k][0] += direction;
              var combinedPrefixValue = combined[k][2] ? PREFIX_VALUES[combined[k][2]] : 1;
              combined[k][direction === 1 ? 3 : 4] *= divSafe(prefixValue, combinedPrefixValue);
            } else {
              combined[k] = [direction, k, prefix, 1, 1];
            }
          }
        }
      }
      combineTerms(num1, 1);
      combineTerms(den1, -1);
      combineTerms(num2, 1);
      combineTerms(den2, -1);
      var num = [];
      var den = [];
      var scale = 1;
      for (var prop in combined) {
        if (combined.hasOwnProperty(prop)) {
          var item = combined[prop];
          var n;
          if (item[0] > 0) {
            for (n = 0; n < item[0]; n++) {
              num.push(item[2] === null ? item[1] : [item[2], item[1]]);
            }
          } else if (item[0] < 0) {
            for (n = 0; n < -item[0]; n++) {
              den.push(item[2] === null ? item[1] : [item[2], item[1]]);
            }
          }
          scale *= divSafe(item[3], item[4]);
        }
      }
      if (num.length === 0) {
        num = UNITY_ARRAY;
      }
      if (den.length === 0) {
        den = UNITY_ARRAY;
      }
      num = num.reduce(function(a, b) {
        return a.concat(b);
      }, []);
      den = den.reduce(function(a, b) {
        return a.concat(b);
      }, []);
      return [num, den, scale];
    }
    assign2(Qty2.prototype, {
      eq: function(other) {
        return this.compareTo(other) === 0;
      },
      lt: function(other) {
        return this.compareTo(other) === -1;
      },
      lte: function(other) {
        return this.eq(other) || this.lt(other);
      },
      gt: function(other) {
        return this.compareTo(other) === 1;
      },
      gte: function(other) {
        return this.eq(other) || this.gt(other);
      },
      // Compare two Qty objects. Throws an exception if they are not of compatible types.
      // Comparisons are done based on the value of the quantity in base SI units.
      //
      // NOTE: We cannot compare inverses as that breaks the general compareTo contract:
      //   if a.compareTo(b) < 0 then b.compareTo(a) > 0
      //   if a.compareTo(b) == 0 then b.compareTo(a) == 0
      //
      //   Since "10S" == ".1ohm" (10 > .1) and "10ohm" == ".1S" (10 > .1)
      //     Qty("10S").inverse().compareTo("10ohm") == -1
      //     Qty("10ohm").inverse().compareTo("10S") == -1
      //
      //   If including inverses in the sort is needed, I suggest writing: Qty.sort(qtyArray,units)
      compareTo: function(other) {
        if (isString(other)) {
          return this.compareTo(Qty2(other));
        }
        if (!this.isCompatible(other)) {
          throwIncompatibleUnits(this.units(), other.units());
        }
        if (this.baseScalar < other.baseScalar) {
          return -1;
        } else if (this.baseScalar === other.baseScalar) {
          return 0;
        } else if (this.baseScalar > other.baseScalar) {
          return 1;
        }
      },
      // Return true if quantities and units match
      // Unit("100 cm").same(Unit("100 cm"))  # => true
      // Unit("100 cm").same(Unit("1 m"))     # => false
      same: function(other) {
        return this.scalar === other.scalar && this.units() === other.units();
      }
    });
    assign2(Qty2.prototype, {
      // returns true if no associated units
      // false, even if the units are "unitless" like 'radians, each, etc'
      isUnitless: function() {
        return [this.numerator, this.denominator].every(function(item) {
          return compareArray(item, UNITY_ARRAY);
        });
      },
      /*
      check to see if units are compatible, but not the scalar part
      this check is done by comparing signatures for performance reasons
      if passed a string, it will create a unit object with the string and then do the comparison
      this permits a syntax like:
      unit =~ "mm"
      if you want to do a regexp on the unit string do this ...
      unit.units =~ /regexp/
      */
      isCompatible: function(other) {
        if (isString(other)) {
          return this.isCompatible(Qty2(other));
        }
        if (!isQty(other)) {
          return false;
        }
        if (other.signature !== void 0) {
          return this.signature === other.signature;
        } else {
          return false;
        }
      },
      /*
      check to see if units are inverse of each other, but not the scalar part
      this check is done by comparing signatures for performance reasons
      if passed a string, it will create a unit object with the string and then do the comparison
      this permits a syntax like:
      unit =~ "mm"
      if you want to do a regexp on the unit string do this ...
      unit.units =~ /regexp/
      */
      isInverse: function(other) {
        return this.inverse().isCompatible(other);
      },
      // Returns 'true' if the Unit is represented in base units
      isBase: function() {
        if (this._isBase !== void 0) {
          return this._isBase;
        }
        if (this.isDegrees() && this.numerator[0].match(/<(kelvin|temp-K)>/)) {
          this._isBase = true;
          return this._isBase;
        }
        this.numerator.concat(this.denominator).forEach(function(item) {
          if (item !== UNITY && BASE_UNITS.indexOf(item) === -1) {
            this._isBase = false;
          }
        }, this);
        if (this._isBase === false) {
          return this._isBase;
        }
        this._isBase = true;
        return this._isBase;
      }
    });
    function NestedMap() {
    }
    NestedMap.prototype.get = function(keys) {
      if (arguments.length > 1) {
        keys = Array.apply(null, arguments);
      }
      return keys.reduce(
        function(map, key, index) {
          if (map) {
            var childMap = map[key];
            if (index === keys.length - 1) {
              return childMap ? childMap.data : void 0;
            } else {
              return childMap;
            }
          }
        },
        this
      );
    };
    NestedMap.prototype.set = function(keys, value) {
      if (arguments.length > 2) {
        keys = Array.prototype.slice.call(arguments, 0, -1);
        value = arguments[arguments.length - 1];
      }
      return keys.reduce(function(map, key, index) {
        var childMap = map[key];
        if (childMap === void 0) {
          childMap = map[key] = {};
        }
        if (index === keys.length - 1) {
          childMap.data = value;
          return value;
        } else {
          return childMap;
        }
      }, this);
    };
    function defaultFormatter(scalar, units) {
      return (scalar + " " + units).trim();
    }
    Qty2.formatter = defaultFormatter;
    assign2(Qty2.prototype, {
      // returns the 'unit' part of the Unit object without the scalar
      units: function() {
        if (this._units !== void 0) {
          return this._units;
        }
        var numIsUnity = compareArray(this.numerator, UNITY_ARRAY);
        var denIsUnity = compareArray(this.denominator, UNITY_ARRAY);
        if (numIsUnity && denIsUnity) {
          this._units = "";
          return this._units;
        }
        var numUnits = stringifyUnits(this.numerator);
        var denUnits = stringifyUnits(this.denominator);
        this._units = numUnits + (denIsUnity ? "" : "/" + denUnits);
        return this._units;
      },
      /**
       * Stringifies the quantity
       * Deprecation notice: only units parameter is supported.
       *
       * @param {(number|string|Qty)} targetUnitsOrMaxDecimalsOrPrec -
       *                              target units if string,
       *                              max number of decimals if number,
       *                              passed to #toPrec before converting if Qty
       *
       * @param {number=} maxDecimals - Maximum number of decimals of
       *                                formatted output
       *
       * @returns {string} reparseable quantity as string
       */
      toString: function(targetUnitsOrMaxDecimalsOrPrec, maxDecimals) {
        var targetUnits;
        if (isNumber(targetUnitsOrMaxDecimalsOrPrec)) {
          targetUnits = this.units();
          maxDecimals = targetUnitsOrMaxDecimalsOrPrec;
        } else if (isString(targetUnitsOrMaxDecimalsOrPrec)) {
          targetUnits = targetUnitsOrMaxDecimalsOrPrec;
        } else if (isQty(targetUnitsOrMaxDecimalsOrPrec)) {
          return this.toPrec(targetUnitsOrMaxDecimalsOrPrec).toString(maxDecimals);
        }
        var out = this.to(targetUnits);
        var outScalar = maxDecimals !== void 0 ? round2(out.scalar, maxDecimals) : out.scalar;
        out = (outScalar + " " + out.units()).trim();
        return out;
      },
      /**
       * Format the quantity according to optional passed target units
       * and formatter
       *
       * @param {string} [targetUnits=current units] -
       *                 optional units to convert to before formatting
       *
       * @param {function} [formatter=Qty.formatter] -
       *                   delegates formatting to formatter callback.
       *                   formatter is called back with two parameters (scalar, units)
       *                   and should return formatted result.
       *                   If unspecified, formatting is delegated to default formatter
       *                   set to Qty.formatter
       *
       * @example
       * var roundingAndLocalizingFormatter = function(scalar, units) {
       *   // localize or limit scalar to n max decimals for instance
       *   // return formatted result
       * };
       * var qty = Qty('1.1234 m');
       * qty.format(); // same units, default formatter => "1.234 m"
       * qty.format("cm"); // converted to "cm", default formatter => "123.45 cm"
       * qty.format(roundingAndLocalizingFormatter); // same units, custom formatter => "1,2 m"
       * qty.format("cm", roundingAndLocalizingFormatter); // convert to "cm", custom formatter => "123,4 cm"
       *
       * @returns {string} quantity as string
       */
      format: function(targetUnits, formatter) {
        if (arguments.length === 1) {
          if (typeof targetUnits === "function") {
            formatter = targetUnits;
            targetUnits = void 0;
          }
        }
        formatter = formatter || Qty2.formatter;
        var targetQty = this.to(targetUnits);
        return formatter.call(this, targetQty.scalar, targetQty.units());
      }
    });
    var stringifiedUnitsCache = new NestedMap();
    function stringifyUnits(units) {
      var stringified = stringifiedUnitsCache.get(units);
      if (stringified) {
        return stringified;
      }
      var isUnity = compareArray(units, UNITY_ARRAY);
      if (isUnity) {
        stringified = "1";
      } else {
        stringified = simplify(getOutputNames(units)).join("*");
      }
      stringifiedUnitsCache.set(units, stringified);
      return stringified;
    }
    function getOutputNames(units) {
      var unitNames = [], token, tokenNext;
      for (var i3 = 0; i3 < units.length; i3++) {
        token = units[i3];
        tokenNext = units[i3 + 1];
        if (PREFIX_VALUES[token]) {
          unitNames.push(OUTPUT_MAP[token] + OUTPUT_MAP[tokenNext]);
          i3++;
        } else {
          unitNames.push(OUTPUT_MAP[token]);
        }
      }
      return unitNames;
    }
    function simplify(units) {
      var unitCounts = units.reduce(function(acc, unit) {
        var unitCounter = acc[unit];
        if (!unitCounter) {
          acc.push(unitCounter = acc[unit] = [unit, 0]);
        }
        unitCounter[1]++;
        return acc;
      }, []);
      return unitCounts.map(function(unitCount) {
        return unitCount[0] + (unitCount[1] > 1 ? unitCount[1] : "");
      });
    }
    Qty2.version = "1.8.0";
    return Qty2;
  });
})(quantities);
var quantitiesExports = quantities.exports;
const Qty = /* @__PURE__ */ getDefaultExportFromCjs(quantitiesExports);
function deepValue(object, path = "") {
  let parts = path.split(".");
  for (let part of parts) {
    if (object[part] === void 0) return void 0;
    object = object[part];
  }
  return object;
}
var orientation = { exports: {} };
var twoProduct_1 = twoProduct$1;
var SPLITTER = +(Math.pow(2, 27) + 1);
function twoProduct$1(a, b, result) {
  var x = a * b;
  var c = SPLITTER * a;
  var abig = c - a;
  var ahi = c - abig;
  var alo = a - ahi;
  var d = SPLITTER * b;
  var bbig = d - b;
  var bhi = d - bbig;
  var blo = b - bhi;
  var err1 = x - ahi * bhi;
  var err2 = err1 - alo * bhi;
  var err3 = err2 - ahi * blo;
  var y = alo * blo - err3;
  if (result) {
    result[0] = y;
    result[1] = x;
    return result;
  }
  return [y, x];
}
var robustSum = linearExpansionSum;
function scalarScalar$1(a, b) {
  var x = a + b;
  var bv = x - a;
  var av = x - bv;
  var br = b - bv;
  var ar = a - av;
  var y = ar + br;
  if (y) {
    return [y, x];
  }
  return [x];
}
function linearExpansionSum(e, f) {
  var ne = e.length | 0;
  var nf = f.length | 0;
  if (ne === 1 && nf === 1) {
    return scalarScalar$1(e[0], f[0]);
  }
  var n = ne + nf;
  var g = new Array(n);
  var count = 0;
  var eptr = 0;
  var fptr = 0;
  var abs2 = Math.abs;
  var ei = e[eptr];
  var ea = abs2(ei);
  var fi = f[fptr];
  var fa = abs2(fi);
  var a, b;
  if (ea < fa) {
    b = ei;
    eptr += 1;
    if (eptr < ne) {
      ei = e[eptr];
      ea = abs2(ei);
    }
  } else {
    b = fi;
    fptr += 1;
    if (fptr < nf) {
      fi = f[fptr];
      fa = abs2(fi);
    }
  }
  if (eptr < ne && ea < fa || fptr >= nf) {
    a = ei;
    eptr += 1;
    if (eptr < ne) {
      ei = e[eptr];
      ea = abs2(ei);
    }
  } else {
    a = fi;
    fptr += 1;
    if (fptr < nf) {
      fi = f[fptr];
      fa = abs2(fi);
    }
  }
  var x = a + b;
  var bv = x - a;
  var y = b - bv;
  var q0 = y;
  var q1 = x;
  var _x, _bv, _av, _br, _ar;
  while (eptr < ne && fptr < nf) {
    if (ea < fa) {
      a = ei;
      eptr += 1;
      if (eptr < ne) {
        ei = e[eptr];
        ea = abs2(ei);
      }
    } else {
      a = fi;
      fptr += 1;
      if (fptr < nf) {
        fi = f[fptr];
        fa = abs2(fi);
      }
    }
    b = q0;
    x = a + b;
    bv = x - a;
    y = b - bv;
    if (y) {
      g[count++] = y;
    }
    _x = q1 + x;
    _bv = _x - q1;
    _av = _x - _bv;
    _br = x - _bv;
    _ar = q1 - _av;
    q0 = _ar + _br;
    q1 = _x;
  }
  while (eptr < ne) {
    a = ei;
    b = q0;
    x = a + b;
    bv = x - a;
    y = b - bv;
    if (y) {
      g[count++] = y;
    }
    _x = q1 + x;
    _bv = _x - q1;
    _av = _x - _bv;
    _br = x - _bv;
    _ar = q1 - _av;
    q0 = _ar + _br;
    q1 = _x;
    eptr += 1;
    if (eptr < ne) {
      ei = e[eptr];
    }
  }
  while (fptr < nf) {
    a = fi;
    b = q0;
    x = a + b;
    bv = x - a;
    y = b - bv;
    if (y) {
      g[count++] = y;
    }
    _x = q1 + x;
    _bv = _x - q1;
    _av = _x - _bv;
    _br = x - _bv;
    _ar = q1 - _av;
    q0 = _ar + _br;
    q1 = _x;
    fptr += 1;
    if (fptr < nf) {
      fi = f[fptr];
    }
  }
  if (q0) {
    g[count++] = q0;
  }
  if (q1) {
    g[count++] = q1;
  }
  if (!count) {
    g[count++] = 0;
  }
  g.length = count;
  return g;
}
var twoSum$1 = fastTwoSum;
function fastTwoSum(a, b, result) {
  var x = a + b;
  var bv = x - a;
  var av = x - bv;
  var br = b - bv;
  var ar = a - av;
  if (result) {
    result[0] = ar + br;
    result[1] = x;
    return result;
  }
  return [ar + br, x];
}
var twoProduct = twoProduct_1;
var twoSum = twoSum$1;
var robustScale = scaleLinearExpansion;
function scaleLinearExpansion(e, scale) {
  var n = e.length;
  if (n === 1) {
    var ts = twoProduct(e[0], scale);
    if (ts[0]) {
      return ts;
    }
    return [ts[1]];
  }
  var g = new Array(2 * n);
  var q = [0.1, 0.1];
  var t = [0.1, 0.1];
  var count = 0;
  twoProduct(e[0], scale, q);
  if (q[0]) {
    g[count++] = q[0];
  }
  for (var i2 = 1; i2 < n; ++i2) {
    twoProduct(e[i2], scale, t);
    var pq = q[1];
    twoSum(pq, t[0], q);
    if (q[0]) {
      g[count++] = q[0];
    }
    var a = t[1];
    var b = q[1];
    var x = a + b;
    var bv = x - a;
    var y = b - bv;
    q[1] = x;
    if (y) {
      g[count++] = y;
    }
  }
  if (q[1]) {
    g[count++] = q[1];
  }
  if (count === 0) {
    g[count++] = 0;
  }
  g.length = count;
  return g;
}
var robustDiff = robustSubtract;
function scalarScalar(a, b) {
  var x = a + b;
  var bv = x - a;
  var av = x - bv;
  var br = b - bv;
  var ar = a - av;
  var y = ar + br;
  if (y) {
    return [y, x];
  }
  return [x];
}
function robustSubtract(e, f) {
  var ne = e.length | 0;
  var nf = f.length | 0;
  if (ne === 1 && nf === 1) {
    return scalarScalar(e[0], -f[0]);
  }
  var n = ne + nf;
  var g = new Array(n);
  var count = 0;
  var eptr = 0;
  var fptr = 0;
  var abs2 = Math.abs;
  var ei = e[eptr];
  var ea = abs2(ei);
  var fi = -f[fptr];
  var fa = abs2(fi);
  var a, b;
  if (ea < fa) {
    b = ei;
    eptr += 1;
    if (eptr < ne) {
      ei = e[eptr];
      ea = abs2(ei);
    }
  } else {
    b = fi;
    fptr += 1;
    if (fptr < nf) {
      fi = -f[fptr];
      fa = abs2(fi);
    }
  }
  if (eptr < ne && ea < fa || fptr >= nf) {
    a = ei;
    eptr += 1;
    if (eptr < ne) {
      ei = e[eptr];
      ea = abs2(ei);
    }
  } else {
    a = fi;
    fptr += 1;
    if (fptr < nf) {
      fi = -f[fptr];
      fa = abs2(fi);
    }
  }
  var x = a + b;
  var bv = x - a;
  var y = b - bv;
  var q0 = y;
  var q1 = x;
  var _x, _bv, _av, _br, _ar;
  while (eptr < ne && fptr < nf) {
    if (ea < fa) {
      a = ei;
      eptr += 1;
      if (eptr < ne) {
        ei = e[eptr];
        ea = abs2(ei);
      }
    } else {
      a = fi;
      fptr += 1;
      if (fptr < nf) {
        fi = -f[fptr];
        fa = abs2(fi);
      }
    }
    b = q0;
    x = a + b;
    bv = x - a;
    y = b - bv;
    if (y) {
      g[count++] = y;
    }
    _x = q1 + x;
    _bv = _x - q1;
    _av = _x - _bv;
    _br = x - _bv;
    _ar = q1 - _av;
    q0 = _ar + _br;
    q1 = _x;
  }
  while (eptr < ne) {
    a = ei;
    b = q0;
    x = a + b;
    bv = x - a;
    y = b - bv;
    if (y) {
      g[count++] = y;
    }
    _x = q1 + x;
    _bv = _x - q1;
    _av = _x - _bv;
    _br = x - _bv;
    _ar = q1 - _av;
    q0 = _ar + _br;
    q1 = _x;
    eptr += 1;
    if (eptr < ne) {
      ei = e[eptr];
    }
  }
  while (fptr < nf) {
    a = fi;
    b = q0;
    x = a + b;
    bv = x - a;
    y = b - bv;
    if (y) {
      g[count++] = y;
    }
    _x = q1 + x;
    _bv = _x - q1;
    _av = _x - _bv;
    _br = x - _bv;
    _ar = q1 - _av;
    q0 = _ar + _br;
    q1 = _x;
    fptr += 1;
    if (fptr < nf) {
      fi = -f[fptr];
    }
  }
  if (q0) {
    g[count++] = q0;
  }
  if (q1) {
    g[count++] = q1;
  }
  if (!count) {
    g[count++] = 0;
  }
  g.length = count;
  return g;
}
(function(module2) {
  var twoProduct2 = twoProduct_1;
  var robustSum$1 = robustSum;
  var robustScale$1 = robustScale;
  var robustSubtract2 = robustDiff;
  var NUM_EXPAND = 5;
  var EPSILON = 11102230246251565e-32;
  var ERRBOUND3 = (3 + 16 * EPSILON) * EPSILON;
  var ERRBOUND4 = (7 + 56 * EPSILON) * EPSILON;
  function orientation_3(sum2, prod, scale, sub) {
    return function orientation3Exact2(m0, m1, m2) {
      var p = sum2(sum2(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), sum2(prod(m0[1], m1[0]), prod(-m1[1], m0[0])));
      var n = sum2(prod(m0[1], m2[0]), prod(-m2[1], m0[0]));
      var d = sub(p, n);
      return d[d.length - 1];
    };
  }
  function orientation_4(sum2, prod, scale, sub) {
    return function orientation4Exact2(m0, m1, m2, m3) {
      var p = sum2(sum2(scale(sum2(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m1[2]), sum2(scale(sum2(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), -m2[2]), scale(sum2(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m3[2]))), sum2(scale(sum2(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m0[2]), sum2(scale(sum2(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m1[2]), scale(sum2(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m3[2]))));
      var n = sum2(sum2(scale(sum2(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m0[2]), sum2(scale(sum2(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m2[2]), scale(sum2(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m3[2]))), sum2(scale(sum2(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m0[2]), sum2(scale(sum2(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), -m1[2]), scale(sum2(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m2[2]))));
      var d = sub(p, n);
      return d[d.length - 1];
    };
  }
  function orientation_5(sum2, prod, scale, sub) {
    return function orientation5Exact(m0, m1, m2, m3, m4) {
      var p = sum2(sum2(sum2(scale(sum2(scale(sum2(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m2[2]), sum2(scale(sum2(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), -m3[2]), scale(sum2(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m4[2]))), m1[3]), sum2(scale(sum2(scale(sum2(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m1[2]), sum2(scale(sum2(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m3[2]), scale(sum2(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m4[2]))), -m2[3]), scale(sum2(scale(sum2(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m1[2]), sum2(scale(sum2(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m2[2]), scale(sum2(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m4[2]))), m3[3]))), sum2(scale(sum2(scale(sum2(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m1[2]), sum2(scale(sum2(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), -m2[2]), scale(sum2(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m3[2]))), -m4[3]), sum2(scale(sum2(scale(sum2(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m1[2]), sum2(scale(sum2(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m3[2]), scale(sum2(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m4[2]))), m0[3]), scale(sum2(scale(sum2(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m0[2]), sum2(scale(sum2(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m3[2]), scale(sum2(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), m4[2]))), -m1[3])))), sum2(sum2(scale(sum2(scale(sum2(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), m0[2]), sum2(scale(sum2(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m1[2]), scale(sum2(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m4[2]))), m3[3]), sum2(scale(sum2(scale(sum2(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m0[2]), sum2(scale(sum2(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m1[2]), scale(sum2(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m3[2]))), -m4[3]), scale(sum2(scale(sum2(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m1[2]), sum2(scale(sum2(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), -m2[2]), scale(sum2(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m3[2]))), m0[3]))), sum2(scale(sum2(scale(sum2(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m0[2]), sum2(scale(sum2(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m2[2]), scale(sum2(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m3[2]))), -m1[3]), sum2(scale(sum2(scale(sum2(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m0[2]), sum2(scale(sum2(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m1[2]), scale(sum2(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m3[2]))), m2[3]), scale(sum2(scale(sum2(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m0[2]), sum2(scale(sum2(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), -m1[2]), scale(sum2(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m2[2]))), -m3[3])))));
      var n = sum2(sum2(sum2(scale(sum2(scale(sum2(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m2[2]), sum2(scale(sum2(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), -m3[2]), scale(sum2(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m4[2]))), m0[3]), scale(sum2(scale(sum2(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m0[2]), sum2(scale(sum2(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m3[2]), scale(sum2(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), m4[2]))), -m2[3])), sum2(scale(sum2(scale(sum2(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m0[2]), sum2(scale(sum2(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m2[2]), scale(sum2(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m4[2]))), m3[3]), scale(sum2(scale(sum2(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m0[2]), sum2(scale(sum2(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m2[2]), scale(sum2(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m3[2]))), -m4[3]))), sum2(sum2(scale(sum2(scale(sum2(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m1[2]), sum2(scale(sum2(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m2[2]), scale(sum2(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m4[2]))), m0[3]), scale(sum2(scale(sum2(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m0[2]), sum2(scale(sum2(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m2[2]), scale(sum2(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m4[2]))), -m1[3])), sum2(scale(sum2(scale(sum2(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), m0[2]), sum2(scale(sum2(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m1[2]), scale(sum2(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m4[2]))), m2[3]), scale(sum2(scale(sum2(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m0[2]), sum2(scale(sum2(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), -m1[2]), scale(sum2(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m2[2]))), -m4[3]))));
      var d = sub(p, n);
      return d[d.length - 1];
    };
  }
  function orientation2(n) {
    var fn = n === 3 ? orientation_3 : n === 4 ? orientation_4 : orientation_5;
    return fn(robustSum$1, twoProduct2, robustScale$1, robustSubtract2);
  }
  var orientation3Exact = orientation2(3);
  var orientation4Exact = orientation2(4);
  var CACHED = [
    function orientation0() {
      return 0;
    },
    function orientation1() {
      return 0;
    },
    function orientation22(a, b) {
      return b[0] - a[0];
    },
    function orientation3(a, b, c) {
      var l = (a[1] - c[1]) * (b[0] - c[0]);
      var r = (a[0] - c[0]) * (b[1] - c[1]);
      var det = l - r;
      var s;
      if (l > 0) {
        if (r <= 0) {
          return det;
        } else {
          s = l + r;
        }
      } else if (l < 0) {
        if (r >= 0) {
          return det;
        } else {
          s = -(l + r);
        }
      } else {
        return det;
      }
      var tol = ERRBOUND3 * s;
      if (det >= tol || det <= -tol) {
        return det;
      }
      return orientation3Exact(a, b, c);
    },
    function orientation4(a, b, c, d) {
      var adx = a[0] - d[0];
      var bdx = b[0] - d[0];
      var cdx = c[0] - d[0];
      var ady = a[1] - d[1];
      var bdy = b[1] - d[1];
      var cdy = c[1] - d[1];
      var adz = a[2] - d[2];
      var bdz = b[2] - d[2];
      var cdz = c[2] - d[2];
      var bdxcdy = bdx * cdy;
      var cdxbdy = cdx * bdy;
      var cdxady = cdx * ady;
      var adxcdy = adx * cdy;
      var adxbdy = adx * bdy;
      var bdxady = bdx * ady;
      var det = adz * (bdxcdy - cdxbdy) + bdz * (cdxady - adxcdy) + cdz * (adxbdy - bdxady);
      var permanent = (Math.abs(bdxcdy) + Math.abs(cdxbdy)) * Math.abs(adz) + (Math.abs(cdxady) + Math.abs(adxcdy)) * Math.abs(bdz) + (Math.abs(adxbdy) + Math.abs(bdxady)) * Math.abs(cdz);
      var tol = ERRBOUND4 * permanent;
      if (det > tol || -det > tol) {
        return det;
      }
      return orientation4Exact(a, b, c, d);
    }
  ];
  function slowOrient(args) {
    var proc2 = CACHED[args.length];
    if (!proc2) {
      proc2 = CACHED[args.length] = orientation2(args.length);
    }
    return proc2.apply(void 0, args);
  }
  function proc(slow, o0, o1, o2, o3, o4, o5) {
    return function getOrientation(a0, a1, a2, a3, a4) {
      switch (arguments.length) {
        case 0:
        case 1:
          return 0;
        case 2:
          return o2(a0, a1);
        case 3:
          return o3(a0, a1, a2);
        case 4:
          return o4(a0, a1, a2, a3);
        case 5:
          return o5(a0, a1, a2, a3, a4);
      }
      var s = new Array(arguments.length);
      for (var i2 = 0; i2 < arguments.length; ++i2) {
        s[i2] = arguments[i2];
      }
      return slow(s);
    };
  }
  function generateOrientationProc() {
    while (CACHED.length <= NUM_EXPAND) {
      CACHED.push(orientation2(CACHED.length));
    }
    module2.exports = proc.apply(void 0, [slowOrient].concat(CACHED));
    for (var i2 = 0; i2 <= NUM_EXPAND; ++i2) {
      module2.exports[i2] = CACHED[i2];
    }
  }
  generateOrientationProc();
})(orientation);
var orientationExports = orientation.exports;
var robustPnp = robustPointInPolygon;
var orient = orientationExports;
function robustPointInPolygon(vs, point) {
  var x = point[0];
  var y = point[1];
  var n = vs.length;
  var inside = 1;
  var lim = n;
  for (var i2 = 0, j = n - 1; i2 < lim; j = i2++) {
    var a = vs[i2];
    var b = vs[j];
    var yi = a[1];
    var yj = b[1];
    if (yj < yi) {
      if (yj < y && y < yi) {
        var s = orient(a, b, point);
        if (s === 0) {
          return 0;
        } else {
          inside ^= 0 < s | 0;
        }
      } else if (y === yi) {
        var c = vs[(i2 + 1) % n];
        var yk = c[1];
        if (yi < yk) {
          var s = orient(a, b, point);
          if (s === 0) {
            return 0;
          } else {
            inside ^= 0 < s | 0;
          }
        }
      }
    } else if (yi < yj) {
      if (yi < y && y < yj) {
        var s = orient(a, b, point);
        if (s === 0) {
          return 0;
        } else {
          inside ^= s < 0 | 0;
        }
      } else if (y === yi) {
        var c = vs[(i2 + 1) % n];
        var yk = c[1];
        if (yk < yi) {
          var s = orient(a, b, point);
          if (s === 0) {
            return 0;
          } else {
            inside ^= s < 0 | 0;
          }
        }
      }
    } else if (y === yi) {
      var x0 = Math.min(a[0], b[0]);
      var x1 = Math.max(a[0], b[0]);
      if (i2 === 0) {
        while (j > 0) {
          var k = (j + n - 1) % n;
          var p = vs[k];
          if (p[1] !== y) {
            break;
          }
          var px = p[0];
          x0 = Math.min(x0, px);
          x1 = Math.max(x1, px);
          j = k;
        }
        if (j === 0) {
          if (x0 <= x && x <= x1) {
            return 0;
          }
          return 1;
        }
        lim = j + 1;
      }
      var y0 = vs[(j + n - 1) % n][1];
      while (i2 + 1 < lim) {
        var p = vs[i2 + 1];
        if (p[1] !== y) {
          break;
        }
        var px = p[0];
        x0 = Math.min(x0, px);
        x1 = Math.max(x1, px);
        i2 += 1;
      }
      if (x0 <= x && x <= x1) {
        return 0;
      }
      var y1 = vs[(i2 + 1) % n][1];
      if (x < x0 && y0 < y !== y1 < y) {
        inside ^= 1;
      }
    }
  }
  return 2 * inside - 1;
}
const robustPointInPolygon$1 = /* @__PURE__ */ getDefaultExportFromCjs(robustPnp);
function feretDiameters(options = {}) {
  const { originalPoints = monotoneChainConvexHull.call(this) } = options;
  if (originalPoints.length === 0) {
    return { min: 0, max: 0, minLine: [], maxLine: [], aspectRatio: 1 };
  }
  if (originalPoints.length === 1) {
    return {
      min: 1,
      max: 1,
      minLine: [originalPoints[0], originalPoints[0]],
      maxLine: [originalPoints[0], originalPoints[0]],
      aspectRatio: 1
    };
  }
  const temporaryPoints = new Array(originalPoints.length);
  let minWidth = Infinity;
  let minWidthAngle = 0;
  let minLine = [];
  for (let i2 = 0; i2 < originalPoints.length; i2++) {
    let angle = getAngle(
      originalPoints[i2],
      originalPoints[(i2 + 1) % originalPoints.length]
    );
    rotate(-angle, originalPoints, temporaryPoints);
    let currentWidth = 0;
    let currentMinLine = [];
    for (let j = 0; j < originalPoints.length; j++) {
      let absWidth = Math.abs(temporaryPoints[i2][1] - temporaryPoints[j][1]);
      if (absWidth > currentWidth) {
        currentWidth = absWidth;
        currentMinLine = [];
        currentMinLine.push(
          [temporaryPoints[j][0], temporaryPoints[i2][1]],
          [temporaryPoints[j][0], temporaryPoints[j][1]]
        );
      }
    }
    if (currentWidth < minWidth) {
      minWidth = currentWidth;
      minWidthAngle = angle;
      minLine = currentMinLine;
    }
  }
  rotate(minWidthAngle, minLine, minLine);
  let maxWidth = 0;
  let maxLine = [];
  let maxSquaredWidth = 0;
  for (let i2 = 0; i2 < originalPoints.length - 1; i2++) {
    for (let j = i2 + 1; j < originalPoints.length; j++) {
      let currentSquaredWidth = (originalPoints[i2][0] - originalPoints[j][0]) ** 2 + (originalPoints[i2][1] - originalPoints[j][1]) ** 2;
      if (currentSquaredWidth > maxSquaredWidth) {
        maxSquaredWidth = currentSquaredWidth;
        maxWidth = Math.sqrt(currentSquaredWidth);
        maxLine = [originalPoints[i2], originalPoints[j]];
      }
    }
  }
  return {
    min: minWidth,
    minLine,
    max: maxWidth,
    maxLine,
    aspectRatio: minWidth / maxWidth
  };
}
function getAngle(p1, p2) {
  let diff = difference(p2, p1);
  let vector = normalize(diff);
  let angle = Math.acos(vector[0]);
  if (vector[1] < 0) return -angle;
  return angle;
}
class Roi {
  constructor(map, id) {
    this.map = map;
    this.id = id;
    this.minX = Number.POSITIVE_INFINITY;
    this.maxX = Number.NEGATIVE_INFINITY;
    this.minY = Number.POSITIVE_INFINITY;
    this.maxY = Number.NEGATIVE_INFINITY;
    this.meanX = 0;
    this.meanY = 0;
    this.surface = 0;
    this.computed = {};
  }
  /**
   * Returns a binary image (mask) for the corresponding ROI
   * @param {object} [options]
   * @param {number} [options.scale=1] - Scaling factor to apply to the mask
   * @param {string} [options.kind='normal'] - 'contour', 'box', 'filled', 'center', 'hull' or 'normal'
   * @return {Image} - Returns a mask (1 bit Image)
   */
  getMask(options = {}) {
    const { scale = 1, kind = "" } = options;
    let mask2;
    switch (kind) {
      case "contour":
        mask2 = this.contourMask;
        break;
      case "box":
        mask2 = this.boxMask;
        break;
      case "filled":
        mask2 = this.filledMask;
        break;
      case "center":
        mask2 = this.centerMask;
        break;
      case "mbr":
        mask2 = this.mbrFilledMask;
        break;
      case "hull":
        mask2 = this.convexHullFilledMask;
        break;
      case "hullContour":
        mask2 = this.convexHullMask;
        break;
      case "mbrContour":
        mask2 = this.mbrMask;
        break;
      case "feret":
        mask2 = this.feretMask;
        break;
      default:
        mask2 = this.mask;
    }
    if (scale < 1) {
      mask2 = mask2.resize({ factor: scale });
      mask2.parent = this.mask.parent;
      mask2.position[0] += this.minX;
      mask2.position[1] += this.minY;
    }
    return mask2;
  }
  get mean() {
    throw new Error("Roi mean not implemented yet");
  }
  get center() {
    if (!this.computed.center) {
      this.computed.center = [this.width / 2 >> 0, this.height / 2 >> 0];
    }
    return this.computed.center;
  }
  get ratio() {
    return this.width / this.height;
  }
  get width() {
    return this.maxX - this.minX + 1;
  }
  get height() {
    return this.maxY - this.minY + 1;
  }
  _computExternalIDs() {
    let borders = this.borderIDs;
    let lengths = this.borderLengths;
    this.computed.externalIDs = [];
    this.computed.externalLengths = [];
    let internals = this.internalIDs;
    for (let i2 = 0; i2 < borders.length; i2++) {
      if (!internals.includes(borders[i2])) {
        this.computed.externalIDs.push(borders[i2]);
        this.computed.externalLengths.push(lengths[i2]);
      }
    }
  }
  get externalIDs() {
    if (this.computed.externalIDs) {
      return this.computed.externalIDs;
    }
    this._computExternalIDs();
    return this.computed.externalIDs;
  }
  get externalLengths() {
    if (this.computed.externalLengths) {
      return this.computed.externalLengths;
    }
    this._computExternalIDs();
    return this.computed.externalLengths;
  }
  _computeBorderIDs() {
    let borders = getBorders(this);
    this.computed.borderIDs = borders.ids;
    this.computed.borderLengths = borders.lengths;
  }
  /**
     Retrieve all the IDs (array of number) of the regions that are in contact with this
     specific region. It may be external or internal
     */
  get borderIDs() {
    if (this.computed.borderIDs) {
      return this.computed.borderIDs;
    }
    this._computeBorderIDs();
    return this.computed.borderIDs;
  }
  /**
     Retrieve all the length (array of number) of the contacts with this
     specific region. It may be external or internal
     */
  get borderLengths() {
    if (this.computed.borderLengths) {
      return this.computed.borderLengths;
    }
    this._computeBorderIDs();
    return this.computed.borderLengths;
  }
  /**
       Retrieve all the IDs or the Roi touching the box surrouding the region
  
       It should really be an array to solve complex cases related to border effect
  
       Like the image
       <pre>
       0000
       1111
       0000
       1111
       </pre>
  
       The first row of 1 will be surrouned by 2 differents zones
  
       Or even worse
       <pre>
       010
       111
       010
       </pre>
       The cross will be surrouned by 4 differents zones
  
       However in most of the cases it will be an array of one element
       */
  get boxIDs() {
    if (!this.computed.boxIDs) {
      this.computed.boxIDs = getBoxIDs(this);
    }
    return this.computed.boxIDs;
  }
  get internalIDs() {
    if (!this.computed.internalIDs) {
      this.computed.internalIDs = getInternalIDs(this);
    }
    return this.computed.internalIDs;
  }
  /**
     Number of pixels of the Roi that touch the rectangle
     This is useful for the calculation of the border
     because we will ignore those special pixels of the rectangle
     border that don't have neighbours all around them.
     */
  get box() {
    if (!this.computed.box) {
      this.computed.box = getBox(this);
    }
    return this.computed.box;
  }
  /**
     Calculates the number of pixels that are in the external border of the Roi
     Contour are all the pixels that touch an external "zone".
     All the pixels that touch the box are part of the border and
     are calculated in the getBoxPixels procedure
     */
  get external() {
    if (!this.computed.external) {
      this.computed.external = getExternal(this);
    }
    return this.computed.external;
  }
  /**
     Calculates information about holes
     */
  get holesInfo() {
    if (!this.computed.holesInfo) {
      this.computed.holesInfo = getHolesInfo(this);
    }
    return this.computed.holesInfo;
  }
  /**
     Calculates the number of pixels that are involved in border
     Border are all the pixels that touch another "zone". It could be external
     or internal. If there is a hole in the zone it will be counted as a border.
     All the pixels that touch the box are part of the border and
     are calculated in the getBoxPixels procedure
     */
  get border() {
    if (!this.computed.border) {
      this.computed.border = getBorder(this);
    }
    return this.computed.border;
  }
  /**
    Returns a binary image (mask) containing only the border of the mask
  */
  get contourMask() {
    if (!this.computed.contourMask) {
      let img = new Image(this.width, this.height, {
        kind: BINARY,
        position: [this.minX, this.minY],
        parent: this.map.parent
      });
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          if (this.map.data[x + this.minX + (y + this.minY) * this.map.width] === this.id) {
            if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
              if (this.map.data[x - 1 + this.minX + (y + this.minY) * this.map.width] !== this.id || this.map.data[x + 1 + this.minX + (y + this.minY) * this.map.width] !== this.id || this.map.data[x + this.minX + (y - 1 + this.minY) * this.map.width] !== this.id || this.map.data[x + this.minX + (y + 1 + this.minY) * this.map.width] !== this.id) {
                img.setBitXY(x, y);
              }
            } else {
              img.setBitXY(x, y);
            }
          }
        }
      }
      this.computed.contourMask = img;
    }
    return this.computed.contourMask;
  }
  get boxMask() {
    if (!this.computed.boxMask) {
      let img = new Image(this.width, this.height, {
        kind: BINARY,
        position: [this.minX, this.minY],
        parent: this.map.parent
      });
      for (let x = 0; x < this.width; x++) {
        img.setBitXY(x, 0);
        img.setBitXY(x, this.height - 1);
      }
      for (let y = 0; y < this.height; y++) {
        img.setBitXY(0, y);
        img.setBitXY(this.width - 1, y);
      }
      this.computed.boxMask = img;
    }
    return this.computed.boxMask;
  }
  /**
     Returns a binary image containing the mask
     */
  get mask() {
    if (!this.computed.mask) {
      let img = new Image(this.width, this.height, {
        kind: BINARY,
        position: [this.minX, this.minY],
        parent: this.map.parent
      });
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          if (this.map.data[x + this.minX + (y + this.minY) * this.map.width] === this.id) {
            img.setBitXY(x, y);
          }
        }
      }
      this.computed.mask = img;
    }
    return this.computed.mask;
  }
  get filledMask() {
    if (!this.computed.filledMask) {
      let img = new Image(this.width, this.height, {
        kind: BINARY,
        position: [this.minX, this.minY],
        parent: this.map.parent
      });
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          let target = x + this.minX + (y + this.minY) * this.map.width;
          if (this.internalIDs.includes(this.map.data[target])) {
            img.setBitXY(x, y);
          }
        }
      }
      this.computed.filledMask = img;
    }
    return this.computed.filledMask;
  }
  get centerMask() {
    if (!this.computed.centerMask) {
      let img = new Shape({ kind: "smallCross" }).getMask();
      img.parent = this.map.parent;
      img.position = [
        this.minX + this.center[0] - 1,
        this.minY + this.center[1] - 1
      ];
      this.computed.centerMask = img;
    }
    return this.computed.centerMask;
  }
  get convexHull() {
    if (!this.computed.convexHull) {
      const calculationPoints = [];
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          if (this.map.data[x + this.minX + (y + this.minY) * this.map.width] === this.id) {
            if (x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1) {
              if (this.map.data[x - 1 + this.minX + (y + this.minY) * this.map.width] !== this.id || this.map.data[x + 1 + this.minX + (y + this.minY) * this.map.width] !== this.id || this.map.data[x + this.minX + (y - 1 + this.minY) * this.map.width] !== this.id || this.map.data[x + this.minX + (y + 1 + this.minY) * this.map.width] !== this.id) {
                calculationPoints.push([x, y]);
                calculationPoints.push([x + 1, y]);
                calculationPoints.push([x, y + 1]);
                calculationPoints.push([x + 1, y + 1]);
              }
            } else {
              calculationPoints.push([x, y]);
              calculationPoints.push([x + 1, y]);
              calculationPoints.push([x, y + 1]);
              calculationPoints.push([x + 1, y + 1]);
            }
          }
        }
      }
      const convexHull = monotoneChainConvexHull$1(calculationPoints);
      this.computed.convexHull = {
        polyline: convexHull,
        surface: surface(convexHull),
        perimeter: perimeter(convexHull)
      };
    }
    return this.computed.convexHull;
  }
  get convexHullMask() {
    if (!this.computed.convexHullMask) {
      const convexHull = this.convexHull;
      const img = new Image(this.width + 1, this.height + 1, {
        kind: BINARY,
        position: [this.minX, this.minY],
        parent: this.map.parent
      });
      img.paintPolyline(convexHull.polyline, { closed: true });
      this.computed.convexHullMask = img;
    }
    return this.computed.convexHullMask;
  }
  get convexHullFilledMask() {
    if (!this.computed.convexHullFilledMask) {
      const convexHull = this.convexHull;
      const img = new Image(this.width, this.height, {
        kind: BINARY,
        position: [this.minX, this.minY],
        parent: this.map.parent
      });
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          if (robustPointInPolygon$1(convexHull.polyline, [x, y]) !== 1) {
            img.setBitXY(x, y);
          }
        }
      }
      this.computed.convexHullFilledMask = img;
    }
    return this.computed.convexHullFilledMask;
  }
  get mbr() {
    if (!this.computed.mbr) {
      let mbr = minimalBoundingRectangle({
        originalPoints: this.convexHull.polyline
      });
      if (mbr.length === 0) {
        this.computed.mbr = {
          width: 0,
          height: 0,
          surface: 0,
          perimeter: 0,
          rectangle: mbr
        };
      } else {
        let first = mbr[0];
        let second = mbr[1];
        let third = mbr[2];
        let width = Math.sqrt(
          (first[0] - second[0]) ** 2 + (first[1] - second[1]) ** 2
        );
        let height = Math.sqrt(
          (third[0] - second[0]) ** 2 + (third[1] - second[1]) ** 2
        );
        this.computed.mbr = {
          width,
          height,
          elongation: 1 - width / height,
          aspectRatio: width / height,
          surface: width * height,
          perimeter: (width + height) * 2,
          rectangle: mbr
        };
      }
    }
    return this.computed.mbr;
  }
  get fillRatio() {
    return this.surface / (this.surface + this.holesInfo.surface);
  }
  get feretDiameters() {
    if (!this.computed.feretDiameters) {
      this.computed.feretDiameters = feretDiameters({
        originalPoints: this.convexHull.polyline
      });
    }
    return this.computed.feretDiameters;
  }
  /**
   * Diameter of a circle of equal projection area
   */
  get eqpc() {
    if (!this.computed.eqpc) {
      this.computed.eqpc = 2 * Math.sqrt(this.surface / Math.PI);
    }
    return this.computed.eqpc;
  }
  /**
   * Get the category in which each external pixel belongs
   */
  get perimeterInfo() {
    if (!this.computed.perimeterInfo) {
      this.computed.perimeterInfo = getPerimeterInfo(this);
    }
    return this.computed.perimeterInfo;
  }
  /**
   * Return the perimeter of the ROI
   */
  get perimeter() {
    let info = this.perimeterInfo;
    let delta = 2 - Math.sqrt(2);
    return info.one + info.two * 2 + info.three * 3 + info.four * 4 - delta * (info.two + info.three * 2 + info.four);
  }
  /**
   * Diameter of a circle of equal perimeter
   */
  get ped() {
    if (!this.computed.ped) {
      this.computed.ped = this.perimeter / Math.PI;
    }
    return this.computed.ped;
  }
  get feretMask() {
    if (!this.computed.feretMask) {
      const image = new Image(this.width + 1, this.height + 1, {
        kind: BINARY,
        position: [this.minX, this.minY],
        parent: this.map.parent
      });
      image.paintPolyline(this.feretDiameters.minLine);
      image.paintPolyline(this.feretDiameters.maxLine);
      this.computed.feretMask = image;
    }
    return this.computed.feretMask;
  }
  get mbrMask() {
    if (!this.computed.mbrMask) {
      let rectangle2 = round(this.mbr.rectangle);
      if (rectangle2.length > 0) {
        const minMax$1 = minMax(rectangle2);
        const img = new Image(
          minMax$1[1][0] - minMax$1[0][0] + 1,
          minMax$1[1][1] - minMax$1[0][1] + 1,
          {
            kind: BINARY,
            position: [this.minX + minMax$1[0][0], this.minY + minMax$1[0][1]],
            parent: this.map.parent
          }
        );
        rectangle2 = moveToZeroZero(rectangle2);
        img.paintPolyline(rectangle2, { closed: true });
        this.computed.mbrMask = img;
      } else {
        this.computed.mbrMask = new Image(1, 1, {
          kind: BINARY,
          position: [this.minX, this.minY],
          parent: this.map.parent
        });
      }
    }
    return this.computed.mbrMask;
  }
  get mbrFilledMask() {
    if (!this.computed.mbrFilledMask) {
      const img = new Image(this.width, this.height, {
        kind: BINARY,
        position: [this.minX, this.minY],
        parent: this.map.parent
      });
      const mbr = this.mask.minimalBoundingRectangle();
      for (let x = 0; x < this.width; x++) {
        for (let y = 0; y < this.height; y++) {
          if (robustPointInPolygon$1(mbr, [x, y]) !== 1) {
            img.setBitXY(x, y);
          }
        }
      }
      this.computed.mbrFilledMask = img;
    }
    return this.computed.mbrFilledMask;
  }
  get points() {
    if (!this.computed.points) {
      let points2 = [];
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          let target = (y + this.minY) * this.map.width + x + this.minX;
          if (this.map.data[target] === this.id) {
            points2.push([x, y]);
          }
        }
      }
      this.computed.points = points2;
    }
    return this.computed.points;
  }
  get maxLengthPoints() {
    if (!this.computed.maxLengthPoints) {
      let maxLength = 0;
      let maxLengthPoints;
      const points2 = this.points;
      for (let i2 = 0; i2 < points2.length; i2++) {
        for (let j = i2 + 1; j < points2.length; j++) {
          let currentML = Math.pow(points2[i2][0] - points2[j][0], 2) + Math.pow(points2[i2][1] - points2[j][1], 2);
          if (currentML >= maxLength) {
            maxLength = currentML;
            maxLengthPoints = [points2[i2], points2[j]];
          }
        }
      }
      this.computed.maxLengthPoints = maxLengthPoints;
    }
    return this.computed.maxLengthPoints;
  }
  /**
        Calculates the maximum length between two pixels of the Roi.
     */
  get maxLength() {
    if (!this.computed.maxLength) {
      let maxLength = Math.sqrt(
        Math.pow(this.maxLengthPoints[0][0] - this.maxLengthPoints[1][0], 2) + Math.pow(this.maxLengthPoints[0][1] - this.maxLengthPoints[1][1], 2)
      );
      this.computed.maxLength = maxLength;
    }
    return this.computed.maxLength;
  }
  get roundness() {
    return 4 * this.surface / (Math.PI * this.feretDiameters.max ** 2);
  }
  get sphericity() {
    return 2 * Math.sqrt(this.surface * Math.PI) / this.perimeter;
  }
  get solidity() {
    return this.surface / this.convexHull.surface;
  }
  get angle() {
    if (!this.computed.angle) {
      let points2 = this.maxLengthPoints;
      let angle = -Math.atan2(points2[0][1] - points2[1][1], points2[0][0] - points2[1][0]) * 180 / Math.PI;
      this.computed.angle = angle;
    }
    return this.computed.angle;
  }
  toJSON() {
    return {
      id: this.id,
      minX: this.minX,
      maxX: this.maxX,
      minY: this.minY,
      maxY: this.maxY,
      meanX: this.meanX,
      meanY: this.meanY,
      height: this.height,
      width: this.width,
      surface: this.surface,
      mbrWidth: this.mbr.width,
      mbrHeight: this.mbr.height,
      mbrSurface: this.mbr.surface,
      eqpc: this.eqpc,
      ped: this.ped,
      feretDiameterMin: this.feretDiameters.min,
      feretDiameterMax: this.feretDiameters.max,
      aspectRatio: this.feretDiameters.aspectRatio,
      fillRatio: this.fillRatio,
      sphericity: this.sphericity,
      roundness: this.roundness,
      solidity: this.solidity,
      perimeter: this.perimeter
    };
  }
}
function getBorders(roi) {
  let roiMap = roi.map;
  let data = roiMap.data;
  let surroudingIDs = /* @__PURE__ */ new Set();
  let surroundingBorders = /* @__PURE__ */ new Map();
  let visitedData = /* @__PURE__ */ new Set();
  let dx = [1, 0, -1, 0];
  let dy = [0, 1, 0, -1];
  for (let x = roi.minX; x <= roi.maxX; x++) {
    for (let y = roi.minY; y <= roi.maxY; y++) {
      let target = x + y * roiMap.width;
      if (data[target] === roi.id) {
        for (let dir = 0; dir < 4; dir++) {
          let newX = x + dx[dir];
          let newY = y + dy[dir];
          if (newX >= 0 && newY >= 0 && newX < roiMap.width && newY < roiMap.height) {
            let neighbour = newX + newY * roiMap.width;
            if (data[neighbour] !== roi.id && !visitedData.has(neighbour)) {
              visitedData.add(neighbour);
              surroudingIDs.add(data[neighbour]);
              let surroundingBorder = surroundingBorders.get(data[neighbour]);
              if (!surroundingBorder) {
                surroundingBorders.set(data[neighbour], 1);
              } else {
                surroundingBorders.set(data[neighbour], ++surroundingBorder);
              }
            }
          }
        }
      }
    }
  }
  let ids = Array.from(surroudingIDs);
  let borderLengths = ids.map(function(id) {
    return surroundingBorders.get(id);
  });
  return {
    ids,
    lengths: borderLengths
  };
}
function getBoxIDs(roi) {
  let surroundingIDs = /* @__PURE__ */ new Set();
  let roiMap = roi.map;
  let data = roiMap.data;
  for (let y of [0, roi.height - 1]) {
    for (let x = 0; x < roi.width; x++) {
      let target = (y + roi.minY) * roiMap.width + x + roi.minX;
      if (x - roi.minX > 0 && data[target] === roi.id && data[target - 1] !== roi.id) {
        let value = data[target - 1];
        surroundingIDs.add(value);
      }
      if (roiMap.width - x - roi.minX > 1 && data[target] === roi.id && data[target + 1] !== roi.id) {
        let value = data[target + 1];
        surroundingIDs.add(value);
      }
    }
  }
  for (let x of [0, roi.width - 1]) {
    for (let y = 0; y < roi.height; y++) {
      let target = (y + roi.minY) * roiMap.width + x + roi.minX;
      if (y - roi.minY > 0 && data[target] === roi.id && data[target - roiMap.width] !== roi.id) {
        let value = data[target - roiMap.width];
        surroundingIDs.add(value);
      }
      if (roiMap.height - y - roi.minY > 1 && data[target] === roi.id && data[target + roiMap.width] !== roi.id) {
        let value = data[target + roiMap.width];
        surroundingIDs.add(value);
      }
    }
  }
  return Array.from(surroundingIDs);
}
function getBox(roi) {
  let total = 0;
  let roiMap = roi.map;
  let data = roiMap.data;
  let topBottom = [0];
  if (roi.height > 1) {
    topBottom[1] = roi.height - 1;
  }
  for (let y of topBottom) {
    for (let x = 1; x < roi.width - 1; x++) {
      let target = (y + roi.minY) * roiMap.width + x + roi.minX;
      if (data[target] === roi.id) {
        total++;
      }
    }
  }
  let leftRight = [0];
  if (roi.width > 1) {
    leftRight[1] = roi.width - 1;
  }
  for (let x of leftRight) {
    for (let y = 0; y < roi.height; y++) {
      let target = (y + roi.minY) * roiMap.width + x + roi.minX;
      if (data[target] === roi.id) {
        total++;
      }
    }
  }
  return total;
}
function getBorder(roi) {
  let total = 0;
  let roiMap = roi.map;
  let data = roiMap.data;
  for (let x = 1; x < roi.width - 1; x++) {
    for (let y = 1; y < roi.height - 1; y++) {
      let target = (y + roi.minY) * roiMap.width + x + roi.minX;
      if (data[target] === roi.id) {
        if (data[target - 1] !== roi.id || data[target + 1] !== roi.id || data[target - roiMap.width] !== roi.id || data[target + roiMap.width] !== roi.id) {
          total++;
        }
      }
    }
  }
  return total + roi.box;
}
function getPerimeterInfo(roi) {
  let roiMap = roi.map;
  let data = roiMap.data;
  let one = 0;
  let two = 0;
  let three = 0;
  let four = 0;
  for (let x = 0; x < roi.width; x++) {
    for (let y = 0; y < roi.height; y++) {
      let target = (y + roi.minY) * roiMap.width + x + roi.minX;
      if (data[target] === roi.id) {
        let nbAround = 0;
        if (x === 0) {
          nbAround++;
        } else if (roi.externalIDs.includes(data[target - 1])) {
          nbAround++;
        }
        if (x === roi.width - 1) {
          nbAround++;
        } else if (roi.externalIDs.includes(data[target + 1])) {
          nbAround++;
        }
        if (y === 0) {
          nbAround++;
        } else if (roi.externalIDs.includes(data[target - roiMap.width])) {
          nbAround++;
        }
        if (y === roi.height - 1) {
          nbAround++;
        } else if (roi.externalIDs.includes(data[target + roiMap.width])) {
          nbAround++;
        }
        switch (nbAround) {
          case 1:
            one++;
            break;
          case 2:
            two++;
            break;
          case 3:
            three++;
            break;
          case 4:
            four++;
            break;
        }
      }
    }
  }
  return { one, two, three, four };
}
function getExternal(roi) {
  let total = 0;
  let roiMap = roi.map;
  let data = roiMap.data;
  for (let x = 1; x < roi.width - 1; x++) {
    for (let y = 1; y < roi.height - 1; y++) {
      let target = (y + roi.minY) * roiMap.width + x + roi.minX;
      if (data[target] === roi.id) {
        if (roi.externalIDs.includes(data[target - 1]) || roi.externalIDs.includes(data[target + 1]) || roi.externalIDs.includes(data[target - roiMap.width]) || roi.externalIDs.includes(data[target + roiMap.width])) {
          total++;
        }
      }
    }
  }
  return total + roi.box;
}
function getHolesInfo(roi) {
  let surface2 = 0;
  let width = roi.map.width;
  let data = roi.map.data;
  for (let x = 1; x < roi.width - 1; x++) {
    for (let y = 1; y < roi.height - 1; y++) {
      let target = (y + roi.minY) * width + x + roi.minX;
      if (roi.internalIDs.includes(data[target]) && data[target] !== roi.id) {
        surface2++;
      }
    }
  }
  return {
    number: roi.internalIDs.length - 1,
    surface: surface2
  };
}
function getInternalIDs(roi) {
  let internal = [roi.id];
  let roiMap = roi.map;
  let data = roiMap.data;
  if (roi.height > 2) {
    for (let x = 0; x < roi.width; x++) {
      let target = roi.minY * roiMap.width + x + roi.minX;
      if (internal.includes(data[target])) {
        let id = data[target + roiMap.width];
        if (!internal.includes(id) && !roi.boxIDs.includes(id)) {
          internal.push(id);
        }
      }
    }
  }
  let array = new Array(4);
  for (let x = 1; x < roi.width - 1; x++) {
    for (let y = 1; y < roi.height - 1; y++) {
      let target = (y + roi.minY) * roiMap.width + x + roi.minX;
      if (internal.includes(data[target])) {
        array[0] = data[target - 1];
        array[1] = data[target + 1];
        array[2] = data[target - roiMap.width];
        array[3] = data[target + roiMap.width];
        for (let i2 = 0; i2 < 4; i2++) {
          let id = array[i2];
          if (!internal.includes(id) && !roi.boxIDs.includes(id)) {
            internal.push(id);
          }
        }
      }
    }
  }
  return internal;
}
class RoiLayer {
  constructor(roiMap, options) {
    this.roiMap = roiMap;
    this.options = options;
    this.roi = this.createRoi();
  }
  /**
   * Roi are created from a roiMap
   * The roiMap contains mainty an array of identifiers that define
   * for each data to which Roi it belongs
   * @memberof RoiManager
   * @instance
   * @return {Roi[]}
   */
  createRoi() {
    let data = this.roiMap.data;
    let mapIDs = {};
    this.roiMap.positive = 0;
    this.roiMap.negative = 0;
    for (let i2 = 0; i2 < data.length; i2++) {
      if (data[i2] && !mapIDs[data[i2]]) {
        mapIDs[data[i2]] = true;
        if (data[i2] > 0) {
          this.roiMap.positive++;
        } else {
          this.roiMap.negative++;
        }
      }
    }
    let rois = {};
    for (let mapID in mapIDs) {
      rois[mapID] = new Roi(this.roiMap, mapID * 1);
    }
    let width = this.roiMap.width;
    let height = this.roiMap.height;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let target = y * width + x;
        if (data[target] !== 0) {
          const mapID = data[target];
          const roi = rois[mapID];
          if (x < roi.minX) {
            roi.minX = x;
          }
          if (x > roi.maxX) {
            roi.maxX = x;
          }
          if (y < roi.minY) {
            roi.minY = y;
          }
          if (y > roi.maxY) {
            roi.maxY = y;
          }
          roi.meanX += x;
          roi.meanY += y;
          roi.surface++;
        }
      }
    }
    let roiArray = [];
    for (let mapID in mapIDs) {
      rois[mapID].meanX /= rois[mapID].surface;
      rois[mapID].meanY /= rois[mapID].surface;
      roiArray.push(rois[mapID]);
    }
    return roiArray;
  }
}
function commonBorderLength(roiMap) {
  let data = roiMap.data;
  let dx = [1, 0, -1, 0];
  let dy = [0, 1, 0, -1];
  let minMax2 = roiMap.minMax;
  let shift = -minMax2.min;
  let max2 = minMax2.max + shift;
  let borderInfo = [];
  for (let i2 = 0; i2 <= max2; i2++) {
    borderInfo.push(/* @__PURE__ */ Object.create(null));
  }
  for (let x = 0; x < roiMap.width; x++) {
    for (let y = 0; y < roiMap.height; y++) {
      let target = x + y * roiMap.width;
      let currentRoiID = data[target];
      if (currentRoiID !== 0) {
        let used = /* @__PURE__ */ Object.create(null);
        let isBorder = false;
        for (let dir = 0; dir < 4; dir++) {
          let newX = x + dx[dir];
          let newY = y + dy[dir];
          if (newX >= 0 && newY >= 0 && newX < roiMap.width && newY < roiMap.height) {
            let neighbourRoiID = data[newX + newY * roiMap.width];
            if (currentRoiID !== neighbourRoiID) {
              isBorder = true;
              if (neighbourRoiID !== 0 && used[neighbourRoiID] === void 0) {
                used[neighbourRoiID] = true;
                if (!borderInfo[neighbourRoiID + shift][currentRoiID]) {
                  borderInfo[neighbourRoiID + shift][currentRoiID] = 1;
                } else {
                  borderInfo[neighbourRoiID + shift][currentRoiID]++;
                }
              }
            }
          } else {
            isBorder = true;
          }
        }
        if (isBorder) {
          if (!borderInfo[currentRoiID + shift][currentRoiID]) {
            borderInfo[currentRoiID + shift][currentRoiID] = 1;
          } else {
            borderInfo[currentRoiID + shift][currentRoiID]++;
          }
        }
      }
    }
  }
  let result = {};
  for (let i2 = 0; i2 < borderInfo.length; i2++) {
    if (Object.keys(borderInfo[i2]).length > 0) {
      result[i2 - shift] = borderInfo[i2];
    }
  }
  return result;
}
function mergeRoi(options = {}) {
  const {
    algorithm = "commonBorderLength",
    minCommonBorderLength = 5,
    maxCommonBorderLength = 100,
    minCommonBorderRatio = 0.3,
    maxCommonBorderRatio = 1
  } = options;
  let checkFunction = function(currentInfo, currentID, neighbourID) {
    return currentInfo[neighbourID] >= minCommonBorderLength && currentInfo[neighbourID] <= maxCommonBorderLength;
  };
  if (typeof algorithm === "function") {
    checkFunction = algorithm;
  }
  if (algorithm.toLowerCase() === "commonborderratio") {
    checkFunction = function(currentInfo, currentID, neighbourID) {
      let ratio = Math.min(
        currentInfo[neighbourID] / currentInfo[currentID],
        1
      );
      return ratio >= minCommonBorderRatio && ratio <= maxCommonBorderRatio;
    };
  }
  const roiMap = this;
  const borderLengths = roiMap.commonBorderLength;
  let newMap = {};
  let oldToNew = {};
  for (let currentID of Object.keys(borderLengths)) {
    let currentInfo = borderLengths[currentID];
    let neighbourIDs = Object.keys(currentInfo);
    for (let neighbourID of neighbourIDs) {
      if (neighbourID !== currentID) {
        if (checkFunction(currentInfo, currentID, neighbourID)) {
          let newNeighbourID = neighbourID;
          if (oldToNew[neighbourID]) newNeighbourID = oldToNew[neighbourID];
          let newCurrentID = currentID;
          if (oldToNew[currentID]) newCurrentID = oldToNew[currentID];
          if (Number(newNeighbourID) !== newCurrentID) {
            let smallerID = Math.min(newNeighbourID, newCurrentID);
            let largerID = Math.max(newNeighbourID, newCurrentID);
            if (!newMap[smallerID]) {
              newMap[smallerID] = {};
            }
            newMap[smallerID][largerID] = true;
            oldToNew[largerID] = smallerID;
            if (newMap[largerID]) {
              for (let id of Object.keys(newMap[largerID])) {
                newMap[smallerID][id] = true;
                oldToNew[id] = smallerID;
              }
              delete newMap[largerID];
            }
          }
        }
      }
    }
  }
  let minMax2 = roiMap.minMax;
  let shift = -minMax2.min;
  let max2 = minMax2.max + shift;
  let oldToNewArray = new Array(max2 + 1).fill(0);
  for (let key of Object.keys(oldToNew)) {
    oldToNewArray[Number(key) + shift] = oldToNew[key];
  }
  let data = roiMap.data;
  for (let i2 = 0; i2 < data.length; i2++) {
    let currentValue = data[i2];
    if (currentValue !== 0) {
      let newValue = oldToNewArray[currentValue + shift];
      if (newValue !== 0) {
        data[i2] = newValue;
      }
    }
  }
  roiMap.computed = {};
  return roiMap;
}
class RoiMap {
  constructor(parent, data) {
    this.parent = parent;
    this.width = parent.width;
    this.height = parent.height;
    this.data = data;
    this.negative = 0;
    this.positive = 0;
  }
  get total() {
    return this.negative + this.positive;
  }
  get minMax() {
    let min2 = Number.MAX_SAFE_INTEGER;
    let max2 = Number.MIN_SAFE_INTEGER;
    for (let i2 = 0; i2 < this.data.length; i2++) {
      if (this.data[i2] < min2) min2 = this.data[i2];
      if (this.data[i2] > max2) max2 = this.data[i2];
    }
    return { min: min2, max: max2 };
  }
  get commonBorderLength() {
    return commonBorderLength(this);
  }
  mergeRoi(options = {}) {
    return mergeRoi.call(this, options);
  }
  mergeRois(rois) {
    const first = rois[0];
    const others = rois.slice(1);
    for (let i2 = 0; i2 < this.data.length; i2++) {
      if (others.includes(this.data[i2])) {
        this.data[i2] = first;
      }
    }
  }
  rowsInfo() {
    let rowsInfo = new Array(this.height);
    let currentRow = 0;
    for (let i2 = 0; i2 < this.data.length; i2 += this.width) {
      let info = {
        row: currentRow,
        positivePixel: 0,
        negativePixel: 0,
        zeroPixel: 0,
        positiveRoi: 0,
        negativeRoi: 0,
        medianChange: 0
      };
      rowsInfo[currentRow++] = info;
      let positives = {};
      let negatives = {};
      let changes = [];
      let previous = this.data[i2];
      let current = 0;
      for (let j = i2; j < i2 + this.width; j++) {
        let value = this.data[j];
        if (previous !== value) {
          previous = value;
          changes.push(current);
          current = 0;
        }
        current++;
        if (value > 0) {
          info.positivePixel++;
          if (!positives[value]) {
            positives[value] = true;
          }
        } else if (value < 0) {
          info.negativePixel++;
          if (!negatives[value]) {
            negatives[value] = true;
          }
        } else {
          info.zeroPixel++;
        }
      }
      changes.push(current);
      info.medianChange = changes.sort((a, b) => a - b)[Math.floor(changes.length / 2)];
      info.positiveRoiIDs = Object.keys(positives);
      info.negativeRoiIDs = Object.keys(negatives);
      info.positiveRoi = info.positiveRoiIDs.length;
      info.negativeRoi = info.negativeRoiIDs.length;
    }
    return rowsInfo;
  }
  colsInfo() {
    let colsInfo = new Array(this.width);
    let currentCol = 0;
    for (let i2 = 0; i2 < this.width; i2++) {
      let info = {
        col: currentCol,
        positivePixel: 0,
        negativePixel: 0,
        zeroPixel: 0,
        positiveRoi: 0,
        negativeRoi: 0,
        medianChange: 0
      };
      colsInfo[currentCol++] = info;
      let positives = {};
      let negatives = {};
      let changes = [];
      let previous = this.data[i2];
      let current = 0;
      for (let j = i2; j < i2 + this.data.length; j += this.width) {
        let value = this.data[j];
        if (previous !== value) {
          previous = value;
          changes.push(current);
          current = 0;
        }
        current++;
        if (value > 0) {
          info.positivePixel++;
          if (!positives[value]) {
            positives[value] = true;
          }
        } else if (value < 0) {
          info.negativePixel++;
          if (!negatives[value]) {
            negatives[value] = true;
          }
        } else {
          info.zeroPixel++;
        }
      }
      changes.push(current);
      info.medianChange = changes.sort((a, b) => a - b)[Math.floor(changes.length / 2)];
      info.positiveRoiIDs = Object.keys(positives);
      info.negativeRoiIDs = Object.keys(negatives);
      info.positiveRoi = info.positiveRoiIDs.length;
      info.negativeRoi = info.negativeRoiIDs.length;
    }
    return colsInfo;
  }
}
function fromMask(mask2, options = {}) {
  const { allowCorners = false } = options;
  const MAX_ARRAY = 65535;
  let data = new Int16Array(mask2.size);
  let positiveID = 0;
  let negativeID = 0;
  let xToProcess = new Uint16Array(MAX_ARRAY + 1);
  let yToProcess = new Uint16Array(MAX_ARRAY + 1);
  for (let x = 0; x < mask2.width; x++) {
    for (let y = 0; y < mask2.height; y++) {
      if (data[y * mask2.width + x] === 0) {
        analyseSurface(x, y);
      }
    }
  }
  function analyseSurface(x, y) {
    let from = 0;
    let to = 0;
    let targetState = mask2.getBitXY(x, y);
    let id = targetState ? ++positiveID : --negativeID;
    if (positiveID > 32767 || negativeID < -32768) {
      throw new Error("Too many regions of interest");
    }
    xToProcess[0] = x;
    yToProcess[0] = y;
    while (from <= to) {
      let currentX = xToProcess[from & MAX_ARRAY];
      let currentY = yToProcess[from & MAX_ARRAY];
      data[currentY * mask2.width + currentX] = id;
      if (currentX > 0 && data[currentY * mask2.width + currentX - 1] === 0 && mask2.getBitXY(currentX - 1, currentY) === targetState) {
        to++;
        xToProcess[to & MAX_ARRAY] = currentX - 1;
        yToProcess[to & MAX_ARRAY] = currentY;
        data[currentY * mask2.width + currentX - 1] = -32768;
      }
      if (currentY > 0 && data[(currentY - 1) * mask2.width + currentX] === 0 && mask2.getBitXY(currentX, currentY - 1) === targetState) {
        to++;
        xToProcess[to & MAX_ARRAY] = currentX;
        yToProcess[to & MAX_ARRAY] = currentY - 1;
        data[(currentY - 1) * mask2.width + currentX] = -32768;
      }
      if (currentX < mask2.width - 1 && data[currentY * mask2.width + currentX + 1] === 0 && mask2.getBitXY(currentX + 1, currentY) === targetState) {
        to++;
        xToProcess[to & MAX_ARRAY] = currentX + 1;
        yToProcess[to & MAX_ARRAY] = currentY;
        data[currentY * mask2.width + currentX + 1] = -32768;
      }
      if (currentY < mask2.height - 1 && data[(currentY + 1) * mask2.width + currentX] === 0 && mask2.getBitXY(currentX, currentY + 1) === targetState) {
        to++;
        xToProcess[to & MAX_ARRAY] = currentX;
        yToProcess[to & MAX_ARRAY] = currentY + 1;
        data[(currentY + 1) * mask2.width + currentX] = -32768;
      }
      if (allowCorners) {
        if (currentX > 0 && currentY > 0 && data[(currentY - 1) * mask2.width + currentX - 1] === 0 && mask2.getBitXY(currentX - 1, currentY - 1) === targetState) {
          to++;
          xToProcess[to & MAX_ARRAY] = currentX - 1;
          yToProcess[to & MAX_ARRAY] = currentY - 1;
          data[(currentY - 1) * mask2.width + currentX - 1] = -32768;
        }
        if (currentX < mask2.width - 1 && currentY > 0 && data[(currentY - 1) * mask2.width + currentX + 1] === 0 && mask2.getBitXY(currentX + 1, currentY - 1) === targetState) {
          to++;
          xToProcess[to & MAX_ARRAY] = currentX + 1;
          yToProcess[to & MAX_ARRAY] = currentY - 1;
          data[(currentY - 1) * mask2.width + currentX + 1] = -32768;
        }
        if (currentX > 0 && currentY < mask2.height - 1 && data[(currentY + 1) * mask2.width + currentX - 1] === 0 && mask2.getBitXY(currentX - 1, currentY + 1) === targetState) {
          to++;
          xToProcess[to & MAX_ARRAY] = currentX - 1;
          yToProcess[to & MAX_ARRAY] = currentY + 1;
          data[(currentY + 1) * mask2.width + currentX - 1] = -32768;
        }
        if (currentX < mask2.width - 1 && currentY < mask2.height - 1 && data[(currentY + 1) * mask2.width + currentX + 1] === 0 && mask2.getBitXY(currentX + 1, currentY + 1) === targetState) {
          to++;
          xToProcess[to & MAX_ARRAY] = currentX + 1;
          yToProcess[to & MAX_ARRAY] = currentY + 1;
          data[(currentY + 1) * mask2.width + currentX + 1] = -32768;
        }
      }
      from++;
      if (to - from > MAX_ARRAY) {
        throw new Error(
          "analyseMask can not finish, the array to manage internal data is not big enough.You could improve mask by changing MAX_ARRAY"
        );
      }
    }
  }
  return new RoiMap(mask2, data);
}
class DisjointSet {
  constructor() {
    this.nodes = /* @__PURE__ */ new Map();
  }
  /**
   * Adds an element as a new set
   * @param {*} value
   * @return {DisjointSetNode} Object holding the element
   */
  add(value) {
    var node = this.nodes.get(value);
    if (!node) {
      node = new DisjointSetNode(value);
      this.nodes.set(value, node);
    }
    return node;
  }
  /**
   * Merges the sets that contain x and y
   * @param {DisjointSetNode} x
   * @param {DisjointSetNode} y
   */
  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX === rootY) {
      return;
    }
    if (rootX.rank < rootY.rank) {
      rootX.parent = rootY;
    } else if (rootX.rank > rootY.rank) {
      rootY.parent = rootX;
    } else {
      rootY.parent = rootX;
      rootX.rank++;
    }
  }
  /**
   * Finds and returns the root node of the set that contains node
   * @param {DisjointSetNode} node
   * @return {DisjointSetNode}
   */
  find(node) {
    var rootX = node;
    while (rootX.parent !== null) {
      rootX = rootX.parent;
    }
    var toUpdateX = node;
    while (toUpdateX.parent !== null) {
      var toUpdateParent = toUpdateX;
      toUpdateX = toUpdateX.parent;
      toUpdateParent.parent = rootX;
    }
    return rootX;
  }
  /**
   * Returns true if x and y belong to the same set
   * @param {DisjointSetNode} x
   * @param {DisjointSetNode} y
   */
  connected(x, y) {
    return this.find(x) === this.find(y);
  }
}
var DisjointSet_1 = DisjointSet;
function DisjointSetNode(value) {
  this.value = value;
  this.parent = null;
  this.rank = 0;
}
const DisjointSet$1 = /* @__PURE__ */ getDefaultExportFromCjs(DisjointSet_1);
const direction4X = [-1, 0];
const direction4Y = [0, -1];
const neighbours4 = [null, null];
const direction8X = [-1, -1, 0, 1];
const direction8Y = [0, -1, -1, -1];
const neighbours8 = [null, null, null, null];
function fromMaskConnectedComponentLabelingAlgorithm(mask2, options = {}) {
  const { allowCorners = false } = options;
  let neighbours = 4;
  if (allowCorners) {
    neighbours = 8;
  }
  let directionX;
  let directionY;
  let neighboursList;
  if (neighbours === 8) {
    directionX = direction8X;
    directionY = direction8Y;
    neighboursList = neighbours8;
  } else if (neighbours === 4) {
    directionX = direction4X;
    directionY = direction4Y;
    neighboursList = neighbours4;
  } else {
    throw new RangeError(`unsupported neighbours count: ${neighbours}`);
  }
  const size = mask2.size;
  const width = mask2.width;
  const height = mask2.height;
  const labels = new Array(size);
  const data = new Uint32Array(size);
  const linked = new DisjointSet$1();
  let currentLabel = 1;
  for (let j = 0; j < height; j++) {
    for (let i2 = 0; i2 < width; i2++) {
      const index = i2 + j * width;
      if (mask2.getBit(index)) {
        let smallestNeighbour = null;
        for (let k = 0; k < neighboursList.length; k++) {
          const ii = i2 + directionX[k];
          const jj = j + directionY[k];
          if (ii >= 0 && jj >= 0 && ii < width && jj < height) {
            const index2 = ii + jj * width;
            let neighbour = labels[index2];
            if (!neighbour) {
              neighboursList[k] = null;
            } else {
              neighboursList[k] = neighbour;
              if (!smallestNeighbour || neighboursList[k].value < smallestNeighbour.value) {
                smallestNeighbour = neighboursList[k];
              }
            }
          }
        }
        if (!smallestNeighbour) {
          labels[index] = linked.add(currentLabel++);
        } else {
          labels[index] = smallestNeighbour;
          for (let k = 0; k < neighboursList.length; k++) {
            if (neighboursList[k] && neighboursList[k] !== smallestNeighbour) {
              linked.union(smallestNeighbour, neighboursList[k]);
            }
          }
        }
      }
    }
  }
  for (let j = 0; j < height; j++) {
    for (let i2 = 0; i2 < width; i2++) {
      const index = i2 + j * width;
      if (mask2.getBit(index)) {
        data[index] = linked.find(labels[index]).value;
      }
    }
  }
  return new RoiMap(mask2, data);
}
function fromMaxima(options = {}) {
  let { allowCorner = true, onlyTop = false, invert: invert2 = false } = options;
  let image = this;
  image.checkProcessable("fromMaxima", { components: [1] });
  const PROCESS_TOP = 1;
  const PROCESS_NORMAL = 2;
  let positiveID = 0;
  let negativeID = 0;
  let data = new Int16Array(image.size);
  let processed = new Int8Array(image.size);
  let variations = new Float32Array(image.size);
  let MAX_ARRAY = 1048575;
  let xToProcess = new Uint16Array(MAX_ARRAY + 1);
  let yToProcess = new Uint16Array(MAX_ARRAY + 1);
  let from = 0;
  let to = 0;
  let xToProcessTop = new Uint16Array(MAX_ARRAY + 1);
  let yToProcessTop = new Uint16Array(MAX_ARRAY + 1);
  let fromTop = 0;
  let toTop = 0;
  appendMaxima(image);
  while (from < to) {
    let currentX = xToProcess[from & MAX_ARRAY];
    let currentY = yToProcess[from & MAX_ARRAY];
    process(currentX, currentY, PROCESS_NORMAL);
    from++;
  }
  return new RoiMap(image, data);
  function appendMaxima({ maxima = true }) {
    for (let y = 1; y < image.height - 1; y++) {
      for (let x = 1; x < image.width - 1; x++) {
        let index = x + y * image.width;
        if (processed[index] === 0) {
          let currentValue = maxima ? image.data[index] : -image.data[x + y * image.width];
          if (image.data[y * image.width + x - 1] > currentValue) {
            continue;
          }
          if (image.data[y * image.width + x + 1] > currentValue) {
            continue;
          }
          if (image.data[(y - 1) * image.width + x] > currentValue) {
            continue;
          }
          if (image.data[(y + 1) * image.width + x] > currentValue) {
            continue;
          }
          if (allowCorner) {
            if (image.data[(y - 1) * image.width + x - 1] > currentValue) {
              continue;
            }
            if (image.data[(y - 1) * image.width + x + 1] > currentValue) {
              continue;
            }
            if (image.data[(y + 1) * image.width + x - 1] > currentValue) {
              continue;
            }
            if (image.data[(y + 1) * image.width + x + 1] > currentValue) {
              continue;
            }
          }
          data[index] = maxima ? ++positiveID : --negativeID;
          let valid = processTop(x, y);
          if (!valid) {
            if (maxima) {
              --positiveID;
            } else {
              ++negativeID;
            }
          }
        }
      }
    }
  }
  function processTop(xToProcess2, yToProcess2) {
    let currentTo = to;
    fromTop = 0;
    toTop = 1;
    xToProcessTop[0] = xToProcess2;
    yToProcessTop[0] = yToProcess2;
    let valid = true;
    while (fromTop < toTop) {
      let currentX = xToProcessTop[fromTop & MAX_ARRAY];
      let currentY = yToProcessTop[fromTop & MAX_ARRAY];
      valid &= process(currentX, currentY, PROCESS_TOP);
      fromTop++;
    }
    if (!valid) {
      for (let i2 = 0; i2 < toTop; i2++) {
        let currentX = xToProcessTop[i2 & MAX_ARRAY];
        let currentY = yToProcessTop[i2 & MAX_ARRAY];
        let index = currentY * image.width + currentX;
        data[index] = 0;
      }
      to = currentTo;
    }
    return valid;
  }
  function process(xCenter, yCenter, type) {
    let currentID = data[yCenter * image.width + xCenter];
    let currentValue = image.data[yCenter * image.width + xCenter];
    for (let y = yCenter - 1; y <= yCenter + 1; y++) {
      for (let x = xCenter - 1; x <= xCenter + 1; x++) {
        let index = y * image.width + x;
        if (processed[index] === 0) {
          processed[index] = 1;
          variations[index] = image.data[index] - currentValue;
          switch (type) {
            case PROCESS_TOP:
              if (variations[index] === 0) {
                if (x === 0 || y === 0 || x === image.width - 1 || y === image.height - 1) {
                  return false;
                }
                data[index] = currentID;
                xToProcessTop[toTop & MAX_ARRAY] = x;
                yToProcessTop[toTop & MAX_ARRAY] = y;
                toTop++;
              } else if (variations[index] > 0) {
                return false;
              } else {
                if (!onlyTop) {
                  data[index] = currentID;
                  xToProcess[to & MAX_ARRAY] = x;
                  yToProcess[to & MAX_ARRAY] = y;
                  to++;
                }
              }
              break;
            case PROCESS_NORMAL:
              if (variations[index] <= 0) {
                data[index] = currentID;
                xToProcess[to & MAX_ARRAY] = x;
                yToProcess[to & MAX_ARRAY] = y;
                to++;
              }
              break;
            default:
              throw new Error("unreachable");
          }
        }
      }
    }
    return true;
  }
}
function fromPoints(pointsToPaint, options = {}) {
  let shape = new Shape(options);
  let data = new Int16Array(this.size);
  let positiveID = 0;
  let shapePoints = shape.getPoints();
  for (let i2 = 0; i2 < pointsToPaint.length; i2++) {
    positiveID++;
    let xP = pointsToPaint[i2][0];
    let yP = pointsToPaint[i2][1];
    for (let j = 0; j < shapePoints.length; j++) {
      let xS = shapePoints[j][0];
      let yS = shapePoints[j][1];
      if (xP + xS >= 0 && yP + yS >= 0 && xP + xS < this.width && yP + yS < this.height) {
        data[xP + xS + (yP + yS) * this.width] = positiveID;
      }
    }
  }
  return new RoiMap(this, data);
}
function commonjsRequire(path) {
  throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var priorityQueue = { exports: {} };
(function(module2, exports) {
  (function(f) {
    {
      module2.exports = f();
    }
  })(function() {
    return function e(t, n, r) {
      function s(o2, u) {
        if (!n[o2]) {
          if (!t[o2]) {
            var a = typeof commonjsRequire == "function" && commonjsRequire;
            if (!u && a) return a(o2, true);
            if (i2) return i2(o2, true);
            var f = new Error("Cannot find module '" + o2 + "'");
            throw f.code = "MODULE_NOT_FOUND", f;
          }
          var l = n[o2] = { exports: {} };
          t[o2][0].call(l.exports, function(e2) {
            var n2 = t[o2][1][e2];
            return s(n2 ? n2 : e2);
          }, l, l.exports, e, t, n, r);
        }
        return n[o2].exports;
      }
      var i2 = typeof commonjsRequire == "function" && commonjsRequire;
      for (var o = 0; o < r.length; o++) s(r[o]);
      return s;
    }({ 1: [function(_dereq_, module3, exports2) {
      var AbstractPriorityQueue, ArrayStrategy, BHeapStrategy, BinaryHeapStrategy, PriorityQueue2, extend2 = function(child, parent) {
        for (var key in parent) {
          if (hasProp.call(parent, key)) child[key] = parent[key];
        }
        function ctor() {
          this.constructor = child;
        }
        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
      }, hasProp = {}.hasOwnProperty;
      AbstractPriorityQueue = _dereq_("./PriorityQueue/AbstractPriorityQueue");
      ArrayStrategy = _dereq_("./PriorityQueue/ArrayStrategy");
      BinaryHeapStrategy = _dereq_("./PriorityQueue/BinaryHeapStrategy");
      BHeapStrategy = _dereq_("./PriorityQueue/BHeapStrategy");
      PriorityQueue2 = function(superClass) {
        extend2(PriorityQueue3, superClass);
        function PriorityQueue3(options) {
          options || (options = {});
          options.strategy || (options.strategy = BinaryHeapStrategy);
          options.comparator || (options.comparator = function(a, b) {
            return (a || 0) - (b || 0);
          });
          PriorityQueue3.__super__.constructor.call(this, options);
        }
        return PriorityQueue3;
      }(AbstractPriorityQueue);
      PriorityQueue2.ArrayStrategy = ArrayStrategy;
      PriorityQueue2.BinaryHeapStrategy = BinaryHeapStrategy;
      PriorityQueue2.BHeapStrategy = BHeapStrategy;
      module3.exports = PriorityQueue2;
    }, { "./PriorityQueue/AbstractPriorityQueue": 2, "./PriorityQueue/ArrayStrategy": 3, "./PriorityQueue/BHeapStrategy": 4, "./PriorityQueue/BinaryHeapStrategy": 5 }], 2: [function(_dereq_, module3, exports2) {
      module3.exports = function() {
        function AbstractPriorityQueue(options) {
          var ref;
          if ((options != null ? options.strategy : void 0) == null) {
            throw "Must pass options.strategy, a strategy";
          }
          if ((options != null ? options.comparator : void 0) == null) {
            throw "Must pass options.comparator, a comparator";
          }
          this.priv = new options.strategy(options);
          this.length = (options != null ? (ref = options.initialValues) != null ? ref.length : void 0 : void 0) || 0;
        }
        AbstractPriorityQueue.prototype.queue = function(value) {
          this.length++;
          this.priv.queue(value);
          return void 0;
        };
        AbstractPriorityQueue.prototype.dequeue = function(value) {
          if (!this.length) {
            throw "Empty queue";
          }
          this.length--;
          return this.priv.dequeue();
        };
        AbstractPriorityQueue.prototype.peek = function(value) {
          if (!this.length) {
            throw "Empty queue";
          }
          return this.priv.peek();
        };
        AbstractPriorityQueue.prototype.clear = function() {
          this.length = 0;
          return this.priv.clear();
        };
        return AbstractPriorityQueue;
      }();
    }, {}], 3: [function(_dereq_, module3, exports2) {
      var binarySearchForIndexReversed;
      binarySearchForIndexReversed = function(array, value, comparator) {
        var high, low, mid;
        low = 0;
        high = array.length;
        while (low < high) {
          mid = low + high >>> 1;
          if (comparator(array[mid], value) >= 0) {
            low = mid + 1;
          } else {
            high = mid;
          }
        }
        return low;
      };
      module3.exports = function() {
        function ArrayStrategy(options) {
          var ref;
          this.options = options;
          this.comparator = this.options.comparator;
          this.data = ((ref = this.options.initialValues) != null ? ref.slice(0) : void 0) || [];
          this.data.sort(this.comparator).reverse();
        }
        ArrayStrategy.prototype.queue = function(value) {
          var pos;
          pos = binarySearchForIndexReversed(this.data, value, this.comparator);
          this.data.splice(pos, 0, value);
          return void 0;
        };
        ArrayStrategy.prototype.dequeue = function() {
          return this.data.pop();
        };
        ArrayStrategy.prototype.peek = function() {
          return this.data[this.data.length - 1];
        };
        ArrayStrategy.prototype.clear = function() {
          this.data.length = 0;
          return void 0;
        };
        return ArrayStrategy;
      }();
    }, {}], 4: [function(_dereq_, module3, exports2) {
      module3.exports = function() {
        function BHeapStrategy(options) {
          var arr, j, k, len, ref, ref1, shift, value;
          this.comparator = (options != null ? options.comparator : void 0) || function(a, b) {
            return a - b;
          };
          this.pageSize = (options != null ? options.pageSize : void 0) || 512;
          this.length = 0;
          shift = 0;
          while (1 << shift < this.pageSize) {
            shift += 1;
          }
          if (1 << shift !== this.pageSize) {
            throw "pageSize must be a power of two";
          }
          this._shift = shift;
          this._emptyMemoryPageTemplate = arr = [];
          for (j = 0, ref = this.pageSize; 0 <= ref ? j < ref : j > ref; 0 <= ref ? ++j : --j) {
            arr.push(null);
          }
          this._memory = [];
          this._mask = this.pageSize - 1;
          if (options.initialValues) {
            ref1 = options.initialValues;
            for (k = 0, len = ref1.length; k < len; k++) {
              value = ref1[k];
              this.queue(value);
            }
          }
        }
        BHeapStrategy.prototype.queue = function(value) {
          this.length += 1;
          this._write(this.length, value);
          this._bubbleUp(this.length, value);
          return void 0;
        };
        BHeapStrategy.prototype.dequeue = function() {
          var ret, val;
          ret = this._read(1);
          val = this._read(this.length);
          this.length -= 1;
          if (this.length > 0) {
            this._write(1, val);
            this._bubbleDown(1, val);
          }
          return ret;
        };
        BHeapStrategy.prototype.peek = function() {
          return this._read(1);
        };
        BHeapStrategy.prototype.clear = function() {
          this.length = 0;
          this._memory.length = 0;
          return void 0;
        };
        BHeapStrategy.prototype._write = function(index, value) {
          var page;
          page = index >> this._shift;
          while (page >= this._memory.length) {
            this._memory.push(this._emptyMemoryPageTemplate.slice(0));
          }
          return this._memory[page][index & this._mask] = value;
        };
        BHeapStrategy.prototype._read = function(index) {
          return this._memory[index >> this._shift][index & this._mask];
        };
        BHeapStrategy.prototype._bubbleUp = function(index, value) {
          var compare, indexInPage, parentIndex, parentValue;
          compare = this.comparator;
          while (index > 1) {
            indexInPage = index & this._mask;
            if (index < this.pageSize || indexInPage > 3) {
              parentIndex = index & ~this._mask | indexInPage >> 1;
            } else if (indexInPage < 2) {
              parentIndex = index - this.pageSize >> this._shift;
              parentIndex += parentIndex & ~(this._mask >> 1);
              parentIndex |= this.pageSize >> 1;
            } else {
              parentIndex = index - 2;
            }
            parentValue = this._read(parentIndex);
            if (compare(parentValue, value) < 0) {
              break;
            }
            this._write(parentIndex, value);
            this._write(index, parentValue);
            index = parentIndex;
          }
          return void 0;
        };
        BHeapStrategy.prototype._bubbleDown = function(index, value) {
          var childIndex1, childIndex2, childValue1, childValue2, compare;
          compare = this.comparator;
          while (index < this.length) {
            if (index > this._mask && !(index & this._mask - 1)) {
              childIndex1 = childIndex2 = index + 2;
            } else if (index & this.pageSize >> 1) {
              childIndex1 = (index & ~this._mask) >> 1;
              childIndex1 |= index & this._mask >> 1;
              childIndex1 = childIndex1 + 1 << this._shift;
              childIndex2 = childIndex1 + 1;
            } else {
              childIndex1 = index + (index & this._mask);
              childIndex2 = childIndex1 + 1;
            }
            if (childIndex1 !== childIndex2 && childIndex2 <= this.length) {
              childValue1 = this._read(childIndex1);
              childValue2 = this._read(childIndex2);
              if (compare(childValue1, value) < 0 && compare(childValue1, childValue2) <= 0) {
                this._write(childIndex1, value);
                this._write(index, childValue1);
                index = childIndex1;
              } else if (compare(childValue2, value) < 0) {
                this._write(childIndex2, value);
                this._write(index, childValue2);
                index = childIndex2;
              } else {
                break;
              }
            } else if (childIndex1 <= this.length) {
              childValue1 = this._read(childIndex1);
              if (compare(childValue1, value) < 0) {
                this._write(childIndex1, value);
                this._write(index, childValue1);
                index = childIndex1;
              } else {
                break;
              }
            } else {
              break;
            }
          }
          return void 0;
        };
        return BHeapStrategy;
      }();
    }, {}], 5: [function(_dereq_, module3, exports2) {
      module3.exports = function() {
        function BinaryHeapStrategy(options) {
          var ref;
          this.comparator = (options != null ? options.comparator : void 0) || function(a, b) {
            return a - b;
          };
          this.length = 0;
          this.data = ((ref = options.initialValues) != null ? ref.slice(0) : void 0) || [];
          this._heapify();
        }
        BinaryHeapStrategy.prototype._heapify = function() {
          var i2, j, ref;
          if (this.data.length > 0) {
            for (i2 = j = 1, ref = this.data.length; 1 <= ref ? j < ref : j > ref; i2 = 1 <= ref ? ++j : --j) {
              this._bubbleUp(i2);
            }
          }
          return void 0;
        };
        BinaryHeapStrategy.prototype.queue = function(value) {
          this.data.push(value);
          this._bubbleUp(this.data.length - 1);
          return void 0;
        };
        BinaryHeapStrategy.prototype.dequeue = function() {
          var last, ret;
          ret = this.data[0];
          last = this.data.pop();
          if (this.data.length > 0) {
            this.data[0] = last;
            this._bubbleDown(0);
          }
          return ret;
        };
        BinaryHeapStrategy.prototype.peek = function() {
          return this.data[0];
        };
        BinaryHeapStrategy.prototype.clear = function() {
          this.length = 0;
          this.data.length = 0;
          return void 0;
        };
        BinaryHeapStrategy.prototype._bubbleUp = function(pos) {
          var parent, x;
          while (pos > 0) {
            parent = pos - 1 >>> 1;
            if (this.comparator(this.data[pos], this.data[parent]) < 0) {
              x = this.data[parent];
              this.data[parent] = this.data[pos];
              this.data[pos] = x;
              pos = parent;
            } else {
              break;
            }
          }
          return void 0;
        };
        BinaryHeapStrategy.prototype._bubbleDown = function(pos) {
          var last, left, minIndex, right, x;
          last = this.data.length - 1;
          while (true) {
            left = (pos << 1) + 1;
            right = left + 1;
            minIndex = pos;
            if (left <= last && this.comparator(this.data[left], this.data[minIndex]) < 0) {
              minIndex = left;
            }
            if (right <= last && this.comparator(this.data[right], this.data[minIndex]) < 0) {
              minIndex = right;
            }
            if (minIndex !== pos) {
              x = this.data[minIndex];
              this.data[minIndex] = this.data[pos];
              this.data[pos] = x;
              pos = minIndex;
            } else {
              break;
            }
          }
          return void 0;
        };
        return BinaryHeapStrategy;
      }();
    }, {}] }, {}, [1])(1);
  });
})(priorityQueue);
var priorityQueueExports = priorityQueue.exports;
const PriorityQueue = /* @__PURE__ */ getDefaultExportFromCjs(priorityQueueExports);
const dxs = [1, 0, -1, 0, 1, 1, -1, -1];
const dys = [0, 1, 0, -1, 1, -1, 1, -1];
function fromWaterShed(options = {}) {
  let {
    points: points2,
    mask: mask2,
    image,
    fillMaxValue = this.maxValue,
    invert: invert2 = false
  } = options;
  let currentImage = image || this;
  currentImage.checkProcessable("fromWaterShed", {
    bitDepth: [8, 16],
    components: 1
  });
  invert2 = !invert2;
  if (!points2) {
    points2 = currentImage.getLocalMaxima({
      invert: invert2,
      mask: mask2
    });
  }
  let maskExpectedValue = invert2 ? 0 : 1;
  let data = new Int16Array(currentImage.size);
  let width = currentImage.width;
  let height = currentImage.height;
  let toProcess = new PriorityQueue({
    comparator: (a, b) => a[2] - b[2],
    strategy: PriorityQueue.BinaryHeapStrategy
  });
  for (let i2 = 0; i2 < points2.length; i2++) {
    let index = points2[i2][0] + points2[i2][1] * width;
    data[index] = i2 + 1;
    let intensity = currentImage.data[index];
    if (invert2 && intensity <= fillMaxValue || !invert2 && intensity >= fillMaxValue) {
      toProcess.queue([points2[i2][0], points2[i2][1], intensity]);
    }
  }
  while (toProcess.length > 0) {
    let currentPoint = toProcess.dequeue();
    let currentValueIndex = currentPoint[0] + currentPoint[1] * width;
    for (let dir = 0; dir < 4; dir++) {
      let newX = currentPoint[0] + dxs[dir];
      let newY = currentPoint[1] + dys[dir];
      if (newX >= 0 && newY >= 0 && newX < width && newY < height) {
        let currentNeighbourIndex = newX + newY * width;
        if (!mask2 || mask2.getBit(currentNeighbourIndex) === maskExpectedValue) {
          let intensity = currentImage.data[currentNeighbourIndex];
          if (invert2 && intensity <= fillMaxValue || !invert2 && intensity >= fillMaxValue) {
            if (data[currentNeighbourIndex] === 0) {
              data[currentNeighbourIndex] = data[currentValueIndex];
              toProcess.queue([
                currentPoint[0] + dxs[dir],
                currentPoint[1] + dys[dir],
                intensity
              ]);
            }
          }
        }
      }
    }
  }
  return new RoiMap(currentImage, data);
}
class RoiManager {
  constructor(image, options = {}) {
    this._image = image;
    this._options = options;
    if (!this._options.label) {
      this._options.label = "default";
    }
    this._layers = {};
    this._painted = null;
  }
  // docs is in the corresponding file
  fromMaxima(options = {}) {
    let opt = Object.assign({}, this._options, options);
    let roiMap = fromMaxima.call(this._image, options);
    this._layers[opt.label] = new RoiLayer(roiMap, opt);
  }
  // docs is in the corresponding file
  fromPoints(points2, options = {}) {
    let opt = Object.assign({}, this._options, options);
    let roiMap = fromPoints.call(this._image, points2, options);
    this._layers[opt.label] = new RoiLayer(roiMap, opt);
    return this;
  }
  /**
   * @param {number[]} map
   * @param {object} [options]
   * @return {this}
   */
  putMap(map, options = {}) {
    let roiMap = new RoiMap(this._image, map);
    let opt = Object.assign({}, this._options, options);
    this._layers[opt.label] = new RoiLayer(roiMap, opt);
    return this;
  }
  // docs is in the corresponding file
  fromWaterShed(options = {}) {
    let opt = Object.assign({}, this._options, options);
    let roiMap = fromWaterShed.call(this._image, options);
    this._layers[opt.label] = new RoiLayer(roiMap, opt);
  }
  // docs is in the corresponding file
  fromMask(mask2, options = {}) {
    let opt = Object.assign({}, this._options, options);
    let roiMap = fromMask.call(this._image, mask2, options);
    this._layers[opt.label] = new RoiLayer(roiMap, opt);
    return this;
  }
  fromMaskConnectedComponentLabelingAlgorithm(mask2, options = {}) {
    let opt = Object.assign({}, this._options, options);
    let roiMap = fromMaskConnectedComponentLabelingAlgorithm.call(
      this._image,
      mask2,
      options
    );
    this._layers[opt.label] = new RoiLayer(roiMap, opt);
    return this;
  }
  /**
   *
   * @param {object} [options]
   * @return {RoiMap}
   */
  getMap(options = {}) {
    let opt = Object.assign({}, this._options, options);
    this._assertLayerWithLabel(opt.label);
    return this._layers[opt.label].roiMap;
  }
  /**
   * Return statistics about rows
   * @param {object} [options]
   * @return {object[]}
   */
  rowsInfo(options = {}) {
    return this.getMap(options).rowsInfo();
  }
  /**
   * Return statistics about columns
   * @param {object} [options]
   * @return {object[]}
   */
  colsInfo(options = {}) {
    return this.getMap(options).rowsInfo();
  }
  /**
   * Return the IDs of the Regions Of Interest (Roi) as an array of number
   * @param {object} [options]
   * @return {number[]}
   */
  getRoiIds(options = {}) {
    let rois = this.getRois(options);
    if (rois) {
      let ids = new Array(rois.length);
      for (let i2 = 0; i2 < rois.length; i2++) {
        ids[i2] = rois[i2].id;
      }
      return ids;
    }
    throw new Error("ROIs not found");
  }
  /**
   * Allows to select ROI based on size, label and sign.
   * @param {object} [options={}]
   * @param {string} [options.label='default'] Label of the layer containing the ROI
   * @param {boolean} [options.positive=true] Select the positive region of interest
   * @param {boolean} [options.negative=true] Select he negative region of interest
   * @param {number} [options.minSurface=0]
   * @param {number} [options.maxSurface=Number.POSITIVE_INFINITY]
   * @param {number} [options.minWidth=0]
   * @param {number} [options.minHeight=Number.POSITIVE_INFINITY]
   * @param {number} [options.maxWidth=0]
   * @param {number} [options.maxHeight=Number.POSITIVE_INFINITY]
   * @param {number} [options.minRatio=0] Ratio width / height
   * @param {number} [options.maxRatio=Number.POSITIVE_INFINITY]
   * @return {Roi[]}
   */
  getRois(options = {}) {
    let {
      label = this._options.label,
      positive = true,
      negative = true,
      minSurface = 0,
      maxSurface = Number.POSITIVE_INFINITY,
      minWidth = 0,
      maxWidth = Number.POSITIVE_INFINITY,
      minHeight = 0,
      maxHeight = Number.POSITIVE_INFINITY,
      minRatio = 0,
      maxRatio = Number.POSITIVE_INFINITY
    } = options;
    if (!this._layers[label]) {
      throw new Error(`this Roi layer (${label}) does not exist`);
    }
    const allRois = this._layers[label].roi;
    const rois = [];
    for (const roi of allRois) {
      if ((roi.id < 0 && negative || roi.id > 0 && positive) && roi.surface >= minSurface && roi.surface <= maxSurface && roi.width >= minWidth && roi.width <= maxWidth && roi.height >= minHeight && roi.height <= maxHeight && roi.ratio >= minRatio && roi.ratio <= maxRatio) {
        rois.push(roi);
      }
    }
    return rois;
  }
  /**
   * Get an ROI by its id.
   * @param {number} roiId
   * @param {object} [options={}]
   * @param {string} [options.label='default'] Label of the layer containing the ROI
   * @return {Roi}
   */
  getRoi(roiId, options = {}) {
    const { label = this._options.label } = options;
    if (!this._layers[label]) {
      throw new Error(`this Roi layer (${label}) does not exist`);
    }
    const roi = this._layers[label].roi.find((roi2) => roi2.id === roiId);
    if (!roi) {
      throw new Error(`found no Roi with id ${roiId}`);
    }
    return roi;
  }
  /**
   * Returns an array of masks
   * See {@link Roi.getMask} for the options
   * @param {object} [options]
   * @return {Image[]} Retuns an array of masks (1 bit Image)
   */
  getMasks(options = {}) {
    let rois = this.getRois(options);
    let masks = new Array(rois.length);
    for (let i2 = 0; i2 < rois.length; i2++) {
      masks[i2] = rois[i2].getMask(options);
    }
    return masks;
  }
  /**
   * Returns an array of masks
   * See {@link Roi.getAnalysisMasks} for the options
   * @param {object} [options]
   * @return {Image[]} Retuns an array of masks (1 bit Image)
   */
  getAnalysisMasks(options = {}) {
    const { analysisProperty } = options;
    let maskProperty = `${analysisProperty}Mask`;
    let rois = this.getRois(options);
    if (rois.length === 0 || !rois[0][maskProperty]) return [];
    return rois.map((roi) => roi[maskProperty]);
  }
  /**
   *
   * @param {object} [options]
   * @return {number[]}
   */
  getData(options = {}) {
    let opt = Object.assign({}, this._options, options);
    this._assertLayerWithLabel(opt.label);
    return this._layers[opt.label].roiMap.data;
  }
  /**
   * Paint the ROI on a copy of the image and return this image.
   * For painting options {@link Image.paintMasks}
   * For ROI selection options, see {@link RoiManager.getMasks}
   * @param {object} [options] - all the options to select ROIs
   * @param {string} [options.labelProperty] - Paint a mask property on the image.
   *                                  May be any property of the ROI like
   *                                  for example id, surface, width, height, meanX, meanY.
   * @param {number} [options.pixelSize] Size of a pixel in SI
   * @param {string} [options.unit="pixel"] Unit in which to display the values
   * @return {Image} - The painted RGBA 8 bits image
   */
  paint(options = {}) {
    let { labelProperty, analysisProperty } = options;
    if (!this._painted) {
      this._painted = this._image.rgba8();
    }
    let masks = this.getMasks(options);
    if (labelProperty) {
      const rois = this.getRois(options);
      options.labels = rois.map((roi) => deepValue(roi, labelProperty));
      const max2 = Math.max(...options.labels);
      let isSurface = false;
      let isDistance = false;
      if (labelProperty.includes("surface")) {
        isSurface = true;
      } else if (/(?:perimeter|min|max|external|width|height|length)/.test(labelProperty)) {
        isDistance = true;
      }
      if (isFinite(max2)) {
        let unitLabel = "";
        if (options.unit !== "pixel" && options.pixelSize && (isDistance || isSurface)) {
          unitLabel = isSurface ? `${options.unit}^2` : options.unit;
          let siLabel = isSurface ? "m^2" : "m";
          let factor = isSurface ? options.pixelSize ** 2 : options.pixelSize;
          const convert = Qty.swiftConverter(siLabel, unitLabel);
          options.labels = options.labels.map((value) => {
            return convert(factor * value);
          });
        }
        if (max2 > 50) {
          options.labels = options.labels.map(
            (number) => Math.round(number) + unitLabel
          );
        } else if (max2 > 10) {
          options.labels = options.labels.map(
            (number) => number.toFixed(1) + unitLabel
          );
        } else {
          options.labels = options.labels.map(
            (number) => number.toFixed(2) + unitLabel
          );
        }
      }
      options.labelsPosition = rois.map((roi) => [roi.meanX, roi.meanY]);
    }
    this._painted.paintMasks(masks, options);
    if (analysisProperty) {
      let analysisMasks = this.getAnalysisMasks(options);
      this._painted.paintMasks(analysisMasks, {
        color: options.analysisColor,
        alpha: options.analysisAlpha
      });
    }
    return this._painted;
  }
  // return a mask corresponding to all the selected masks
  getMask(options = {}) {
    let mask2 = new Image(this._image.width, this._image.height, {
      kind: "BINARY"
    });
    let masks = this.getMasks(options);
    for (let i2 = 0; i2 < masks.length; i2++) {
      let roi = masks[i2];
      for (let x = 0; x < roi.width; x++) {
        for (let y = 0; y < roi.height; y++) {
          if (roi.getBitXY(x, y)) {
            mask2.setBitXY(x + roi.position[0], y + roi.position[1]);
          }
        }
      }
    }
    return mask2;
  }
  /**
   * Reset the changes to the current painted iamge to the image that was
   * used during the creation of the RoiManager except if a new image is
   * specified as parameter;
   * @param {object} [options]
   * @param {Image} [options.image] A new iamge that you would like to sue for painting over
   */
  resetPainted(options = {}) {
    const { image } = options;
    if (image) {
      this._painted = this.image.rgba8();
    } else {
      this._painted = this._image.rgba8();
    }
  }
  /**
   * In place modification of the roiMap that joins regions of interest
   * @param {object} [options]
   * @param {string|function(object,number,number)} [options.algorithm='commonBorderLength'] algorithm used to decide which ROIs are merged.
   *      Current implemented algorithms are 'commonBorderLength' that use the parameters
   *      'minCommonBorderLength' and 'maxCommonBorderLength' as well as 'commonBorderRatio' that uses
   *      the parameters 'minCommonBorderRatio' and 'maxCommonBorderRatio'.
   * @param {number} [options.minCommonBorderLength=5] minimal common number of pixels for merging
   * @param {number} [options.maxCommonBorderLength=100] maximal common number of pixels for merging
   * @param {number} [options.minCommonBorderRatio=0.3] minimal common border ratio for merging
   * @param {number} [options.maxCommonBorderRatio=1] maximal common border ratio for merging
   * @return {this}
   */
  mergeRoi(options = {}) {
    const roiMap = this.getMap(options);
    roiMap.mergeRoi(options);
    this.putMap(roiMap.data, options);
    return this;
  }
  /**
   * Merge multiple rois into one.
   * All rois in the provided array will be merged into the first one.
   * @param {Array<number>} roiIds - A list of Roi ids to merge
   * @param {object} [options]
   */
  mergeRois(roiIds, options = {}) {
    if (!Array.isArray(roiIds) || roiIds.some((id) => !Number.isInteger(id))) {
      throw new Error("Roi ids must be an array of integers");
    }
    if (roiIds.length < 2) {
      throw new Error("Roi ids must have at least two elements");
    }
    if (new Set(roiIds).size !== roiIds.length) {
      throw new Error("Roi ids must be all different");
    }
    roiIds.forEach((roiId) => this.getRoi(roiId));
    const roiMap = this.getMap(options);
    roiMap.mergeRois(roiIds);
    this.putMap(roiMap.data, options);
    return this;
  }
  /**
   * Finds all corresponding ROIs for all ROIs in the manager
   * @param {number[]} roiMap
   * @param {object} [options]
   * @return {Array} array of objects returned in correspondingRoisInformation
   */
  findCorrespondingRoi(roiMap, options = {}) {
    let allRois = this.getRois(options);
    let allRelated = [];
    for (let i2 = 0; i2 < allRois.length; i2++) {
      let currentRoi = allRois[i2];
      let x = currentRoi.minX;
      let y = currentRoi.minY;
      let allPoints = currentRoi.points;
      let roiSign = Math.sign(currentRoi.id);
      let currentRelated = correspondingRoisInformation(
        x,
        y,
        allPoints,
        roiMap,
        roiSign
      );
      allRelated.push(currentRelated);
    }
    return allRelated;
  }
  _assertLayerWithLabel(label) {
    if (!this._layers[label]) {
      throw new Error(`no layer with label ${label}`);
    }
  }
}
function correspondingRoisInformation(x, y, points2, roiMap, roiSign) {
  let correspondingRois = {
    id: [],
    surface: [],
    roiSurfaceCovered: [],
    same: 0,
    opposite: 0,
    total: 0
  };
  for (let i2 = 0; i2 < points2.length; i2++) {
    let currentPoint = points2[i2];
    let currentX = currentPoint[0];
    let currentY = currentPoint[1];
    let correspondingRoiMapIndex = currentX + x + (currentY + y) * roiMap.width;
    let value = roiMap.data[correspondingRoiMapIndex];
    if (value > 0 || value < 0) {
      if (correspondingRois.id.includes(value)) {
        correspondingRois.surface[correspondingRois.id.indexOf(value)] += 1;
      } else {
        correspondingRois.id.push(value);
        correspondingRois.surface.push(1);
      }
    }
  }
  for (let i2 = 0; i2 < correspondingRois.id.length; i2++) {
    let currentSign = Math.sign(correspondingRois.id[i2]);
    if (currentSign === roiSign) {
      correspondingRois.same += correspondingRois.surface[i2];
    } else {
      correspondingRois.opposite += correspondingRois.surface[i2];
    }
    correspondingRois.roiSurfaceCovered[i2] = correspondingRois.surface[i2] / points2.length;
  }
  correspondingRois.total = correspondingRois.opposite + correspondingRois.same;
  return correspondingRois;
}
const objectToString = Object.prototype.toString;
class Image {
  constructor(width, height, data, options) {
    if (arguments.length === 1) {
      options = width;
      ({ width, height, data } = options);
    } else if (data && !data.length) {
      options = data;
      ({ data } = options);
    }
    if (width === void 0) width = 1;
    if (height === void 0) height = 1;
    if (options === void 0) options = {};
    if (typeof options !== "object" || options === null) {
      throw new TypeError("options must be an object");
    }
    if (!Number.isInteger(width) || width <= 0) {
      throw new RangeError("width must be a positive integer");
    }
    if (!Number.isInteger(height) || height <= 0) {
      throw new RangeError("height must be a positive integer");
    }
    const { kind = RGBA } = options;
    if (typeof kind !== "string") {
      throw new TypeError("kind must be a string");
    }
    const theKind = getKind(kind);
    const kindDefinition = Object.assign({}, options);
    for (const prop in theKind) {
      if (kindDefinition[prop] === void 0) {
        kindDefinition[prop] = theKind[prop];
      }
    }
    verifyKindDefinition(kindDefinition);
    const { components, bitDepth, colorModel } = kindDefinition;
    const alpha = kindDefinition.alpha + 0;
    const size = width * height;
    const channels = components + alpha;
    const maxValue = bitDepth === 32 ? Number.MAX_VALUE : 2 ** bitDepth - 1;
    if (data === void 0) {
      data = createPixelArray(
        size,
        components,
        alpha,
        channels,
        bitDepth,
        maxValue
      );
    } else {
      const expectedLength = getTheoreticalPixelArraySize(
        size,
        channels,
        bitDepth
      );
      if (data.length !== expectedLength) {
        throw new RangeError(
          `incorrect data size: ${data.length}. Should be ${expectedLength}`
        );
      }
    }
    this.width = width;
    this.height = height;
    this.data = data;
    this.size = size;
    this.components = components;
    this.alpha = alpha;
    this.bitDepth = bitDepth;
    this.maxValue = maxValue;
    this.colorModel = colorModel;
    this.channels = channels;
    this.meta = options.meta || {};
    Object.defineProperty(this, "parent", {
      enumerable: false,
      writable: true,
      configurable: true,
      value: options.parent || null
    });
    this.position = options.position || [0, 0];
    this.computed = null;
    this.sizes = [this.width, this.height];
    this.multiplierX = this.channels;
    this.multiplierY = this.channels * this.width;
    this.isClamped = this.bitDepth < 32;
    this.borderSizes = [0, 0];
  }
  get [Symbol.toStringTag]() {
    return "IJSImage";
  }
  static isImage(object) {
    return objectToString.call(object) === "[object IJSImage]";
  }
  /**
   * Creates an image from an HTML Canvas object
   * @param {Canvas} canvas
   * @return {Image}
   */
  static fromCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return new Image(imageData.width, imageData.height, imageData.data);
  }
  /**
   * Create a new Image based on the characteristics of another one.
   * @param {Image} other
   * @param {object} [options] - Override options to change some parameters
   * @return {Image}
   * @example
   * const newImage = Image.createFrom(image, { width: 100 });
   */
  static createFrom(other, options) {
    const newOptions = getImageParameters(other);
    Object.assign(
      newOptions,
      {
        parent: other,
        position: [0, 0]
      },
      options
    );
    return new Image(newOptions);
  }
  /**
   * Create a new manager for regions of interest based on the current image.
   * @param {object} [options]
   * @return {RoiManager}
   */
  getRoiManager(options) {
    return new RoiManager(this, options);
  }
  /**
   * Create a copy a the current image, including its data.
   * @instance
   * @return {Image}
   */
  clone() {
    const newData = this.data.slice();
    return new Image(this.width, this.height, newData, this);
  }
  apply(filter) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let index = (y * this.width + x) * this.channels;
        filter.call(this, index);
      }
    }
  }
}
setValueMethods(Image);
setBitMethods(Image);
setExportMethods(Image);
Image.prototype.checkProcessable = checkProcessable;
Image.prototype.getRGBAData = getRGBAData;
Image.load = load;
Image.extendMethod = extendMethod;
Image.extendProperty = extendProperty;
extend$1(Image);
var workerTemplate$1 = {};
var worker$1 = function() {
  self.window = self;
  function ManagedWorker() {
    this._listeners = {};
  }
  ManagedWorker.prototype.on = function(event, callback) {
    if (this._listeners[event])
      throw new RangeError("there is already a listener for " + event);
    if (typeof callback !== "function")
      throw new TypeError("callback argument must be a function");
    this._listeners[event] = callback;
  };
  ManagedWorker.prototype._send = function(id, data, transferable) {
    if (transferable === void 0) {
      transferable = [];
    } else if (!Array.isArray(transferable)) {
      transferable = [transferable];
    }
    self.postMessage({
      id,
      data
    }, transferable);
  };
  ManagedWorker.prototype._trigger = function(event, args) {
    if (!this._listeners[event])
      throw new Error("event " + event + " is not defined");
    this._listeners[event].apply(null, args);
  };
  var worker2 = new ManagedWorker();
  self.onmessage = function(event) {
    switch (event.data.action) {
      case "exec":
        event.data.args.unshift(function(data, transferable) {
          worker2._send(event.data.id, data, transferable);
        });
        worker2._trigger(event.data.event, event.data.args);
        break;
      case "ping":
        worker2._send(event.data.id, "pong");
        break;
      default:
        throw new Error("unexpected action: " + event.data.action);
    }
  };
};
var workerStr = worker$1.toString().split('"CODE";');
workerTemplate$1.newWorkerURL = function newWorkerURL(code, deps) {
  var blob = new Blob(["(", workerStr[0], "importScripts.apply(self, " + JSON.stringify(deps) + ");\n", "(", code, ")();", workerStr[1], ")();"], { type: "application/javascript" });
  return URL.createObjectURL(blob);
};
var workerTemplate = workerTemplate$1;
var CORES = navigator.hardwareConcurrency || 1;
function WorkerManager(func, options) {
  if (typeof func !== "string" && typeof func !== "function")
    throw new TypeError("func argument must be a function");
  if (options === void 0)
    options = {};
  if (typeof options !== "object" || options === null)
    throw new TypeError("options argument must be an object");
  this._workerCode = func.toString();
  if (options.maxWorkers === void 0 || options.maxWorkers === "auto") {
    this._numWorkers = Math.min(CORES - 1, 1);
  } else if (options.maxWorkers > 0) {
    this._numWorkers = Math.min(options.maxWorkers, CORES);
  } else {
    this._numWorkers = CORES;
  }
  this._workers = /* @__PURE__ */ new Map();
  this._timeout = options.timeout || 0;
  this._terminateOnError = !!options.terminateOnError;
  var deps = options.deps;
  if (typeof deps === "string")
    deps = [deps];
  if (!Array.isArray(deps))
    deps = void 0;
  this._id = 0;
  this._terminated = false;
  this._working = 0;
  this._waiting = [];
  this._init(deps);
}
WorkerManager.prototype._init = function(deps) {
  var workerURL = workerTemplate.newWorkerURL(this._workerCode, deps);
  for (var i2 = 0; i2 < this._numWorkers; i2++) {
    var worker2 = new Worker(workerURL);
    worker2.onmessage = this._onmessage.bind(this, worker2);
    worker2.onerror = this._onerror.bind(this, worker2);
    worker2.running = false;
    worker2.id = i2;
    this._workers.set(worker2, null);
  }
  URL.revokeObjectURL(workerURL);
};
WorkerManager.prototype._onerror = function(worker2, error) {
  if (this._terminated)
    return;
  this._working--;
  worker2.running = false;
  var callback = this._workers.get(worker2);
  if (callback) {
    callback[1](error.message);
  }
  this._workers.set(worker2, null);
  if (this._terminateOnError) {
    this.terminate();
  } else {
    this._exec();
  }
};
WorkerManager.prototype._onmessage = function(worker2, event) {
  if (this._terminated)
    return;
  this._working--;
  worker2.running = false;
  var callback = this._workers.get(worker2);
  if (callback) {
    callback[0](event.data.data);
  }
  this._workers.set(worker2, null);
  this._exec();
};
WorkerManager.prototype._exec = function() {
  for (var worker2 of this._workers.keys()) {
    if (this._working === this._numWorkers || this._waiting.length === 0) {
      return;
    }
    if (!worker2.running) {
      for (var i2 = 0; i2 < this._waiting.length; i2++) {
        var execInfo = this._waiting[i2];
        if (typeof execInfo[4] === "number" && execInfo[4] !== worker2.id) {
          continue;
        }
        this._waiting.splice(i2, 1);
        worker2.postMessage({
          action: "exec",
          event: execInfo[0],
          args: execInfo[1]
        }, execInfo[2]);
        worker2.running = true;
        worker2.time = Date.now();
        this._workers.set(worker2, execInfo[3]);
        this._working++;
        break;
      }
    }
  }
};
WorkerManager.prototype.terminate = function() {
  if (this._terminated) return;
  for (var entry of this._workers) {
    entry[0].terminate();
    if (entry[1]) {
      entry[1][1](new Error("Terminated"));
    }
  }
  this._workers.clear();
  this._waiting = [];
  this._working = 0;
  this._terminated = true;
};
WorkerManager.prototype.postAll = function(event, args) {
  if (this._terminated)
    throw new Error("Cannot post (terminated)");
  var promises = [];
  for (var worker2 of this._workers.keys()) {
    promises.push(this.post(event, args, [], worker2.id));
  }
  return Promise.all(promises);
};
WorkerManager.prototype.post = function(event, args, transferable, id) {
  if (args === void 0) args = [];
  if (transferable === void 0) transferable = [];
  if (!Array.isArray(args)) {
    args = [args];
  }
  if (!Array.isArray(transferable)) {
    transferable = [transferable];
  }
  var self2 = this;
  return new Promise(function(resolve2, reject2) {
    if (self2._terminated) throw new Error("Cannot post (terminated)");
    self2._waiting.push([event, args, transferable, [resolve2, reject2], id]);
    self2._exec();
  });
};
var src = WorkerManager;
const WorkerManager$1 = /* @__PURE__ */ getDefaultExportFromCjs(src);
const defaultOptions = {
  regression: {
    kernelType: "polynomial",
    kernelOptions: { degree: 2, constant: 1 }
  },
  threshold: 0.02,
  roi: {
    minSurface: 100,
    positive: false
  },
  sampling: 20,
  include: []
};
function run(image, options, onStep) {
  options = Object.assign({}, defaultOptions, options);
  const manager = this.manager;
  if (Array.isArray(image)) {
    return Promise.all(
      image.map(function(img) {
        const run2 = runOnce(manager, img, options);
        if (typeof onStep === "function") {
          run2.then(onStep);
        }
        return run2;
      })
    );
  } else {
    return runOnce(manager, image, options);
  }
}
function runOnce(manager, image, options) {
  return manager.post("data", [image, options]).then(function(response) {
    for (let i2 in response) {
      response[i2] = new Image(response[i2]);
    }
    return response;
  });
}
function work() {
  worker.on("data", function(send, image, options) {
    image = new IJS(image);
    const result = {};
    const toTransfer = [];
    const grey2 = image.grey();
    const sobel = grey2.sobelFilter();
    maybeInclude("sobel", sobel);
    const mask2 = sobel.level().mask({ threshold: options.threshold });
    maybeInclude("mask", mask2);
    const roiManager = sobel.getRoiManager();
    roiManager.fromMask(mask2);
    const realMask = roiManager.getMask(options.roi);
    maybeInclude("realMask", realMask);
    const pixels = grey2.getPixelsGrid({
      sampling: options.sampling,
      mask: realMask
    });
    const background2 = image.getBackground(
      pixels.xyS,
      pixels.zS,
      options.regression
    );
    maybeInclude("background", background2);
    const corrected = image.subtract(background2);
    result.result = corrected;
    toTransfer.push(corrected.data.buffer);
    send(result, toTransfer);
    function maybeInclude(name2, image2) {
      if (options.include.includes(name2)) {
        result[name2] = image2;
        toTransfer.push(image2.data.buffer);
      }
    }
  });
}
const background = { run, work };
function extend(Worker3) {
  Worker3.extendMethod("background", background);
}
let Worker$1 = class Worker2 {
  constructor() {
    this._url = null;
    this._deps = [null];
  }
  checkUrl() {
    if (this._url === null) {
      throw new Error("image worker must be initialized with an URL");
    }
  }
  get url() {
    return this._url;
  }
  set url(value) {
    if (typeof value !== "string") {
      throw new TypeError("worker URL must be a string");
    }
    this._url = value;
    this._deps[0] = value;
  }
  static extendMethod(name2, method) {
    let manager;
    let url;
    let runner = {};
    function run2(...args) {
      if (!manager) {
        this.checkUrl();
        url = this.url;
        manager = new WorkerManager$1(method.work, { deps: url });
        runner.manager = manager;
      }
      return method.run.call(runner, ...args);
    }
    run2.reset = function() {
      if (manager) {
        manager.terminate();
        manager = new WorkerManager$1(method.work, { deps: url });
        runner.manager = manager;
      }
    };
    Worker2.prototype[name2] = run2;
  }
};
extend(Worker$1);
const GroundCanvasToInnerHTML = (appState, ownDrain) => {
  ownDrain.innerHTML = "";
  if (appState.groundImage) {
    ownDrain.appendChild(appState.groundImage.getCanvas());
  }
};
function GroundImageLens(covals) {
  return {
    key: "groundImage",
    marks: ["coScope", "drop-canvas", "recoScope"],
    pik(bag) {
      return bag["groundImage"];
    },
    put(bag, groundImage, yuck) {
      if (!groundImage) {
        return { ...bag, groundImage };
      }
      const lumas = Uint8Array.from(groundImage.data);
      const cov = dctII2(lumas, bag.editorSize ?? 0);
      console.info("(GroundImageLens) Recomputed covals.");
      const bagPrime = covals.put({
        ...bag,
        groundImage
      }, cov, yuck);
      if (yuck) {
        yuck.markDirty(this.marks);
      }
      return bagPrime;
    }
  };
}
const SampleImageClicked = async (e) => {
  if (!e.target) {
    return { errorMessage: "Got a click, but it aint for nothin." };
  }
  let clicked = e.target;
  if (!(e.target instanceof HTMLImageElement)) {
    return { errorMessage: "Need an image to prepare." };
  }
  const _c = document.createElement("canvas");
  _c.width = clicked.naturalWidth;
  _c.height = clicked.naturalHeight;
  const _ctx = _c.getContext("2d");
  _ctx == null ? void 0 : _ctx.drawImage(clicked, 0, 0);
  const inputIm = Image.fromCanvas(_c);
  return { inputImage: inputIm };
};
function resizeAndGreyscale(image, editorSize) {
  try {
    const iwx = image.width;
    const iwy = image.height;
    if (iwx !== editorSize || iwy !== editorSize) {
      if (iwx !== iwy) {
        let short_edge = Math.min(iwx, iwy);
        image = image.crop({
          x: iwx / 2 - short_edge / 2,
          y: iwy / 2 - short_edge / 2,
          width: short_edge,
          height: short_edge
        });
      }
      image = image.resize({
        width: editorSize,
        height: editorSize
      });
    }
    return image.grey();
  } catch (e) {
    return e.message;
  }
}
function PostProcessable(vals, one) {
  return {
    one,
    pipe: (nextP, ...nextArgs) => {
      return nextP(vals.map(one), ...nextArgs);
    },
    [Symbol.iterator]: function* () {
      yield* vals.map(one);
    }
  };
}
function domain1toZ(vals) {
  let min2 = Math.min(...vals);
  let one = (x) => x + (1 - min2);
  return PostProcessable(vals, one);
}
function domain0toN(vals, n) {
  let min2 = Math.min(...vals);
  let max2 = Math.max(...vals);
  let one = (x) => {
    const res = max2 - min2 === 0 ? 0.5 : (x - min2) / (max2 - min2) * n;
    if (isNaN(res)) {
      console.warn("domain0toN", x);
    }
    return res;
  };
  return PostProcessable(vals, one);
}
function ordinalMap(vals) {
  const sorted = vals.slice().sort();
  const colors2 = Array(vals.length).fill(0).map((_, i2) => Math.floor(255 * i2 / vals.length));
  const bs = (term, start = 0, end = sorted.length - 1) => {
    if (start >= end) {
      return start;
    }
    const m = Math.floor((start + end) / 2);
    return sorted[m] < term ? bs(term, m + 1, end) : bs(term, start, m);
  };
  let one = (x) => {
    if (typeof colors2[bs(x)] === "undefined") {
      console.warn(" UhOH!", x, bs(x), colors2);
    }
    return colors2[bs(x)];
  };
  return PostProcessable(vals, one);
}
function sigmoidalContrastStretch(vals, cutoff, gain) {
  let one = (z) => {
    const res = 1 / (1 + Math.exp(-cutoff * z + gain));
    return res;
  };
  return PostProcessable(vals, one);
}
function normalizeOnAverageLuminance(vals, groundImage, editorSize) {
  const lumas = Array.from(groundImage.data);
  const min2 = Math.min(...lumas);
  const avg = lumas.reduce((acc, x) => acc + x, 0) / lumas.length;
  const power = avg;
  let one = (z) => {
    const zplus = z - min2;
    return (zplus - avg) / power / editorSize;
  };
  return PostProcessable(vals, one);
}
function linearCombination(vals, into, ratio = 0.5) {
  let intoer = into(vals);
  let one = (u) => {
    const a = intoer.one(u);
    return a * ratio + u * (1 - ratio);
  };
  return PostProcessable(vals, one);
}
function checksum(vals) {
  let parity = BigInt.asUintN(64, 0n);
  let f64vals = Float64Array.from(vals);
  let dv = new DataView(f64vals.buffer);
  for (let i2 = 0; i2 < f64vals.byteLength; i2 += 8) {
    let val = dv.getBigUint64(i2);
    parity = BigInt.asUintN(64, parity ^ val);
  }
  return parity;
}
const CHANNELS$1 = ["R", "G", "B", "A"].length;
function EditorSizeLens(inputImage, covals) {
  return {
    key: "editorSize",
    marks: ["drop-canvas", "recoScope", "coEditorContrastControls"],
    pik(bag) {
      return bag["editorSize"];
    },
    put(bag, editorSize, yuck) {
      let bagPrime;
      const nextCovals = new Array(editorSize * editorSize).fill(0);
      if (!bag.covals) {
        bagPrime = covals.put({
          ...bag,
          editorSize
        }, nextCovals);
        if (yuck) {
          yuck.markDirty(this.marks);
        }
        return bagPrime;
      }
      let oldEdge = Math.floor(Math.sqrt(bag.covals.length));
      let smallerEdge = Math.min(editorSize, oldEdge);
      for (let y = 0; y < smallerEdge; y++) {
        for (let x = 0; x < smallerEdge; x++) {
          nextCovals[y * editorSize + x] = bag.covals[y * oldEdge + x];
        }
      }
      if (bag.inputImage && editorSize !== bag.editorSize) {
        bagPrime = covals.put(
          inputImage.put({
            ...bag,
            editorSize
          }, bag.inputImage),
          nextCovals
        );
      } else {
        bagPrime = covals.put({
          ...bag,
          editorSize
        }, nextCovals);
      }
      if (yuck) {
        yuck.markDirty(this.marks);
      }
      return bagPrime;
    }
  };
}
function CovalLens(recovals) {
  return {
    key: "covals",
    marks: ["coScope", "recoScope", "coEditorContrastControls"],
    pik(bag) {
      return bag["covals"];
    },
    put(bag, covals, yuck) {
      const revals = inverseDctII2(covals, bag.editorSize ?? 0);
      console.info("Recomputed recovals.");
      let bagPrime = recovals.put({
        ...bag,
        covals
      }, revals, yuck);
      if (yuck) {
        yuck.markDirty(this.marks);
      }
      return bagPrime;
    }
  };
}
function CovalMouseDrawingLens(covals, lastDrawnXY) {
  return {
    key: "mouseDrawing",
    marks: ["coScope", "coEditorContrastControls"],
    pik(bag) {
      return bag["mouseDrawing"];
    },
    put(bag, mouseDrawing, yuck) {
      var _a2, _b2, _c;
      let bagPrime = { ...bag, mouseDrawing };
      const bye = () => {
        if (yuck) {
          yuck.markDirty(this.marks);
        }
        return bagPrime;
      };
      if (!bag.editorSize) {
        console.warn(`Missing editor size. Can't draw.`);
        return bye();
      }
      if (!bag.mouseXYV) {
        console.warn(`No mouse coordinates. Can't draw.`);
        return bye();
      }
      let [x, y] = bag.mouseXYV;
      let novelCoordinates = x !== ((_a2 = lastDrawnXY.pik(bag)) == null ? void 0 : _a2[0]) || y !== ((_b2 = lastDrawnXY.pik(bag)) == null ? void 0 : _b2[1]);
      if (!novelCoordinates) {
        console.info(`Coordinates ${bag.mouseXYV} not new from ${lastDrawnXY.pik(bag)}`);
        return bye();
      }
      let covalsPrime = (_c = covals.pik(bag)) == null ? void 0 : _c.slice();
      if (!covalsPrime) {
        console.warn(`No covals. Can't draw.`);
        return bye();
      }
      if (mouseDrawing) {
        let offset = y * bag.editorSize + x;
        if (!bag.coScopePaintValue) {
          console.warn(`CovalMouseDrawingLens | Drawing with no coScopePaintValue. Investigate.`);
        }
        covalsPrime[offset] = bag.coScopePaintValue ?? 30;
        bagPrime = lastDrawnXY.put(
          covals.put({
            ...bag,
            mouseDrawing
          }, covalsPrime),
          [x, y]
        );
      }
      return bye();
    }
  };
}
function CoScopeMouseLens(covals, lastDrawnXY) {
  return {
    key: "mouseXYV",
    marks: ["coEditorMouseX", "coEditorMouseY", "coEditorMouseV"],
    pik(dataBag) {
      if (!dataBag.mouseXYV) {
        console.warn(`CoScopeMouseLens | Application state is missing mouseXYV.`);
        return null;
      }
      return dataBag.mouseXYV;
    },
    put(bag, wat, yuck) {
      var _a2;
      let [x, y, v] = [wat[0], wat[1], wat[2] ?? null];
      const bye = (x2, y2, v2) => {
        const bagPrime2 = { ...bag, mouseXYV: [x2, y2, v2] };
        if (yuck) {
          yuck.markDirty(this.marks);
        }
        return bagPrime2;
      };
      if (!bag.editorSize) {
        return bye(x, y, v);
      }
      const offset = wat[1] * bag.editorSize + wat[0];
      let covalsPrime = (_a2 = covals.pik(bag)) == null ? void 0 : _a2.slice();
      if (!covalsPrime || covalsPrime.length <= offset) {
        return bye(x, y, v);
      }
      v || (v = covalsPrime[offset]);
      if (!bag.mouseDrawing) {
        return bye(x, y, v);
      }
      if (!bag.coScopePaintValue) {
        console.warn(`CoScopeMouseLens | Drawing with no coScopePaintValue. Investigate.`);
      }
      covalsPrime[offset] = bag.coScopePaintValue ?? 30;
      const bagPrime = lastDrawnXY.put(
        covals.put(
          bag,
          covalsPrime
        ),
        [x, y]
      );
      if (yuck) {
        yuck.markDirty(this.marks);
      }
      return { ...bagPrime, mouseXYV: [x, y, v] };
    }
  };
}
async function CoScopePeacedOut() {
  return { mouseDrawing: false };
}
async function CoScopeMouseDown() {
  return { mouseDrawing: true };
}
async function CoScopeMouseMoved(e) {
  const coCa = e.target;
  const rect = coCa.getBoundingClientRect();
  const small_left = e.clientX - rect.left;
  const small_top = e.clientY - rect.top;
  const x = Math.floor(small_left * (coCa.width / rect.width));
  const y = Math.floor(small_top * (coCa.height / rect.width));
  return { mouseXYV: [x, y] };
}
async function CoScopePaintValuePicked(e) {
  const target = e.target;
  if (!target || !(target instanceof HTMLInputElement)) {
    console.warn(`CoScopePaintValuePicked: event target is unknown: ${e}`);
    return {};
  }
  let pickedVal;
  try {
    pickedVal = parseFloat(target.value);
  } catch (err2) {
    console.error(`Bad input element value: '${target.value}'.`);
    return {};
  }
  return { coScopePaintValue: pickedVal };
}
async function CoScopeContrastPicked(e) {
  const target = e.target;
  if (!target || !(target instanceof HTMLInputElement)) {
    console.warn(`CoScopeContrastPicked: event target is unknown: ${e}`);
    return {};
  }
  let pickedVal;
  try {
    pickedVal = parseFloat(target.value);
  } catch (err2) {
    console.error(`Bad input element value: '${target.value}'.`);
    return {};
  }
  const assignment = {
    "contrast-knee-picker": "coScopeContrastKnee",
    "contrast-bump-picker": "coScopeContrastBump",
    "contrast-power-picker": "coScopeContrastPower"
  }[target.id];
  if (!assignment) {
    console.error(`Bag input element ID: '${target.id}'`);
    return {};
  }
  return { [assignment]: pickedVal };
}
async function CoScopeEditorSizeChosen(e) {
  const target = e.target;
  if (!target || !(target instanceof HTMLInputElement)) {
    console.warn(`CoScopeEditorSizeChosen: event target is unknown: ${e}`);
    return {};
  }
  let pickedVal;
  try {
    pickedVal = parseInt(target.value);
  } catch (err2) {
    console.error(`Bad input element value: '${target.value}'.`);
    return {};
  }
  return { editorSize: pickedVal };
}
function CoScopePaintValueMutator() {
  return async (appState, ownEl) => {
    var _a2, _b2;
    const pvi = ownEl.querySelector("input#paint-value-picker");
    pvi.value = ((_a2 = appState.coScopePaintValue) == null ? void 0 : _a2.toFixed(1)) ?? "";
    const pvo = ownEl.querySelector("output[for=paint-value-picker]");
    if (pvo) {
      pvo.innerHTML = ((_b2 = appState.coScopePaintValue) == null ? void 0 : _b2.toFixed(1)) ?? "";
    }
  };
}
function CoScopeEditorSizeMutator() {
  return async (appState, ownEl) => {
    var _a2;
    const pvi = ownEl.querySelector("input#editor-size-picker");
    pvi.value = ((_a2 = appState.editorSize) == null ? void 0 : _a2.toFixed(0)) ?? "";
  };
}
function CoScopeContrastMutator() {
  return async (appState, ownEl) => {
    var _a2, _b2, _c, _d, _e, _f;
    const labs = ownEl.querySelectorAll("label");
    for (let lab of labs) {
      if (!appState.covals || appState.covals.length <= 0) {
        lab.classList.add("dulled");
      } else {
        lab.classList.remove("dulled");
      }
    }
    const shouldDisableSliders = !((appState == null ? void 0 : appState.covals) && (appState == null ? void 0 : appState.covals.length) > 0);
    const inKnee = ownEl.querySelector("input#contrast-knee-picker");
    if (inKnee) {
      inKnee.value = ((_a2 = appState.coScopeContrastKnee) == null ? void 0 : _a2.toFixed(1)) ?? "";
      inKnee.disabled = shouldDisableSliders;
    }
    const knee = ownEl.querySelector("output[for=contrast-knee-picker]");
    if (knee) {
      knee.innerHTML = ((_b2 = appState.coScopeContrastKnee) == null ? void 0 : _b2.toFixed(1)) ?? "";
    }
    const inPower = ownEl.querySelector("input#contrast-power-picker");
    if (inPower) {
      inPower.value = ((_c = appState.coScopeContrastPower) == null ? void 0 : _c.toFixed(1)) ?? "";
      inPower.disabled = !((appState == null ? void 0 : appState.covals) && (appState == null ? void 0 : appState.covals.length) > 0);
    }
    const power = ownEl.querySelector("output[for=contrast-power-picker]");
    if (power) {
      power.innerHTML = ((_d = appState.coScopeContrastPower) == null ? void 0 : _d.toFixed(1)) ?? "";
    }
    const inBump = ownEl.querySelector("input#contrast-bump-picker");
    if (inBump) {
      inBump.value = ((_e = appState.coScopeContrastBump) == null ? void 0 : _e.toFixed(1)) ?? "";
      inBump.disabled = !((appState == null ? void 0 : appState.covals) && (appState == null ? void 0 : appState.covals.length) > 0);
    }
    const bump = ownEl.querySelector("output[for=contrast-bump-picker]");
    if (bump) {
      bump.innerHTML = ((_f = appState.coScopeContrastBump) == null ? void 0 : _f.toFixed(1)) ?? "";
    }
  };
}
const CoScopeCanvasMutator = () => {
  let _lastDataChecksum = 0n;
  let _lastContrastKnee = null;
  let _lastContrastPower = null;
  let _lastContrastBump = null;
  return (appState, ownDrain) => {
    const _dbi = `CoScopeCanvasMutator`;
    let vals = appState["covals"];
    if (!vals) {
      console.error(`${_dbi} | Values are missing from appState.`);
      return;
    }
    let lck = _lastContrastKnee, lcp = _lastContrastPower, lcb = _lastContrastBump, chk = _lastDataChecksum;
    if (_lastContrastKnee === (lck = appState.coScopeContrastKnee ?? null) && _lastContrastPower === (lcp = appState.coScopeContrastPower ?? null) && _lastContrastBump === (lcp = appState.coScopeContrastBump ?? null) && _lastDataChecksum === (chk = checksum(vals))) {
      return;
    }
    _lastContrastKnee = lck;
    _lastContrastPower = lcp;
    _lastContrastBump = lcb;
    _lastDataChecksum = chk;
    let _canvas = ownDrain.querySelector("canvas");
    if (!_canvas) {
      console.error(`${_dbi} | No canvas to slap data into.`);
      return;
    }
    _canvas.width = appState.editorSize;
    _canvas.height = appState.editorSize;
    let _ctx = _canvas.getContext("2d");
    if (!_ctx) {
      console.error(`${_dbi} | Failed to acquire a canvas context.`);
      return;
    }
    _ctx.mozImageSmoothingEnabled = false;
    _ctx.imageSmoothingEnabled = false;
    const outData = new Uint8ClampedArray(vals.length * CHANNELS$1);
    let rescaled = null;
    if (appState.coScopeContrastKnee && appState.groundImage && appState.editorSize) {
      rescaled = normalizeOnAverageLuminance(vals, appState.groundImage, appState.editorSize).pipe(domain0toN, 1).pipe(sigmoidalContrastStretch, appState.coScopeContrastKnee, appState.coScopeContrastPower).pipe(domain0toN, 255).pipe(linearCombination, ordinalMap, appState.coScopeContrastBump);
    } else {
      rescaled = domain1toZ(vals.slice()).pipe(domain0toN, 1).pipe(sigmoidalContrastStretch, 3, 3).pipe(domain0toN, 255);
    }
    const iv = rescaled ? [...rescaled] : vals;
    iv.forEach((x, i2) => {
      outData[CHANNELS$1 * i2] = x;
      outData[CHANNELS$1 * i2 + 1] = x;
      outData[CHANNELS$1 * i2 + 2] = x;
      outData[CHANNELS$1 * i2 + 3] = 255;
    });
    const imData = new ImageData(outData, appState.editorSize ?? 0, appState.editorSize ?? 0);
    _ctx.putImageData(imData, 0, 0);
  };
};
const CHANNELS = ["R", "G", "B", "A"].length;
const RecoScopeCanvasMutator = () => {
  let _lastDataChecksum = 0n;
  let _lastContrastKnee = null;
  let _lastContrastPower = null;
  let _lastContrastBump = null;
  return (appState, ownDrain) => {
    const _dbi = `RecoScopeCanvasMutator()`;
    let vals = appState["recovals"];
    if (!vals) {
      console.error(`${_dbi} | Values are missing from appState.`);
      return;
    }
    let lck = _lastContrastKnee, lcp = _lastContrastPower, lcb = _lastContrastBump, chk = _lastDataChecksum;
    if (_lastContrastKnee === (lck = appState.coScopeContrastKnee ?? null) && _lastContrastPower === (lcp = appState.coScopeContrastPower ?? null) && _lastContrastBump === (lcp = appState.coScopeContrastBump ?? null) && _lastDataChecksum === (chk = checksum(vals))) {
      return;
    }
    _lastContrastKnee = lck;
    _lastContrastPower = lcp;
    _lastContrastBump = lcb;
    _lastDataChecksum = chk;
    let _canvas = ownDrain.querySelector("canvas");
    if (!_canvas) {
      console.error(`${_dbi} | No canvas to slap data into.`);
      return;
    }
    _canvas.width = appState.editorSize;
    _canvas.height = appState.editorSize;
    let _ctx = _canvas.getContext("2d");
    if (!_ctx) {
      console.error(`${_dbi} | Failed to acquire a canvas context.`);
      return;
    }
    _ctx.mozImageSmoothingEnabled = false;
    _ctx.imageSmoothingEnabled = false;
    const outData = new Uint8ClampedArray(vals.length * CHANNELS);
    let rescaled = domain1toZ(vals.slice()).pipe(domain0toN, 1).pipe(sigmoidalContrastStretch, 3, 3).pipe(domain0toN, 255);
    const iv = rescaled ? [...rescaled] : vals;
    iv.forEach((x, i2) => {
      outData[CHANNELS * i2] = x;
      outData[CHANNELS * i2 + 1] = x;
      outData[CHANNELS * i2 + 2] = x;
      outData[CHANNELS * i2 + 3] = 255;
    });
    const imData = new ImageData(outData, appState.editorSize ?? 0, appState.editorSize ?? 0);
    _ctx.putImageData(imData, 0, 0);
  };
};
const DEFAULT_EDITOR_SIZE = 64;
const CanvasResetRequested = ({ editorSize }) => {
  return {
    editorSize,
    covals: Array(editorSize * editorSize).fill(0)
  };
};
const actions = {
  resetCanvas: CanvasResetRequested,
  sampleChoice: SampleImageClicked,
  coScopeMove: CoScopeMouseMoved,
  coScopeDown: CoScopeMouseDown,
  coScopePeace: CoScopePeacedOut,
  contrastPicker: CoScopeContrastPicked,
  editorSizeChoice: CoScopeEditorSizeChosen,
  paintValuePicker: CoScopePaintValuePicked
};
customElements.define("psp-host", PSPHost);
document.addEventListener("DOMContentLoaded", () => {
  const pspHost = document.querySelector("psp-host");
  if (!pspHost) {
    console.error("No PSP host!");
    return;
  }
  let sewerModel = GrowPSPModel({}, {}, {});
  sewerModel = sewerModel.attachLens("errorMessage", FlatLens("errorMessage"));
  let rcl = RecovalLens();
  let cl = CovalLens(rcl);
  let ccl = FlatLens("coScopeContrastKnee", []);
  sewerModel = sewerModel.attachLens("coScopeContrastKnee", ccl, 0.5);
  let ccpl = FlatLens("coScopeContrastPower", []);
  sewerModel = sewerModel.attachLens("coScopeContrastPower", ccpl, 5);
  let ccbl = FlatLens("coScopeContrastBump", []);
  sewerModel = sewerModel.attachLens("coScopeContrastBump", ccbl, 0);
  sewerModel = sewerModel.attachLens("covals", cl, []);
  let ldxyl = FlatLens("lastDrawnXY", []);
  sewerModel = sewerModel.attachLens("lastDrawnXY", ldxyl, [-1, -1]);
  let cidl = CovalMouseDrawingLens(cl, ldxyl);
  sewerModel = sewerModel.attachLens("mouseDrawing", cidl, false);
  sewerModel = sewerModel.attachLens("mouseXYV", CoScopeMouseLens(cl, ldxyl), [0, 0]);
  sewerModel = sewerModel.attachLens("recovals", rcl, []);
  let gil = GroundImageLens(cl);
  let iil = InputImageLens(gil);
  sewerModel = sewerModel.attachLens("groundImage", gil, null);
  sewerModel = sewerModel.attachLens("inputImage", iil, null);
  sewerModel = sewerModel.attachLens("editorSize", EditorSizeLens(iil, cl), DEFAULT_EDITOR_SIZE);
  sewerModel = sewerModel.attachLens("coScopePaintValue", FlatLens("coScopePaintValue", ["coEditorPaintValuePicker"]), 30);
  sewerModel = sewerModel.mapSewers({
    "drop-canvas": {
      drainId: "drop-canvas-drain",
      buildDrainElement: DivDrain,
      mutator: GroundCanvasToInnerHTML
    },
    "coScope": {
      drainId: "cosine-scope-drain",
      buildDrainElement: DivDrain,
      mutator: CoScopeCanvasMutator()
    },
    "recoScope": {
      drainId: "reconstruction-scope-drain",
      buildDrainElement: DivDrain,
      mutator: RecoScopeCanvasMutator()
    },
    "coEditorMouseX": {
      drainId: "mouse-x-drain",
      buildDrainElement: DivDrain,
      mutator: (appState, ownEl) => {
        var _a2, _b2;
        ownEl.innerHTML = ((_b2 = (_a2 = appState.mouseXYV) == null ? void 0 : _a2[0]) == null ? void 0 : _b2.toString()) ?? "0";
      }
    },
    "coEditorMouseY": {
      drainId: "mouse-y-drain",
      buildDrainElement: DivDrain,
      mutator: (appState, ownEl) => {
        var _a2, _b2;
        ownEl.innerHTML = ((_b2 = (_a2 = appState.mouseXYV) == null ? void 0 : _a2[1]) == null ? void 0 : _b2.toString()) ?? "0";
      }
    },
    "coEditorMouseV": {
      drainId: "mouse-v-drain",
      buildDrainElement: DivDrain,
      mutator: (appState, ownEl) => {
        var _a2, _b2;
        ownEl.innerHTML = ((_b2 = (_a2 = appState.mouseXYV) == null ? void 0 : _a2[2]) == null ? void 0 : _b2.toString()) ?? "ø";
      }
    },
    "coEditorContrastControls": {
      drainId: "cosine-contrast-control-drain",
      buildDrainElement: DivDrain,
      mutator: CoScopeContrastMutator()
    },
    "coEditorPaintValuePicker": {
      drainId: "cosine-editor-paint-value-drain",
      buildDrainElement: DivDrain,
      mutator: CoScopePaintValueMutator()
    },
    "coEditorSizeControl": {
      drainId: "cosine-editor-size-control-drain",
      buildDrainElement: DivDrain,
      mutator: CoScopeEditorSizeMutator()
    }
  });
  const useActions = sewerModel.useModel();
  const dispatch = useActions(actions);
  pspHost.installDrains(sewerModel);
  dispatch({ type: "resetCanvas", payload: { editorSize: 64 } });
  window._act = (s, e) => {
    dispatch({ type: s, payload: e });
  };
});
function InputImageLens(groundImage) {
  return {
    key: "inputImage",
    marks: ["drop-canvas", "coScope, recoScope"],
    pik(bag) {
      return bag.inputImage;
    },
    put(bag, inputIm) {
      if (!inputIm) {
        return { ...bag, inputImage: null };
      }
      let im = resizeAndGreyscale(inputIm, bag.editorSize ?? DEFAULT_EDITOR_SIZE);
      if (typeof im === "string") {
        return {
          ...bag,
          inputImage: null,
          errorMessage: im
        };
      } else {
        return groundImage.put({
          ...bag,
          inputImage: inputIm
        }, im);
      }
    }
  };
}
function RecovalLens() {
  return {
    key: "recovals",
    marks: ["recoScope"],
    pik(bag) {
      return bag["covals"];
    },
    put(bag, recovals, yuck) {
      const bagPrime = { ...bag, recovals, markDirty: yuck };
      if (yuck) {
        yuck.markDirty(this.marks);
      }
      return bagPrime;
    }
  };
}
function dctII(nums) {
  let N = nums.length;
  let factor = Math.PI / N;
  let result = Array(N).fill(0);
  for (let k = 0; k < N; k++) {
    for (let n = 0; n < N; n++) {
      result[k] += (nums[n] - 128) * Math.cos(factor * k * (n + 0.5));
    }
    result[k] *= k == 0 ? Math.sqrt(1 / N) : Math.sqrt(2 / N);
  }
  return result.map((k) => Math.abs(k) < 1e-5 ? 0 : k);
}
function dctII2(bytes, edgeLength) {
  let outData = Array(bytes.length).fill(0);
  for (let i2 = 0; i2 < edgeLength; i2++) {
    let rowStart = i2 * edgeLength;
    let rowEnd = i2 * edgeLength + edgeLength;
    let rowData = Array.from(bytes.slice(rowStart, rowEnd));
    let dctr = dctII(rowData);
    for (let r = rowStart; r < rowEnd; r++) {
      outData[r] = dctr[r - rowStart];
    }
  }
  for (let j = 0; j < edgeLength; j++) {
    let colData = outData.filter((_, ci) => ci % edgeLength == j);
    let dctc = dctII(colData);
    dctc.forEach((val, rowIdx) => {
      outData[rowIdx * edgeLength + j] = val;
    });
  }
  return outData;
}
function inverseDctII2(vector, edgeLength) {
  let outData = [];
  for (let i2 = 0; i2 < edgeLength; i2++) {
    let rowData = vector.slice(i2 * edgeLength, i2 * edgeLength + edgeLength);
    outData = outData.concat(inverseDctIIv3(rowData));
  }
  for (let j = 0; j < edgeLength; j++) {
    let colData = outData.filter((_, ci) => ci % edgeLength == j);
    let colInverse = inverseDctIIv3(colData);
    colInverse.forEach((val, rowIdx) => {
      outData[rowIdx * edgeLength + j] = val;
    });
  }
  return outData;
}
function inverseDctIIv3(vector) {
  let N = vector.length;
  let factor = Math.PI / N;
  let result = Array(N).fill(0);
  for (let k = 0; k < N; k++) {
    result[k] = vector[0] / Math.sqrt(N);
    for (let n = 1; n < N; n++) {
      result[k] += vector[n] * Math.cos(factor * n * (k + 0.5));
    }
    result[k] *= Math.sqrt(2 / N);
  }
  return result;
}
