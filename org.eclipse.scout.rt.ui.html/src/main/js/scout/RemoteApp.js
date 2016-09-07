scout.RemoteApp = function() { //
};
scout.inherits(scout.RemoteApp, scout.App);

scout.RemoteApp.prototype._doBootstrap = function(options) {
  return [
    scout.logging.bootstrap(),
    scout.device.bootstrap(),
    scout.defaultValues.bootstrap(),
    scout.fonts.bootstrap(options.fonts)
  ];
};

/**
 * @override
 */
scout.RemoteApp.prototype._createSession = function($entryPoint, options) {
  options = options || {};
  options.remote = true;
  options.$entryPoint = $entryPoint;
  var session = scout.create('Session', options, {
    ensureUniqueId: false
  });
  session.start();
  return session;
};

/**
 * @override
 */
scout.RemoteApp.prototype._init = function(options) {
  scout.RemoteApp.modifyWidgetPrototype();
  scout.RemoteApp.parent.prototype._init.call(this, options);
};

/**
 * Static method to modify the prototype of scout.Widget.
 */
scout.RemoteApp.modifyWidgetPrototype = function() {
  scout.Widget.prototype.createFromProperty = function(propertyName, value) {
    if (value instanceof scout.Widget) {
      return value;
    }

    // Remote case
    var modelAdapter = findModelAdapter(this);
    if (modelAdapter) { // If the widget (or one of its parents) has a remote-adapter, all its properties must be remotable
      return this.session.getOrCreateWidget(value, this); // value is a String, contains (remote) object ID
    }

    // Local case (default)
    value.parent = this;
    return scout.create(value);

    function findModelAdapter(widget) {
      while (widget) {
        if (widget.modelAdapter) {
          return widget.modelAdapter;
        }
        widget = widget.parent;
      }
      return null;
    }
  };
};
