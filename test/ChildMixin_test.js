import Backbone from 'backbone';
import ChildMixin from '../src/ChildMixin';

describe('ChildMixin', function () {
  let View;
  let view;
  let SubView;
  let subview;

  /**
   * Helper function
   * @param  {Backbone.View} View Backbone view that has subviews
   * @return {Number}        Subviews count
   */
  function subviewCount(View) {
    if (!View.__subviews) {
      return 0;
    }

    return View.__subviews.length;
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

    it('should instantiate inside parent view if .el is a string', () => {
      spyOn(view, '$');
      subview = view.initSubview(SubView, { el: '.some-selector' });
      expect(view.$).toHaveBeenCalledWith('.some-selector');
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
    });

    it('should correctly destroy all subviews if no exact subview provided', () => {
      view.destroySubviews();
      expect(subview.remove).toHaveBeenCalled();
      expect(secondSubview.remove).toHaveBeenCalled();
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
  });
});
