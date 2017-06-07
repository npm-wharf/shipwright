var path = require( "path" );
var yargs = require( "yargs" );
var settings = require( "../settings" );

function build( info, settings ) {
  var set = {
    repo: {
      alias: "r",
      describe: "the repository to build for",
      demandOption: true
    },
    name: {
      alias: "n",
      describe: "the name of the image/artifact",
      default: settings.getDefaultName( info )
    },
    workingPath: {
      alias: "p",
      describe: "the working path for the build",
      default: settings.getDefaultWorkingPath()
    },
    dockerFile: {
      alias: "d",
      describe: "the Docker file for the image build",
      default: settings.getDefaultDockerfile( info )
    },
    namePrefix: {
      describe: "optional prefix for the default package name"
    },
    namePostfix: {
      describe: "optional postfix for the default package name"
    },
    tags: {
      alias: "t",
      describe: "tag specifications (used by buildgoggles to create tags)",
      default: settings.getDefaultTagSpecs( info )
    },
    registry: {
      describe: "the image registry to build for",
      default: "hub.docker.com"
    },
    output: {
      describe: "where to write image metadata",
      default: "./.image.json"
    },
    skipPRs: {
      describe: "ignores command if the context is in a CI PR",
      default: true
    },
    ltsOnly: {
      describe: "limits the build for LTS versions of Node only",
      default: false
    },
    noPush: {
      describe: "prevents dockyard from pushing the image to the registry",
      default: false
    },
    updateWith: {
      describe: "specify an instruction file for how to send a PR to update another GitHub repository's file"
    },
    sudo: {
      describe: "indicates sudo should be used with docker commands",
      default: false
    }
  };
  return set;
}

function handle( dockyard, github, info, argv ) {
  return dockyard.buildImage( {
    repo: argv[ "repo" ],
    name: argv[ "name" ],
    workingPath: argv[ "workingPath" ],
    dockerFile: argv[ "dockerFile" ],
    namePrefix: argv[ "namePrefix" ],
    namePostfix: argv[ "namePostfix" ],
    tags: argv[ "tags" ],
    registry: argv[ "registry" ],
    output: argv[ "output" ],
    skipPRs: argv[ "skipPRs" ],
    ltsOnly: argv[ "ltsOnly" ],
    noPush: argv[ "noPush" ],
    defaultInfo: info
  } )
  .then(
    function( buildInfo ) {
      if( argv.updateWith ) {
        updateWith( github, buildInfo );
      } else {
        process.exit( 0 );
      }
    },
    function() {
      process.exit( 1 );
    }
  );
}

function updateWith( github, buildInfo ) {
  var files = [].concat( argv.updateWith );
  var update = github.updateWith.bind( null, buildInfo );
  when.all( files.map( update ) )
    .then(
      function() { process.exit( 0 ); },
      function() { process.exit( 1 ); }
    );
}

module.exports = function( dockyard, github, settings, info ) {
  return {
    describe: "builds an artifact according to the options",
    usage: "$0 <command> <target> [options]",
    command: "build <image|artifact>",
    builder: build( info, settings ),
    handler: handle.bind( null, dockyard, github, info )
  };
}
