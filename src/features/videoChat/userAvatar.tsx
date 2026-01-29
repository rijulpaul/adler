import { useFrame } from "@react-three/fiber";
import { type RefObject, useEffect, useState, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { detectFace } from "../../lib/trackers/faceTracker";
import { detectPose } from "../../lib/trackers/poseTracker";

// One Euro Filter for smooth tracking
class OneEuroFilter {
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

// Rotation smoother using quaternions for better interpolation
class RotationSmoother {
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

function UserAvatar({ videoRef }: { videoRef: RefObject<HTMLVideoElement | null> }) {
    const { scene: avatar, nodes } = useGLTF("/avatars/AnimeGirlKawaii/AnimeGirlKawaii.glb");
    const avatarMesh = nodes["Body"] as THREE.Mesh;
    const head = nodes["Head"] as THREE.Bone;

    const [boneMap, setBoneMap] = useState(null);

    // Filters for smooth movement
    const positionFilter = useRef(new OneEuroFilter(1.0, 0.007, 1.0));
    const rotationSmoother = useRef(new RotationSmoother(0.15));

    // Store initial bone transforms
    const initialHeadPosition = useRef<THREE.Vector3>(new THREE.Vector3());
    const initialHeadRotation = useRef<THREE.Quaternion>(new THREE.Quaternion());

    // Tracking state
    const isInitialized = useRef(false);
    const noDetectionFrames = useRef(0);
    const maxNoDetectionFrames = 30; // Reset after 30 frames without detection

    useEffect(() => {
        fetch('/avatars/AnimeGirlKawaii/AnimeGirlKawaii_BoneMap.json')
            .then(r => r.json())
            .then(setBoneMap);

        // Store initial bone transforms
        if (head) {
            initialHeadPosition.current.copy(head.position);
            initialHeadRotation.current.copy(head.quaternion);
        }
    }, [head]);

    // Calculate head rotation from pose landmarks
    const calculateHeadRotation = (landmarks: any[]): THREE.Quaternion | null => {
        if (landmarks.length < 11) return null;

        // MediaPipe pose landmarks indices:
        // 0: nose, 2: left eye inner, 5: right eye inner
        // 7: left ear, 8: right ear, 11: left shoulder, 12: right shoulder
        const nose = landmarks[0];
        const leftEye = landmarks[2];
        const rightEye = landmarks[5];
        const leftEar = landmarks[7];
        const rightEar = landmarks[8];

        // Calculate eye center
        const eyeCenterX = (leftEye.x + rightEye.x) / 2;
        const eyeCenterY = (leftEye.y + rightEye.y) / 2;
        const eyeCenterZ = (leftEye.z + rightEye.z) / 2;

        // Calculate yaw (left-right rotation) from nose relative to eye center
        const yaw = -(nose.x - eyeCenterX) * Math.PI * 1.5;

        // Calculate pitch (up-down rotation) from nose relative to eye center
        const pitch = (nose.y - eyeCenterY) * Math.PI * 1.5;

        // Calculate roll (tilt) from eye positions
        const eyeDeltaY = leftEye.y - rightEye.y;
        const eyeDeltaX = leftEye.x - rightEye.x;
        const roll = Math.atan2(eyeDeltaY, eyeDeltaX);

        // Create quaternion from euler angles
        const euler = new THREE.Euler(pitch, yaw, roll, 'XYZ');
        return new THREE.Quaternion().setFromEuler(euler);
    };

    // Calculate head position offset from pose landmarks
    const calculateHeadPosition = (landmarks: any[]): THREE.Vector3 | null => {
        if (landmarks.length < 1) return null;

        const nose = landmarks[0];

        // Convert MediaPipe coordinates to Three.js space
        // MediaPipe: x[0,1] left-right, y[0,1] top-bottom, z depth (negative = closer)
        const position = new THREE.Vector3(
            (nose.x - 0.5) * 0.2,        // Center and scale x
            -(nose.y - 0.5) * 0.2,       // Invert and scale y
            nose.z * 0.1                 // Scale z (depth)
        );

        return position;
    };

    useFrame(() => {
        if (!videoRef.current || !avatarMesh?.morphTargetInfluences || !avatarMesh.morphTargetDictionary) return;

        // Handle face blendshapes for facial expressions
        const faceLandmarkerResult = detectFace(videoRef.current);
        if (faceLandmarkerResult?.faceBlendshapes?.[0]?.categories) {
            const blendShapes = faceLandmarkerResult.faceBlendshapes[0].categories;
            blendShapes.forEach((blendShape: { categoryName: string; score: number }) => {
                const index = avatarMesh.morphTargetDictionary![blendShape.categoryName];
                if (index !== undefined) {
                    avatarMesh.morphTargetInfluences![index] = blendShape.score;
                }
            });
        }

        // Handle head movement and rotation from pose
        const poseLandmarkerResult = detectPose(videoRef.current);

        if (poseLandmarkerResult?.landmarks?.[0] && poseLandmarkerResult.landmarks[0].length > 0) {
            const landmarks = poseLandmarkerResult.landmarks[0];

            // Reset no detection counter
            noDetectionFrames.current = 0;

            // Calculate target rotation
            const targetRotation = calculateHeadRotation(landmarks);
            if (targetRotation) {
                // Smooth rotation using quaternion interpolation
                const smoothedRotation = rotationSmoother.current.smooth(targetRotation);

                // Combine with initial rotation
                const finalRotation = initialHeadRotation.current.clone().multiply(smoothedRotation);
                head.quaternion.copy(finalRotation);
            }

            // Calculate target position
            const targetPosition = calculateHeadPosition(landmarks);
            if (targetPosition) {
                // Apply One Euro Filter for smooth position
                const smoothedOffset = positionFilter.current.filter(targetPosition);

                // Apply position relative to initial position
                const finalPosition = initialHeadPosition.current.clone().add(smoothedOffset.multiplyScalar(0.3));
                head.position.copy(finalPosition);
            }

            isInitialized.current = true;
        } else {
            // No detection - increment counter
            noDetectionFrames.current++;

            // If no detection for too long, gradually return to initial pose
            if (noDetectionFrames.current > maxNoDetectionFrames && isInitialized.current) {
                // Smoothly return to initial transforms
                head.position.lerp(initialHeadPosition.current, 0.05);
                head.quaternion.slerp(initialHeadRotation.current, 0.05);

                // Reset filters if very close to initial state
                const positionDiff = head.position.distanceTo(initialHeadPosition.current);
                if (positionDiff < 0.01) {
                    positionFilter.current.reset();
                    rotationSmoother.current.reset();
                    isInitialized.current = false;
                }
            }
        }

        // Update bone matrix
        head.updateMatrixWorld(true);
    });

    return <primitive object={avatar} />;
}

export default UserAvatar;