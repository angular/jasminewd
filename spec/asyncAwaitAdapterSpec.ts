import {promise as wdpromise, WebElement} from 'selenium-webdriver';
const common = require('./common');

declare function expect(actual: any): any;
declare function describe(description: string, tests: Function): void;
declare function it(description: string, test?: Function, timeout?: number): any;
declare function xit(description: string, test?: Function, timeout?: number): any;
declare function beforeEach(setup: Function): void;
declare function beforeAll(setup: Function): void;
declare function afterEach(setup: Function): void;
declare function afterAll(setup: Function): void;
declare var jasmine;

/**
 * This file is very similar to adapterSpec.ts, but we use async/await instead
 * of the WebDriver Control Flow for synchronization. These tests are desgined
 * to work regardless of if the WebDriver Control Flow is disabled.
 */

const fakeDriver = common.getFakeDriver();

/* jshint esversion: 6 */
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
  let beforeEachMsg: string;

  beforeEach(function() {
    jasmine.addMatchers(common.getMatchers());
  });

  beforeEach(async function() {
    await fakeDriver.setUp().then(function(value) {
      beforeEachMsg = value;
    });
  });

  afterEach(function() {
    beforeEachMsg = '';
  });

  it('should only allow initializing once', function() {
    expect(require('../index.js').init).toThrow(
        Error('JasmineWd already initialized when init() was called'));
  });

  it('should pass normal synchronous tests', function() {
    expect(true).toEqual(true);
  });

  it('should compare a promise to a primitive', async function() {
    // You need `await` before `expect` if the expect needs to unwrap promises
    await expect(fakeDriver.getValueA()).toEqual('a');
    await expect(fakeDriver.getValueB()).toEqual('b');
  });

  it('beforeEach should wait for control flow', async function() {
    // But you can also just add `await` wherever you like
    await expect(beforeEachMsg).toEqual('setup done');
  });

  it('should wait till the expect to run the flow', async function() {
    const promiseA = fakeDriver.getValueA();
    // isPending() is only defined for WebDriver's ManagedPromise
    if (!promiseA.isPending) {
      promiseA.isPending = () => { return true; };
    }

    await expect(promiseA.isPending()).toBe(true);
    const expectation = expect(promiseA).toEqual('a');
    await expect(promiseA.isPending()).toBe(true);

    // We still need to wait for the expectation to finish, since the control
    // flow might be disabled
    await expectation;
  });

  it('should compare a promise to a promise', async function() {
    await expect(fakeDriver.getValueA()).toEqual(fakeDriver.getOtherValueA());
  });

  it('should still allow use of the underlying promise', async function() {
    const promiseA = fakeDriver.getValueA();
    await promiseA.then(function(value) {
      expect(value).toEqual('a');
    });
  });

  it('should allow scheduling of tasks', async function() {
    await fakeDriver.sleep(300);
    await expect(fakeDriver.getValueB()).toEqual('b');
  });

  it('should allow the use of custom matchers', async function() {
    await expect(500).toBeLotsMoreThan(3);
    await expect(fakeDriver.getBigNumber()).toBeLotsMoreThan(33);
    await expect(fakeDriver.getBigNumber()).toBeLotsMoreThan(fakeDriver.getSmallNumber());
    await expect(fakeDriver.getSmallNumber()).not.toBeLotsMoreThan(fakeDriver.getBigNumber());
  });

  it('should allow custom matchers to return a promise', async function() {
    await expect(fakeDriver.getDisplayedElement()).toBeDisplayed();
    await expect(fakeDriver.getHiddenElement()).not.toBeDisplayed();
  });

  it('should pass multiple arguments to matcher', async function() {
    // Passing specific precision
    await expect(fakeDriver.getDecimalNumber()).toBeCloseTo(3.1, 1);
    await expect(fakeDriver.getDecimalNumber()).not.toBeCloseTo(3.1, 2);

    // Using default precision (2)
    await expect(fakeDriver.getDecimalNumber()).not.toBeCloseTo(3.1);
    await expect(fakeDriver.getDecimalNumber()).toBeCloseTo(3.14);
  });

  it('should allow iterating through arrays', async function() {
    // This is a convoluted test which shows a real issue which
    // cropped up in version changes to the selenium-webdriver module.
    // See https://github.com/angular/protractor/pull/2263
    const checkTexts = async function(webElems: wdpromise.Promise<Array<{getText: () => wdpromise.Promise<string>}>>) {
      const texts = webElems.then(function(arr) {
        const results = arr.map(function(webElem) {
          return webElem.getText();
        });
        return wdpromise.all(results);
      });

      await expect(texts).not.toContain('e');

      return true;
    };

    await fakeDriver.getValueList().then(function(list) {
      const result = list.map(function(webElem) {
        const webElemsPromise = wdpromise.when(webElem).then(function(webElem) {
          return [webElem];
        });
        return wdpromise.fullyResolved(checkTexts(webElemsPromise));
      });
      return wdpromise.all(result);
    });
  });

  describe('not', async function() {
    it('should still pass normal synchronous tests', async function() {
      expect(4).not.toEqual(5);
    });

    it('should compare a promise to a primitive', async function() {
      await expect(fakeDriver.getValueA()).not.toEqual('b');
    });

    it('should compare a promise to a promise', async function() {
      await expect(fakeDriver.getValueA()).not.toEqual(fakeDriver.getValueB());
    });

    it('should allow custom matchers to return a promise when actual is not a promise', async function() {
      await expect(fakeDriver.displayedElement).toBeDisplayed();
      await expect(fakeDriver.hiddenElement).not.toBeDisplayed();
    });
  });

  it('should throw an error with a WebElement actual value', function() {
    const webElement = new WebElement(fakeDriver as any, 'idstring');

    expect(function() {
      expect(webElement).toEqual(4);
    }).toThrow(Error('expect called with WebElement argument, expected a Promise. ' +
        'Did you mean to use .getText()?'));
  });

  it('should pass after the timed out tests', async function() {
    await expect(fakeDriver.getValueA()).toEqual('a');
  });

  describe('should work for both synchronous and asynchronous tests', function() {
    let x: number;

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
    let asyncValue: number;
    let setupMsg: string;

    beforeAll(function(done) {
      setTimeout(function() {
        asyncValue = 5;
        done();
      }, 500);
    });

    beforeAll(async function() {
      await fakeDriver.setUp().then(function(msg) {
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
    const spec1 = it('test1') as any;
    const spec2 = it('test2', function() {}) as any;
    const spec3 = it('test3', function() {}, 1) as any;

    it('should return the spec', function() {
      expect(spec1.description).toBe('test1');
      expect(spec2.description).toBe('test2');
      expect(spec3.description).toBe('test3');
    });
  });

  describe('native promises', function() {
    it('should have done argument override returned promise', async function(done) {
      const ret = new Promise(function() {});
      done();
      await ret;
    });
 
    let currentTest: string = null;

    it('should wait for webdriver events sent from native promise', function() {
      currentTest = 'A';
      return new Promise(function(resolve) {
        setTimeout(async function() {
          await fakeDriver.sleep(100).then(function() {
            expect(currentTest).toBe('A');
          });
          resolve();
        }, 100);
      });
    });

    it('should not start a test before another finishes', function(done) {
      currentTest = 'B';
      setTimeout(done, 200);
    });
  });
});
