import * as THREE from "three";

// Rotation smoother using quaternions for better interpolation
export class RotationSmoother {
    private current: THREE.Quaternion;
    private smoothFactor: number;

    constructor(smoothFactor = 0.15) {
        this.current = new THREE.Quaternion();
        this.smoothFactor = smoothFactor;
    }

    smooth(targetQuaternion: THREE.Quaternion): THREE.Quaternion {
        this.current.slerp(targetQuaternion, this.smoothFactor);
        return this.current.clone();
    }

    reset() {
        this.current.identity();
    }
}