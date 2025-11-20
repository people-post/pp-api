export default class OPostListItem {
  static T_TYPE = {ARTICLE : 'ARTICLE', IDX: '_IDX'};

  #type;
  #cid;

  setType(t) { this.#type = t; }
  setCid(cid) { this.#cid = cid; }

  ltsToJsonData() {
    return {type : this.#type, cid : this.#cid, timestamp : Date.now()};
  }
};
