import Play from './Play.js';

const $ = selector => document.querySelector(selector);
const params = new URLSearchParams(location.search);
const status = $('#status');
const fps = $('#fps');
const romInput = $('#rom');
const canvas = $('#outputCanvas');
const CHUNK_SIZE = 1024 * 1024;
const MAX_CACHED_CHUNKS = 8;

function showStatus(message) {
  status.textContent = message;
}

function monitorFps(module) {
  if (typeof module.getFrames !== 'function' || typeof module.clearStats !== 'function') {
    fps.textContent = 'FPS unavailable';
    console.error('Play! runtime does not expose its FPS counters.');
    return;
  }
  module.clearStats();
  setInterval(() => {
    fps.textContent = `FPS: ${module.getFrames()}`;
    module.clearStats();
  }, 1000);
}

class DiscImageDevice {
  constructor(module) {
    this.module = module;
    this.doneFlag = false;
    this.file = null;
    this.readError = null;
  }

  read(dstPtr, offset, size) {
    if (!this.file) throw new Error('No disc image is selected.');
    this.doneFlag = false;
    this.readError = null;
    this.file.slice(offset, offset + size).arrayBuffer()
      .then(value => {
        this.module.HEAPU8.set(new Uint8Array(value), dstPtr);
        this.doneFlag = true;
      })
      .catch(error => {
        this.readError = error;
        showStatus(`Disc image read failed: ${error.message}`);
      });
  }

  getFileSize() {
    if (!this.file) throw new Error('No disc image is selected.');
    return this.file.size;
  }

  isDone() {
    if (this.readError) throw this.readError;
    return this.doneFlag;
  }

  setFile(file) {
    this.file = file;
  }
}

class RangeDiscFile {
  constructor(url, name, size) {
    this.url = url;
    this.name = name;
    this.size = size;
    this.chunks = new Map();
  }

  slice(start, end) {
    const byteStart = Math.max(0, Math.min(this.size, Math.floor(start)));
    const byteEnd = Math.max(byteStart, Math.min(this.size, Math.floor(end)));
    return { arrayBuffer: () => this.readRange(byteStart, byteEnd) };
  }

  async readRange(start, end) {
    const result = new Uint8Array(end - start);
    let written = 0;
    for (let index = Math.floor(start / CHUNK_SIZE); index < Math.ceil(end / CHUNK_SIZE); index++) {
      const chunk = await this.getChunk(index);
      const chunkStart = index * CHUNK_SIZE;
      const from = Math.max(start, chunkStart) - chunkStart;
      const to = Math.min(end, chunkStart + chunk.byteLength) - chunkStart;
      result.set(chunk.subarray(from, to), written);
      written += to - from;
    }
    if (written !== result.byteLength) throw new Error('The disc image server returned an incomplete byte range.');
    return result.buffer;
  }

  async getChunk(index) {
    const cached = this.chunks.get(index);
    if (cached) {
      this.chunks.delete(index);
      this.chunks.set(index, cached);
      return cached;
    }

    const start = index * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, this.size) - 1;
    const pending = this.fetchChunk(start, end).catch(error => {
      if (this.chunks.get(index) === pending) this.chunks.delete(index);
      throw error;
    });
    this.chunks.set(index, pending);
    while (this.chunks.size > MAX_CACHED_CHUNKS) {
      this.chunks.delete(this.chunks.keys().next().value);
    }
    return pending;
  }

  async fetchChunk(start, end) {
    const response = await fetch(this.url, { headers: { Range: `bytes=${start}-${end}` } });
    const contentRange = response.headers.get('Content-Range') || '';
    const expectedRange = `bytes ${start}-${end}/${this.size}`;
    if (response.status !== 206 || (contentRange && contentRange !== expectedRange)) {
      throw new Error('The game host must support HTTP byte-range requests to stream this ISO.');
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength !== end - start + 1) throw new Error('The game host returned a truncated ISO range.');
    return bytes;
  }
}

async function initialize() {
  if (!crossOriginIsolated || typeof SharedArrayBuffer === 'undefined') {
    throw new Error('This browser or host could not enable the cross-origin isolation Play! needs. Use a secure browser that supports service workers.');
  }
  const baseURL = new URL('./', import.meta.url);
  const playModule = await Play({
    locateFile: path => new URL(path, baseURL).href,
    mainScriptUrlOrBlob: new URL('Play.js', baseURL).href,
  });
  playModule.FS.mkdir('/work');
  playModule.discImageDevice = new DiscImageDevice(playModule);
  playModule.ccall('initVm', '', [], []);
  monitorFps(playModule);
  showStatus('Ready. Choose a PS2 game file.');
  return playModule;
}

const modulePromise = initialize().catch(error => {
  showStatus(error.message);
  console.error('Play! initialization failed:', error);
  return null;
});

async function bootFile(file) {
  const playModule = await modulePromise;
  if (!playModule) return;
  try {
    playModule.discImageDevice.setFile(file);
    playModule.bootDiscImage(file.name);
    showStatus(`Game launched: ${file.name}.`);
    canvas.focus();
  } catch (error) {
    showStatus(`Could not start ${file.name}: ${error.message}`);
    console.error('Play! disc boot failed:', error);
  }
}

async function bootCatalogGame(url, title) {
  const response = await fetch(url, { method: 'HEAD' });
  if (!response.ok) throw new Error(`Game file request failed (${response.status}).`);
  const size = Number(response.headers.get('Content-Length'));
  if (!Number.isSafeInteger(size) || size <= 0) throw new Error('The game host did not report a valid file size.');
  const rangeProbe = await fetch(url, { headers: { Range: 'bytes=0-0' } });
  if (rangeProbe.status !== 206 || (await rangeProbe.arrayBuffer()).byteLength !== 1) {
    throw new Error('The game host must support HTTP byte-range requests to stream this ISO.');
  }

  const pathName = decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
  const file = new RangeDiscFile(url, pathName || title || 'game.iso', size);
  showStatus(`Loading ${title || file.name}…`);
  await bootFile(file);
}

romInput.addEventListener('change', event => {
  const file = event.target.files && event.target.files[0];
  if (file) void bootFile(file);
});

window.addEventListener('message', event => {
  if (event.source !== parent || event.origin !== location.origin ||
      !event.data || event.data.type !== 'ps2-file') return;
  const file = event.data.file;
  if (file && typeof file.slice === 'function' && typeof file.name === 'string') {
    void bootFile(file);
  }
});

const gameUrl = params.get('game');
if (gameUrl) {
  void bootCatalogGame(gameUrl, params.get('name')).catch(error => {
    showStatus(`Could not load ${params.get('name') || 'the selected game'}: ${error.message}`);
    console.error('Play! game file request failed:', error);
  });
}
