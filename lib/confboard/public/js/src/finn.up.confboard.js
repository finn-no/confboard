var finn = finn || {};
finn.up = finn.up || {};

finn.up.log = function(message) {
  if ('console' in window) {
    window.console.log(message);
  }
};

finn.up.ConfBoard = function() {
  this.errorElement       = $("#error");
  this.contentElement     = $("#content");
  this.spinnerElement     = $(".horizon");
  this.stringFinderElement = $("#stringfinder");
};

finn.up.ConfBoard.templates = {}

finn.up.ConfBoard.prototype.init = function() {
  var self = this;
  var params = this.params();

  this.loadStringFinder(function() {
    if (params.config) {
      self.loadPropertyGroup_(params.config);
    } else {
      self.stringFinder.open();
    }
  });

  this.bind_();
};

finn.up.ConfBoard.prototype.loading = function(bool) {
  if (bool) {
    this.spinnerElement.show();
  } else {
    this.spinnerElement.hide();
  }
};

finn.up.ConfBoard.prototype.loadStringFinder = function(callback) {
  var self = this;

  this.getJson_('configs', null, function(data) {
    self.stringFinder = new finn.up.StringFinder(
        finn.up.ConfBoard.templates.stringList, self.stringFinderElement, data);

    self.stringFinder.onSelect = function(value) {
      if(value && value.length !== 0) {
        self.stringFinder.close();
        self.loadPropertyGroup_(value);
      }
    };

    self.stringFinder.init();

    if (callback) {
      callback();
    }
  });
}

finn.up.ConfBoard.prototype.renderHelp = function() {
  this.contentElement.
    hide().
    html('<div class="horizon" style="font-size: 24px">press escape to load a config</div>').
    fadeIn();
};

finn.up.ConfBoard.prototype.params = function() {
  if (!this.params_) {
    this.params_ = {};

    var pairs = window.location.search.substring(1).split('&');
    if (pairs.length === 1 && pairs[0].length === 0)
      return this.params_;

    for (var i = 0; i < pairs.length; i++) {
      var indexOfEquals = pairs[i].indexOf('=');
      var name = null;
      var value = null;
      if (indexOfEquals >= 0) {
        name = pairs[i].substring(0, indexOfEquals);
        value = pairs[i].substring(indexOfEquals + 1);
      } else {
        name = pairs[i];
      }

      this.params_[decodeURIComponent(name)] = decodeURIComponent(value);
    }
  }

  return this.params_;
};


finn.up.ConfBoard.prototype.error_ = function(msg) {
  var self = this;
  self.errorElement.text(msg).slideToggle("fast");

  setTimeout(function() {
    self.errorElement.slideToggle("fast");
  }, 3000);
};

finn.up.ConfBoard.prototype.bind_ = function() {
  var self = this;

  $(window).keydown(function(e) {
    if(e.which === 191) { // slash
      if(self.stringFinder.isOpen()) {
        self.stringFinder.focus();
      } else {
        self.focusFilter();
      }
      e.preventDefault();
    } else if(e.which === 27) { // escape
      if(self.stringFinder.isOpen()) {
        self.stringFinder.close();
        self.renderHelp();
      } else {
        self.contentElement.html('');
        self.stringFinder.open();
      }
    } else if(e.which === 37) {
      self.moveLeft();
    } else if(e.which === 39) {
      self.moveRight();
    }
  });
};

finn.up.ConfBoard.prototype.loadPropertyGroup_ = function(name, callback) {
  var self = this;
  this.contentElement.html('');
  this.loadedFile_ = name;

  this.getJson_('config', {'name': name}, function(data) {
    self.renderGroup_(data);

    if(callback) {
      callback();
    }
  });
};

finn.up.ConfBoard.prototype.renderGroup_ = function(data) {
  var html = Mustache.to_html(finn.up.ConfBoard.templates.propertiesTable, data);
  this.contentElement.html(html);

  var self = this;
  this.contentElement.find("th.file").click(function() {
    self.selectAsMaster_($(this));
  });

  this.contentElement.find("#filter").keyup(function() {
    $.uiTableFilter($(".properties-table") , this.value);
  });

  this.selectAsMaster_(this.contentElement.find("th.file:first"));
  this.focusFilter();
};

finn.up.ConfBoard.prototype.focusFilter = function() {
  this.contentElement.find("#filter").focus();
};


finn.up.ConfBoard.prototype.moveLeft = function() {
  var ok = this.selectAsMaster_(this.contentElement.find("th.master").prev(".file"));
  if(!ok) {
    // trying to move left from column 0, select the search field
    this.focusFilter()
  }
};

finn.up.ConfBoard.prototype.moveRight = function() {
  this.contentElement.find("#filter").blur();
  this.selectAsMaster_(this.contentElement.find("th.master").next(".file"));
};

finn.up.ConfBoard.prototype.moveDown = function() {
  // TODO - move down in table with 'j'
};

finn.up.ConfBoard.prototype.moveUp = function() {
  // TODO - move up in table with 'k'
};

finn.up.ConfBoard.prototype.selectAsMaster_ = function(e) {
  finn.up.log("selecting master: " + e.text());

  var selectedIndex = -1;
  var unwrapped = e.get(0);
  var isIniFile = this.loadedFile_.indexOf(".ini") != -1;

  if(!unwrapped) {
    return false;
  }

  this.contentElement.find("th.file").each(function(i) {
    if(this === unwrapped) {
      selectedIndex = i;
      $(this).addClass("master");
    } else {
      $(this).removeClass("master");
    }
  });

  if (selectedIndex < 0) {
    throw new Error("selectedIndex is " + selectedIndex);
  }

  this.contentElement.find("tbody tr").each(function(i) {
    var master = $(this).find("td.value:eq(" + selectedIndex + ")");

    if (master.size() === 0) {
      throw new Error("could not find master value");
    }

    var expectedValue = master.text();

    $(this).find("td.value").each(function(i) {
      var current = $(this);
      var actual = current.text();

      if (actual === expectedValue) {
        current.removeClass("unequal").addClass("equal");
      } else if (isIniFile && (actual.length === 0)) {
        current.removeClass("equal").removeClass("unequal");
      } else {
        current.removeClass("equal").addClass("unequal");
      }
    });
  });

  return true;
};

finn.up.ConfBoard.prototype.getJson_ = function(path, data, callback) {
  var self = this;

  this.loading(true);

  $.ajax({
    url: path,
    type: 'GET',
    dataType: 'json',
    data: data,
    complete: function() { self.loading(false); },
    success: function(data, textStatus, xhr) { callback(data, textStatus, xhr); },
    error: function(xhr, textStatus, errorThrown) { self.error_(textStatus + ": " + path + " " + errorThrown); }
  });

};