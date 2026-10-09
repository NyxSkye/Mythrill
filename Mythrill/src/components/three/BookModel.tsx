import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useBookStore } from "../../store/useBookStore";
import { usePagesStore } from "../../store/usePagesStore";
import { renderPageToCanvas } from "../../lib/pageTexture";

// ---- FLIP TUNING ----
const AXIS: "x" | "y" | "z" = "y";
const SIGN = -1;

// ---- VIEW TUNING ----
const MODEL_SCALE = 1.75;
const MODEL_POSITION: [number, number, number] = [0, 0, 0];
const MODEL_ROTATION: [number, number, number] = [-5, 0, 0];

// ---- TEXTURE TUNING ----
const TEX_ROTATION = 0; // radians: try Math.PI / 2, Math.PI, -Math.PI / 2 if the page art is turned
const WINDOW = 4;       // how many sheets around the open spread get textures

type Sheet = { mesh: THREE.Mesh; front: THREE.Mesh; back: THREE.Mesh };

// Adds a thin plane on one face of the sheet and returns it
function makeFace(mesh: THREE.Mesh, side: 1 | -1): THREE.Mesh {
  const geo = mesh.geometry;
  geo.computeBoundingBox();
  const box = geo.boundingBox!;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const dims = [size.x, size.y, size.z];
  const t = dims.indexOf(Math.min(...dims)); // thickness axis

  const [w, h] = t === 2 ? [size.x, size.y] : t === 1 ? [size.x, size.z] : [size.z, size.y];
  const plane = new THREE.PlaneGeometry(w, h);
  if (side === -1) plane.rotateY(Math.PI);
  if (t === 1) plane.rotateX(-Math.PI / 2);
  if (t === 0) plane.rotateY(Math.PI / 2);

  const eps = Math.max(...dims) * 0.0008;
  const offset = side * (dims[t] / 2 + eps);
  const pos = center.clone();
  if (t === 0) pos.x += offset; else if (t === 1) pos.y += offset; else pos.z += offset;

  const mat = new THREE.MeshStandardMaterial({
    color: "#ffffff", roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -1,
  });
  const face = new THREE.Mesh(plane, mat);
  face.position.copy(pos);
  face.visible = false;
  face.userData = { isFace: true, key: "" };
  mesh.add(face);
  return face;
}

export default function BookModel() {
  const { scene } = useGLTF("/models/book.glb");
  const setTotal = useBookStore((s) => s.setTotal);
  const currentIndex = useBookStore((s) => s.currentIndex);
  const pages = usePagesStore((s) => s.pages);

  const sheetCount = Math.min(Math.ceil(pages.length / 2), 61);

  const parts = useMemo(() => {
    const front: THREE.Mesh[] = [];
    const sheets: THREE.Mesh[] = [];
    const back: THREE.Mesh[] = [];
    scene.traverse((o) => {
      if (!(o as THREE.Mesh).isMesh || o.userData.isFace) return;
      if (/front/i.test(o.name)) front.push(o as THREE.Mesh);
      else if (/^page([._]?\d+)?$/i.test(o.name)) sheets.push(o as THREE.Mesh);
      else if (/back/i.test(o.name)) back.push(o as THREE.Mesh);
    });
    const num = (o: THREE.Object3D) => parseInt(o.name.replace(/\D/g, "") || "0");
    sheets.sort((a, b) => num(a) - num(b));
    [...front, ...sheets, ...back].forEach((o) => (o.userData.baseRot = o.rotation[AXIS]));
    return { front, sheets, back };
  }, [scene]);

  // Build the two face overlays for every sheet (once)
  const faces: Sheet[] = useMemo(
    () =>
      parts.sheets.map((mesh) => {
        mesh.children.filter((c) => c.userData.isFace).forEach((c) => mesh.remove(c));
        return { mesh, front: makeFace(mesh, 1), back: makeFace(mesh, -1) };
      }),
    [parts]
  );

  // Only the sheets the user actually needs take part in flipping
  const flippers = useMemo(
    () => [...parts.front, ...parts.sheets.slice(0, sheetCount), ...parts.back],
    [parts, sheetCount]
  );

  useEffect(() => {
    setTotal(flippers.length);
  }, [flippers, setTotal]);

  // Paint 2D pages onto the 3D faces
  useEffect(() => {
    faces.forEach((sheet, k) => {
      sheet.mesh.visible = k < sheetCount;
      if (k >= sheetCount) return;
      const near = Math.abs(k + 1 - currentIndex) <= WINDOW;

      [sheet.front, sheet.back].forEach((face, f) => {
        const page = pages[2 * k + f];
        const key = near ? (page ? `${page.id}:${page.updatedAt}` : "blank") : "";
        if (face.userData.key === key) return;
        face.userData.key = key;

        const mat = face.material as THREE.MeshStandardMaterial;
        if (!near) {
          mat.map?.dispose();
          mat.map = null;
          mat.needsUpdate = true;
          face.visible = false;
          return;
        }
        renderPageToCanvas(page).then((canvas) => {
          if (face.userData.key !== key) return; // a newer render replaced this one
          mat.map?.dispose();
          const tex = new THREE.CanvasTexture(canvas);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 8;
          tex.center.set(0.5, 0.5);
          tex.rotation = TEX_ROTATION;
          mat.map = tex;
          mat.needsUpdate = true;
          face.visible = true;
        });
      });
    });
  }, [faces, pages, currentIndex, sheetCount]);

  useFrame((_, dt) => {
    const current = useBookStore.getState().currentIndex;
    flippers.forEach((p, i) => {
      const target = p.userData.baseRot + (i < current ? Math.PI * SIGN : 0);
      p.rotation[AXIS] = THREE.MathUtils.damp(p.rotation[AXIS], target, 6, dt);
    });
  });

  return (
    <group scale={MODEL_SCALE} position={MODEL_POSITION} rotation={MODEL_ROTATION}>
      <primitive object={scene} />
    </group>
  );
}