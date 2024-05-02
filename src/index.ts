#!/usr/bin/env node

import { Command } from 'commander';
import handle from './handle';

export const program = new Command();

program.name('cube-map-panorama').description('Command-line interface for cube map panorama manipulation in JavaScript').version('0.0.2');

program
  .description('CLi generates schema, controller, and service files according to the name you enter')
  .option('-i, --input <input>', 'Specify the path to the input panorama image folder. Example: --input /path/to/input/folder')
  .option(
    '-iq, --input-quality <inputQuality>',
    'Specify the path to the low quality input panorama image quality folder. Example: --input-low /path/to/input_quality/folder'
  )
  .option(
    '-il, --input-low <inputLow>',
    'Specify the path to the low quality input panorama image folder. Example: --input-low /path/to/input_low/folder'
  )
  .option('-o, --output <output>', 'Specify the path to the output panorama image folder. Example: --output /path/to/output/folder')
  .option(
    '-s, --size <size>',
    'Specify the size (width and height) of each face of the cube map. Must be divisible by 2, 4, 8, or 16. Example: --size 375 (e.g., if each cube map face is 1500, then the size when divided by 4 is 375)'
  )
  .option(
    '-q, --quality <quality>',
    'Specify the quality of the image as a number from 0 to 100. Higher values indicate better quality. Default is 90. Example: --quality 80'
  )
  .option(
    '-p, --panorama <panoramaName>',
    'Specify the name of the panorama file. Example: --panorama panorama.jpg. If the panorama image name is in the format [name].[type], the low quality image name will be "[name]_low.[type]". The low quality image name must follow this format.',
    'panorama.jpg'
  )
  .action((option: any, ...args: any[]) => handle.main(option));

program.parse();
