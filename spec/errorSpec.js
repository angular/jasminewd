var webdriver = require('selenium-webdriver');
var common = require('./common.js');

/**
 * Error tests for the WebDriverJS Jasmine-Node Adapter. These tests use
 * WebDriverJS's control flow and promises without setting up the whole
 * webdriver.
 */

var fakeDriver = common.getFakeDriver();

describe('Timeout cases', function() {
  it('should timeout after 200ms', function(done) {
    expect(fakeDriver.getValueA()).toEqual('a');
  }, 200);
  
  it('should timeout after 300ms', function() {
    fakeDriver.sleep(9999);
    expect(fakeDriver.getValueB()).toEqual('b');
  }, 300);

  it('should pass after the timed out tests', function() {
    expect(true).toEqual(true);
  });
});

describe('things that should fail', function() {
  beforeEach(function() {
    jasmine.addMatchers(common.getMatchers());
  });

  it('should pass errors from done callback', function(done) {
    done.fail('an error from done.fail');
  });

  it('should error asynchronously in promise callbacks', function() {
    fakeDriver.sleep(50).then(function() {
      expect(true).toEqual(false);
    });
  });

  it('should error asynchronously within done callback', function(done) {
    setTimeout(function() {
      expect(false).toEqual(true);
      done();
    }, 200);
  });

  it('should fail normal synchronous tests', function() {
    expect(true).toBe(false);
  });

  it('should fail when an error is thrown', function() {
    throw new Error('I am an intentional error');
  });

  it('should compare a promise to a primitive', function() {
    expect(fakeDriver.getValueA()).toEqual('d');
    expect(fakeDriver.getValueB()).toEqual('e');
  });

  it('should wait till the expect to run the flow', function() {
    var promiseA = fakeDriver.getValueA();
    expect(promiseA.isPending()).toBe(true);
    expect(promiseA).toEqual('a');
    expect(promiseA.isPending()).toBe(false);
  });

  it('should compare a promise to a promise', function() {
    expect(fakeDriver.getValueA()).toEqual(fakeDriver.getValueB());
  });

  it('should still allow use of the underlying promise', function() {
    var promiseA = fakeDriver.getValueA();
    promiseA.then(function(value) {
      expect(value).toEqual('b');
    });
  });

  it('should allow scheduling of tasks', function() {
    fakeDriver.sleep(300);
    expect(fakeDriver.getValueB()).toEqual('c');
  });

  it('should allow the use of custom matchers', function() {
    expect(1000).toBeLotsMoreThan(999);
    expect(fakeDriver.getBigNumber()).toBeLotsMoreThan(1110);
    expect(fakeDriver.getBigNumber()).not.toBeLotsMoreThan(fakeDriver.getSmallNumber());
    expect(fakeDriver.getSmallNumber()).toBeLotsMoreThan(fakeDriver.getBigNumber());
  });

  it('should allow custom matchers to return a promise', function() {
    expect(fakeDriver.getDisplayedElement()).not.toBeDisplayed();
    expect(fakeDriver.getHiddenElement()).toBeDisplayed();
  });

  it('should pass multiple arguments to matcher', function() {
    // Passing specific precision
    expect(fakeDriver.getDecimalNumber()).toBeCloseTo(3.5, 1);

    // Using default precision (2)
    expect(fakeDriver.getDecimalNumber()).toBeCloseTo(3.1);
    expect(fakeDriver.getDecimalNumber()).not.toBeCloseTo(3.14);
  });

  describe('native promises', function() {
    var testADone = false;

    it('should handle rejection from native promise', function() {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          fakeDriver.sleep(100).then(function() {
            testADone = true;
          });
          reject('Rejected promise');
        }, 100);
      });
    });

    it('should not start a test before another finishes', function(done) {
      expect(testADone).toBe(true); // this test actually passes
      setTimeout(done, 200);
    });
  });
});
