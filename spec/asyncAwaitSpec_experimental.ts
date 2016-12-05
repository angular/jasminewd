/* This is a test for an experimental feature to make async/await work with the
 * webdriver control flow.  You should not use this. 
 */
"use strict";

// Declare globals
declare var describe;
declare var it;
declare var expect;
declare var require;

let webdriver = require('selenium-webdriver'),
    flow = webdriver.promise.controlFlow();
require('../index.js').init(flow, webdriver.promise.Promise);

describe('async function', function() {
  let sharedVal: any;
  it('should wait on async functions', async function() {
    sharedVal = await webdriver.promise.fulfilled('a');
    expect(sharedVal).toBe('a');
    flow.timeout(1000); // The control flow needs to work for this.
    sharedVal = await webdriver.promise.fulfilled('b');
  });

  it('should have waited until the end of the last it() block', function() {
    expect(sharedVal).toBe('b');
  });
});
