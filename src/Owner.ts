import OPostListItem from './datatypes/OPostListItem.js';
import User from './User.js';
import OArticle from './datatypes/OArticle.js';
import StorageAgent from './StorageAgent.js';
import PublisherAgent from './PublisherAgent.js';

interface OwnerData {
  uuid?: string;
  profile?: {
    nickname?: string;
    [key: string]: any;
  };
  idols?: string;
  posts?: string;
  marks?: string;
  edition?: number;
  _cid?: string;
  [key: string]: any;
}

interface PublishInfo {
  texts: string[];
}

export default class Owner extends User {
  // Note: This file is version sensitive, shall be backward compatible
  static readonly #VERSION = '1.0' as const;

  #aPublishers: PublisherAgent[] = [];
  #aStorage: StorageAgent | null = null;

  hasPublished(): boolean { return this._getDataOrDefault("edition", 0) > 0; }

  // TODO: Clearly define isAuthenticated
  isAuthenticated(): boolean { return this._hasData(); }
  isWebOwner(): boolean { return this.isAuthenticated(); }
  isFollowing(userId: string): boolean { return this.hasIdol(userId); }
  isIdolOf(user: User): boolean { return user.hasIdol(this.getId() ?? ''); }

  getId(): string | null { return this._getData("uuid"); }
  getNickname(): string | undefined { return this._getDataOrDefault("profile", {}).nickname; }
  getUserNickname(userId: string, _defaultName?: string): string { return userId; }
  getPreferredLanguage(): string | null { return null; }

  getPublicKey(): Uint8Array {
    if (!this._dataSource?.onWeb3OwnerRequestGetPublicKey) {
      throw new Error('DataSource.onWeb3OwnerRequestGetPublicKey not implemented');
    }
    return this._dataSource.onWeb3OwnerRequestGetPublicKey(this);
  }

