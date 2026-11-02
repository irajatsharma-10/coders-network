// src/types.ts

export type CameraMovement =
  | 'zoom-in'
  | 'zoom-out'
  | 'punch-in'
  | 'pan-right'
  | 'pan-left'
  | 'static';

export type SceneItem = {
  startSec: number;
  endSec: number;
  src: string;
  camera?: CameraMovement;
  id?: string;
};

export type ReelProps = {
  scenes: SceneItem[];
  voiceoverUrl?: string;
  bgmUrl?: string;
  voiceoverVolume?: number;
  bgmVolume?: number;
};
