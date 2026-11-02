// src/Root.tsx
import React from 'react';
import { Composition, staticFile } from 'remotion';
import { ReelComposition } from './ReelEngine';
import { SCENES_DATA } from './sceneData';

export const RemotionRoot: React.FC = () => {
  const fps = 30;
  const width = 1080;
  const height = 1920;

  // Auto-calculated duration from the last scene timestamp
  const totalDurationSec =
    SCENES_DATA.length > 0
      ? SCENES_DATA[SCENES_DATA.length - 1].endSec
      : 30;
  const durationInFrames = Math.max(1, Math.round(totalDurationSec * fps));

  const voiceoverUrl = staticFile('audio.wav');
  const bgmUrl = ''; // Optional: staticFile('bgm.mp3')

  return (
    <Composition
      id="FacebookReel"
      component={ReelComposition}
      durationInFrames={durationInFrames}
      fps={fps}
      width={width}
      height={height}
      defaultProps={{
        scenes: SCENES_DATA,
        voiceoverUrl,
        bgmUrl,
        voiceoverVolume: 1.0,
        bgmVolume: 0.08,
      }}
    />
  );
};
