// import chalk from 'chalk';
// import { exec } from 'child_process';
// import { existsSync, mkdirSync, writeFileSync } from 'fs';
// import { createSpinner } from 'nanospinner';
// import { parentPort } from 'node:worker_threads';
// import { convertImage, OptionsType } from './panorama-to-cubemap';
// import { OptionCLI } from './handle';

// parentPort?.on(
//   'render-file',
//   async ({
//     pathOutputFolder,
//     folderName,
//     file,
//     options,
//     option,
//   }: {
//     pathOutputFolder: string;
//     folderName: string;
//     file: Buffer;
//     options: OptionsType;
//     option: OptionCLI;
//   }) => {
//     const spinnerPanorama = createSpinner(`${chalk.yellowBright('PROCESSING PANORAMA TO CUBE MAP:')} ${folderName}`).start();
//     const result = await convertImage(file, options);
//     spinnerPanorama.success({ text: `${chalk.greenBright('PROCESSED SUCCESSFULLY PANORAMA TO CUBE MAP:')} ${folderName}` });

//     if (typeof result === 'string') {
//       return;
//     }

//     for (let i = 0; i < result.length; i++) {
//       const element = result[i];
//       const { buffer, filename } = element as { buffer: Buffer; filename: string };
//       const spinnerCube = createSpinner(`${chalk.yellowBright('STARTING CUT CUBE MAP:')} ${folderName}/${filename}`).start();

//       try {
//         const outputPathCube = `${pathOutputFolder}/${folderName}/cube`;
//         const outputPath = `${pathOutputFolder}/${folderName}/tile`;

//         if (!existsSync(outputPath)) {
//           mkdirSync(outputPath, {
//             recursive: true,
//           });
//         }

//         if (!existsSync(outputPathCube)) {
//           mkdirSync(outputPathCube, {
//             recursive: true,
//           });
//         }

//         const inputImage = `${outputPath}/${filename}`;

//         const bufferCopy = Buffer.from(buffer);

//         writeFileSync(`${outputPathCube}/${filename}`, bufferCopy);
//         writeFileSync(inputImage, bufferCopy);

//         await new Promise((resolve, reject) => {
//           const child = exec(
//             ` cd ${outputPath} && magick.exe ${filename} -crop ${option.size}x${option.size} -quality ${option.quality} -set filename:tile "%[fx:page.x/${option.size}]_%[fx:page.y/${option.size}]" -set filename:orig %t %[filename:orig]_%[filename:tile].jpg`
//           );

//           child.on('error', (err) => {
//             reject(err);
//           });

//           child.on('close', () => {
//             resolve(true);
//           });
//         });

//         spinnerCube.success({ text: `${chalk.greenBright('-------> SUCCESS CUT CUBE MAP:')} ${folderName}/${filename}` });
//       } catch (error) {
//         spinnerCube.success({
//           text: `${chalk.redBright('-------> ERROR CUT CUBE MAP:')} ${folderName}/${filename} | ${chalk.redBright('ERROR MESSAGE:')} ${
//             error.message
//           }`,
//         });
//         break;
//       }
//     }
//   }
// );
