window.addEventListener("load", (event) => {
  const interface = {
    canvas: document.getElementById("canvas"),
    
    state: "idle",
    grabbing: false,
    howInflated: 0,
    howCharged: 0,
    howFlashed: 0,
    
    expectedFPS: 60,
    chargingTime: 1000,
    inflatingTime: 1000,
    // The ratio for SO is the square of that for Spin
    inflatingLogRatio: 0.2 / 2,
    inflatingStD: 0.05,
    flashingTime: 800,
    // Relative to total flashing time
    flashingFrequency: 3,
    flashingStD: 0.005,
    
    frameCounter: 0,
    
    easer: function (t, T = 1) {
      const u = t / T;
      
      return u * u * (3 - 2 * u)
    }
  }
  
  interface.artist = new Artist(document.getElementById("canvas"), 600, 600);
  interface.context = interface.artist.tracer.context;
  
  interface.resize = function (width, height) {
    this.width = width;
    this.height = height;
    this.centerX = Math.floor(width/2);
    this.centerY = Math.floor(height/2);
    this.artist.resize(width, height);
    this.scale = this.artist.scale;
    this.fullScreenButton = {
      xMin: this.width - 0.2 * this.scale,
      xMax: this.width - 0.05 * this.scale,
      yMin: this.height - 0.2 * this.scale,
      yMax: this.height - 0.05 * this.scale,
    };
  }
    
  interface.resize(window.innerWidth, window.innerHeight);
  
  interface.toggleFullScreen = function () {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    else {
      this.canvas.requestFullscreen().then(() => {
        this.resize(window.screen.width, window.screen.height);
        this.redraw();
      });
    }
  }
  
  interface.canvas.onfullscreenchange = function () {
    if (!document.fullscreenElement) {
      interface.resize(window.innerWidth, window.innerHeight);
      interface.redraw();
    }
  };
  
  interface.norm = function (x, y) {
    return Math.hypot(x - this.centerX, y - this.centerY) / this.scale
  }
  
  interface.forceInSphere = function (x, y, margin) {
    const norm = this.norm(x, y);
    
    if (norm < 1 - margin) {
      return [x, y]
    }
    
    return [
      this.centerX + (x - this.centerX) * (1 - margin) / norm,
      this.centerY + (y - this.centerY) * (1 - margin) / norm
    ]
  }
  
  interface.redraw = function (theta) {
    this.artist.redraw(theta);
    this.drawFullScreenIcon();
  }
  
  const refreshLoop = function (I) {
    A = I.artist;
    
    switch (I.state) {
      case "idle":
        // spin is updated
        break;
      case "charging":
        I.howCharged += 1000 / (I.expectedFPS * I.chargingTime);
        if (I.howCharged > 1) {
          I.howCharged = 0;
          I.state = "inflating";
        }
        // howCharged goes up
        // spin moves according to inertia
        break;
      case "dragging":
        I.howCharged = 0;
        break;
      case "inflating":
        I.howInflated += 1000 / (I.expectedFPS * I.inflatingTime);
        
        {
          const e = I.easer(I.howInflated, 2);
          A.backgroundRadius = 5 * e;
          A.spinNoise = normal.inexpensiveTangentSpin(I.inflatingStD * 2 * e).exponential();
          A.spinNoise = A.spinNoise.sMul(Math.exp(2 * I.inflatingLogRatio * e));
        }
        
        if (I.howInflated > 1) {
          I.howInflated = 0;
          I.state = "flashing";
        }
        
        // howInflated goes up
        // spinNoise is updated
        // backgroundOpacity and backgroundRadius are updated
        break;
      case "deflating":
        I.howInflated -= 1000/ (I.expectedFPS * I.inflatingTime);
        
        {
          const e = I.easer(I.howInflated, 2);
          A.backgroundRadius = 5 * e;
          A.spinNoise = normal.inexpensiveTangentSpin(I.inflatingStD * 2 * e).exponential();
          A.spinNoise = A.spinNoise.sMul(Math.exp(2 * I.inflatingLogRatio * e));
        }

        if (I.howInflated < 0) {
          I.howInflated = 0;
          I.state = "idle";
          A.spinNoise = new Spin(1, 0, 0, 0);
        }
        
        // howInflated goes down
        // spinNoise is updated
        // backgroundOpacity and backgroundRadius are updated
        // spin moves according to inertia
        break;
      case "flashing":
        I.howFlashed += 1000 / (I.expectedFPS * I.flashingTime);
        
        {
          const e = I.easer(1 - I.howFlashed, 2);
          A.backgroundOpacity = I.easer(1 - I.howFlashed);
          A.spinNoise = normal.inexpensiveTangentSpin(I.flashingStD * 2 * e).exponential();
          
          if ((Math.floor(2 * I.howFlashed * I.flashingFrequency) & 1) === 0) {

            A.spinNoise = A.spinNoise.sMul(-1);
          }
        }

        if (I.howFlashed > 1) {
          I.howFlashed = 0;
          I.state = "idle";
          A.spinNoise = new Spin(1, 0, 0, 0);
          A.spin = A.spin.sMul(-1).sanitize();
          A.backgroundOpacity = 1;
          A.backgroundRadius = 0;
        }
        
        // howFlashed goes up
        // spinNoise is updated
        // backgroundOpacity and backgroundRadius are updated
        // spin moves according to inertia
        break;
    }
    
    I.redraw(0);
    window.requestAnimationFrame(() => refreshLoop(I));
  }
  
  interface.drawFullScreenIcon = function () {
    const C = this.context;
    const s = this.scale;
    const x0 = this.width - 0.125 * s; 
    const y0 = this.height - 0.125 * s;
    if (document.fullscreenElement) {
      C.strokeStyle = "white";

      C.beginPath();
      C.arc(x0, y0, 0.09 * s, 0, 6.3);
      C.stroke();

      C.beginPath();
      C.moveTo(x0 - 0.05 * s, y0 - 0.02 * s);
      C.lineTo(x0 - 0.02 * s, y0 - 0.02 * s);
      C.lineTo(x0 - 0.02 * s, y0 - 0.05 * s);
      C.stroke();

      C.beginPath();
      C.moveTo(x0 + 0.02 * s, y0 - 0.05 * s);
      C.lineTo(x0 + 0.02 * s, y0 - 0.02 * s);
      C.lineTo(x0 + 0.05 * s, y0 - 0.02 * s);
      C.stroke();

      C.beginPath();
      C.moveTo(x0 + 0.05 * s, y0 + 0.02 * s);
      C.lineTo(x0 + 0.02 * s, y0 + 0.02 * s);
      C.lineTo(x0 + 0.02 * s, y0 + 0.05 * s);
      C.stroke();

      C.beginPath();
      C.moveTo(x0 - 0.02 * s, y0 + 0.05 * s);
      C.lineTo(x0 - 0.02 * s, y0 + 0.02 * s);
      C.lineTo(x0 - 0.05 * s, y0 + 0.02 * s);
      C.stroke();
    } else {
      C.strokeStyle = "white";

      C.beginPath();
      C.arc(x0, y0, 0.09 * s, 0, 6.3);
      C.stroke();

      C.beginPath();
      C.moveTo(x0 - 0.05 * s, y0 - 0.02 * s);
      C.lineTo(x0 - 0.05 * s, y0 - 0.05 * s);
      C.lineTo(x0 - 0.02 * s, y0 - 0.05 * s);
      C.stroke();

      C.beginPath();
      C.moveTo(x0 + 0.02 * s, y0 - 0.05 * s);
      C.lineTo(x0 + 0.05 * s, y0 - 0.05 * s);
      C.lineTo(x0 + 0.05 * s, y0 - 0.02 * s);
      C.stroke();

      C.beginPath();
      C.moveTo(x0 + 0.05 * s, y0 + 0.02 * s);
      C.lineTo(x0 + 0.05 * s, y0 + 0.05 * s);
      C.lineTo(x0 + 0.02 * s, y0 + 0.05 * s);
      C.stroke();

      C.beginPath();
      C.moveTo(x0 - 0.02 * s, y0 + 0.05 * s);
      C.lineTo(x0 - 0.05 * s, y0 + 0.05 * s);
      C.lineTo(x0 - 0.05 * s, y0 + 0.02 * s);
      C.stroke();
    }
  }
  
  interface.screenArea = function (x, y) {
    if (this.norm(x, y) < 1) {
      return "circle"
    }
    
    if (
      x > this.fullScreenButton.xMin && x < this.fullScreenButton.xMax &&
      y > this.fullScreenButton.yMin && y < this.fullScreenButton.yMax
    ) {
      return "fullscreen"
    }
    
    return "other"
  }
  
  interface.onClick = function (x, y) {
    const area = this.screenArea(x, y);
    if (area == "fullscreen") {
      this.toggleFullScreen(this.artist);
      return
    } else if (area == "other") {
      return
    }
    
    this.previousGrab = [x, y];
    switch (this.state) {
      case "idle":
        this.state = "charging";
        this.grabbing = true;
        break;
      case "deflating":
        this.state = "inflating";
        this.grabbing = true;
        break;
    }
  };
  
  interface.onRelease = function () {
    this.grabbing = false;
    
    switch (this.state) {
      case "charging":
        this.state = "idle";
        this.howCharged = 0;
        break;
      case "dragging":
        this.state = "idle";
        break;
      case "inflating":
        this.state = "deflating";
        break;
    }
    
    this.artist.spin.sanitize();
  };
  
  interface.onMove = function (x, y) {
    if (!this.grabbing) {
      return
    }
    
    const A = this.artist;
    
    // Force in sphere
    const newq = this.forceInSphere(x, y, 0.01);
    const v = [newq[0] - this.previousGrab[0], newq[1] - this.previousGrab[1]];
    
    const tangentVectorScene = A.tracer.sphericalVectorToScene(this.previousGrab, v, 1);
    
    A.spin = A.spin.leftMul(Spin.tangentVectorToAlgebra(
      tangentVectorScene[0],
      tangentVectorScene[1]
    ).exponential());
    
    this.previousGrab = newq;

    if (this.state == "charging" && tangentVectorScene[1].norm() > 0.01) {
      this.state = "dragging";
    }
  }
  
  interface.canvas.addEventListener("mousedown", (e) => {
    interface.onClick(e.offsetX, e.offsetY);
  });
  
  interface.canvas.addEventListener("touchstart", (e) => {
    event.preventDefault();
    const touch = e.touches.item(0);
    interface.onClick(touch.clientX, touch.clientY);
  })
  
  interface.canvas.addEventListener("mouseup", (e) => {
    interface.onRelease();
  });
  
  interface.canvas.addEventListener("touchend", (e) => {
    if (e.touches.length === 0) {
      interface.onRelease();
    }
  });
  
  interface.canvas.addEventListener("mousemove", (e) => {
    interface.onMove(e.offsetX, e.offsetY);
  });
  
  interface.canvas.addEventListener("touchmove", (e) => {
    const touch = e.touches.item(0);
    interface.onMove(touch.clientX, touch.clientY);
  });
  
  window.onresize = () => { interface.resize(window.innerWidth, window.innerHeight); };
  
  refreshLoop(interface);
});

