export default class OAttachmentMeta {
  #cid: string | null = null;
  #name: string | null = null;
  #type: string | null = null;

  getCid(): string | null { return this.#cid; }

  setCid(cid: string): void { this.#cid = cid; }
  setName(name: string): void { this.#name = name; }
  setType(type: string): void { this.#type = type; }

  ltsToJsonData(): {
    cid: string | null;
    name: string | null;
    type: string | null;
  } {
    return {cid : this.#cid, name : this.#name, type : this.#type};
  }
}
