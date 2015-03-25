import Backbone from 'backbone';
import $ from 'jquery';
import _ from 'underscore';
import Subview from '../../src/subview';

let View = Backbone.View.extend(Subview);

let PhotoModel = Backbone.Model;

let PhotoCollection = Backbone.Collection.extend({
  model: PhotoModel
});

let PhotoView = View.extend({
  tagName: 'li',

  template: _.template(`
    <img title="<%= title %>" src="<%= media.m %>" alt="<%= title %>" />
  `),

  events: {
    'click img': '_selectPhoto'
  },

  _selectPhoto() {
    this.trigger('selectPhoto', this.model.toJSON());
  },

  render() {
    this.$el.html(
      this.template(this.model.toJSON())
    );
    return this;
  }
});

let CollectionView = View.extend({
  tagName: 'ul',
  render() {
    this.collection.each((model) => {
      this.$el.append(
        this.initSubview(PhotoView, { model: model }).render().$el
      )
    });
  }
});

let InfoView = View.extend({
  tagName: 'ul',

  template: _.template(`
    <li>Author: <%= author %></li>
    <li>Title: <%= title %></li>
    <li>Tags: <%= tags %></li>
  `),

  initialize() {
    this.listenTo(this.model, 'change', this.render);
  },

  render() {
    this.$el.html(
      this.template(this.model.toJSON())
    );
  }
});

let AppView = View.extend({
  bubbleEvents: {
    'selectPhoto': '_onPhotoSelected'
  },

  _onPhotoSelected(photo) {
    this.infoModel.set(photo);
  },

  initialize() {
    this.infoModel = new Backbone.Model();
    this.infoView = this.initSubview(InfoView, {
      el: this.$('#info'),
      model: this.infoModel
    });

    $.getJSON('http://api.flickr.com/services/feeds/groups_pool.gne?id=998875@N22&lang=en-us&format=json&jsoncallback=?')
      .then((response) => {
        let photos = response.items;
        let collection = new PhotoCollection(photos);

        this.initSubview(CollectionView, {
          el: this.$('#photos'),
          collection: collection
        }).render();
      });
  }
});

$(() => {
  new AppView({ el: document.body });
});
