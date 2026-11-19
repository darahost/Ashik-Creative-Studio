import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  ClipboardPaste,
  Download,
  Files,
  Film,
  Loader2,
  Music,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import type {
  BatchDownloadMode,
  Language,
  MediaFormat,
  MediaQuality,
  VideoInfoResponse,
  VideoQueueItem,
} from '../types/converter';
import { TRANSLATIONS } from '../data/translations';

interface ConverterWorkspaceProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const YT_EXTRACT_REGEX =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;

const SAMPLE_URLS = [
  'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
  'https://youtu.be/YE7VzlLtp-4',
].join('\n');

const MP4_OPTIONS: Array<{ value: MediaQuality; label: string }> = [
  { value: '1080', label: '1080p Full HD (MP4)' },
  { value: '720', label: '720p HD (MP4)' },
  { value: '480', label: '480p SD (MP4)' },
  { value: '360', label: '360p Compact (MP4)' },
];

const MP3_OPTIONS: Array<{ value: MediaQuality; label: string }> = [
  { value: '320', label: '320 kbps (Studio MP3)' },
  { value: '192', label: '192 kbps (High MP3)' },
  { value: '128', label: '128 kbps (Standard MP3)' },
];

function extractId(url: string): string | null {
  const match = url.trim().match(YT_EXTRACT_REGEX);
  return match ? match[1] : null;
}

function parseFilenameFromHeader(headerValue: string | null, fallback: string): string {
  if (!headerValue) return fallback;
  const utfMatch = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      // fall through
    }
  }
  const plainMatch = headerValue.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] || fallback;
}

interface BatchZipStatusPayload {
  jobId: string;
  zipStatus: 'converting' | 'zipping' | 'ready' | 'error';
  errorMessage?: string;
  completedCount: number;
  total: number;
  items: Array<{
    id: string;
    status: 'pending' | 'converting' | 'completed' | 'error';
    errorMessage?: string;
  }>;
}

