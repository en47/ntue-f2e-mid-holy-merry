import fs from 'node:fs/promises';
import vm from 'node:vm';
import * as THREE from '../../vendor/three/build/three.module.js';

export async function elfTestModules(extra = {}) {
  const context = vm.createContext({ URL, console, TextDecoder, TextEncoder, ArrayBuffer, ...extra });
  const three = new vm.SyntheticModule(Object.keys(THREE), function () {
    for (const [key, value] of Object.entries(THREE)) this.setExport(key, value);
  }, { context });
  const modules = new Map();
  async function load(relative) {
    const url = relative instanceof URL ? relative : new URL(relative, import.meta.url);
    if (modules.has(url.href)) return modules.get(url.href);
    const module = new vm.SourceTextModule(await fs.readFile(url, 'utf8'), {
      context, identifier: url.href, initializeImportMeta: meta => { meta.url = url.href; },
    });
    modules.set(url.href, module);
    await module.link((specifier, reference) => specifier === 'three' ? three : load(new URL(specifier, reference.identifier)));
    return module;
  }
  async function evaluate(relative) { const module = await load(relative); await module.evaluate(); return module.namespace; }
  async function model(file = 'wish-elf.glb') {
    const { GLTFLoader } = await evaluate('../../vendor/three/examples/jsm/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();
    loader.register(() => ({ name: 'TEST_TEXTURES', loadTexture: () => Promise.resolve(new THREE.Texture()) }));
    const buffer = await fs.readFile(new URL(`../../assets/models/${file}`, import.meta.url));
    return loader.parseAsync(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), '');
  }
  return { evaluate, model, THREE };
}
