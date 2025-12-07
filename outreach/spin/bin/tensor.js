function NestedLoop(rs) {
  this.rs = rs;
  
  this.beforeLabel = "before";
  this.afterLabel  = "after";
  this.doneLabel   = null;
  
  this.stepInLabel       = "in";
  this.stepOutLabel      = "out";
  this.jumpStepLabel     = "jump";
  this.maxDepthStepLabel = "max";
  this.lastStepLabel     = "last";
  this.noStepLabel       = null;
  
  this.start = function () {
    this.is = [];
    this.depth = 0;
    this.state = this.beforeLabel;
    this.done = false;
    };
  
  this.step = function () {  
    if (this.state === null) {
      this.transition = this.noStepLabel;
      return;
    }
    
    if (this.state === this.beforeLabel) {
      if (this.depth === this.rs.length) {
        this.state = this.afterLabel;
        this.transition = this.maxDepthStepLabel;
        return;
      }
      
      this.is.push(0);
      this.depth += 1;
      this.transition = this.stepInLabel;
    }
    
    if (this.state === this.afterLabel) {
      if (this.depth === 0) {
        this.state = this.doneLabel;
        this.done = true;
        this.transition = this.lastStepLabel;
        return;
      }
      
      if (this.is[this.depth - 1] === this.rs[this.depth - 1] - 1) {
        this.is.pop();
        this.depth -= 1;
        this.transition = this.stepOutLabel;
        return;
      }
      
      this.state = this.beforeLabel;
      this.is[this.depth - 1] += 1;
      this.transition = this.jumpStepLabel;
    }
  }
};

ArrayTools = {
  checkSound: function (array) {
    if (typeof array === "number") {
      return [];
    }
    
    if (!Array.isArray(array)) {
      return false;
    }
    
    if (array.length === 0) {
      return false;
    }
    
    let rs = ArrayTools.checkSound(array[0]);
    for (let i = 0; i < array.length; i++) {
      let rsNext = ArrayTools.checkSound(array[i]);
      if (rsNext === false || rsNext.toString() != rs.toString()) {
        return false;
      }
      rs = Array.from(rsNext);
    }
    
    rs.unshift(array.length);
    return rs;
  },
  
  checkSameSize: function (array1, array2) {
    const rs1 = checkSound(array1);
    const rs2 = checkSound(array2);
    
    return ( rs1 && rs1.toString() === rs2.toString() ) ? rs1 : false;
  },

  toString: function (array) {
    if (array.length === undefined) {
      return array.toString();
    }
    
    let out = "";
    for (let i = 0; i < array.length; i++) {
      out = out + ArrayTools.toString(array[i]) + ",";
    }
    return "[" + out.slice(0,-1) + "]";
  }
};

class Tensor {
  constructor(array, safe = false) {
    this.array = array;
    
    if (safe) {
      if (!ArrayTools.checkSound(array)) {
        throw new Error("[Tensor.constructor] Input array not sound.");
      }
    }
    
    this.rs = [];
    let subarray = this.array;
    while (subarray.length != undefined) {
      this.rs.push(subarray.length);
      subarray = subarray[0];
    }
  }

  static toString (tensor) {
    return `Tensor(${ArrayTools.toString(tensor.array)})`;
  }
  
  toString () {
    return Tensor.toString(this);
  }
  
  static startPeeling (iterator, array) {
    iterator.start();
    iterator.subarrays = [array];
    iterator.donePeeling = false;
  }
  
  static stepPeeling (iterator) {
    iterator.step();
    
    const depth = iterator.depth;
    
    switch (iterator.transition) {
      case iterator.stepInLabel:
        iterator.subarrays.push(iterator.subarrays[depth - 1][0]);
        break;
      case iterator.stepOutLabel:
        iterator.subarrays.pop();
        break;
      case iterator.jumpStepLabel:
        iterator.subarrays[depth] = iterator.subarrays[depth - 1][iterator.is[depth - 1]];
        break;
      case iterator.maxDepthStepLabel:
      case iterator.noStepLabel:
        break;
      case iterator.lastStepLabel:
        iterator.donePeeling = true;
        break;
    }
  }
  
  static currentPeel (iterator) {
    return iterator.subarrays.at(-1);
  }
  
  newIterator () {
    const iterator = new NestedLoop(this.rs);
    iterator.parentTensor =  this;
    
    iterator.startPeeling = function () {
      Tensor.startPeeling(this, this.parentTensor.array);
    }
    
    iterator.stepPeeling = function () {
      Tensor.stepPeeling(this);
    }

    iterator.currentPeel = function () {
      return Tensor.currentPeel(this);
    }
    
    return iterator;
  }
  
