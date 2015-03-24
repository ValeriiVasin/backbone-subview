(function (factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "module", "backbone", "underscore"], factory);
  } else if (typeof exports !== "undefined" && typeof module !== "undefined") {
    factory(exports, module, require("backbone"), require("underscore"));
  }
})(function (exports, module, _backbone, _underscore) {
  "use strict";

  var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

  var Backbone = _interopRequire(_backbone);

  var _ = _interopRequire(_underscore);

  module.exports = {
    /**
     * Instantiate subview within current view
     * @param  {Backbone.View} View Subview
     * @param  {Object} params    View params
     */
    initSubview: function initSubview(View, params) {
      var _this = this;

      if (typeof params === "undefined") {
        params = {};
      }

      // find selector inside parent view
      if (typeof params.el === "string") {
        params.el = this.$(params.el);
      }

      var subview = new View(params);

      this._createChannel(subview);

      // remove reference from parent
      // Notice: .remove() has been already handled
      this.listenTo(subview, "__remove__", function () {
        _this.__subviews = _.without(_this.__subviews, subview);
      });

      if (!this.__subviews) {
        this.__subviews = [];
      }
      this.__subviews.push(subview);

      return subview;
    },

    destroySubviews: function destroySubviews(subview) {
      if (!this.__subviews) {
        return;
      }

      if (subview) {
        this.__subviews = _.without(this.__subviews, subview);
        subview.remove();
        return;
      }

      _.each(this.__subviews, function (subview) {
        subview.remove();
      });
    },

    _setupEventProxy: function _setupEventProxy(subview) {
      var _this = this;

      var current = _.keys(this.bubbleEvents || {});
      var parent = this.__parentBubbleEvents || [];

      // listen to subview events and proxy them to parent view
      _.each(parent, function (eventName) {
        _this.listenTo(subview, eventName, function () {

          // prepend eventName and trigger
          var args = _.toArray(arguments);
          args.unshift(eventName);
          this.trigger.apply(this, args);
        });
      });

      // set internal property
      subview.__parentBubbleEvents = _.union(current, parent);

      // Handle subviews of subview proxies
      // (if they was created during initialization)
      // because during initialization __parentBubbleEvents was not set
      _.each(subview.__subviews, function (subviewOfSubview) {
        subview._setupEventProxy(subviewOfSubview);
      });
    },

    /**
     * Create internal parent <> subview channel
     *
     * Notice:
     * we do not need proper destroyChannel method
     * because we use .listenTo() method for subscriptions
     * and after view .remove() it will unsubscribe everything automatically
     */
    _createChannel: function _createChannel(subview) {
      var _this = this;

      // setup proxy events
      this._setupEventProxy(subview);

      _.each(this.bubbleEvents, function (methodName, eventName) {
        _this.listenTo(subview, eventName, _this[methodName]);
      });
    },

    remove: function remove() {
      this.destroySubviews();
      this.trigger("__remove__");
      Backbone.View.prototype.remove.apply(this, arguments);
    }
  };
});

