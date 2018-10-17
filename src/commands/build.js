const when = require('when')

function build (info, settings) {
  const set = {
    repo: {
      alias: 'r',
      describe: 'the repository to build for',
      demandOption: true
    },
    name: {
      alias: 'n',
      describe: 'the name of the image/artifact',
      default: settings.getDefaultName(info)
    },
    'working-path': {
      alias: 'p',
      describe: 'the working path for the build',
      default: settings.getDefaultWorkingPath()
    },
    'docker-file': {
      alias: 'd',
      describe: 'the Docker file for the image build',
      default: settings.getDefaultDockerfile(info)
    },
    'name-prefix': {
      describe: 'optional prefix for the default package name'
    },
    'name-postfix': {
      describe: 'optional postfix for the default package name'
    },
    tags: {
      alias: 't',
      describe: 'tag specifications (used by buildgoggles to create tags)',
      default: settings.getDefaultTagSpecs(['dev', 'qa', 'staging'], info)
    },
    'always-build': {
      alias: 'a',
      describe: 'guarantees a build for all non-master branches with the d_v_c_s style tag',
      default: false,
      type: 'boolean'
    },
    'build-branches': {
      alias: 'b',
      describe: 'a list of branches to build for (aside from master) with the d_v_c_s style tag',
      default: 'dev,qa,staging'
    },
    'build-arg': {
      describe: 'a list of build arguments and values in the Dockerfile',
      type: 'array'
    },
    registry: {
      describe: 'the image registry to build for',
      default: 'https://hub.docker.com'
    },
    output: {
      alias: 'o',
      describe: 'where to write image metadata',
      default: './.image.json'
    },
    'skip-prs': {
      alias: 's',
      describe: 'ignores command if the context is in a CI PR',
      default: true,
      type: 'boolean'
    },
    'lts-only': {
      describe: 'limits the build for LTS versions of Node only',
      default: true,
      boolean: 'boolean'
    },
    'no-push': {
      describe: 'prevents shipwright from pushing the image to the registry',
      default: false,
      type: 'boolean'
    },
    'update-with': {
      describe: "specify an instruction file for how to send a PR to update another GitHub repository's file"
    },
    'cache-from': {
      describe: 'attempt to cache from a specific image',
      type: 'string'
    },
    'cache-from-latest': {
      describe: "attempt to cache from previously built image tagged as 'latest'",
      type: 'boolean',
      default: false
    },
    sudo: {
      describe: 'indicates sudo should be used with docker commands',
      default: false,
      type: 'boolean'
    },
    flatten: {
      alias: 'f',
      describe: 'creates a new image with 1 layer and no command history',
      default: false,
      type: 'boolean'
    },
    verbose: {
      describe: 'includes docker build output',
      default: false,
      type: 'boolean'
    },
    'indicate-progress': {
      describe: 'indicates progress with periodic dots for CI systems that will exit without regular output',
      default: false,
      type: 'boolean'
    }
  }
  return set
}

function getBuildArgs (buildArgs) {
  if (buildArgs) {
    return buildArgs.reduce((acc, pair) => {
      const [key, value] = pair.split(/[=]/)
      acc[key] = value
      return acc
    }, {})
  }
  return undefined
}

function handle (shipwright, github, info, argv) {
  if (argv.tags && /[,]/.test(argv.tags)) {
    argv.tags = argv.tags.split(',')
  }
  return shipwright.buildImage({
    repo: argv.repo,
    name: argv.name,
    workingPath: argv[ 'working-path' ],
    dockerFile: argv[ 'docker-file' ],
    namePrefix: argv[ 'name-prefix' ],
    namePostfix: argv[ 'name-Postfix' ],
    alwaysBuild: argv[ 'always-build' ],
    buildBranches: argv[ 'build-branches' ],
    cacheFromLatest: argv[ 'cache-from-latest' ],
    cacheFrom: argv[ 'cache-from' ],
    indicateProgress: argv[ 'indicate-progress' ],
    tags: argv.tags,
    registry: argv.registry,
    output: argv.output,
    skipPRs: argv[ 'skip-prs' ],
    ltsOnly: argv[ 'lts-only' ],
    noPush: argv[ 'no-push' ],
    flatten: argv[ 'flatten' ],
    defaultInfo: info,
    buildArgs: getBuildArgs(argv['build-arg']),
    verbose: argv.verbose
  })
  .then(
    buildInfo => {
      if (argv[ 'update-with' ]) {
        updateWith(github, buildInfo, argv)
      } else {
        process.exit(0)
      }
    },
    () => process.exit(1)
  )
}

function updateWith (github, buildInfo, argv) {
  const files = [].concat(argv.updateWith)
  const update = github.updateWith.bind(null, buildInfo)
  when.all(files.map(update))
    .then(
      () => process.exit(0),
      () => process.exit(1)
    )
}

module.exports = function (shipwright, github, settings, info) {
  return {
    describe: 'builds an artifact according to the options',
    usage: '$0 <command> <target> [options]',
    command: 'build <image|artifact>',
    builder: build(info, settings),
    handler: handle.bind(null, shipwright, github, info)
  }
}
