import {getFakeDriver, getMatchers} from './common.js';

/**
 * This file is very similar to errorSpec.ts, but we use async/await instead of
 * the WebDriver Control Flow for synchronization.  These tests are desgined to
 * work regardless of if the WebDriver Control Flow is disabled.
 */

const fakeDriver = getFakeDriver();

/* jshint esversion: 6 */
describe('Timeout cases', function() {
  it('should timeout after 200ms', async function(done) {
    // The returned promise is ignored and jasminewd will wait for the `done`
    // callback to be called
    await expect(fakeDriver.getValueA()).toEqual('a');
  }, 200);
  
  it('should timeout after 300ms', async function() {
    await fakeDriver.sleep(9999);
    await expect(fakeDriver.getValueB()).toEqual('b');
  }, 300);

  it('should pass after the timed out tests', function() {
    expect(true).toEqual(true);
  });
});

describe('things that should fail', function() {
  beforeEach(function() {
    jasmine.addMatchers(getMatchers());
  });

  it('should pass errors from done callback', function(done) {
    done.fail('an error from done.fail');
  });

  it('should error asynchronously in promise callbacks', async function() {
    await fakeDriver.sleep(50).then(function() {
      expect(true).toEqual(false);
    });
  });

  it('should error asynchronously within done callback', function(done) {
    setTimeout(async function() {
      await expect(false).toEqual(true);
      done();
    }, 200);
  });

  it('should fail normal synchronous tests', function() {
    expect(true).toBe(false);
  });

  it('should fail when an error is thrown', function() {
    throw new Error('I am an intentional error');
  });

  it('should compare a promise to a primitive', async function() {
    await expect(fakeDriver.getValueA()).toEqual('d');
    await expect(fakeDriver.getValueB()).toEqual('e');
  });

  it('should wait till the expect to run the flow', async function() {
    const promiseA = fakeDriver.getValueA();
    // isPending() is only defined for WebDriver's ManagedPromise
    if (!promiseA.isPending) {
      promiseA.isPending = () => { return true; };
    }

    await expect(promiseA.isPending()).toBe(true);
    const expectation = expect(promiseA).toEqual('a');
    await expect(promiseA.isPending()).toBe(false);

    // We still need to wait for the expectation to finish, since the control
    // flow might be disabled
    await expectation;
  });

  it('should compare a promise to a promise', async function() {
    await expect(fakeDriver.getValueA()).toEqual(fakeDriver.getValueB());
  });

  it('should still allow use of the underlying promise', async function() {
    const promiseA = fakeDriver.getValueA();
    await promiseA.then(function(value) {
      expect(value).toEqual('b');
    });
  });

  it('should allow scheduling of tasks', async function() {
    await fakeDriver.sleep(300);
    await expect(fakeDriver.getValueB()).toEqual('c');
  });

  it('should allow the use of custom matchers', async function() {
    await expect(1000).toBeLotsMoreThan(999);
    await expect(fakeDriver.getBigNumber()).toBeLotsMoreThan(1110);
    await expect(fakeDriver.getBigNumber()).not.toBeLotsMoreThan(fakeDriver.getSmallNumber());
    await expect(fakeDriver.getSmallNumber()).toBeLotsMoreThan(fakeDriver.getBigNumber());
  });

  it('should allow custom matchers to return a promise', async function() {
    await expect(fakeDriver.getDisplayedElement()).not.toBeDisplayed();
    await expect(fakeDriver.getHiddenElement()).toBeDisplayed();
  });

  it('should pass multiple arguments to matcher', async function() {
    // Passing specific precision
    await expect(fakeDriver.getDecimalNumber()).toBeCloseTo(3.5, 1);

    // Using default precision (2)
    await expect(fakeDriver.getDecimalNumber()).toBeCloseTo(3.1);
    await expect(fakeDriver.getDecimalNumber()).not.toBeCloseTo(3.14);
  });

  describe('native promises', function() {
    it('should time out if done argument is never called, even if promise is returned',
      async function(done) {
        await new Promise(function() {});
      }
    ); 

    let testADone = false;

    it('should handle rejection from native promise', function() {
      return new Promise(async function(resolve, reject) {
        setTimeout(async function() {
          await fakeDriver.sleep(100).then(function() {
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
