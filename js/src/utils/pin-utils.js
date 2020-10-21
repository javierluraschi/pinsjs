import * as fileSystem from '../host/file-system';
import { BoardName } from './const';

export function pinDefaultName(x, board) {
  const name = fileSystem.basename(x);
  const error = new Error(
    "Can't auto-generate pin name from object, please specify the 'name' parameter."
  );

  if (!name) {
    throw error;
  }

  const sanitized = name
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/^-*|-*$/g, '')
    .replace(/-+/g, '-');

  if (!sanitized) {
    throw error;
  }

  if (board === BoardName.kaggle && sanitized.length < 5) {
    return `${sanitized}-pin`;
  }

  return sanitized;
};
