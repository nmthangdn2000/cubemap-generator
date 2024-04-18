# Cube Map Generator CLI

## Overview

This CLI tool generates cube map images from a panorama image folder. It provides functionalities to specify the size of each face of the cube map and the quality of the generated images.

## Installation

1. **Download the Executable**

   - Go to the [Releases](https://github.com/nmthangdn2000/cubemap-generator/releases) page of this repository.
   - Download the latest version of the executable file for your operating system (Windows, macOS, or Linux).

2. **Install ImageMagick**

   - This tool `requires` [ImageMagick](https://imagemagick.org/) to be installed on your system. On Windows, it's advisable to add ImageMagick to the `PATH` for ease of use.

3. **Run the Executable**

   - You can run it from the command line by navigating to the directory where the executable is located and executing the file.

## Folder Structure

The input panorama folder should have the following structure:

```bash
input
├── folder_1
│ ├── panorama.jpg
│ └── panorama_low.jpg
├── folder_2
│ ├── panorama.jpg
│ └── panorama_low.jpg
└── ...
```

The output panorama folder has the following structure:

```bash
output
├── folder_1
│   ├── tile
│   │   └── ...
│   └── tile_low
│       └── ...
├── folder_2
│   ├── tile
│   │   └── ...
│   └── tile_low
│       └── ...
└── ...
```

## Usage

The CLI tool accepts the following arguments and options:

```bash
$ cubemap-generator <input_panorama_folder> <output_panorama_folder> [options]
```

- `<input_panorama_folder>`: Specify the path to the input panorama image folder.
- `<output_panorama_folder>`: Specify the path to the output folder where the cube map images will be saved.

Options:

- `-s, --size <size>`: Specify the size (width and height) of each face of the cube map. Must be divisible by 2, 4, 8, or 16. Example: `--size 375` (e.g., if each cube map face is 1500, then the size when divided by 4 is 375).
- `-q, --quality <quality>`: Specify the quality of the image as a number from 0 to 100. Higher values indicate better quality. Default is 90. Example: `--quality 80`.
- `-p, --panorama <panoramaName>`: Specifies the name of the panorama file. If the panorama image name is in the format `[name].[type]`, the low quality image name will be `[name]_low.[type]`. The low quality image name must follow this format. Default value is `panorama.jpg`.

Example:

```bash
$ cubemap-generator input output -p panorama.jpg -s 375 -q 80
```

The command will generate cube map images from the panoramic images located in the `input` folder, using the file `panorama.jpg` as the source panorama. Each face of the cube map will have a size of 1500 pixels, where `375` represents the cropped images from the 1500-pixel faces of the cube. The resulting cube map images will be saved in the `output` folder with a quality setting of 80.
