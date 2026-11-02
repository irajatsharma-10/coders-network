// src/ReelEngine.tsx
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  Video,
  interpolate,
  staticFile,
  useCurrentFrame,
  useRemotionEnvironment,
  useVideoConfig,
} from 'remotion';

import type { SceneItem, ReelProps } from './types';

// Transition wipe between scenes (6 frames = 0.2s at 30fps)
const TRANSITION_FRAMES = 6;

// Width and height of the rendered hand overlay (original aspect ratio is 841 x 870)
const HAND_WIDTH = 580;
const HAND_HEIGHT = 600;

// Marker tip coordinates in rendered pixels relative to hand top-left
const TIP_OFFSET_X = 2; // (2 / 841) * 580
const TIP_OFFSET_Y = 242; // (351 / 870) * 600

export const WhiteboardHand: React.FC<{
  tipX: number;
  tipY: number;
  rotation?: number;
  opacity?: number;
  scale?: number;
  isContact?: boolean;
}> = ({ tipX, tipY, rotation = 0, opacity = 1, scale = 1, isContact = true }) => {
  const handLeft = tipX - TIP_OFFSET_X;
  const handTop = tipY - TIP_OFFSET_Y;

  return (
    <>
      {/* Contact ink shadow directly under the marker tip */}
      {isContact && opacity > 0.3 && (
        <div
          style={{
            position: 'absolute',
            left: tipX - 10,
            top: tipY - 4,
            width: 20,
            height: 12,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 0, 0, 0.45) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 49,
            opacity,
          }}
        />
      )}

      {/* Realistic Hand with Expo Dry-Erase Marker */}
      <div
        style={{
          position: 'absolute',
          left: handLeft,
          top: handTop,
          width: HAND_WIDTH,
          height: HAND_HEIGHT,
          pointerEvents: 'none',
          zIndex: 50,
          opacity,
          transformOrigin: `${TIP_OFFSET_X}px ${TIP_OFFSET_Y}px`,
          transform: `rotate(${rotation}deg) scale(${scale})`,
          filter: 'drop-shadow(14px 24px 22px rgba(0, 0, 0, 0.26))',
        }}
      >
        <Img
          src={staticFile('whiteboard_hand.png')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
    </>
  );
};

