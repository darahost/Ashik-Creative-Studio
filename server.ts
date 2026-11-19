import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { Ytdl } from '@distube/ytdl-core';
import { ZipArchive } from 'archiver';

const ytdl = new Ytdl({
  timeoutMs: 8000,
  cookie: process.env.YOUTUBE_COOKIES || undefined,
});
const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const PIPED_INSTANCES = [
  process.env.PIPED_API_URL,
  'https://api.piped.private.coffee',
].filter((u): u is string => Boolean(u && u.trim()));

const YT_ID_REGEX =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;

function extractYouTubeId(input: string): string | null {
  const match = input.trim().match(YT_ID_REGEX);
  return match ? match[1] : null;
}

function formatDuration(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return '--:--';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'ashik_creative_studio_media'
  );
}

function resolveYtDlpBinary(): string {
  const localBin = path.join(__dirname, 'node_modules', 'yt-dlp-exec', 'bin', 'yt-dlp');
  if (fs.existsSync(localBin)) {
    return localBin;
  }
  return 'yt-dlp';
}

function resolveFfmpegPath(): string {
  const candidates = ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg'];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return 'ffmpeg';
}

function resolveOptionalCookiesFile(tempDir: string): string | null {
  if (process.env.YOUTUBE_COOKIES_FILE && fs.existsSync(process.env.YOUTUBE_COOKIES_FILE)) {
    return process.env.YOUTUBE_COOKIES_FILE;
  }
  if (process.env.YOUTUBE_COOKIES && process.env.YOUTUBE_COOKIES.includes('youtube.com')) {
    const cookiePath = path.join(tempDir, 'cookies.txt');
    fs.writeFileSync(cookiePath, process.env.YOUTUBE_COOKIES, 'utf8');
    return cookiePath;
  }
  return null;
}

function mapConversionError(error: unknown): { status: number; message: string } {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const isBotCheck =
    rawMessage.includes('Sign in to confirm') || rawMessage.includes('not a bot');
  return {
    status: isBotCheck ? 429 : 500,
    message: isBotCheck
      ? 'YouTube temporarily requested bot verification for this video. Try another public link or configure session cookies.'
      : rawMessage.length > 0 && rawMessage.length < 180
      ? rawMessage
      : 'Unable to convert this video. Ensure it is public and not age-restricted.',
  };
}

interface PipedStreamEntry {
  url: string;
  format?: string;
  quality?: string;
  mimeType?: string;
  videoOnly?: boolean;
  bitrate?: number;
  height?: number;
}

interface PipedStreamsResponse {
  title?: string;
  uploader?: string;
  duration?: number;
  thumbnailUrl?: string;
  audioStreams?: PipedStreamEntry[];
  videoStreams?: PipedStreamEntry[];
}

async function fetchPipedStreams(videoId: string): Promise<PipedStreamsResponse | null> {
  for (const baseUrl of PIPED_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/streams/${videoId}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const data = (await res.json()) as PipedStreamsResponse;
      if (
        (Array.isArray(data.videoStreams) && data.videoStreams.length > 0) ||
        (Array.isArray(data.audioStreams) && data.audioStreams.length > 0)
      ) {
        return data;
      }
    } catch {
      // Try next instance
    }
  }
  return null;
}

function pickQualityHeight(qualityLabel?: string): number {
  if (!qualityLabel) return 0;
  const m = qualityLabel.match(/(\d{3,4})p/i);
  return m ? Number(m[1]) : 0;
}

