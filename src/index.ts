import { exec } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { convertImage, OptionsType } from './panorama-to-cubemap';

const renderFile = async (file: Buffer, options: OptionsType, folderName: string) => {
  const result = await convertImage(file, options);

  if (typeof result === 'string') {
    console.log(result);
    return;
  }

  result.forEach(({ buffer, filename }: { buffer: Buffer; filename: string }) => {
    const outputPath = `${process.cwd()}/input/${folderName}/tile`;

    if (!existsSync(outputPath)) {
      mkdirSync(outputPath);
    }

    const inputImage = `${outputPath}/${filename}`;

    writeFileSync(inputImage, buffer);

    exec(
      ` cd ${process.cwd()}/input/${folderName}/tile && magick.exe ${filename} -crop 344x344 -quality 70 -set filename:tile "%[fx:page.x/344]_%[fx:page.y/344]" -set filename:orig %t %[filename:orig]_%[filename:tile].jpg`,
      (err, stdout, stderr) => {
        if (err) {
          console.error(err);
          return;
        }

        console.log(stdout);

        console.log('end crop', filename);
      }
    );
  });
};

const renderFileLow = async (fileLow: Buffer, options: OptionsType, folderName: string) => {
  const resultLow = await convertImage(fileLow, options);

  if (typeof resultLow === 'string') {
    console.log(resultLow);
    return;
  }

  resultLow.forEach(({ buffer, filename }: { buffer: Buffer; filename: string }) => {
    const outputPath = `${process.cwd()}/input/${folderName}/tile_low`;

    if (!existsSync(outputPath)) {
      mkdirSync(outputPath);
    }
    const inputImage = `${outputPath}/${filename}`;
    writeFileSync(inputImage, buffer);
  });
};

const readNameFolder = async () => {
  const folderNames = readdirSync('input');

  // folderNames.forEach(async (folderName, index) => {
  for (let i = 0; i < folderNames.length; i++) {
    const folderName = folderNames[i];

    if (i !== 0) continue;

    const file = readFileSync(`input/${folderName}/panorama.jpg`);
    const fileLow = readFileSync(`input/${folderName}/panorama_low.jpg`);

    const options: OptionsType = {
      rotation: 180,
      interpolation: 'lanczos',
      outformat: 'jpg',
      outtype: 'buffer',
      width: Infinity,
    };

    try {
      console.log('start convert panorama:', folderName);

      await renderFile(file, options, folderName);
      await renderFileLow(fileLow, options, folderName);
    } catch (error) {
      console.error(error);
    }
  }
};

const main = async () => {
  readNameFolder();
};

main();
