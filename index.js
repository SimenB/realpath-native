'use strict';

const fs = require('fs');

function callWithFallbacks(funcName, filepath) {
  let fallbackToDefault = false;

  try {
    if (typeof fs[funcName].native === 'function') {
      return fs[funcName].native(filepath);
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

    if (fsBinding[funcName]) {
      try {
        return fsBinding[funcName](filepath, 'utf8');
      } catch (err) {
        /* Probably RAM-disk on windows. */
      }
    }
  }

  return fs[funcName](filepath);
}

function realpath(filepath) {
  return new Promise((resolve, reject) => {
    try {
      resolve(callWithFallbacks('realpath', filepath));
    } catch (e) {
      reject(e);
    }
  });
}

function realpathSync(filepath) {
  return callWithFallbacks('realpathSync', filepath);
}

module.exports = realpath;
module.exports.sync = realpathSync;
