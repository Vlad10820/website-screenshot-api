# Website Screenshot API

A serverless API, written in **TypeScript**, that takes a screenshot of any web page and returns it as a PNG image. It runs headless Chrome (Puppeteer) inside a Vercel serverless function, so there is no server to manage.

## Why I built it

Link previews, website monitoring, archiving and reports all need an image of a web page. Running a browser yourself is heavy, so I wanted one URL you can call from anywhere: send a link, get back a picture.

## How it works

1. The API checks that `url` is present and is a real `http` or `https` address.
2. It starts a headless Chromium browser and opens the page at 1920 x 1080.
3. It waits until the page has stopped loading network requests, so images and fonts are in place.
4. It returns the PNG and tells the CDN to cache it for 24 hours.
5. The browser is always closed afterwards, even when the page fails to load.

## Run it locally

You need Node.js 18 or newer and Google Chrome installed.

```bash
npm install
npm run dev
```

The API is now at `http://localhost:3000/api/screenshot`. Locally it uses your own Chrome; on Vercel it switches automatically to a slimmed down Chromium built for serverless.

## Sample request and response

```bash
curl "http://localhost:3000/api/screenshot?url=https://github.com" --output github.png
```

Success: `200 OK`, `Content-Type: image/png`, and the body is a 1920 x 1080 PNG.

When the input is wrong, the API explains what to fix:

```bash
curl "http://localhost:3000/api/screenshot?url=github"
```

```json
{
  "error": "Invalid URL format",
  "message": "The provided URL must be a valid HTTP or HTTPS URL",
  "providedUrl": "github"
}
```

| Status | When |
|---|---|
| `200` | Screenshot captured |
| `400` | `url` is missing, not a valid http(s) URL, or the site cannot be reached |
| `504` | The page took longer than 30 seconds to load |
| `500` | Any other unexpected error |

## A problem I solved

**Running Chrome inside a serverless function.** Regular Puppeteer downloads a full Chrome of around 300 MB, which is far over Vercel's function size limit, and it crashes in the Lambda environment. I switched to `puppeteer-core` with `@sparticuz/chromium`, a compressed Chromium made for AWS Lambda and Vercel, and gave the function 2 GB of memory and a 30 second limit in `vercel.json`. Because that build does not run on a normal laptop, the code detects development mode and uses the local Chrome instead, so the same file works both locally and in production. I also wrote a small `dev-server.js` so the API can be tested without installing the Vercel CLI.

## Deploy to Vercel

```bash
npm install -g vercel
vercel login
npm run deploy
```

Or import the repository at [vercel.com/new](https://vercel.com/new). The settings in `vercel.json` are picked up automatically.

## Project structure

```
api/screenshot.ts   # The API endpoint (Vercel serverless function)
dev-server.js       # Local server that runs the endpoint without the Vercel CLI
vercel.json         # Memory and timeout settings for the function
tsconfig.json       # TypeScript settings
```

## Ideas for next steps

- Optional `width`, `height` and `fullPage` parameters.
- Rate limiting and an API key, so a public deployment cannot be abused.
- Blocking private and internal addresses (such as `localhost`) as targets.

## Tech stack

TypeScript, Node.js, Puppeteer, @sparticuz/chromium, Vercel Serverless Functions.

## License

MIT
