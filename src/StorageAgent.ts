import {sys} from './Global.js';
import ServerAgent from './ServerAgent.js';

interface UploadResponse {
  cid: string;
}

export default class StorageAgent extends ServerAgent {
  async asGetUploadToken(userId: string): Promise<string> {
    let url = this.getServer().getApiUrl("/api/upload/token");
    let options = {
      method : "GET",
      headers : {"Authorization" : "Bearer " + userId}
    };
    let res = await sys.ipfs.asFetch(url, options);
    let d: any = await res.json();
    if (d.error) {
      throw d.error;
    }
    return d.data.token;
  }

  async asUploadJson(data: string, userId: string, sig: string): Promise<string> {
    const url = this.getServer().getApiUrl("/api/upload/json");
    let d = await this.#asPostData(url, data, userId, sig);
    return d.cid;
  }

  async asUploadFile(file: File, userId: string, token: string, sig: string): Promise<UploadResponse> {
    const url = this.getServer().getApiUrl("/api/upload/file");
    return await this.#asPostFile(url, file, userId, token, sig);
  }

  async asUploadImage(file: File, userId: string, token: string, sig: string): Promise<UploadResponse> {
    const url = this.getServer().getApiUrl("/api/upload/image");
    return await this.#asPostFile(url, file, userId, token, sig);
  }

  async asUploadAudio(file: File, userId: string, token: string, sig: string): Promise<UploadResponse> {
    const url = this.getServer().getApiUrl("/api/upload/audio");
    return await this.#asPostFile(url, file, userId, token, sig);
  }

  async asUploadVideo(file: File, userId: string, token: string, sig: string): Promise<UploadResponse> {
    const url = this.getServer().getApiUrl("/api/upload/video");
    return await this.#asPostFile(url, file, userId, token, sig);
  }

  async asPin(data: string, userId: string, sig: string): Promise<void> {
    let url = this.getServer().getApiUrl("/api/pin/add");
    await this.#asPostData(url, data, userId, sig);
  }

  async #asPostData(url: string, data: string, bearerId: string, sig: string): Promise<UploadResponse> {
    let options = {
      method : "POST",
      headers : {
        "Content-Type" : "application/json",
        "Authorization" : "Bearer " + bearerId
      },
      body : JSON.stringify({data : data, signature : sig})
    };

    let res = await sys.ipfs.asFetch(url, options);
    let d: any = await res.json();
    if (d.error) {
      throw d.error;
    }

    return d.data;
  }

  async #asPostFile(url: string, file: File, bearerId: string, token: string, sig: string): Promise<UploadResponse> {
    let fd = new FormData();
    fd.append("signature", sig);
    fd.append("token", token);
    // Add file last to take advantage of streaming
    fd.append("file", file);
    let options = {
      method : "POST",
      headers : {Authorization : "Bearer " + bearerId},
      body : fd
    };

    let res = await sys.ipfs.asFetch(url, options);
    let d: any = await res.json();
    if (d.error) {
      throw d.error;
    }

    return d.data;
  }
}
