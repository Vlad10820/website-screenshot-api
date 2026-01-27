# Website Screenshot API

A production-ready serverless API for capturing website screenshots, built with TypeScript, Puppeteer, and optimized for deployment on Vercel.

## Features

✅ **Serverless Architecture** - Runs on Vercel's edge network  
✅ **Optimized for Production** - Uses `@sparticuz/chromium` for Lambda/Vercel compatibility  
✅ **TypeScript** - Fully typed for better development experience  
✅ **Error Handling** - Comprehensive validation and error responses  
✅ **High Resolution** - Captures screenshots at 1920x1080  
✅ **Smart Loading** - Waits for network idle before capturing  

## Tech Stack

- **Runtime**: Node.js on Vercel Serverless Functions
- **Language**: TypeScript
- **Browser Automation**: `puppeteer-core`
- **Browser Binary**: `@sparticuz/chromium` (optimized for serverless)

## API Usage

### Endpoint

```
GET /api/screenshot?url=<target-url>
```

### Parameters

| Parameter | Type   | Required | Description                                    |
|-----------|--------|----------|------------------------------------------------|
| `url`     | string | Yes      | The URL of the website to capture (must include protocol) |

### Example Requests

```bash
# Capture Google homepage
curl "https://your-domain.vercel.app/api/screenshot?url=https://google.com" --output screenshot.png

# Capture GitHub
curl "https://your-domain.vercel.app/api/screenshot?url=https://github.com" --output github.png
```

### Success Response

**Status Code**: `200 OK`  
**Content-Type**: `image/png`  
**Body**: PNG image binary data

### Error Responses

**Missing URL Parameter**
```json
{
  "error": "Missing or invalid URL parameter",
  "message": "Please provide a valid URL using the ?url=... query parameter",
  "example": "/api/screenshot?url=https://google.com"
}
```
**Status Code**: `400 Bad Request`

**Invalid URL Format**
```json
{
  "error": "Invalid URL format",
  "message": "The provided URL must be a valid HTTP or HTTPS URL",
  "providedUrl": "invalid-url"
}
```
**Status Code**: `400 Bad Request`

**Page Load Timeout**
```json
{
  "error": "Page load timeout",
  "message": "The page took too long to load. Please try again or use a different URL."
}
```
**Status Code**: `504 Gateway Timeout`

**Internal Server Error**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred while taking the screenshot"
}
```
**Status Code**: `500 Internal Server Error`

## Local Development

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Google Chrome installed locally

### Setup

1. **Navigate to the project directory**
   ```bash
   cd website-screenshot-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3000/api/screenshot`

4. **Test the API locally**
   ```bash
   curl "http://localhost:3000/api/screenshot?url=https://google.com" --output test.png
   ```

   Or open in your browser:
   ```
   http://localhost:3000/api/screenshot?url=https://google.com
   ```

### Alternative: Using Vercel Dev

If you prefer to test with the Vercel runtime:

```bash
npm install -g vercel
npm run dev:vercel
```

On first run, Vercel will ask you to link the project. Choose "Link to existing project" or create a new one.

### Local vs Production Differences

| Aspect | Local Development | Production (Vercel) |
|--------|------------------|---------------------|
| Chrome Binary | Uses your local Chrome installation | Uses `@sparticuz/chromium` |
| Path Detection | Auto-detects based on OS (Windows/macOS/Linux) | Uses Lambda-compatible binary |
| Environment | `NODE_ENV=development` | `NODE_ENV=production` |

The code automatically detects the environment and uses the appropriate Chrome binary.

## Deployment to Vercel

### Option 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy to staging**
   ```bash
   vercel
   ```

4. **Deploy to production**
   ```bash
   npm run deploy
   # or
   vercel --prod
   ```

### Option 2: Using Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Vercel will auto-detect the configuration and deploy

### Post-Deployment

After deployment, your API will be available at:
```
https://your-project-name.vercel.app/api/screenshot?url=https://google.com
```

## Configuration

### Memory & Timeout Settings

The `vercel.json` file configures the function with:
- **Memory**: 3008 MB (3 GB) - Required for Chromium to run smoothly
- **Max Duration**: 30 seconds - Allows time for page loading

These settings are optimized for screenshot operations but stay within Vercel's free tier limits.

### Viewport Settings

Current viewport: **1920x1080**

To change the viewport size, edit the following in `api/screenshot.ts`:

```typescript
await page.setViewport({
  width: 1920,  // Change width here
  height: 1080, // Change height here
  deviceScaleFactor: 1,
});
```

### Loading Strategy

Current strategy: `networkidle0` (waits until no network connections for 500ms)

Alternative options:
- `load` - Waits for the `load` event
- `domcontentloaded` - Waits for DOMContentLoaded event
- `networkidle2` - Waits until no more than 2 network connections for 500ms

## Project Structure

```
website-screenshot-api/
├── api/
│   └── screenshot.ts       # Main API endpoint
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vercel.json            # Vercel deployment config
└── README.md              # This file
```

## Performance Tips

1. **Caching**: The API includes cache headers (`Cache-Control`) to cache responses for 24 hours
2. **Timeout**: Adjust the `timeout` in `page.goto()` if targeting slow websites
3. **Full Page**: Set `fullPage: true` in `page.screenshot()` to capture entire pages (be aware of performance impact)

## Troubleshooting

### "Out of memory" errors

Increase the memory allocation in `vercel.json`:
```json
"functions": {
  "api/**/*.ts": {
    "memory": 3008
  }
}
```

### "Timeout" errors

Increase the timeout in `api/screenshot.ts`:
```typescript
await page.goto(url, {
  waitUntil: 'networkidle0',
  timeout: 60000, // Increase to 60 seconds
});
```

### Local development Chrome path issues

Update the Chrome path in `api/screenshot.ts` to match your installation:
```typescript
const executablePath = isDev
  ? 'YOUR_CHROME_PATH_HERE'
  : await chromium.executablePath();
```

## Security Considerations

⚠️ **Rate Limiting**: Consider implementing rate limiting to prevent abuse  
⚠️ **URL Validation**: The API validates URLs, but consider adding a whitelist for production  
⚠️ **Resource Limits**: Vercel has execution time and memory limits - monitor usage  

## License

MIT

## Support

For issues or questions, please refer to the [Vercel Documentation](https://vercel.com/docs) or [Puppeteer Documentation](https://pptr.dev/).
