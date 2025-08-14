# Interactive Question Bank

A colorful, mobile-friendly question bank that loads questions from **Google Sheets** and runs on **GitHub Pages**.

Live after deploy: `https://sarimi5565.github.io/interactive-question-bank/`

## ✨ Features
- Search + dropdown filters (Topic, Subtopic, Difficulty)
- Click to reveal solutions with **text 📝**, **images 🖼️**, **video 🎥**
- **MathJax** for LaTeX equations
- Icons for content types
- Pagination (12 per page)
- Fast: CSV fetched once, then filtered client-side

## 🗂 Google Sheet format
Headers (case-insensitive friendly):
```
id | question_text | question_images | question_image | topic | subtopic | tags | difficulty | solution_text | solution_images | solution_image | video_url | solution_video_url
```
- `tags` comma-separated
- `*_images` can be comma-separated URLs
- `video_url` accepts full YouTube URL or just the video id

## 🚀 Deploy on GitHub Pages
1. Create a new repo named **interactive-question-bank**
2. Upload these files (`index.html`, `style.css`, `script.js`, `README.md`)
3. In repo **Settings → Pages**, set **Branch** to `main` and **root** folder
4. Open: `https://sarimi5565.github.io/interactive-question-bank/`

## ⚙️ Change the data source
The Google Sheet CSV link is hardcoded in `index.html` (global `IQB_SHEET_CSV`) and read by `script.js`.
Update this constant if you change your sheet:
```
https://docs.google.com/spreadsheets/d/e/2PACX-1vSmH8dnXMAAwO35j4g0o8mWHnatyeC5CSQ08fwuhJFzU-hXsYBQ3pRAp1hGgdpNLWlKHo2qlATIuU1H/pub?output=csv
```

## 🧪 Troubleshooting
- If you open the file as `file:///.../index.html`, fetching the CSV **won't work** (CORS). Host on GitHub Pages or run a local server.
- After changing the sheet, refresh the page to re-fetch data (session cache = 30 minutes).

Enjoy! 🎉
