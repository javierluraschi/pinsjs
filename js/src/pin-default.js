import * as fileSystem from './host/file-system';
import { pinDefaultName } from './utils/pin-utils';
import { boardPinStore } from './pin-extensions';
import { pinLog, pinDebug } from './log';

export async function pinDefault(x, opts = {}) {
  const { description, board, ...args } = opts;
  const name = opts.name || pinDefaultName(x, board);
  const path = fileSystem.tempfile();

  fileSystem.dir.create(path);
  fileSystem.write(JSON.stringify(x), fileSystem.path(path, 'data.json'));

  return await boardPinStore(
    board,
    Object.assign(
      {},
      {
        name,
        description,
        path: path,
        type: 'default',
        metadata: [],
      },
      ...args
    )
  );
};

export const pinPreviewDefault = (x, ...args) => x;

export function pinLoadDefault(path, ...args) {
  return JSON.parse(fileSystem.read(fileSystem.path(path, 'data.json')));
};

export const pinFetchDefault = (...args) => args['path'];
