require('../index.js');
var webdriver = require('selenium-webdriver');

/**
 * Tests for the WebDriverJS Jasmine-Node Adapter. These tests use
 * WebDriverJS's control flow and promises without setting up the whole
 * webdriver.
 */

var getFakeDriver = function() {
  var flow = webdriver.promise.controlFlow();
  return {
    controlFlow: function() {
      return flow;
    },
    sleep: function(ms) {
      return flow.timeout(ms);
    },
    setUp: function() {
      return flow.execute(function() {
        return webdriver.promise.fulfilled('setup done');
      });
    },
    getValueA: function() {
      return flow.execute(function() {
        return webdriver.promise.delayed(500).then(function() {
          return webdriver.promise.fulfilled('a');
        });
      });
    },
    getOtherValueA: function() {
      return flow.execute(function() {
        return webdriver.promise.fulfilled('a');
      });
    },
    getValueB: function() {
      return flow.execute(function() {
        return webdriver.promise.fulfilled('b');
      });
    },
    getSmallNumber: function() {
      return flow.execute(function() {
        return webdriver.promise.fulfilled(11);
      });
    },
    getBigNumber: function() {
      return flow.execute(function() {
        return webdriver.promise.fulfilled(1111);
      });
    },
    getDecimalNumber: function() {
        return flow.execute(function() {
          return webdriver.promise.fulfilled(3.14159);
        });
      },
    getDisplayedElement: function() {
      return flow.execute(function() {
        return webdriver.promise.fulfilled({
          isDisplayed: function() {
            return webdriver.promise.fulfilled(true);
          }
        });
      });
    },
    getHiddenElement: function() {
      return flow.execute(function() {
        return webdriver.promise.fulfilled({
          isDisplayed: function() {
            return webdriver.promise.fulfilled(false);
          }
        });
      });
    }
  };
};

var fakeDriver = getFakeDriver();

describe('webdriverJS Jasmine adapter plain', function() {
  it('should pass normal synchronous tests', function() {
    expect(true).toBe(true);
  });
});