  setStorage(agent: StorageAgent): void { this.#aStorage = agent; }
  setPublishers(agents: PublisherAgent[]): void { this.#aPublishers = agents; }

  asyncFollow(userId: string): void {
    this.#asFollow(userId).then(() => this.#onProfileUpdated());
  }

  asyncUnfollow(userId: string): void {
    this.#asUnfollow(userId).then(() => this.#onProfileUpdated());
  }

  asyncReload(): void {}

  reset(data: OwnerData | null): void {
    super.reset(data);
    this.#onProfileUpdated();
  }

  loadCheckPoint(): void {
    if (!this._dataSource?.onWeb3OwnerRequestLoadCheckPoint) {
      return;
    }
    let s = this._dataSource.onWeb3OwnerRequestLoadCheckPoint(this);
    this._reset(s ? JSON.parse(s) : null);
  }

  saveCheckPoint(): void {
    if (!this._delegate?.onWeb3OwnerRequestSaveCheckPoint) {
      return;
    }
    this._delegate.onWeb3OwnerRequestSaveCheckPoint(
        this, JSON.stringify(this.#toLtsJsonData()));
  }

  async asRegister(agent: PublisherAgent, name: string): Promise<void> {
    // TODO: Support optional peer key
    const msg = JSON.stringify({id : this.getId(), name : name});
    const sig = await this.#asSign(msg);
    await agent.asPublish(msg, this.getId() ?? '', sig);
  }

  async asUploadFile(file: File): Promise<string> {
    if (!this.#aStorage) throw new Error('Storage agent not set');
    const token = await this.#aStorage.asGetUploadToken(this.getId() ?? '');
    const sig = await this.#asSign(token);

    // TODO: Find file storage server
    let d;
    if (file.type.startsWith("image")) {
      d = await this.#aStorage.asUploadImage(file, this.getId() ?? '', token, sig);
    } else {
      d = await this.#aStorage.asUploadFile(file, this.getId() ?? '', token, sig);
    }
    return d.cid;
  }

  async asUploadJson(data: any): Promise<string> {
    if (!this.#aStorage) throw new Error('Storage agent not set');
    // TODO: Find text storage server
    const msg = JSON.stringify(data);
    const sig = await this.#asSign(msg);
    return await this.#aStorage.asUploadJson(msg, this.getId() ?? '', sig);
  }

  async asLike(key: string): Promise<void> {
    let d = await this.asyncFindMark(key);
    if (!d) {
      d = {comments : []};
    }
    if (d.like) {
      // Already liked
      return;
    }
    d.like = true;
    let newCids = await this.#asAddMark(key, d);
    await this.#asPublish({texts : newCids});
  }

  async asUnlike(key: string): Promise<void> {
    let d = await this.asyncFindMark(key);
    if (!d) {
      // Already unliked
      return;
    }
    if (!d.like) {
      // Already unliked
      return;
    }
    d.like = false;
    let newCids = await this.#asAddMark(key, d);
    await this.#asPublish({texts : newCids});
  }

  async asComment(key: string, oArticle: OArticle, shouldMakePost: boolean): Promise<void> {
    let oItem = await this.#asUploadArticle(oArticle);

    // Add comment meta
    let dInfo = {type : "ARTICLE", cid : oItem.getCid()};

    let d = await this.asyncFindMark(key);
    if (!d) {
      d = {comments : []};
    }
    if (!d.comments) {
      d.comments = [];
    }
    d.comments.unshift(dInfo);

    let newMarkCids = await this.#asAddMark(key, d);
    let newPostCids = shouldMakePost ? await this.#asAddPostMeta(oItem) : [];

    const cid = oItem.getCid();
    if (!cid) throw new Error('Article CID is null');
    await this.#asPublish({texts : [ cid, ...newMarkCids, ...newPostCids ]});
  }

  async asUpdateProfile(d: any, newCids: string[]): Promise<void> {
    // TODO: newCids -> per type cidInfos
    this._setData("profile", d);
    await this.#asPublish({texts : newCids});
  }

  async asPublishArticle(oArticle: OArticle): Promise<void> {
    console.debug("Publishing article...");
    let oItem = await this.#asUploadArticle(oArticle);
    let pinIds = oArticle.getAllCids();
    const cid = oItem.getCid();
    if (!cid) throw new Error('Post list item CID is null');
    pinIds.push(cid);

    let newCids = await this.#asAddPostMeta(oItem);
    await this.#asPublish({texts : [...pinIds, ...newCids ]});
  }

  #onProfileUpdated(): void {
    if (this._delegate) {
      this._delegate.onWeb3OwnerProfileUpdated?.(this);
    }
  }

  async #asUploadArticle(oArticle: OArticle): Promise<OPostListItem> {
    let cid = await this.asUploadJson(oArticle.ltsToJsonData());
    let oItem = new OPostListItem();
    oItem.setType(OPostListItem.T_TYPE.ARTICLE);
    oItem.setCid(cid);
    return oItem;
  }

  async #asAddPostMeta(oPostListItem: OPostListItem): Promise<string[]> {
    let dItem = oPostListItem.ltsToJsonData();

    let newCids: string[] = [];

    let dIdx = await this._asGetOrInitPostRoot();
    dIdx.posts.unshift(dItem);

    let cid = this._getData("posts");

    // Fold if needed
    cid = await this.#asFoldPosts(dIdx.posts);
    if (cid) {
      newCids.push(cid);
    }

    // Upload master list file
    console.debug("Uploading post list...");
    cid = await this.asUploadJson(dIdx);
    this._setData("posts", cid);
    newCids.push(cid);
    return newCids;
  }

  async #asFoldPosts(dItems: any[]): Promise<string | null> {
    const n = 1024;
    if (dItems.length < n) {
      return null;
    }

    // Note: This is hardcode that depends on other places
    if (dItems[n - 1].type != OPostListItem.T_TYPE.ARTICLE) {
      return null;
    }

    // Assuming all elements before n are articles.
    let d = {items : dItems.splice(0, n)};
    // Add any additional articles.
    // Should not happen but just in case
    while (dItems.length && dItems[0].type == OPostListItem.T_TYPE.ARTICLE) {
      d.items.push(dItems.shift());
    }

    let cid = await this.asUploadJson(d);

    let item = new OPostListItem();
    item.setType(OPostListItem.T_TYPE.IDX);
    item.setCid(cid);
    dItems.unshift(item.ltsToJsonData());

    return cid;
  }

  async #asSign(msg: string): Promise<string> {
    if (!this._delegate?.asOnWeb3OwnerRequestSign) {
      throw new Error('Delegate.asOnWeb3OwnerRequestSign not implemented');
    }
    return await this._delegate.asOnWeb3OwnerRequestSign(this, msg);
  }

  #toLtsJsonData(): OwnerData {
    let d: OwnerData = {
      uuid : this.getId() ?? undefined,
      profile : this._getDataOrDefault("profile", {}),
      idols : this._getDataOrDefault("idols", null),
      posts : this._getDataOrDefault("posts", null),
      marks : this._getDataOrDefault("marks", null)
    };
    d.version = Owner.#VERSION;
    d.edition = this._getDataOrDefault("edition", 0);
    return d;
  }

