import {sys} from './Global.js';
import ServerAgent from './ServerAgent.js';

export default class PublisherAgent extends ServerAgent {
  async asPublish(cid, bearerId, sig) {
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
    let d = await res.json();
    if (d.error) {
      throw d.error;
    }
    return d.data;
  }
};
