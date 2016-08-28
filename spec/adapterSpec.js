var webdriver = require('selenium-webdriver');
var common = require('./common.js');
require('../index.js');

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

  it('should allow an empty it block and mark as pending');

  xit('should allow a spec marked as pending with xit', function() {
    expect(true).toBe(false);
  });
});

describe('context', function() {
  beforeEach(function() {
    this.foo = 0;
  });

  it('can use the `this` to share state', function() {
    expect(this.foo).toEqual(0);
    this.bar = 'test pollution?';
  });

  it('prevents test pollution by having an empty `this` created for the next spec', function() {
    expect(this.foo).toEqual(0);
    expect(this.bar).toBe(undefined);
  });
});

describe('webdriverJS Jasmine adapter', function() {
  // Shorten this and you should see tests timing out.
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 2000;
  var beforeEachMsg;

  beforeEach(function() {
    jasmine.addMatchers(common.getMatchers());
  });

  beforeEach(function() {
    fakeDriver.setUp().then(function(value) {
      beforeEachMsg = value;
    });
  });

  afterEach(function() {
    beforeEachMsg = '';
  });

  it('should pass normal synchronous tests', function() {
    expect(true).toEqual(true);
  });

  it('should compare a promise to a primitive', function() {
    expect(fakeDriver.getValueA()).toEqual('a');
    expect(fakeDriver.getValueB()).toEqual('b');
  });

  it('should compare a primitive to a promise', function() {
    expect('a').toEqual(fakeDriver.getValueA());
    expect('b').toEqual(fakeDriver.getValueB());
  });

  it('beforeEach should wait for control flow', function() {
    expect(beforeEachMsg).toEqual('setup done');
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

  it('should allow iterating through arrays', function() {
    // This is a convoluted test which shows a real issue which
    // cropped up in version changes to the selenium-webdriver module.
    // See https://github.com/angular/protractor/pull/2263
    var checkTexts = function(webElems) {
      var texts = webElems.then(function(arr) {
        var results = arr.map(function(webElem) {
          return webElem.getText();
        });
        return webdriver.promise.all(results);
      });

      expect(texts).not.toContain('e');

      return true;
    };

    fakeDriver.getValueList().then(function(list) {
      var result = list.map(function(webElem) {
        var webElemsPromise = webdriver.promise.fulfilled(webElem).then(function(webElem) {
          return [webElem];
        });
        return webdriver.promise.fullyResolved(checkTexts(webElemsPromise));
      });
      return webdriver.promise.all(result);
    });
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

    it('should allow custom matchers to return a promise when actual is not a promise', function() {
      expect(fakeDriver.displayedElement).toBeDisplayed();
      expect(fakeDriver.hiddenElement).not.toBeDisplayed();
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

  describe('beforeAll and afterAll', function() {
    var asyncValue, setupMsg;

    beforeAll(function(done) {
      setTimeout(function() {
        asyncValue = 5;
        done();
      }, 500);
    });

    beforeAll(function() {
      fakeDriver.setUp().then(function(msg) {
        setupMsg = msg;
      });
    });

    afterAll(function() {
      setupMsg = '';
    });

    it('should have set asyncValue', function() {
      expect(asyncValue).toEqual(5);
    });

    it('should wait for control flow', function() {
      expect(setupMsg).toEqual('setup done');
    });
  });

  describe('it return value', function() {
    var spec1 = it('test1');
    var spec2 = it('test2', function() {});
    var spec3 = it('test3', function() {}, 1);

    it('should return the spec', function() {
      expect(spec1.description).toBe('test1');
      expect(spec2.description).toBe('test2');
      expect(spec3.description).toBe('test3');
    });
  });
});
