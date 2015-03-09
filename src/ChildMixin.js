import Backbone from 'backbone';
import _ from 'underscore';

export default {
    /**
     * Instantiate subview within current view
     * @param  {Backbone.View} View Subview
     * @param  {Object} params      View params
     */
    initSubview: function(View, params) {
        if (typeof params === 'undefined') {
          params = {};
        }

        // find selector inside parent view
        if (typeof params.el === 'string') {
            params.el = this.$(params.el);
        }

        let subview = new View(params);

        // remove reference from parent
        // Notice: .remove() has been already handled
        this.listenTo(subview, '__remove__', function() {
            this.__subviews = _.without(this.__subviews, subview);
        }, this);

        if (!this.__subviews) {
            this.__subviews = [];
        }
        this.__subviews.push(subview);

        return subview;
    },

    destroySubviews: function(subview) {
        if (!this.__subviews) {
            return;
        }

        if (subview) {
            this.__subviews = _.without(this.__subviews, subview);
            subview.remove();
            return;
        }

        _.each(this.__subviews, function(subview) {
            subview.remove();
        });
    },

    remove: function() {
        this.destroySubviews();
        this.trigger('__remove__', this);
        Backbone.View.prototype.remove.apply(this, arguments);
    }
};
