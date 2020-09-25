import * as signature from './host/signature';
import * as fileSystem from './host/file-system';
import callbacks from './host/callbacks';
import { boardGet } from './board';
import { boardInitializeDatatxt } from './board-datatxt';

export const azureHeaders = (board, verb, path, file) => {
  const date = new Date().toUTCString();
  const azureVersion = '2015-04-05';

  // allow full urls to allow arbitrary file downloads
  let container = board.container;
  let account = board.account;

  if (new RegExp('^https?://').test(path)) {
    const pathNohttp = path.replace('^https?://', '');
    const subPath = pathNohttp.replace('^[^/]+/', '');

    account = pathNohttp.replace('\\..*', '');
    path = subPath.replace('^[^/]+/', '');
    container = subPath.replace('/.*', '');
  }

  let contentLength = '';
  let contentType = '';

  if (file) {
    contentLength = fileSystem.fileSize(file);
    // TODO
    // contentType = mime::guess_type(file)
  }

  const content = [
    verb,
    '\n',
    contentLength,
    '',
    contentType,
    '\n\n\n\n\n',
    'x-ms-blob-type:BlockBlob',
    `x-ms-date:${date}`,
    `x-ms-version:${azureVersion}`,
    `/${account}/${container}/${path}`,
  ].join('\n');

  const sign = callbacks.get('btoa')(
    signature.md5(content, callbacks.get('btoa')(board.key))
  );
  const headers = {
    'x-ms-date': date,
    'x-ms-version': azureVersion,
    'x-ms-blob-type': 'BlockBlob',
    Authorization: `SharedKey ${account}:${signature}`,
  };

  return headers;
};

export const boardInitializeAzure = async (board, args) => {
  const { container, account, key, cache, ...params } = args;

  if (!container)
    throw new Error("The 'azure' board requires a 'container' parameter.");
  if (!account)
    throw new Error("The 'azure' board requires an 'account' parameter.");
  if (!key) throw new Error("The 'azure' board requires a 'key' parameter.");

  const azureUrl = `https://${account}.blob.core.windows.net/${container}`;
  const obj = Object.assign({}, params, {
    name: board.name,
    url: azureUrl,
    cache,
    headers: azureHeaders,
    needsIndex: false,
    container,
    account,
    key,
    connect: false,
    browseUrl: 'https://portal.azure.com',
  });

  await boardInitializeDatatxt(board, obj);

  return boardGet(board.name);
};
