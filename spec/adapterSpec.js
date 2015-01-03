var webdriver = require('selenium-webdriver');
var common = require('./common.js');

/**
 * Tests for the WebDriverJS Jasmine-Node Adapter. These tests use
 * WebDriverJS's control flow and promises without setting up the whole
 * webdriver.
 */

var fakeDriver = common.getFakeDriver();

describe('webdriverJS Jasmine adapter plain', function() {
  it('should pass normal synchronous tests', function() {
    expect(true).toBe(true);
  });
});


describe('webdriverJS Jasmine adapter', function() {
  // Shorten this and you should see tests timing out.
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 2000;

  beforeEach(function() {
    jasmine.addMatchers(common.getMatchers());
  });

  beforeEach(function() {
    fakeDriver.setUp().then(function(value) {
      // console.log('This should print before each test: ' + value);
    });
  });

  it('should pass normal synchronous tests', function() {
    expect(true).toEqual(true);
  });

  it('should compare a promise to a primitive', function() {
    expect(fakeDriver.getValueA()).toEqual('a');
    expect(fakeDriver.getValueB()).toEqual('b');
  });

  it('should wait till the expect to run the flow', function() {
    var promiseA = fakeDriver.getValueA();
    expect(promiseA.isPending()).toBe(true);
    expect(promiseA).toEqual('a');
    expect(promiseA.isPending()).toBe(true);
  });

  it('should compare a promise to a promise', function() {
    expect(fakeDriver.getValueA()).toEqual(fakeDriver.getOtherValueA());
  });

  it('should still allow use of the underlying promise', function() {
    var promiseA = fakeDriver.getValueA();
    promiseA.then(function(value) {
      expect(value).toEqual('a');
    });
  });

  it('should allow scheduling of tasks', function() {
    fakeDriver.sleep(300);
    expect(fakeDriver.getValueB()).toEqual('b');
  });

  it('should allow the use of custom matchers', function() {
    expect(500).toBeLotsMoreThan(3);
    expect(fakeDriver.getBigNumber()).toBeLotsMoreThan(33);
    expect(fakeDriver.getBigNumber()).toBeLotsMoreThan(fakeDriver.getSmallNumber());
    expect(fakeDriver.getSmallNumber()).not.toBeLotsMoreThan(fakeDriver.getBigNumber());
  });

  it('should allow custom matchers to return a promise', function() {
    expect(fakeDriver.getDisplayedElement()).toBeDisplayed();
    expect(fakeDriver.getHiddenElement()).not.toBeDisplayed();
  });

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

  it('should throw an error with a WebElement actual value', function() {
    var webElement = new webdriver.WebElement(fakeDriver, 'idstring');

    expect(function() {
      expect(webElement).toEqual(4);
    }).toThrow('expect called with WebElement argument, expected a Promise. ' +
        'Did you mean to use .getText()?');
  });

  it('should pass after the timed out tests', function() {
    expect(fakeDriver.getValueA()).toEqual('a');
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
});
