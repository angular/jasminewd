"use strict";

declare var describe;
declare var it;
declare var expect;

async function asyncHelper() {
  return 7;
}

describe('async function', function() {
  it('should wait on async functions', async function() {
    let helperVal = await asyncHelper();
    expect(helperVal).toBe(7);
  });
});
