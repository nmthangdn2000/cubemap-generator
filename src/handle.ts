import { exec } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { convertImage, OptionsType } from './panorama-to-cubemap';
import { program } from 'commander';
import * as chalk from 'chalk';
import { createSpinner } from 'nanospinner';
import * as figlet from 'figlet';
import * as gradient from 'gradient-string';

export type OptionCLI = {
  size: number;
  quality?: number;
  panorama?: string;
  input?: string;
  inputQuality?: string;
  inputLow?: string;
  output: string;
  inputGenerate?: string;
  generate?: boolean;
};

function ValidateParams() {
  return function (target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    // Define a wrapper function
    descriptor.value = function (...args: any[]): void {
      try {
        // Extract  and option from the arguments
        let [option] = args;
        console.log('option', option);

        // Add your validation logic here
        if (!option || !option.size) {
          throw new Error('Invalid parameters');
        }

        if (!option.input && (!option.inputQuality || !option.inputLow) && !option.inputGenerate) {
          throw new Error('One of the input or inputQuality and inputLow parameters must be provided');
        }

        if (!option.output) {
          throw new Error('The output parameter must be provided');
        }

        if (option.input && option.input[option.input.length - 1] === '/') {
          option.input = option.input.substring(0, option.input.length - 1);
        }

        if (option.output && option.output[option.output.length - 1] === '/') {
          option.output = option.output.substring(0, option.output.length - 1);
        }

        if (option.inputGenerate && option.inputGenerate[option.inputGenerate.length - 1] === '/') {
          option.inputGenerate = option.inputGenerate.substring(0, option.inputGenerate.length - 1);
        }

        // Parse size to ensure it's a valid number
        option.size = parseInt(option.size);
        if (isNaN(option.size)) {
          throw new Error('Invalid size parameter');
        }

        // Optionally, you can parse quality to ensure it's a valid number if it exists
        if (option.quality) {
          option.quality = parseInt(option.quality);
          if (isNaN(option.quality)) {
            throw new Error('Invalid quality parameter');
          }
        }

        if (option.panorama && option.panorama.split('.').length < 2) {
          throw new Error('Invalid panorama parameter');
        }
        // Call the original method
        return originalMethod.apply(this, [option, ...args.slice(3)]);
      } catch (error) {
        program.error(error.message);
      }
    };

    // No need to return anything explicitly
  };
}

class Handle {
  constructor() {}

  @ValidateParams()
  async main(option: OptionCLI) {
    try {
      console.clear();
      console.log('\n');

      if (option.inputGenerate && !option.generate) {
        this.generateDataPanoramas(option.inputGenerate, option.output);

        console.log('\n');
        console.log(gradient.pastel.multiline('Thank you for using the cut panorama tool!'));
        return;
      }

      if (option.input || (option.inputQuality && option.inputLow)) {
        const inputPanoramas = option.input
          ? this.readNameFolder(option.input, option.panorama)
          : this.readFileName(option.inputQuality, option.inputLow);
        const options: OptionsType = {
          rotation: 180,
          interpolation: 'lanczos',
          outformat: 'jpg',
          outtype: 'buffer',
          width: Infinity,
        };

        const text = figlet.textSync('CUBEMAP GENERATOR');
        console.log(gradient.pastel.multiline(text));
        console.log('\n');
        // console.log('Donate for me:');
        // console.log(`Bank account: ${chalk.blueBright('9327124224')}`);
        // console.log(`Account holder: ${chalk.blueBright('NGUYEN MINH THANG')}`);
        // console.log(`Bank branch: ${chalk.blueBright('VCB - Vietcombank')}`);
        // console.log('\n');

        for (let i = 0; i < inputPanoramas.length; i++) {
          const element = inputPanoramas[i];
          await this.renderFile(option.output, element.folderName, element.file, options, { quality: 90, ...option });
          await this.renderFileLow(option.output, element.folderName, element.fileLow, options);
        }
      }

      if (option.inputGenerate) {
        this.generateDataPanoramas(option.inputGenerate, option.output);
      }
    } catch (error) {
      console.error(`${chalk.redBright('ERROR:')} ${error.message}`);
    }

    console.log('\n');
    console.log(gradient.pastel.multiline('Thank you for using the cut panorama tool!'));
  }

