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
    this.lastButton = null;
    this.level = 1;
  }

  Game.prototype = {

    create: function () {
      this.physics.startSystem(Phaser.Physics.ARCADE);

      this.stage.backgroundColor = '#000';
      this.map = this.add.tilemap('mario');
      this.map.addTilesetImage('Mario_Tiles', 'tiles');

      if (this.level === 1) {
        // Setup for Tile Layer 1
        this.layer = this.map.createLayer('Tile Layer 1');
        this.map.setCollisionBetween(414, 415);
        this.map.setCollisionBetween(451, 452);
      } else if (this.level === 2) {
        // Setup for Tile Layer 2
        this.layer = this.map.createLayer('Tile Layer 2');
        this.map.setCollision([6, 7, 136], true, this.layer);
      } else if (this.level === 3) {
        // Setup for Tile Layer 3
        this.layer = this.map.createLayer('Tile Layer 3');
        this.map.setCollision([6], true, this.layer);
      }

      this.layer.resizeWorld();

      this.cursors = this.input.keyboard.createCursorKeys();

      this.snake = this.add.sprite(0, 0, 'sprites', 'blue-shell');
      this.physics.enable(this.snake);
      this.snake.checkWorldBounds = true;

      this.snake.events.onOutOfBounds.add(this.boundsHit, this);

      /* Coin */
      this.coin = this.add.sprite(0, 0, 'sprites', 'gold-coin1');
      this.coin.animations.add('spin', ['gold-coin1', 'gold-coin2', 'gold-coin3', 'gold-coin4'], 10, true, false);
      this.coin.kill();

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

        // perform any adjustments
        if (this.isSnakeMovingInDirection('up')) {
          // make sure snake is positioned directly along x-axis tile boundary
          this.snake.x = Math.floor(this.snake.x/16) * 16;
        } else if (this.isSnakeMovingInDirection('down')) {
          // make sure snake is positioned directly along x-axis tile boundary
          this.snake.x = Math.ceil(this.snake.x/16) * 16;
        } else if (this.isSnakeMovingInDirection('left')) {
          // make sure snake is positioned directly along y-axis tile boundary
          this.snake.y = Math.floor(this.snake.y/16) * 16;
        } else if (this.isSnakeMovingInDirection('right')) {
          // make sure snake is positioned directly along y-axis tile boundary
          this.snake.y = Math.ceil(this.snake.y/16) * 16;
        }

        // only take action on button press when snake is on top of grid tile
        if (this.lastButton !== null && this.snake.x % 16 === 0 && this.snake.y % 16 === 0) {
          if (this.isSnakeMovingInDirection('up') || this.isSnakeMovingInDirection('down')) {
            if (this.lastButton === 'right' || this.lastButton === 'left') {
              this.changeSnakeDir(this.lastButton);
            }
          } else if (this.isSnakeMovingInDirection('right') || this.isSnakeMovingInDirection('left')) {
            if (this.lastButton === 'up' || this.lastButton === 'down') {
              this.changeSnakeDir(this.lastButton);
            }
          }
        }

        // queue button press or swipe
        if (this.isSnakeMovingInDirection('up') || this.isSnakeMovingInDirection('down')) {
          // only allow changing direction to left/right when moving up/down
          if (this.cursors.left.isDown || this.isSwiping('left')) {
            this.lastButton = 'left';
          } else if (this.cursors.right.isDown || this.isSwiping('right')) {
            this.lastButton = 'right';
          }
        } else if (this.isSnakeMovingInDirection('right') || this.isSnakeMovingInDirection('left')) {
          // only allow changing direction to up/down when moving left/right
          if (this.cursors.up.isDown || this.isSwiping('up')) {
            this.lastButton = 'up';
          } else if (this.cursors.down.isDown || this.isSwiping('down')) {
            this.lastButton = 'down';
          }
        }
      }
    },

    isSwiping: function(dir) {
      var distanceThreshold = 16; // in pixels
      var durationMin = 50; // in ms
      var durationMax = 1000; // in ms

      if (Phaser.Point.distance(this.input.activePointer.position, this.input.activePointer.positionDown) > distanceThreshold &&
          this.input.activePointer.duration > durationMin && this.input.activePointer.duration < durationMax)
      {
        // force direction of swipe to only be ONE of the directions, not multiple
        // to do this, find the max distance for each swiped direction and return the
        // direction with the max

        var firstPointX = this.input.activePointer.positionDown.x;
        var firstPointY = this.input.activePointer.positionDown.y;
        var lastPointX = this.input.activePointer.position.x;
        var lastPointY = this.input.activePointer.position.y;

        var leftDist = firstPointX - lastPointX;
        var rightDist = lastPointX - firstPointX;
        var upDist = firstPointY - lastPointY;
        var downDist = lastPointY - firstPointY;

        var max = Math.max(leftDist, rightDist, upDist, downDist);
        if (dir === 'left') {
          return max === leftDist;
        } else if (dir === 'right') {
          return max === rightDist;
        } else if (dir === 'up') {
          return max === upDist;
        } else if (dir === 'down') {
          return max === downDist;
        }
      }
      return false;
    },

    changeSnakeDir: function(dir) {
      var baseVelocity = 60;

      if (dir === 'left') {
        this.snake.body.velocity.y = 0;
        this.snake.body.velocity.x = baseVelocity * -2;
      } else if (dir === 'right') {
        this.snake.body.velocity.y = 0;
        this.snake.body.velocity.x = baseVelocity * 2;
      } else if (dir === 'up') {
        this.snake.body.velocity.y = baseVelocity * -2;
        this.snake.body.velocity.x = 0;
      } else if (dir === 'down') {
        this.snake.body.velocity.y = baseVelocity * 2;
        this.snake.body.velocity.x = 0;
      }

      this.lastButton = null;
    },

    isSnakeMovingInDirection: function (dir) {
      var movingDir = null;

      if (this.snake.body.velocity.y > 0) {
        movingDir = 'down';
      } else if (this.snake.body.velocity.y < 0) {
        movingDir = 'up';
      } else if (this.snake.body.velocity.x > 0) {
        movingDir = 'right';
      } else if (this.snake.body.velocity.x < 0) {
        movingDir = 'left';
      }

      // return true if matches input
      return movingDir === dir;
    },

    startGame: function () {
      if (!this.gameStarted) {
        // hide text
        this.introText.visible = false;
        this.livesText.text = 'lives: ' + this.lives;
        this.scoreText.text = 'score: ' + this.score;

        // reset coin
        this.coin.revive();
        this.moveCoinToRandomPos();
        this.coin.animations.play('spin');

        // reset button queued
        this.lastButton = null;

        // start game
        this.gameStarted = true;

        // start moving snake
        this.changeSnakeDir('down');
      }
    },

    boundsHit: function () {
      if (this.gameStarted) {
        // reset snake
        this.snake.x = 0;
        this.snake.y = 0;
        this.snake.body.velocity.x = 0;
        this.snake.body.velocity.y = 0;

        this.coin.kill();
        this.lives--;
        this.livesText.text = 'lives: ' + this.lives;
        this.gameStarted = false;
        if (this.lives === 0) {
          this.gameOver();
        } else {
          this.resetLevel();
        }
      }
    },

    collectCoin: function() {
      this.score += 10;
      this.scoreText.text = 'score: ' + this.score;

      this.moveCoinToRandomPos();
    },

    moveCoinToRandomPos: function() {
      var snakeCoinOverlap = true;
      var layerCoinOverlap = true;

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
      this.lives = 3;
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