  async #asFollow(userId: string): Promise<void> {
    let idolInfo =
        {timestamp : Date.now(), type : "USER", id : userId, nickname : null};
    let dIdx = await this._asGetOrInitIdolRoot();
    dIdx.idols.unshift(idolInfo);
    await this.#asUpdateIdols(dIdx);
  }

  async #asUnfollow(userId: string): Promise<void> {
    let dIdx = await this._asGetOrInitIdolRoot();
    dIdx.idols = dIdx.idols.filter(i => i.id != userId);
    await this.#asUpdateIdols(dIdx);
  }

  async #asAddMark(key: string, markInfo: any): Promise<string[]> {
    let dRoot = await this._asGetOrInitMarkRoot();

    // TODO: Consider "folding" cases
    dRoot.marks[key] = markInfo;

    let cid = this._getData("marks");

    cid = await this.asUploadJson(dRoot);
    this._setData("marks", cid);

    return [ cid ];
  }

  async #asUpdateIdols(dIdx: any): Promise<void> {
    let newCids: string[] = [];
    let cid = this._getData("idols");
    cid = await this.asUploadJson(dIdx);
    this._setData("idols", cid);
    newCids.push(cid);

    await this.#asPublish({texts : newCids});
  }

  async #asPublish(newCidInfo: PublishInfo): Promise<void> {
    try {
      await this.#asDoPublish(newCidInfo);
    } catch (e) {
      this.loadCheckPoint();
      throw e;
    }
  }

  async #asDoPublish(newCidInfo: PublishInfo): Promise<void> {
    if (!this.#aStorage) throw new Error('Storage agent not set');
    console.debug("Publishing content...");
    // Increase edition number
    this._setData("edition", this._getDataOrDefault("edition", 0) + 1);

    console.debug("Uploading content...");
    let cid = await this.asUploadJson(this.#toLtsJsonData());

    // _cid is an internal value when resolve
    // TODO: glb.web3Resolver.asResolve() is in another repo
    this._setData("_cid", cid);
    newCidInfo.texts.push(cid);

    let sig = await this.#asSign(cid);
    console.debug("Publishing...");
    for (let a of this.#aPublishers) {
      await a.asPublish(cid, this.getId() ?? '', sig);
    }

    // TODO: Find all storage servers
    console.debug("Pinning content...");
    const msg = JSON.stringify({cids : newCidInfo.texts});
    sig = await this.#asSign(msg);
    await this.#aStorage.asPin(msg, this.getId() ?? '', sig);

    this.saveCheckPoint();
  }
}
