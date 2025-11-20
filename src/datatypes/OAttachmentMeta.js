export default class OAttachmentMeta {
  #cid;
  #name;
  #type;

  getCid() { return this.#cid; }

  setCid(cid) { this.#cid = cid; }
  setName(name) { this.#name = name; }
  setType(type) { this.#type = type; }

  ltsToJsonData() {
    return {cid : this.#cid, name : this.#name, type : this.#type};
  }
};
