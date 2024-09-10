const fs = require('fs');
const path = require('path');
const https = require('https');
const csv = require('csv-parser');

const wpDomain = 'waytoidea.com';
const postsDir = path.join(process.cwd(), 'posts');

if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir);
}

fs.createReadStream('exported-urls.csv')
  .pipe(csv())
  .on('data', (row) => {
    const slug = row.url.split('/').filter(Boolean).pop();
    const apiUrl = `https://${wpDomain}/wp-json/wp/v2/posts?slug=${slug}`;

    https.get(apiUrl, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const post = JSON.parse(data)[0];
        if (post) {
          const content = `---
title: "${post.title.rendered}"
date: "${post.date}"
---

${post.content.rendered}`;

          fs.writeFileSync(path.join(postsDir, `${slug}.md`), content);
          console.log(`Fetched: ${slug}`);
        }
      });
    }).on('error', (err) => {
      console.error(`Error fetching ${slug}: ${err.message}`);
    });
  });
