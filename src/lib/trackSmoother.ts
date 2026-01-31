import * as THREE from "three";

// One Euro Filter for smooth tracking
export class TrackSmoother {
    private x: THREE.Vector3;
    private dx: THREE.Vector3;
    private lastTime: number;
    private minCutoff: number;
    private beta: number;
    private dCutoff: number;

    constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
        this.x = new THREE.Vector3();
        this.dx = new THREE.Vector3();
        this.lastTime = performance.now();
        this.minCutoff = minCutoff;
        this.beta = beta;
        this.dCutoff = dCutoff;
    }

    filter(value: THREE.Vector3): THREE.Vector3 {
        const now = performance.now();
        const dt = Math.max((now - this.lastTime) / 1000, 0.001);
        this.lastTime = now;

        // Compute derivative
        const edx = value.clone().sub(this.x).divideScalar(dt);
        const smoothedDx = this.lowpass(edx, this.dx, this.alpha(dt, this.dCutoff));
        this.dx.copy(smoothedDx);

        // Compute cutoff frequency
        const cutoff = this.minCutoff + this.beta * this.dx.length();

        // Filter the value
        const smoothedX = this.lowpass(value, this.x, this.alpha(dt, cutoff));
        this.x.copy(smoothedX);

        return this.x.clone();
    }

    private alpha(dt: number, cutoff: number): number {
        const tau = 1.0 / (2 * Math.PI * cutoff);
        return 1.0 / (1.0 + tau / dt);
    }

    private lowpass(current: THREE.Vector3, previous: THREE.Vector3, alpha: number): THREE.Vector3 {
        return previous.clone().lerp(current, alpha);
    }

    reset() {
        this.x.set(0, 0, 0);
        this.dx.set(0, 0, 0);
        this.lastTime = performance.now();
    }
}