import {sys} from './Global.js';

export default class User {
  #data;
  #dPosts;
  #dIdols;
  #dMarks;
  #iconUrl;
  _dataSource;
  _delegate;

  constructor(data) { this.#data = data; }

  isFeed() { return false; }
  hasIdol(userId) {
    if (this.#dIdols) {
      return this.#dIdols.idols.some(i => i.id == userId);
    } else {
      this._asGetOrInitIdolRoot().then(d => this.#onIdolsLoaded());
      return false;
    }
  }

  getId() { return this._getData("uuid"); }
  getUsername() { return this.getId(); }
  getProfile() { return this._getDataOrDefault("profile", {}); }
  getNickname() { return this._getDataOrDefault("profile", {}).nickname; }
  getIconUrl() {
    if (this.#iconUrl) {
      return this.#iconUrl;
    } else {
      let cid = this._getDataOrDefault("profile", {}).icon_cid;
      if (cid) {
        this.#asFetchIconImage(cid).then(() => this.#onProfileLoaded());
        return null;
      } else {
        this.#iconUrl = "";
        return this.#iconUrl;
      }
    }
  }
  getLogoUrl() { return this.getIconUrl(); }
  getInfoImageUrl() { return null; }
  getDomainUrl() { return "N/A"; }
  getBackgroundColor() { return null; }
  getColorTheme() { return null; }
  getNIdols() {
    if (this.#dIdols) {
      return this.#dIdols.idols.length;
    } else {
      this._asGetOrInitIdolRoot().then(d => this.#onIdolsLoaded());
      return 0;
    }
  }
  getNFollowers() { return 0; }
  getBriefBio() { return ""; }

  setDataSource(dataSource) { this._dataSource = dataSource; }
  setDelegate(delegate) { this._delegate = delegate; }

  reset(data) { this._reset(data); }

  async asyncGetIdolIds() {
    let d = await this._asGetOrInitIdolRoot();
    return d.idols.map(i => i.id);
  }

  async asyncFindMark(key) {
    if (!key) {
      return null;
    }

    let d = await this._asGetOrInitMarkRoot();
    return await this.#asFindMark("", key, d.marks);
  }

  async asyncLoadMorePostInfos(idRecord) {
    console.debug("Loading more posts");
    let dPosts = await this._asGetOrInitPostRoot();

    let segId = idRecord.getNextSegmentId();
    // TODO: Handle folded files
    if (segId > 0) {
      console.debug("No more");
      return Promise.resolve();
    } else {
      console.debug("Loaded:", dPosts.posts.length);
      return dPosts.posts;
    }
  }

  _hasData() { return !!this.#data; }
  _getData(name) { return this.#data ? this.#data[name] : null; }

  _getDataOrDefault(name, vDefault) {
    let d = this._getData(name);
    return d ? d : vDefault;
  }

  _reset(data) {
    this.#data = data;
    this.#dPosts = null;
    this.#dMarks = null;
    this.#iconUrl = null;
  }

  async _asGetOrInitIdolRoot() {
    if (!this.#dIdols) {
      let cid = this._getData("idols");
      if (sys.utl.isCid(cid)) {
        this.#dIdols = await sys.ipfs.asFetchCidJson(cid);
      } else {
        this.#dIdols = {idols : []};
      }
    }
    return this.#dIdols;
  }

  async _asGetOrInitPostRoot() {
    if (!this.#dPosts) {
      let cid = this._getData("posts");
      if (sys.utl.isCid(cid)) {
        try {
          this.#dPosts = await sys.ipfs.asFetchCidJson(cid);
        } catch (e) {
          // TODO: Data not found, need let user know
          this.#dPosts = {posts : []};
        }
      } else {
        this.#dPosts = {posts : []};
      }
    }
    return this.#dPosts;
  }

  async _asGetOrInitMarkRoot() {
    if (!this.#dMarks) {
      let cid = this._getData("marks");
      if (sys.utl.isCid(cid)) {
        this.#dMarks = await sys.ipfs.asFetchCidJson(cid);

      } else {
        this.#dMarks = {marks : {}};
      }
    }
    return this.#dMarks;
  }

  _setData(name, value) { this.#data[name] = value; }

  #onIdolsLoaded() {
    if (this._delegate) {
      this._delegate.onWeb3UserIdolsLoaded(this);
    }
  }

  #onProfileLoaded() {
    if (this._delegate) {
      this._delegate.onWeb3UserProfileLoaded(this);
    }
  }

  async #asFindMark(prefix, suffix, dMarks) {
    if (!dMarks) {
      return null;
    }

    let key = prefix + suffix;

    // Try direct child
    if (key in dMarks) {
      return dMarks[key];
    }

    // Try sub map
    if (suffix.length > 2) {
      key = suffix.slice(0, 2);
      if (key in dMarks) {
        let cid = dMarks[key];
        let d = await sys.ipfs.asFetchCidJson(cid);
        return await this.#asFindMark(prefix + key, suffix.slice(2), d.marks);
      }
    }
    return null;
  }

  async #asFetchIconImage(cid) {
    this.#iconUrl = await sys.ipfs.asFetchCidImage(cid);
  }
};
