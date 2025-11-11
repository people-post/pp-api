import {CID} from 'multiformats';

export default class Utilities {

  hasHost() { return window.location.host.length > 0; }

  isCid(s) {
    try {
      CID.parse(s);
      return true;
    } catch (e) {
      return false;
    }
  }
};
