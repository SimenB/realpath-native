/* eslint-disable prefer-arrow-callback */

'use strict';

const fs = require('fs');
const promisify = require('util.promisify');

const promisiedFsRealpath = promisify(fs.realpath);

function realpath(filepath) {
  if (typeof fs.realpath.native === 'function') {
    return promisify(fs.realpath.native)(filepath).catch(function(err) {
      // -4068: EISDIR: illegal operation on a directory, realpath
      if (err.errno !== -4068) {
        /* Probably RAM-disk on windows.
         Go straight to the default js
         implementation.  Otherwise the
         fsBinding.realpath call may cause
         the node runtime to abort.
       */
        const fsBinding = process.binding('fs');

        if (fsBinding.realpath) {
          return new Promise((resolve, reject) => {
            try {
              resolve(fsBinding.realpath(filepath, 'utf8'));
            } catch (e) {
              reject(e);
            }
          });
        }
      }

      return promisiedFsRealpath(filepath);
    });
  }
  const fsBinding = process.binding('fs');

  if (fsBinding.realpath) {
    return new Promise((resolve, reject) => {
      try {
        resolve(fsBinding.realpath(filepath, 'utf8'));
      } catch (e) {
        reject(e);
      }
    });
  }

  return promisiedFsRealpath(filepath);
}

function realpathSync(filepath) {
  let fallbackToDefault = false;
  try {
    if (typeof fs.realpathSync.native === 'function') {
      return fs.realpathSync.native(filepath);
    }
  } catch (err) {
    // -4068: EISDIR: illegal operation on a directory, realpath
    if (err.errno === -4068) {
      /* Probably RAM-disk on windows.
         Go straight to the default js
         implementation.  Otherwise the
         fsBinding.realpath call may cause
         the node runtime to abort.
       */
    }
    fallbackToDefault = true;
  }

  if (!fallbackToDefault) {
    const fsBinding = process.binding('fs');

    if (fsBinding.realpath) {
      try {
        return fsBinding.realpath(filepath, 'utf8');
      } catch (err) {
        /* Probably RAM-disk on windows. */
      }
    }
  }

  return fs.realpathSync(filepath);
}

module.exports = realpath;
module.exports.sync = realpathSync;
