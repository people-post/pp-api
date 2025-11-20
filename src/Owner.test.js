import assert from 'node:assert';
import {mock, test} from 'node:test';

import OArticle from './datatypes/OArticle.js';
import OAttachmentMeta from './datatypes/OAttachmentMeta.js';
import OPostListItem from './datatypes/OPostListItem.js';
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
    let mockPublisher = {async asPublish(cid, bearerId, sig) { return ''; }};

    t.mock.method(mockDataSource, 'onWeb3OwnerRequestLoadCheckPoint');
    t.mock.method(mockDelegate, 'asOnWeb3OwnerRequestSign');
    t.mock.method(mockDelegate, 'onWeb3OwnerRequestSaveCheckPoint');
    t.mock.method(mockStorage, 'asUploadJson');
    t.mock.method(mockStorage, 'asPin');
    t.mock.method(mockPublisher, 'asPublish');

    let owner = new Owner({});
    owner.setDataSource(mockDataSource);
    owner.setDelegate(mockDelegate);
    owner.setStorage(mockStorage);
    owner.setPublishers([ mockPublisher ]);

    let oArticle = new OArticle();
    let oMeta = new OAttachmentMeta();
    oMeta.setCid("cid");
    oMeta.setName("test");
    oMeta.setType("pdf");
    oArticle.setAttachments([ oMeta ]);

    let cid = owner.asUploadJson(oArticle.ltsToJsonData());

    let item = new OPostListItem();
    item.setType(OPostListItem.T_TYPE.ARTICLE);
    item.setCid(cid);
    await owner.asPublishPost(item, []);
    assert.strictEqual(
        mockDataSource.onWeb3OwnerRequestLoadCheckPoint.mock.callCount(), 0);
    assert.strictEqual(mockDelegate.asOnWeb3OwnerRequestSign.mock.callCount(),
                       5);
    assert.strictEqual(
        mockDelegate.onWeb3OwnerRequestSaveCheckPoint.mock.callCount(), 1);
    assert.strictEqual(mockStorage.asUploadJson.mock.callCount(), 3);
    assert.strictEqual(mockStorage.asPin.mock.callCount(), 1);
    assert.strictEqual(mockPublisher.asPublish.mock.callCount(), 1);
  });
});
