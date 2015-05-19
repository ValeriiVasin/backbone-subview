import Backbone from 'backbone';
import _ from 'underscore';

export default {
  /**
   * Instantiate subview within current view
   * @param  {Backbone.View}    View Subview
   * @param  {Object} [options]      Backbone.View options for SubView
   * @param  {Object} [params]       Subview params
   */
  initSubview(View, options, params) {
    if (_.isNull(options) || _.isUndefined(options)) {
      options = {};
    }

    let subview = new View(options);

    if (!_.isUndefined(params)) {
      subview.__subviewParams = params;
    }

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
  destroySubviews(subviews) {
    if (!this.__subviews) {
      return;
    }

    // destroy all subviews
    if (_.isUndefined(subviews)) {
      _.each(this.__subviews, (subview) => {
        subview.remove();
      });

      return;
    }

    // destroy single subview
    if (!_.isArray(subviews)) {
      this.__subviews = _.without(this.__subviews, subviews);
      subviews.remove();
      return;
    }

    // destroy multiple subviews
    this.__subviews = _.difference(this.__subviews, subviews);

    _.each(subviews, (subview) => {
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

  /**
   * Remove subview
   */
  remove() {
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
    Backbone.View.prototype.remove.apply(this, arguments);
  }
};
