finn.up.StringFinder = function(template, element, list) {
  this.template_ = template;
  this.element_ = element;
  this.list_ = list;
};

finn.up.StringFinder.prototype.onSelect = function() {};

finn.up.StringFinder.prototype.init = function() {
  this.render(this.list_);
  var self  = this;

  this.input_.keyup(function(e) {
    if(e.which === 40 || e.which === 38 || e.which === 13) {
      return false;
    }

    self.filter(this.value);
  });

  this.input_.keydown(function(e) {
    if(e.which === 40) { // arrow down
      self.moveDown();
    } else if(e.which === 38) { // arrow up
      self.moveUp();
    } else if (e.which === 13 && self.onSelect) { // enter
      self.onSelect(self.selectedString());
    }
  });
};

finn.up.StringFinder.prototype.selectedString = function() {
  return this.element_.find("li.selected").attr("data-path");
};

finn.up.StringFinder.prototype.isOpen = function() {
  return this.element_.is(":visible");
};

finn.up.StringFinder.prototype.open = function() {
  this.element_.animate({width: 'show'});
  this.input_.focus();
};

finn.up.StringFinder.prototype.close = function() {
  this.element_.slideUp("fast");
};

finn.up.StringFinder.prototype.moveDown = function() {
  var selected = this.element_.find("li.selected");

  if(selected.size() === 0) {
    this.element_.find("li:first").addClass("selected")
  } else {
    var unwrapped = selected.removeClass("selected").
                             next().
                             addClass("selected").
                             scrollintoview({duration: 0});
  }
}

finn.up.StringFinder.prototype.moveUp = function() {
  var selected = this.element_.find("li.selected");

  if(selected.size() === 0) {
    this.element_.find("li:last").addClass("selected");
  }

  var unwrapped = this.element_.find("li.selected:first")
                       .removeClass("selected")
                       .prev()
                       .addClass("selected").
                       scrollintoview({duration: 0});
}

finn.up.StringFinder.prototype.render = function(list) {
  var items = [];

  var self = this;
  $.each(list, function(i) {
      items.push({ path: this, name: self.nameFor(this) });
  });

  this.element_.find("div").html(Mustache.to_html(this.template_, {strings: items}));
  this.input_ = this.element_.find("input");


  var lis = this.element_.find("li");
  lis.click(function() {
    self.onSelect($(this).attr("data-path"));
  })

  lis.hover(
    function() { $(this).addClass("selected"); },
    function() { $(this).removeClass("selected"); }
  );

};

finn.up.StringFinder.prototype.nameFor = function(path) {
  if(path.indexOf(".ini") != -1) {
    return path;
  } else {
    return path + ".properties";
  }
};

finn.up.StringFinder.prototype.filter = function(str) {
  if(str.length === 0) {
    this.render(this.list_);
  }

  var result = [];
  str = str.toLowerCase();

  $(this.list_).each(function(index) {
    var a = this.toLowerCase();
    var b = str;

    if(this.toLowerCase().indexOf(str) != -1) {
      result.push(this);
    }
  });

  this.render(result);
};