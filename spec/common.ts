import {promise as wdpromise, WebElement} from 'selenium-webdriver';

const flow = wdpromise.controlFlow();
require('../index.js').init(flow);

export function getFakeDriver() {
  return {
    controlFlow: function() {
      return flow;
    },
    sleep: function(ms: number) {
      return flow.timeout(ms);
    },
    setUp: function() {
      return flow.execute(function() {
        return wdpromise.when('setup done');
      }, 'setUp');
    },
    getValueA: function() {
      return flow.execute(function() {
        return wdpromise.delayed(500).then(function() {
          return wdpromise.when('a');
        });
      }, 'getValueA');
    },
    getOtherValueA: function() {
      return flow.execute(function() {
        return wdpromise.when('a');
      }, 'getOtherValueA');
    },
    getValueB: function() {
      return flow.execute(function() {
        return wdpromise.when('b');
      }, 'getValueB');
    },
    getBigNumber: function(): wdpromise.Promise<number> {
      return flow.execute(function() {
        return wdpromise.when(1111);
      }, 'getBigNumber');
    },
    getSmallNumber: function(): wdpromise.Promise<number> {
      return flow.execute(function() {
        return wdpromise.when(11);
      }, 'getSmallNumber');
    },
    getDecimalNumber: function(): wdpromise.Promise<number> {
        return flow.execute(function() {
          return wdpromise.when(3.14159);
        }, 'getDecimalNumber');
      },
    getDisplayedElement: function() {
      return flow.execute(function() {
        return wdpromise.when({
          isDisplayed: function() {
            return wdpromise.when(true);
          }
        });
      }, 'getDisplayedElement');
    },
    getHiddenElement: function() {
      return flow.execute(function() {
        return wdpromise.when({
          isDisplayed: function() {
            return wdpromise.when(false);
          }
        });
      }, 'getHiddenElement');
    },
    getValueList: function(): wdpromise.Promise<Array<{getText: () => wdpromise.Promise<string>}>> {
      return flow.execute(function() {
        return wdpromise.when([{
          getText: function() {
            return flow.execute(function() { return wdpromise.when('a');});
          }
        }, {
          getText: function() {
            return flow.execute(function() { return wdpromise.when('b');});
          }
        }, {
          getText: function() {
            return flow.execute(function() { return wdpromise.when('c');});
          }
        }, {
          getText: function() {
            return flow.execute(function() { return wdpromise.when('d');});
          }
        }]);
      }, 'getValueList');
    },
    displayedElement: {
      isDisplayed: function() {
        return wdpromise.when(true);
      }
    },
    hiddenElement: {
      isDisplayed: function() {
        return wdpromise.when(false);
      }
    }
  };
};

export function getMatchers() {
  return {
    toBeLotsMoreThan: function() {
      return {
        compare: function(actual: number, expected: number) {
          return {
            pass: actual > expected + 100
          };
        }
      };
    },
    // Example custom matcher returning a promise that resolves to true/false.
    toBeDisplayed: function() {
      return {
        compare: function(actual: WebElement, expected: void) {
          return {
            pass: actual.isDisplayed()
          };
        }
      };
    }
  };
};

// declare custom matcher types
declare global {
  namespace jasmine {
    interface Matchers {
      toBeLotsMoreThan(expected: number | Promise<number>): Promise<void>;
      toBeDisplayed(): Promise<void>; 
    }
  }
}


export function isPending(managedPromise: wdpromise.Promise<any>) {
  return (managedPromise as any).state_ === 'pending';
};
