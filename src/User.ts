import {sys} from './Global.js';

interface UserData {
  uuid?: string;
  profile?: {
    nickname?: string;
    icon_cid?: string;
  };
  idols?: string;
  posts?: string;
  marks?: string;
  [key: string]: any;
}

interface IdolInfo {
  timestamp: number;
  type: string;
  id: string;
  nickname: string | null;
}

interface IdolRoot {
  idols: IdolInfo[];
}

interface PostRoot {
  posts: any[];
}

interface MarkRoot {
  marks: Record<string, any>;
}

interface MarkInfo {
  like?: boolean;
  comments?: any[];
}

export interface DataSource {
  onWeb3OwnerRequestLoadCheckPoint?(owner: any): string | null;
  onWeb3OwnerRequestGetPublicKey?(owner: any): Uint8Array;
}

export interface Delegate {
  onWeb3UserIdolsLoaded?(user: User): void;
  onWeb3UserProfileLoaded?(user: User): void;
  onWeb3OwnerProfileUpdated?(owner: any): void;
  asOnWeb3OwnerRequestSign?(owner: any, msg: string): Promise<string>;
  onWeb3OwnerRequestSaveCheckPoint?(owner: any, data: string): void;
}

export default class User {
  #data: UserData | null;
  #dPosts: PostRoot | null = null;
  #dIdols: IdolRoot | null = null;
  #dMarks: MarkRoot | null = null;
  #iconUrl: string | null = null;
  _dataSource: DataSource | null = null;
  _delegate: Delegate | null = null;

  constructor(data: UserData | null) { this.#data = data; }

  isFeed(): boolean { return false; }
  hasIdol(userId: string): boolean {
    if (this.#dIdols) {
      return this.#dIdols.idols.some(i => i.id == userId);
    } else {
      this._asGetOrInitIdolRoot().then(_d => this.#onIdolsLoaded());
      return false;
    }
  }

  getId(): string | null { return this._getData("uuid"); }
  getUsername(): string | null { return this.getId(); }
  getProfile(): { nickname?: string; icon_cid?: string; [key: string]: any } { return this._getDataOrDefault("profile", {}); }
  getNickname(): string | undefined { return this._getDataOrDefault("profile", {}).nickname; }
  getIconUrl(): string | null {
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
  getLogoUrl(): string | null { return this.getIconUrl(); }
  getInfoImageUrl(): string | null { return null; }
  getDomainUrl(): string { return "N/A"; }
  getBackgroundColor(): string | null { return null; }
  getColorTheme(): string | null { return null; }
  getNIdols(): number {
    if (this.#dIdols) {
      return this.#dIdols.idols.length;
    } else {
      this._asGetOrInitIdolRoot().then(_d => this.#onIdolsLoaded());
      return 0;
    }
  }
  getNFollowers(): number { return 0; }
  getBriefBio(): string { return ""; }

  setDataSource(dataSource: DataSource): void { this._dataSource = dataSource; }
  setDelegate(delegate: Delegate): void { this._delegate = delegate; }

  reset(data: UserData | null): void { this._reset(data); }

  async asyncGetIdolIds(): Promise<string[]> {
    let d = await this._asGetOrInitIdolRoot();
    return d.idols.map(i => i.id);
  }

  async asyncFindMark(key: string): Promise<MarkInfo | null> {
    if (!key) {
      return null;
    }

    let d = await this._asGetOrInitMarkRoot();
    return await this.#asFindMark("", key, d.marks);
  }

  async asyncLoadMorePostInfos(idRecord: { getNextSegmentId(): number }): Promise<any[] | void> {
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

  _hasData(): boolean { return !!this.#data; }
  _getData(name: string): any { return this.#data ? this.#data[name] : null; }

  _getDataOrDefault(name: string, vDefault: any): any {
    let d = this._getData(name);
    return d ? d : vDefault;
  }

  _reset(data: UserData | null): void {
    this.#data = data;
    this.#dPosts = null;
    this.#dMarks = null;
    this.#iconUrl = null;
  }

  async _asGetOrInitIdolRoot(): Promise<IdolRoot> {
    if (!this.#dIdols) {
      let cid = this._getData("idols");
      if (sys.utl.isCid(cid)) {
        this.#dIdols = await sys.ipfs.asFetchCidJson(cid) as IdolRoot;
      } else {
        this.#dIdols = {idols : []};
      }
    }
    return this.#dIdols;
  }

  async _asGetOrInitPostRoot(): Promise<PostRoot> {
    if (!this.#dPosts) {
      let cid = this._getData("posts");
      if (sys.utl.isCid(cid)) {
        try {
          this.#dPosts = await sys.ipfs.asFetchCidJson(cid) as PostRoot;
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

  async _asGetOrInitMarkRoot(): Promise<MarkRoot> {
    if (!this.#dMarks) {
      let cid = this._getData("marks");
      if (sys.utl.isCid(cid)) {
        this.#dMarks = await sys.ipfs.asFetchCidJson(cid) as MarkRoot;

      } else {
        this.#dMarks = {marks : {}};
      }
    }
    return this.#dMarks;
  }

  _setData(name: string, value: any): void { 
    if (!this.#data) this.#data = {};
    this.#data[name] = value; 
  }

  #onIdolsLoaded(): void {
    if (this._delegate) {
      this._delegate.onWeb3UserIdolsLoaded?.(this);
    }
  }

  #onProfileLoaded(): void {
    if (this._delegate) {
      this._delegate.onWeb3UserProfileLoaded?.(this);
    }
  }

  async #asFindMark(prefix: string, suffix: string, dMarks: Record<string, any>): Promise<MarkInfo | null> {
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

  async #asFetchIconImage(cid: string): Promise<void> {
    this.#iconUrl = await sys.ipfs.asFetchCidImage(cid);
  }
}
