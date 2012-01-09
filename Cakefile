{exec} = require 'child_process'

copyright = """
            // [iOrder](http://neocotic.com/iOrder)
            // (c) #{new Date().getFullYear()} Alasdair Mercer
            // Freely distributable under the MIT license.
            // For all details and documentation:
            // http://neocotic.com/iOrder
            """

compile = '`which coffee`'
minify  = '`which uglifyjs`'
docGen  = '`which docco`'

binDir   = 'bin'
distDir  = 'dist'
distFile = 'iOrder'
docsDir  = 'docs'
srcDir   = 'src'
tempDir  = 'temp'

dirs = [
         binDir
         "#{binDir}/_locales"
         "#{binDir}/_locales/en"
         "#{binDir}/images"
         "#{binDir}/lib"
         "#{binDir}/pages"
         "#{binDir}/vendor"
       ]

task 'build', 'builds extension', ->
  console.log 'Building iOrder...'
  for path in dirs
    exec "mkdir -p #{path}", (error) ->
      throw error if error
  exec [
    "cp -r #{srcDir}/* #{binDir}"
    "find #{binDir}/ -name '.git*' -print0 | xargs -0 -IFILES rm FILES"
    "#{compile} --compile #{binDir}/lib/"
    "rm -f #{binDir}/lib/*.coffee"
    "for file in #{binDir}/lib/*.js; do echo \"#{copyright}\" > $file.tmp"
    'cat $file >> $file.tmp'
    'mv -f $file.tmp $file; done'
  ].join('&&'), (error) ->
    throw error if error

task 'clean', 'cleans directories', ->
  console.log 'Spring cleaning...'
  exec [
    "rm -rf #{binDir}"
    "rm -rf #{distDir}"
  ].join('&&'), (error) ->
    throw error if error

task 'dist', 'creates distributable file', ->
  console.log 'Generating distributable....'
  exec [
    "mkdir -p #{distDir}"
    "mkdir -p #{distDir}/#{tempDir}"
    "cp -r #{binDir}/* #{distDir}/#{tempDir}"
    "for file in #{distDir}/#{tempDir}/lib/*.js; do #{minify} $file > $file.tmp"
    'mv -f $file.tmp $file; done'
    "cd #{distDir}/#{tempDir}"
    "zip -r ../#{distFile} *"
    'cd ../'
    "rm -rf #{tempDir}"
  ].join('&&'), (error) ->
    throw error if error

task 'docs', 'creates documentation', ->
  console.log 'Generating documentation...'
  exec "#{docGen} #{srcDir}/lib/*.coffee", (error) ->
    throw error if error