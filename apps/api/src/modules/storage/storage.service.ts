import {
  Injectable,
  Logger,
  OnModuleInit,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as path from 'path';

export interface UploadResult {
  path: string;
  bucket: string;
  originalName: string;
  size: number;
  mimeType: string;
}

export interface FilePayload {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabaseUrl: string;
  private readonly serviceRoleKey: string;
  private readonly bucket: string;

  constructor(private configService: ConfigService) {
    this.supabaseUrl = (
      this.configService.get<string>('SUPABASE_URL') || 'https://aymuesprbohoznguuyym.supabase.co'
    ).replace(/\/$/, '');
    this.serviceRoleKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '';
    this.bucket =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET') || 'siakad-permissions';
  }

  async onModuleInit() {
    if (this.serviceRoleKey) {
      await this.ensureBucketExists().catch((err) => {
        this.logger.warn(`Could not verify/create storage bucket on init: ${err.message}`);
      });
    } else {
      this.logger.warn('SUPABASE_SERVICE_ROLE_KEY is not defined. Storage service running in unconfigured mode.');
    }
  }

  /**
   * Ensures the private Supabase Storage bucket exists.
   */
  async ensureBucketExists(): Promise<void> {
    const checkUrl = `${this.supabaseUrl}/storage/v1/bucket/${encodeURIComponent(this.bucket)}`;
    const checkRes = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        apikey: this.serviceRoleKey,
      },
    });

    if (checkRes.ok) {
      this.logger.log(`Storage bucket '${this.bucket}' verified.`);
      return;
    }

    if (checkRes.status === 404) {
      this.logger.log(`Bucket '${this.bucket}' not found. Creating private bucket...`);
      const createUrl = `${this.supabaseUrl}/storage/v1/bucket`;
      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.serviceRoleKey}`,
          apikey: this.serviceRoleKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: this.bucket,
          name: this.bucket,
          public: false,
          file_size_limit: MAX_FILE_SIZE_BYTES,
          allowed_mime_types: ALLOWED_MIME_TYPES,
        }),
      });

      if (!createRes.ok) {
        const errorText = await createRes.text();
        throw new Error(`Failed to create bucket: ${createRes.status} ${errorText}`);
      }
      this.logger.log(`Storage bucket '${this.bucket}' created successfully.`);
    }
  }

  /**
   * Validates file size and MIME type.
   */
  validateFile(file: FilePayload): void {
    if (!file || !file.buffer) {
      throw new BadRequestException('Berkas tidak ditemukan atau kosong');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('Ukuran berkas melebihi batas maksimal 2 MB');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipe berkas '${file.mimetype}' tidak diizinkan. Hanya menerima application/pdf, image/jpeg, dan image/png.`,
      );
    }
  }

  /**
   * Generates a randomized path for privacy: permissions/<academic_year>/<uuid>.<ext>
   */
  generatePath(academicYear: string, originalName: string): string {
    const rawExt = path.extname(originalName).toLowerCase();
    const ext = rawExt.startsWith('.') ? rawExt.slice(1) : rawExt || 'bin';
    const uuid = crypto.randomUUID();
    const safeYear = academicYear.replace(/[^a-zA-Z0-9_-]/g, '-');
    return `permissions/${safeYear}/${uuid}.${ext}`;
  }

  /**
   * Uploads file buffer to Supabase Storage via REST API.
   */
  async uploadFile(file: FilePayload, academicYear = '2025-2026'): Promise<UploadResult> {
    this.validateFile(file);

    if (!this.serviceRoleKey) {
      throw new InternalServerErrorException('Supabase Storage belum terkonfigurasi dengan service role key.');
    }

    const filePath = this.generatePath(academicYear, file.originalname);
    const uploadUrl = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${filePath}`;

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        apikey: this.serviceRoleKey,
        'Content-Type': file.mimetype,
        'Content-Length': file.size.toString(),
      },
      body: new Uint8Array(file.buffer),
    });

    if (!res.ok) {
      const errText = await res.text();
      this.logger.error(`Supabase Storage upload error: ${res.status} - ${errText}`);
      throw new InternalServerErrorException(`Gagal mengunggah berkas ke Supabase Storage: ${errText}`);
    }

    return {
      path: filePath,
      bucket: this.bucket,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * Generates a time-limited signed URL for private bucket access (default: 15 minutes).
   */
  async getSignedUrl(filePath: string, expiresIn = 900): Promise<string> {
    if (!this.serviceRoleKey) {
      throw new InternalServerErrorException('Supabase Storage belum terkonfigurasi dengan service role key.');
    }

    // Clean up path if full URL or bucket prefix was provided
    let cleanPath = filePath;
    if (cleanPath.startsWith(this.supabaseUrl)) {
      cleanPath = cleanPath.split(`/storage/v1/object/sign/${this.bucket}/`)[1] ||
                  cleanPath.split(`/storage/v1/object/${this.bucket}/`)[1] ||
                  cleanPath;
    }
    if (cleanPath.startsWith(`${this.bucket}/`)) {
      cleanPath = cleanPath.slice(this.bucket.length + 1);
    }

    const signUrl = `${this.supabaseUrl}/storage/v1/object/sign/${this.bucket}/${cleanPath}`;

    const res = await fetch(signUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        apikey: this.serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn }),
    });

    if (!res.ok) {
      const errText = await res.text();
      this.logger.error(`Supabase signed URL error: ${res.status} - ${errText}`);
      throw new InternalServerErrorException(`Gagal men-generate Signed URL: ${errText}`);
    }

    const data = (await res.json()) as { signedURL: string };
    const rawSignedUrl = data.signedURL.startsWith('/')
      ? `${this.supabaseUrl}/storage/v1${data.signedURL}`
      : `${this.supabaseUrl}/storage/v1/${data.signedURL}`;

    return rawSignedUrl;
  }

  /**
   * Deletes a file from Supabase Storage.
   */
  async deleteFile(filePath: string): Promise<void> {
    if (!this.serviceRoleKey) return;

    let cleanPath = filePath;
    if (cleanPath.startsWith(`${this.bucket}/`)) {
      cleanPath = cleanPath.slice(this.bucket.length + 1);
    }

    const deleteUrl = `${this.supabaseUrl}/storage/v1/object/${this.bucket}`;
    await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        apikey: this.serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefixes: [cleanPath] }),
    });
  }
}
