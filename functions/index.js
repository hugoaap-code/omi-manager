const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors")({ origin: true });

/**
 * Omi API Proxy
 * This function proxies requests to api.omi.me to avoid CORS issues
 */
exports.omiProxy = onRequest((req, res) => {
    cors(req, res, async () => {
        // Allow GET requests only
        if (req.method !== "GET") {
            return res.status(405).json({ error: "Method not allowed" });
        }

        // Get the API token from headers
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: "Missing API token" });
        }

        try {
            // Get endpoint from path - req.path is /endpoint... 
            let subPath = req.path;
            if (subPath.startsWith('/')) subPath = subPath.substring(1);

            // Build the target URL
            const targetUrl = new URL(`https://api.omi.me/v1/dev/${subPath}`);

            // Forward query parameters
            Object.keys(req.query).forEach((key) => {
                targetUrl.searchParams.append(key, req.query[key]);
            });

            console.log(`[Omi Proxy] Fetching: ${targetUrl.toString()}`);

            // Make the request to Omi API
            const response = await fetch(targetUrl.toString(), {
                method: "GET",
                headers: {
                    "Authorization": authHeader,
                    "Content-Type": "application/json",
                },
            });

            // Get response body
            const data = await response.json();

            // Forward the status and response
            return res.status(response.status).json(data);
        } catch (error) {
            console.error("Proxy error:", error);
            return res.status(500).json({
                error: "Failed to fetch from Omi API",
                details: error.message,
            });
        }
    });
});
