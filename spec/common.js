var webdriver = require('selenium-webdriver');

var flow = webdriver.promise.controlFlow();
require('../index.js').init(flow);

exports.getFakeDriver = function() {
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
      }, 'setUp');
    },
    getValueA: function() {
      return flow.execute(function() {
        return webdriver.promise.delayed(500).then(function() {
          return webdriver.promise.fulfilled('a');
        });
      }, 'getValueA');
    },
    getOtherValueA: function() {
      return flow.execute(function() {
        return webdriver.promise.fulfilled('a');
      }, 'getOtherValueA');
    },
    getValueB: function() {
      return flow.execute(function() {
        return webdriver.promise.fulfilled('b');
      }, 'getValueB');
    },
    getBigNumber: function() {
      return flow.execute(function() {
        return webdriver.promise.fulfilled(1111);
      }, 'getBigNumber');
    },
    getSmallNumber: function() {
      return flow.execute(function() {
        return webdriver.promise.fulfilled(11);
      }, 'getSmallNumber');
    },
    getDecimalNumber: function() {
        return flow.execute(function() {
          return webdriver.promise.fulfilled(3.14159);
        }, 'getDecimalNumber');
      },
    getDisplayedElement: function() {
      return flow.execute(function() {
        return webdriver.promise.fulfilled({
          isDisplayed: function() {
            return webdriver.promise.fulfilled(true);
          }
        });
      }, 'getDisplayedElement');
    },
    getHiddenElement: function() {
      return flow.execute(function() {
        return webdriver.promise.fulfilled({
          isDisplayed: function() {
            return webdriver.promise.fulfilled(false);
          }
        });
      }, 'getHiddenElement');
    },
    getValueList: function() {
      return flow.execute(function() {
        return webdriver.promise.fulfilled([{
          getText: function() {
            return flow.execute(function() { return webdriver.promise.fulfilled('a');});
          }
        }, {
          getText: function() {
            return flow.execute(function() { return webdriver.promise.fulfilled('b');});
          }
        }, {
          getText: function() {
            return flow.execute(function() { return webdriver.promise.fulfilled('c');});
          }
        }, {
          getText: function() {
            return flow.execute(function() { return webdriver.promise.fulfilled('d');});
          }
        }]);
      }, 'getValueList');
    },
    displayedElement: {
      isDisplayed: function() {
        return webdriver.promise.fulfilled(true);
      }
    },
    hiddenElement: {
      isDisplayed: function() {
        return webdriver.promise.fulfilled(false);
      }
    }
  };
};

exports.getMatchers = function() {
  return {
    toBeLotsMoreThan: function() {
      return {
        compare: function(actual, expected) {
          return {
            pass: actual > expected + 100
          };
        }
      };
    },
    // Example custom matcher returning a promise that resolves to true/false.
    toBeDisplayed: function() {
      return {
        compare: function(actual, expected) {
          return {
            pass: actual.isDisplayed()
          };
        }
      };
    }
  };
};

exports.isPending = function(managedPromise) {
  return managedPromise.state_ === 'pending';
};