async function convertViaPipedAndFfmpeg(
  videoId: string,
  format: 'mp3' | 'mp4',
  quality: string,
  targetDir: string
): Promise<{ filePath: string; fileName: string }> {
  const piped = await fetchPipedStreams(videoId);
  if (!piped) {
    throw new Error('Could not resolve stream URLs from relay for this video.');
  }

  const ffmpegBin = resolveFfmpegPath();
  const baseName = sanitizeFilename(piped.title || `YouTube_${videoId}`);
  const audioStreams = (piped.audioStreams || []).filter((s) => Boolean(s.url));
  const videoStreams = (piped.videoStreams || []).filter((s) => Boolean(s.url));

  if (format === 'mp3') {
    const bitrate = ['128', '192', '320'].includes(quality) ? quality : '192';
    const bestAudio =
      audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0] ||
      videoStreams.find((v) => !v.videoOnly && v.format !== 'HLS') ||
      videoStreams[0];

    if (!bestAudio?.url) {
      throw new Error('No audio stream available for MP3 extraction.');
    }

    const outName = `${baseName}.mp3`;
    const outPath = path.join(targetDir, outName);

    await execFileAsync(
      ffmpegBin,
      [
        '-y',
        '-i',
        bestAudio.url,
        '-vn',
        '-acodec',
        'libmp3lame',
        '-b:a',
        `${bitrate}k`,
        outPath,
      ],
      { timeout: 180000, maxBuffer: 1024 * 1024 * 10 }
    );

    if (!fs.existsSync(outPath)) {
      throw new Error('FFmpeg failed to generate MP3 file.');
    }
    return { filePath: outPath, fileName: outName };
  }

  // MP4 target
  const targetHeight = ['360', '480', '720', '1080'].includes(quality)
    ? Number(quality)
    : 720;

  const outName = `${baseName}.mp4`;
  const outPath = path.join(targetDir, outName);

  // Check if we have separate videoOnly stream at targetHeight + audioStream to mux
  const videoOnlyCandidates = videoStreams
    .filter((v) => v.videoOnly && pickQualityHeight(v.quality) > 0)
    .sort((a, b) => pickQualityHeight(b.quality) - pickQualityHeight(a.quality));

  const bestVideoOnly =
    videoOnlyCandidates.find((v) => pickQualityHeight(v.quality) <= targetHeight) ||
    videoOnlyCandidates[videoOnlyCandidates.length - 1];

  const bestAudio = audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

  if (bestVideoOnly && bestAudio) {
    await execFileAsync(
      ffmpegBin,
      [
        '-y',
        '-i',
        bestVideoOnly.url,
        '-i',
        bestAudio.url,
        '-c:v',
        'copy',
        '-c:a',
        'aac',
        '-movflags',
        '+faststart',
        outPath,
      ],
      { timeout: 180000, maxBuffer: 1024 * 1024 * 10 }
    );
  } else {
    // Muxed stream (contains both video & audio)
    const muxedCandidates = videoStreams
      .filter((v) => !v.videoOnly && v.format !== 'HLS')
      .sort((a, b) => pickQualityHeight(b.quality) - pickQualityHeight(a.quality));

    const chosenMuxed =
      muxedCandidates.find(
        (v) => pickQualityHeight(v.quality) > 0 && pickQualityHeight(v.quality) <= targetHeight
      ) ||
      muxedCandidates.find((v) => v.url.includes('googlevideo') || v.url.includes('proxy.piped')) ||
      muxedCandidates[0] ||
      videoStreams[0];

    if (!chosenMuxed?.url) {
      throw new Error('No downloadable MP4 video stream available.');
    }

    await execFileAsync(
      ffmpegBin,
      [
        '-y',
        '-i',
        chosenMuxed.url,
        '-c:v',
        'copy',
        '-c:a',
        'aac',
        '-movflags',
        '+faststart',
        outPath,
      ],
      { timeout: 180000, maxBuffer: 1024 * 1024 * 10 }
    );
  }

  if (!fs.existsSync(outPath)) {
    throw new Error('FFmpeg failed to generate MP4 file.');
  }
  return { filePath: outPath, fileName: outName };
}

