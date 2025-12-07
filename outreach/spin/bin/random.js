const normal = {
  real: function (StD = 1) {
    const theta = 2 * Math.PI * Math.random();
    const R = StD * Math.sqrt(-2 * Math.log( Math.random()));
    
    return [R * Math.cos(theta), R * Math.sin(theta)]
  },
  
  tangentSpin: function (StD = 1) {
    return new Spin(0, ...this.real(StD), this.real(StD)[0])
  },
  
  inexpensiveArraySize: 100,
  inexpensiveTangentSpinArray: [],
  
  inexpensiveTangentSpin: function (StD = 1) {
    const i = Math.floor(this.inexpensiveArraySize * Math.random())
    
    return this.inexpensiveTangentSpinArray[i].sMul(StD)
  }
}

{
  for (let i = 0; i < normal.inexpensiveArraySize; i++) {
    normal.inexpensiveTangentSpinArray.push(normal.tangentSpin());
  }
}
