require('./setup.js')
const fs = require('fs')
const path = require('path')
const when = require('when')

const log = sinon.spy(function () {})
const goggles = {
  getInfo: function () {}
}
const docker = {
  build: function () {},
  pushTags: function () {},
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
const dockyard = require('../src/index')(log, goggles, dockerFactory, settings)

describe('Dockyard', function () {
  describe('build image', function () {
    describe('when LTS only and version is not LTS', function () {
      var result
      before(function () {
        return dockyard.buildImage({ ltsOnly: true, defaultInfo: { isLTS: false } })
          .then(function (x) { result = x })
      })

      it('should resolve to empty object', function () {
        result.should.eql({})
      })

      it('should log skipping build', function () {
        log.should.have.been.calledWith(
          'Skipping build - Node version (%s) is not LTS',
          process.version
        )
      })
    })

    describe('when building image with explicit tag', function () {
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
          .withArgs(imageName, './spec', 'Dockerfile.test')
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
            tag: [ '1.1.1_10_a1b2c3d4' ]
          })
          .once()

        return dockyard.buildImage({
          ltsOnly: true,
          repo: 'npm',
          name: 'test',
          namePrefix: 'npm-',
          workingPath: './spec',
          dockerFile: './spec/Dockerfile.test',
          tags: [ 'v_c_s' ],
          output: '.custom.json',
          defaultInfo: {
            isLTS: true
          }
        })
      })

      it('should log build start', function () {
        log.should.have.been.calledWith(
          "Building Docker image '%s'.",
          imageName
        )
      })

      it('should log build complete', function () {
        log.should.have.been.calledWith(
          "Docker image '%s' built successfully.",
          imageName
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
          "Docker image '%s' was pushed successfully with tags: %s",
          imageName,
          [ '1.1.1_10_a1b2c3d4' ]
        )
      })

      it('should log writing image file', function () {
        log.should.have.been.calledWith(
          "Writing image file to '%s'.",
          imageFile
        )
      })

      it('should write correct info to file', function () {
        var json = JSON.parse(fs.readFileSync(imageFile, 'utf8'))
        json.should.eql({
          image: imageName,
          tags: [ '1.1.1_10_a1b2c3d4' ]
        })
      })

      it('should log writing image file success', function () {
        log.should.have.been.calledWith(
          "Image file written to '%s' successfully.",
          imageFile
        )
      })

      after(function () {
        dockerMock.verify()
        gogglesMock.verify()
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
          .withArgs(imageName, './spec', 'Dockerfile.test')
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

        return dockyard.buildImage({
          ltsOnly: true,
          repo: 'npm',
          name: 'test',
          namePrefix: 'npm-',
          workingPath: './spec',
          dockerFile: './spec/Dockerfile.test',
          tags: [ 'lt', 'v_c_s' ],
          output: '.custom.json',
          defaultInfo: {
            isLTS: true
          }
        })
      })

      it('should log build start', function () {
        log.should.have.been.calledWith(
          "Building Docker image '%s'.",
          imageName
        )
      })

      it('should log build complete', function () {
        log.should.have.been.calledWith(
          "Docker image '%s' built successfully.",
          imageName
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
          "Docker image '%s' was pushed successfully with tags: %s",
          imageName,
          [ 'latest', '1.1.1_10_a1b2c3d4' ]
        )
      })

      it('should log writing image file', function () {
        log.should.have.been.calledWith(
          "Writing image file to '%s'.",
          imageFile
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
          "Image file written to '%s' successfully.",
          imageFile
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
          .withArgs(imageName, './spec', 'Dockerfile.test')
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

        return dockyard.buildImage({
          ltsOnly: true,
          alwaysBuild: true,
          repo: 'npm',
          name: 'test',
          namePrefix: 'npm-',
          workingPath: './spec',
          dockerFile: './spec/Dockerfile.test',
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
          "Building Docker image '%s'.",
          imageName
        )
      })

      it('should log build complete', function () {
        log.should.have.been.calledWith(
          "Docker image '%s' built successfully.",
          imageName
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
          "Docker image '%s' was pushed successfully with tags: %s",
          imageName,
          [ 'my-branch_1.1.1_10_a1b2c3d4' ]
        )
      })

      it('should log writing image file', function () {
        log.should.have.been.calledWith(
          "Writing image file to '%s'.",
          imageFile
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
          "Image file written to '%s' successfully.",
          imageFile
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
      return dockyard.getBuildInfo(true, './spec', [ 'v', 'miv' ])
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
        dockyard.onBuildFailed('test', failure)
      }).to.throw(failure)
      log.should.have.been.calledWith("Docker build for image '%s' failed: %s", 'test', 'fail')
    })

    it('should log push failure', function () {
      var failure = new Error('fail')
      expect(function () {
        dockyard.onPushFailed('test', failure)
      }).to.throw(failure)
      log.should.have.been.calledWith(
        "Pushing the image '%s' failed for some or all tags:\n %s",
        'test',
        failure.message
      )
    })

    it('should log tag failure', function () {
      var failure = new Error('fail')
      expect(function () {
        dockyard.onTagFailed('test', { tag: [ 't1', 't2' ] }, failure)
      }).to.throw(failure)
      log.should.have.been.calledWith(
        "Tagging image '%s' with tags, '%s', failed with error:\n %s",
        'test',
        [ 't1', 't2' ],
        failure
      )
    })

    it('should log write info failure', function () {
      var failure = new Error('fail')
      expect(function () {
        dockyard.onWriteInfoFailed(failure)
      }).to.throw(failure)
      log.should.have.been.calledWith(
        'Failed to acquire and write build information due to error: %s',
        failure
      )
    })
  })

  describe('push image', function () {
    describe('when noPush is true', function () {
      var info
      before(function () {
        return dockyard.pushImage(true, 'test', { info: 'fake' })
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
        return dockyard.pushImage(false, 'test', { continue: false })
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
        return dockyard.pushImage(false, 'test-image', {})
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
        return dockyard.pushImage(false, 'test-image', { tag: 't1' })
          .should.eventually.eql({ tag: 't1' })
      })

      it('should log pushing started', function () {
        log.should.have.been.calledWith('Pushing image.')
      })

      it('should log success', function () {
        log.should.have.been.calledWith(
          "Docker image '%s' was pushed successfully with tags: %s",
          'test-image',
          't1'
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
        return dockyard.tagImage(true, 'test-image', { ci: { pullRequest: true } })
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
        return dockyard.tagImage(false, 'test-image', { continue: false })
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
        return dockyard.tagImage(false, 'test-image', { tag: 't1' })
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
        return dockyard.tagImage(false, 'test-image', { tag: 't1' })
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
        return dockyard.writeBuildInfo('./', 'test-image', [], {
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
          'branch - %s, PR - %s, tagged - %s',
          'master',
          false,
          false
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
        return dockyard.writeBuildInfo('./', 'test-image', [ 't1' ])
          .should.eventually.eql({
            continue: true,
            fake: true,
            tag: [ 't1' ]
          })
      })
    })
  })

  describe('write image file', function () {
    describe('when info.continue is false', function () {
      var info
      before(function () {
        return dockyard.writeImageFile('./.image.json', 'test-image', { continue: false })
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
        return dockyard.writeImageFile('./blorp/mcnope.json', 'test-image', {})
          .should.be.rejectedWith(Error, "ENOENT: no such file or directory, open './blorp/mcnope.json'")
      })

      it('should log writing', function () {
        log.should.have.been.calledWith("Writing image file to '%s'.", './blorp/mcnope.json')
      })

      it('should log error', function () {
        log.should.have.been.calledWith(
          "Failed to write image file to '%s' with error: %s",
          './blorp/mcnope.json',
          sinon.match.has('message', "ENOENT: no such file or directory, open './blorp/mcnope.json'")
        )
      })
    })

    describe('when writing image file succeeds', function () {
      var info
      var imageFile
      before(function () {
        imageFile = './spec/.info.json'
        return dockyard.writeImageFile(imageFile, 'test-image', { tag: [ 't1', 't2' ] })
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
        log.should.have.been.calledWith("Writing image file to '%s'.", imageFile)
      })

      it('should log success', function () {
        log.should.have.been.calledWith(
          "Image file written to '%s' successfully.",
          imageFile
        )
      })

      after(function () {
        fs.unlinkSync(path.resolve(imageFile))
      })
    })
  })
})
