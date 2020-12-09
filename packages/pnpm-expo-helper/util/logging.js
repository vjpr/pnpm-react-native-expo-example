const leftPad = require('left-pad')
const Metro = require('metro-core')

// Time tranformation of each file.
// From https://github.com/facebook/metro/issues/253#issuecomment-422084406

Metro.Logger.on('log', (logEntry) => {
  if (
    logEntry.action_name === 'Transforming file' &&
    logEntry.action_phase === 'end'
  ) {
    console.log(leftPad(parseInt(logEntry.duration_ms), 4), logEntry.file_name)
  }
})
