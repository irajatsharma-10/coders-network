import { staticFile } from 'remotion';
import type { SceneItem } from './types';

export { staticFile };

export const SCENES_DATA: SceneItem[] = [
  {
    startSec: 0,
    endSec: 5,
    src: staticFile('assets/scene_01.jpg'),
    camera: 'punch-in',
  },
  {
    startSec: 5,
    endSec: 10,
    src: staticFile('assets/scene_02.jpg'),
    camera: 'zoom-in',
  },
  {
    startSec: 10,
    endSec: 16,
    src: staticFile('assets/scene_03.jpg'),
    camera: 'punch-in',
  },
  {
    startSec: 16,
    endSec: 23,
    src: staticFile('assets/scene_04.jpg'),
    camera: 'zoom-in',
  },
  {
    startSec: 23,
    endSec: 31,
    src: staticFile('assets/scene_05.jpg'),
    camera: 'punch-in',
  },
  {
    startSec: 31,
    endSec: 39,
    src: staticFile('assets/scene_06.jpg'),
    camera: 'zoom-in',
  },
  {
    startSec: 39,
    endSec: 43,
    src: staticFile('assets/scene_07.jpg'),
    camera: 'static',
  },
];
