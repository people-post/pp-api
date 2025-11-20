export default class OArticle {
  #id;
  #ownerId;
  #title;
  #content;
  #attachments = []; // [OAttachmentMeta]
  #createdAt;

  setId(id) { this.#id = id; }
  setOwnerId(id) { this.#ownerId = id; }
  setTitle(text) { this.#title = text; }
  setContent(text) { this.#content = text; }
  setAttachments(items) { this.#attachments = items; }
  markCreation() { this.#createdAt = Date.now() / 1000; }

  ltsToJsonData() {
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
};
