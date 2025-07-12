var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AdvancedClustering_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VectorMemoryCache } from '../cache/VectorMemoryCache';
let AdvancedClustering = AdvancedClustering_1 = class AdvancedClustering {
    configService;
    vectorCache;
    logger = new Logger(AdvancedClustering_1.name);
    defaultConfig;
    constructor(configService, vectorCache) {
        this.configService = configService;
        this.vectorCache = vectorCache;
        this.defaultConfig = {
            algorithm: 'kmeans',
            numClusters: 5,
            maxIterations: 100,
            tolerance: 0.0001,
            distanceMetric: 'cosine',
            minSamples: 3,
            epsilon: 0.5
        };
    }
    async clusterVectors(vectors, config = {}) {
        const startTime = Date.now();
        const finalConfig = { ...this.defaultConfig, ...config };
        try {
            this.logger.debug(`Clustering ${vectors.length} vectors using ${finalConfig.algorithm}`);
            let clusters;
            switch (finalConfig.algorithm) {
                case 'kmeans':
                    clusters = await this.kMeansClustering(vectors, finalConfig);
                    break;
                case 'hierarchical':
                    clusters = await this.hierarchicalClustering(vectors, finalConfig);
                    break;
                case 'dbscan':
                    clusters = await this.dbscanClustering(vectors, finalConfig);
                    break;
                default:
                    throw new Error(`Unsupported clustering algorithm: ${finalConfig.algorithm}`);
            }
            // Calculate cluster quality metrics
            this.calculateClusterMetrics(clusters, finalConfig.distanceMetric);
            const silhouetteScore = this.calculateSilhouetteScore(clusters, finalConfig.distanceMetric);
            const executionTime = Date.now() - startTime;
            const result = {
                clusters,
                totalItems: vectors.length,
                clusteredItems: clusters.reduce((sum, cluster) => sum + cluster.members.length, 0),
                silhouetteScore,
                algorithm: finalConfig.algorithm,
                executionTime
            };
            this.logger.debug(`Clustering completed in ${executionTime}ms. Silhouette score: ${silhouetteScore.toFixed(3)}`);
            return result;
        }
        catch (error) {
            this.logger.error('Clustering failed:', error);
            throw error;
        }
    }
    async kMeansClustering(vectors, config) {
        const k = config.numClusters;
        const maxIterations = config.maxIterations;
        const tolerance = config.tolerance;
        if (vectors.length < k) {
            throw new Error(`Cannot create ${k} clusters with only ${vectors.length} vectors`);
        }
        // Initialize centroids randomly
        let centroids = this.initializeCentroids(vectors, k);
        let assignments = new Array(vectors.length).fill(-1);
        let converged = false;
        let iteration = 0;
        while (!converged && iteration < maxIterations) {
            const newAssignments = new Array(vectors.length);
            // Assign each vector to the nearest centroid
            for (let i = 0; i < vectors.length; i++) {
                let minDistance = Infinity;
                let bestCluster = 0;
                for (let j = 0; j < k; j++) {
                    const distance = this.calculateDistance(vectors[i].embedding, centroids[j], config.distanceMetric);
                    if (distance < minDistance) {
                        minDistance = distance;
                        bestCluster = j;
                    }
                }
                newAssignments[i] = bestCluster;
            }
            // Update centroids
            const newCentroids = this.updateCentroids(vectors, newAssignments, k);
            // Check for convergence
            converged = this.checkConvergence(centroids, newCentroids, tolerance);
            centroids = newCentroids;
            assignments = newAssignments;
            iteration++;
        }
        // Create cluster objects
        return this.createClusters(vectors, assignments, centroids, 'kmeans');
    }
    async hierarchicalClustering(vectors, config) {
        // Agglomerative hierarchical clustering
        const nodes = vectors.map((vector, index) => ({
            id: `node_${index}`,
            centroid: [...vector.embedding],
            members: [vector],
            level: 0,
            cohesion: 0
        }));
        let currentLevel = 1;
        while (nodes.length > config.numClusters) {
            let minDistance = Infinity;
            let mergeIndices = [-1, -1];
            // Find the two closest clusters
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const distance = this.calculateDistance(nodes[i].centroid, nodes[j].centroid, config.distanceMetric);
                    if (distance < minDistance) {
                        minDistance = distance;
                        mergeIndices = [i, j];
                    }
                }
            }
            // Merge the two closest clusters
            const [i, j] = mergeIndices;
            const mergedNode = {
                id: `merged_${currentLevel}_${i}_${j}`,
                centroid: this.calculateCentroid([...nodes[i].members, ...nodes[j].members]),
                members: [...nodes[i].members, ...nodes[j].members],
                children: [nodes[i], nodes[j]],
                level: currentLevel,
                cohesion: 0
            };
            // Set parent references
            nodes[i].parent = mergedNode;
            nodes[j].parent = mergedNode;
            // Remove merged nodes and add new node
            nodes.splice(Math.max(i, j), 1);
            nodes.splice(Math.min(i, j), 1);
            nodes.push(mergedNode);
            currentLevel++;
        }
        // Convert nodes to clusters
        return nodes.map((node, index) => ({
            id: `hierarchical_cluster_${index}`,
            centroid: node.centroid,
            members: node.members,
            cohesion: 0,
            separation: 0,
            tags: [`level_${node.level}`],
            metadata: {
                algorithm: 'hierarchical',
                level: node.level,
                hasChildren: !!node.children
            }
        }));
    }
    async dbscanClustering(vectors, config) {
        const epsilon = config.epsilon;
        const minSamples = config.minSamples;
        const visited = new Set();
        const clusters = [];
        const noise = [];
        for (let i = 0; i < vectors.length; i++) {
            if (visited.has(i))
                continue;
            visited.add(i);
            const neighbors = this.getNeighbors(vectors, i, epsilon, config.distanceMetric);
            if (neighbors.length < minSamples) {
                noise.push(vectors[i]);
            }
            else {
                const cluster = this.expandCluster(vectors, i, neighbors, visited, epsilon, minSamples, config.distanceMetric);
                clusters.push({
                    id: `dbscan_cluster_${clusters.length}`,
                    centroid: this.calculateCentroid(cluster),
                    members: cluster,
                    cohesion: 0,
                    separation: 0,
                    tags: ['dbscan'],
                    metadata: {
                        algorithm: 'dbscan',
                        size: cluster.length
                    }
                });
            }
        }
        // Add noise cluster if there are noise points
        if (noise.length > 0) {
            clusters.push({
                id: 'noise_cluster',
                centroid: this.calculateCentroid(noise),
                members: noise,
                cohesion: 0,
                separation: 0,
                tags: ['noise'],
                metadata: {
                    algorithm: 'dbscan',
                    isNoise: true,
                    size: noise.length
                }
            });
        }
        return clusters;
    }
    calculateDistance(vector1, vector2, metric) {
        switch (metric) {
            case 'cosine':
                return this.cosineDistance(vector1, vector2);
            case 'euclidean':
                return this.euclideanDistance(vector1, vector2);
            case 'manhattan':
                return this.manhattanDistance(vector1, vector2);
            default:
                throw new Error(`Unsupported distance metric: ${metric}`);
        }
    }
    cosineDistance(vector1, vector2) {
        const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
        const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
        const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
        if (magnitude1 === 0 || magnitude2 === 0)
            return 1;
        return 1 - (dotProduct / (magnitude1 * magnitude2));
    }
    euclideanDistance(vector1, vector2) {
        return Math.sqrt(vector1.reduce((sum, val, i) => sum + Math.pow(val - vector2[i], 2), 0));
    }
    manhattanDistance(vector1, vector2) {
        return vector1.reduce((sum, val, i) => sum + Math.abs(val - vector2[i]), 0);
    }
    initializeCentroids(vectors, k) {
        const centroids = [];
        const used = new Set();
        // Use k-means++ initialization for better results
        // First centroid is chosen randomly
        const firstIndex = Math.floor(Math.random() * vectors.length);
        centroids.push([...vectors[firstIndex].embedding]);
        used.add(firstIndex);
        // Choose remaining centroids based on distance from existing centroids
        for (let i = 1; i < k; i++) {
            const distances = [];
            let totalDistance = 0;
            for (let j = 0; j < vectors.length; j++) {
                if (used.has(j)) {
                    distances[j] = 0;
                    continue;
                }
                let minDistance = Infinity;
                for (const centroid of centroids) {
                    const distance = this.euclideanDistance(vectors[j].embedding, centroid);
                    minDistance = Math.min(minDistance, distance);
                }
                distances[j] = minDistance * minDistance; // Square the distance
                totalDistance += distances[j];
            }
            // Choose next centroid with probability proportional to squared distance
            const threshold = Math.random() * totalDistance;
            let cumulative = 0;
            for (let j = 0; j < distances.length; j++) {
                cumulative += distances[j];
                if (cumulative >= threshold && !used.has(j)) {
                    centroids.push([...vectors[j].embedding]);
                    used.add(j);
                    break;
                }
            }
        }
        return centroids;
    }
    updateCentroids(vectors, assignments, k) {
        const centroids = [];
        const dimensions = vectors[0].embedding.length;
        for (let i = 0; i < k; i++) {
            const clusterVectors = vectors.filter((_, index) => assignments[index] === i);
            if (clusterVectors.length === 0) {
                // If cluster is empty, keep the previous centroid or reinitialize
                centroids.push(new Array(dimensions).fill(0));
                continue;
            }
            const newCentroid = new Array(dimensions).fill(0);
            for (const vector of clusterVectors) {
                for (let j = 0; j < dimensions; j++) {
                    newCentroid[j] += vector.embedding[j];
                }
            }
            for (let j = 0; j < dimensions; j++) {
                newCentroid[j] /= clusterVectors.length;
            }
            centroids.push(newCentroid);
        }
        return centroids;
    }
    checkConvergence(oldCentroids, newCentroids, tolerance) {
        for (let i = 0; i < oldCentroids.length; i++) {
            const distance = this.euclideanDistance(oldCentroids[i], newCentroids[i]);
            if (distance > tolerance) {
                return false;
            }
        }
        return true;
    }
    createClusters(vectors, assignments, centroids, algorithm) {
        const clusters = [];
        for (let i = 0; i < centroids.length; i++) {
            const members = vectors.filter((_, index) => assignments[index] === i);
            clusters.push({
                id: `${algorithm}_cluster_${i}`,
                centroid: centroids[i],
                members,
                cohesion: 0,
                separation: 0,
                tags: [algorithm],
                metadata: {
                    algorithm,
                    size: members.length,
                    clusterIndex: i
                }
            });
        }
        return clusters;
    }
    calculateCentroid(vectors) {
        if (vectors.length === 0)
            return [];
        const dimensions = vectors[0].embedding.length;
        const centroid = new Array(dimensions).fill(0);
        for (const vector of vectors) {
            for (let i = 0; i < dimensions; i++) {
                centroid[i] += vector.embedding[i];
            }
        }
        for (let i = 0; i < dimensions; i++) {
            centroid[i] /= vectors.length;
        }
        return centroid;
    }
    getNeighbors(vectors, pointIndex, epsilon, metric) {
        const neighbors = [];
        for (let i = 0; i < vectors.length; i++) {
            if (i === pointIndex)
                continue;
            const distance = this.calculateDistance(vectors[pointIndex].embedding, vectors[i].embedding, metric);
            if (distance <= epsilon) {
                neighbors.push(i);
            }
        }
        return neighbors;
    }
    expandCluster(vectors, pointIndex, neighbors, visited, epsilon, minSamples, metric) {
        const cluster = [vectors[pointIndex]];
        const queue = [...neighbors];
        while (queue.length > 0) {
            const currentIndex = queue.shift();
            if (!visited.has(currentIndex)) {
                visited.add(currentIndex);
                cluster.push(vectors[currentIndex]);
                const currentNeighbors = this.getNeighbors(vectors, currentIndex, epsilon, metric);
                if (currentNeighbors.length >= minSamples) {
                    queue.push(...currentNeighbors);
                }
            }
        }
        return cluster;
    }
    calculateClusterMetrics(clusters, metric) {
        for (let i = 0; i < clusters.length; i++) {
            const cluster = clusters[i];
            // Calculate cohesion (average distance from centroid)
            const cohesion = this.calculateCohesion(cluster.members, cluster.centroid, metric);
            cluster.cohesion = cohesion;
            // Calculate separation (minimum distance to other cluster centroids)
            let minDistance = Infinity;
            for (let j = 0; j < clusters.length; j++) {
                if (i === j)
                    continue;
                const distance = this.calculateDistance(cluster.centroid, clusters[j].centroid, metric);
                minDistance = Math.min(minDistance, distance);
            }
            cluster.separation = minDistance === Infinity ? 1.0 : minDistance;
        }
    }
    calculateCohesion(members, centroid, metric) {
        if (members.length === 0)
            return 0;
        const totalDistance = members.reduce((sum, member) => sum + this.calculateDistance(member.embedding, centroid, metric), 0);
        return totalDistance / members.length;
    }
    calculateSilhouetteScore(clusters, metric) {
        let totalScore = 0;
        let totalPoints = 0;
        for (const cluster of clusters) {
            for (const member of cluster.members) {
                const a = this.calculateIntraClusterDistance(member, cluster, metric);
                const b = this.calculateNearestClusterDistance(member, clusters, cluster, metric);
                const silhouette = b === 0 ? 0 : (b - a) / Math.max(a, b);
                totalScore += silhouette;
                totalPoints++;
            }
        }
        return totalPoints === 0 ? 0 : totalScore / totalPoints;
    }
    calculateIntraClusterDistance(point, cluster, metric) {
        if (cluster.members.length <= 1)
            return 0;
        const distances = cluster.members
            .filter(member => member.id !== point.id)
            .map(member => this.calculateDistance(point.embedding, member.embedding, metric));
        return distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
    }
    calculateNearestClusterDistance(point, allClusters, currentCluster, metric) {
        let minAvgDistance = Infinity;
        for (const cluster of allClusters) {
            if (cluster.id === currentCluster.id || cluster.members.length === 0)
                continue;
            const avgDistance = cluster.members.reduce((sum, member) => sum + this.calculateDistance(point.embedding, member.embedding, metric), 0) / cluster.members.length;
            minAvgDistance = Math.min(minAvgDistance, avgDistance);
        }
        return minAvgDistance === Infinity ? 0 : minAvgDistance;
    }
    async optimizeClusters(clusters, config = {}) {
        // Remove empty clusters
        let optimizedClusters = clusters.filter(cluster => cluster.members.length > 0);
        // Merge clusters that are too close together
        const mergeThreshold = config.epsilon || 0.1;
        const distanceMetric = config.distanceMetric || 'cosine';
        let merged = true;
        while (merged) {
            merged = false;
            for (let i = 0; i < optimizedClusters.length; i++) {
                for (let j = i + 1; j < optimizedClusters.length; j++) {
                    const distance = this.calculateDistance(optimizedClusters[i].centroid, optimizedClusters[j].centroid, distanceMetric);
                    if (distance < mergeThreshold) {
                        // Merge clusters j into i
                        const mergedMembers = [...optimizedClusters[i].members, ...optimizedClusters[j].members];
                        const mergedCentroid = this.calculateCentroid(mergedMembers);
                        optimizedClusters[i] = {
                            ...optimizedClusters[i],
                            centroid: mergedCentroid,
                            members: mergedMembers,
                            metadata: {
                                ...optimizedClusters[i].metadata,
                                merged: true,
                                originalClusters: [optimizedClusters[i].id, optimizedClusters[j].id]
                            }
                        };
                        optimizedClusters.splice(j, 1);
                        merged = true;
                        break;
                    }
                }
                if (merged)
                    break;
            }
        }
        // Recalculate metrics for optimized clusters
        this.calculateClusterMetrics(optimizedClusters, distanceMetric);
        return optimizedClusters;
    }
};
AdvancedClustering = AdvancedClustering_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService,
        VectorMemoryCache])
], AdvancedClustering);
export { AdvancedClustering };