async function convertViaYtDlp(
  videoId: string,
  format: 'mp3' | 'mp4',
  quality: string,
  targetDir: string
): Promise<{ filePath: string; fileName: string }> {
  const cleanWatchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const ytDlpPath = resolveYtDlpBinary();
  const ffmpegPath = resolveFfmpegPath();
  const outputTemplate = path.join(targetDir, '%(title).75s.%(ext)s');

  const args: string[] = [
    '--js-runtimes',
    'node',
    '--no-playlist',
    '--no-warnings',
    '--restrict-filenames',
    '-o',
    outputTemplate,
  ];

  const cookiesFile = resolveOptionalCookiesFile(targetDir);
  if (cookiesFile) {
    args.push('--cookies', cookiesFile);
  }

  if (ffmpegPath !== 'ffmpeg') {
    args.push('--ffmpeg-location', path.dirname(ffmpegPath));
  }

  if (format === 'mp3') {
    const bitrate = ['128', '192', '320'].includes(quality) ? quality : '192';
    args.push(
      '-f',
      'bestaudio/best',
      '-x',
      '--audio-format',
      'mp3',
      '--audio-quality',
      `${bitrate}K`
    );
  } else {
    const height = ['360', '480', '720', '1080'].includes(quality) ? quality : '720';
    args.push(
      '-f',
      `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${height}]+bestaudio/best[height<=${height}][ext=mp4]/best[height<=${height}]/best`,
      '--merge-output-format',
      'mp4'
    );
  }

  args.push(cleanWatchUrl);

  await execFileAsync(ytDlpPath, args, {
    timeout: 180000,
    maxBuffer: 1024 * 1024 * 10,
  });

  const producedFiles = fs
    .readdirSync(targetDir)
    .filter((f) => !f.endsWith('.part') && !f.endsWith('.ytdl') && f !== 'cookies.txt');

  if (producedFiles.length === 0) {
    throw new Error('Conversion produced no output file.');
  }

  const targetExt = format === 'mp3' ? '.mp3' : '.mp4';
  const preferredFile =
    producedFiles.find((f) => f.toLowerCase().endsWith(targetExt)) || producedFiles[0];
  const fullFilePath = path.join(targetDir, preferredFile);
  const safeName =
    sanitizeFilename(path.basename(preferredFile, path.extname(preferredFile))) +
    path.extname(preferredFile);

  return { filePath: fullFilePath, fileName: safeName };
}

async function convertVideoToDir(
  videoId: string,
  format: 'mp3' | 'mp4',
  quality: string,
  targetDir: string
): Promise<{ filePath: string; fileName: string }> {
  try {
    return await convertViaYtDlp(videoId, format, quality, targetDir);
  } catch (ytDlpErr) {
    // Fallback to Piped stream relay + local FFmpeg when direct YouTube IP hits bot verification
    try {
      return await convertViaPipedAndFfmpeg(videoId, format, quality, targetDir);
    } catch (relayErr) {
      throw relayErr || ytDlpErr;
    }
  }
}

interface BatchZipItemState {
  id: string;
  url: string;
  format: 'mp3' | 'mp4';
  quality: string;
  status: 'pending' | 'converting' | 'completed' | 'error';
  errorMessage?: string;
  outputPath?: string;
  outputName?: string;
}

interface BatchZipJob {
  jobId: string;
  tempDir: string;
  zipPath: string;
  zipStatus: 'converting' | 'zipping' | 'ready' | 'error';
  errorMessage?: string;
  completedCount: number;
  items: BatchZipItemState[];
  createdAt: number;
}

const batchJobs = new Map<string, BatchZipJob>();

function cleanupJob(jobId: string) {
  const job = batchJobs.get(jobId);
  if (!job) return;
  batchJobs.delete(jobId);
  fs.rm(job.tempDir, { recursive: true, force: true }, () => {});
}

