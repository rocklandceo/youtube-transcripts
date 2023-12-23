const fs = require('fs');
const readline = require('readline');
const YoutubeMp3Downloader = require('youtube-mp3-downloader');
const { Deepgram } = require('@deepgram/sdk');
const { webvtt } = require('@deepgram/captions');
const ffmpeg = require('ffmpeg-static');

require('dotenv').config();
const deepgram = new Deepgram(process.env.DG_KEY);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function downloadAndProcessVideo() {
  rl.question('Please enter the YouTube URL: ', (url) => {
    const videoId = url.split('v=')[1].split('&')[0];

    const YD = new YoutubeMp3Downloader({
      ffmpegPath: ffmpeg,
      outputPath: './',
      youtubeVideoQuality: 'highestaudio'
    });

    YD.download(videoId);

    YD.on('progress', data => {
      console.log(`${data.progress.percentage}% downloaded`);
    });

    YD.on('finished', async (err, video) => {
      const videoFileName = video.file;
      console.log(`Downloaded ${videoFileName}`);

      const file = {
        buffer: fs.readFileSync(videoFileName),
        mimetype: 'audio/mp3'
      };
      const options = {
        punctuate: true,
        utterances: true,
      };

      try {
        const result = await deepgram.transcription.preRecorded(file, options);
        const formattedCaptions = webvtt(result); // For WebVTT format

        fs.writeFileSync(`${videoFileName}.vtt`, formattedCaptions);
        console.log(`Wrote ${videoFileName}.vtt`);
      } catch (e) {
        console.log(e);
      }

      fs.unlinkSync(videoFileName);
      // Instead of closing readline, call the function again
      downloadAndProcessVideo();
    });
  });
}

// Start the process
downloadAndProcessVideo();
