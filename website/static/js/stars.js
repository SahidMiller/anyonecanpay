module.exports = function (PIXI) {
  const starsElement = document.getElementById('stars');
  if (!starsElement) {
    return;
  }

  const STAR_COLORS = [0xffffff, 0xffffff];
  const FILL_COLOR = 0xffffff;
  const LINE_COLOR = 0x6acad1;
  const LINE_SPEED = 40;
  const LINE_FADE_SECONDS = 15;
  const LINE_OPACITY_MAX = 0.8;
  const LINE_OPACITY_MIN = 0.05;
  const LINE_FORK_CHANCE = 0.35; // 35% chance
  const LINE_WIDTH = 1;
  const HOPS = 10;
  const NEW_LINE_ON_HOP = 8; // if more than hops, start a new one at last hop
  const STAR_RADIUS_MAX = 4;
  const STAR_RADIUS_MIN = 0.5;
  const STAR_RADIUS_LARGE_MIN = 2; // small stars are smaller than this, larger stars are larger than this
  const STAR_LARGE_CHANCE = 0.1; // 10% chance
  const STAR_OPACITY_MAX = 0.9;
  const STAR_OPACITY_MIN = 0.4;
  const CELL_WIDTH_TARGET = 70; // canvas is divided into cells, for STARS_PER_CELL to populate
  const CELL_HEIGHT_TARGET = 70; // this ensures good paths to traverse
  const STARS_PER_CELL = 2;
  const MAX_NEIGHBOR_DISTANCE = 300; // if a star is within this range, it can connect
  const MAX_LINKS = 3;
  const TWINKLE_SPEED = 6;
  const TWINKLES_PER_SECOND_PER_STAR = 0.2;
  const ANIMATION_INTERVAL = 1 / 24;
  const CHECK_VISIBLE_INTERVAL = 3000;

  // ------- edit above
  const _STAR_OPACITY_DIFF = STAR_OPACITY_MAX - STAR_OPACITY_MIN;
  const _LINE_OPACITY_DIFF = LINE_OPACITY_MAX - LINE_OPACITY_MIN;
  const _LINE_FADE_SPEED = 1 / LINE_FADE_SECONDS;
  const _PIXEL_RATIO = window.devicePixelRatio || 1;

  function isVisible(elm) {
    const rect = elm.getBoundingClientRect();
    const viewHeight = Math.max(
      document.documentElement.clientHeight,
      window.innerHeight
    );
    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
  }

  function removeItem(list, item) {
    list.splice(list.indexOf(item), 1);
  }

  function StarChart(div, pixi) {
    this.div = div;
    this.pixi = pixi;

    this.pixi.utils.skipHello();

    this.renderer = new pixi.CanvasRenderer(800, 600, {
      antialias: true,
      transparent: true,
      resolution: _PIXEL_RATIO,
    });

    // don't disable scrolling interactions
    this.renderer.plugins.interaction.autoPreventDefault = false;

    this.stage = new this.pixi.Container();
    this.cellWidth = this.goalWidth = CELL_WIDTH_TARGET;
    this.cellHeight = this.goalHeight = CELL_HEIGHT_TARGET;
    this.starCount = STARS_PER_CELL;
    this.running = false;
    this.animationEnabled = true;
    this.stars = {};
    this.starList = [];
    this.cells = [];
    this.comets = [];
    this.animatingStars = [];
    this.removeAnimatingStars = [];
    this.removeComets = [];
    this.activeStar = null;

    window.addEventListener(
      'resize',
      function (e) {
        this.setSize();
      }.bind(this)
    );

    this.renderer.view.addEventListener(
      'click',
      function (e) {
        if (!this.animationEnabled) {
          return;
        }

        this.createCometGroup(e.clientX, e.clientY);
      }.bind(this)
    );

    div.appendChild(this.renderer.view);
    this.setSize();
    this.checkVisible();
  }

  (function () {
    this.setAnimationEnabled = function (enabled) {
      this.animationEnabled = enabled;
      this.checkVisible();
    };

    this.checkVisible = function () {
      if (!this.animationEnabled) {
        this.pause();
        return;
      }

      if (isVisible(this.renderer.view)) {
        this.run();
      } else {
        this.pause();
      }

      setTimeout(this.checkVisible.bind(this), CHECK_VISIBLE_INTERVAL);
    };

    this.run = function () {
      if (!this.running) {
        this.running = true;
        this.lastNow = window.performance.now();
        this.animate();
      }
    };

    this.pause = function () {
      if (this.running) {
        this.running = false;
      }
    };

    this.setSize = function () {
      const width = this.div.clientWidth;
      const height = this.div.clientHeight;

      // window may resize without the div itself changing size, so don't reset
      // if div has not resized
      if (width === this.renderer.width && height === this.renderer.height) {
        return;
      }

      this.renderer.view.style.width = width + 'px';
      this.renderer.view.style.height = height + 'px';
      this.renderer.resize(width, height);
      this.gridX = Math.floor(this.renderer.view.width / this.goalWidth);
      this.gridY = Math.floor(this.renderer.view.height / this.goalHeight);
      this.cellWidth = this.renderer.view.width / this.gridX;
      this.cellHeight = this.renderer.view.height / this.gridY;

      this.comets.forEach(function (comet) {
        comet.destroy();
      });

      this.starList.forEach(function (star) {
        star.destroy();
      });

      this.stage.removeChildren();
      this.setup();
    };

    this.createCometGroup = function (x, y) {
      const star = this.findNearestStar(x, y);
      this.comets.push(new CometGroup(this, star, undefined, HOPS, false));
    };

    this.findNearestStar = function (x, y) {
      let star;
      let minDist = this.div.clientWidth + this.div.clientHeight;
      const cellX = Math.floor(x / this.cellWidth);
      const cellY = Math.floor(y / this.cellHeight);
      const startX = Math.max(cellX - 1, 0);
      const endX = cellX + 1 < this.gridX ? cellX + 1 : cellX;
      const startY = Math.max(cellY - 1, 0);
      const endY = cellY + 1 < this.gridY ? cellY + 1 : cellY;

      for (let cx = startX; cx <= endX; cx++) {
        for (let cy = startY; cy <= endY; cy++) {
          this.cells[cx][cy].forEach(function (other) {
            const dist = Math.sqrt(
              Math.pow(x - other.x, 2) + Math.pow(y - other.y, 2)
            );
            if (dist < minDist) {
              minDist = dist;
              star = other;
            }
          });
        }
      }

      return star;
    };

    this.setup = function () {
      this.stars = {};
      this.starList = [];
      this.cells = [];
      this.comets = [];
      this.removeComets = [];
      this.activeStar = null;
      this.animatingStars = [];
      this.removeAnimatingStars = [];
      this.lastNow = window.performance.now();

      for (let gx = 0; gx < this.gridX; gx++) {
        const row = [];

        for (let gy = 0; gy < this.gridY; gy++) {
          const col = [];

          for (let n = 0; n < this.starCount; n++) {
            const x = Math.round(
              Math.random() * this.cellWidth + gx * this.cellWidth
            );
            const y = Math.round(
              Math.random() * this.cellHeight + gy * this.cellHeight
            );
            const star = new Star(this, x, y, gx, gy);
            this.stars[star.id] = star;
            this.starList.push(star);
            col.push(star);
          }

          row.push(col);
        }

        this.cells.push(row);
      }

      this.twinkleRate =
        1 / (TWINKLES_PER_SECOND_PER_STAR * this.starList.length);

      this.starList.forEach(function (star) {
        star.setLinks();
      });

      this.comets.push(
        new CometGroup(this, this.randomStar(), undefined, HOPS, true, 1)
      );
      this.comets.push(
        new CometGroup(this, this.randomStar(), undefined, HOPS, true)
      );
      this.comets.push(
        new CometGroup(this, this.randomStar(), undefined, HOPS, true)
      );
      this.twinkleStar();
    };

    this.twinkleStar = function () {
      const star = this.randomStar();
      star.twinkling = true;
      this.animatingStars.push(star);
    };

    this.randomStar = function () {
      return this.starList[Math.floor(Math.random() * this.starList.length)];
    };

    let lastTwinkle = 0;

    this.animate = function () {
      if (!this.running) {
        return;
      }

      window.requestAnimationFrame(this.animate.bind(this));

      const now = window.performance.now();
      const dt = (now - this.lastNow) / 1000;
      lastTwinkle += dt;

      if (dt < ANIMATION_INTERVAL) {
        return;
      }

      this.lastNow = now;

      if (lastTwinkle > this.twinkleRate) {
        lastTwinkle = 0;
        this.twinkleStar();
      }

      this.animateStars(dt);
      this.animateComets(dt);
      this.render();
    };

    this.animateStars = function (dt) {
      let r, l;

      for (r = 0, l = this.animatingStars.length; r < l; r++) {
        this.animatingStars[r].animate(dt);
      }

      for (r = 0, l = this.removeAnimatingStars.length; r < l; r++) {
        removeItem(this.animatingStars, this.removeAnimatingStars[r]);
      }

      this.removeAnimatingStars = [];
    };

    this.animateComets = function (dt) {
      let r, l;

      for (r = 0, l = this.comets.length; r < l; r++) {
        this.comets[r].animate(dt);
      }

      for (r = 0, l = this.removeComets.length; r < l; r++) {
        removeItem(this.comets, this.removeComets[r]);
      }

      this.removeComets = [];
    };

    this.render = function () {
      this.renderer.render(this.stage);
    };
  }.call(StarChart.prototype));

  function CometGroup(game, star, next, hops, addAnother, alpha) {
    this.children = [];
    this.game = game;
    this.hops = hops;
    this.visited = {};
    this.ended = 0;
    this.alpha = 1;
    this.fading = false;
    this.addAnother = addAnother;
    this.added = !addAnother;
    this.lineAlpha =
      alpha || LINE_OPACITY_MIN + Math.random() * _LINE_OPACITY_DIFF;
    this.addComet(star, next, hops);
  }

  (function () {
    this.addComet = function (star, next, hops) {
      if (!this.fading) {
        this.children.push(new Comet(this.game, this, star, next, hops));
      }
    };

    this.animate = function (dt) {
      if (this.fading) {
        this.alpha = Math.max(this.alpha - dt * _LINE_FADE_SPEED, 0);

        const r = (STAR_COLORS[1] >> 16) & 0xff;
        const g = (STAR_COLORS[1] >> 8) & 0xff;
        const b = STAR_COLORS[1] & 0xff;
        const r2 = r + (0xff - r) * (1 - this.alpha);
        const g2 = g + (0xff - g) * (1 - this.alpha);
        const b2 = b + (0xff - b) * (1 - this.alpha);
        const color = (r2 << 16) | (g2 << 8) | b2;
        let i, l;

        const vkeys = Object.keys(this.visited);
        for (i = 0, l = vkeys.length; i < l; i++) {
          this.game.stars[vkeys[i]].sprite.tint = color;
        }
      }

      let i, l;

      for (i = 0, l = this.children.length; i < l; i++) {
        this.children[i].animate(dt, this.alpha);
      }

      if (this.alpha === 0) {
        this.destroy();
      }
    };

    this.didHop = function (hop) {
      if (!this.added && HOPS - hop === NEW_LINE_ON_HOP) {
        this.added = true;
        this.game.comets.push(
          new CometGroup(
            this.game,
            this.game.randomStar(),
            undefined,
            HOPS,
            this.addAnother
          )
        );
      }
    };

    this.end = function () {
      this.ended++;
      if (this.ended === this.children.length) {
        this.fade();
      }
    };

    this.fade = function () {
      if (this.fading) {
        return;
      }

      this.fading = true;

      for (let i = 0, l = this.children.length; i < l; i++) {
        this.children[i].fade();
      }

      if (!this.added) {
        this.added = true;
        this.game.comets.push(
          new CometGroup(
            this.game,
            this.game.randomStar(),
            undefined,
            HOPS,
            this.addAnother
          )
        );
      }
    };

    this.destroy = function () {
      let i, l;

      for (i = 0, l = this.children.length; i < l; i++) {
        this.children[i].destroy();
      }

      const vkeys = Object.keys(this.visited);
      for (i = 0, l = vkeys.length; i < l; i++) {
        this.game.stars[vkeys[i]].sprite.tint = STAR_COLORS[1];
      }

      this.game.removeComets.push(this);
    };
  }.call(CometGroup.prototype));

  function Comet(game, parent, star, next, hops) {
    this.game = game;
    this.parent = parent;
    this.fromStar = star;
    this.fromStar.sprite.tint = STAR_COLORS[0];
    this.nextStar = next;
    this.angle = null;
    this.trip = 0;
    this.particles = [];
    this.aparticles = [];
    this.hops = hops;
    this.speed = LINE_SPEED;
    this.sprite = new this.game.pixi.Sprite();
    this.sprite.anchor = new this.game.pixi.Point(0.5, 0.5);
    this.sprite.scale = new this.game.pixi.Point(0.5, 0.5);
    this.sprite.alpha = 0;
    this.game.stage.addChild(this.sprite);
    this.dist = null;
    this.lineColor = LINE_COLOR;
    this.lines = [];
    this.currentLine = new this.game.pixi.Graphics();
    this.ending = false;
    this.fading = false;

    if (this.nextStar === undefined) {
      this.pickNext();
    }
  }

  (function () {
    this.setNext = function (first) {
      this.parent.visited[this.fromStar.id] = true;
      this.parent.visited[this.nextStar.id] = true;
      this.speed =
        LINE_SPEED *
        (1 - (Math.abs(this.fromStar.radius - this.nextStar.radius) / 3) * 0.7);
      this.speed *=
        0.5 + ((this.fromStar.radius + this.nextStar.radius - 2) / 6) * 0.5;

      if (!first && this.hops > 0 && Math.random() < LINE_FORK_CHANCE) {
        this.parent.addComet(this.fromStar, undefined, this.hops - 1, false);
      }

      const dx = this.fromStar.x - this.nextStar.x;
      const dy = this.fromStar.y - this.nextStar.y;
      this.angle = Math.atan2(dy, dx) + Math.PI;
      this.dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

      this.currentLine = new this.game.pixi.Graphics();
      this.currentLine.alpha = this.parent.lineAlpha;
      this.currentLine.lineStyle(LINE_WIDTH, this.lineColor, 1);
      this.currentLine.moveTo(-2, -2);
      this.currentLine.lineTo(-1, -1);
      this.game.stage.addChild(this.currentLine);
    };

    this.pickNext = function (first) {
      if (this.hops <= 0) {
        return this.end();
      }

      this.trip = 0;
      const ikeys = Object.keys(this.fromStar.links);
      const keys = [];

      for (let i = 0, l = ikeys.length; i < l; i++) {
        const key = ikeys[i];
        if (!this.parent.visited[key]) {
          keys.push(key);
        }
      }

      if (keys.length === 0) {
        return this.end();
      }

      this.nextStar = this.fromStar.links[
        keys[Math.floor(Math.random() * keys.length)]
      ];
      this.setNext();

      if (!first) {
        this.hops--;
        this.parent.didHop(this.hops);
      }
    };

    this.end = function () {
      this.ending = true;
      this.parent.end();
    };

    this.fade = function () {
      this.fading = true;
    };

    this.animate = function (dt, alpha) {
      if (this.ending && !this.fading) {
        return;
      }

      this.trip += dt * this.speed;

      if (this.ending && alpha !== 1) {
        for (let i = 0, l = this.lines.length; i < l; i++) {
          this.lines[i].alpha = alpha * this.parent.lineAlpha;
        }

        this.currentLine.alpha = alpha * this.parent.lineAlpha;
      }

      if (!this.ending) {
        this.sprite.x = this.fromStar.x + Math.cos(this.angle) * this.trip;
        this.sprite.y = this.fromStar.y + Math.sin(this.angle) * this.trip;
        this.currentLine.clear();
        this.currentLine.lineStyle(LINE_WIDTH, this.lineColor, 1);
        this.currentLine.moveTo(this.fromStar.x, this.fromStar.y);

        if (this.trip >= this.dist) {
          this.currentLine.lineTo(this.nextStar.x, this.nextStar.y);
          this.lines.push(this.currentLine);
          this.nextStar.sprite.tint = STAR_COLORS[0];
          this.fromStar = this.nextStar;
          this.pickNext();
        } else {
          this.currentLine.lineTo(this.sprite.x, this.sprite.y);
        }
      }
    };

    this.destroy = function () {
      this.game.stage.removeChild(this.sprite);

      for (let i = 0, l = this.lines.length; i < l; i++) {
        this.game.stage.removeChild(this.lines[i]);
      }

      this.game.stage.removeChild(this.currentLine);
    };
  }.call(Comet.prototype));

  function Star(game, x, y, cellX, cellY) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.cellX = cellX;
    this.cellY = cellY;
    this.sprite = new this.game.pixi.Graphics();
    this.sprite.beginFill(FILL_COLOR, 1);

    const large = Math.random() < STAR_LARGE_CHANCE;
    const minRadius = large ? STAR_RADIUS_LARGE_MIN : STAR_RADIUS_MIN;
    const maxRadius = large ? STAR_RADIUS_MAX : STAR_RADIUS_LARGE_MIN;
    this.radius = minRadius + Math.random() * (maxRadius - minRadius);

    this.sprite.drawCircle(0, 0, this.radius);
    this.sprite.endFill();
    this.targetAlpha = this.sprite.alpha =
      STAR_OPACITY_MAX - Math.random() * _STAR_OPACITY_DIFF;

    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.anchor = new this.game.pixi.Point(0.5, 0.5);
    this.sprite.tint = STAR_COLORS[1];
    this.game.stage.addChild(this.sprite);
    this.links = {};
    this.lines = {};
    this.twinkling = false;
    this.id = this.x + 'x' + this.y;
    this.alpha = 0;
  }

  (function () {
    this.animate = function (dt) {
      if (this.twinkling) {
        this.alpha += dt * TWINKLE_SPEED;
        this.sprite.alpha =
          this.targetAlpha -
          Math.sin(this.alpha) * (this.targetAlpha - STAR_OPACITY_MIN);

        if (this.alpha >= Math.PI) {
          this.alpha = 0;
          this.sprite.alpha = this.targetAlpha;
          this.twinkling = false;
          this.game.removeAnimatingStars.push(this);
        }
      }
    };

    this.setLinks = function () {
      const near = [];
      const startX = Math.max(this.cellX - 1, 0);
      const endX =
        this.cellX + 1 < this.game.gridX ? this.cellX + 1 : this.cellX;
      const startY = Math.max(this.cellY - 1, 0);
      const endY =
        this.cellY + 1 < this.game.gridY ? this.cellY + 1 : this.cellY;
      let neighbor;

      for (let cx = startX; cx <= endX; cx++) {
        for (let cy = startY; cy <= endY; cy++) {
          this.game.cells[cx][cy].forEach(
            function (other) {
              if (
                other !== this &&
                !Object.prototype.hasOwnProperty.call(this.links, other.id)
              ) {
                const dist = Math.sqrt(
                  Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2)
                );
                near.push({ star: other, dist: dist });
              }
            }.bind(this)
          );
        }
      }

      near.sort(function (a, b) {
        return a.dist - b.dist;
      });

      for (
        let i = 0;
        near[i].dist < MAX_NEIGHBOR_DISTANCE &&
        Object.keys(this.links).length <= MAX_LINKS;
        i++
      ) {
        neighbor = near[i].star;
        this.links[neighbor.id] = neighbor;
        neighbor.links[this.id] = this;
      }

      if (Object.keys(this.links).length === 0) {
        neighbor = near[0].star;
        this.links[neighbor.id] = neighbor;
        neighbor.links[this.id] = this;
      }

      this.game.stage.removeChild(this.sprite);
      this.game.stage.addChild(this.sprite);
    };

    this.destroy = function () {
      this.game.stage.removeChild(this.sprite);

      Object.keys(this.links).forEach(
        function (linkId) {
          delete this.links[linkId].links[this.id];
        }.bind(this)
      );

      delete this.game.stars[this.id];
      removeItem(this.game.starList, this);
    };
  }.call(Star.prototype));

  const ANIMATION_ENABLED_KEY = 'ipfs.io:animation-enabled';
  const ENABLE_ANIMATION_LABEL = 'Enable animation';
  const DISABLE_ANIMATION_LABEL = 'Disable animation';

  const starChart = new StarChart(starsElement, PIXI);
  const toggleAnimationButton = document.getElementById('toggle-animation');

  function setAnimationEnabled(enabled) {
    window.localStorage.setItem(ANIMATION_ENABLED_KEY, enabled);

    const buttonLabel = enabled
      ? DISABLE_ANIMATION_LABEL
      : ENABLE_ANIMATION_LABEL;
    toggleAnimationButton.textContent = buttonLabel;

    starChart.setAnimationEnabled(enabled);
  }

  toggleAnimationButton.addEventListener('click', function (event) {
    setAnimationEnabled(!starChart.animationEnabled);
  });

  const animationEnabled =
    window.localStorage.getItem(ANIMATION_ENABLED_KEY) !== 'false';
  setAnimationEnabled(animationEnabled);

  if (!animationEnabled) {
    starChart.render();
  }
};