async function runBatchZipJob(job: BatchZipJob) {
  const usedNames = new Set<string>();

  for (let i = 0; i < job.items.length; i += 1) {
    const item = job.items[i];
    item.status = 'converting';

    const itemDir = path.join(job.tempDir, `item_${i}`);
    fs.mkdirSync(itemDir, { recursive: true });

    try {
      const { filePath, fileName } = await convertVideoToDir(
        item.id,
        item.format,
        item.quality,
        itemDir
      );

      let uniqueName = fileName;
      const ext = path.extname(fileName);
      const base = path.basename(fileName, ext);
      let counter = 2;
      while (usedNames.has(uniqueName.toLowerCase())) {
        uniqueName = `${base}_${counter}${ext}`;
        counter += 1;
      }
      usedNames.add(uniqueName.toLowerCase());

      item.outputPath = filePath;
      item.outputName = uniqueName;
      item.status = 'completed';
      job.completedCount += 1;
    } catch (err) {
      const mapped = mapConversionError(err);
      item.status = 'error';
      item.errorMessage = mapped.message;
    }
  }

  const readyItems = job.items.filter((i) => i.status === 'completed' && i.outputPath);
  if (readyItems.length === 0) {
    job.zipStatus = 'error';
    job.errorMessage =
      job.items.find((i) => i.errorMessage)?.errorMessage ||
      'No videos could be converted for the ZIP archive.';
    setTimeout(() => cleanupJob(job.jobId), 60000);
    return;
  }

  job.zipStatus = 'zipping';

  try {
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(job.zipPath);
      const archive = new ZipArchive({ zlib: { level: 1 } });

      output.on('close', () => resolve());
      output.on('error', (err: Error) => reject(err));
      archive.on('error', (err: Error) => reject(err));

      archive.pipe(output);

      for (const item of readyItems) {
        if (item.outputPath && item.outputName && fs.existsSync(item.outputPath)) {
          archive.file(item.outputPath, { name: item.outputName });
        }
      }

      const failedItems = job.items.filter((i) => i.status === 'error');
      if (failedItems.length > 0) {
        const report = failedItems
          .map((f) => `${f.url} -> ${f.errorMessage || 'Failed'}`)
          .join('\n');
        archive.append(
          `Ashik Creative Studio - Batch Conversion Report\n\nSkipped/Failed URLs:\n${report}\n`,
          { name: 'conversion-report.txt' }
        );
      }

      archive.finalize();
    });

    job.zipStatus = 'ready';
    setTimeout(() => cleanupJob(job.jobId), 10 * 60 * 1000);
  } catch (err) {
    job.zipStatus = 'error';
    job.errorMessage = err instanceof Error ? err.message : 'Failed to package ZIP archive.';
    setTimeout(() => cleanupJob(job.jobId), 60000);
  }
}

