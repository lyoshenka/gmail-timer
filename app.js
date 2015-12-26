;(function(){

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
    idleTimeout: 30,
    resetHour: 3
  };


  var initEvents = function() {
    ifvisible.on("focus", Timer.start);
    ifvisible.on("blur", Timer.stop);

    if (options.idleTimeout > 0) {
      ifvisible.setIdleDuration(options.idleTimeout);
      ifvisible.on("wakeup", Timer.start); 
      ifvisible.on("idle", Timer.stop);
    }
  };


  var save = function() {
    console.log('gmail-timer', 'save', (new Date()).toISOString());
    chrome.storage.sync.set({
      timeOnPage: Timer.get(),
      updatedAt: Date.now()
    });
  };


  var update = function() {
    if (Date.now() > resetAt) {
      console.log('gmail-timer', 'reset', (new Date()).toISOString());
      Timer.reset();
      updatedAt = Date.now();
      resetAt = calcResetAt(updatedAt);
    }
    var time = Math.round(Timer.get() / 60);
    console.log('gmail-timer', 'update', (new Date()).toISOString(), time);
    container.textContent =  Math.round(time/60) + ':' + pad(time%60,2);  
  };


  var calcResetAt = function(fromTime) {
    var date = new Date(fromTime);
    return (new Date(date.getFullYear(), date.getMonth(), date.getDate() + (date.getHours() >= options.resetHour ? 1 : 0), options.resetHour, 0, 0)).getTime();
  };


  window.onload = function() {
    console.log('gmail-timer', 'onload', (new Date()).toISOString());
    chrome.storage.sync.get(null, function(items) {
      Timer.set(items.timeOnPage || 0);
      Timer.start();
      updatedAt = items.updatedAt || Date.now();
      resetAt = calcResetAt(updatedAt);
      update();
      initEvents();
      loaded = true;
      setInterval(update, 5000);
      setInterval(save,   60000);
    }); 
  };


  window.onbeforeunload = function (event) {
    if (loaded) {
      Timer.stop();
      save();
    }
  };

})();