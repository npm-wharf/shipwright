#!/usr/bin/env node
var format = require('util').format
var goggles = require('@npm-wharf/buildgoggles')
var githubChangeRemoteFile = require('github-change-remote-file')
var pequod = require('pequod')
var docker = function (sudo) {
  return pequod(sudo, dockerLog)
}
var settings = require('../src/settings')(goggles)
var shipwright = require('../src/index')(log, goggles, docker, settings)
var github = require('../src/github')(log, githubChangeRemoteFile)
var args
settings
  .getDefaultInfo()
  .then(function (info) {
    args = require('yargs')
      .usage('$0 <command> <target> [options]')
      .command(require('../src/commands/build')(shipwright, github, settings, info))
      .strict()
      .demandCommand()
      .help()
      .version()
      .argv
  })

function dockerLog (lines) {
  if (args && args.verbose) {
    lines.split('\n')
      .forEach(function (line) {
        if (line) {
          console.log('  ' + line)
        }
      })
  }
}

function log () {
  var args = Array.prototype.slice.call(arguments)
  console.log('\u2693  ' + format.apply(null, args))
}