async function fetchSingleMetadata(videoId: string) {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const fallback = {
    id: videoId,
    url: watchUrl,
    title: `YouTube Video (${videoId})`,
    author: 'YouTube Creator',
    durationText: '--:--',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };

  // Run fast YouTube oEmbed + Piped relay metadata lookup concurrently
  const [oembedResult, pipedResult] = await Promise.allSettled([
    (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      if (!res.ok) return null;
      return (await res.json()) as {
        title?: string;
        author_name?: string;
        thumbnail_url?: string;
      };
    })(),
    fetchPipedStreams(videoId),
  ]);

  if (oembedResult.status === 'fulfilled' && oembedResult.value) {
    const oembed = oembedResult.value;
    fallback.title = oembed.title || fallback.title;
    fallback.author = oembed.author_name || fallback.author;
    if (oembed.thumbnail_url) fallback.thumbnail = oembed.thumbnail_url;
  }

  if (pipedResult.status === 'fulfilled' && pipedResult.value) {
    const piped = pipedResult.value;
    if (piped.title) fallback.title = piped.title;
    if (piped.uploader) fallback.author = piped.uploader;
    if (piped.duration) fallback.durationText = formatDuration(piped.duration);
  } else {
    try {
      const info = await ytdl.getInfo(watchUrl);
      const len = Number(info.videoDetails.lengthSeconds);
      if (Number.isFinite(len) && len > 0) {
        fallback.durationText = formatDuration(len);
      }
      if (info.videoDetails.title) fallback.title = info.videoDetails.title;
      if (info.videoDetails.author?.name) fallback.author = info.videoDetails.author.name;
    } catch {
      // Keep oEmbed metadata
    }
  }

  return fallback;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'running',
      studio: 'Ashik Creative Studio',
      ffmpeg: fs.existsSync('/usr/bin/ffmpeg') || fs.existsSync('/usr/local/bin/ffmpeg'),
      ytdlp: fs.existsSync(resolveYtDlpBinary()),
      relay: PIPED_INSTANCES.length > 0,
    });
  });

  app.post('/api/info', async (req, res) => {
    try {
      const urls = Array.isArray(req.body?.urls) ? req.body.urls : [];
      const uniqueIds: string[] = [];

      for (const raw of urls) {
        if (typeof raw !== 'string') continue;
        const id = extractYouTubeId(raw);
        if (id && !uniqueIds.includes(id)) {
          uniqueIds.push(id);
        }
        if (uniqueIds.length >= 25) break;
      }

      if (uniqueIds.length === 0) {
        res.status(400).json({ error: 'No valid YouTube URLs found.' });
        return;
      }

      const items = await Promise.all(uniqueIds.map((id) => fetchSingleMetadata(id)));
      res.json({ items });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to inspect video links.';
      res.status(500).json({ error: msg });
    }
  });

  app.get('/api/download', async (req, res) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    const format = req.query.format === 'mp3' ? 'mp3' : 'mp4';
    const rawQuality = typeof req.query.quality === 'string' ? req.query.quality : '720';

    const videoId = extractYouTubeId(rawUrl);
    if (!videoId) {
      res.status(400).json({ error: 'Invalid YouTube video URL.' });
      return;
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ashik-studio-'));
    const cleanup = () => {
      fs.rm(tempDir, { recursive: true, force: true }, () => {});
    };

    res.on('close', cleanup);
    res.on('finish', cleanup);

    try {
      const { filePath, fileName } = await convertVideoToDir(
        videoId,
        format,
        rawQuality,
        tempDir
      );

      res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'video/mp4');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
      );
      res.setHeader('X-Converted-Filename', encodeURIComponent(fileName));

      const readStream = fs.createReadStream(filePath);
      readStream.on('error', () => {
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream converted file.' });
        }
        cleanup();
      });
      readStream.pipe(res);
    } catch (error) {
      cleanup();
      const mapped = mapConversionError(error);
      if (!res.headersSent) {
        res.status(mapped.status).json({ error: mapped.message });
      }
    }
  });

  app.post('/api/batch-zip/start', (req, res) => {
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const validItems: BatchZipItemState[] = [];

    for (const entry of rawItems.slice(0, 25)) {
      if (!entry || typeof entry.url !== 'string') continue;
      const id = extractYouTubeId(entry.url);
      if (!id) continue;
      validItems.push({
        id,
        url: `https://www.youtube.com/watch?v=${id}`,
        format: entry.format === 'mp3' ? 'mp3' : 'mp4',
        quality: typeof entry.quality === 'string' ? entry.quality : '720',
        status: 'pending',
      });
    }

    if (validItems.length === 0) {
      res.status(400).json({ error: 'No valid YouTube links provided for ZIP batch.' });
      return;
    }

    const jobId = crypto.randomUUID();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ashik-zip-'));
    const zipPath = path.join(tempDir, 'Ashik_Creative_Studio_Bundle.zip');

    const job: BatchZipJob = {
      jobId,
      tempDir,
      zipPath,
      zipStatus: 'converting',
      completedCount: 0,
      items: validItems,
      createdAt: Date.now(),
    };

    batchJobs.set(jobId, job);
    void runBatchZipJob(job);

    res.json({ jobId, total: validItems.length });
  });

  app.get('/api/batch-zip/status/:jobId', (req, res) => {
    const job = batchJobs.get(req.params.jobId);
    if (!job) {
      res.status(404).json({ error: 'Batch job not found or expired.' });
      return;
    }

    res.json({
      jobId: job.jobId,
      zipStatus: job.zipStatus,
      errorMessage: job.errorMessage,
      completedCount: job.completedCount,
      total: job.items.length,
      items: job.items.map((item) => ({
        id: item.id,
        status: item.status,
        errorMessage: item.errorMessage,
      })),
    });
  });

  app.get('/api/batch-zip/file/:jobId', (req, res) => {
    const job = batchJobs.get(req.params.jobId);
    if (!job || job.zipStatus !== 'ready' || !fs.existsSync(job.zipPath)) {
      res.status(404).json({ error: 'ZIP file is not ready or has expired.' });
      return;
    }

    const filename = `Ashik_Creative_Studio_${job.completedCount}_Files.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.setHeader('X-Converted-Filename', encodeURIComponent(filename));

    const stream = fs.createReadStream(job.zipPath);
    stream.on('close', () => cleanupJob(job.jobId));
    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream ZIP file.' });
      }
      cleanupJob(job.jobId);
    });
    stream.pipe(res);
  });

  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ashik Creative Studio server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failure:', err);
  process.exit(1);
});
