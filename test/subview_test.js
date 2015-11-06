import Backbone from 'backbone';
import ChildMixin from '../dist/subview';

describe('ChildMixin', function () {

  describe('Subview init/remove', () => {
    let View;
    let view;
    let SubView;
    let subview;

    /**
     * Helper function
     * @param  {Backbone.View} View Backbone view that has subviews
     * @return {Number}        Subviews count
     */
    function subviewCount(view) {
      if (!view.__subviews) {
        return 0;
      }

      return view.__subviews.length;
    }

    beforeEach(() => {
      View = Backbone.View.extend(ChildMixin);
      SubView = Backbone.View.extend(ChildMixin);

      view = new View();

      spyOn(SubView.prototype, 'initialize');
      subview = view.initSubview(SubView);
    });

    describe('#initSubview', () => {
      it('should instantiate subview correctly', () => {
        expect(subview.initialize).toHaveBeenCalled();
        expect(subviewCount(view)).toBe(1);
      });

      it('should return instance of subview', () => {
        expect(subview instanceof SubView).toBe(true);
      });

      it('should provide default options if they are not provided', () => {
        view.initSubview(SubView);
        expect(subview.initialize).toHaveBeenCalledWith({});
      });

      it('should provide default options if they are set to `null`', () => {
        view.initSubview(SubView, null, { remove: false });
        expect(subview.initialize).toHaveBeenCalledWith({});
      });
    });

    describe('#destroySubviews', () => {
      let secondSubview;

      beforeEach(() => {
        secondSubview = view.initSubview(SubView);
        spyOn(secondSubview, 'remove');
        spyOn(subview, 'remove');
      });

      it('should correctly just provided subview', () => {
        view.destroySubviews(secondSubview);

        expect(secondSubview.remove).toHaveBeenCalled();
        expect(subview.remove).not.toHaveBeenCalled();
        expect(subviewCount(view)).toBe(1);
      });

      it('should remove multiple subviews', () => {
        view.destroySubviews([subview, secondSubview]);

        expect(subview.remove).toHaveBeenCalled();
        expect(secondSubview.remove).toHaveBeenCalled();
        expect(subviewCount(view)).toBe(0);
      });

      it('should correctly destroy all subviews if no exact subview provided', () => {
        view.destroySubviews();

        expect(subview.remove).toHaveBeenCalled();
        expect(secondSubview.remove).toHaveBeenCalled();
        expect(subviewCount(view)).toBe(0);
      });
    });

    describe('#remove', () => {
      it('should remove subviews correctly', () => {
        spyOn(subview, 'remove').and.callThrough();
        view.remove();

        expect(subview.remove).toHaveBeenCalled();
        expect(subviewCount(view)).toBe(0);
      });

      it('should remove all subviews on #remove()', () => {
        view.remove();
        expect(subviewCount(view)).toBe(0);
      });

      it('should remove subviews of subviews correctly', () => {
        let subviewOfSubview = subview.initSubview(SubView);
        expect(subviewCount(subviewOfSubview)).toBe(0);

        view.remove();
        expect(subviewCount(subviewOfSubview)).toBe(0);
      });

      it('should call Backbone.prototype.remove on #remove()', () => {
        spyOn(Backbone.View.prototype, 'remove');
        view.remove();
        expect(Backbone.View.prototype.remove).toHaveBeenCalled();
      });

      it('should remove reference from parent view if subview was removed directly', () => {
        subview.remove();
        expect(subviewCount(view)).toBe(0);
      });

      describe('Subview remove strategies', () => {
        let View;
        let view;
        let subview;

        beforeEach(() => {
          View = Backbone.View.extend(ChildMixin);
          view = new View();
        });

        it('should work if no remove options provided', () => {
          subview = view.initSubview(View);

          spyOn(subview, 'destroySubviews');
          spyOn(Backbone.View.prototype, 'remove');

          view.destroySubviews();

          expect(subview.destroySubviews).toHaveBeenCalled();
          expect(Backbone.View.prototype.remove).toHaveBeenCalled();
        });

        it('should work if `remove` option set to `true`', () => {
          subview = view.initSubview(View, {}, { remove: true });

          spyOn(subview, 'destroySubviews');
          spyOn(Backbone.View.prototype, 'remove');

          view.destroySubviews();

          expect(subview.destroySubviews).toHaveBeenCalled();
          expect(Backbone.View.prototype.remove).toHaveBeenCalled();
        });

        it('should work if `remove` option set to `false`', () => {
          subview = view.initSubview(View, {}, { remove: false });

          spyOn(subview, 'destroySubviews');
          spyOn(Backbone.View.prototype, 'remove');
          spyOn(Backbone.View.prototype, 'undelegateEvents');
          spyOn(Backbone.View.prototype, 'stopListening');
          spyOn(subview.$el, 'empty');

          view.destroySubviews();

          expect(subview.destroySubviews).toHaveBeenCalled();
          expect(Backbone.View.prototype.remove).not.toHaveBeenCalled();
          expect(Backbone.View.prototype.undelegateEvents).toHaveBeenCalled();
          expect(Backbone.View.prototype.stopListening).toHaveBeenCalled();
          expect(subview.$el.empty).not.toHaveBeenCalled();
        });

        it('should work if `remove` option set to `"content"`', function() {
          subview = view.initSubview(View, {}, { remove: 'content' });

          spyOn(subview, 'destroySubviews');
          spyOn(Backbone.View.prototype, 'remove');
          spyOn(Backbone.View.prototype, 'undelegateEvents');
          spyOn(Backbone.View.prototype, 'stopListening');
          spyOn(subview.$el, 'empty');

          view.destroySubviews();

          expect(subview.destroySubviews).toHaveBeenCalled();
          expect(Backbone.View.prototype.remove).not.toHaveBeenCalled();
          expect(Backbone.View.prototype.undelegateEvents).toHaveBeenCalled();
          expect(Backbone.View.prototype.stopListening).toHaveBeenCalled();
          expect(subview.$el.empty).toHaveBeenCalled();
        });
      });
    });
  });

  describe('Subview events', () => {
    let view;

    beforeEach(() => {
      let View = Backbone.View.extend(ChildMixin);

      let RootView = View.extend({
        bubbleEvents: {
          'plus': '_onPlus',
          'minus': '_onMinus'
        },

        _onPlus(num) {
          this.sum += num;
        },

        _onMinus(num) {
          this.sum -= num;
        },

        initialize() {
          this.sum = 0;
          this.subview = this.initSubview(SubView);
          this.subviewWithoutBubble = this.initSubview(View);
        }
      });

      let SubView = View.extend({
        bubbleEvents: {
          'plus': '_onPlus'
        },

        _onPlus(num) {
          this.sum += num;
        },

        initialize() {
          this.sum = 0;
          this.subviewWithoutBubble = this.initSubview(View);
        }
      });

      view = new RootView();
    });

    it('should handle bubbled events from direct subview', () => {
      view.subview.trigger('plus', 1);
      expect(view.sum).toBe(1);
    });

    it('should proxy event without handling it', () => {
      view.subview.subviewWithoutBubble.trigger('minus', 2);
      expect(view.sum).toBe(-2);
    });

    it('should proxy events with handling it', () => {
      view.subview.subviewWithoutBubble.trigger('plus', 1);
      expect(view.subview.sum).toBe(1);
      expect(view.sum).toBe(1);
    });
  });
});
