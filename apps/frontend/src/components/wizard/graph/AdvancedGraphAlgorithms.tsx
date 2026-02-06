export class AdvancedGraphAlgorithms {
  nodes: any[];
  edges: any[];
  nodeIndices: Map<string, number>;
  adjacencyMatrix: number[][];
  laplacianMatrix: number[][];

  constructor(nodes: any[], edges: any[]) {
    this.nodes = nodes;
    this.edges = edges;
    this.nodeIndices = new Map(nodes.map((node, i) => [node.id, i]));
    this.adjacencyMatrix = this.buildAdjacencyMatrix();
    this.laplacianMatrix = this.buildLaplacianMatrix();
  }

  buildAdjacencyMatrix() {
    const n = this.nodes.length;
    const matrix = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));
    this.edges.forEach((edge: any) => {
      const sourceIdx = this.nodeIndices.get(edge.source);
      const targetIdx = this.nodeIndices.get(edge.target);
      if (sourceIdx !== undefined && targetIdx !== undefined) {
        matrix[sourceIdx][targetIdx] = 1;
        matrix[targetIdx][sourceIdx] = 1;
      }
    });
    return matrix;
  }

  buildLaplacianMatrix() {
    const n = this.nodes.length;
    const matrix = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));
    const degrees = this.adjacencyMatrix.map((row) => row.reduce((a, b) => a + b, 0));
    for (let i = 0; i < n; i++) {
      matrix[i][i] = degrees[i];
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          matrix[i][j] = -this.adjacencyMatrix[i][j];
        }
      }
    }
    return matrix;
  }

  powerIteration(matrix: number[][], iterations = 100) {
    const n = matrix.length;
    let vector = Array(n).fill(1 / Math.sqrt(n));
    let eigenvalue = 0;
    for (let iter = 0; iter < iterations; iter++) {
      const newVector = Array(n).fill(0);
      // Matrix-vector multiplication
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          newVector[i] += matrix[i][j] * vector[j];
        }
      }
      // Normalize
      const norm = Math.sqrt(newVector.reduce((a, b) => a + b * b, 0));
      vector = newVector.map((v) => v / norm);
      // Calculate eigenvalue
      eigenvalue = vector.reduce((sum, v, i) => {
        return sum + v * matrix[i].reduce((s, m, j) => s + m * vector[j], 0);
      }, 0);
    }
    return [vector, eigenvalue];
  }

  calculateEigenvectorCentrality() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [eigenvector, _] = this.powerIteration(this.adjacencyMatrix);
    return new Map(this.nodes.map((node, i) => [node.id, (eigenvector as number[])[i]]));
  }

  calculateKatzCentrality(alpha = 0.1) {
    const n = this.nodes.length;
    const beta = 1;
    const identity = Array(n)
      .fill(0)
      .map((_, i) =>
        Array(n)
          .fill(0)
          .map((_, j) => (i === j ? 1 : 0))
      );
    // Calculate (I - αA)^(-1) * β1
    const matrix = identity.map((row, i) =>
      row.map((val, j) => val - alpha * this.adjacencyMatrix[i][j])
    );
    // Simple Gaussian elimination for matrix inversion
    const katz = Array(n).fill(beta);
    for (let i = 0; i < n; i++) {
      const pivot = matrix[i][i];
      for (let j = i + 1; j < n; j++) {
        const factor = matrix[j][i] / pivot;
        for (let k = i; k < n; k++) {
          matrix[j][k] -= factor * matrix[i][k];
        }
        katz[j] -= factor * katz[i];
      }
    }
    for (let i = n - 1; i >= 0; i--) {
      for (let j = i + 1; j < n; j++) {
        katz[i] -= matrix[i][j] * katz[j];
      }
      katz[i] /= matrix[i][i];
    }
    return new Map(this.nodes.map((node, i) => [node.id, katz[i]]));
  }

  calculateSpectralProperties() {
    // Calculate first few eigenvalues and eigenvectors
    const numEigenvalues = Math.min(5, this.nodes.length);
    const eigenvalues = [];
    const eigenvectors = [];
    const matrix = this.adjacencyMatrix.map((row) => [...row]);
    for (let i = 0; i < numEigenvalues; i++) {
      const [eigenvector, eigenvalue] = this.powerIteration(matrix);
      eigenvalues.push(eigenvalue);
      eigenvectors.push(eigenvector);
      // Deflate matrix for next eigenvalue
      for (let j = 0; j < matrix.length; j++) {
        for (let k = 0; k < matrix.length; k++) {
          matrix[j][k] -=
            (eigenvalue as number) * (eigenvector as number[])[j] * (eigenvector as number[])[k];
        }
      }
    }
    // Calculate Laplacian spectrum
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, laplacianEigenvalue] = this.powerIteration(this.laplacianMatrix);
    const laplacianSpectrum = [laplacianEigenvalue];
    return {
      eigenvalues,
      eigenvectors,
      laplacianSpectrum,
    };
  }

  detectStructuralHoles() {
    const constraints = new Map();
    this.nodes.forEach((node: any) => {
      const neighbors = this.edges
        .filter((e: any) => e.source === node.id || e.target === node.id)
        .map((e: any) => (e.source === node.id ? e.target : e.source));
      if (neighbors.length < 2) {
        constraints.set(node.id, 0);
        return;
      }
      let constraint = 0;
      neighbors.forEach((neighbor1: any) => {
        neighbors.forEach((neighbor2: any) => {
          if (neighbor1 !== neighbor2) {
            const hasConnection = this.edges.some(
              (e: any) =>
                (e.source === neighbor1 && e.target === neighbor2) ||
                (e.source === neighbor2 && e.target === neighbor1)
            );
            if (hasConnection) {
              constraint += 1 / (neighbors.length * neighbors.length);
            }
          }
        });
      });
      constraints.set(node.id, 1 - constraint);
    });
    return constraints;
  }

  findCorePeriphery() {
    const degrees = new Map();
    this.nodes.forEach((node: any) => {
      degrees.set(
        node.id,
        this.edges.filter((e: any) => e.source === node.id || e.target === node.id).length
      );
    });
    // Use k-means with k=2 to separate core from periphery
    const sortedNodes = [...degrees.entries()].sort((a, b) => b[1] - a[1]);
    const medianDegree = sortedNodes[Math.floor(sortedNodes.length / 2)][1];
    const core = new Set();
    const periphery = new Set();
    sortedNodes.forEach(([nodeId, degree]) => {
      if (degree > medianDegree) {
        core.add(nodeId);
      } else {
        periphery.add(nodeId);
      }
    });
    return { core, periphery };
  }

  calculateAllMetrics() {
    const eigenvectorCentrality = this.calculateEigenvectorCentrality();
    const katzCentrality = this.calculateKatzCentrality();
    const spectralProperties = this.calculateSpectralProperties();
    const structuralHoles = this.detectStructuralHoles();
    const { core, periphery } = this.findCorePeriphery();
    // Calculate degree centrality
    const degreeCentrality = new Map();
    this.nodes.forEach((node: any) => {
      degreeCentrality.set(
        node.id,
        this.edges.filter((e: any) => e.source === node.id || e.target === node.id).length
      );
    });
    // Calculate clustering coefficients
    const localCoefficients = new Map();
    let globalCoefficient = 0;
    this.nodes.forEach((node: any) => {
      const neighbors = this.edges
        .filter((e: any) => e.source === node.id || e.target === node.id)
        .map((e: any) => (e.source === node.id ? e.target : e.source));
      if (neighbors.length < 2) {
        localCoefficients.set(node.id, 0);
        return;
      }
      let triangles = 0;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          if (
            this.edges.some(
              (e: any) =>
                (e.source === neighbors[i] && e.target === neighbors[j]) ||
                (e.source === neighbors[j] && e.target === neighbors[i])
            )
          ) {
            triangles++;
          }
        }
      }
      const coefficient = (2 * triangles) / (neighbors.length * (neighbors.length - 1));
      localCoefficients.set(node.id, coefficient);
      globalCoefficient += coefficient;
    });
    globalCoefficient /= this.nodes.length;
    // Assign communities based on core-periphery structure
    const communities = new Map();
    core.forEach((nodeId) => communities.set(nodeId, 1));
    periphery.forEach((nodeId) => communities.set(nodeId, 0));
    return {
      centrality: {
        degree: degreeCentrality,
        betweenness: new Map(), // Calculated in base class
        closeness: new Map(), // Calculated in base class
        eigenvector: eigenvectorCentrality,
        katz: katzCentrality,
      },
      clustering: {
        globalCoefficient,
        localCoefficients,
        communities,
      },
      paths: {
        averagePathLength: 0, // Requires all-pairs shortest paths
        diameter: 0, // Requires all-pairs shortest paths
        eccentricity: new Map(), // Requires all-pairs shortest paths
      },
      spectral: spectralProperties,
    };
  }
}
