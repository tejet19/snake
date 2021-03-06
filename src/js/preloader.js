(function() {
  'use strict';

  function Preloader() {
    this.asset = null;
    this.ready = false;
  }

  Preloader.prototype = {

    preload: function () {
      this.asset = this.add.sprite(this.game.width * 0.5 - 110, this.game.height * 0.5 - 10, 'preloader');

      this.load.onLoadComplete.addOnce(this.onLoadComplete, this);
      this.load.setPreloadSprite(this.asset);

      this.loadResources();
    },

    loadResources: function () {
      this.load.tilemap('mario', 'assets/tilemaps/mario-level1.json', null, Phaser.Tilemap.TILED_JSON);
      this.load.image('tiles', 'assets/tilemaps/Mario_Tiles.png');

      this.load.atlas('sprites', 'assets/tilemaps/Mario_Tiles.png', 'assets/tilemaps/sprites.json');
    },

    create: function () {
      this.asset.cropEnabled = false;
    },

    update: function () {
      if (!!this.ready) {
        this.game.state.start('menu');
      }
    },

    onLoadComplete: function () {
      this.ready = true;
    }
  };

  window['snake'] = window['snake'] || {};
  window['snake'].Preloader = Preloader;

}());
