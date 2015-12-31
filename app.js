;(function(){

  var debugLevel = 1; // 0 = nothing, 1 = basic, 2 = full

  function log(level) {
    if (level <= debugLevel) {
      console.log.apply(console, [(new Date()).toISOString()].concat(Array.prototype.slice.call(arguments, 1)));
    }
  }

  var Timer = (function(){
    var accumulatedTime = 0,
        startTime;

    return {
      start: function() {
        if (!startTime) {
          startTime = Date.now();
        }
      },

      stop: function() {
        if (startTime) {
          accumulatedTime += Date.now() - startTime;
          startTime = null;
        }
      },

      get: function() {
        var time = (startTime ? Date.now() - startTime : 0) + accumulatedTime;
        return Math.round(time / 1000);
      },

      getAsText: function() {
        var min = Math.round(this.get() / 60);
        return Math.floor(min/60) + ':' + pad(min%60,2);
      },

      set: function(seconds) {
        accumulatedTime = seconds * 1000;
      },

      reset: function() {
        accumulatedTime = 0;
        startTime = startTime ? Date.now() : null;
      },

    };
  })();


  function pad(num, size) {
    var s = String(num);
    while (s.length < (size || 2)) {
      s = "0" + s;
    }
    return s;
  };






  var container = document.createElement('div');
  container.id = 'gmail-timer';
  container.textContent = 'loading';
  document.body.appendChild(container);

  var loaded = false,
      updatedAt,
      resetAt;

  var options = {
    idleTimeout: 30, // after being idle for X seconds, the timer stops
    resetHour: 3,    // at this hour, the clock resets to 0
    updateFreq: 5,   // update the time display every X seconds
    saveFreq: 60,    // save the state to Chrome storage every X seconds
  };


  var initEvents = function() {
    ifvisible.on("focus", Timer.start);
    ifvisible.on("blur", Timer.stop);

    if (options.idleTimeout > 0) {
      ifvisible.setIdleDuration(options.idleTimeout);
      ifvisible.on("wakeup", function(){
        log(1, 'wakeup');
        Timer.start();
      });
      ifvisible.on("idle", function(){
        log(1, 'idle');
        Timer.stop();
      });
    }
  };


  var save = function() {
    log(1, 'save', Timer.getAsText());
    chrome.storage.sync.set({
      timeOnPage: Timer.get(),
      updatedAt: Date.now()
    });
  };


  var updateDisplay = function() {
    if (Date.now() > resetAt) {
      log(1, 'reset');
      Timer.reset();
      updatedAt = Date.now();
      resetAt = calcResetAt(updatedAt);
    }
    var text = Timer.getAsText();
    log(container.textContent == text ? 2 : 1, 'updateDisplay', text, Timer.get());
    container.textContent = text;
  };


  var calcResetAt = function(fromTime) {
    var date = new Date(fromTime);
    return (new Date(date.getFullYear(), date.getMonth(), date.getDate() + (date.getHours() >= options.resetHour ? 1 : 0), options.resetHour, 0, 0)).getTime();
  };


  window.onload = function() {
    log(1, 'onload');
    chrome.storage.sync.get(null, function(items) {

      Timer.set(items.timeOnPage || 0);
      updatedAt = items.updatedAt || Date.now();
      resetAt = calcResetAt(updatedAt);

      Timer.start();
      updateDisplay();
      initEvents();

      loaded = true;

      setInterval(updateDisplay, options.updateFreq*1000);
      setInterval(save, options.saveFreq*1000);
    });
  };


  window.onbeforeunload = function (event) {
    if (loaded) {
      Timer.stop();
      save();
    }
  };

})();