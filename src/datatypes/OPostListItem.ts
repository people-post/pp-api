export default class OPostListItem {
  static T_TYPE = {ARTICLE : 'ARTICLE', IDX: '_IDX'} as const;

  #type: string | null = null;
  #cid: string | null = null;

  getCid(): string | null { return this.#cid; }

  setType(t: string): void { this.#type = t; }
  setCid(cid: string): void { this.#cid = cid; }

  ltsToJsonData(): {
    type: string | null;
    cid: string | null;
    timestamp: number;
  } {
    return {type : this.#type, cid : this.#cid, timestamp : Date.now()};
  }
}
