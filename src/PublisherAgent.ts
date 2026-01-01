import {sys} from './Global.js';
import ServerAgent from './ServerAgent.js';

export default class PublisherAgent extends ServerAgent {
  async asPublish(cid: string, bearerId: string, sig: string): Promise<any> {
    let url = this.getServer().getApiUrl("/api/pin/publish");
    let options = {
      method : "POST",
      headers : {
        "Content-Type" : "application/json",
        "Authorization" : "Bearer " + bearerId
      },
      body : JSON.stringify({cid : cid, signature : sig})
    };
    let res = await sys.ipfs.asFetch(url, options);
    let d: any = await res.json();
    if (d.error) {
      throw d.error;
    }
    return d.data;
  }
}
