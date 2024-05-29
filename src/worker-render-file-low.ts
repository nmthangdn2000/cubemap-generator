// import { parentPort } from 'node:worker_threads';
// import { convertImage, OptionsType } from './panorama-to-cubemap';
// import { createSpinner } from 'nanospinner';
// import { existsSync, mkdirSync, writeFileSync } from 'fs';
// import chalk from 'chalk';

// parentPort?.on(
//   'render-file-low',
//   async ({
//     pathOutputFolder,
//     folderName,
//     file,
//     options,
//   }: {
//     pathOutputFolder: string;
//     folderName: string;
//     file: Buffer;
//     options: OptionsType;
//   }) => {
//     const spinnerPanorama = createSpinner(`${chalk.yellowBright('PROCESSING PANORAMA LOW TO CUBE MAP:')} ${folderName}`).start();
//     const resultLow = await convertImage(file, options);

//     if (typeof resultLow === 'string') {
//       return;
//     }

//     resultLow.forEach(({ buffer, filename }: { buffer: Buffer; filename: string }) => {
//       const outputPath = `${pathOutputFolder}/${folderName}/tile_low`;

//       if (!existsSync(outputPath)) {
//         mkdirSync(outputPath, {
//           recursive: true,
//         });
//       }

//       const inputImage = `${outputPath}/${filename}`;
//       writeFileSync(inputImage, buffer);
//     });

//     spinnerPanorama.success({ text: `${chalk.greenBright('PROCESSED SUCCESSFULLY PANORAMA LOW TO CUBE MAP:')} ${folderName}` });
//   }
// );
