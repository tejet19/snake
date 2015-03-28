(function() {
  'use strict';

  function Menu() {
    this.titleTxt = null;
    this.startTxt = null;
  }

  Menu.prototype = {

    create: function () {
      this.game.state.start('game');
    },

    update: function () {

    },

    onDown: function () {
    }
  };

  window['snake'] = window['snake'] || {};
  window['snake'].Menu = Menu;

}());
