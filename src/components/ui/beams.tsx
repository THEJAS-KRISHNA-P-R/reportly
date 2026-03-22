'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface BeamsProps {
  beamWidth?: number;
  beamHeight?: number;
  beamNumber?: number;
  lightColor?: string;
  speed?: number;
  noiseIntensity?: number;
  scale?: number;
  rotation?: number;
}

export function Beams({
  beamWidth = 2,
  beamHeight = 18,
  beamNumber = 12,
  lightColor = '#ffffff',
  speed = 1.5,
  noiseIntensity = 1.6,
  scale = 0.16,
  rotation = 20,
}: BeamsProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    // Scene
    const scene    = new THREE.Scene();
    const camera   = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 1000);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const color = new THREE.Color(lightColor);

    // Create beams
    const beams: THREE.Mesh[] = [];
    const clock = new THREE.Clock();

    for (let i = 0; i < beamNumber; i++) {
      const geo = new THREE.PlaneGeometry(beamWidth, beamHeight * h);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.08 + Math.random() * 0.08,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.x = -w / 2 + (i / beamNumber) * w + Math.random() * (w / beamNumber);
      mesh.position.y = 0;
      mesh.rotation.z = THREE.MathUtils.degToRad(rotation + (Math.random() - 0.5) * 10);
      mesh.userData = {
        baseX: mesh.position.x,
        phase: Math.random() * Math.PI * 2,
        freq: 0.3 + Math.random() * 0.4,
        amp: 40 + Math.random() * 60,
      };
      scene.add(mesh);
      beams.push(mesh);
    }

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      beams.forEach((beam) => {
        const { baseX, phase, freq, amp } = beam.userData;
        beam.position.x = baseX + Math.sin(t * freq * speed + phase) * amp * scale;
        const mat = beam.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.04 + Math.abs(Math.sin(t * freq * 0.7 + phase)) * 0.10;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const nw = mount.clientWidth;
      const nh = mount.clientHeight;
      camera.left   = -nw / 2;
      camera.right  =  nw / 2;
      camera.top    =  nh / 2;
      camera.bottom = -nh / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [beamWidth, beamHeight, beamNumber, lightColor, speed, noiseIntensity, scale, rotation]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
