# Backbone-subview - Simple subview manager
[![Build Status](https://travis-ci.org/ValeriiVasin/backbone-subview.svg?branch=master)](https://travis-ci.org/ValeriiVasin/backbone-subview)


# Benefits
* Automatically cleans up subviews when a parent view is removed
* Simplified communication between views in hierarchy (from child to parent)

# Installation
NPM:
```
npm install backbone-subview --save
```

Bower:
```bash
bower install backbone-subview --save
```

# Usage
Extend your base view with `backbone-subview`:

```js
var Backbone = require('backbone');
var BackboneSubview = require('backbone-subview');

var View = Backbone.View.extend(BackboneSubview);

module.exports = View;
```

## intiSubview(SubView:Backbone.View, options:Object)
Instantiate subviews inside the view using `this.initSubview(SubView, options)`, where `Subview` - child view you want to instantiate, `options` - usual view options like `el`, `model`, `collection` etc.

```js
// file: ListView.js

// your base view
var View = require('lib/view');
var ListItemView = require('./ListItem');

var ListView = View.extend({
  tagName: 'ul',

  render: function() {
    this.collection.each(function(model) {
      this.$el.append(
        // initialize subview and add it to the DOM
        this.initSubview(ListItemView, { model: model })
          .render().el
      );
    }, this);
  }
});
```

When you instantiate all subviews this way - you could control their life cycle and properly remove all of them if view is destroyed.

## In-component communication
By default, using Backbone, you could `listenTo` view events only in direct parent view. And it's not possible to listen to any nested subviews events deeper. With `backbone-subview` you could listen to any triggered child events using `bubbleEvents`.

```js
// Search.js
var SearchView = View.extend({
  // listen to subviews events
  bubbleEvents: {
    'userSearchResultSelected': 'onUserSearchResultSelected'
  },

  onUserSearchResultSelected: function(user) {
    // do smth with user
  }
});

// UserSearchResultView.js - deep nested view
var UserSearchResultView = View.extend({
  events: {
    'click': 'selectUser'
  },

  selectUser: function() {
    // trigger event that could be handled by any parent view
    this.trigger('userSearchResultSelected', this.model.toJSON());
  }
});
```

Using `bubbleEvents` allows you to listen to child events without extra pain. Child events will be automatically proxied to any parent view that requests them, like DOM events.

It allows you to avoid event namespaces soup and makes views more isolated.

**Notice:** Bubble events handlers will be automatically bound to `this` as usual Backbone events.
**Notice:** You should create all your subviews with `this.initSubview()`, otherwise child/parent channel will be lost and communication will not be possible.

## destroySubviews([Subview:Backbone.View])
You could manually destroy all instantiated subviews:

```js
var ItemView = require('./ItemView');
var ListView = View.extend({
  template: listViewTemplateFn,

  render: function() {
    // destroy all subviews
    this.destroySubviews();

    this.$el.html(
      this.template(this.model.toJSON())
    );

    this.initSubview(ItemView, {
      el: this.$('.js-selector')
    });
  }
});
```

**Notice:** Subview will be automatically destroyed if you `remove()` parent view
