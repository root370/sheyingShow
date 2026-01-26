const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://cdn.rive.app/animations/289-568-planets.riv';
const dest = path.join(__dirname, '../public/rive/289-568-planets.riv');

const file = fs.createWriteStream(dest);

https.get(url, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close(() => {
      console.log('Download completed');
    });
  });
}).on('error', (err) => {
  fs.unlink(dest, () => {}); // Delete the file async. (But we don't check the result)
  console.error('Error downloading file:', err.message);
});
