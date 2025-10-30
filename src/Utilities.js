import {CID} from 'multiformats';

export default class Utilities {
  isCid(s) {
    try {
      CID.parse(s);
      return true;
    } catch (e) {
      return false;
    }
  }
};