  static generator = function () {
    this.subarrays = [];
    
    this.push = function (elmt) {
      this.subarrays.push(elmt)
    }
    
    this.stepIn = function (depth = 1) {
      for (let i = 0; i < depth; i++) {
        this.push([]);
      }
    }
    
    this.merge = function () {
      const depth = this.subarrays.length;
      const elmt = this.subarrays.pop();
      this.subarrays[depth - 2].push(elmt);
    }
    
    this.array = function () {
      return this.subarrays.at(-1);
    }
    
    this.tensor = function () {
      return new Tensor(this.array());
    }
  }
  
  static zeros (rs, scalar = 0) {
    const iterator = new NestedLoop(rs);
    const generator = new Tensor.generator();
    
    for (iterator.start(); !iterator.done; iterator.step()) {
      switch (iterator.state) {
        case iterator.beforeLabel:
          if (iterator.depth === rs.length) {
            generator.push(scalar);
            break;
          }
          
          generator.stepIn();
          break;
        case iterator.afterLabel:
          if (iterator.depth > 0) {
            generator.merge();
          }
          break;
      }
    }
    
    return generator.tensor();
  }
  
  static identity (r) {
    const generator = new Tensor.generator();
    
    generator.stepIn();
    for (let i = 0; i < r; i++) {
      generator.stepIn();
      for (let j = 0; j < r; j++) {
        generator.push(i === j ? 1 : 0);
        generator.merge();
      }
    generator.merge();
    }
    
    return generator.tensor();
  }
  
  static add (lTensor, rTensor, safe = false) {
    if (safe) {
      if (lTensor.rs.toString() !== rTensor.rs.toString()) {
        throw new Error("[Tensor.add] Input tensors have different size.");
      }
    }
    
    const gen = new Tensor.generator();
    const iter1 = lTensor.newIterator();
    const iter2 = rTensor.newIterator();
    
    iter2.startPeeling();
    for (iter1.startPeeling(); !iter1.donePeeling; iter1.stepPeeling()) {
      switch (iter1.state) {
        case iter1.beforeLabel:
          if (iter1.depth === lTensor.rs.length) {
            gen.push( iter1.currentPeel() + iter2.currentPeel() );
          }
          else {
            gen.stepIn();
          }
          break;
        case iter1.afterLabel:
          if (iter1.depth > 0) {
            gen.merge();
          }
          break;
      }
      iter2.stepPeeling();
    }
    
    return gen.tensor();
  }
  
  add (tensor, safe = false) {
    return Tensor.add(this,tensor,safe);
  }
  
  static sMul (tensor, scalar, safe = false) {
    if (safe) {
      if (typeof scalar !== "number") {
        throw Error("[Tensor.sMul] Input scalar is not a number.");
      }
    }
    
    const iter = tensor.newIterator();
    const gen = new Tensor.generator();
    
    for (iter.startPeeling(); !iter.donePeeling; iter.stepPeeling()) {
      switch (iter.state) {
        case iter.beforeLabel:
          if (iter.depth === tensor.rs.length) {
            gen.push(scalar * iter.currentPeel());
          }
          else {
            gen.stepIn();
          }
          break;
        case iter.afterLabel:
          if (iter.depth > 0) {
            gen.merge();
          }
          break;
      }
    }
    
    return gen.tensor();
  }
  
  sMul (scalar, safe = false) {
    return Tensor.sMul(this, scalar, safe);
  }
  
  addMul (scalar, tensor, safe = false) {
    return tensor.sMul(scalar, safe).add(this, safe)
  }
  
  static mul (lTensor, rTensor, safe = false) {
    const iter = lTensor.newIterator();
    const gen = new Tensor.generator();
    
    for (iter.startPeeling(); !iter.donePeeling; iter.stepPeeling()) {
      switch (iter.state) {
        case iter.beforeLabel:
          if (iter.depth === lTensor.rs.length) {
            gen.push(rTensor.sMul(iter.currentPeel(), safe).array);
          }
          else {
            gen.stepIn();
          }
          break;
        case iter.afterLabel:
          if (iter.depth > 0) {
            gen.merge();
          }
          break;
      }
    }
    
    return gen.tensor();
  }
  
  leftMul (tensor, safe) {
    return Tensor.mul(tensor, this, safe);
  }
  
  rightMul (tensor, safe) {
    return Tensor.mul(this, tensor, safe);
  }
  
