require('./setup.js')
const fs = require('fs')
const os = require('os')
const path = require('path')
const when = require('when')

const log = sinon.spy(function () {})
const goggles = {
  getInfo: function () {}
}
const docker = {
  create: function () {},
  build: function () {},
  export: function () {},
  import: function () {},
  inspect: function () {},
  pull: function () {},
  pushTags: function () {},
  removeContainer: function () {},
  tagImage: function () {}
}

const ORIGINAL_EXIT = process.exit

function captureExit (fn) {
  process.exit = fn
}

function releaseExit () {
  process.exit = ORIGINAL_EXIT
}

const dockerFactory = function () { return docker }

const settings = require('../src/settings')(goggles)
const shipwright = require('../src/index')(log, goggles, dockerFactory, settings)

describe('Shipwright', function () {
  describe('build image', function () {
    describe('when LTS only and version is not LTS', function () {
      var result
      before(function () {
        return shipwright.buildImage({ ltsOnly: true, defaultInfo: { isLTS: false } })
          .then(function (x) { result = x })
      })

      it('should resolve to empty object', function () {
        result.should.eql({})
      })

      it('should log skipping build', function () {
        log.should.have.been.calledWith(
          `Skipping build - Node version (${process.version}) is not LTS`
        )
      })
    })

    describe('when building image with explicit tag', function () {
      var imageFile
      var imageName
      var gogglesMock
      var dockerMock
      var exitSpy

      before(function () {
        exitSpy = sinon.stub()
        captureExit(exitSpy)
        imageFile = 'spec/.custom.json'
        imageName = 'npm/npm-test'

        dockerMock = sinon.mock(docker)
        dockerMock
          .expects('build')
          .withArgs(imageName, {
            args: undefined,
            cacheFrom: undefined,
            working: './spec',
            file: 'Dockerfile.test'
          })
          .once()
          .resolves({})

        dockerMock
          .expects('tagImage')
          .withArgs(imageName)
          .resolves({})

        dockerMock
          .expects('pushTags')
          .withArgs(imageName)
          .resolves()

        gogglesMock = sinon.mock(goggles)
        gogglesMock
          .expects('getInfo')
          .withArgs({ repo: './spec', tags: [ 'v_c_s' ] })
          .resolves({
            tag: '1.1.1_10_a1b2c3d4'
          })
          .once()

        return shipwright.buildImage({
          ltsOnly: true,
          repo: 'npm',
          name: 'test',
          namePrefix: 'npm-',
          workingPath: './spec',
          dockerFile: 'Dockerfile.test',
          tags: [ 'v_c_s' ],
          output: '.custom.json',
          defaultInfo: {
            isLTS: true
          }
        })
      })

      it('should log build start', function () {
        log.should.have.been.calledWith(
          `Building Docker image '${imageName}'.`
        )
      })

      it('should log build complete', function () {
        log.should.have.been.calledWith(
          `Docker image '${imageName}' built successfully.`
        )
      })

      it('should log tag started', function () {
        log.should.have.been.calledWith('Tagging image.')
      })

      it('should log push started', function () {
        log.should.have.been.calledWith('Pushing image.')
      })

      it('should log push success', function () {
        log.should.have.been.calledWith(
          `Docker image '${imageName}' was pushed successfully with tags: 1.1.1_10_a1b2c3d4`
        )
      })

      it('should log writing image file', function () {
        log.should.have.been.calledWith(
          `Writing image file to '${imageFile}'.`
        )
      })

      it('should write correct info to file', function () {
        var json = JSON.parse(fs.readFileSync(imageFile, 'utf8'))
        json.should.eql({
          image: imageName,
          tags: '1.1.1_10_a1b2c3d4'
        })
      })

      it('should log writing image file success', function () {
        log.should.have.been.calledWith(
          `Image file written to '${imageFile}' successfully.`
        )
      })

      after(function () {
        dockerMock.verify()
        gogglesMock.verify()
        releaseExit()
        fs.unlinkSync(path.resolve(imageFile))
      })
    })

    describe('when building image with latest tag', function () {
      var imageFile
      var imageName
      var gogglesMock
      var dockerMock

      before(function () {
        imageFile = 'spec/.custom.json'
        imageName = 'npm/npm-test'

        dockerMock = sinon.mock(docker)
        dockerMock
          .expects('build')
          .withArgs(imageName, {
            args: undefined,
            cacheFrom: undefined,
            working: './spec',
            file: 'Dockerfile.test'
          })
          .once()
          .resolves({})

        dockerMock
          .expects('tagImage')
          .withArgs(imageName)
          .resolves({})

        dockerMock
          .expects('pushTags')
          .withArgs(imageName)
          .resolves()

        gogglesMock = sinon.mock(goggles)
        gogglesMock
          .expects('getInfo')
          .withArgs({ repo: './spec', tags: [ 'lt', 'v_c_s' ] })
          .resolves({
            tag: [ 'latest', '1.1.1_10_a1b2c3d4' ]
          })
          .once()

        return shipwright.buildImage({
          ltsOnly: true,
          repo: 'npm',
          name: 'test',
          namePrefix: 'npm-',
          workingPath: './spec',
          dockerFile: 'Dockerfile.test',
          tags: [ 'lt', 'v_c_s' ],
          output: '.custom.json',
          defaultInfo: {
            isLTS: true
          }
        })
      })

      it('should log build start', function () {
        log.should.have.been.calledWith(
          `Building Docker image '${imageName}'.`
        )
      })

      it('should log build complete', function () {
        log.should.have.been.calledWith(
          `Docker image '${imageName}' built successfully.`
        )
      })

      it('should log tag started', function () {
        log.should.have.been.calledWith('Tagging image.')
      })

      it('should log push started', function () {
        log.should.have.been.calledWith('Pushing image.')
      })

      it('should log push success', function () {
        log.should.have.been.calledWith(
          `Docker image '${imageName}' was pushed successfully with tags: latest, 1.1.1_10_a1b2c3d4`
        )
      })

      it('should log writing image file', function () {
        log.should.have.been.calledWith(
          `Writing image file to '${imageFile}'.`
        )
      })

      it('should write correct info to file', function () {
        var json = JSON.parse(fs.readFileSync(imageFile, 'utf8'))
        json.should.eql({
          image: imageName,
          tags: [ 'latest', '1.1.1_10_a1b2c3d4' ]
        })
      })

      it('should log writing image file success', function () {
        log.should.have.been.calledWith(
          `Image file written to '${imageFile}' successfully.`
        )
      })

      after(function () {
        dockerMock.verify()
        gogglesMock.verify()
        fs.unlinkSync(path.resolve(imageFile))
      })
    })

    describe('when building image with always build', function () {
      var imageFile
      var imageName
      var gogglesMock
      var dockerMock
      var exitSpy
      before(function () {
        exitSpy = sinon.stub()
        captureExit(exitSpy)
        imageFile = 'spec/.custom.json'
        imageName = 'npm/npm-test'

        dockerMock = sinon.mock(docker)
        dockerMock
          .expects('build')
          .withArgs(imageName, {
            args: undefined,
            cacheFrom: undefined,
            working: './spec',
            file: 'Dockerfile.test'
          })
          .once()
          .resolves({})

        dockerMock
          .expects('tagImage')
          .withArgs(imageName)
          .resolves({})

        dockerMock
          .expects('pushTags')
          .withArgs(imageName)
          .resolves({})

        gogglesMock = sinon.mock(goggles)
        gogglesMock
          .expects('getInfo')
          .withArgs({ repo: './spec', tags: [ 'b_v_c_s' ] })
          .resolves({
            tag: [ 'my-branch_1.1.1_10_a1b2c3d4' ]
          })
          .once()

        return shipwright.buildImage({
          ltsOnly: true,
          alwaysBuild: true,
          repo: 'npm',
          name: 'test',
          namePrefix: 'npm-',
          workingPath: './spec',
          dockerFile: 'Dockerfile.test',
          tags: [],
          output: '.custom.json',
          defaultInfo: {
            branch: 'my-branch',
            isLTS: true
          }
        })
      })

      it('should log build start', function () {
        log.should.have.been.calledWith(
          `Building Docker image '${imageName}'.`
        )
      })

      it('should log build complete', function () {
        log.should.have.been.calledWith(
          `Docker image '${imageName}' built successfully.`
        )
      })

      it('should log tag started', function () {
        log.should.have.been.calledWith('Tagging image.')
      })

      it('should log push started', function () {
        log.should.have.been.calledWith('Pushing image.')
      })

      it('should log push success', function () {
        log.should.have.been.calledWith(
          `Docker image '${imageName}' was pushed successfully with tags: my-branch_1.1.1_10_a1b2c3d4`
        )
      })

      it('should log writing image file', function () {
        log.should.have.been.calledWith(
          `Writing image file to '${imageFile}'.`
        )
      })

      it('should write correct info to file', function () {
        var json = JSON.parse(fs.readFileSync(imageFile, 'utf8'))
        json.should.eql({
          image: imageName,
          tags: [ 'my-branch_1.1.1_10_a1b2c3d4' ]
        })
      })

      it('should log writing image file success', function () {
        log.should.have.been.calledWith(
          `Image file written to '${imageFile}' successfully.`
        )
      })

      after(function () {
        dockerMock.verify()
        gogglesMock.verify()
        releaseExit()
        fs.unlinkSync(path.resolve(imageFile))
      })
    })

    describe('when building image with cache-from-latest', function () {
      var imageFile
      var imageName
      var gogglesMock
      var dockerMock

      before(function () {
        imageFile = 'spec/.custom.json'
        imageName = 'npm/npm-test'

        dockerMock = sinon.mock(docker)
        dockerMock
          .expects('pull')
          .withArgs('npm/npm-test:latest')
          .once()
          .resolves({})

        dockerMock
          .expects('build')
          .withArgs(imageName, {
            args: undefined,
            working: './spec',
            file: 'Dockerfile.test',
            cacheFrom: 'npm/npm-test:latest'
          })
          .once()
          .resolves({})

        dockerMock
          .expects('tagImage')
          .withArgs(imageName)
          .resolves({})

        dockerMock
          .expects('pushTags')
          .withArgs(imageName)
          .resolves()

        gogglesMock = sinon.mock(goggles)
        gogglesMock
          .expects('getInfo')
          .withArgs({ repo: './spec', tags: [ 'lt', 'v_c_s' ] })
          .resolves({
            tag: [ 'latest', '1.1.1_10_a1b2c3d4' ]
          })
          .once()

        return shipwright.buildImage({
          ltsOnly: true,
          repo: 'npm',
          name: 'test',
          namePrefix: 'npm-',
          workingPath: './spec',
          dockerFile: 'Dockerfile.test',
          tags: [ 'lt', 'v_c_s' ],
          output: '.custom.json',
          cacheFromLatest: true,
          defaultInfo: {
            isLTS: true
          }
        })
      })

      it('should log build start', function () {
        log.should.have.been.calledWith(
          `Building Docker image '${imageName}'.`
        )
      })

      it('should log caching source', function () {
        log.should.have.been.calledWith(
          `Attempting to pull image 'npm/npm-test:latest' to use as cache baseline.`
        )
      })

      it('should log pull completion', function () {
        log.should.have.been.calledWith(
          `Pull from 'npm/npm-test:latest' complete.`
        )
      })

      it('should log build complete', function () {
        log.should.have.been.calledWith(
          `Docker image '${imageName}' built successfully.`
        )
      })

      it('should log tag started', function () {
        log.should.have.been.calledWith('Tagging image.')
      })

      it('should log push started', function () {
        log.should.have.been.calledWith('Pushing image.')
      })

      it('should log push success', function () {
        log.should.have.been.calledWith(
          `Docker image '${imageName}' was pushed successfully with tags: latest, 1.1.1_10_a1b2c3d4`
        )
      })

      it('should log writing image file', function () {
        log.should.have.been.calledWith(
          `Writing image file to '${imageFile}'.`
        )
      })

      it('should write correct info to file', function () {
        var json = JSON.parse(fs.readFileSync(imageFile, 'utf8'))
        json.should.eql({
          image: imageName,
          tags: [ 'latest', '1.1.1_10_a1b2c3d4' ]
        })
      })

      it('should log writing image file success', function () {
        log.should.have.been.calledWith(
          `Image file written to '${imageFile}' successfully.`
        )
      })

      after(function () {
        dockerMock.verify()
        gogglesMock.verify()
        fs.unlinkSync(path.resolve(imageFile))
      })
    })

    describe('when building image with cache-from', function () {
      var imageFile
      var imageName
      var gogglesMock
      var dockerMock

      before(function () {
        imageFile = 'spec/.custom.json'
        imageName = 'npm/npm-test'

        dockerMock = sinon.mock(docker)
        dockerMock
          .expects('pull')
          .withArgs('npm/npm-test:1.0.0')
          .once()
          .resolves({})

        dockerMock
          .expects('build')
          .withArgs(imageName, {
            args: undefined,
            working: './spec',
            file: 'Dockerfile.test',
            cacheFrom: 'npm/npm-test:1.0.0'
          })
          .once()
          .resolves({})

        dockerMock
          .expects('tagImage')
          .withArgs(imageName)
          .resolves({})

        dockerMock
          .expects('pushTags')
          .withArgs(imageName)
          .resolves()

        gogglesMock = sinon.mock(goggles)
        gogglesMock
          .expects('getInfo')
          .withArgs({ repo: './spec', tags: [ 'lt', 'v_c_s' ] })
          .resolves({
            tag: [ 'latest', '1.1.1_10_a1b2c3d4' ]
          })
          .once()

        return shipwright.buildImage({
          ltsOnly: true,
          repo: 'npm',
          name: 'test',
          namePrefix: 'npm-',
          workingPath: './spec',
          dockerFile: 'Dockerfile.test',
          tags: [ 'lt', 'v_c_s' ],
          output: '.custom.json',
          cacheFrom: 'npm/npm-test:1.0.0',
          defaultInfo: {
            isLTS: true
          }
        })
      })

      it('should log build start', function () {
        log.should.have.been.calledWith(
          `Building Docker image '${imageName}'.`
        )
      })

      it('should log caching source', function () {
        log.should.have.been.calledWith(
          `Attempting to pull image 'npm/npm-test:1.0.0' to use as cache baseline.`
        )
      })

      it('should log pull completion', function () {
        log.should.have.been.calledWith(
          `Pull from 'npm/npm-test:1.0.0' complete.`
        )
      })

      it('should log build complete', function () {
        log.should.have.been.calledWith(
          `Docker image '${imageName}' built successfully.`
        )
      })

      it('should log tag started', function () {
        log.should.have.been.calledWith('Tagging image.')
      })

      it('should log push started', function () {
        log.should.have.been.calledWith('Pushing image.')
      })

      it('should log push success', function () {
        log.should.have.been.calledWith(
          `Docker image '${imageName}' was pushed successfully with tags: latest, 1.1.1_10_a1b2c3d4`
        )
      })

      it('should log writing image file', function () {
        log.should.have.been.calledWith(
          `Writing image file to '${imageFile}'.`
        )
      })

      it('should write correct info to file', function () {
        var json = JSON.parse(fs.readFileSync(imageFile, 'utf8'))
        json.should.eql({
          image: imageName,
          tags: [ 'latest', '1.1.1_10_a1b2c3d4' ]
        })
      })

      it('should log writing image file success', function () {
        log.should.have.been.calledWith(
          `Image file written to '${imageFile}' successfully.`
        )
      })

      after(function () {
        dockerMock.verify()
        gogglesMock.verify()
        fs.unlinkSync(path.resolve(imageFile))
      })
    })

    describe('when building image with flatten by pipe', function () {
      var imageFile
      var imageName
      var gogglesMock
      var dockerMock
      var tempImage
      var exitSpy

      before(function () {
        imageFile = 'spec/.flattened.json'
        imageName = 'npm/npm-test'
        tempImage = 'temp'

        exitSpy = sinon.stub()
        captureExit(exitSpy)

        dockerMock = sinon.mock(docker)
        dockerMock
          .expects('pull')
          .withArgs('npm/npm-test:1.0.0')
          .once()
          .resolves({})

        dockerMock
          .expects('build')
          .withArgs(tempImage, {
            args: undefined,
            working: './spec',
            file: 'Dockerfile.test',
            cacheFrom: 'npm/npm-test:1.0.0'
          })
          .once()
          .resolves({})

        dockerMock
          .expects('inspect')
          .withArgs(`${tempImage}:latest`)
          .once()
          .resolves({
            Config: {
              User: 'root',
              Env: [
                'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
                'ONE=uno',
                'TWO=dos'
              ],
              ExposedPorts: {
                '443/tcp': {},
                '80/tcp': {}
              },
              Cmd: [ '/bin/sh', '-c', 'this', 'is', 'a', './test' ],
              WorkingDir: '/my/path',
              Entrypoint: [ '/bin/sh', '-c', '= [ "node", "/src/server.js" ]' ]
            },
            Size: 1000
          })

        dockerMock
          .expects('removeContainer')
          .once()
          .resolves({})

        dockerMock
          .expects('create')
          .once()
          .resolves({})

        dockerMock
          .expects('export')
          .once()
          .resolves('A-PIPE')

        dockerMock
          .expects('import')
          .withArgs('pipe', imageName, {
            pipe: 'A-PIPE',
            changes: [
              'USER root',
              'WORKDIR /my/path',
              'ENV PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
              'ENV ONE=uno',
              'ENV TWO=dos',
              'EXPOSE 443/tcp',
              'EXPOSE 80/tcp',
              'CMD ["/bin/sh","-c","this","is","a","./test"]',
              'ENTRYPOINT ["/bin/sh","-c","= [ \\"node\\", \\"/src/server.js\\" ]"]'
            ]
          })
          .once()
          .resolves({})

        dockerMock
          .expects('tagImage')
          .withArgs(imageName)
          .resolves({})

        dockerMock
          .expects('pushTags')
          .withArgs(imageName)
          .resolves()

        gogglesMock = sinon.mock(goggles)
        gogglesMock
          .expects('getInfo')
          .withArgs({ repo: './spec', tags: [ 'lt', 'v_c_s' ] })
          .resolves({
            tag: [ 'latest', '1.1.1_10_a1b2c3d4' ]
          })
          .once()

        return shipwright.buildImage({
          ltsOnly: true,
          repo: 'npm',
          name: 'test',
          namePrefix: 'npm-',
          workingPath: './spec',
          dockerFile: 'Dockerfile.test',
          tags: [ 'lt', 'v_c_s' ],
          output: '.flattened.json',
          cacheFrom: 'npm/npm-test:1.0.0',
          flatten: true,
          defaultInfo: {
            isLTS: true
          }
        })
      })

      it('should log build start', function () {
        log.should.have.been.calledWith(
          `Building Docker image '${imageName}'.`
        )
      })

      it('should log caching source', function () {
        log.should.have.been.calledWith(
          `Attempting to pull image 'npm/npm-test:1.0.0' to use as cache baseline.`
        )
      })

      it('should log pull completion', function () {
        log.should.have.been.calledWith(
          `Pull from 'npm/npm-test:1.0.0' complete.`
        )
      })

      it('should log build complete', function () {
        log.should.have.been.calledWith(
          `Docker image '${imageName}' built successfully.`
        )
      })

      it('should log flattening beginning', function () {
        log.should.have.been.calledWith(
          `Flattening temporary image '${tempImage}' into '${imageName}'.`
        )
      })

      it('should log flattening beginning', function () {
        log.should.have.been.calledWith(
          `Exporting container via pipe.`
        )
      })

      it('should log flattening complete', function () {
        log.should.have.been.calledWith(
          `Image flattened into '${imageName}' successfully.`
        )
      })

      it('should log tag started', function () {
        log.should.have.been.calledWith('Tagging image.')
      })

      it('should log push started', function () {
        log.should.have.been.calledWith('Pushing image.')
      })

      it('should log push success', function () {
        log.should.have.been.calledWith(
          `Docker image '${imageName}' was pushed successfully with tags: latest, 1.1.1_10_a1b2c3d4`
        )
      })

      it('should log writing image file', function () {
        log.should.have.been.calledWith(
          `Writing image file to '${imageFile}'.`
        )
      })

      it('should write correct info to file', function () {
        var json = JSON.parse(fs.readFileSync(imageFile, 'utf8'))
        json.should.eql({
          image: imageName,
          tags: [ 'latest', '1.1.1_10_a1b2c3d4' ]
        })
      })

      it('should log writing image file success', function () {
        log.should.have.been.calledWith(
          `Image file written to '${imageFile}' successfully.`
        )
      })

      after(function () {
        dockerMock.verify()
        gogglesMock.verify()
        releaseExit()
        fs.unlinkSync(path.resolve(imageFile))
      })
    })

    describe('when building image with flatten by file', function () {
      var imageFile
      var imageName
      var gogglesMock
      var dockerMock
      var tempImage
      var exitSpy

      before(function () {
        imageFile = 'spec/.flattened.json'
        imageName = 'npm/npm-test'
        tempImage = 'temp'

        exitSpy = sinon.stub()
        captureExit(exitSpy)

        dockerMock = sinon.mock(docker)
        dockerMock
          .expects('pull')
          .withArgs('npm/npm-test:1.0.0')
          .once()
          .resolves({})

        dockerMock
          .expects('build')
          .withArgs(tempImage, {
            args: undefined,
            working: './spec',
            file: 'Dockerfile.test',
            cacheFrom: 'npm/npm-test:1.0.0'
          })
          .once()
          .resolves({})

        dockerMock
          .expects('inspect')
          .withArgs(`${tempImage}:latest`)
          .once()
          .resolves({
            Config: {
              User: 'root',
              Env: [
                'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
                'ONE=a phrase with spaces',
                'TWO=dos'
              ],
              ExposedPorts: {
                '443/tcp': {},
                '80/tcp': {}
              },
              Cmd: [ '/bin/sh', '-c', 'this', 'is', 'a', './test' ],
              WorkingDir: '/my/path',
              Entrypoint: [ '/bin/sh', '-c', '= [ "node", "/src/server.js" ]' ]
            },
            Size: Number.MAX_SAFE_INTEGER
          })

        dockerMock
          .expects('removeContainer')
          .once()
          .resolves({})

        dockerMock
          .expects('create')
          .once()
          .resolves({})

        dockerMock
          .expects('export')
          .once()
          .resolves()

        dockerMock
          .expects('import')
          .withArgs(`${os.tmpdir()}/temp-container.tgz`, imageName, {
            changes: [
              'USER root',
              'WORKDIR /my/path',
              'ENV PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
              'ENV ONE="a phrase with spaces"',
              'ENV TWO=dos',
              'EXPOSE 443/tcp',
              'EXPOSE 80/tcp',
              'CMD ["/bin/sh","-c","this","is","a","./test"]',
              'ENTRYPOINT ["/bin/sh","-c","= [ \\"node\\", \\"/src/server.js\\" ]"]'
            ]
          })
          .once()
          .resolves({})

        dockerMock
          .expects('tagImage')
          .withArgs(imageName)
          .resolves({})

        dockerMock
          .expects('pushTags')
          .withArgs(imageName)
          .resolves()

        gogglesMock = sinon.mock(goggles)
        gogglesMock
          .expects('getInfo')
          .withArgs({ repo: './spec', tags: [ 'lt', 'v_c_s' ] })
          .resolves({
            tag: [ 'latest', '1.1.1_10_a1b2c3d4' ]
          })
          .once()

        return shipwright.buildImage({
          ltsOnly: true,
          repo: 'npm',
          name: 'test',
          namePrefix: 'npm-',
          workingPath: './spec',
          dockerFile: 'Dockerfile.test',
          tags: [ 'lt', 'v_c_s' ],
          output: '.flattened.json',
          cacheFrom: 'npm/npm-test:1.0.0',
          flatten: true,
          defaultInfo: {
            isLTS: true
          }
        })
      })

      it('should log build start', function () {
        log.should.have.been.calledWith(
          `Building Docker image '${imageName}'.`
        )
      })

      it('should log caching source', function () {
        log.should.have.been.calledWith(
          `Attempting to pull image 'npm/npm-test:1.0.0' to use as cache baseline.`
        )
      })

      it('should log pull completion', function () {
        log.should.have.been.calledWith(
          `Pull from 'npm/npm-test:1.0.0' complete.`
        )
      })

      it('should log build complete', function () {
        log.should.have.been.calledWith(
          `Docker image '${imageName}' built successfully.`
        )
      })

      it('should log flattening beginning', function () {
        log.should.have.been.calledWith(
          `Flattening temporary image '${tempImage}' into '${imageName}'.`
        )
      })

      it('should log flattening beginning', function () {
        log.should.have.been.calledWith(
          `Exporting container to file '${os.tmpdir()}/temp-container.tgz'.`
        )
      })

      it('should log flattening complete', function () {
        log.should.have.been.calledWith(
          `Image flattened into '${imageName}' successfully.`
        )
      })

      it('should log tag started', function () {
        log.should.have.been.calledWith('Tagging image.')
      })

      it('should log push started', function () {
        log.should.have.been.calledWith('Pushing image.')
      })

      it('should log push success', function () {
        log.should.have.been.calledWith(
          `Docker image '${imageName}' was pushed successfully with tags: latest, 1.1.1_10_a1b2c3d4`
        )
      })

      it('should log writing image file', function () {
        log.should.have.been.calledWith(
          `Writing image file to '${imageFile}'.`
        )
      })

      it('should write correct info to file', function () {
        var json = JSON.parse(fs.readFileSync(imageFile, 'utf8'))
        json.should.eql({
          image: imageName,
          tags: [ 'latest', '1.1.1_10_a1b2c3d4' ]
        })
      })

      it('should log writing image file success', function () {
        log.should.have.been.calledWith(
          `Image file written to '${imageFile}' successfully.`
        )
      })

      after(function () {
        dockerMock.verify()
        gogglesMock.verify()
        releaseExit()
        fs.unlinkSync(path.resolve(imageFile))
      })
    })

    describe('when building image with invalid cache source', function () {
      var imageFile
      var imageName
      var gogglesMock
      var dockerMock

      before(function () {
        imageFile = 'spec/.custom.json'
        imageName = 'npm/npm-test'

        dockerMock = sinon.mock(docker)
        dockerMock
          .expects('pull')
          .withArgs('npm/npm-test:1.0.0')
          .once()
          .rejects(new Error('no such thing'))

        dockerMock
          .expects('build')
          .withArgs(imageName, {
            args: undefined,
            cacheFrom: undefined,
            working: './spec',
            file: 'Dockerfile.test'
          })
          .once()
          .resolves({})

        dockerMock
          .expects('tagImage')
          .withArgs(imageName)
          .resolves({})

        dockerMock
          .expects('pushTags')
          .withArgs(imageName)
          .resolves()

        gogglesMock = sinon.mock(goggles)
        gogglesMock
          .expects('getInfo')
          .withArgs({ repo: './spec', tags: [ 'lt', 'v_c_s' ] })
          .resolves({
            tag: [ 'latest', '1.1.1_10_a1b2c3d4' ]
          })
          .once()

        return shipwright.buildImage({
          ltsOnly: true,
          repo: 'npm',
          name: 'test',
          namePrefix: 'npm-',
          workingPath: './spec',
          dockerFile: 'Dockerfile.test',
          tags: [ 'lt', 'v_c_s' ],
          output: '.custom.json',
          cacheFrom: 'npm/npm-test:1.0.0',
          defaultInfo: {
            isLTS: true
          }
        })
      })

      it('should log build start', function () {
        log.should.have.been.calledWith(
          `Building Docker image '${imageName}'.`
        )
      })

      it('should log caching source', function () {
        log.should.have.been.calledWith(
          `Attempting to pull image 'npm/npm-test:1.0.0' to use as cache baseline.`
        )
      })

      it('should log pull failure', function () {
        log.should.have.been.calledWith(
          `Docker failed to pull cache image 'npm/npm-test:1.0.0', building without cache argument: no such thing`
        )
      })

      it('should log build complete', function () {
        log.should.have.been.calledWith(
          `Docker image '${imageName}' built successfully.`
        )
      })

      it('should log tag started', function () {
        log.should.have.been.calledWith('Tagging image.')
      })

      it('should log push started', function () {
        log.should.have.been.calledWith('Pushing image.')
      })

      it('should log push success', function () {
        log.should.have.been.calledWith(
          `Docker image '${imageName}' was pushed successfully with tags: latest, 1.1.1_10_a1b2c3d4`
        )
      })

      it('should log writing image file', function () {
        log.should.have.been.calledWith(
          `Writing image file to '${imageFile}'.`
        )
      })

      it('should write correct info to file', function () {
        var json = JSON.parse(fs.readFileSync(imageFile, 'utf8'))
        json.should.eql({
          image: imageName,
          tags: [ 'latest', '1.1.1_10_a1b2c3d4' ]
        })
      })

      it('should log writing image file success', function () {
        log.should.have.been.calledWith(
          `Image file written to '${imageFile}' successfully.`
        )
      })

      after(function () {
        dockerMock.verify()
        gogglesMock.verify()
        fs.unlinkSync(path.resolve(imageFile))
      })
    })

    describe('when building image with build arguments', function () {
      var imageFile
      var imageName
      var gogglesMock
      var dockerMock
      var exitSpy

      before(function () {
        imageFile = 'spec/.custom.json'
        imageName = 'npm/npm-test'
        exitSpy = sinon.spy()
        captureExit(exitSpy)
        dockerMock = sinon.mock(docker)
        dockerMock
          .expects('pull')
          .withArgs('npm/npm-test:1.0.0')
          .once()
          .rejects(new Error('no such thing'))

        dockerMock
          .expects('build')
          .withArgs(imageName, {
            working: './spec',
            file: 'Dockerfile.test',
            cacheFrom: undefined,
            args: {
              one: 'two',
              you: '"know what to do"'
            }
          })
          .once()
          .resolves({})

        dockerMock
          .expects('tagImage')
          .withArgs(imageName)
          .resolves({})

        dockerMock
          .expects('pushTags')
          .withArgs(imageName)
          .resolves()

        gogglesMock = sinon.mock(goggles)
        gogglesMock
          .expects('getInfo')
          .withArgs({ repo: './spec', tags: [ 'lt', 'v_c_s' ] })
          .resolves({
            tag: [ 'latest', '1.1.1_10_a1b2c3d4' ]
          })
          .once()

        return shipwright.buildImage({
          ltsOnly: true,
          repo: 'npm',
          name: 'test',
          namePrefix: 'npm-',
          workingPath: './spec',
          dockerFile: 'Dockerfile.test',
          buildArgs: { one: 'two', you: '"know what to do"' },
          tags: [ 'lt', 'v_c_s' ],
          output: '.custom.json',
          cacheFrom: 'npm/npm-test:1.0.0',
          defaultInfo: {
            isLTS: true
          }
        })
      })

      it('should log build start', function () {
        log.should.have.been.calledWith(
          `Building Docker image '${imageName}'.`
        )
      })

      it('should log caching source', function () {
        log.should.have.been.calledWith(
          `Attempting to pull image 'npm/npm-test:1.0.0' to use as cache baseline.`
        )
      })

      it('should log pull failure', function () {
        log.should.have.been.calledWith(
          `Docker failed to pull cache image 'npm/npm-test:1.0.0', building without cache argument: no such thing`
        )
      })

      it('should log build complete', function () {
        log.should.have.been.calledWith(
          `Docker image '${imageName}' built successfully.`
        )
      })

      it('should log tag started', function () {
        log.should.have.been.calledWith('Tagging image.')
      })

      it('should log push started', function () {
        log.should.have.been.calledWith('Pushing image.')
      })

      it('should log push success', function () {
        log.should.have.been.calledWith(
          `Docker image '${imageName}' was pushed successfully with tags: latest, 1.1.1_10_a1b2c3d4`
        )
      })

      it('should log writing image file', function () {
        log.should.have.been.calledWith(
          `Writing image file to '${imageFile}'.`
        )
      })

      it('should write correct info to file', function () {
        var json = JSON.parse(fs.readFileSync(imageFile, 'utf8'))
        json.should.eql({
          image: imageName,
          tags: [ 'latest', '1.1.1_10_a1b2c3d4' ]
        })
      })

      it('should log writing image file success', function () {
        log.should.have.been.calledWith(
          `Image file written to '${imageFile}' successfully.`
        )
      })

      after(function () {
        dockerMock.verify()
        gogglesMock.verify()
        releaseExit()
        fs.unlinkSync(path.resolve(imageFile))
      })
    })
  })

  describe('getting build info', function () {
    var gogglesMock
    before(function () {
      fs.writeFileSync('./spec/.buildinfo.json', '{}', 'utf8')
      gogglesMock = sinon.mock(goggles)
      gogglesMock
        .expects('getInfo')
        .withArgs({ repo: './spec', tags: [ 'v', 'miv' ] })
        .returns(when({}))
        .once()
    })

    it('should resolve', function () {
      return shipwright.getBuildInfo(true, './spec', [ 'v', 'miv' ])
        .should.be.fulfilled
    })

    after(function () {
      gogglesMock.verify()
    })
  })

  describe('failure handler formats', function () {
    it('should log build failure', function () {
      var failure = new Error('fail')
      expect(function () {
        shipwright.onBuildFailed('test', failure)
      }).to.throw(failure)
      log.should.have.been.calledWith(`Docker build for image 'test' failed: ${failure.message}`)
    })

    it('should log push failure', function () {
      var failure = new Error('fail')
      expect(function () {
        shipwright.onPushFailed('test', failure)
      }).to.throw(failure)
      log.should.have.been.calledWith(
        `Pushing the image 'test' failed for some or all tags:\n ${failure.message}`
      )
    })

    it('should log tag failure', function () {
      var failure = new Error('fail')
      expect(function () {
        shipwright.onTagFailed('test', { tag: [ 't1', 't2' ] }, failure)
      }).to.throw(failure)
      log.should.have.been.calledWith(
        `Tagging image 'test' with tags, 't1, t2', failed with error:\n fail`
      )
    })

    it('should log write info failure', function () {
      var failure = new Error('fail')
      expect(function () {
        shipwright.onWriteInfoFailed(failure)
      }).to.throw(failure)
      log.should.have.been.calledWith(
        `Failed to acquire and write build information due to error: ${failure}`
      )
    })
  })

  describe('push image', function () {
    describe('when noPush is true', function () {
      var info
      before(function () {
        return shipwright.pushImage(true, 'test', { info: 'fake' })
          .then(function (x) { info = x })
      })

      it('should resolve to info', function () {
        info.should.eql({ info: 'fake' })
      })

      it('should log skipping push', function () {
        log.should.have.been.calledWith('Skipping push image.')
      })
    })

    describe('when info.continue is false', function () {
      var info
      before(function () {
        return shipwright.pushImage(false, 'test', { continue: false })
          .then(function (x) { info = x })
      })

      it('should resolve to info', function () {
        info.should.eql({ continue: false })
      })

      it('should log skipping push', function () {
        log.should.have.been.calledWith('Skipping push image.')
      })
    })

    describe('when push fails', function () {
      var failure
      var dockerMock
      before(function () {
        failure = new Error('nope')
        dockerMock = sinon.mock(docker)
        dockerMock
          .expects('pushTags')
          .withArgs('test-image')
          .rejects(failure)
      })

      it('should fail on pushTags', function () {
        return shipwright.pushImage(false, 'test-image', {})
          .should.be.rejectedWith(failure)
      })

      it('should log pushing started', function () {
        log.should.have.been.calledWith('Pushing image.')
      })

      after(function () {
        dockerMock.verify()
      })
    })

    describe('when push succeeds', function () {
      var dockerMock
      before(function () {
        dockerMock = sinon.mock(docker)
        dockerMock
          .expects('pushTags')
          .withArgs('test-image')
          .resolves()
      })

      it('should resolve to info on pushTags', function () {
        return shipwright.pushImage(false, 'test-image', { tag: 't1' })
          .should.eventually.eql({ tag: 't1' })
      })

      it('should log pushing started', function () {
        log.should.have.been.calledWith('Pushing image.')
      })

      it('should log success', function () {
        log.should.have.been.calledWith(
          `Docker image 'test-image' was pushed successfully with tags: t1`
        )
      })

      after(function () {
        dockerMock.verify()
      })
    })
  })

  describe('tag image', function () {
    describe('when skipPRs and PR are true', function () {
      var info
      before(function () {
        return shipwright.tagImage(true, 'test-image', { ci: { pullRequest: true } })
          .then(function (x) { info = x })
      })

      it('should resolve to info', function () {
        info.should.eql({ continue: false })
      })

      it('should log skipping tag & push', function () {
        log.should.have.been.calledWith('Skipping tag & push.')
      })
    })

    describe('when info.continue is false', function () {
      var info
      before(function () {
        return shipwright.tagImage(false, 'test-image', { continue: false })
          .then(function (x) { info = x })
      })

      it('should resolve to info', function () {
        info.should.eql({ continue: false })
      })

      it('should log skipping push', function () {
        log.should.have.been.calledWith('Skipping tag & push.')
      })
    })

    describe('when tag fails', function () {
      var failure
      var dockerMock
      before(function () {
        failure = new Error('nope')
        dockerMock = sinon.mock(docker)
        dockerMock.expects('tagImage')
          .withArgs('test-image')
          .rejects(failure)
      })

      it('should fail on tagImage', function () {
        return shipwright.tagImage(false, 'test-image', { tag: 't1' })
          .should.be.rejectedWith(failure)
      })

      it('should log pushing started', function () {
        log.should.have.been.calledWith('Tagging image.')
      })

      after(function () {
        dockerMock.verify()
      })
    })

    describe('when tag succeeds', function () {
      var dockerMock
      before(function () {
        dockerMock = sinon.mock(docker)
        dockerMock.expects('tagImage')
          .withArgs('test-image')
          .resolves({})
      })

      it('should succeed on tagImage', function () {
        return shipwright.tagImage(false, 'test-image', { tag: 't1' })
          .should.eventually.eql({ tag: 't1' })
      })

      it('should log pushing started', function () {
        log.should.have.been.calledWith('Tagging image.')
      })

      after(function () {
        dockerMock.verify()
      })
    })
  })

  describe('write build info', function () {
    describe('with no tags', function () {
      var info
      before(function () {
        return shipwright.writeBuildInfo('./', 'test-image', [], {
          branch: 'master',
          ci: {
            pullRequest: false,
            tagged: false
          }
        }).then(function (x) {
          info = x
        })
      })

      it('should log no tags', function () {
        log.should.have.been.calledWith('No tags were specified, skipping tag and push.')
        log.should.have.been.calledWith(
          'branch - master, PR - false, tagged - false'
        )
      })

      it('should return continue:false', function () {
        info.should.eql({ continue: false })
      })
    })

    describe('when getting build info', function () {
      var gogglesMock
      before(function () {
        gogglesMock = sinon.mock(goggles)
        gogglesMock.expects('getInfo')
          .withArgs({ repo: './', tags: [ 't1' ] })
          .resolves({ fake: true, tag: [ 't1' ] })
      })

      it('should resolve with info', function () {
        return shipwright.writeBuildInfo('./', 'test-image', [ 't1' ])
          .should.eventually.eql({
            continue: true,
            fake: true,
            tag: [ 't1' ]
          })
      })

      it('should call build goggles', function () {
        gogglesMock.verify()
      })
    })

    describe('when getting build info with no valid tags', function () {
      var gogglesMock
      before(function () {
        gogglesMock = sinon.mock(goggles)
        gogglesMock.expects('getInfo')
          .withArgs({ repo: './', tags: [ 't1' ] })
          .resolves({ fake: true, tag: [] })
      })

      it('should resolve with info and continue flagged as false', function () {
        return shipwright.writeBuildInfo('./', 'test-image', [ 't1' ])
          .should.eventually.eql({
            continue: false,
            fake: true,
            tag: []
          })
      })

      it('should call build goggles', function () {
        gogglesMock.verify()
      })
    })
  })

  describe('write image file', function () {
    describe('when info.continue is false', function () {
      var info
      before(function () {
        return shipwright.writeImageFile('./.image.json', 'test-image', { continue: false })
          .then(function (x) { info = x })
      })

      it('should log skipping', function () {
        log.should.have.been.calledWith('Skipping write of image file information.')
      })

      it('should return continue:false', function () {
        info.should.eql({ continue: false })
      })
    })

    describe('when writing image file fails', function () {
      it('should fail', function () {
        return shipwright.writeImageFile('./blorp/mcnope.json', 'test-image', {})
          .should.be.rejectedWith(Error, "ENOENT: no such file or directory, open './blorp/mcnope.json'")
      })

      it('should log writing', function () {
        log.should.have.been.calledWith(`Writing image file to './blorp/mcnope.json'.`)
      })

      it('should log error', function () {
        log.should.have.been.calledWith(
          `Failed to write image file to './blorp/mcnope.json' with error: ENOENT: no such file or directory, open './blorp/mcnope.json'`
        )
      })
    })

    describe('when writing image file succeeds', function () {
      var info
      var imageFile
      before(function () {
        imageFile = './spec/.info.json'
        return shipwright.writeImageFile(imageFile, 'test-image', { tag: [ 't1', 't2' ] })
          .then(function (x) { info = x })
      })

      it('should add image name to info', function () {
        info.should.eql({ imageName: 'test-image', tag: [ 't1', 't2' ] })
      })

      it('should write correct info to file', function () {
        var json = JSON.parse(fs.readFileSync(imageFile, 'utf8'))
        json.should.eql({
          image: 'test-image',
          tags: [ 't1', 't2' ]
        })
      })

      it('should log writing', function () {
        log.should.have.been.calledWith(`Writing image file to '${imageFile}'.`)
      })

      it('should log success', function () {
        log.should.have.been.calledWith(
          `Image file written to '${imageFile}' successfully.`
        )
      })

      after(function () {
        fs.unlinkSync(path.resolve(imageFile))
      })
    })
  })
})
