const mocha = require('mocha');
const [describe, it, beforeEach] = [mocha.describe, mocha.it, mocha.beforeEach];
const assert = require('assert');
const chip = require('../src/chip');

describe('instruction', function() {
  
  beforeEach(function() {
    chip.V.fill(0);
  });
  
  
  describe('MOVE const', function() {
    it('should assign register to a constant value', function() {
      chip.execute('6005'); // set V0 to 0x05
      chip.execute('64FF'); // set V4 to 0xff (255)
      chip.execute('6E1D'); // set VE to 0x1D (V14 to 29)
      assert.equal(0x05, chip.V[0x0]);
      assert.equal(0xFF, chip.V[0x4]);
      assert.equal(0x1D, chip.V[0xE]);
    });
  });

  describe('MOVE', function() {
    it('should assign the value of a register to the value of another', function() {
      chip.V[0x0] = 0x06;
      chip.execute('8100'); // set V1 to V0
      chip.execute('8200'); // set V2 to V1
      chip.execute('8C20'); // set VC to V2
      assert.equal(0x06, chip.V[0x0]);
      assert.equal(0x06, chip.V[0x1]);
      assert.equal(0x06, chip.V[0x2]);
      assert.equal(0x06, chip.V[0xC]);
    });
  });

  describe('ADD const', function() {
    it('should add a constant to to a the register', function() {
      chip.execute('7011'); // add 0x11 to V0
      chip.execute('7005'); // add 0x05 to V0
      chip.execute('7887'); // add 0x87 to V8
      chip.execute('7810'); // add 0x10 to V8
      chip.execute('706E'); // add 0x6E to V0
      assert.equal(0x11 + 0x05 + 0x6E, chip.V[0x0]);
      assert.equal(0x87 + 0x10, chip.V[0x8]);
    });
  });

  describe('ADD', function() {
    it('should add two registers', function() {
      // TODO: overflow check
      chip.V[0x8] = 0x07;
      chip.V[0xA] = 0x03;
      chip.V[0x4] = 0x02;
      chip.execute('84A4'); // V4 += VA (V4=5)
      chip.execute('88A4'); // V8 += VA (V8=10)
      chip.execute('8844'); // V8 += V4 (V8=15)
      assert.equal(0x05, chip.V[0x4]);
      assert.equal(0x0F, chip.V[0x8]);
      assert.equal(0x03, chip.V[0xA]);
    });
  });

  describe('SUB', function() {
    it('should subtract one register from another', function() {
      // TODO: underflow check
      chip.V[0x0] = 0x06;
      chip.V[0x1] = 0x05;
      chip.V[0x2] = 0x01;
      chip.execute('8015'); // V0 = V0 - V1 (V0 = 1)
      chip.execute('8105'); // V1 = V1 - V0 (V1 = 4)
      chip.execute('8325'); // V3 = V3 - V2 (V3 = -1 = 255)
      assert.equal(0x01, chip.V[0x0]);
      assert.equal(0x04, chip.V[0x1]);
      assert.equal(0x01, chip.V[0x2]);
      assert.equal(0xFF, chip.V[0x3]);
    });
  });
});