export const ReelScene: React.FC<{
  scene: SceneItem;
  durationInFrames: number;
  isFirst: boolean;
  isLast: boolean;
}> = ({ scene, durationInFrames, isFirst, isLast }) => {
  const frame = useCurrentFrame();
  const { isRendering } = useRemotionEnvironment();

  // Whiteboard drawing phase (takes ~1.3s = 38-44 frames)
  const drawDuration = Math.min(42, Math.max(28, Math.round(durationInFrames * 0.28)));
  const exitDuration = 12; // Hand glide-out duration

  const isDrawing = frame < drawDuration;
  const isExiting = frame >= drawDuration && frame < drawDuration + exitDuration;
  const isHandVisible = isDrawing || isExiting;

  // Progressive drawing progress (0 -> 1)
  const drawProgress = interpolate(frame, [0, drawDuration], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  // Calculate Marker Tip Position across the diagram from top to bottom
  const baseY = interpolate(drawProgress, [0, 1], [230, 1680]);
  const scribbleX =
    540 +
    Math.sin(frame * 0.42) * 260 +
    Math.sin(frame * 2.8) * 40 +
    Math.cos(frame * 6.5) * 16;
  const scribbleY =
    baseY +
    Math.cos(frame * 3.1) * 24 +
    Math.sin(frame * 7.1) * 12;
  const tilt = Math.sin(frame * 0.42) * 3 + Math.cos(frame * 1.8) * 1.5;

  // Hand Exit Motion (glides smoothly off to the bottom right)
  let handX = scribbleX;
  let handY = scribbleY;
  let handRotation = tilt;
  let handOpacity = 1;
  let handScale = 1;

  if (isExiting) {
    const exitProgress = interpolate(
      frame,
      [drawDuration, drawDuration + exitDuration],
      [0, 1],
      {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }
    );
    handX = scribbleX + exitProgress * 650;
    handY = scribbleY + exitProgress * 850;
    handRotation = tilt + exitProgress * 12;
    handOpacity = interpolate(exitProgress, [0, 0.8, 1], [1, 0.9, 0]);
    handScale = interpolate(exitProgress, [0, 0.3, 1], [1.0, 1.05, 1.02]);
  }

  // Smooth clean scene entry and exit
  const fadeIn = isFirst
    ? 1
    : interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
      });

  const fadeOut = isLast
    ? interpolate(frame, [durationInFrames - TRANSITION_FRAMES, durationInFrames], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.in(Easing.cubic),
      })
    : 1;

  const sceneOpacity = fadeIn * fadeOut;

  // Cinematic camera motion (kicks in after drawing completes)
  const camera = scene.camera || 'static';
  let scale = 1.0;
  let translateX = 0;
  const translateY = 0;

  const cameraStartFrame = drawDuration;
  const cameraDuration = Math.max(1, durationInFrames - cameraStartFrame);

  if (frame >= cameraStartFrame) {
    const cameraFrame = frame - cameraStartFrame;
    if (camera === 'zoom-in') {
      scale = interpolate(cameraFrame, [0, cameraDuration], [1.0, 1.05], {
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.quad),
      });
    } else if (camera === 'zoom-out') {
      scale = interpolate(cameraFrame, [0, cameraDuration], [1.05, 1.0], {
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.quad),
      });
    } else if (camera === 'punch-in') {
      scale = interpolate(cameraFrame, [0, 6, cameraDuration], [1.0, 1.06, 1.03], {
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.quad),
      });
    } else if (camera === 'pan-right') {
      scale = 1.03;
      translateX = interpolate(cameraFrame, [0, cameraDuration], [-14, 14], {
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.quad),
      });
    } else if (camera === 'pan-left') {
      scale = 1.03;
      translateX = interpolate(cameraFrame, [0, cameraDuration], [14, -14], {
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.quad),
      });
    }
  }

  // Whiteboard drawing reveal mask (reveals drawing under the marker tip)
  const revealPercent = Math.min(100, drawProgress * 100);
  const maskStyle: React.CSSProperties = isDrawing
    ? {
        WebkitMaskImage: `linear-gradient(178deg, #000 0%, #000 ${Math.max(
          0,
          revealPercent - 3
        )}%, rgba(0, 0, 0, 0.4) ${revealPercent}%, transparent ${Math.min(
          100,
          revealPercent + 5
        )}%)`,
        maskImage: `linear-gradient(178deg, #000 0%, #000 ${Math.max(
          0,
          revealPercent - 3
        )}%, rgba(0, 0, 0, 0.4) ${revealPercent}%, transparent ${Math.min(
          100,
          revealPercent + 5
        )}%)`,
      }
    : {};

  const isVideo = scene.src && (scene.src.endsWith('.mp4') || scene.src.endsWith('.webm'));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        opacity: sceneOpacity,
      }}
    >
      {/* Sound Effects: Subtle Marker Scribble SFX during drawing */}
      {isDrawing && frame === 1 && (
        <Audio src={staticFile('marker_draw.wav')} volume={0.06} />
      )}
      {/* Sound Effects: Subtle whoosh transition on scene entry */}
      {!isFirst && frame === 0 && (
        <Audio src={staticFile('whoosh.wav')} volume={0.08} />
      )}

      {/* WHITEBOARD SURFACE WITH CINEMATIC CAMERA */}
      {scene.src ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
            ...maskStyle,
          }}
        >
          {isVideo ? (
            isRendering ? (
              <OffthreadVideo
                src={scene.src}
                muted
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <Video
                src={scene.src}
                loop
                muted
                // eslint-disable-next-line @remotion/no-object-fit-on-media-video
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            )
          ) : (
            <Img
              src={scene.src}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          )}
        </div>
      ) : (
        <AbsoluteFill style={{ backgroundColor: '#FFFFFF' }} />
      )}

      {/* DRAWING HAND WITH EXPO DRY-ERASE MARKER */}
      {isHandVisible && (
        <WhiteboardHand
          tipX={handX}
          tipY={handY}
          rotation={handRotation}
          opacity={handOpacity}
          scale={handScale}
          isContact={isDrawing}
        />
      )}
    </AbsoluteFill>
  );
};

export const ReelComposition: React.FC<ReelProps> = ({
  scenes,
  voiceoverUrl,
  bgmUrl,
  voiceoverVolume = 1.0,
  bgmVolume = 0.08,
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#FFFFFF',
        // Physical whiteboard subtle dot-grid + studio lighting vignette
        backgroundImage: `
          radial-gradient(circle at 50% 20%, #FFFFFF 60%, #F5F7FA 100%),
          radial-gradient(circle, rgba(0, 0, 0, 0.035) 1.5px, transparent 1.5px)
        `,
        backgroundSize: '100% 100%, 38px 38px',
        overflow: 'hidden',
        // Subtle aluminum whiteboard frame bevel
        boxShadow: 'inset 0 0 0 10px #E5E9F0, inset 0 0 30px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Voiceover Track */}
      {voiceoverUrl ? <Audio src={voiceoverUrl} volume={voiceoverVolume} /> : null}

      {/* Optional Background Music Track */}
      {bgmUrl ? <Audio src={bgmUrl} volume={bgmVolume} loop /> : null}

      {/* Stacked Visual Whiteboard Scenes Sequenced by Timestamp */}
      {scenes.map((scene, index) => {
        const from = Math.round(scene.startSec * fps);
        const isFirst = index === 0;
        const isLast = index === scenes.length - 1;
        const overlap = isLast ? 0 : TRANSITION_FRAMES;
        const sceneDurationInFrames = Math.max(
          1,
          Math.round((scene.endSec - scene.startSec) * fps) + overlap
        );
        const sceneId = scene.id || `scene_${index + 1}`;

        return (
          <Sequence
            key={sceneId}
            from={from}
            durationInFrames={sceneDurationInFrames}
            name={sceneId}
            layout="absolute-fill"
          >
            <ReelScene
              scene={scene}
              durationInFrames={sceneDurationInFrames}
              isFirst={isFirst}
              isLast={isLast}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
