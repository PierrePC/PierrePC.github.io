class Spin {
  
  // Convention: Spin(a,b,c,d) = a + b e1 × e2 + c e2 × e3 + d e3 × e1
  // Convention: v × v = - |v|²
  // Consequence:   Spin(0,1,0,0)² = Spin(0,0,1,0)² = Spin(0,0,0,1)²
  //              = Spin(0,1,0,0) × Spin(0,0,1,0) × Spin(0,0,0,1)
  //              = Spin(-1,0,0,0)
  
  constructor (c0, c1, c2, c3, safe = false) {
    this.coord = new Tensor([c0, c1, c2, c3], safe);
  }
  
  static fromTensor (t, safe = false) {
    if (safe) {
      if (t.rs.toString() !== "[4]") {
        throw Error("[Spin.fromTensor] Input tensor has wrong shape.")
      }
    }

    return new Spin(t.array[0], t.array[1], t.array[2], t.array[3], safe)
  }
  
  array () {
    return this.coord.array
  }
  
  coord0 () {
    return this.coord.array[0]
  }
  coord1 () {
    return this.coord.array[1]
  }
  coord2 () {
    return this.coord.array[2]
  }
  coord3 () {
    return this.coord.array[3]
  }
  
  static e0 = new Spin(1, 0, 0, 0);
  static e1 = new Spin(0, 1, 0, 0);
  static e2 = new Spin(0, 0, 1, 0);
  static e3 = new Spin(0, 0, 0, 1);
  static es = [Spin.e0, Spin.e1, Spin.e2, Spin.e3];
  
  static add (lSpinor, rSpinor) {
    return Spin.fromTensor(Tensor.add(lSpinor.coord, rSpinor.coord))
  }
  
  add (spinor) {
    return Spin.add(this, spinor)
  }
  
  static sMul (spinor, scalar, safe = false) {
    if (safe) {
      if (typeof scalar !== "number") {
        throw Error("[Spin.sMul] Input scalar is not a number.");
      }
    }

    return Spin.fromTensor(Tensor.sMul(spinor.coord, scalar))
  }
  
  sMul (scalar, safe = false) {
    return Spin.sMul(this, scalar, safe)
  }
  
  addMul (scalar, spinor, safe = false) {
    return spinor.sMul(scalar, safe).add(this)
  }

  // leftMulMatrix * lSpinor * rSpinor = lSpinor × rSpinor
  
  static buildLeftMulMatrix () {
    
    let out = Tensor.zeros([4,4,4]);
    
    const addTable = function (index, indices, scalars) {
      for (let i = 0; i < 4; i++) {
        out = Spin.es[indices[i]].coord
                .sMul(scalars[i])
                .rightMul(Spin.es[i].coord)
                .rightMul(Spin.es[index].coord)
                .add(out);
      }
    
    };
    
    addTable(0, [0, 1, 2, 3], [1, 1, 1, 1]);
    addTable(1, [1, 0, 3, 2], [1, -1, 1, -1]);
    addTable(2, [2, 3, 0, 1], [1, -1, -1, 1]);
    addTable(3, [3, 2, 1, 0], [1, 1, -1, -1]);
    
    return out
  }
  
  static leftMulMatrix = Spin.buildLeftMulMatrix();
  
  static mul (lSpinor, rSpinor) {
    return Spin.fromTensor(
      Spin.leftMulMatrix
        .rightMatrixMul(lSpinor.coord)
        .rightMatrixMul(rSpinor.coord)
    )
  }
  
  rightMul (spinor) {
    return Spin.mul(this, spinor)
  }
  
  leftMul (spinor) {
    return Spin.mul(spinor, this)
  }
  
  // groupMorphismMatrix * s * s * v = Phi(s)(v)
  
  // Def: Phi(s):v ↦ svs*
  
  static buildGroupMorphismMatrix () {
    
    const orthoTensor = function (perm, signs) {
      const t = Tensor.zeros([3,3]);
      
      for (let i = 0; i < 3; i++) {
        t.array[perm[i]][i] = signs[i];
      }
      
      return t
    }
    
    let out = Tensor.zeros([3,3,4,4]);
    
    const addTable = function (index, rotations) {
      for (let i = 0; i < 4; i++) {
        out = rotations[i]
                .rightMul(Spin.es[i].coord)
                .rightMul(Spin.es[index].coord)
                .add(out);
      }
    };
    
    // 1(a e1 + b e2 + c e3)1 = a e1 + b e2 + c e3
    // 1(a e1 + b e2 + c e3)(- e1 × e2) = a e2 - b e1 + garbage
    // 1(a e1 + b e2 + c e3)(- e2 × e3) = b e3 - c e2 + garbage
    // 1(a e1 + b e2 + c e3)(- e3 × e1) = - a e3 + c e1 + garbage
    
    // (e1 × e2)(a e1 + b e2 + c e3)1 = a e2 - b e1 + garbage
    // (e1 × e2)(a e1 + b e2 + c e3)(- e1 × e2) = - a e1 - b e2 + c e3
    // (e1 × e2)(a e1 + b e2 + c e3)(- e2 × e3) = a e3 + c e1 + garbage
    // (e1 × e2)(a e1 + b e2 + c e3)(- e3 × e1) = b e3 + c e2 + garbage
    
    // (e2 × e3)(a e1 + b e2 + c e3)1 = b e3 - c e2 + garbage
    // (e2 × e3)(a e1 + b e2 + c e3)(- e1 × e2) = a e3 + c e1 + garbage
    // (e2 × e3)(a e1 + b e2 + c e3)(- e2 × e3) = a e1 - b e2 - c e3
    // (e2 × e3)(a e1 + b e2 + c e3)(- e3 × e1) = a e2 + b e1 + garbage
    
    // (e3 × e1)(a e1 + b e2 + c e3)1 = - a e3 + c e1 + garbage
    // (e3 × e1)(a e1 + b e2 + c e3)(- e1 × e2) = b e3 + c e2 + garbage
    // (e3 × e1)(a e1 + b e2 + c e3)(- e2 × e3) = a e2 + b e1 + garbage
    // (e3 × e1)(a e1 + b e2 + c e3)(- e3 × e1) = - a e1 + b e2 - c e3
    
    addTable(0, [
      orthoTensor([0,1,2], [1,1,1]),
      orthoTensor([1,0,2], [1,-1,0]),
      orthoTensor([0,2,1], [0,1,-1]),
      orthoTensor([2,1,0], [-1,0,1])
    ]);
    addTable(1, [
      orthoTensor([1,0,2], [1,-1,0]),
      orthoTensor([0,1,2], [-1,-1,1]),
      orthoTensor([2,1,0], [1,0,1]),
      orthoTensor([0,2,1], [0,1,1])
    ]);
    addTable(2, [
      orthoTensor([0,2,1], [0,1,-1]),
      orthoTensor([2,1,0], [1,0,1]),
      orthoTensor([0,1,2], [1,-1,-1]),
      orthoTensor([1,0,2], [1,1,0])
    ])
    addTable(3, [
      orthoTensor([2,1,0], [-1,0,1]),
      orthoTensor([0,2,1], [0,1,1]),
      orthoTensor([1,0,2], [1,1,0]),
      orthoTensor([0,1,2], [-1,1,-1])
    ])
    
    return out
  }
  
  static groupMorphismMatrix = Spin.buildGroupMorphismMatrix()
  
  static groupMorphism (spinor) {
    return Spin.groupMorphismMatrix
             .rightMatrixMul(spinor.coord)
             .rightMatrixMul(spinor.coord)
  }
  
  toSO () {
    return Spin.groupMorphism(this)
  }
  
  // algebraMorphismMatrix * s * v = phi(s)(v)
  
  // Def: phi(s):v ↦ sv + vs*
  
  static buildAlgebraMorphismMatrix () {
    
    const orthoTensor = function (perm, signs) {
      const t = Tensor.zeros([3,3]);
      
      for (let i = 0; i < 3; i++) {
        t.array[perm[i]][i] = signs[i];
      }
      
      return t
    }
    
    let out = Tensor.zeros([3,3,4]);
    
    const addRotation = function (index, rotation) {
      out = out.add(rotation.rightMul(Spin.es[index].coord));
    }
    
    // 1(a e1 + b e2 + c e3) + (a e1 + b e2 + c e3)1
    //   = 2a e1 + 2b e2 + 2c e3
    // (e1 × e2)(a e1 + b e2 + c e3) + (a e1 + b e2 + c e3)(- e1 × e2)
    //   = 2a e2 - 2b e1
    // (e2 × e3)(a e1 + b e2 + c e3) + (a e1 + b e2 + c e3)(- e2 × e3)
    //   = 2b e3 - 2c e2
    // (e3 × e1)(a e1 + b e2 + c e3) + (a e1 + b e2 + c e3)(- e3 × e1)
    //   = - 2a e3 + 2c e1
    
    addRotation(0, orthoTensor([0,1,2], [2,2,2]));
    addRotation(1, orthoTensor([1,0,2], [2,-2,0]));
    addRotation(2, orthoTensor([0,2,1], [0,2,-2]));
    addRotation(3, orthoTensor([2,1,0], [-2,0,2]));
    
    return out
  }
  
  static algebraMorphismMatrix = Spin.buildAlgebraMorphismMatrix();
  
  static algebraMorphism (spinor) {
    return Spin.algebraMorphismMatrix.rightMatrixMul(spinor.coord)
  }
  
  toA () {
    return Spin.algebraMorphism(this)
  }
  
  static conjugate (spinor) {
    const array = spinor.array();
    return new Spin(array[0], -array[1], -array[2], -array[3]);
  }
  
  conjugate () {
    return Spin.conjugate(this)
  }
  
  static squareNorm (spinor) {
    return spinor.conjugate().rightMul(spinor).coord0()
  }
  
  squareNorm () {
    return Spin.squareNorm(this)
  }
  
  static precision = 0.0001;
  
  // Th: exp(r s) = cos(r) + sin(r)s if |s|=1
  
  static exponential (spinor) {
    const r = Math.sqrt(spinor.squareNorm());
    if (r > Spin.precision) {
      return Spin.e0.sMul(Math.cos(r)).addMul(Math.sin(r)/r, spinor)
    }
    else {
      return Spin.e0.sMul(Math.cos(r)).add(spinor)
    }
  }
  
  exponential () {
    return Spin.exponential(this)
  }
  
  static inverse (spinor) {
    const r = spinor.squareNorm();
    
    if (r < precision * precision) {
      throw Error("[Spin.inverse] Non-invertible element.");
    }
    
    return spinor.conjugate().sMul(1/r)
  }
  
  inverse () {
    return Spin.inverse(this)
  }
  
  static toString (spin) {
    return `Spin(${spin.coord.array.toString()})`
  }
  
  toString () {
    return Spin.toString(this);
  }

  // matrixTangentVectorToAlgebra * q * v = s
  // where (d/dt) Phi(exp(ts))(q) = phi(s)(q) =  v
  
  static buildMatrixTangentVectorToAlgebra () {
    
    let out = Tensor.zeros([4,3,3]);
    
    const es = [
      new Tensor([1, 0, 0]),
      new Tensor([0, 1, 0]),
      new Tensor([0, 0, 1])
    ];
    
    const addSpinors = function (index, indices, scalars) {
      for (let i = 0; i < 3; i++) {
        out = Spin.es[1 + indices[i]].coord.sMul(scalars[i])
                .rightMul(es[i]) // vector
                .rightMul(es[index]) // point
                .add(out);
      }
    };
    
    // phi(e1 × e2)(e1) = 2 e2
    // phi(e1 × e2)(e2) = - 2 e1
    // phi(e1 × e2)(e3) = 0
    
    addSpinors(0, [1, 0, 2], [0, 0.5, -0.5]);
    addSpinors(1, [0, 2, 1], [-0.5, 0, 0.5]);
    addSpinors(2, [2, 1, 0], [0.5, -0.5, 0]);
    
    return out
  }
  
  static matrixTangentVectorToAlgebra = Spin.buildMatrixTangentVectorToAlgebra();
  
  static tangentVectorToAlgebra (q,v) {
    return Spin.fromTensor(
      Spin.matrixTangentVectorToAlgebra
        .rightMatrixMul(q)
        .rightMatrixMul(v)
    )
  }
  
  static sanitize (g, safe = false) {
    const r = g.squareNorm();
    
    if (safe) {
      if (r < Spin.precision * Spin.precision) {
        throw Error("[Spin.sanitize] The element is too close to zero.")
      }
    }
    
    return g.sMul(Math.sqrt(1/r))
  }
  
  sanitize () {
    return Spin.sanitize(this)
  }
}