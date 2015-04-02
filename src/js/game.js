(function() {
  'use strict';

  function Game() {
    this.snake = null;
    this.coin = null;
    this.map = null;
    this.livesText = null;
    this.scoreText = null;
    this.mainText = null;
    this.lives = 3;
    this.score = 0;
    this.gameStarted = false;
    this.cursors = null;
    this.lastButton = null;

    this.scoreToLevelUp = 30;

    this.startingLevel = 1;
    this.currentLevel = null;
    this.levels = [
      {
        level: 1,
        layer: null,
        layerName: 'Tile Layer 1',
        collisionTiles: [414, 415, 451, 452],
        scoreToBeat: 10,
        startingPos: {
          x: 0,
          y: 0
        },
        startingDir: 'down'
      },
      {
        level: 2,
        layer: null,
        layerName: 'Tile Layer 2',
        collisionTiles: [6, 7, 9, 136],
        scoreToBeat: 20,
        startingPos: {
          x: 0,
          y: 0
        },
        startingDir: 'right'
      },
      {
        level: 3,
        layer: null,
        layerName: 'Tile Layer 3',
        collisionTiles: [6, 7],
        scoreToBeat: 30,
        startingPos: {
          x: 0,
          y: 0
        },
        startingDir: 'right'
      }
    ];
  }

  Game.prototype = {

    create: function () {
      var i;

      this.physics.startSystem(Phaser.Physics.ARCADE);

      this.stage.backgroundColor = '#e0e0e0';
      this.map = this.add.tilemap('mario');
      this.map.addTilesetImage('Mario_Tiles', 'tiles');

      for(i = 0; i < this.levels.length; i++) {
        // load layers
        this.levels[i].layer = this.map.createLayer(this.levels[i].layerName);
        this.map.setCollision(this.levels[i].collisionTiles, true, this.levels[i].layer);
        this.levels[i].layer.visible = false;
      }

      this.cursors = this.input.keyboard.createCursorKeys();

      this.snake = this.add.sprite(0, 0, 'sprites', 'blue-shell');
      this.physics.enable(this.snake);
      this.snake.checkWorldBounds = true;

      this.snake.events.onOutOfBounds.add(this.boundsHit, this);

      /* Coin */
      this.coin = this.add.sprite(0, 0, 'sprites', 'gold-coin1');
      this.coin.animations.add('spin', ['gold-coin1', 'gold-coin2', 'gold-coin3', 'gold-coin4'], 10, true, false);

      /* Text */
      this.scoreText = this.add.text(32, this.world.height - 50, 'score: 0', { font: '20px Arial', fill: '#ffffff', align: 'left' });

      this.livesText = this.add.text(this.world.width - 32, this.world.height - 50, 'lives: 3', { font: '20px Arial', fill: '#ffffff', align: 'left' });
      this.livesText.anchor.setTo(1, 0);

      this.mainText = this.add.text(this.world.centerX, this.world.centerY, '- click to start -', { font: '40px Arial', fill: '#ffffff', align: 'center' });
      this.mainText.anchor.setTo(0.5, 0.5);

      this.currentLevel = this.levels[this.startingLevel - 1];
      this.prepareLevel();
      this.input.onDown.add(this.startLevel, this);
    },

    update: function () {
      if (this.gameStarted) {
        this.physics.arcade.collide(this.snake, this.currentLevel.layer, this.boundsHit, null, this);
        if (this.isSnakeOverlappingCoin()) {
          this.collectCoin();
        }

        // perform any adjustments
        if (this.isSnakeMovingInDirection('up') || this.isSnakeMovingInDirection('down')) {
          // check if snake is not along x-axis
          if (this.snake.x % 16 !== 0) {
            // set x to nearest multiple of 16
            if (this.snake.x % 16 < 8) {
              this.snake.x = Math.floor(this.snake.x/16) * 16;
            } else {
              this.snake.x = Math.ceil(this.snake.x/16) * 16;
            }
          }
        } else if (this.isSnakeMovingInDirection('left') || this.isSnakeMovingInDirection('right')) {
          // check if snake is not along y-axis
          if (this.snake.y % 16 !== 0) {
            // set y to nearest multiple of 16
            if (this.snake.y % 16 < 8) {
              this.snake.y = Math.floor(this.snake.y/16) * 16;
            } else {
              this.snake.y = Math.ceil(this.snake.y/16) * 16;
            }
          }
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

        // check for level up
        if (this.checkIfLevelUp()) {
          this.levelUp();
        }
      }
    },

    checkIfLevelUp: function() {
      return this.score >= this.currentLevel.scoreToBeat;
    },

    levelUp: function() {
      // hide previous level
      this.currentLevel.layer.visible = false;

      // change current level to next level
      if (this.levels.length === this.currentLevel.level) {
        // we reached the last level
        this.gameWon();
      } else {
        // at least one level remaining
        this.currentLevel = this.levels[(this.currentLevel.level + 1) - 1];

        this.mainText.text = '- level ' + this.currentLevel.level + ' -';
        this.mainText.visible = true;

        this.gameStarted = false;
        this.prepareLevel();
      }
    },

    prepareLevel: function() {
      this.mainText.text = '- click to start -';
      this.mainText.visible = true;

      this.coin.kill();

      // set snake starting position
      this.snake.x = this.currentLevel.startingPos.x;
      this.snake.y = this.currentLevel.startingPos.y;

      // stop snake from moving
      this.snake.body.velocity.x = 0;
      this.snake.body.velocity.y = 0;

      // set layer for level
      this.currentLevel.layer.visible = true;
      this.currentLevel.layer.resizeWorld();
    },

    startLevel: function () {
      if (!this.gameStarted) {
        // hide text
        this.mainText.visible = false;
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
        this.snake.revive();
        this.changeSnakeDir(this.currentLevel.startingDir);
      }
    },

    gameOver: function() {
      this.mainText.text = 'Game Over!';
      this.mainText.visible = true;
      this.lives = 3;

      this.prepareLevel();
    },

    gameWon: function() {
      this.mainText.text = 'You Win!';
      this.mainText.visible = true;
      this.lives = 3;

      this.prepareLevel();
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

    boundsHit: function () {
      if (this.gameStarted) {
        this.lives--;
        this.livesText.text = 'lives: ' + this.lives;
        this.gameStarted = false;
        if (this.lives === 0) {
          this.gameOver();
        } else {
          this.prepareLevel();
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
        layerCoinOverlap = this.physics.arcade.overlap(this.currentLevel.layer, this.coin);
      }
    },

    isSnakeOverlappingCoin: function() {
      var snakeBounds = this.snake.getBounds();
      var coinBounds = this.coin.getBounds();

      if (Phaser.Rectangle.intersects(snakeBounds, coinBounds)) {
        // if snake is moving up/down, overlap along x-axis boundaries should not trigger an overlap
        if (this.isSnakeMovingInDirection('up') || this.isSnakeMovingInDirection('down')) {
          if (snakeBounds.x !== coinBounds.x + coinBounds.width && coinBounds.x !== snakeBounds.x + snakeBounds.width) {
            // objects not touching along x-axis
            return true;
          }
        } else if (this.isSnakeMovingInDirection('left') || this.isSnakeMovingInDirection('right')) {
          if (snakeBounds.y !== coinBounds.y + coinBounds.height && coinBounds.y !== snakeBounds.y + snakeBounds.height) {
            // objects not touching along x-axis
            return true;
          }
        }
      }
      return false;
    }
  };

  window['snake'] = window['snake'] || {};
  window['snake'].Game = Game;

}());
