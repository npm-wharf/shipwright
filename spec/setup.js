var chai = require('chai')
chai.should()
global.expect = chai.expect
chai.use(require('chai-as-promised'))

global.sinon = require('sinon')
var sinonChai = require('sinon-chai')
chai.use(sinonChai)
