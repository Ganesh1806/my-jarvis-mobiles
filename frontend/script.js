// ===== 3. TOOLS (THE HANDS) — 5 TOOLS =====
async function handleTools(text) {
    const t = String(text || "").trim().toLowerCase();

    // --------------------------------------------------
    // 1. TIME
    // --------------------------------------------------
    if (
        /\btime\b/.test(t) ||
        t.includes("what time") ||
        t.includes("టైమ్") ||
        t.includes("సమయం")
    ) {
        return "The time is " + new Date().toLocaleTimeString() + ", Boss.";
    }

    // --------------------------------------------------
    // 2. WEATHER
    // --------------------------------------------------
    if (
        t.includes("weather") ||
        t.includes("వాతావరణం") ||
        t.includes("వెదర్")
    ) {
        return await new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve("Geolocation is not supported by this browser, Boss.");
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const latitude = position.coords.latitude;
                        const longitude = position.coords.longitude;

                        const url =
                            `https://api.open-meteo.com/v1/forecast` +
                            `?latitude=${latitude}` +
                            `&longitude=${longitude}` +
                            `&current_weather=true`;

                        const response = await fetch(url);

                        if (!response.ok) {
                            throw new Error(
                                `Weather API error: ${response.status}`
                            );
                        }

                        const data = await response.json();

                        if (
                            !data.current_weather ||
                            typeof data.current_weather.temperature === "undefined"
                        ) {
                            throw new Error("Weather data unavailable");
                        }

                        const temperature =
                            data.current_weather.temperature;

                        resolve(
                            `It is ${temperature} degrees Celsius now, Boss.`
                        );
                    } catch (error) {
                        console.error("Weather error:", error);
                        resolve("Weather service error, Boss.");
                    }
                },
                (error) => {
                    console.error("Location error:", error);

                    resolve(
                        "I need location permission to check the weather, Boss."
                    );
                },
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        });
    }

    // --------------------------------------------------
    // 3. TIMER
    // --------------------------------------------------
    const timerMatch = t.match(
        /(\d+(?:\.\d+)?)\s*(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h)\b/i
    );

    if (
        (t.includes("timer") ||
            t.includes("set timer") ||
            t.includes("టైమర్")) &&
        timerMatch
    ) {
        const amount = Number(timerMatch[1]);
        const unit = timerMatch[2].toLowerCase();

        if (!Number.isFinite(amount) || amount <= 0) {
            return "Please give me a valid timer duration, Boss.";
        }

        let factor = 60000;
        let displayUnit = "minutes";

        if (/^(hours?|hrs?|h)$/i.test(unit)) {
            factor = 60 * 60 * 1000;
            displayUnit = amount === 1 ? "hour" : "hours";
        } else if (/^(seconds?|secs?|s)$/i.test(unit)) {
            factor = 1000;
            displayUnit = amount === 1 ? "second" : "seconds";
        } else {
            factor = 60000;
            displayUnit = amount === 1 ? "minute" : "minutes";
        }

        const duration = amount * factor;

        const timerId = setTimeout(() => {
            try {
                speak(
                    `Timer finished! ${amount} ${displayUnit} completed, Boss.`
                );
            } catch (error) {
                console.error("Speech error:", error);
            }
        }, duration);

        // If timerIds exists in your main script, store the ID.
        if (typeof timerIds !== "undefined" && Array.isArray(timerIds)) {
            timerIds.push(timerId);
        }

        return `Timer set for ${amount} ${displayUnit}, Boss.`;
    }

    // --------------------------------------------------
    // 4. TRANSLATE
    // --------------------------------------------------
    if (
        t.includes("translate") ||
        t.includes("తెలుగులోకి అనువదించు")
    ) {
        let query = text
            .replace(/^translate\s*(this\s*)?/i, "")
            .replace(/^తెలుగులోకి\s*అనువదించు\s*/i, "")
            .trim();

        if (!query) {
            return "Please tell me what you want me to translate, Boss.";
        }

        try {
            const url =
                "https://api.mymemory.translated.net/get" +
                "?q=" +
                encodeURIComponent(query) +
                "&langpair=en|te";

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `Translation API error: ${response.status}`
                );
            }

            const data = await response.json();

            const translatedText =
                data?.responseData?.translatedText;

            if (!translatedText) {
                return "I could not translate that, Boss.";
            }

            return "In Telugu: " + translatedText;
        } catch (error) {
            console.error("Translation error:", error);
            return "Translation service error, Boss.";
        }
    }

    // --------------------------------------------------
    // 5. YOUTUBE SEARCH
    // --------------------------------------------------
    if (
        t.includes("youtube") ||
        t.startsWith("play ") ||
        t.startsWith("ప్లే ")
    ) {
        let query = text
            .replace(/^play\s+/i, "")
            .replace(/^youtube\s+(search\s+)?/i, "")
            .replace(/^ప్లే\s+/i, "")
            .trim();

        if (!query) {
            return "Please tell me what you want to search on YouTube, Boss.";
        }

        const youtubeURL =
            "https://www.youtube.com/results?search_query=" +
            encodeURIComponent(query);

        window.open(youtubeURL, "_blank");

        return `Searching YouTube for ${query}, Boss.`;
    }

    // --------------------------------------------------
    // NO TOOL MATCH
    // --------------------------------------------------
    return null;
}
