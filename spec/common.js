require('../index.js');
var webdriver = require('selenium-webdriver');

exports.getFakeDriver = function() {
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
    getBigNumber: function() {
      return flow.execute(function() {
        return webdriver.promise.fulfilled(1111);
      });
    },
    getSmallNumber: function() {
      return flow.execute(function() {
        return webdriver.promise.fulfilled(11);
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
