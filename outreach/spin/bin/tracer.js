class Tracer {
  // Convention: 2d points and vectors are passed as arrays
  // Convention: 3d points and vectors are passed as tensors
  
  constructor (canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
  }
  
  width () {
    return this.canvas.width;
  }
  
  height () {
    return this.canvas.height;
  }
  
  setStrokeColor (color) {
    this.context.strokeStyle = color;
  }
  
  setFillColor (color) {
    this.context.fillStyle = color;
  }
  
  fillCanvas (color) {
    this.context.fillStyle = color;
    this.context.fillRect(0, 0, this.width(), this.height());
  }
  
  // See "Bivariate colour maps for visualizing climate data"
  // by Teuling, Stöckli and Seneviratne
  
  // (x,y) takes values in [-1,1]²

  // bcm: bivariate color map

  static bcmParameter = 0.32
  
  static bcmMatrix = new Tensor([
    [0.5 - Tracer.bcmParameter / 2, - Tracer.bcmParameter / 2],
    [-0.25, -0.25],
    [-Tracer.bcmParameter / 2, 0.5 - Tracer.bcmParameter / 2]
  ])

  static bcmOrigin = new Tensor([0.5, 0.5, 0.5])
  
  static bcm (x, y) {
    const v = Tracer.bcmMatrix
                .rightMatrixMul(new Tensor([x, y]))
                .add(Tracer.bcmOrigin)
                .array;
    
    const red = Math.round(255*v[0]);
    const green = Math.round(255*v[1]);
    const blue = Math.round(255*v[2]);
    
    return `rgb(${red.toString()}, ${green.toString()}, ${blue.toString()})`
  }
  
  // The normal points towards the observer
  // One should ensure Tracer.vectorToCanvas(this.normal) = [0, 0]
  
  setFrame (origin, v1, v2, v3, normal) {
    this.origin = new Tensor(origin);
    this.v1 = new Tensor(v1);
    this.v2 = new Tensor(v2);
    this.v3 = new Tensor(v3);
    
    const normalNorm = normal.rightMatrixMul(normal).array;
    this.normal = normal.sMul(1/Math.sqrt(normalNorm));
    
    this.visibleDet = Tensor.determinantMatrix(3).rightMatrixMul(this.normal);
    
    const buildMatrixVectorToCanvas = function (u1, u2, u3) {
      let out = Tensor.zeros([2,3]);
      
      out = out.add(u1.rightMul(new Tensor([1, 0, 0])));
      out = out.add(u2.rightMul(new Tensor([0, 1, 0])));
      out = out.add(u3.rightMul(new Tensor([0, 0, 1])));
      
      return out
    }
    
    this.matrixVectorToCanvas = buildMatrixVectorToCanvas(this.v1, this.v2, this.v3);
  }
  
  vectorToCanvas (v) {
    return this.matrixVectorToCanvas.rightMatrixMul(v).array
  }
  
  pointToCanvas (q) {
    return this.matrixVectorToCanvas.rightMatrixMul(q)
             .add(this.origin)
             .array
  }
  
  lineToPoint (q) {
    const qCanvas = this.pointToCanvas(q);
    this.context.lineTo(qCanvas[0], qCanvas[1]);
  }
  
  moveToPoint (q) {
    const qCanvas = this.pointToCanvas(q);
    this.context.moveTo(qCanvas[0], qCanvas[1]);
  }
  
  tracePointPolygon (qs, close = false) {
    this.context.beginPath();
    this.moveToPoint(qs[0]);
    for (let i = 1; i < qs.length; i++) {
      this.lineToPoint(qs[i]);
    }
    if (close) {
      this.context.closePath();
    }
  }
  
  stroke () {
    this.context.stroke();
  }
  
  fill () {
    this.context.fill();
  }
  
  traceConvexPolyhedron (triangles, options, draw) {
    let det = 0;
    let t;
    
    for (let i = 0; i < triangles.length; i++) {
      t = triangles[i];
      
      det = this.visibleDet
              .rightMatrixMul(t[1].addMul(-1, t[0]))
              .rightMatrixMul(t[2].addMul(-1, t[0]));
      
      if (det.array < 0) {
        continue;
      }
      
      this.tracePointPolygon(t, true);
      draw(this, t, options[i]);
    }
  }
  
  traceTexturedTriangle (triangle, xColor, yColor, xTexture, yTexture, frame) {
    const tCanvas = [
      this.pointToCanvas(triangle[0]),
      this.pointToCanvas(triangle[1]),
      this.pointToCanvas(triangle[2])
    ];
    
    const minX = Math.min(tCanvas[0][0], tCanvas[1][0], tCanvas[2][0]);
    const maxX = Math.max(tCanvas[0][0], tCanvas[1][0], tCanvas[2][0]);
    const minY = Math.min(tCanvas[0][1], tCanvas[1][1], tCanvas[2][1]);
    const maxY = Math.max(tCanvas[0][1], tCanvas[1][1], tCanvas[2][1]);
    
    this.context.save();
    
    this.beginPath();
    this.moveTo(tCanvas[0][0], tCanvas[0][1]);
    this.lineTo(tCanvas[1][0], tCanvas[1][1]);
    this.lineTo(tCanvas[2][0], tCanvas[2][1]);
    this.closePath();

    this.context.clip();
    
    this.setFillColor(Tracer.bcm(xColor, yColor));
    this.canvas.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = -20; i < 20; i++) {
      this.context.beginPath();
      this.moveToPoint()
    }
    
    this.context.restore();
    
    this.setStrokeColor("white");
    this.tracePointPolygon(triangle,true);
    this.stroke();
  }
  
  // xi1 & xi2 are orthogonal to the normal,
  // such that vectorToCanvas(xi1) = [1,0] and vectorToCanvas(xi2) = [0,1]
  
  setCoFrame (xi1, xi2) {
    this.xi1 = xi1;
    this.xi2 = xi2;
    
    const buildMatrixVectorToScene = function (u1, u2) {
      let out = Tensor.zeros([3,2]);
      
      out = out.add(u1.rightMul(new Tensor([1, 0])));
      out = out.add(u2.rightMul(new Tensor([0, 1])));
      
      return out
    }
    
    this.matrixVectorToScene = buildMatrixVectorToScene(this.xi1, this.xi2);
  }
  
  vectorToScene (vCanvas) {
    return this.matrixVectorToScene.rightMatrixMul(new Tensor(vCanvas))
  }
  
  pointToScene (qCanvas) {
    const vCanvas = (new Tensor(qCanvas)).addMul(-1, this.origin);
    
    return this.matrixVectorToScene.rightMatrixMul(vCanvas)
  }
  
  sphericalPointToScene (qCanvas, sceneSquareRadius) {
    const q = this.pointToScene(qCanvas);
    const normQ = q.rightMatrixMul(q).array;
    
    if (normQ > sceneSquareRadius) {
      throw Error("[Tracer.sphericalPointToScene] Input point outside the sphere.");
    }
    
    const t = Math.sqrt(sceneSquareRadius - normQ);
    
    return q.addMul(t, this.normal)
  }
  
  sphericalVectorToScene (qCanvas, vCanvas, sceneSquareRadius) {
    const q = this.sphericalPointToScene(qCanvas, sceneSquareRadius);
    const v = this.vectorToScene(vCanvas);
    
    const scalarQ = q.rightMatrixMul(this.normal).array;
    const scalarV = v.rightMatrixMul(this.normal).array;
    
    return [q, v.addMul(- scalarV / scalarQ, this.normal)]
    
    // <v + t n, q> = 0
  }
  
  circle (qCanvas, r) {
    this.context.beginPath();
    this.context.arc(qCanvas[0], qCanvas[1], r, 0, 6.3);
  }
  
  point (q, visibleR) {
    this.circle(this.pointToCanvas(q), visibleR);
  }
  
  coordInCanvas (mouseEvent) {
    const rect = this.canvas.getBoundingClientRect();

    return [mouseEvent.clientX - rect.left, mouseEvent.clientY - rect.right]
  }
}