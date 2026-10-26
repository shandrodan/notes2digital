# Notes to Digital

A small web app and public landing that turns photos of handwritten notes into one Markdown document, then into flashcards.

Live: [notes2digital.vercel.app](https://notes2digital.vercel.app)

Portfolio project by [Dan Shandro](https://danshandro.com), design engineer and product designer.

## Who it's for

Students and anyone who photographs lecture or study notes and wants them as editable Markdown (the transcription is written for tools like Notion). After conversion, the same page can generate vocabulary, terminology, or quiz flashcards from that text.

You supply your own OpenAI API key. It is saved in the browser and sent with each request. The app does not keep a database of keys or notes.

## Stack

- Next.js 15 (App Router) and React 18, in JavaScript
- Node.js route handlers call the OpenAI API
- npm (`package-lock.json`)

Node.js 18.18+, 19.8+, or 20+ (the range required by Next.js 15.4).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Save an API key on the page, add images, reorder them, then convert.

```bash
npm run build   # production build
npm start       # serve the build
npm run lint
```

No environment file is required.

## Project structure

```
src/app/page.js                   Product page: upload, reorder, convert, flashcards
src/app/layout.js                 Root layout and metadata
src/app/globals.css               Global styles
src/app/api/process/route.js      Images → Markdown
src/app/api/flashcards/route.js   Markdown → flashcards
public/                           Static assets
```

`/api/process` accepts the page images in order (JPEG, PNG, HEIC, and other image types) and returns Markdown. `/api/flashcards` reads that note and returns cards in the selected focus and direction.