  private async renderFile(pathOutputFolder: string, folderName: string, file: Buffer, options: OptionsType, option: OptionCLI) {
    const spinnerPanorama = createSpinner(`${chalk.yellowBright('PROCESSING PANORAMA TO CUBE MAP:')} ${folderName}`).start();
    const result = await convertImage(file, options);
    spinnerPanorama.success({ text: `${chalk.greenBright('PROCESSED SUCCESSFULLY PANORAMA TO CUBE MAP:')} ${folderName}` });

    if (typeof result === 'string') {
      return;
    }

    for (let i = 0; i < result.length; i++) {
      const element = result[i];
      const { buffer, filename } = element as { buffer: Buffer; filename: string };
      const spinnerCube = createSpinner(`${chalk.yellowBright('STARTING CUT CUBE MAP:')} ${folderName}/${filename}`).start();

      try {
        const outputPathCube = `${pathOutputFolder}/${folderName}/cube`;
        const outputPath = `${pathOutputFolder}/${folderName}/tile`;

        if (!existsSync(outputPath)) {
          mkdirSync(outputPath, {
            recursive: true,
          });
        }

        if (!existsSync(outputPathCube)) {
          mkdirSync(outputPathCube, {
            recursive: true,
          });
        }

        const inputImage = `${outputPath}/${filename}`;

        const bufferCopy = Buffer.from(buffer);

        writeFileSync(`${outputPathCube}/${filename}`, bufferCopy);
        writeFileSync(inputImage, bufferCopy);

        await new Promise((resolve, reject) => {
          const child = exec(
            ` cd ${outputPath} && magick.exe ${filename} -crop ${option.size}x${option.size} -quality ${option.quality} -set filename:tile "%[fx:page.x/${option.size}]_%[fx:page.y/${option.size}]" -set filename:orig %t %[filename:orig]_%[filename:tile].jpg`
          );

          child.on('error', (err) => {
            reject(err);
          });

          child.on('close', () => {
            resolve(true);
          });
        });

        spinnerCube.success({ text: `${chalk.greenBright('-------> SUCCESS CUT CUBE MAP:')} ${folderName}/${filename}` });
      } catch (error) {
        spinnerCube.success({
          text: `${chalk.redBright('-------> ERROR CUT CUBE MAP:')} ${folderName}/${filename} | ${chalk.redBright('ERROR MESSAGE:')} ${
            error.message
          }`,
        });
        break;
      }
    }
  }

  private async renderFileLow(pathOutputFolder: string, folderName: string, file: Buffer, options: OptionsType) {
    const spinnerPanorama = createSpinner(`${chalk.yellowBright('PROCESSING PANORAMA LOW TO CUBE MAP:')} ${folderName}`).start();
    const resultLow = await convertImage(file, options);

    if (typeof resultLow === 'string') {
      return;
    }

    resultLow.forEach(({ buffer, filename }: { buffer: Buffer; filename: string }) => {
      const outputPath = `${pathOutputFolder}/${folderName}/tile_low`;

      if (!existsSync(outputPath)) {
        mkdirSync(outputPath, {
          recursive: true,
        });
      }

      const inputImage = `${outputPath}/${filename}`;
      writeFileSync(inputImage, buffer);
    });

    spinnerPanorama.success({ text: `${chalk.greenBright('PROCESSED SUCCESSFULLY PANORAMA LOW TO CUBE MAP:')} ${folderName}` });
  }

  private readNameFolder(pathInputFolder: string, panorama: string) {
    const folderNames = readdirSync(pathInputFolder);
    const panoramaSplit = panorama.split('.');
    const typeFile = panoramaSplit.pop();
    const filename = panoramaSplit;

    return folderNames.map((folderName) => {
      return {
        file: readFileSync(`${pathInputFolder}/${folderName}/${panorama}`),
        fileLow: readFileSync(`${pathInputFolder}/${folderName}/${filename}_low.${typeFile}`),
        folderName,
      };
    });
  }

  private generateDataPanoramas(pathInputFolder: string, pathOutputFolder: string) {
    const folderNames = readdirSync(pathInputFolder).filter((f) => {
      const stats = statSync(`${pathInputFolder}/${f}`);
      return !stats.isFile();
    });

    const data = folderNames.map((fileName, index) => ({
      id: index,
      title: fileName.split('.')[0],
      cameraPosition: { yaw: 6.230238484163068, pitch: 0.010195190955851308 },
      subtitle: fileName.split('.')[0],
      description: `This is the ${fileName.split('.')[0]} panorama`,
      image: `${fileName}.jpg`,
      thumbnail: `${fileName}.jpg`,
      markers: [],
    }));

    return writeFileSync(`${pathOutputFolder}/data.json`, JSON.stringify(data, null, 2));
  }

  readFileName(inputQuality: string, inputLow: string) {
    const folderQualityNames = readdirSync(inputQuality).filter((f) => {
      const stats = statSync(`${inputQuality}/${f}`);
      return stats.isFile();
    });
    const folderLowNames = readdirSync(inputLow).filter((f) => {
      const stats = statSync(`${inputLow}/${f}`);
      return stats.isFile();
    });

    return folderQualityNames.map((folderName) => {
      const file = readFileSync(`${inputQuality}/${folderName}`);
      const fileLow = readFileSync(`${inputLow}/${folderLowNames.find((ln) => new RegExp(folderName.split('.')[0]).test(ln))}`);

      return { folderName: folderName.split('.')[0], file, fileLow };
    });
  }
}

export default new Handle();
