// ============================================================
// J.A.R.V.I.S — TOOLS (THE HANDS) — 15 TOOLS
// Replace your old handleTools() with this entire block.
// ============================================================

async function handleTools(text) {
    const original = String(text || "").trim();
    const t = original.toLowerCase().trim();

    if (!t) return null;

    // ----------------------------------------------------------
    // Helper: speak without crashing if speak() is unavailable
    // ----------------------------------------------------------
    function jarvisSpeak(message) {
        try {
            if (typeof speak === "function") {
                speak(message);
            }
        } catch (err) {
            console.error("Speak error:", err);
        }
    }

    // ==========================================================
    // 1. TIME
    // Commands:
    // "what is the time"
    // "time"
    // "సమయం"
    // ==========================================================
    if (
        /\btime\b/i.test(t) ||
        t.includes("సమయం")
    ) {
        const now = new Date();

        const time = now.toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });

        return `The time is ${time}, Boss.`;
    }

    // ==========================================================
    // 2. DATE
    // Commands:
    // "what is today's date"
    // "date"
    // "today"
    // "తేదీ"
    // ==========================================================
    if (
        /\bdate\b/i.test(t) ||
        t.includes("today") ||
        t.includes("తేదీ")
    ) {
        const now = new Date();

        const date = now.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        return `Today is ${date}, Boss.`;
    }

    // ==========================================================
    // 3. WEATHER
    // Uses browser location + Open-Meteo
    // Commands:
    // "weather"
    // "weather now"
    // "వాతావరణం"
    // ==========================================================
    if (
        t.includes("weather") ||
        t.includes("వాతావరణం")
    ) {
        if (!navigator.geolocation) {
            return "Geolocation is not supported by this browser, Boss.";
        }

        return await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const latitude = position.coords.latitude;
                        const longitude = position.coords.longitude;

                        const url =
                            "https://api.open-meteo.com/v1/forecast" +
                            `?latitude=${encodeURIComponent(latitude)}` +
                            `&longitude=${encodeURIComponent(longitude)}` +
                            "&current=temperature_2m,relative_humidity_2m,wind_speed_10m" +
                            "&timezone=auto";

                        const response = await fetch(url);

                        if (!response.ok) {
                            throw new Error(
                                `Weather API error: ${response.status}`
                            );
                        }

                        const data = await response.json();

                        if (!data.current) {
                            throw new Error("Weather data missing");
                        }

                        const temperature = data.current.temperature_2m;
                        const humidity = data.current.relative_humidity_2m;
                        const wind = data.current.wind_speed_10m;

                        resolve(
                            `Current temperature is ${temperature} degrees Celsius, ` +
                            `humidity is ${humidity} percent, ` +
                            `and wind speed is ${wind} kilometers per hour, Boss.`
                        );
                    } catch (error) {
                        console.error("Weather error:", error);
                        resolve("Weather service error, Boss.");
                    }
                },

                (error) => {
                    console.error("Location permission error:", error);

                    if (error.code === 1) {
                        resolve(
                            "Location permission was denied. Please allow location access for weather, Boss."
                        );
                    } else {
                        resolve(
                            "I could not get your location for weather, Boss."
                        );
                    }
                },

                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        });
    }

    // ==========================================================
    // 4. TIMER
    // Commands:
    // "set timer for 10 seconds"
    // "timer 5 minutes"
    // "10 minutes timer"
    // "టైమర్ 10 seconds"
    // ==========================================================
    const timerMatch = t.match(
        /(?:timer(?:\s+(?:for|of))?\s*)?(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/i
    );

    if (
        timerMatch &&
        (
            t.includes("timer") ||
            t.includes("టైమర్")
        )
    ) {
        const amount = parseInt(timerMatch[1], 10);
        const unit = timerMatch[2].toLowerCase();

        let multiplier = 60000;

        if (/^(hours?|hrs?)$/i.test(unit)) {
            multiplier = 60 * 60 * 1000;
        } else if (/^(seconds?|secs?)$/i.test(unit)) {
            multiplier = 1000;
        }

        const duration = amount * multiplier;

        setTimeout(() => {
            const message =
                `Timer complete. Your ${amount} ${unit} timer is finished, Boss.`;

            jarvisSpeak(message);

            console.log("JARVIS TIMER:", message);
        }, duration);

        return `Timer set for ${amount} ${unit}, Boss.`;
    }

    // ==========================================================
    // 5. TRANSLATE ENGLISH -> TELUGU
    // Commands:
    // "translate hello"
    // "translate this good morning"
    // ==========================================================
    if (
        t.startsWith("translate ") ||
        t === "translate"
    ) {
        const q = original
            .replace(/^translate\s*(this\s*)?/i, "")
            .trim();

        if (!q) {
            return "Please tell me what you want me to translate, Boss.";
        }

        try {
            const url =
                "https://api.mymemory.translated.net/get" +
                `?q=${encodeURIComponent(q)}` +
                "&langpair=en|te";

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `Translation API error: ${response.status}`
                );
            }

            const data = await response.json();

            const translated =
                data?.responseData?.translatedText;

            if (!translated) {
                throw new Error("Translation missing");
            }

            return `In Telugu: ${translated}`;
        } catch (error) {
            console.error("Translation error:", error);
            return "Translate service error, Boss.";
        }
    }

    // ==========================================================
    // 6. YOUTUBE SEARCH
    // Commands:
    // "play arijit singh"
    // "youtube kgf songs"
    // "youtube search java"
    // ==========================================================
    if (
        t.startsWith("play ") ||
        t.startsWith("youtube ") ||
        t.startsWith("youtube search ")
    ) {
        let query = original
            .replace(/^youtube\s+search\s+/i, "")
            .replace(/^youtube\s+/i, "")
            .replace(/^play\s+/i, "")
            .trim();

        if (!query) {
            return "Please tell me what you want to search on YouTube, Boss.";
        }

        const url =
            "https://www.youtube.com/results?search_query=" +
            encodeURIComponent(query);

        window.open(url, "_blank", "noopener,noreferrer");

        return `Searching YouTube for ${query}, Boss.`;
    }

    // ==========================================================
    // 7. GOOGLE SEARCH
    // Commands:
    // "search docker"
    // "google kubernetes"
    // "search for jobs"
    // ==========================================================
    if (
        t.startsWith("search ") ||
        t.startsWith("search for ") ||
        t.startsWith("google ")
    ) {
        let query = original
            .replace(/^search\s+for\s+/i, "")
            .replace(/^search\s+/i, "")
            .replace(/^google\s+/i, "")
            .trim();

        if (!query) {
            return "Please tell me what you want me to search, Boss.";
        }

        const url =
            "https://www.google.com/search?q=" +
            encodeURIComponent(query);

        window.open(url, "_blank", "noopener,noreferrer");

        return `Searching Google for ${query}, Boss.`;
    }

    // ==========================================================
    // 8. OPEN WEBSITE
    // Commands:
    // "open youtube"
    // "open gmail"
    // "open github.com"
    // ==========================================================
    if (t.startsWith("open ")) {
        const siteInput = original
            .replace(/^open\s+/i, "")
            .trim()
            .toLowerCase();

        const sites = {
            youtube: "https://www.youtube.com",
            gmail: "https://mail.google.com",
            google: "https://www.google.com",
            facebook: "https://www.facebook.com",
            instagram: "https://www.instagram.com",
            whatsapp: "https://web.whatsapp.com",
            github: "https://github.com",
            chatgpt: "https://chatgpt.com",
            amazon: "https://www.amazon.in",
            flipkart: "https://www.flipkart.com",
            linkedin: "https://www.linkedin.com",
            canva: "https://www.canva.com"
        };

        let url = sites[siteInput];

        if (!url) {
            if (/^https?:\/\//i.test(siteInput)) {
                url = siteInput;
            } else if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(siteInput)) {
                url = "https://" + siteInput;
            } else {
                url =
                    "https://www.google.com/search?q=" +
                    encodeURIComponent(siteInput);
            }
        }

        window.open(url, "_blank", "noopener,noreferrer");

        return `Opening ${siteInput}, Boss.`;
    }

    // ==========================================================
    // 9. CALCULATOR
    // Commands:
    // "calculate 25 * 5"
    // "calc 100 / 4"
    // "what is 20 plus 30"
    // ==========================================================
    if (
        t.startsWith("calculate ") ||
        t.startsWith("calc ") ||
        t.startsWith("solve ")
    ) {
        let expression = original
            .replace(/^calculate\s+/i, "")
            .replace(/^calc\s+/i, "")
            .replace(/^solve\s+/i, "")
            .trim();

        expression = expression
            .replace(/\bplus\b/gi, "+")
            .replace(/\bminus\b/gi, "-")
            .replace(/\btimes\b/gi, "*")
            .replace(/\bmultiplied by\b/gi, "*")
            .replace(/\bdivided by\b/gi, "/")
            .replace(/\bover\b/gi, "/")
            .replace(/\bmod\b/gi, "%")
            .replace(/\^/g, "**");

        // Only allow mathematical characters.
        if (!/^[0-9+\-*/%().\s*]+$/.test(expression)) {
            return "I could not understand that calculation, Boss.";
        }

        try {
            // Safe here because expression was strictly filtered.
            const result = Function(
                `"use strict"; return (${expression});`
            )();

            if (!Number.isFinite(result)) {
                return "That calculation does not produce a valid number, Boss.";
            }

            return `The answer is ${result}, Boss.`;
        } catch (error) {
            console.error("Calculator error:", error);
            return "Calculator error, Boss.";
        }
    }

    // ==========================================================
    // 10. BATTERY
    // Commands:
    // "battery"
    // "battery status"
    // "how much battery"
    // ==========================================================
    if (
        t.includes("battery")
    ) {
        try {
            if (!navigator.getBattery) {
                return "Battery information is not supported by this browser, Boss.";
            }

            const battery = await navigator.getBattery();

            const level = Math.round(battery.level * 100);
            const charging = battery.charging;

            return charging
                ? `Battery is ${level} percent and currently charging, Boss.`
                : `Battery is ${level} percent and not charging, Boss.`;

        } catch (error) {
            console.error("Battery error:", error);
            return "I could not read the battery status, Boss.";
        }
    }

    // ==========================================================
    // 11. LOCATION
    // Commands:
    // "my location"
    // "where am I"
    // "location"
    // ==========================================================
    if (
        t.includes("my location") ||
        t.includes("where am i") ||
        t === "location" ||
        t.includes("లొకేషన్")
    ) {
        if (!navigator.geolocation) {
            return "Geolocation is not supported by this browser, Boss.";
        }

        return await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude.toFixed(6);
                    const lon = position.coords.longitude.toFixed(6);

                    resolve(
                        `Your coordinates are latitude ${lat} and longitude ${lon}, Boss.`
                    );
                },

                (error) => {
                    console.error("Location error:", error);

                    resolve(
                        "I could not access your location. Please allow location permission, Boss."
                    );
                },

                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }

    // ==========================================================
    // 12. INTERNET STATUS
    // Commands:
    // "internet status"
    // "am I online"
    // "internet"
    // ==========================================================
    if (
        t.includes("internet status") ||
        t.includes("am i online") ||
        t === "internet"
    ) {
        return navigator.onLine
            ? "Internet connection is online, Boss."
            : "Internet connection appears to be offline, Boss.";
    }

    // ==========================================================
    // 13. RANDOM JOKE
    // Commands:
    // "tell me a joke"
    // "joke"
    // ==========================================================
    if (
        t.includes("tell me a joke") ||
        t === "joke" ||
        t.includes("joke")
    ) {
        try {
            const response = await fetch(
                "https://v2.jokeapi.dev/joke/Any?safe-mode&type=single"
            );

            if (!response.ok) {
                throw new Error("Joke API failed");
            }

            const data = await response.json();

            if (!data.joke) {
                throw new Error("Joke missing");
            }

            return data.joke;
        } catch (error) {
            console.error("Joke error:", error);
            return "My joke service is unavailable right now, Boss.";
        }
    }

    // ==========================================================
    // 14. COPY TO CLIPBOARD
    // Commands:
    // "copy hello boss"
    // ==========================================================
    if (t.startsWith("copy ")) {
        const content = original
            .replace(/^copy\s+/i, "")
            .trim();

        if (!content) {
            return "There is nothing to copy, Boss.";
        }

        try {
            if (!navigator.clipboard) {
                return "Clipboard access is not available in this browser, Boss.";
            }

            await navigator.clipboard.writeText(content);

            return "Copied to clipboard, Boss.";
        } catch (error) {
            console.error("Clipboard error:", error);

            return "Clipboard permission is blocked. Use HTTPS or localhost, Boss.";
        }
    }

    // ==========================================================
    // 15. SYSTEM / BROWSER INFO
    // Commands:
    // "system info"
    // "browser info"
    // "device info"
    // ==========================================================
    if (
        t.includes("system info") ||
        t.includes("browser info") ||
        t.includes("device info")
    ) {
        const browser = navigator.userAgent;
        const platform = navigator.platform || "Unknown";
        const cores = navigator.hardwareConcurrency || "Unknown";
        const memory = navigator.deviceMemory
            ? `${navigator.deviceMemory} GB`
            : "Unknown";

        return (
            `Platform: ${platform}. ` +
            `CPU threads: ${cores}. ` +
            `Memory: ${memory}. ` +
            `Online: ${navigator.onLine ? "Yes" : "No"}.`
        );
    }

    // ==========================================================
    // NO TOOL MATCHED
    // Send this command to Gemini Brain
    // ==========================================================
    return null;
}async function processCommand(userText) {
    try {
        const toolResult = await handleTools(userText);

        // A tool handled the command
        if (toolResult !== null) {
            console.log("JARVIS TOOL:", toolResult);

            if (typeof speak === "function") {
                speak(toolResult);
            }

            return toolResult;
        }

        // No tool matched -> Gemini Brain
        const geminiReply = await askGemini(userText);

        if (typeof speak === "function") {
            speak(geminiReply);
        }

        return geminiReply;

    } catch (error) {
        console.error("JARVIS command error:", error);

        const message = "Something went wrong, Boss.";

        if (typeof speak === "function") {
            speak(message);
        }

        return message;
    }
}