  static matrixMul (lTensor, rTensor, safe) {
    if (safe) {
      if (lTensor.rs.length === 0) {
        throw Error("[Tensor.matrixMul] Left factor is too small.");
      }
      if (rTensor.rs.length === 0) {
        throw Error("[Tensor.matrixMul] Right factor is too small.");
      }
      if (lTensor.rs.at(-1) !== rTensor.rs[0]) {
        throw Error("[Tensor.matrixMul] Factors have incompatible size");
      }
    }

    const iter = lTensor.newIterator();
    const gen = [];
    const rArray = rTensor.array;
    
    let i = 0;
    const r = rTensor.rs[0];
    const fullDepth = lTensor.rs.length
    for (i = 0; i < r; i++) {
      gen.push(new Tensor.generator());
    }
    
    for (iter.startPeeling(); !iter.donePeeling; iter.stepPeeling()) {
      switch (iter.state) {
        case iter.beforeLabel:
          if (iter.depth === fullDepth) {
            i = iter.is[fullDepth - 1];
            gen[i].push((new Tensor(rArray[i], safe)).sMul(iter.currentPeel()).array);
          }
          else if (iter.depth !== fullDepth - 1) {
            for (i = 0; i < r; i++) {
              gen[i].stepIn();
            }
          }
          break;
        case iter.afterLabel:
          if (iter.depth > 0 && iter.depth < fullDepth) {
            for (i = 0; i < r; i++) {
              gen[i].merge();
            }
          }
          break;
      }
    }
    
    let out = gen[0].tensor();
    
    for (i = 1; i < r; i++) {
      out = out.add(gen[i].tensor());
    }
    
    return out
  }
  
  rightMatrixMul (tensor, safe = false) {
    return Tensor.matrixMul(this, tensor, safe)
  }
  
  leftMatrixMul (tensor, safe = false) {
    return Tensor.matrixMul(tensor, this, safe)
  }
  
  // TO DO
  
  // determinantMatrix * u * v * w = u ∧ v ∧ w

  static determinantMatrix (dim) {
    if (dim !== 3) {
      throw Error("[Tensor.determinant] Dimensions other than 3 not yet implemented!");
    }
    
    const es = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

    const singleCoeff = function (is, scalar) {
      return (new Tensor(es[is[2]]))
              .rightMul((new Tensor(es[is[1]])))
              .rightMul((new Tensor(es[is[0]])))
              .sMul(scalar)
    }
    
    return Tensor.zeros([3,3,3])
             .add(singleCoeff([0,1,2],1))
             .add(singleCoeff([1,2,0],1))
             .add(singleCoeff([2,0,1],1))
             .add(singleCoeff([2,1,0],-1))
             .add(singleCoeff([1,0,2],-1))
             .add(singleCoeff([0,2,1],-1))
  }
  
  // Ensure that factor1 < factor2!
  // Finish
  
  static contraction (tensor, factor1, factor2, safe = false) {
    if (safe) {
      // TODO
    }
    
    const r = tensor.rs[factor1];
    const iter = tensor.iterator;
    const newRs = tensor.rs.toSpliced(factor1, 1).toSpliced(factor2 - 1, 1);
    const generator = new Tensor.generator();
    let out = Tensor.zeros(newRs);
    
    
    for (let i = 0; i < r; i++) {
      for (tensor.startPeeling(); !tensor.donePeeling; tensor.stepPeeling()) {
        switch (iter.state) {
          case iter.beforeLabel:
            if (iter.depth === tensor.rs.length) {
              if (iter.is[factor1] === i && iter.is[factor2] === i) {
                generator.push(tensor.currentPeel());
              }
              break;
            }
            if (iter.depth !== factor1 + 1 && iter.depth !== factor2 + 1) {
              generator.stepIn();
            }
            break;
          case iter.afterLabel:
            if (iter.depth > 0) {
              if (iter.depth !== factor1 + 1 && iter.depth < factor2 + 1) {
                generator.merge();
              }
              if (iter.depth > factor2 + 1 && iter.is[factor1] === i && iter.is[factor2] === i) {
                generator.merge();
              }
            }
            break;
        }
      }
      
      out = out.add(generator.tensor());
    }
    
    return out;
  }
  
  contraction (factor1, factor2, safe = false) {
    return Tensor.contraction(this, factor1, factor2, safe);
  }
  
  static vectorNorm (v, safe = false) {
    if (safe) {
      if (v.rs.length !== 1) {
        throw new Error("[Tensor.vectorNorm] Input tensor is not a vector");
      }
    }
    
    return Math.hypot(...v.array)
  }
  
  norm (safe = false) {
    return Tensor.vectorNorm(this, safe)
  }
  
  static normalizeVector (v, safe) {
    if (safe) {
      if (v.rs.length !== 1) {
        throw new Error("[Tensor.normalizeVector] Input tensor is not a vector");
      }
    }
    const norm = v.norm();
    
    if (safe) {
      if (norm < 0.00001) {
        throw new Error("[Tensor.normalizeVector] Input vector norm is too small");
      }
    }
    
    return v.sMul(1/norm)
  }
  
  normalize (safe = false) {
    return Tensor.normalizeVector(this, safe)
  }
};

