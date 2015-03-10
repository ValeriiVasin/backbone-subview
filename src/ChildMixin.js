import Backbone from 'backbone';
import _ from 'underscore';

export default {
  /**
   * Instantiate subview within current view
   * @param  {Backbone.View} View Subview
   * @param  {Object} params    View params
   */
  initSubview(View, params) {
    if (typeof params === 'undefined') {
      params = {};
    }

    // find selector inside parent view
    if (typeof params.el === 'string') {
      params.el = this.$(params.el);
    }

    let subview = new View(params);

    this._createChannel(subview);

    // remove reference from parent
    // Notice: .remove() has been already handled
    this.listenTo(subview, '__remove__', () => {
      this.__subviews = _.without(this.__subviews, subview);
    });

    if (!this.__subviews) {
      this.__subviews = [];
    }
    this.__subviews.push(subview);

    return subview;
  },

  destroySubviews(subview) {
    if (!this.__subviews) {
      return;
    }

    if (subview) {
      this.__subviews = _.without(this.__subviews, subview);
      subview.remove();
      return;
    }

    _.each(this.__subviews, (subview) => {
      subview.remove();
    });
  },

  _setupEventProxy(subview) {
    let current = _.keys(this.bubbleEvents || {});
    let parent = this.__parentBubbleEvents || [];

    // listen to subview events and proxy them to parent view
    _.each(parent, (eventName) => {
      this.listenTo(subview, eventName, function() {

        // prepend eventName and trigger
        let args = _.toArray(arguments);
        args.unshift(eventName);
        this.trigger.apply(this, args);
      });
    });

    // set internal property
    subview.__parentBubbleEvents = _.union(current, parent);

    // Handle subviews of subview proxies
    // (if they was created during initialization)
    // because during initialization __parentBubbleEvents was not set
    _.each(subview.__subviews, (subviewOfSubview) => {
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
  _createChannel(subview) {
    // setup proxy events
    this._setupEventProxy(subview);

    _.each(this.bubbleEvents, (methodName, eventName) => {
      this.listenTo(subview, eventName, this[methodName]);
    });
  },

  remove() {
    this.destroySubviews();
    this.trigger('__remove__');
    Backbone.View.prototype.remove.apply(this, arguments);
  }
};
