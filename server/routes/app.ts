import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { requireAuth, requireRole } from '../utils/authMiddleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Folder penyimpanan APK
const APK_DIR = path.join(__dirname, '..', 'apk');
const MANIFEST_PATH = path.join(APK_DIR, 'version.json');

// Pastikan folder APK ada
if (!fs.existsSync(APK_DIR)) {
  fs.mkdirSync(APK_DIR, { recursive: true });
}

// Manifest default kalau belum ada
if (!fs.existsSync(MANIFEST_PATH)) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify({
    latest_version: '0.0.0',
    version_code: 1,
    file_name: '',
    release_date: '',
    changelog: '',
    file_size: 0,
    min_os: 'Android 7.0+',
    download_url: '',
  }, null, 2));
}

// Konfigurasi multer untuk upload APK
const storage = multer.diskStorage({
  destination: APK_DIR,
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Format: restoflow-kasir-v{version}.apk
    const ext = path.extname(file.originalname);
    cb(null, `restoflow-kasir${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    if (file.mimetype === 'application/vnd.android.package-archive' ||
        file.mimetype === 'application/octet-stream' ||
        file.originalname.endsWith('.apk')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file .apk yang diizinkan'), false);
    }
  },
  limits: { fileSize: 200 * 1024 * 1024 }, // max 200MB
});

/**
 * GET /api/app/version
 * PUBLIC — cek versi terbaru APK (untuk auto-update Flutter).
 */
router.get('/version', (_req: Request, res: Response) => {
  try {
    if (!fs.existsSync(MANIFEST_PATH)) {
      return res.json({ latest_version: '0.0.0', version_code: 0, file_name: '' });
    }
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    // Hilangkan download_url absolut, Flutter akan construct sendiri
    const { download_url, ...safe } = manifest;
    res.json(safe);
  } catch (err) {
    console.error('Gagal baca manifest:', err);
    res.status(500).json({ error: 'Gagal membaca info versi' });
  }
});

/**
 * GET /api/app/download
 * AUTH (Pemilik) — download file APK terbaru.
 */
router.get('/download', requireAuth, requireRole('Pemilik'), (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(MANIFEST_PATH)) {
      return res.status(404).json({ error: 'Belum ada APK tersedia' });
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    const fileName = manifest.file_name;

    if (!fileName) {
      return res.status(404).json({ error: 'Belum ada APK yang diupload' });
    }

    const filePath = path.join(APK_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File APK tidak ditemukan di server' });
    }

    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="RestoFlow-Kasir-v${manifest.latest_version}.apk"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);
    res.setHeader('X-App-Version', manifest.latest_version);
    res.setHeader('X-Version-Code', manifest.version_code.toString());

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Gagal mengirim file' });
      }
    });
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Gagal memproses download' });
  }
});

/**
 * POST /api/app/upload
 * AUTH (Pemilik) — upload APK versi baru + update manifest.
 */
router.post('/upload', requireAuth, requireRole('Pemilik'), upload.single('apk'), (req: Request, res: Response) => {
  try {
    const { version, changelog } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'File APK wajib diupload' });
    }

    if (!version) {
      return res.status(400).json({ error: 'Versi wajib diisi (contoh: 1.0.1)' });
    }

    // Baca manifest lama
    const oldManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    const newVersionCode = (oldManifest.version_code || 0) + 1;

    const newManifest = {
      latest_version: version,
      version_code: newVersionCode,
      file_name: req.file.filename,
      release_date: new Date().toISOString(),
      changelog: changelog || '',
      file_size: req.file.size,
      min_os: 'Android 7.0+',
      download_url: '', // tidak perlu absolut
    };

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(newManifest, null, 2));

    console.log(`✅ APK v${version} (build ${newVersionCode}) diupload — ${(req.file.size / 1024 / 1024).toFixed(2)}MB`);

    res.json({
      success: true,
      message: `APK versi ${version} berhasil diupload`,
      version,
      version_code: newVersionCode,
      file_size: req.file.size,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Gagal mengupload APK' });
  }
});

export default router;
