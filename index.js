const fs = require('fs');
const readline = require('readline'); // Import readline module
const YoutubeMp3Downloader = require('youtube-mp3-downloader');
const { Deepgram } = require('@deepgram/sdk');
const ffmpeg = require('ffmpeg-static');

require('dotenv').config();
const deepgram = new Deepgram(process.env.DG_KEY);

// Create a readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt the user to enter the YouTube URL
rl.question('Please enter the YouTube URL: ', (url) => {
  // Extract the video ID from the URL
  const videoId = url.split('v=')[1].split('&')[0];

  const YD = new YoutubeMp3Downloader({
    ffmpegPath: ffmpeg,
    outputPath: './',
    youtubeVideoQuality: 'highestaudio'
  });

    // Use the extracted video ID
    YD.download(videoId);

  YD.on('progress', data => {
    console.log(data.progress.percentage + '% downloaded');
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
    // console.log(result.toWebVTT())

    const result = await deepgram.transcription.preRecorded(file, options).catch(e => console.log(e));
    const transcript = result.results.channels[0].alternatives[0].transcript;

    fs.writeFileSync(`${videoFileName}.txt`, transcript, () => `Wrote ${videoFileName}.txt`, result.toWebVTT());
    fs.unlinkSync(videoFileName);

    // Close the readline interface
    rl.close();
  });
});
