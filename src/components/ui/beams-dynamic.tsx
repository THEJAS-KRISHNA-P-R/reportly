'use client';

import dynamic from 'next/dynamic';

const BeamsClient = dynamic(
  () => import('./beams').then((m) => m.Beams),
  { ssr: false }
);

interface BeamsDynamicProps {
  beamWidth?: number;
  beamHeight?: number;
  beamNumber?: number;
  lightColor?: string;
  speed?: number;
  noiseIntensity?: number;
  scale?: number;
  rotation?: number;
}

export function BeamsDynamic(props: BeamsDynamicProps) {
  return <BeamsClient {...props} />;
}
