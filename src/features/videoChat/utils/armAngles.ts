/**
 * MediaPipe Pose Arm Angle Calculator
 * 
 * Takes MediaPipe pose landmarks as input and returns XYZ Euler angles for arm bones.
 * No dependencies - pure JavaScript math.
 * 
 * @param {Array} landmarks - MediaPipe pose landmarks array (33 landmarks)
 * @returns {Object} Bone rotations with x, y, z angles in degrees
 */

function calculateArmAngles(landmarks) {
    /**
     * Get 3D coordinates from landmark
     */
    function getLandmark3D(index) {
        const lm = landmarks[index];
        return {
            x: lm.x,
            y: lm.y,
            z: lm.z
        };
    }

    /**
     * Vector subtraction: a - b
     */
    function vectorSubtract(a, b) {
        return {
            x: a.x - b.x,
            y: a.y - b.y,
            z: a.z - b.z
        };
    }

    /**
     * Vector magnitude (length)
     */
    function vectorMagnitude(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    }

    /**
     * Normalize vector (make unit length)
     */
    function vectorNormalize(v) {
        const mag = vectorMagnitude(v);
        if (mag === 0) return { x: 0, y: 0, z: 0 };
        return {
            x: v.x / mag,
            y: v.y / mag,
            z: v.z / mag
        };
    }

    /**
     * Dot product of two vectors
     */
    function vectorDot(a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    /**
     * Cross product of two vectors
     */
    function vectorCross(a, b) {
        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x
        };
    }

    /**
     * Calculate Euler angles (XYZ) from bone direction vector
     */
    function getEulerAngles(origin, point) {
        const direction = vectorNormalize(vectorSubtract(point, origin));

        // Yaw (Y-axis rotation) - horizontal rotation
        const yaw = Math.atan2(direction.x, direction.z);

        // Pitch (X-axis rotation) - vertical rotation
        const pitch = Math.asin(-direction.y);

        // Roll (Z-axis rotation) - twist around bone
        const roll = 0; // Simplified - requires additional reference points

        // Convert radians to degrees
        return {
            x: pitch * (180 / Math.PI),
            y: yaw * (180 / Math.PI),
            z: roll * (180 / Math.PI)
        };
    }

    /**
     * Calculate local rotation of child bone relative to parent bone
     */
    function calculateLocalRotation(parentStart, parentEnd, childStart, childEnd) {
        // Parent bone direction
        const parentDir = vectorNormalize(vectorSubtract(parentEnd, parentStart));

        // Child bone direction
        const childDir = vectorNormalize(vectorSubtract(childEnd, childStart));

        // Build orthonormal basis for parent bone
        let worldUp = { x: 0, y: 1, z: 0 };

        // Check if parent is parallel to world up
        if (Math.abs(vectorDot(parentDir, worldUp)) > 0.99) {
            worldUp = { x: 1, y: 0, z: 0 };
        }

        // Create right vector perpendicular to forward
        let parentRight = vectorCross(worldUp, parentDir);
        parentRight = vectorNormalize(parentRight);

        // Create up vector
        let parentUp = vectorCross(parentDir, parentRight);
        parentUp = vectorNormalize(parentUp);

        // Transform child direction into parent's local space
        // Multiply by transpose of rotation matrix
        const childLocal = {
            x: vectorDot(childDir, parentRight),
            y: vectorDot(childDir, parentUp),
            z: vectorDot(childDir, parentDir)
        };

        // Calculate Euler angles from local direction
        const yaw = Math.atan2(childLocal.x, childLocal.z);
        const pitch = Math.atan2(
            -childLocal.y,
            Math.sqrt(childLocal.x * childLocal.x + childLocal.z * childLocal.z)
        );
        const roll = 0; // Simplified

        // Convert to degrees
        return {
            x: pitch * (180 / Math.PI),
            y: yaw * (180 / Math.PI),
            z: roll * (180 / Math.PI)
        };
    }

    /**
     * Calculate angle between two vectors
     */
    function angleBetweenVectors(v1, v2) {
        const v1Norm = vectorNormalize(v1);
        const v2Norm = vectorNormalize(v2);

        let dot = vectorDot(v1Norm, v2Norm);
        // Clamp to prevent NaN from floating point errors
        dot = Math.max(-1, Math.min(1, dot));

        const angle = Math.acos(dot);
        return angle * (180 / Math.PI);
    }

    // Extract landmarks
    // LEFT ARM
    const leftShoulder = getLandmark3D(11);
    const leftElbow = getLandmark3D(13);
    const leftWrist = getLandmark3D(15);
    const leftHip = getLandmark3D(23);

    // RIGHT ARM
    const rightShoulder = getLandmark3D(12);
    const rightElbow = getLandmark3D(14);
    const rightWrist = getLandmark3D(16);
    const rightHip = getLandmark3D(24);

    // Calculate LEFT ARM rotations
    const leftUpperArmAbsolute = getEulerAngles(leftShoulder, leftElbow);
    const leftForearmLocal = calculateLocalRotation(
        leftShoulder, leftElbow,
        leftElbow, leftWrist
    );

    // Calculate RIGHT ARM rotations
    const rightUpperArmAbsolute = getEulerAngles(rightShoulder, rightElbow);
    const rightForearmLocal = calculateLocalRotation(
        rightShoulder, rightElbow,
        rightElbow, rightWrist
    );

    // Calculate practical angles for reference
    // Left elbow flexion
    const leftUpperArmVec = vectorSubtract(leftElbow, leftShoulder);
    const leftForearmVec = vectorSubtract(leftWrist, leftElbow);
    const leftElbowFlexion = 180 - angleBetweenVectors(
        { x: -leftUpperArmVec.x, y: -leftUpperArmVec.y, z: -leftUpperArmVec.z },
        leftForearmVec
    );

    // Right elbow flexion
    const rightUpperArmVec = vectorSubtract(rightElbow, rightShoulder);
    const rightForearmVec = vectorSubtract(rightWrist, rightElbow);
    const rightElbowFlexion = 180 - angleBetweenVectors(
        { x: -rightUpperArmVec.x, y: -rightUpperArmVec.y, z: -rightUpperArmVec.z },
        rightForearmVec
    );

    // Left shoulder abduction
    const leftTorsoVec = vectorSubtract(leftShoulder, leftHip);
    const leftShoulderAbduction = angleBetweenVectors(leftTorsoVec, leftUpperArmVec) - 90;

    // Right shoulder abduction
    const rightTorsoVec = vectorSubtract(rightShoulder, rightHip);
    const rightShoulderAbduction = angleBetweenVectors(rightTorsoVec, rightUpperArmVec) - 90;

    // Return results
    return {
        LeftUpperArm: {
            x: 345 - leftUpperArmAbsolute.x,
            y: leftUpperArmAbsolute.y - 130,
            z: leftUpperArmAbsolute.z + 15
        },
        LeftLowerArm: {
            x: leftForearmLocal.z,
            y: -leftForearmLocal.x + 10, // roll
            z: leftForearmLocal.y * 1.5 - 30
        },
        RightUpperArm: {
            x: 345 - rightUpperArmAbsolute.x,
            y: rightUpperArmAbsolute.y + 130,
            z: rightUpperArmAbsolute.z - 15
        },
        RightLowerArm: {
            x: rightForearmLocal.z,
            y: rightForearmLocal.x + 10,
            z: rightForearmLocal.y * 1.45
        }
    };
}

// Export for different module systems
export default calculateArmAngles;
