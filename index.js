'use strict';

const fs = require('fs');
const promisify = require('util.promisify');

const promisiedFsRealpath = promisify(fs.realpath);

function isWinRamDiskError(err) {
  // -4068: EISDIR: illegal operation on a directory, realpath
  /* Probably RAM-disk on windows.
     Go straight to the default js
     implementation.  Otherwise the
     fsBinding.realpath call may cause
     the node runtime to abort.
  */
  return err.errno === -4068;
}

// Implementation functions
function realpathImpl(filepath, skipToDefault) {
  if (!skipToDefault) {
    if (typeof fs.realpath.native === 'function') {
      return promisify(fs.realpath.native)(filepath).catch(function (err) {
        // Call this function again and skip straight to the default
        // js behavior if we've encountered the Windows RAMdisk situation
        if (isWinRamDiskError(err)) {
          return realpathImpl(filepath, true);
        }
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
  }

  return promisiedFsRealpath(filepath);
}

function realpathSyncImpl(filepath, skipToDefault) {
  if (!skipToDefault) {
    try {
      if (typeof fs.realpathSync.native === 'function') {
        return fs.realpathSync.native(filepath);
      }
    } catch (err) {
      // Call this function again and skip straight to the default
      // js behavior if we've encountered the Windows RAMdisk situation
      if (isWinRamDiskError(err)) {
        return realpathSyncImpl(filepath, true);
      }
    }

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

// Public API functions
function realpath(filepath) {
  return realpathImpl(filepath);
}

function realpathSync(filepath) {
  return realpathSyncImpl(filepath);
}

module.exports = realpath;
module.exports.sync = realpathSync;
