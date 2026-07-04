declare module "jpeg-js" {
  export interface RawImageData {
    width: number;
    height: number;
    data: Uint8Array;
  }
  export function decode(
    data: Uint8Array | ArrayBuffer | Buffer,
    opts?: {
      useTArray?: boolean;
      maxMemoryUsageInMB?: number;
      formatAsRGBA?: boolean;
      tolerantDecoding?: boolean;
    },
  ): RawImageData;
  export function encode(
    img: { width: number; height: number; data: Uint8Array },
    quality?: number,
  ): { data: Uint8Array; width: number; height: number };
}
