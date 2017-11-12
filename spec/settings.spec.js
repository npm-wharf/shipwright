require('./setup.js')
const fs = require('fs')
const path = require('path')
const when = require('when')

const goggles = {
  getInfo: function () {}
}

const settings = require('../src/settings')(goggles)

describe('Settings', function () {
  describe('getting defaults', function () {
    describe('default info', function () {
      var gogglesMock
      before(function () {
        fs.writeFileSync('.buildinfo.json', '{}', 'utf8')
        gogglesMock = sinon.mock(goggles)
        gogglesMock
          .expects('getInfo')
          .withArgs({ repo: path.resolve('./'), tags: undefined })
          .returns(when({}))
          .once()
      })

      it('should get default info', function () {
        return settings.getDefaultInfo()
          .should.be.fulfilled
      })

      after(function () {
        gogglesMock.verify()
      })
    })

    it('should get default Dockerfile', function () {
      settings.getDefaultDockerfile().should.equal(path.resolve('./Dockerfile'))
    })

    it('should get default name', function () {
      settings.getDefaultName({ path: path.resolve('./') }).should.equal('dockyard')
    })

    it('should get default tags when tagged', function () {
      settings.getDefaultTagSpecs([], { ci: { tagged: true } })
        .should.eql([ 'lt', 'v_s', 'v', 'miv', 'ma' ])
    })

    it('should get default tags when on master branch', function () {
      settings.getDefaultTagSpecs([], { branch: 'master' })
        .should.eql([ 'v_c_s' ])
    })

    it('should get default tags when commit message has [build-image]', function () {
      settings.getDefaultTagSpecs([], { commitMessage: 'this has a [build-image], something should happen' })
        .should.eql([ 'b_v_c_s' ])
    })

    it('should get default tags when branch name matches', function () {
      settings.getDefaultTagSpecs(['branch-one', 'branch-two'], {branch: 'branch-one'})
        .should.eql(['b_v_c_s'])
    })

    it('should get empty tags default tags', function () {
      settings.getDefaultTagSpecs([], {})
        .should.eql([])
    })

    it('should get default working path', function () {
      settings.getDefaultWorkingPath().should.eql(path.resolve('./'))
    })
  })
})
