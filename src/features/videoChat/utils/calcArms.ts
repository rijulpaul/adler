import * as THREE from "three";

type ArmAngles = {
    shoulder: {
        x: number; // pitch (forward/back)
        y: number; // yaw (outward/inward)
        z: number; // roll (optional, usually 0)
    };
    elbow: {
        x: number; // bend
        y: number;
        z: number;
    };
};

const v = (a: any, b: any) =>
    new THREE.Vector3(b.x - a.x, b.y - a.y, b.z - a.z);

const angleBetween = (a: THREE.Vector3, b: THREE.Vector3) =>
    Math.acos(THREE.MathUtils.clamp(a.clone().normalize().dot(b.clone().normalize()), -1, 1));

/**
 * lm = poseResult.worldLandmarks[0]
 */
export function calcArmsCustom(lm: any[]): { Left: ArmAngles; Right: ArmAngles } {
    // ---------- LANDMARK INDICES ----------
    const L = { shoulder: 11, elbow: 13, wrist: 15 };
    const R = { shoulder: 12, elbow: 14, wrist: 16 };

    const solveArm = (S: number, E: number, W: number, side: "Left" | "Right"): ArmAngles => {
        const shoulder = new THREE.Vector3(lm[S].x, lm[S].y, lm[S].z);
        const elbow = new THREE.Vector3(lm[E].x, lm[E].y, lm[E].z);
        const wrist = new THREE.Vector3(lm[W].x, lm[W].y, lm[W].z);

        const upper = elbow.clone().sub(shoulder);
        const lower = wrist.clone().sub(elbow);

        // Shoulder yaw (arm outwards)
        const yaw = Math.atan2(upper.x, upper.z) * (side === "Right" ? -1 : 1);

        // Shoulder pitch (arm forward/back)
        const pitch = Math.atan2(-upper.y, upper.z);

        // Elbow bend
        const bend = angleBetween(upper, lower) - Math.PI;

        return {
            shoulder: {
                x: pitch,
                y: yaw,
                z: 0,
            },
            elbow: {
                x: bend,
                y: 0,
                z: 0,
            },
        };
    };

    return {
        Left: solveArm(L.shoulder, L.elbow, L.wrist, "Left"),
        Right: solveArm(R.shoulder, R.elbow, R.wrist, "Right"),
    };
}
