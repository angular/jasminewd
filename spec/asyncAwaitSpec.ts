/* Here we have an example of using async/await with jasminewd.  We are using
 * typescript to gain access to async/await, but mostly this should look like
 * normal javascript to you.
 *
 * The key thing to note here is that once you use async/await, the webdriver
 * control flow is no longer reliable.  This means you have to use async/await
 * or promises for all your asynchronous behavior.  In Protractor this would
 * mean putting `await` before every line interacting with the browser.  In this
 * example, we have to put `await` before `driver.sleep()`.
 */
"use strict";

// Declare globals
declare var describe;
declare var it;
declare var expect;
declare var require;

let driver = require('./common.js').getFakeDriver();

describe('async function', function() {
  let sharedVal: any;
  it('should wait on async functions', async function() {
    sharedVal = await driver.getValueA(); // Async unwraps this to 'a'
    expect(sharedVal).toBe('a');
    await driver.sleep(1000); // Normally you wouldn't need to `await` this, but
                              // the control flow is broken for async functions.
    sharedVal = await driver.getValueB();
  });

  it('should have waited until the end of the last it() block', function() {
    expect(sharedVal).toBe('b');
  });
});
