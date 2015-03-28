(function() {
  'use strict';

  function Game() {
    this.snake = null;
    this.coin = null;
    this.map = null;
    this.layer = null;
    this.livesText = null;
    this.scoreText = null;
    this.introText = null;
    this.lives = 3;
    this.score = 0;
    this.gameStarted = false;
    this.cursors = null;
  }

  Game.prototype = {

    create: function () {
      this.physics.startSystem(Phaser.Physics.ARCADE);

      this.stage.backgroundColor = '#000';
      this.map = this.add.tilemap('mario');
      this.map.addTilesetImage('Mario_Tiles', 'tiles');

      this.map.setCollisionBetween(414, 415);
      this.map.setCollisionBetween(451, 452);

      this.layer = this.map.createLayer('Tile Layer 1');
      this.layer.resizeWorld();

      this.cursors = this.input.keyboard.createCursorKeys();

      this.snake = this.add.sprite(0, 0, 'player');
      this.physics.enable(this.snake);
      this.snake.checkWorldBounds = true;

      this.snake.events.onOutOfBounds.add(this.boundsHit, this);

      /* Coin */
      this.coin = this.add.sprite(this.rnd.between(0, 25) * 16,
                                  this.rnd.between(0, 25) * 16, 'coins', 'coin1');
      this.coin.animations.add('spin', ['coin1', 'coin2', 'coin3', 'coin4'], 10, true, false);

      /* Text */

      this.scoreText = this.add.text(32, this.world.height - 50, 'score: 0', { font: '20px Arial', fill: '#ffffff', align: 'left' });

      this.livesText = this.add.text(this.world.width - 32, this.world.height - 50, 'lives: 3', { font: '20px Arial', fill: '#ffffff', align: 'left' });
      this.livesText.anchor.setTo(1, 0);

      this.introText = this.add.text(this.world.centerX, this.world.centerY, '- click to start -', { font: '40px Arial', fill: '#ffffff', align: 'center' });
      this.introText.anchor.setTo(0.5, 0.5);

      this.input.onDown.add(this.startGame, this);
    },

    update: function () {
      if (this.gameStarted) {
        this.physics.arcade.collide(this.snake, this.layer, this.boundsHit, null, this);
        if (checkOverlap(this.snake, this.coin)) {
          this.collectCoin();
        }
        
        if (this.cursors.left.isDown) {
          this.snake.body.velocity.y = 0;
          this.snake.body.velocity.x = -100;
        } else if (this.cursors.right.isDown) {
          this.snake.body.velocity.y = 0;
          this.snake.body.velocity.x = 100;
        } else if (this.cursors.up.isDown) {
          this.snake.body.velocity.y = -100;
          this.snake.body.velocity.x = 0;
        } else if (this.cursors.down.isDown) {
          this.snake.body.velocity.y = 100;
          this.snake.body.velocity.x = 0;
        }
      }
    },

    startGame: function () {
      if (!this.gameStarted) {
        this.gameStarted = true;
        this.initSnake();
        this.introText.visible = false;
        this.coin.revive();
        this.coin.animations.play('spin');
      }
    },

    initSnake: function () {
      this.snake.x = 0;
      this.snake.y = 0;
      this.snake.body.velocity.y = 100;
      this.snake.body.velocity.x = 0;
      this.snake.revive();
    },

    boundsHit: function () {
      this.snake.kill();
      this.coin.kill();
      this.lives--;
      this.livesText.text = 'lives: ' + this.lives;
      this.gameStarted = false;
      if (this.lives === 0) {
        this.gameOver();
      } else {
        this.resetLevel();
      }
    },

    collectCoin: function() {
      var snakeCoinOverlap = true;
      var layerCoinOverlap = true;

      this.score += 10;
      this.scoreText.text = 'score: ' + this.score;

      while (snakeCoinOverlap || layerCoinOverlap) {
        this.coin.x = this.rnd.between(0, 25) * 16;
        this.coin.y = this.rnd.between(0, 25) * 16;
        snakeCoinOverlap = this.physics.arcade.overlap(this.snake, this.coin);
        layerCoinOverlap = this.physics.arcade.overlap(this.layer, this.coin);
      }
    },

    resetLevel: function() {
      this.introText.text = '- click to start -';
      this.introText.visible = true;
    },

    gameOver: function() {
      this.introText.text = 'Game Over!';
      this.introText.visible = true;
    }
  };

  function checkOverlap(spriteA, spriteB) {
    var boundsA = spriteA.getBounds();
    var boundsB = spriteB.getBounds();

    return Phaser.Rectangle.intersects(boundsA, boundsB);
  }

  window['snake'] = window['snake'] || {};
  window['snake'].Game = Game;

}());
