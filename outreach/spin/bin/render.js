class Artist {
  constructor (canvas, width, height) {
    this.canvas = canvas,
    this.tracer = new Tracer(canvas);
    
    this.spin = new Spin(0.5, 0.5, 0.5, 0.5);
    this.spinNoise = new Spin(1, 0, 0, 0);
    
    // The radius is set in terms of artist.scale
    this.backgroundRadius = 0;
    this.backgroundOpacity = 1;
    
    Artist.resize(this, width, height);
  }
  
  static rotation (artist) {
    return artist.spin.toSO()
  }
  
  rotation () {
    return Artist.rotation(this)
  }
  
  static resize (artist, width, height) {
    artist.canvas.width = width;
    artist.canvas.height = height;
    
    artist.scale = (width < height) ? 0.45 * width : 0.45 * height;
    
    artist.tracer.setFrame(
      [width/2, height/2],
      [0, 0],
      [artist.scale, 0],
      [0, -artist.scale],
      new Tensor([1, 0, 0])
    );

    artist.tracer.setCoFrame(
      new Tensor([0, 1/artist.scale, 0]),
      new Tensor([0, 0, -1/artist.scale])
    );
  }
  
  resize (width, height) {
    Artist.resize (this, width, height);
  }
  
  static drawTexture (artist, Delta, x0, y0, s, h, iMax, jMax, veeCondition, veeFunction) {
    const TC = artist.tracer.context;
    
    for (let i = - iMax; i < iMax; i++) {
      for (let j = - jMax; j < jMax; j++) {
        const xRel = (i - j * s + 0.5 * h) * Delta;
        const yRel = (i * s + j * (1 - s) - 0.5 * h) * Delta;
        
        if (!veeCondition(xRel, yRel)) {
          continue;
        }
        
        const x = x0 + xRel;
        const y = y0 + yRel;
        
        TC.beginPath();
        TC.moveTo(
          x - 0.5 * (1 + h) * Delta,
          y - 0.5 * (1 - h) * Delta
        );
        TC.lineTo(x, y);
        TC.lineTo(
          x + 0.5 * (1 - h) * Delta,
          y + 0.5 * (1 + h) * Delta
        );
        
        veeFunction(artist.tracer, xRel, yRel);
      }
    }
  }

  drawTexture (Delta, x0, y0, s, h, iMax, jMax, veeCondition, veeFunction) {
    Artist.drawTexture(this, Delta, x0, y0, s, h, iMax, jMax, veeCondition, veeFunction);
  }
  
  static redraw (artist, theta) {
    const T = artist.tracer;
    const effectiveSpin = Spin.mul(artist.spin, artist.spinNoise);
    
    // Background
    T.fillCanvas("black");
    
    // Flash
    T.setFillColor(`rgba(255,255,255,${artist.backgroundOpacity.toFixed(3)})`);
    T.circle(
      [artist.canvas.width / 2, artist.canvas.height / 2],
      artist.backgroundRadius * artist.scale
    );
    T.fill();
    
    // Texture
    const s = 0.25 + 0.25 * effectiveSpin.coord2();
    const h = 0.5 + 0.5 * effectiveSpin.coord3();
    
    T.setStrokeColor("white");
    artist.drawTexture(0.08 * artist.scale, artist.canvas.width/2, artist.canvas.height/2, s, h, 30, 40,
      () => { return true },
      (tracer, x, y) => {
        const r = Math.hypot(x, y);
        const intensity = Math.max(0, Math.min(3*(1 - r / artist.scale), 1));
        tracer.setStrokeColor(`rgba(255,255,255,${intensity})`);
        tracer.stroke();
      }
    );
    
    // Stone
    // Take rotation into account
    T.setStrokeColor("white");
    T.traceConvexPolyhedron(
      stone.rotatedTriangles(effectiveSpin.toSO()),
      stone.triangleFrames,
      (tracer, triangle, option) => {
        tracer.setFillColor(Tracer.bcm(effectiveSpin.coord0(), effectiveSpin.coord1()))
        tracer.fill();
        tracer.stroke();
      }
    );
  }
  
  redraw (theta) {
    Artist.redraw(this, theta);
  }
}