import { useFrame } from "@react-three/fiber";
import { type RefObject, useEffect, useState, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import { TrackSmoother } from "../../lib/trackSmoother";
import { RotationSmoother } from "../../lib/rotationSmoother";

import { detectFace } from "../../lib/trackers/faceTracker";
import { detectPose } from "../../lib/trackers/poseTracker";

type BoneMapping = {
    name: string;
    bone: string;
    start: number;
    end: number | null;
    axis?: string;
    useRotation?: boolean;
    comment?: string;
}

type BoneMap = {
    bones: BoneMapping[];
    landmarkNames: { [key: string]: string };
}

type Landmark = {
    x: number;
    y: number;
    z: number;
    visibility?: number;
}

function UserAvatar({ videoRef }: { videoRef: RefObject<HTMLVideoElement | null> }) {
    const { scene: avatar, nodes } = useGLTF("/avatars/AnimeGirlKawaii/AnimeGirlKawaii.glb");
    const avatarMesh = nodes["Body"] as THREE.Mesh;

    const [boneMap, setBoneMap] = useState<BoneMap | null>(null);

    // Store initial bone rotations
    const initialBoneRotations = useRef<Map<string, THREE.Quaternion>>(new Map());
    const boneRefs = useRef<Map<string, THREE.Bone>>(new Map());

    // Smoothers for each bone
    const rotationSmoothers = useRef<Map<string, RotationSmoother>>(new Map());

    // Tracking state
    const isInitialized = useRef(false);
    const noDetectionFrames = useRef(0);
    const maxNoDetectionFrames = 30;

    useEffect(() => {
        fetch('/avatars/AnimeGirlKawaii/AnimeGirlKawaii_BoneMap.json')
            .then(r => r.json())
            .then((loadedBoneMap: BoneMap) => {
                setBoneMap(loadedBoneMap);

                // Initialize bone references and store initial rotations
                loadedBoneMap.bones.forEach((mapping) => {
                    const bone = nodes[mapping.bone] as THREE.Bone;
                    if (bone) {
                        boneRefs.current.set(mapping.name, bone);
                        initialBoneRotations.current.set(
                            mapping.name,
                            bone.quaternion.clone()
                        );
                        // Create a rotation smoother for each bone
                        rotationSmoothers.current.set(
                            mapping.name,
                            new RotationSmoother(0.15)
                        );
                    }
                });
            });
    }, [nodes]);

    /**
     * Calculate rotation quaternion to align a bone with a target direction
     */
    const calculateBoneRotation = (
        startLandmark: Landmark,
        endLandmark: Landmark,
        initialRotation: THREE.Quaternion,
        axis: string = 'y'
    ): THREE.Quaternion => {
        // Calculate direction vector from start to end
        const direction = new THREE.Vector3(
            endLandmark.x - startLandmark.x,
            -(endLandmark.y - startLandmark.y), // Flip Y axis (MediaPipe Y is down, Three.js Y is up)
            endLandmark.z - startLandmark.z
        ).normalize();

        // Define the default bone direction based on axis
        let defaultDirection: THREE.Vector3;
        switch (axis.toLowerCase()) {
            case 'x':
                defaultDirection = new THREE.Vector3(1, 0, 0);
                break;
            case 'y':
                defaultDirection = new THREE.Vector3(0, 1, 0);
                break;
            case 'z':
                defaultDirection = new THREE.Vector3(0, 0, 1);
                break;
            default:
                defaultDirection = new THREE.Vector3(0, 1, 0);
        }

        // Apply initial rotation to default direction
        const rotatedDefault = defaultDirection.clone().applyQuaternion(initialRotation);

        // Calculate rotation needed to align rotatedDefault with direction
        const rotationQuat = new THREE.Quaternion().setFromUnitVectors(
            rotatedDefault,
            direction
        );

        // Combine with initial rotation
        return rotationQuat.multiply(initialRotation);
    };

    /**
     * Calculate head rotation from facial landmarks
     */
    const calculateHeadRotation = (landmarks: Landmark[]): THREE.Quaternion | null => {
        if (landmarks.length < 11) return null;

        const nose = landmarks[0];
        const leftEye = landmarks[2];
        const rightEye = landmarks[5];

        // Calculate eye center
        const eyeCenterX = (leftEye.x + rightEye.x) / 2;
        const eyeCenterY = (leftEye.y + rightEye.y) / 2;

        // Calculate yaw (left-right rotation)
        const yaw = (nose.x - eyeCenterX) * Math.PI * 1.5;

        // Calculate pitch (up-down rotation)
        const pitch = -(nose.y - eyeCenterY) * Math.PI * 1.5; // Negative to flip

        // Calculate roll (tilt) from eye positions
        const eyeDeltaY = leftEye.y - rightEye.y;
        const eyeDeltaX = leftEye.x - rightEye.x;
        const roll = Math.atan2(eyeDeltaY, eyeDeltaX);

        // Create quaternion from euler angles
        const euler = new THREE.Euler(-pitch, yaw, -roll, 'XYZ');
        return new THREE.Quaternion().setFromEuler(euler);
    };

    /**
     * Apply pose to all bones based on bone map
     */
    const applyPoseToBones = (landmarks: Landmark[]) => {
        if (!boneMap) return;

        boneMap.bones.forEach((mapping) => {
            const bone = boneRefs.current.get(mapping.name);
            if (!bone) return;

            const initialRotation = initialBoneRotations.current.get(mapping.name);
            if (!initialRotation) return;

            // Special handling for head (uses face-based rotation)
            if (mapping.useRotation && mapping.name === "Head") {
                const headRotation = calculateHeadRotation(landmarks);
                if (headRotation) {
                    const smoother = rotationSmoothers.current.get(mapping.name);
                    const smoothedRotation = smoother
                        ? smoother.smooth(headRotation)
                        : headRotation;

                    bone.quaternion.copy(smoothedRotation);
                }
                return;
            }

            // Regular bone rotation based on start/end landmarks
            if (mapping.end !== null && landmarks[mapping.start] && landmarks[mapping.end]) {
                const startLandmark = landmarks[mapping.start];
                const endLandmark = landmarks[mapping.end];

                // Check visibility if available
                if (
                    startLandmark.visibility !== undefined &&
                    endLandmark.visibility !== undefined &&
                    (startLandmark.visibility < 0.5 || endLandmark.visibility < 0.5)
                ) {
                    return; // Skip bones with low visibility
                }

                const targetRotation = calculateBoneRotation(
                    startLandmark,
                    endLandmark,
                    initialRotation,
                    mapping.axis || 'y'
                );

                // Apply smoothing
                const smoother = rotationSmoothers.current.get(mapping.name);
                const smoothedRotation = smoother
                    ? smoother.smooth(targetRotation)
                    : targetRotation;

                bone.quaternion.copy(smoothedRotation);
            }
        });
    };

    /**
     * Reset all bones to initial pose
     */
    const resetToInitialPose = (lerpFactor: number = 0.05) => {
        boneRefs.current.forEach((bone, name) => {
            const initialRotation = initialBoneRotations.current.get(name);
            if (initialRotation) {
                bone.quaternion.slerp(initialRotation, lerpFactor);
            }
        });
    };

    useFrame(() => {
        if (!videoRef.current || !avatarMesh?.morphTargetInfluences || !avatarMesh.morphTargetDictionary) {
            return;
        }

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

        // Handle pose tracking
        const poseLandmarkerResult = detectPose(videoRef.current);

        if (
            poseLandmarkerResult?.worldLandmarks?.[0] &&
            poseLandmarkerResult.worldLandmarks[0].length > 0
        ) {
            const landmarks = poseLandmarkerResult.worldLandmarks[0];

            // Reset no detection counter
            noDetectionFrames.current = 0;

            // Apply pose to all bones
            applyPoseToBones(landmarks);

            // Update bone matrices
            boneRefs.current.forEach((bone) => {
                bone.updateMatrixWorld(true);
            });

            isInitialized.current = true;
        } else {
            // No detection - increment counter
            noDetectionFrames.current++;

            // If no detection for too long, gradually return to initial pose
            if (noDetectionFrames.current > maxNoDetectionFrames && isInitialized.current) {
                resetToInitialPose(0.05);

                // Reset smoothers when close to initial state
                if (noDetectionFrames.current > maxNoDetectionFrames + 20) {
                    rotationSmoothers.current.forEach((smoother) => smoother.reset());
                    isInitialized.current = false;
                }
            }
        }
    });

    return <primitive object={avatar} />;
}

export default UserAvatar;