/**
 * Type declaration untuk multer v2 (belum punya built-in types).
 */
declare module 'multer' {
  import { Request, RequestHandler } from 'express';

  /** Object file hasil upload */
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      destination: string;
      filename: string;
      path: string;
      size: number;
    }
  }

  interface MulterRequest extends Request {
    file?: Multer.File;
    files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
  }

  interface DiskStorageOptions {
    destination?: string | ((req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => void);
    filename?: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => void;
  }

  interface FileFilterCallback {
    (error: Error | null, acceptFile: boolean): void;
  }

  interface MulterOptions {
    dest?: string;
    storage?: DiskStorage;
    limits?: {
      fieldNameSize?: number;
      fieldSize?: number;
      fields?: number;
      fileSize?: number;
      files?: number;
      parts?: number;
      headerPairs?: number;
    };
    fileFilter?: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => void;
  }

  interface DiskStorage {
    _handleFile: any;
    _removeFile: any;
  }

  interface MulterInstance {
    single(fieldname: string): RequestHandler;
    array(fieldname: string, maxCount?: number): RequestHandler;
    fields(fields: Array<{ name: string; maxCount?: number }>): RequestHandler;
    none(): RequestHandler;
    any(): RequestHandler;
  }

  function multer(options?: MulterOptions): MulterInstance;

  namespace multer {
    function diskStorage(options: DiskStorageOptions): DiskStorage;
  }

  export = multer;
}

// Extend Express Request agar mengenali req.file
declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      destination: string;
      filename: string;
      path: string;
      size: number;
    }
  }

  interface Request {
    file?: Multer.File;
    files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
  }
}
