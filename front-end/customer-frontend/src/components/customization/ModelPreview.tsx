'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Appearance, Mapping, Part, RegionName, regions } from './types';

type Slot = { id: string; mesh: THREE.Mesh; index: number; original: THREE.Material; material: THREE.Material };
type Paint = THREE.Material & { color?: THREE.Color; emissive?: THREE.Color; map?: THREE.Texture | null };
function slotsFor(root: THREE.Object3D): Slot[] {
  const slots: Slot[] = [];
  function walk(node: THREE.Object3D, path: string) {
    if (node instanceof THREE.Mesh) {
      const original = Array.isArray(node.material) ? node.material : [node.material];
      const cloned = original.map(m => m.clone());
      node.material = Array.isArray(node.material) ? cloned : cloned[0];
      original.forEach((m, index) => slots.push({ id: `${path}:${index}`, mesh: node, index, original: m, material: cloned[index] }));
    }
    node.children.forEach((child, i) => walk(child, `${path}.${i}`));
  }
  walk(root, '0');return slots;
}
function release(root: THREE.Object3D, slots: Slot[]) {
  const textures = new Set<THREE.Texture>(), materials = new Set<THREE.Material>();
  slots.forEach(s => { materials.add(s.original); materials.add(s.material); });
  materials.forEach(m => { Object.values(m).forEach(v => { if (v instanceof THREE.Texture) textures.add(v); });m.dispose(); });
  textures.forEach(t => { t.dispose(); if (typeof ImageBitmap !== 'undefined' && t.image instanceof ImageBitmap) t.image.close(); });
  root.traverse(n => { if (n instanceof THREE.Mesh) n.geometry.dispose(); });
}

export default function ModelPreview({ url, mapping, appearance, highlight, solidColor, onParts, onError }: {
  url: string; mapping: Mapping; appearance: Appearance; highlight: RegionName | ''; solidColor: boolean;
  onParts: (parts: Part[]) => void; onError: (message: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const sceneState = useRef<{ slots: Slot[] } | null>(null);
  const [generation, setGeneration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const fit = useRef<() => void>(() => {});
  const callbacks = useRef({ onParts, onError });callbacks.current = { onParts, onError };

  useEffect(() => {
    if (!host.current || !url) return;
    let stopped = false, root: THREE.Object3D | undefined, slots: Slot[] = [];
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); }
    catch { setLoadError('3D preview needs WebGL. Enable browser hardware acceleration and try again.');setLoading(false);return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor('#e9ebed');renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const element = host.current;element.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, 0.01, 1000);
    const controls = new OrbitControls(camera, renderer.domElement);controls.enableDamping = true;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x64748b, 2.5));
    for (const [x, y, z] of [[3, 5, 4], [-3, 2, -3]]) { const light = new THREE.DirectionalLight(0xffffff, 3);light.position.set(x,y,z);scene.add(light); }
    const resize = new ResizeObserver(() => { const { width, height } = element.getBoundingClientRect();
      renderer.setSize(width, height);camera.aspect = width / Math.max(height, 1);camera.updateProjectionMatrix(); });resize.observe(element);
    renderer.setAnimationLoop(() => { controls.update();renderer.render(scene,camera); });
    setLoading(true);setLoadError('');callbacks.current.onParts([]);
    new GLTFLoader().loadAsync(url).then(gltf => {
      root = gltf.scene;slots = slotsFor(root);
      if (stopped) { release(root,slots);return; }
      scene.add(root);root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root), center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
      const radius = Math.max(size.x,size.y,size.z,0.01);
      fit.current = () => {
        const distance = radius / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov/2))) * Math.max(1,1/camera.aspect) * 1.4;
        camera.position.copy(center).add(new THREE.Vector3(0,radius*0.08,distance));
        camera.near = radius/1000;camera.far = radius*100;camera.updateProjectionMatrix();
        controls.target.copy(center);controls.minDistance = radius*0.25;controls.maxDistance = radius*8;controls.update();
      };fit.current();
      sceneState.current = { slots };
      callbacks.current.onParts(slots.map(s => ({ id:s.id,
        label:`${s.mesh.name || 'Unnamed mesh'} / ${s.original.name || `Material ${s.index+1}`} (${s.id})`,
        uv:!!s.mesh.geometry.getAttribute('uv'),editable:!!(s.material as Paint).color && 'map' in s.material })));
      setGeneration(n=>n+1);setLoading(false);
    }).catch(() => { if (!stopped) { setLoading(false);setLoadError('Could not load this model. Check the file, S3 CORS and its viewing URL. Use a self-contained, uncompressed GLB for this preview; separate GLTF buffers and compressed assets need additional setup.'); } });
    return () => { stopped = true;sceneState.current=null;resize.disconnect();renderer.setAnimationLoop(null);controls.dispose();
      if(root && slots.length) release(root,slots);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove(); };
  }, [url]);

  useEffect(() => {
    const slots = sceneState.current?.slots;if (!slots) return;
    let stopped = false;const textures: THREE.Texture[] = [];
    callbacks.current.onError('');
    slots.forEach(s => { s.material.copy(s.original);s.material.needsUpdate=true; });
    async function paint() {
      try {
        for (const name of regions) {
          const region = mapping.regions[name];if (!region?.targets.length) continue;
          const color = name === 'body' ? appearance.bodyColor : name === 'border' ? appearance.borderColor : '';
          const textureUrl = name === 'body' ? '' : appearance[name];
          let texture: THREE.Texture | undefined;
          if (textureUrl) {
            texture = await new THREE.TextureLoader().loadAsync(textureUrl);textures.push(texture);
            if (stopped) { texture.dispose();return; }
            texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=false;
            texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
            texture.repeat.set(region.repeatX,region.repeatY);texture.offset.set(region.offsetX,region.offsetY);
            texture.center.set(0.5,0.5);texture.rotation=THREE.MathUtils.degToRad(region.rotation);
          }
          if(stopped) return;
          for (const slot of slots!.filter(s=>region.targets.includes(s.id))) {
            const material = slot.material as Paint;
            if(texture) { material.map=texture;material.color?.set('#ffffff'); }
            if(color && /^#[\da-f]{6}$/i.test(color)) { material.color?.set(color);if(solidColor && !texture) material.map=null; }
            if(highlight===name) {
              if(material.emissive) material.emissive.set('#704400');
              else material.color?.lerp(new THREE.Color('#ffbb33'),0.5);
            }
            material.needsUpdate=true;
          }
        }
      } catch { if(!stopped) callbacks.current.onError('A texture could not load. Check the asset and S3 CORS, then reload the preview.'); }
    }
    void paint();
    return () => { stopped=true;textures.forEach(t=>t.dispose()); };
  }, [mapping, appearance, highlight, solidColor, generation]);

  return <div className="relative">
    <div ref={host} className="h-[540px] w-full overflow-hidden rounded-xl" aria-label="Interactive 3D model preview" />
    {loading && !loadError && <div className="absolute inset-0 grid place-items-center bg-white/70">Loading model…</div>}
    {loadError && <div role="alert" className="absolute inset-0 flex items-center bg-white/95 p-8 text-sm text-red-700">{loadError}</div>}
    <button type="button" onClick={()=>fit.current()} className="absolute right-3 top-3 rounded-lg bg-white px-3 py-2 text-sm shadow">Reset view</button>
    <p className="mt-2 text-xs text-gray-500">Drag to rotate · Scroll to zoom · Right-drag to pan</p>
  </div>;
}
