/**
 * Adapts Jasmine-Node tests to work better with WebDriverJS. Borrows
 * heavily from the mocha WebDriverJS adapter at
 * https://code.google.com/p/selenium/source/browse/javascript/node/selenium-webdriver/testing/index.js
 */

var webdriver = require('selenium-webdriver');

var flow = webdriver.promise.controlFlow();

/**
 * Wraps a function so that all passed arguments are ignored.
 * @param {!Function} fn The function to wrap.
 * @return {!Function} The wrapped function.
 */
function seal(fn) {
  return function() {
    fn();
  };
}

/**
 * Validates that the parameter is a function.
 * @param {Object} functionToValidate The function to validate.
 * @throws {Error}
 * @return {Object} The original parameter.
 */
function validateFunction(functionToValidate) {
  if (functionToValidate && Object.prototype.toString.call(functionToValidate) === '[object Function]') {
    return functionToValidate;
  } else {
    throw Error(functionToValidate + ' is not a function');
  }
}

/**
 * Validates that the parameter is a number.
 * @param {Object} numberToValidate The number to validate.
 * @throws {Error}
 * @return {Object} The original number.
 */
function validateNumber(numberToValidate) {
  if (!isNaN(numberToValidate)) {
    return numberToValidate;
  } else {
    throw Error(numberToValidate + ' is not a number');
  }
}

/**
 * Validates that the parameter is a string.
 * @param {Object} stringToValidate The string to validate.
 * @throws {Error}
 * @return {Object} The original string.
 */
function validateString(stringtoValidate) {
  if (typeof stringtoValidate == 'string' || stringtoValidate instanceof String) {
    return stringtoValidate;
  } else {
    throw Error(stringtoValidate + ' is not a string');
  }
}

/**
 * Wraps a function so it runs inside a webdriver.promise.ControlFlow and
 * waits for the flow to complete before continuing.
 * @param {!Function} globalFn The function to wrap.
 * @return {!Function} The new function.
 */
function wrapInControlFlow(globalFn, fnName) {
  return function() {
    var driverError = new Error();
    driverError.stack = driverError.stack.replace(/ +at.+jasminewd.+\n/, '');

    function asyncTestFn(fn, desc) {
      return function(done) {
        var desc_ = 'Asynchronous test function: ' + fnName + '(';
        if (desc) {
          desc_ += '"' + desc + '"';
        }
        desc_ += ')';

        // deferred object for signaling completion of asychronous function within globalFn
        var asyncFnDone = webdriver.promise.defer();

        if (fn.length === 0) {
          // function with globalFn not asychronous
          asyncFnDone.fulfill();
        } else if (fn.length > 1) {
          throw Error('Invalid # arguments (' + fn.length + ') within function "' + fnName +'"');
        }

        var flowFinished = flow.execute(function() {
          fn.call(jasmine.getEnv().currentSpec, function(userError) {
            if (userError) {
              asyncFnDone.reject(new Error(userError));
            } else {
              asyncFnDone.fulfill();
            }
          });
        }, desc_);

        webdriver.promise.all([asyncFnDone, flowFinished]).then(function() {
          seal(done)();
        }, function(e) {
          e.stack = e.stack + '==== async task ====\n' + driverError.stack;
          done(e);
        });
      };
    }

    var description, func, timeout;
    switch (fnName) {
      case 'it':
      case 'iit':
        description = validateString(arguments[0]);
        func = validateFunction(arguments[1]);
        if (!arguments[2]) {
          globalFn(description, asyncTestFn(func));
        } else {
          timeout = validateNumber(arguments[2]);
          globalFn(description, asyncTestFn(func), timeout);
        }
        break;
      case 'beforeEach':
      case 'afterEach':
        func = validateFunction(arguments[0]);
        if (!arguments[1]) {
          globalFn(asyncTestFn(func));
        } else {
          timeout = validateNumber(arguments[1]);
          globalFn(asyncTestFn(func), timeout);
        }
        break;
      default:
        throw Error('invalid function: ' + fnName);
    }
  };
}

global.it = wrapInControlFlow(global.it, 'it');
global.iit = wrapInControlFlow(global.iit, 'iit');
global.beforeEach = wrapInControlFlow(global.beforeEach, 'beforeEach');
global.afterEach = wrapInControlFlow(global.afterEach, 'afterEach');

var originalExpect = global.expect;

global.expect = function(actual) {
  if (actual instanceof webdriver.promise.Promise) {
    var originalExpectation = originalExpect('placeholder');

    function makeAsyncMatcher(matcherName, actualPromise, not) {
      return function() {
        var originalArgs = arguments;
        var matchError = new Error("Failed expectation");
        matchError.stack = matchError.stack.replace(/ +at.+jasminewd.+\n/, '');
        actualPromise.then(function(actual) {
          var expected = originalArgs[0];

          var expectation = originalExpect(actual);
          if (not) {
            expectation = expectation.not;
          }
          // TODO - stack traces suck now. Fix.
          if (expected instanceof webdriver.promise.Promise) {
            if (originalArgs.length > 1) {
              throw error('Multi-argument matchers with promises are not ' +
                  'supported.');
            }
            expected.then(function(exp) {
              expectation[matcherName].apply(expectation, [exp]);
            });
          } else {
            expectation[matcherName].apply(expectation, originalArgs);
          }
        });
      };
    }

    function wrapExpectation(orig) {
      for (var prop in orig) {
        // TODO this quite hacky. Find a better way.
        var EXPECTATION_PROPS_TO_IGNORE = [
          'util', 'customEqualityTesters', 'actual', 'addExpectationResult',
          'isNot', 'not', 'wrapCompare'];
        if (EXPECTATION_PROPS_TO_IGNORE.indexOf(prop) === -1) {
          var matcherName = prop;
          orig[matcherName] = makeAsyncMatcher(matcherName, actual, false);
          orig.not[matcherName] = makeAsyncMatcher(matcherName, actual, true);
        }
      }
      return orig;
    }

    var wrapped = wrapExpectation(originalExpectation);
    return wrapped;
  } else {
    return originalExpect(actual);
  }
};

var originalAddExpectationResult = jasmine.Spec.prototype.addExpectationResult;
jasmine.Spec.prototype.addExpectationResult = function(passed, data) {
  var self = this;
  if (passed instanceof webdriver.promise.Promise) {
    passed.then(function(result) {
      data.passed = result;
      originalAddExpectationResult.apply(self, [result, data]);
    });
  } else {
    originalAddExpectationResult.apply(self, [passed, data]);
  }
};

/**
 * A Jasmine reporter which does nothing but execute the input function
 * on a timeout failure.
 */
var OnTimeoutReporter = function(fn) {
  this.callback = fn;
};

OnTimeoutReporter.prototype.specDone = function(result) {
  if (result.status != 'passed') {
    for (var i = 0; i < result.failedExpectations.length; i++) {
      var failureMessage = result.failedExpectations[i].message;

      if (failureMessage.match(/Timeout/)) {
        this.callback();
      }
    }
  }
};

// On timeout, the flow should be reset. This will prevent webdriver tasks
// from overflowing into the next test and causing it to fail or timeout
// as well. This is done in the reporter instead of an afterEach block
// to ensure that it runs after any afterEach() blocks with webdriver tasks
// get to complete first.
jasmine.getEnv().addReporter(new OnTimeoutReporter(function() {
  flow.reset();
}));
