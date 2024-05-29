import { createCanvas, loadImage, Canvas, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import { renderFace } from './convert';
import { InterpolationsType, mimeType, MimeTypesType, OrientationsType } from './utils';

export type OptionsType = {
  rotation: number;
  outformat: MimeTypesType;
  outtype: string;
  width: number;
  data?: ImageData;
  face?: OrientationsType;
  interpolation: InterpolationsType;
  maxWidth?: number;
};

export class PanoramaToCubeMap {
  private canvas: Canvas;

  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = createCanvas(1, 1);
    this.ctx = this.canvas.getContext('2d');
  }

  getDataURL(imgData: ImageData, extension: keyof typeof mimeType) {
    this.canvas.width = imgData.width;
    this.canvas.height = imgData.height;
    this.ctx.putImageData(imgData, 0, 0);
    return new Promise((resolve) => resolve(this.canvas.toBuffer(mimeType[extension] as any, { quality: 0.92 })));
  }

  convertImage = (src: string | Buffer, usrOptions: OptionsType): Promise<(string | { buffer: Buffer; filename: string })[]> => {
    const options = {
      rotation: 180,
      interpolation: 'lanczos',
      outformat: 'jpg',
      outtype: 'file',
      width: Infinity,
      ...usrOptions,
    };
    return new Promise(async (resolve) => {
      try {
        const img = await loadImage(src);
        const { width, height } = img;
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.drawImage(img, 0, 0);
        const data = this.ctx.getImageData(0, 0, width, height) as ImageData;
        options.width = width;
        this.processImage(data, options).then((x) => resolve(x));
      } catch (error) {
        console.log('convertImage', error);
      }
    });
  };

  processFace = (
    data: ImageData,
    options: OptionsType,
    facename: OrientationsType
  ): Promise<string | { buffer: Buffer; filename: string }> => {
    return new Promise((resolve) => {
      const optons = {
        data,
        face: facename,
        rotation: (Math.PI * options.rotation) / 180,
        interpolation: options.interpolation,
        maxWidth: options.width,
      };

      renderFace(optons).then((data: ImageData) => {
        this.getDataURL(data, options.outformat).then((file: Buffer) => {
          if (options.outtype === 'file') {
            fs.writeFile(`${facename}.${options.outformat}`, file, 'binary', (err) => {
              if (err) console.log(err);
              else {
                console.log('The file was saved!');
                resolve(`${facename}.${options.outformat} was saved`);
              }
            });
          } else {
            resolve({
              buffer: file,
              filename: `${facename}.${options.outformat}`,
            });
          }
        });
      });
    });
  };

  processImage(data: ImageData, options: OptionsType): Promise<(string | { buffer: Buffer; filename: string })[]> {
    const faces = ['back', 'front', 'left', 'right', 'top', 'bottom'].map((face: OrientationsType) =>
      this.processFace(data, options, face)
    );

    return new Promise((resolve) => Promise.all(faces).then((x) => resolve(x)));
  }
}