describe('webdriverJS Jasmine adapter', function() {
  // Shorten this and you should see tests timing out.
  jasmine.getEnv().defaultTimeoutInterval = 2000;

  beforeEach(function() {
    jasmine.addMatchers({
      toBeLotsMoreThan: function(util) {
        return {
          compare: function(actual, expected) {
            return {
              pass: actual > expected + 100
            };
          }
        };
      },
      // Example custom matcher returning a promise that resolves to true/false.
      toBeDisplayed: function(util) {
        return {
          compare: function(actual, expected) {
            return {
              // PROBLEM HERE - this is a promise, not true/false. We can't
              // get at this without patching jasmine's wrapCompare.
              // Maybe we can fix by adding a custom comparer?
              pass: actual.isDisplayed()
            };
          }
        };
      }
    });
  });

  beforeEach(function() {
    fakeDriver.setUp().then(function(value) {
      console.log('This should print before each test: ' + value);
    });
  });

  // GOOD
  it('should pass normal synchronous tests', function() {
    expect(true).toEqual(true);
  });

  // GOOD
  it('should compare a promise to a primitive', function() {
    expect(fakeDriver.getValueA()).toEqual('a');
    expect(fakeDriver.getValueB()).toEqual('b');
  });

  // GOOD
  it('should wait till the expect to run the flow', function() {
    var promiseA = fakeDriver.getValueA();
    expect(promiseA.isPending()).toBe(true);
    expect(promiseA).toEqual('a');
    expect(promiseA.isPending()).toBe(true);
  });

  // GOOD
  it('should compare a promise to a promise', function() {
    expect(fakeDriver.getValueA()).toEqual(fakeDriver.getOtherValueA());
  });

  // GOOD
  it('should still allow use of the underlying promise', function() {
    var promiseA = fakeDriver.getValueA();
    promiseA.then(function(value) {
      expect(value).toEqual('a');
    });
  });

  // GOOD
  it('should allow scheduling of tasks', function() {
    fakeDriver.sleep(300);
    expect(fakeDriver.getValueB()).toEqual('b');
  });

  // GOOD
  it('should allow the use of custom matchers', function() {
    expect(1000).toBeLotsMoreThan(400);
    expect(fakeDriver.getBigNumber()).toBeLotsMoreThan(400);
    expect(fakeDriver.getBigNumber()).toBeLotsMoreThan(fakeDriver.getSmallNumber());
    expect(fakeDriver.getSmallNumber()).not.toBeLotsMoreThan(fakeDriver.getBigNumber());
  });

  // BAD - problem with the way custom matchers are now registered.
  // Unless we want to patch a whole lot of stuff about how Jasmine
  // deals with matchers, matchers now can't return promises.
  xit('should allow custom matchers to return a promise', function() {
    expect(fakeDriver.getDisplayedElement()).toBeDisplayed();
    expect(fakeDriver.getHiddenElement()).toBeDisplayed();
  });

  // GOOD
  it('should pass multiple arguments to matcher', function() {
    // Passing specific precision
    expect(fakeDriver.getDecimalNumber()).toBeCloseTo(3.1, 1);
    expect(fakeDriver.getDecimalNumber()).not.toBeCloseTo(3.1, 2);

    // Using default precision (2)
    expect(fakeDriver.getDecimalNumber()).not.toBeCloseTo(3.1);
    expect(fakeDriver.getDecimalNumber()).toBeCloseTo(3.14);
  });

  describe('not', function() {
    it('should still pass normal synchronous tests', function() {
      expect(4).not.toEqual(5);
    });

    it('should compare a promise to a primitive', function() {
      expect(fakeDriver.getValueA()).not.toEqual('b');
    });

    it('should compare a promise to a promise', function() {
      expect(fakeDriver.getValueA()).not.toEqual(fakeDriver.getValueB());
    });
  });

  // Uncomment to see timeout failures.

  // TODO - these don't work anymore. Custom timeouts are no longer possible.

  // it('should timeout after 200ms', function() {
  //   expect(fakeDriver.getValueA()).toEqual('a');
  // }, 200);

  // it('should timeout after 300ms', function() {
  //   fakeDriver.sleep(9999);
  //   expect(fakeDriver.getValueB()).toEqual('b');
  // }, 300);

  it('should time out', function() {
    fakeDriver.sleep(9999);
    expect(fakeDriver.getValueB()).toEqual('b');
  });

  // TODO - this doesn't work anymore. See https://github.com/pivotal/jasmine/issues/567
  // it('should pass errors from done callback', function(done) {
  //   done('an error');
  // });

  it('should pass after the timed out tests', function() {
    expect(true).toEqual(true);
  });

  describe('should work for both synchronous and asynchronous tests', function() {
    var x;

    beforeEach(function() {
      x = 0;
    });

    afterEach(function() {
      expect(x).toBe(1);
    });

    it('should execute a synchronous test', function() {
      x = 1;
    });

    it('should execute an asynchronous test', function(done) {
      setTimeout(function(){
        x = 1;
        done();
      }, 500);
    });
  });

  xdescribe('things that should fail', function() {
    it('should fail normal synchronous tests', function() {
      expect(true).toBe(false);
    });

    it('should compare a promise to a primitive', function() {
      expect(fakeDriver.getValueA()).toEqual('d');
      expect(fakeDriver.getValueB()).toEqual('e');
    });

    // GOOD
    it('should wait till the expect to run the flow', function() {
      var promiseA = fakeDriver.getValueA();
      expect(promiseA.isPending()).toBe(true);
      expect(promiseA).toEqual('a');
      expect(promiseA.isPending()).toBe(false);
    });

    // GOOD
    it('should compare a promise to a promise', function() {
      expect(fakeDriver.getValueA()).toEqual(fakeDriver.getValueB());
    });

    // GOOD
    it('should still allow use of the underlying promise', function() {
      var promiseA = fakeDriver.getValueA();
      promiseA.then(function(value) {
        expect(value).toEqual('b');
      });
    });

    // GOOD
    it('should allow scheduling of tasks', function() {
      fakeDriver.sleep(300);
      expect(fakeDriver.getValueB()).toEqual('c');
    });

    // GOOD
    it('should allow the use of custom matchers', function() {
      expect(1000).toBeLotsMoreThan(999);
      expect(fakeDriver.getBigNumber()).toBeLotsMoreThan(1110);
      expect(fakeDriver.getBigNumber()).not.toBeLotsMoreThan(fakeDriver.getSmallNumber());
      expect(fakeDriver.getSmallNumber()).toBeLotsMoreThan(fakeDriver.getBigNumber());
    });

    // BAD - problem with the way custom matchers are now registered.
    // Unless we want to patch a whole lot of stuff about how Jasmine
    // deals with matchers, matchers now can't return promises.
    xit('should allow custom matchers to return a promise', function() {
      expect(fakeDriver.getDisplayedElement()).toBeDisplayed();
      expect(fakeDriver.getHiddenElement()).toBeDisplayed();
    });

    // GOOD
    it('should pass multiple arguments to matcher', function() {
      // Passing specific precision
      expect(fakeDriver.getDecimalNumber()).toBeCloseTo(3.5, 1);

      // Using default precision (2)
      expect(fakeDriver.getDecimalNumber()).toBeCloseTo(3.1);
      expect(fakeDriver.getDecimalNumber()).not.toBeCloseTo(3.14);
    });
  });
});
