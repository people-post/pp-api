import assert from 'node:assert';
import {test} from 'node:test';

import OArticle from './datatypes/OArticle.js';
import OAttachmentMeta from './datatypes/OAttachmentMeta.js';
import Owner from './Owner.js';
import { DataSource, Delegate } from './User.js';
import StorageAgent from './StorageAgent.js';
import PublisherAgent from './PublisherAgent.js';

test.describe('Owner test', () => {
  test.it('Posting', async (t) => {
    let mockDataSource: DataSource = {
      onWeb3OwnerRequestLoadCheckPoint(_owner) { return null; }
    };
    let mockDelegate: Delegate = {
      async asOnWeb3OwnerRequestSign(_owner, msg) { return msg; },
      onWeb3OwnerRequestSaveCheckPoint(_owner, _data) {}
    };
    let mockStorage: StorageAgent = {
      async asUploadJson(_msg, _id, _sig) { return ''; },
      async asPin(_msg, _id, _sig) {}
    } as StorageAgent;
    let mockPublisher: PublisherAgent = {
      async asPublish(_cid, _bearerId, _sig) { return ''; }
    } as PublisherAgent;

    (t.mock.method as any)(mockDataSource, 'onWeb3OwnerRequestLoadCheckPoint');
    (t.mock.method as any)(mockDelegate, 'asOnWeb3OwnerRequestSign');
    (t.mock.method as any)(mockDelegate, 'onWeb3OwnerRequestSaveCheckPoint');
    (t.mock.method as any)(mockStorage, 'asUploadJson');
    (t.mock.method as any)(mockStorage, 'asPin');
    (t.mock.method as any)(mockPublisher, 'asPublish');

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

    await owner.asPublishArticle(oArticle);
    assert.strictEqual(
        mockDataSource.onWeb3OwnerRequestLoadCheckPoint && 
        (mockDataSource.onWeb3OwnerRequestLoadCheckPoint as any).mock?.callCount(), 0);
    assert.strictEqual(
        mockDelegate.asOnWeb3OwnerRequestSign && 
        (mockDelegate.asOnWeb3OwnerRequestSign as any).mock?.callCount(), 5);
    assert.strictEqual(
        mockDelegate.onWeb3OwnerRequestSaveCheckPoint && 
        (mockDelegate.onWeb3OwnerRequestSaveCheckPoint as any).mock?.callCount(), 1);
    assert.strictEqual(
        mockStorage.asUploadJson && 
        (mockStorage.asUploadJson as any).mock?.callCount(), 3);
    assert.strictEqual(
        mockStorage.asPin && 
        (mockStorage.asPin as any).mock?.callCount(), 1);
    assert.strictEqual(
        mockPublisher.asPublish && 
        (mockPublisher.asPublish as any).mock?.callCount(), 1);
  });
});
