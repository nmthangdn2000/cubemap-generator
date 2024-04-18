import { exec } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { convertImage, OptionsType } from './panorama-to-cubemap';
import { program } from 'commander';
import * as chalk from 'chalk';
import { createSpinner } from 'nanospinner';
import * as figlet from 'figlet';
import * as gradient from 'gradient-string';

type OptionCLI = {
  size: number;
  quality?: number;
  panorama?: string;
};

function ValidateParams() {
  return function (target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    // Define a wrapper function
    descriptor.value = function (...args: any[]): void {
      try {
        // Extract input, output, and option from the arguments
        let [input, output, option] = args;

        // Add your validation logic here
        if (!input || !output || !option || !option.size) {
          throw new Error('Invalid parameters');
        }

        if (input[input.length - 1] === '/') {
          input = input.substring(0, input.length - 1);
        }

        if (output[output.length - 1] === '/') {
          output = output.substring(0, output.length - 1);
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
        return originalMethod.apply(this, [input, output, option, ...args.slice(3)]);
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
  async main(input: string, output: string, option: OptionCLI) {
    try {
      console.clear();
      console.log('\n');

      const inputPanoramas = this.readNameFolder(input, option.panorama);
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
        await this.renderFile(output, element.folderName, element.file, options, { quality: 90, ...option });
        await this.renderFileLow(output, element.folderName, element.fileLow, options);
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
        const outputPath = `${pathOutputFolder}/${folderName}/tile`;

        if (!existsSync(outputPath)) {
          mkdirSync(outputPath, {
            recursive: true,
          });
        }

        const inputImage = `${outputPath}/${filename}`;

        writeFileSync(inputImage, buffer);

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
}

export default new Handle();