var maybePromise = require('../maybePromise.js');
var webdriver = require('selenium-webdriver');

describe('maybePromise', function() {
  // Helper values
  var num = 588.79; // From Math.random()
  var str = 'qqqpqc0'; // From math.random().toString(36);
  var obj = { num: num, str: str, obj: obj, then: true };
  function idFun(x) { return x; }
  function promiseMe(x) {
    var promise = { then: function(callback) { return callback(x); } };
    spyOn(promise, 'then').and.callThrough();
    return promise;
  }

  describe('singletons', function() {
    it('should be able to use non-promises', function(done) {
      maybePromise(num, function(n) {
        expect(n).toBe(num);
        done();
      });
    });
    
    it('should not wrap non-promise values', function() {
      expect(maybePromise(num, idFun)).toBe(num);
      expect(maybePromise(str, idFun)).toBe(str);
      expect(maybePromise(obj, idFun)).toBe(obj);
    });

    it('should be able to use promises', function(done) {
      maybePromise(promiseMe(str), function(s) {
        expect(s).toBe(str);
        done();
      });
    });

    it('should use a promise\'s own then() function without any wrapping', function() {
      var promise = promiseMe(num); 
      var callback = jasmine.createSpy('callback', idFun).and.callThrough();
      expect(maybePromise(promise, callback)).toBe(num);
      expect(promise.then).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();

      promise = promiseMe(str); 
      callback.calls.reset();
      expect(maybePromise(promise, callback)).toBe(str);
      expect(promise.then).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();

      promise = promiseMe(obj); 
      callback.calls.reset();
      expect(maybePromise(promise, callback)).toBe(obj);
      expect(promise.then).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });

    it('should work with a real promise implementation', function(done) {
      var promise = webdriver.promise.when(str);
      maybePromise(promise, function(s) {
        expect(s).toBe(str);
        return webdriver.promise.when(num);
      }).then(function(n) {
        expect(n).toEqual(num);
        done();
      });
    });

    it('should fail in an expected way with  poorly implemented promises', function() {
      var badPromise = promiseMe(obj);
      badPromise.then.and.stub();
      badPromise.then.and.returnValue(str); 
      var callback = jasmine.createSpy('callback');
      var ret = maybePromise(badPromise, callback);
      expect(badPromise.then).toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();
      expect(ret).toBe(str);
    });
  });

  describe('.all', function() {
    it('should work with an empty array, without wrapping', function() {
      var callback = jasmine.createSpy('callback', idFun).and.callThrough();
      expect(maybePromise.all([], callback)).toEqual([]);
      expect(callback).toHaveBeenCalled();
    });

    it('should work with an array of non-promises', function(done) {
      var arr = [num, str, obj];
      maybePromise.all(arr, function(a) {
        expect(a).toEqual(arr);
        done();
      });
    });

    it('should not wrap non-promise values', function() {
      var arr = [num, str, obj];
      expect(maybePromise.all(arr, idFun)).toEqual(arr);
    });

    it('should work with array of promises', function(done) {
      var arr = [num, str, obj];
      maybePromise.all(arr.map(promiseMe), function(a) {
        expect(a).toEqual(arr);
        done();
      });
    });

    it('should use promise\'s own then() function without any wrapping', function() {
      var arr = [num, str, obj];
      var promiseArr = arr.map(promiseMe);
      var callback = jasmine.createSpy('callback', idFun).and.callThrough();
      expect(maybePromise.all(promiseArr, callback)).toEqual(arr);
      expect(callback.calls.count()).toBe(1);
      for (var i = 0; i < promiseArr.length; i++) {
        expect(promiseArr[i].then.calls.count()).toBe(1);
      }
    });

    it('should work with a real promise implementation', function(done) {
      var arr = [str, obj];
      maybePromise.all(arr.map(webdriver.promise.when), function(a) {
        expect(a).toEqual(arr);
        return webdriver.promise.when(num);
      }).then(function(n) {
        expect(n).toEqual(num);
        done();
      });
    });

    it('should work with a mix of promises and non-promises', function(done) {
      var arr = [num, promiseMe(str), webdriver.promise.when(obj),
          webdriver.promise.when(str), webdriver.promise.when(num),
          str, promiseMe(num), obj, promiseMe(obj)]; // Random order
      maybePromise.all(arr, function(resolved) {
        maybePromise(webdriver.promise.all(arr), function(wdResolved) {
          expect(resolved).toEqual(wdResolved);
          done();
        });
      });
    });

    it('should fail in an expected way with poorly implemented promises', function() {
      var arr = [num, promiseMe(str), str, promiseMe(num), obj, promiseMe(obj)]; // Random order
      var badPromise = promiseMe(obj);
      badPromise.then.and.stub();
      badPromise.then.and.returnValue(str);
      arr.push(badPromise);
      var callback = jasmine.createSpy('callback');
      var ret = maybePromise.all(arr, callback);
      expect(badPromise.then).toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();
      expect(ret).toBe(str);
    });
  });
});
