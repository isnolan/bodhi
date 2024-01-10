export namespace file {
  export type Type = 'image' | 'audio' | 'video' | 'file' | 'inline_data' | 'file_data';

  export type MimeType = [
    // image:, less than 20MB
    'image/png',
    'image/jpeg',

    // video: less than 2 minutes
    'video/mov',
    'video/mpeg',
    'video/mp4',
    'video/mpg',
    'video/avi',
    'video/wmv',
    'video/mpegps',
    'video/flv',
  ];
}
