import type { VercelRequest, VercelResponse } from '@vercel/node';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

/**
 * Validates if a string is a valid URL
 */
function isValidUrl(urlString: string): boolean {
    try {
        const url = new URL(urlString);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (error) {
        return false;
    }
}

/**
 * Main handler for the screenshot API
 */
export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    try {
        // Extract URL from query parameter
        const { url } = req.query;

        // Validate URL parameter exists
        if (!url || typeof url !== 'string') {
            return res.status(400).json({
                error: 'Missing or invalid URL parameter',
                message: 'Please provide a valid URL using the ?url=... query parameter',
                example: '/api/screenshot?url=https://google.com'
            });
        }

        // Validate URL format
        if (!isValidUrl(url)) {
            return res.status(400).json({
                error: 'Invalid URL format',
                message: 'The provided URL must be a valid HTTP or HTTPS URL',
                providedUrl: url
            });
        }

        // Determine the Chrome executable path
        // In production (Vercel), use @sparticuz/chromium
        // In local development, use your local Chrome installation
        const isDev = process.env.NODE_ENV === 'development';
        const executablePath = isDev
            ? process.platform === 'win32'
                ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
                : process.platform === 'darwin'
                    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
                    : '/usr/bin/google-chrome'
            : await chromium.executablePath();

        // Configure Chromium args for production
        const chromeArgs = isDev
            ? puppeteer.defaultArgs()
            : chromium.args;

        // Launch the browser
        const browser = await puppeteer.launch({
            args: chromeArgs,
            defaultViewport: chromium.defaultViewport,
            executablePath,
            headless: chromium.headless,
        });

        try {
            // Create a new page
            const page = await browser.newPage();

            // Set viewport to 1920x1080
            await page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
            });

            // Navigate to the URL and wait until network is idle
            await page.goto(url, {
                waitUntil: 'networkidle0',
                timeout: 30000, // 30 second timeout
            });

            // Take the screenshot
            const screenshot = await page.screenshot({
                type: 'png',
                fullPage: false, // Only capture viewport
            });

            // Close the browser
            await browser.close();

            // Set response headers and send the image
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // Cache for 24 hours
            res.setHeader('Content-Disposition', `inline; filename="screenshot-${Date.now()}.png"`);

            return res.status(200).send(screenshot);

        } catch (pageError: any) {
            // Close browser if still open
            await browser.close();

            throw pageError;
        }

    } catch (error: any) {
        console.error('Screenshot Error:', error);

        // Handle timeout errors
        if (error.message?.includes('timeout') || error.message?.includes('TimeoutError')) {
            return res.status(504).json({
                error: 'Page load timeout',
                message: 'The page took too long to load. Please try again or use a different URL.',
            });
        }

        // Handle navigation errors
        if (error.message?.includes('net::')) {
            return res.status(400).json({
                error: 'Navigation failed',
                message: 'Could not navigate to the specified URL. The site may be down or unreachable.',
            });
        }

        // Generic error response
        return res.status(500).json({
            error: 'Internal server error',
            message: 'An unexpected error occurred while taking the screenshot',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
