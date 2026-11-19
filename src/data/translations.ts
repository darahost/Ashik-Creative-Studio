import type { Language } from '../types/converter';

interface TranslationDictionary {
  nav: {
    converter: string;
    capabilities: string;
    guide: string;
    support: string;
    visitStudio: string;
  };
  hero: {
    kicker: string;
    titleStart: string;
    titleHighlight: string;
    titleEnd: string;
    subtitle: string;
  };
  workspace: {
    inputLabel: string;
    inputHint: string;
    placeholder: string;
    pasteClipboard: string;
    loadSamples: string;
    clearAll: string;
    formatLabel: string;
    formatMp4: string;
    formatMp3: string;
    qualityLabel: string;
    prepareButton: string;
    preparingButton: string;
    emptyError: string;
    invalidError: string;
    clipboardDenied: string;
    preparedSuccess: (count: number, skipped: number) => string;
  };
  queue: {
    heading: string;
    itemsUnit: string;
    applyGlobal: string;
    downloadModeLabel: string;
    modeIndividual: string;
    modeZip: string;
    downloadAll: string;
    downloadZip: string;
    downloadingAll: string;
    zipConverting: (done: number, total: number) => string;
    zipPackaging: string;
    zipSuccess: (count: number) => string;
    downloadBtn: string;
    convertingBtn: string;
    downloadedBtn: string;
    retryBtn: string;
    removeAria: string;
    statusReady: string;
    statusDownloading: string;
    statusCompleted: string;
    statusError: string;
  };
  capabilities: {
    sectionLabel: string;
    heading: string;
    subheading: string;
    items: Array<{
      index: string;
      title: string;
      spec: string;
      description: string;
    }>;
  };
  support: {
    sectionLabel: string;
    heading: string;
    description: string;
    role: string;
    mobileLabel: string;
    emailLabel: string;
    websiteLabel: string;
    copied: string;
    copy: string;
    guideTitle: string;
    faqs: Array<{
      title: string;
      body: string;
    }>;
  };
  footer: {
    rights: string;
    developedBy: string;
    disclaimer: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  bn: {
    nav: {
      converter: 'কনভার্টার',
      capabilities: 'সুবিধাসমূহ',
      guide: 'নির্দেশিকা',
      support: 'যোগাযোগ',
      visitStudio: 'অফিসিয়াল সাইট',
    },
    hero: {
      kicker: 'Ashik Creative Studio · বাল্ক ইউটিউব কনভার্টার · ১০০% বিনামূল্যে',
      titleStart: 'একসাথে অনেকগুলো ইউটিউব লিংক কনভার্ট করুন ',
      titleHighlight: 'MP3 ও MP4',
      titleEnd: '-এ',
      subtitle:
        'এক বা একাধিক ইউটিউব ভিডিও বা শর্টস লিংক নিচের বক্সে পেস্ট করুন। প্রতিটি ভিডিওর জন্য আলাদা ফরম্যাট এবং রেজুলেশন বেছে নিয়ে সরাসরি ডাউনলোড করুন।',
    },
    workspace: {
      inputLabel: 'ইউটিউব ভিডিও লিংক (প্রতি লাইনে একটি করে)',
      inputHint: 'Watch, Shorts, Live ও youtu.be লিংক সাপোর্ট করে',
      placeholder:
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ\nhttps://youtu.be/aqz-KE-bpKQ\nhttps://www.youtube.com/shorts/...',
      pasteClipboard: 'পেস্ট করুন',
      loadSamples: 'উদাহরণ লিংক',
      clearAll: 'বক্স খালি করুন',
      formatLabel: 'ডিফল্ট ফরম্যাট',
      formatMp4: 'ভিডিও (MP4)',
      formatMp3: 'অডিও (MP3)',
      qualityLabel: 'রেজুলেশন / কোয়ালিটি',
      prepareButton: 'লিংকগুলো প্রস্তুত করুন',
      preparingButton: 'তথ্য লোড হচ্ছে...',
      emptyError: 'অনুগ্রহ করে অন্তত একটি ইউটিউব ভিডিও লিংক পেস্ট করুন।',
      invalidError: 'কোনো সঠিক ইউটিউব লিংক পাওয়া যায়নি। দয়া করে সঠিক লিংক দিন।',
      clipboardDenied: 'ক্লিপবোর্ড অ্যাক্সেস পাওয়া যায়নি। বক্সে সরাসরি Ctrl+V দিয়ে পেস্ট করুন।',
      preparedSuccess: (count, skipped) =>
        skipped > 0
          ? `${count}টি ভিডিও প্রস্তুত হয়েছে (${skipped}টি অকার্যকর লাইন বাদ দেওয়া হয়েছে)।`
          : `${count}টি ভিডিও কনভার্ট ও ডাউনলোডের জন্য প্রস্তুত।`,
    },
    queue: {
      heading: 'প্রস্তুতকৃত ভিডিও তালিকা',
      itemsUnit: 'টি ভিডিও',
      applyGlobal: 'সবেতে বর্তমান সেটিং দিন',
      downloadModeLabel: 'ডাউনলোড ধরন:',
      modeIndividual: 'আলাদা ফাইল',
      modeZip: 'একটি ZIP ফাইল',
      downloadAll: 'সবগুলো ডাউনলোড করুন',
      downloadZip: 'ZIP হিসেবে ডাউনলোড করুন',
      downloadingAll: 'ডাউনলোড চলছে...',
      zipConverting: (done, total) => `কনভার্ট হচ্ছে (${done}/${total})...`,
      zipPackaging: 'ZIP ফাইল তৈরি হচ্ছে...',
      zipSuccess: (count) => `${count}টি ফাইলসহ ZIP ডাউনলোড সম্পন্ন হয়েছে।`,
      downloadBtn: 'ডাউনলোড',
      convertingBtn: 'কনভার্ট হচ্ছে...',
      downloadedBtn: 'সম্পন্ন',
      retryBtn: 'আবার চেষ্টা করুন',
      removeAria: 'তালিকা থেকে সরান',
      statusReady: 'প্রস্তুত',
      statusDownloading: 'প্রসেসিং',
      statusCompleted: 'সম্পন্ন',
      statusError: 'ত্রুটি',
    },
    capabilities: {
      sectionLabel: 'কনভার্টার সক্ষমতা',
      heading: 'দ্রুত ও নির্ভুল মিডিয়া প্রসেসিংয়ের জন্য তৈরি',
      subheading:
        'সরাসরি ব্যাকএন্ড FFmpeg ও yt-dlp ইঞ্জিনের মাধ্যমে অডিও এবং ভিডিও ট্র্যাক নিখুঁতভাবে মার্জ ও কনভার্ট করা হয়।',
      items: [
        {
          index: '01.',
          title: 'বাল্ক মাল্টি-লিংক কিউ',
          spec: 'একবারে ২০+ লিংক',
          description:
            'একসাথে একাধিক ইউটিউব ভিডিও ও শর্টস লিংক পেস্ট করে এক ক্লিকে পুরো তালিকা প্রস্তুত ও পর্যায়ক্রমে ডাউনলোড করুন।',
        },
        {
          index: '02.',
          title: 'স্টুডিও মানের MP3 অডিও',
          spec: '128 / 192 / 320 kbps',
          description:
            'যেকোনো ভিডিও থেকে স্বচ্ছ অডিও ট্র্যাক আলাদা করে হাই-বিটরেট MP3 ফরম্যাটে সরাসরি সংরক্ষণ করুন।',
        },
        {
          index: '03.',
          title: 'Full HD MP4 মার্জিং',
          spec: '360p থেকে 1080p HD',
          description:
            'হাই-রেজুলেশন ভিডিও এবং অডিও স্ট্রিম একত্রে মার্জ করে ঝকঝকে MP4 ফাইল ডাউনলোড সুবিধা।',
        },
        {
          index: '04.',
          title: 'কোনো রেজিস্ট্রেশন নেই',
          spec: '১০০% বিনামূল্যে',
          description:
            'কোনো অ্যাকাউন্ট তৈরি, পাসওয়ার্ড বা সাবস্ক্রিপশন ছাড়াই ডেস্কটপ ও মোবাইল থেকে সরাসরি ব্যবহারযোগ্য।',
        },
      ],
    },
    support: {
      sectionLabel: 'সাপোর্ট ও ডেভলপার তথ্য',
      heading: 'যেকোনো সহায়তা বা কাস্টম প্রজেক্টের জন্য যোগাযোগ করুন',
      description:
        'লিংক কনভার্ট করতে কোনো সমস্যা হলে, সার্ভার সংক্রান্ত তথ্যের জন্য অথবা কাস্টম ওয়েবসাইট ও সফটওয়্যার তৈরি করতে নিচের মাধ্যমে যোগাযোগ করুন।',
      role: 'ফাউন্ডার ও ডেভলপার · Ashik Creative Studio',
      mobileLabel: 'মোবাইল নাম্বার',
      emailLabel: 'ইমেইল',
      websiteLabel: 'অফিসিয়াল ওয়েবসাইট',
      copied: 'কপি হয়েছে',
      copy: 'কপি',
      guideTitle: 'সাধারণ সমস্যার সমাধান ও ব্যবহার নির্দেশিকা',
      faqs: [
        {
          title: '১. লিংক কাজ না করলে কী করবেন?',
          body: 'নিশ্চিত করুন লিংকটি একটি পাবলিক ইউটিউব ভিডিও বা শর্টস লিংক এবং প্রতিটি লিংক নতুন লাইনে দেওয়া হয়েছে। প্রাইভেট বা বয়স-সীমাবদ্ধ ভিডিও ডাউনলোড করা যাবে না।',
        },
        {
          title: '২. একসাথে একাধিক ফাইল ডাউনলোড না হলে?',
          body: 'আপনার ব্রাউজারের অ্যাড্রেস বার থেকে "Allow Multiple Downloads" পারমিশন চালু রাখুন যেন সবগুলো ফাইল পর্যায়ক্রমে সংরক্ষিত হতে পারে।',
        },
        {
          title: '৩. ব্যবহার নির্দেশিকা ও কপিরাইট সতর্কতা',
          body: 'এই টুলটি শুধুমাত্র আপনার নিজের তৈরি ভিডিও, রয়্যালটি-ফ্রি বা অনুমোদিত কনটেন্ট ব্যাকআপ ও সংরক্ষণের জন্য ব্যবহার করুন এবং ইউটিউবের নীতিমালা মেনে চলুন।',
        },
      ],
    },
    footer: {
      rights: 'সর্বস্বত্ব সংরক্ষিত।',
      developedBy: 'ডেভলপ করেছেন',
      disclaimer: 'শুধুমাত্র ব্যক্তিগত ব্যাকআপ, নিজস্ব কনটেন্ট এবং রয়্যালটি-ফ্রি মিডিয়া সংরক্ষণের জন্য।',
    },
  },
  en: {
    nav: {
      converter: 'Converter',
      capabilities: 'Capabilities',
      guide: 'Guide',
      support: 'Contact',
      visitStudio: 'Official Site',
    },
    hero: {
      kicker: 'Ashik Creative Studio · Bulk YouTube Converter · Free Forever',
      titleStart: 'Convert Multiple YouTube Links to ',
      titleHighlight: 'MP3 & MP4',
      titleEnd: ' in One Batch',
      subtitle:
        'Paste one or more YouTube video or Shorts URLs below. Customize format and resolution per track or globally, then download cleanly.',
    },
    workspace: {
      inputLabel: 'YouTube Video Links (one per line)',
      inputHint: 'Supports Watch, Shorts, Live, and youtu.be URLs',
      placeholder:
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ\nhttps://youtu.be/aqz-KE-bpKQ\nhttps://www.youtube.com/shorts/...',
      pasteClipboard: 'Paste',
      loadSamples: 'Example Links',
      clearAll: 'Clear',
      formatLabel: 'Default Format',
      formatMp4: 'Video (MP4)',
      formatMp3: 'Audio (MP3)',
      qualityLabel: 'Resolution / Quality',
      prepareButton: 'Prepare Queue',
      preparingButton: 'Loading Metadata...',
      emptyError: 'Please paste at least one valid YouTube link.',
      invalidError: 'No valid YouTube URLs detected. Please check your links.',
      clipboardDenied: 'Clipboard access denied. Please paste directly using Ctrl+V.',
      preparedSuccess: (count, skipped) =>
        skipped > 0
          ? `${count} videos ready (${skipped} invalid lines skipped).`
          : `${count} videos loaded and ready for conversion.`,
    },
    queue: {
      heading: 'Conversion Queue',
      itemsUnit: 'videos',
      applyGlobal: 'Apply Default to All',
      downloadModeLabel: 'Output Mode:',
      modeIndividual: 'Individual Files',
      modeZip: 'Single ZIP',
      downloadAll: 'Download All',
      downloadZip: 'Download as ZIP',
      downloadingAll: 'Downloading Queue...',
      zipConverting: (done, total) => `Converting (${done}/${total})...`,
      zipPackaging: 'Creating ZIP archive...',
      zipSuccess: (count) => `Downloaded ZIP archive with ${count} converted files.`,
      downloadBtn: 'Download',
      convertingBtn: 'Converting...',
      downloadedBtn: 'Downloaded',
      retryBtn: 'Retry',
      removeAria: 'Remove from queue',
      statusReady: 'Ready',
      statusDownloading: 'Processing',
      statusCompleted: 'Completed',
      statusError: 'Error',
    },
    capabilities: {
      sectionLabel: 'Engine Capabilities',
      heading: 'Built for reliable batch audio & video conversion',
      subheading:
        'Powered directly by an integrated server-side yt-dlp and FFmpeg pipeline for clean muxing and bitrate accuracy.',
      items: [
        {
          index: '01.',
          title: 'Multi-Link Batch Queue',
          spec: '20+ links per batch',
          description:
            'Paste an entire list of YouTube videos or Shorts at once, inspect thumbnails and durations, and process them sequentially.',
        },
        {
          index: '02.',
          title: 'High-Bitrate MP3 Extraction',
          spec: '128 / 192 / 320 kbps',
          description:
            'Extract clean audio tracks directly from source streams and encode to standard, high, or studio 320 kbps MP3.',
        },
        {
          index: '03.',
          title: 'Full HD MP4 Video Muxing',
          spec: '360p up to 1080p HD',
          description:
            'Combine high-definition video and AAC audio streams seamlessly into universally compatible MP4 files.',
        },
        {
          index: '04.',
          title: 'Zero Account Friction',
          spec: 'No login required',
          description:
            'Open access without sign-ups, watermarks, or usage paywalls across desktop and mobile browsers.',
        },
      ],
    },
    support: {
      sectionLabel: 'Developer & Support',
      heading: 'Direct technical support & custom studio inquiries',
      description:
        'Need help troubleshooting a link, deploying custom media automation, or building a tailored web application? Reach out directly.',
      role: 'Founder & Developer · Ashik Creative Studio',
      mobileLabel: 'Mobile',
      emailLabel: 'Email',
      websiteLabel: 'Official Website',
      copied: 'Copied',
      copy: 'Copy',
      guideTitle: 'Troubleshooting & Usage Guidelines',
      faqs: [
        {
          title: '1. Why did a specific link fail to convert?',
          body: 'Ensure the URL points to a public YouTube video or Shorts clip and appears on its own line. Private, members-only, or age-restricted videos cannot be fetched.',
        },
        {
          title: '2. Multiple downloads blocked by browser?',
          body: 'When downloading a full queue at once, allow automatic multiple file downloads when prompted in your browser address bar.',
        },
        {
          title: '3. Responsible use & copyright notice',
          body: 'Use this converter solely for archiving your own studio uploads, Creative Commons clips, or authorized royalty-free content in accordance with YouTube Terms of Service.',
        },
      ],
    },
    footer: {
      rights: 'All rights reserved.',
      developedBy: 'Developed by',
      disclaimer: 'Intended for personal backups, creator archives, and royalty-free content.',
    },
  },
};
