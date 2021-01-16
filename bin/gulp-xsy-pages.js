#!/usr/bin/env node
process.argv.push('--gulpfile')
process.argv.push(require.resolve('..'))
process.argv.push('--cwd')
process.argv.push(process.cwd())

require('gulp/bin/gulp')