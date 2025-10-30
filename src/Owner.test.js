import assert from 'node:assert';
import {mock, test} from 'node:test';

import Owner from './Owner.js';

test.describe('Owner test', () => {
  test.it('Posting', async (t) => {
    let mockDataSource = {
      onWeb3OwnerRequestLoadCheckPoint(owner) { return null; }
    };
    let mockDelegate = {
      async asOnWeb3OwnerRequestSign(owner, msg) { return msg; },
      onWeb3OwnerRequestSaveCheckPoint(owner, data) {}
    };
    let mockStorage = {
      async asUploadJson(msg, id, sig) { return ''; },
      async asPin(msg, id, sig) {}
    };

    t.mock.method(mockDataSource, 'onWeb3OwnerRequestLoadCheckPoint');
    t.mock.method(mockDelegate, 'asOnWeb3OwnerRequestSign');
    t.mock.method(mockDelegate, 'onWeb3OwnerRequestSaveCheckPoint');
    t.mock.method(mockStorage, 'asUploadJson');
    t.mock.method(mockStorage, 'asPin');
    let owner = new Owner({});
    owner.setDataSource(mockDataSource);
    owner.setDelegate(mockDelegate);
    owner.setStorage(mockStorage);
    await owner.asPublishPost({}, []);
    assert.strictEqual(
        mockDataSource.onWeb3OwnerRequestLoadCheckPoint.mock.callCount(), 0);
    assert.strictEqual(mockDelegate.asOnWeb3OwnerRequestSign.mock.callCount(),
                       4);
    assert.strictEqual(
        mockDelegate.onWeb3OwnerRequestSaveCheckPoint.mock.callCount(), 1);
    assert.strictEqual(mockStorage.asUploadJson.mock.callCount(), 2);
    assert.strictEqual(mockStorage.asPin.mock.callCount(), 1);
  });
});
