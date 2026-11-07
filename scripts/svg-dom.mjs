// 在 Node 裡代替瀏覽器的 SVG DOM：紙雕畫法只用到 createElementNS、setAttribute、append 與濾鏡的 innerHTML，
// 這裡照樣組出整棵樹再寫成標記。build-cabin-boards.mjs 用它產生要交給瀏覽器的畫稿，tests/smoke.mjs 用它檢查圖片是否過期。
const NS = 'http://www.w3.org/2000/svg';
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');

class SvgNode {
  constructor(name) { this.name = name; this.attributes = new Map(); this.children = []; this.markup = ''; }
  setAttribute(key, value) { this.attributes.set(key, String(value)); }
  getAttribute(key) { return this.attributes.get(key) ?? null; }
  append(...nodes) { this.children.push(...nodes); }
  set innerHTML(markup) { this.children = []; this.markup = markup; }
  serialize(root) {
    const attributes = [...(root ? [['xmlns', NS]] : []), ...this.attributes].map(([key, value]) => ` ${key}="${escape(value)}"`).join('');
    const inner = this.markup + this.children.map(child => child.serialize(false)).join('');
    return inner ? `<${this.name}${attributes}>${inner}</${this.name}>` : `<${this.name}${attributes}/>`;
  }
}

// 只在 fn 執行期間掛上替身，結束後還原，同一個行程裡的其他測試不受影響。
export async function withSvgDom(fn) {
  const saved = { document: globalThis.document, XMLSerializer: globalThis.XMLSerializer };
  globalThis.document = { createElementNS: (namespace, name) => new SvgNode(name) };
  globalThis.XMLSerializer = class { serializeToString(node) { return node.serialize(true); } };
  try { return await fn(); }
  finally { for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; } }
}
