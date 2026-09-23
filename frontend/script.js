// ===== 3. TOOLS (THE HANDS) — 5 TOOLS =====
async function handleTools(text) {
    const t = text.toLowerCase().trim();

    // 1. TIME
    if (
        /\btime\b/.test(t) ||
        t.includes("సమయం") ||
        t.includes("టైమ్")
    ) {
        return "The time is " + new Date().toLocaleTimeString() + ", Boss.";
    }

    // 2. WEATHER
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
                            throw new Error("Weather API failed");
                        }

                        const data = await response.json();

                        if (!data.current_weather) {
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

                () => {
                    resolve(
                        "I need location permission for weather, Boss."
                    );
                }
            );
        });
    }

    // 3. TIMER
    const timerMatch = t.match(
        /(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/i
    );

    if (
        (t.includes("timer") ||
            t.includes("టైమర్") ||
            t.includes("alarm")) &&
        timerMatch
    ) {
        const amount = parseInt(timerMatch[1], 10);
        const unit = timerMatch[2].toLowerCase();

        let factor;

        if (/^(hours?|hrs?)$/i.test(unit)) {
            factor = 60 * 60 * 1000;
        } else if (/^(seconds?|secs?)$/i.test(unit)) {
            factor = 1000;
        } else {
            factor = 60 * 1000;
        }

        const duration = amount * factor;

        setTimeout(() => {
            const message =
                `Timer finished! ${amount} ${unit} is over, Boss.`;

            if (typeof speak === "function") {
                speak(message);
            }

            console.log(message);

        }, duration);

        return `Timer set for ${amount} ${unit}, Boss.`;
    }

    // 4. TRANSLATE
    if (
        t.includes("translate") ||
        t.includes("తెలుగులోకి అనువదించు") ||
        t.includes("తెలుగులోకి")
    ) {
        let query = text
            .replace(/^translate\s*(this)?\s*/i, "")
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
                throw new Error("Translation API failed");
            }

            const data = await response.json();

            if (
                !data.responseData ||
                !data.responseData.translatedText
            ) {
                throw new Error("Translation unavailable");
            }

            return (
                "In Telugu: " +
                data.responseData.translatedText
            );

        } catch (error) {
            console.error("Translation error:", error);
            return "Translation service error, Boss.";
        }
    }

    // 5. YOUTUBE PLAY / SEARCH
    if (
        t.includes("play ") ||
        t.startsWith("youtube ") ||
        t.includes("youtube search ")
    ) {
        let query = text
            .replace(/^play\s+/i, "")
            .replace(/^youtube\s+search\s+/i, "")
            .replace(/^youtube\s+/i, "")
            .trim();

        if (!query) {
            return "What should I search on YouTube, Boss?";
        }

        const youtubeURL =
            "https://www.youtube.com/results?search_query=" +
            encodeURIComponent(query);

        window.open(youtubeURL, "_blank");

        return `Searching YouTube for ${query}, Boss.`;
    }

    // No tool matched
    return null;
}
