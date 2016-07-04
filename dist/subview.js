(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'module', 'backbone', 'underscore'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module, require('backbone'), require('underscore'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod, global.Backbone, global._);
    global.subview = mod.exports;
  }
})(this, function (exports, module, _backbone, _underscore) {
  'use strict';

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  var _Backbone = _interopRequireDefault(_backbone);

  var _2 = _interopRequireDefault(_underscore);

  module.exports = {
    /**
     * Instantiate subview within current view
     * @param  {Backbone.View}    View Subview
     * @param  {Object} [options]      Backbone.View options for SubView
     * @param  {Object} [params]       Subview params
     */
    initSubview: function initSubview(View, options, params) {
      var _this = this;

      if (_2['default'].isNull(options) || _2['default'].isUndefined(options)) {
        options = {};
      }

      var subview = new View(options);

      if (!_2['default'].isUndefined(params)) {
        subview.__subviewParams = params;
      }

      this._createChannel(subview);

      // remove reference from parent
      // Notice: .remove() has been already handled
      this.listenTo(subview, '__remove__', function () {
        _this.__subviews = _2['default'].without(_this.__subviews, subview);
      });

      if (!this.__subviews) {
        this.__subviews = [];
      }
      this.__subviews.push(subview);

      return subview;
    },

    /**
     * Destroy subview(s)
     *
     * @param  {Backbone.View|Array} [subviews] Backbone subview(s) to remove
     *                                          If not provided - all subviews will be removed
     *
     * @example
     *
     *   view.destroySubviews(subview);
     *   view.destroySubviews([subviewOne, subviewTwo]);
     *   view.destroySubviews();
     */
    destroySubviews: function destroySubviews(subviews) {
      if (!this.__subviews) {
        return;
      }

      // destroy all subviews
      if (_2['default'].isUndefined(subviews)) {
        subviews = this.__subviews;
      }

      // destroy single subview
      if (!_2['default'].isArray(subviews)) {
        subviews = [subviews];
      }

      this.__subviews = _2['default'].difference(this.__subviews, subviews);

      _2['default'].each(subviews, function (subview) {
        if (!subview || !_2['default'].isFunction(subview.remove)) {
          return;
        }

        subview.remove();
      });
    },

    _setupEventProxy: function _setupEventProxy(subview) {
      var _this2 = this;

      var current = _2['default'].keys(this.bubbleEvents || {});
      var parent = this.__parentBubbleEvents || [];

      // listen to subview events and proxy them to parent view
      _2['default'].each(parent, function (eventName) {
        _this2.listenTo(subview, eventName, function () {

          // prepend eventName and trigger
          var args = _2['default'].toArray(arguments);
          args.unshift(eventName);
          this.trigger.apply(this, args);
        });
      });

      // set internal property
      subview.__parentBubbleEvents = _2['default'].union(current, parent);

      // Handle subviews of subview proxies
      // (if they was created during initialization)
      // because during initialization __parentBubbleEvents was not set
      _2['default'].each(subview.__subviews, function (subviewOfSubview) {
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
      var _this3 = this;

      // setup proxy events
      this._setupEventProxy(subview);

      _2['default'].each(this.bubbleEvents, function (methodName, eventName) {
        _this3.listenTo(subview, eventName, _this3[methodName]);
      });
    },

    /**
     * Remove subview
     */
    remove: function remove() {
      this.destroySubviews();
      this.trigger('__remove__');

      // parent view could not have subview params, but shares .remove() method
      if (this.__subviewParams) {

        // remove: 'content' - empty content
        if (this.__subviewParams.remove === 'content') {
          this.undelegateEvents();
          this.stopListening();
          this.$el.empty();
          return;
        }

        // remove: false - do not touch content
        if (this.__subviewParams.remove === false) {
          this.undelegateEvents();
          this.stopListening();
          return;
        }
      }

      // Default remove
      _Backbone['default'].View.prototype.remove.apply(this, arguments);
    }
  };
});