export function ConverterWorkspace({ language, onLanguageChange }: ConverterWorkspaceProps) {
  const t = TRANSLATIONS[language];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMountedRef = useRef(true);

  const [rawInput, setRawInput] = useState('');
  const [globalFormat, setGlobalFormat] = useState<MediaFormat>('mp4');
  const [globalQuality, setGlobalQuality] = useState<MediaQuality>('720');
  const [batchMode, setBatchMode] = useState<BatchDownloadMode>('zip');
  const [queue, setQueue] = useState<VideoQueueItem[]>([]);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [batchProgressText, setBatchProgressText] = useState<string | null>(null);
  const [failedThumbnails, setFailedThumbnails] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{
    type: 'info' | 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleGlobalFormatChange = (nextFormat: MediaFormat) => {
    setGlobalFormat(nextFormat);
    setGlobalQuality(nextFormat === 'mp3' ? '320' : '720');
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawInput((prev) => (prev.trim() ? `${prev.trim()}\n${text.trim()}` : text.trim()));
        setFeedback(null);
      }
    } catch {
      setFeedback({ type: 'error', message: t.workspace.clipboardDenied });
      textareaRef.current?.focus();
    }
  };

  const handleLoadSamples = () => {
    setRawInput(SAMPLE_URLS);
    setFeedback(null);
  };

  const handleClear = () => {
    setRawInput('');
    setQueue([]);
    setFeedback(null);
    setBatchProgressText(null);
  };

  const handlePrepareQueue = async () => {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      setFeedback({ type: 'error', message: t.workspace.emptyError });
      textareaRef.current?.focus();
      return;
    }

    const tokens = trimmed
      .split(/[\r\n,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    const uniqueIds: string[] = [];
    let skipped = 0;

    for (const token of tokens) {
      const id = extractId(token);
      if (id) {
        if (!uniqueIds.includes(id)) {
          uniqueIds.push(id);
        }
      } else {
        skipped += 1;
      }
    }

    if (uniqueIds.length === 0) {
      setFeedback({ type: 'error', message: t.workspace.invalidError });
      return;
    }

    setIsPreparing(true);
    setFeedback(null);
    setBatchProgressText(null);

    try {
      const watchUrls = uniqueIds.map((id) => `https://www.youtube.com/watch?v=${id}`);
      const res = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: watchUrls }),
      });

      if (!res.ok) {
        throw new Error('Metadata service returned an error.');
      }

      const data = (await res.json()) as { items: VideoInfoResponse[] };
      const preparedItems: VideoQueueItem[] = data.items.map((item) => ({
        ...item,
        format: globalFormat,
        quality: globalQuality,
        status: 'ready',
      }));

      setQueue(preparedItems);
      setFeedback({
        type: 'success',
        message: t.workspace.preparedSuccess(preparedItems.length, skipped),
      });
    } catch {
      const fallbackItems: VideoQueueItem[] = uniqueIds.map((id) => ({
        id,
        url: `https://www.youtube.com/watch?v=${id}`,
        title: `YouTube Video (${id})`,
        author: 'YouTube',
        durationText: '--:--',
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        format: globalFormat,
        quality: globalQuality,
        status: 'ready',
      }));
      setQueue(fallbackItems);
      setFeedback({
        type: 'info',
        message: t.workspace.preparedSuccess(fallbackItems.length, skipped),
      });
    } finally {
      setIsPreparing(false);
    }
  };

  const updateItemFormat = (id: string, format: MediaFormat) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              format,
              quality: format === 'mp3' ? '320' : '720',
              status: 'ready',
              errorMessage: undefined,
            }
          : item
      )
    );
  };

  const updateItemQuality = (id: string, quality: MediaQuality) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quality, status: 'ready', errorMessage: undefined }
          : item
      )
    );
  };

  const removeQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const applyGlobalToAll = () => {
    setQueue((prev) =>
      prev.map((item) => ({
        ...item,
        format: globalFormat,
        quality: globalQuality,
        status: 'ready',
        errorMessage: undefined,
      }))
    );
  };

  const triggerDownload = async (item: VideoQueueItem) => {
    setQueue((prev) =>
      prev.map((entry) =>
        entry.id === item.id
          ? { ...entry, status: 'downloading', errorMessage: undefined }
          : entry
      )
    );

    try {
      const endpoint = `/api/download?url=${encodeURIComponent(item.url)}&format=${item.format}&quality=${item.quality}`;
      const response = await fetch(endpoint);

      if (!response.ok) {
        let errMsg = 'Conversion failed.';
        try {
          const errJson = (await response.json()) as { error?: string };
          if (errJson.error) errMsg = errJson.error;
        } catch {
          // ignore parse error
        }
        throw new Error(errMsg);
      }

      const blob = await response.blob();
      const customHeaderName = response.headers.get('X-Converted-Filename');
      const fallbackName = `${item.title.slice(0, 60).replace(/[<>:"/\\|?*]/g, '') || item.id}.${item.format}`;
      const filename = customHeaderName
        ? decodeURIComponent(customHeaderName)
        : parseFilenameFromHeader(response.headers.get('Content-Disposition'), fallbackName);

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);

      setQueue((prev) =>
        prev.map((entry) =>
          entry.id === item.id ? { ...entry, status: 'completed' } : entry
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download error';
      setQueue((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, status: 'error', errorMessage: message }
            : entry
        )
      );
    }
  };

  const handleBatchZipDownload = async () => {
    setIsBatchDownloading(true);
    setFeedback(null);
    setBatchProgressText(t.queue.zipConverting(0, queue.length));

    setQueue((prev) =>
      prev.map((item) => ({
        ...item,
        status: 'downloading',
        errorMessage: undefined,
      }))
    );

    try {
      const startRes = await fetch('/api/batch-zip/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: queue.map((item) => ({
            url: item.url,
            format: item.format,
            quality: item.quality,
          })),
        }),
      });

      if (!startRes.ok) {
        const errBody = (await startRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || 'Failed to start ZIP conversion batch.');
      }

      const { jobId } = (await startRes.json()) as { jobId: string; total: number };

      let finished = false;
      while (!finished && isMountedRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 900));
        const statusRes = await fetch(`/api/batch-zip/status/${encodeURIComponent(jobId)}`);
        if (!statusRes.ok) {
          throw new Error('Lost connection to batch conversion job.');
        }

        const statusData = (await statusRes.json()) as BatchZipStatusPayload;

        setQueue((prev) =>
          prev.map((entry) => {
            const matched = statusData.items.find((s) => s.id === entry.id);
            if (!matched) return entry;
            return {
              ...entry,
              status:
                matched.status === 'completed'
                  ? 'completed'
                  : matched.status === 'error'
                  ? 'error'
                  : matched.status === 'converting'
                  ? 'downloading'
                  : 'ready',
              errorMessage: matched.errorMessage,
            };
          })
        );

        if (statusData.zipStatus === 'zipping') {
          setBatchProgressText(t.queue.zipPackaging);
        } else if (statusData.zipStatus === 'converting') {
          setBatchProgressText(
            t.queue.zipConverting(statusData.completedCount, statusData.total)
          );
        } else if (statusData.zipStatus === 'ready') {
          finished = true;
          const fileRes = await fetch(`/api/batch-zip/file/${encodeURIComponent(jobId)}`);
          if (!fileRes.ok) {
            throw new Error('Failed to download the packaged ZIP archive.');
          }
          const zipBlob = await fileRes.blob();
          const customHeaderName = fileRes.headers.get('X-Converted-Filename');
          const zipName = customHeaderName
            ? decodeURIComponent(customHeaderName)
            : `Ashik_Creative_Studio_${statusData.completedCount}_Files.zip`;

          const objectUrl = URL.createObjectURL(zipBlob);
          const anchor = document.createElement('a');
          anchor.href = objectUrl;
          anchor.download = zipName;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);

          setBatchProgressText(null);
          setFeedback({
            type: 'success',
            message: t.queue.zipSuccess(statusData.completedCount),
          });
        } else if (statusData.zipStatus === 'error') {
          finished = true;
          throw new Error(
            statusData.errorMessage || 'Batch ZIP conversion failed.'
          );
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Batch ZIP download error.';
      setBatchProgressText(null);
      setFeedback({ type: 'error', message: msg });
    } finally {
      if (isMountedRef.current) {
        setIsBatchDownloading(false);
      }
    }
  };

  const handleBatchDownload = async () => {
    if (queue.length === 0 || isBatchDownloading) return;
    if (batchMode === 'zip') {
      await handleBatchZipDownload();
      return;
    }

    setIsBatchDownloading(true);
    for (const item of queue) {
      if (item.status === 'completed') continue;
      await triggerDownload(item);
    }
    setIsBatchDownloading(false);
  };

  const qualityOptions = globalFormat === 'mp3' ? MP3_OPTIONS : MP4_OPTIONS;

  return (
    <section id="converter" className="mx-auto w-full max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
      {/* Editorial Hero Header */}
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-medium tracking-wide text-amber-400/90 sm:text-sm">
          {t.hero.kicker}
        </p>
        <h1
          className="mt-3 font-display font-bold tracking-tight text-white [text-wrap:balance]"
          style={{ fontSize: 'clamp(2rem, 4vw, 3.35rem)', lineHeight: 1.15 }}
        >
          {t.hero.titleStart}
          <span className="gold-text">{t.hero.titleHighlight}</span>
          {t.hero.titleEnd}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          {t.hero.subtitle}
        </p>
      </div>

      {/* Main Converter Workspace */}
      <div className="mt-8 rounded-2xl border border-zinc-800/90 bg-[#111114] p-5 sm:mt-10 sm:p-8">
        {/* Workspace Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
          <div>
            <label
              htmlFor="bulk-youtube-urls"
              className="block text-sm font-semibold text-zinc-100 sm:text-base"
            >
              {t.workspace.inputLabel}
            </label>
            <p className="mt-0.5 text-xs text-zinc-500">{t.workspace.inputHint}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Language"
              className="inline-flex items-center rounded-lg border border-zinc-800 bg-[#09090B] p-0.5"
            >
              <button
                type="button"
                onClick={() => onLanguageChange('bn')}
                className={`h-8 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  language === 'bn'
                    ? 'bg-zinc-800 text-amber-300'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`h-8 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  language === 'en'
                    ? 'bg-zinc-800 text-amber-300'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                English
              </button>
            </div>

            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-zinc-800 bg-[#09090B] px-3 text-xs font-medium text-zinc-300 transition-colors duration-150 hover:border-zinc-700 hover:text-white cursor-pointer"
            >
              <ClipboardPaste className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
              <span>{t.workspace.pasteClipboard}</span>
            </button>

            <button
              type="button"
              onClick={handleLoadSamples}
              className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-lg border border-zinc-800 bg-[#09090B] px-3 text-xs font-medium text-zinc-300 transition-colors duration-150 hover:border-zinc-700 hover:text-white cursor-pointer"
            >
              {t.workspace.loadSamples}
            </button>

            {(rawInput.length > 0 || queue.length > 0) && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-zinc-800 bg-[#09090B] px-3 text-xs font-medium text-zinc-400 transition-colors duration-150 hover:border-red-500/40 hover:text-red-300 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.workspace.clearAll}</span>
              </button>
            )}
          </div>
        </div>

        {/* URL Textarea */}
        <div className="mt-4">
          <textarea
            ref={textareaRef}
            id="bulk-youtube-urls"
            rows={5}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={t.workspace.placeholder}
            spellCheck={false}
            className="w-full rounded-xl border border-zinc-800 bg-[#09090B] p-4 font-mono text-xs leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none sm:text-sm"
          />
        </div>

        {/* Global Format, Quality & Primary CTA */}
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
          <div className="md:col-span-4">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">
              {t.workspace.formatLabel}
            </span>
            <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-zinc-800 bg-[#09090B] p-1">
              <button
                type="button"
                onClick={() => handleGlobalFormatChange('mp4')}
                className={`inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-colors duration-150 cursor-pointer sm:text-sm ${
                  globalFormat === 'mp4'
                    ? 'bg-zinc-800 text-amber-300'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Film className="h-4 w-4" aria-hidden="true" />
                <span>{t.workspace.formatMp4}</span>
              </button>
              <button
                type="button"
                onClick={() => handleGlobalFormatChange('mp3')}
                className={`inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-colors duration-150 cursor-pointer sm:text-sm ${
                  globalFormat === 'mp3'
                    ? 'bg-zinc-800 text-amber-300'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Music className="h-4 w-4" aria-hidden="true" />
                <span>{t.workspace.formatMp3}</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-4">
            <label
              htmlFor="global-quality"
              className="mb-1.5 block text-xs font-medium text-zinc-400"
            >
              {t.workspace.qualityLabel}
            </label>
            <select
              id="global-quality"
              value={globalQuality}
              onChange={(e) => setGlobalQuality(e.target.value as MediaQuality)}
              className="h-12 w-full rounded-xl border border-zinc-800 bg-[#09090B] px-3.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
            >
              {qualityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <button
              type="button"
              onClick={handlePrepareQueue}
              disabled={isPreparing}
              className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-amber-500 px-6 text-sm font-bold text-zinc-950 transition-colors duration-150 hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isPreparing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>{t.workspace.preparingButton}</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>{t.workspace.prepareButton}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Feedback */}
        {feedback && (
          <div
            role="status"
            className={`mt-4 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${
              feedback.type === 'error'
                ? 'border-red-500/30 bg-red-500/10 text-red-200'
                : feedback.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Prepared Queue List */}
      {queue.length > 0 && (
        <div className="mt-8 rounded-2xl border border-zinc-800/90 bg-[#111114] overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-zinc-800/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between sm:px-6">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h2 className="font-display text-base font-bold text-white sm:text-lg">
                {t.queue.heading}
              </h2>
              <span className="font-mono text-xs text-zinc-400 tabular-nums">
                {queue.length} {t.queue.itemsUnit}
              </span>
              {batchProgressText && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 tabular-nums">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  <span>{batchProgressText}</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={applyGlobalToAll}
                disabled={isBatchDownloading}
                className="inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-lg border border-zinc-800 bg-[#09090B] px-3.5 text-xs font-medium text-zinc-300 transition-colors duration-150 hover:border-zinc-700 hover:text-white disabled:opacity-60 cursor-pointer"
              >
                {t.queue.applyGlobal}
              </button>

              {/* Selectable Output Mode Before Download */}
              <div className="flex items-center gap-2">
                <span className="hidden text-xs font-medium text-zinc-400 sm:inline">
                  {t.queue.downloadModeLabel}
                </span>
                <div
                  role="group"
                  aria-label={t.queue.downloadModeLabel}
                  className="inline-flex h-10 items-center rounded-lg border border-zinc-800 bg-[#09090B] p-1"
                >
                  <button
                    type="button"
                    disabled={isBatchDownloading}
                    onClick={() => setBatchMode('individual')}
                    className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition-colors duration-150 cursor-pointer disabled:opacity-60 ${
                      batchMode === 'individual'
                        ? 'bg-zinc-800 text-amber-300'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Files className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.queue.modeIndividual}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isBatchDownloading}
                    onClick={() => setBatchMode('zip')}
                    className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition-colors duration-150 cursor-pointer disabled:opacity-60 ${
                      batchMode === 'zip'
                        ? 'bg-zinc-800 text-amber-300'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.queue.modeZip}</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBatchDownload}
                disabled={isBatchDownloading}
                className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-amber-500 px-4 text-xs font-bold text-zinc-950 transition-colors duration-150 hover:bg-amber-400 disabled:opacity-60 cursor-pointer sm:text-sm"
              >
                {isBatchDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>{batchProgressText || t.queue.downloadingAll}</span>
                  </>
                ) : batchMode === 'zip' ? (
                  <>
                    <Archive className="h-4 w-4" aria-hidden="true" />
                    <span>{t.queue.downloadZip}</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    <span>{t.queue.downloadAll}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <ul className="divide-y divide-zinc-800/80">
            {queue.map((item) => {
              const itemOptions = item.format === 'mp3' ? MP3_OPTIONS : MP4_OPTIONS;
              const isThumbBroken = failedThumbnails[item.id];

              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-4 px-5 py-4 transition-colors duration-150 hover:bg-zinc-900/40 sm:flex-row sm:items-center sm:px-6"
                >
                  {/* Thumbnail with Fallback */}
                  <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 sm:w-40">
                    {!isThumbBroken ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedThumbnails((prev) => ({ ...prev, [item.id]: true }))
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-zinc-900 text-zinc-500">
                        <Film className="h-5 w-5 text-amber-400/70" aria-hidden="true" />
                        <span className="font-mono text-[11px]">{item.id}</span>
                      </div>
                    )}
                    {item.durationText !== '--:--' && (
                      <span className="absolute right-1.5 bottom-1.5 rounded bg-black/85 px-1.5 py-0.5 font-mono text-[11px] font-medium text-zinc-100 tabular-nums">
                        {item.durationText}
                      </span>
                    )}
                  </div>

                  {/* Title & Unboxed Metadata */}
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-semibold text-zinc-100 sm:text-base">
                      {item.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
                      <span className="truncate max-w-[200px]">{item.author}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{item.id}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          item.status === 'completed'
                            ? 'text-emerald-400 font-medium'
                            : item.status === 'error'
                            ? 'text-red-400 font-medium'
                            : item.status === 'downloading'
                            ? 'text-amber-300 font-medium'
                            : 'text-zinc-400'
                        }
                      >
                        {item.status === 'ready' && t.queue.statusReady}
                        {item.status === 'downloading' && t.queue.statusDownloading}
                        {item.status === 'completed' && t.queue.statusCompleted}
                        {item.status === 'error' && t.queue.statusError}
                      </span>
                    </div>

                    {item.errorMessage && (
                      <p className="mt-1.5 text-xs text-red-300">{item.errorMessage}</p>
                    )}
                  </div>

                  {/* Per-item Format, Quality & Action Controls */}
                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    <select
                      aria-label={`Format for ${item.title}`}
                      value={item.format}
                      disabled={item.status === 'downloading' || isBatchDownloading}
                      onChange={(e) =>
                        updateItemFormat(item.id, e.target.value as MediaFormat)
                      }
                      className="h-10 rounded-lg border border-zinc-800 bg-[#09090B] px-2.5 text-xs font-medium text-zinc-100 focus:border-amber-500 focus:outline-none disabled:opacity-60"
                    >
                      <option value="mp4">MP4</option>
                      <option value="mp3">MP3</option>
                    </select>

                    <select
                      aria-label={`Quality for ${item.title}`}
                      value={item.quality}
                      disabled={item.status === 'downloading' || isBatchDownloading}
                      onChange={(e) =>
                        updateItemQuality(item.id, e.target.value as MediaQuality)
                      }
                      className="h-10 rounded-lg border border-zinc-800 bg-[#09090B] px-2.5 text-xs font-medium text-zinc-100 focus:border-amber-500 focus:outline-none disabled:opacity-60"
                    >
                      {itemOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => triggerDownload(item)}
                      disabled={item.status === 'downloading' || isBatchDownloading}
                      className={`inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-4 text-xs font-bold transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                        item.status === 'completed'
                          ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                          : item.status === 'error'
                          ? 'border border-red-500/40 bg-red-500/15 text-red-200 hover:bg-red-500/25'
                          : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                      }`}
                    >
                      {item.status === 'downloading' ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          <span>{t.queue.convertingBtn}</span>
                        </>
                      ) : item.status === 'completed' ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t.queue.downloadedBtn}</span>
                        </>
                      ) : item.status === 'error' ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t.queue.retryBtn}</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t.queue.downloadBtn}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isBatchDownloading}
                      onClick={() => removeQueueItem(item.id)}
                      aria-label={t.queue.removeAria}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-[#09090B] text-zinc-400 transition-colors duration-150 hover:border-zinc-700 hover:text-red-300 disabled:opacity-60 cursor-pointer"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
