const stone = {
  vertices: [],
  vertexIndices: {},
  triangles: [],
  triangleFrames: [],
  normals: [],
  frames: []
};

stone.addVertex = function (label, x, y, z) {
  this.vertexIndices[label] = stone.vertices.length;
  this.vertices.push(new Tensor([x, y, z]));
}

stone.getVertex = function (label) {
  return this.vertices[this.vertexIndices[label]]
}

stone.addVertex("a",   5, 11.5,    0);
stone.addVertex("b", 6.5, 11.5,    0);
stone.addVertex("c", 7.7,   11,  0.2);
stone.addVertex("d",   8,  6.4,  0.7);
stone.addVertex("e", 7.5,  2.9,  0.1);
stone.addVertex("f", 6.5,  1.5, -0.2);
stone.addVertex("g", 3.5,  0.5, -0.1);
stone.addVertex("h",   2,    1, -0.4);
stone.addVertex("i", 1.2,  1.5, -0.8);
stone.addVertex("j",   1,    4, -0.2);
stone.addVertex("k", 1.5,  5.5,  0.6);

stone.addVertex("p1",   7, 10.7, 0.7);
stone.addVertex("p2",   4,  7.5, 0.8);
stone.addVertex("p3", 4.2,  2.7, 0.7);
stone.addVertex("p4",   3,  1.8, 0.5);
stone.addVertex("p5", 1.4,  2.5, 0.3);
stone.addVertex("p6", 3.2,  1.5, 0.5);
stone.addVertex("p7", 4.8,  1.2, 0.5);
stone.addVertex("p8", 6.2,  2.4, 0.55);
stone.addVertex("p9", 7.2,  3.1, 0.3);

stone.addVertex("s1", 7.8, 5.5, -0.6);
stone.addVertex("s2", 7.4, 3.5, -0.9);
stone.addVertex("s3", 6.2, 1.3, -1.7);
stone.addVertex("s4", 3.5, 1.2, -2.7);
stone.addVertex("s5", 1.3,   2, -2.6);

stone.addVertex("n1", 5.5, 7.5, -2.5);
stone.addVertex("n2",  5.4, 5, -2.6);
stone.addVertex("n3",  3, 7.7, -1);
stone.addVertex("n4", 3.7, 5.1, -2.6);

stone.translate = new Tensor([-0.75, -0.83, 0.15]);
stone.scale = 0.15;

for (let i = 0; i < stone.vertices.length; i++) {
  stone.vertices[i] = stone.translate.addMul(stone.scale, stone.vertices[i]);
}

stone.addTriangle = function (l1, l2, l3) {
  const v1 = this.getVertex(l1);
  const v2 = this.getVertex(l2);
  const v3 = this.getVertex(l3);
  
  this.triangles.push([v1, v2, v3]);
  
  const u2 = v2.addMul(-1, v1);
  const u3 = v3.addMul(-1, v1);
  
  /*
  this.triangleFrames.push([
    normalizeVector(v1.addMul(-1, v2)),
    normalizeVector(
      detMatrix3
        .rightMatrixMul(detMatrix3.rightMatrixMul(u2).rightMatrixMul(u3))
        .rightMatrixMul(u2)
    )
  ]);
  */
}

stone.addTriangle("p2","p1","a");
stone.addTriangle("p1","b","a");
stone.addTriangle("p2","d","p1");
stone.addTriangle("p2","k","p6");
stone.addTriangle("p2","p6","p8");
stone.addTriangle("p2","p8","d");
stone.addTriangle("p2","a","k");
stone.addTriangle("p1","d","c");
stone.addTriangle("p1","c","b");
stone.addTriangle("p6","k","p5");
stone.addTriangle("p8","p9","d");
stone.addTriangle("p5","k","j");
stone.addTriangle("p5","j","i");
stone.addTriangle("p5","i","h");
stone.addTriangle("p5","h","p6");
stone.addTriangle("p6","p7","p8")
stone.addTriangle("g","p6","h");
stone.addTriangle("g","p7","p6");
stone.addTriangle("g","f","p7");
stone.addTriangle("e","d","p9");
stone.addTriangle("e","p9","p8");
stone.addTriangle("e","p8","f");
stone.addTriangle("f","p8","p7");

stone.addTriangle("s1","d","e");
stone.addTriangle("s2","s1","e");
stone.addTriangle("s2","e","s3");
stone.addTriangle("s3","e","f");
stone.addTriangle("s3","f","g");
stone.addTriangle("s4","s3","g");
stone.addTriangle("s4","g","h");
stone.addTriangle("s4","h","i");
stone.addTriangle("s5","s4","i");
stone.addTriangle("s5","i","j");

stone.addTriangle("n1","a","b");
stone.addTriangle("n1","b","c");
stone.addTriangle("s1","c","d");
stone.addTriangle("n1","c","s1");
stone.addTriangle("n2","n1","s1");
stone.addTriangle("n2","s1","s2");
stone.addTriangle("n2","s3","s4");
stone.addTriangle("n2","s2","s3");
stone.addTriangle("n3","a","n1");
stone.addTriangle("n3","k","a");
stone.addTriangle("k","n3","j");
stone.addTriangle("j","n3","s5");
stone.addTriangle("s5","n2","s4");
stone.addTriangle("n4","n3","n1");
stone.addTriangle("n4","n1","n2");
stone.addTriangle("n4","n2","s5");
stone.addTriangle("n4","s5","n3");

stone.rotatedVertices = function (R) {
  const out = [];
  
  for (let i = 0; i < this.vertices.length; i++) {
    out.push(R.rightMatrixMul(this.vertices[i]));
  }
  
  return out
}

stone.rotatedTriangles = function (R) {
  const out = [];
  
  for (let i = 0; i < this.triangles.length; i++) {
    out.push([
    R.rightMatrixMul(this.triangles[i][0]),
    R.rightMatrixMul(this.triangles[i][1]),
    R.rightMatrixMul(this.triangles[i][2])
    ]);
  }
  
  return out
}