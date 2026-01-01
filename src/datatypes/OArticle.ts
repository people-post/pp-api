import OAttachmentMeta from './OAttachmentMeta.js';

export default class OArticle {
  #id: string | null = null;
  #ownerId: string | null = null;
  #title: string | null = null;
  #content: string | null = null;
  #attachments: OAttachmentMeta[] = [];
  #createdAt: number | null = null;

  getAllCids(): string[] {
    // TODO: refCids -> per type cidInfos
    let cids: string[] = [];
    for (let a of this.#attachments) {
      const cid = a.getCid();
      if (cid) cids.push(cid);
    }
    // TODO: Consider medias
    return cids;
  }

  setId(id: string): void { this.#id = id; }
  setOwnerId(id: string): void { this.#ownerId = id; }
  setTitle(text: string): void { this.#title = text; }
  setContent(text: string): void { this.#content = text; }
  setAttachments(items: OAttachmentMeta[]): void { this.#attachments = items; }
  markCreation(): void { this.#createdAt = Date.now() / 1000; }

  ltsToJsonData(): {
    version: string;
    id: string | null;
    title: string | null;
    content: string | null;
    attachments: ReturnType<OAttachmentMeta['ltsToJsonData']>[];
    owner_id: string | null;
    created_at: number | null;
  } {
    return {
      version : "1.0",
      id : this.#id,
      title : this.#title,
      content : this.#content,
      attachments : this.#attachments.map(a => a.ltsToJsonData()),
      owner_id : this.#ownerId,
      created_at : this.#createdAt
    };
  }
}
