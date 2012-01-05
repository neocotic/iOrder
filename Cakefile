{exec} = require 'child_process'

binDir   = 'bin'
distDir  = 'dist'
distFile = 'iOrder'
docsDir  = 'docs'
srcDir   = 'src'

baseDirs     = [
  binDir
  "#{binDir}/_locales"
  "#{binDir}/_locales/en"
  "#{binDir}/images"
  "#{binDir}/js"
  "#{binDir}/pages"
]
baseFiles    = [
  "#{srcDir}/js/background.js"
  "#{srcDir}/js/install.js"
  "#{srcDir}/js/notification.js"
  "#{srcDir}/js/options.js"
  "#{srcDir}/js/popup.js"
  "#{srcDir}/js/utils.js"
]
baseBinFiles = (path.replace "#{srcDir}/", "#{binDir}/" for path in baseFiles)

task 'build', 'builds extension', ->
  console.log 'Building iOrder...'
  for path in baseDirs
    exec("mkdir -p #{path}", (error) ->
      throw error if error
    )
  exec([
    "cp -r #{srcDir}/* #{binDir}"
    "find #{binDir}/ -name '.git*' -print0 | xargs -0 -IFILES rm FILES"
  ].join '&&', (error) ->
    throw error if error
  )
  for path in baseBinFiles
    console.log "Minifying #{path}..."
    exec([
      "`which uglifyjs` #{path} > #{path}.tmp"
      "mv -f #{path}.tmp #{path}"
      "rm -f #{path}.tmp"
    ].join '&&', (error) ->
      throw error if error
    )
  console.log 'Build complete!'

task 'clean', 'cleans directories', ->
  console.log 'Spring cleaning...'
  exec([
    "rm -rf #{binDir}"
    "rm -rf #{distDir}"
  ].join '&&', (error) ->
    throw error if error
  )

task 'dist', 'creates distributable file', ->
  console.log 'Generating distributable....'
  exec([
    "mkdir -p #{distDir}"
    "cd #{binDir} && zip -r ../#{distDir}/#{distFile} *"
  ].join '&&', (error) ->
    throw error if error
  )

task 'docs', 'creates documentation', ->
  console.log 'Generating documentation...'
  exec "`which docco` #{baseFiles}", (error) ->
    throw error if error