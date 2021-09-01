const leftPad = require('left-pad')

module.exports = ({MetroCore}) => {
  // Time transformation of each file.
  // From https://github.com/facebook/metro/issues/253#issuecomment-422084406

  MetroCore.Logger.on('log', logEntry => {
    if (
      logEntry.action_name === 'Transforming file' &&
      logEntry.action_phase === 'end'
    ) {
      if (process.env.EXPO_RESOLVE_PROGRESS) {
        console.log(
          leftPad(parseInt(logEntry.duration_ms), 4) + 'ms',
          logEntry.file_name,
        )
      }
    }
  })
}
