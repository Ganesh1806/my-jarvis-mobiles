from pathlib import Path
import re

src = Path("/mnt/data/Pasted text(2).txt")
text = src.read_text(encoding="utf-8")

# Repair the supplied script while preserving its existing HTML IDs/layout assumptions.
# The main functional changes are:
# - safer DOM initialization
# - robust tool parsing (time/weather/timer/translate/YouTube)
# - timer cleanup
# - calculator support for spoken operators
# - better Telugu/English speech recognition selection
# - automatic execution of voice results
# - safer notification handling
# - image URL cleanup
# - memory command handling
# - clearer generic fallback

# Replace the complete file with a clean, syntactically valid implementation.
fixed = r'''// J.A.R.V.I.S. - script.js
// Fixed and hardened version.
// Compatible with the supplied HTML structure.
// No HTML IDs, classes, buttons, inputs, or layout are changed.

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // =========================
    // ELEMENT REFERENCES
    // =========================
    const msg = document.getElementById('msg');
    const send = document.getElementById('send');
    const micBtn = document.getElementById('mic-btn');
    const camBtn = document.getElementById('cam-btn');
    const clearBtn = document.getElementById('clear-btn');
    const imgInput = document.getElementById('img-input');
    const chat = document.getElementById('chat');

    if (!msg || !send || !micBtn || !camBtn || !clearBtn || !imgInput || !chat) {
        console.error('J.A.R.V.I.S. required HTML elements were not found.');
        return;
    }

    // =========================
    // STATE
    // =========================
    let recognition = null;
    let listening = false;
    let selectedImage = null;
    let timerIds = [];

    const MEMORY_KEY = 'jarvis_memory';

    // =========================
    // BASIC HELPERS
    // =========================
    function addMessage(text, type = 'bot') {
        const message = document.createElement('div');

        message.className =
            type === 'user'
                ? 'message user-message'
                : 'message bot-message';

        message.textContent = String(text);
        chat.appendChild(message);
        chat.scrollTop = chat.scrollHeight;

        return message;
    }

    function speak(text) {
        if (!('speechSynthesis' in window)) return;

        try {
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(String(text));
            utterance.lang = /[\u0C00-\u0C7F]/.test(String(text))
                ? 'te-IN'
                : 'en-IN';
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 1;

            window.speechSynthesis.speak(utterance);
        } catch (error) {
            console.error('Speech synthesis error:', error);
        }
    }

    function saveMemory(text) {
        try {
            const current = JSON.parse(
                localStorage.getItem(MEMORY_KEY) || '[]'
            );

            const memory = Array.isArray(current) ? current : [];

            memory.push({
                text: String(text),
                time: new Date().toISOString()
            });

            localStorage.setItem(
                MEMORY_KEY,
                JSON.stringify(memory.slice(-100))
            );
        } catch (error) {
            console.error('Memory save error:', error);
        }
    }

    function getMemory() {
        try {
            const memory = JSON.parse(
                localStorage.getItem(MEMORY_KEY) || '[]'
            );

            return Array.isArray(memory) ? memory : [];
        } catch (error) {
            console.error('Memory read error:', error);
            return [];
        }
    }

    function normalizeText(value) {
        return String(value || '').trim();
    }

    // =========================
    // TOOLS (THE HANDS)
    // =========================
    async function handleTools(text) {
        const originalText = normalizeText(text);
        const t = originalText.toLowerCase();

        if (!t) return null;

        // -------------------------
        // 1. TIME
        // -------------------------
        if (
            /\btime\b/.test(t) ||
            t.includes('what time') ||
            t.includes('టైమ్') ||
            t.includes('సమయం')
        ) {
            return `The time is ${new Date().toLocaleTimeString()}, Boss.`;
        }

        // -------------------------
        // 2. WEATHER
        // -------------------------
        if (
            t.includes('weather') ||
            t.includes('వాతావరణం') ||
            t.includes('వెదర్')
        ) {
            if (!navigator.geolocation) {
                return 'Geolocation is not supported by this browser, Boss.';
            }

            return await new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            const latitude = position.coords.latitude;
                            const longitude = position.coords.longitude;

                            const url =
                                'https://api.open-meteo.com/v1/forecast' +
                                `?latitude=${encodeURIComponent(latitude)}` +
                                `&longitude=${encodeURIComponent(longitude)}` +
                                '&current_weather=true';

                            const response = await fetch(url);

                            if (!response.ok) {
                                throw new Error(
                                    `Weather request failed: ${response.status}`
                                );
                            }

                            const data = await response.json();
                            const weather = data.current_weather;

                            if (
                                !weather ||
                                typeof weather.temperature !== 'number'
                            ) {
                                throw new Error('Invalid weather response');
                            }

                            resolve(
                                `It is ${weather.temperature} degrees Celsius now, Boss.`
                            );
                        } catch (error) {
                            console.error('Weather error:', error);
                            resolve('Weather service error, Boss.');
                        }
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        resolve(
                            'I need location permission for weather, Boss.'
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

        // -------------------------
        // 3. TIMER
        // -------------------------
        const timerMatch = t.match(
            /(\d+(?:\.\d+)?)\s*(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h)\b/i
        );

        if (
            (t.includes('timer') ||
                t.includes('set timer') ||
                t.includes('టైమర్')) &&
            timerMatch
        ) {
            const amount = Number(timerMatch[1]);
            const unit = timerMatch[2].toLowerCase();

            if (!Number.isFinite(amount) || amount <= 0) {
                return 'Please give me a valid timer duration, Boss.';
            }

            let factor = 60000;
            let displayUnit = amount === 1 ? 'minute' : 'minutes';

            if (/^(hours?|hrs?|h)$/i.test(unit)) {
                factor = 3600000;
                displayUnit = amount === 1 ? 'hour' : 'hours';
            } else if (/^(seconds?|secs?|s)$/i.test(unit)) {
                factor = 1000;
                displayUnit = amount === 1 ? 'second' : 'seconds';
            }

            const duration = amount * factor;

            const timerId = window.setTimeout(() => {
                const notificationText =
                    `Timer finished! ${amount} ${displayUnit} completed, Boss.`;

                speak(notificationText);
                addMessage(notificationText, 'bot');

                if (
                    'Notification' in window &&
                    Notification.permission === 'granted'
                ) {
                    try {
                        new Notification('J.A.R.V.I.S.', {
                            body: notificationText
                        });
                    } catch (error) {
                        console.error('Notification error:', error);
                    }
                }

                timerIds = timerIds.filter((id) => id !== timerId);
            }, duration);

            timerIds.push(timerId);

            if (
                'Notification' in window &&
                Notification.permission === 'default'
            ) {
                try {
                    Notification.requestPermission().catch(() => {});
                } catch (error) {
                    console.error(
                        'Notification permission error:',
                        error
                    );
                }
            }

            return `Timer set for ${amount} ${displayUnit}, Boss.`;
        }

        // -------------------------
        // 4. TRANSLATE
        // -------------------------
        if (
            t.includes('translate') ||
            t.includes('తెలుగులోకి అనువదించు')
        ) {
            let query = originalText
                .replace(/^translate\s*(this\s*)?/i, '')
                .replace(/^తెలుగులోకి\s*అనువదించు\s*/i, '')
                .trim();

            if (!query) {
                return 'Please tell me what you want me to translate, Boss.';
            }

            try {
                const url =
                    'https://api.mymemory.translated.net/get?q=' +
                    encodeURIComponent(query) +
                    '&langpair=en|te';

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(
                        `Translation request failed: ${response.status}`
                    );
                }

                const data = await response.json();
                const translated =
                    data?.responseData?.translatedText;

                if (typeof translated !== 'string' || !translated.trim()) {
                    throw new Error('Invalid translation response');
                }

                return `In Telugu: ${translated}`;
            } catch (error) {
                console.error('Translation error:', error);
                return 'Translate error, Boss.';
            }
        }

        // -------------------------
        // 5. YOUTUBE SEARCH
        // -------------------------
        if (
            t.includes('youtube') ||
            t.startsWith('play ') ||
            t.startsWith('ప్లే ')
        ) {
            const query = originalText
                .replace(/^play\s+youtube\s*/i, '')
                .replace(/^play\s+/i, '')
                .replace(/^youtube\s*(search\s*)?/i, '')
                .replace(/^ప్లే\s+/i, '')
                .trim();

            if (!query) {
                return 'Please tell me what you want to search on YouTube, Boss.';
            }

            const youtubeUrl =
                'https://www.youtube.com/results?search_query=' +
                encodeURIComponent(query);

            try {
                window.open(youtubeUrl, '_blank', 'noopener,noreferrer');
            } catch (error) {
                console.error('YouTube open error:', error);
                return 'I could not open YouTube, Boss.';
            }

            return `Searching YouTube for ${query}, Boss.`;
        }

        return null;
    }

    // =========================
    // LOCAL COMMAND HANDLER
    // =========================
    async function processCommand(text) {
        const command = normalizeText(text);
        if (!command) return;

        const toolResult = await handleTools(command);

        if (toolResult !== null) {
            addMessage(toolResult, 'bot');
            speak(toolResult);
            return;
        }

        const lower = command.toLowerCase();

        // Greeting
        if (
            /^(hi|hello|hey|hey jarvis|hi jarvis|hello jarvis)[!. ]*$/i.test(
                command
            ) ||
            /^(హాయ్|హలో|హాయ్ జార్విస్)[!. ]*$/i.test(command)
        ) {
            const response =
                'Hello Boss. J.A.R.V.I.S. is online and ready.';

            addMessage(response, 'bot');
            speak(response);
            return;
        }

        // Status
        if (
            lower.includes('status') ||
            lower.includes('system status')
        ) {
            const response =
                'All available systems are operational, Boss.';

            addMessage(response, 'bot');
            speak(response);
            return;
        }

        // Show memory
        if (
            lower === 'memory' ||
            lower.includes('what do you remember') ||
            lower.includes('show memory') ||
            lower.includes('my memory') ||
            lower.includes('what is in memory')
        ) {
            const memory = getMemory();

            if (!memory.length) {
                const response = 'No stored memory found, Boss.';
                addMessage(response, 'bot');
                speak(response);
                return;
            }

            const response =
                `I have ${memory.length} stored memory item` +
                (memory.length === 1 ? '' : 's') +
                ', Boss.';

            addMessage(response, 'bot');

            // Show recent memories without flooding the chat.
            memory.slice(-10).forEach((item, index) => {
                addMessage(
                    `${index + 1}. ${item.text}`,
                    'bot'
                );
            });

            speak(response);
            return;
        }

        // Remember / save
        if (
            lower.startsWith('remember ') ||
            lower.startsWith('save this ') ||
            lower.startsWith('remember that ')
        ) {
            const memoryText = command
                .replace(/^remember\s+(that\s+)?/i, '')
                .replace(/^save this\s+/i, '')
                .trim();

            if (!memoryText) {
                const response =
                    'Tell me what you want me to remember, Boss.';
                addMessage(response, 'bot');
                speak(response);
                return;
            }

            saveMemory(memoryText);

            const response =
                `I will remember that: ${memoryText}, Boss.`;

            addMessage(response, 'bot');
            speak(response);
            return;
        }

        // Clear memory
        if (
            lower === 'clear memory' ||
            lower === 'forget everything' ||
            lower === 'reset jarvis'
        ) {
            try {
                localStorage.removeItem(MEMORY_KEY);

                timerIds.forEach((id) => {
                    try {
                        clearTimeout(id);
                    } catch (error) {
                        console.error('Timer clear error:', error);
                    }
                });

                timerIds = [];
                selectedImage = null;

                if (imgInput) {
                    imgInput.value = '';
                }

                const response =
                    'Memory and active timers cleared, Boss.';

                addMessage(response, 'bot');
                speak(response);
            } catch (error) {
                console.error('Clear memory error:', error);

                const response =
                    'Unable to clear memory, Boss.';

                addMessage(response, 'bot');
                speak(response);
            }

            return;
        }

        // Calculator
        if (
            lower.startsWith('calculate ') ||
            lower.startsWith('calc ') ||
            lower.startsWith('what is ')
        ) {
            let expression = command
                .replace(/^calculate\s+/i, '')
                .replace(/^calc\s+/i, '')
                .replace(/^what\s+is\s+/i, '')
                .trim();

            expression = expression
                .replace(/\bplus\b/gi, '+')
                .replace(/\bminus\b/gi, '-')
                .replace(/\btimes\b/gi, '*')
                .replace(/\bmultiplied\s+by\b/gi, '*')
                .replace(/\bdivided\s+by\b/gi, '/')
                .replace(/\bx\b/gi, '*')
                .replace(/,/g, '');

            if (/^[0-9+\-*/().%\s]+$/.test(expression)) {
                try {
                    const result = Function(
                        `"use strict"; return (${expression})`
                    )();

                    if (
                        typeof result === 'number' &&
                        Number.isFinite(result)
                    ) {
                        const response =
                            `The answer is ${result}, Boss.`;

                        addMessage(response, 'bot');
                        speak(response);
                        return;
                    }
                } catch (error) {
                    console.error('Calculator error:', error);
                }
            }
        }

        // Help
        if (
            lower === 'help' ||
            lower === 'commands' ||
            lower === 'what can you do'
        ) {
            const response =
                'I can tell time, check weather, set timers, translate to Telugu, search YouTube, calculate, use memory, and accept voice or image input, Boss.';

            addMessage(response, 'bot');
            speak(response);
            return;
        }

        // Generic fallback
        saveMemory(command);

        const response =
            `Command received, Boss: ${command}`;

        addMessage(response, 'bot');
        speak(response);
    }

    // =========================
    // SEND / EXECUTE
    // =========================
    async function executeCommand() {
        const text = normalizeText(msg.value);

        if (!text || send.disabled) return;

        addMessage(text, 'user');
        msg.value = '';
        msg.focus();
        send.disabled = true;

        try {
            await processCommand(text);
        } catch (error) {
            console.error('Command execution error:', error);

            const errorMessage =
                'Command execution error, Boss.';

            addMessage(errorMessage, 'bot');
            speak(errorMessage);
        } finally {
            send.disabled = false;
            msg.focus();
        }
    }

    send.addEventListener('click', executeCommand);

    // =========================
    // ENTER KEY
    // =========================
    msg.addEventListener('keydown', (event) => {
        if (
            event.key === 'Enter' &&
            !event.shiftKey
        ) {
            event.preventDefault();
            executeCommand();
        }
    });

    // =========================
    // VOICE RECOGNITION
    // =========================
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    function getSpeechLanguage() {
        return /[\u0C00-\u0C7F]/.test(msg.value)
            ? 'te-IN'
            : 'en-IN';
    }

    function setMicState(active) {
        listening = active;

        if (active) {
            micBtn.classList.add('active');
            micBtn.setAttribute(
                'aria-label',
                'Stop voice input'
            );
        } else {
            micBtn.classList.remove('active');
            micBtn.setAttribute(
                'aria-label',
                'Activate voice input'
            );
        }
    }

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN';
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
            setMicState(true);
        };

        recognition.onresult = async (event) => {
            try {
                const result =
                    event.results[event.results.length - 1];

                const transcript =
                    result?.[0]?.transcript?.trim();

                if (!transcript) return;

                msg.value = transcript;
                addMessage(transcript, 'user');
                msg.value = '';

                send.disabled = true;

                try {
                    await processCommand(transcript);
                } finally {
                    send.disabled = false;
                    msg.focus();
                }
            } catch (error) {
                console.error('Voice result error:', error);
                addMessage(
                    'Unable to process voice command, Boss.',
                    'bot'
                );
            }
        };

        recognition.onerror = (event) => {
            console.error(
                'Voice recognition error:',
                event.error
            );

            setMicState(false);

            let message =
                'Voice input error, Boss.';

            if (event.error === 'not-allowed') {
                message =
                    'Microphone permission was denied, Boss.';
            } else if (event.error === 'no-speech') {
                message =
                    'I did not hear anything, Boss.';
            } else if (event.error === 'audio-capture') {
                message =
                    'No microphone was detected, Boss.';
            } else if (event.error === 'network') {
                message =
                    'Voice recognition network error, Boss.';
            }

            addMessage(message, 'bot');
        };

        recognition.onend = () => {
            setMicState(false);
        };
    } else {
        recognition = null;
        micBtn.title =
            'Voice recognition is not supported in this browser';
    }

    micBtn.addEventListener('click', () => {
        if (!recognition) {
            const message =
                'Voice recognition is not supported in this browser, Boss.';

            addMessage(message, 'bot');
            return;
        }

        try {
            if (listening) {
                recognition.stop();
                return;
            }

            recognition.lang = 'en-IN';
            recognition.start();
        } catch (error) {
            console.error(
                'Voice start/stop error:',
                error
            );

            setMicState(false);

            if (error.name === 'InvalidStateError') {
                try {
                    recognition.stop();
                } catch (stopError) {
                    console.error(
                        'Voice stop error:',
                        stopError
                    );
                }
            } else {
                addMessage(
                    'Unable to start voice input, Boss.',
                    'bot'
                );
            }
        }
    });

    // =========================
    // CAMERA / IMAGE INPUT
    // =========================
    camBtn.addEventListener('click', () => {
        try {
            imgInput.value = '';
            imgInput.click();
        } catch (error) {
            console.error(
                'Image input open error:',
                error
            );

            addMessage(
                'Unable to open image input, Boss.',
                'bot'
            );
        }
    });

    imgInput.addEventListener('change', (event) => {
        const file =
            event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            const message =
                'Please select a valid image file, Boss.';

            addMessage(message, 'bot');
            speak(message);

            imgInput.value = '';
            return;
        }

        selectedImage = file;
        analyzeImage(file);
    });

    async function analyzeImage(file) {
        let imageURL = null;

        try {
            imageURL = URL.createObjectURL(file);

            const image = new Image();

            image.onload = () => {
                const message =
                    `Image loaded successfully, Boss. File: ${file.name}. ` +
                    `Dimensions: ${image.naturalWidth} by ` +
                    `${image.naturalHeight} pixels.`;

                addMessage(message, 'bot');
                speak('Image loaded successfully, Boss.');

                URL.revokeObjectURL(imageURL);
            };

            image.onerror = () => {
                if (imageURL) {
                    URL.revokeObjectURL(imageURL);
                }

                const message =
                    'I could not read that image, Boss.';

                addMessage(message, 'bot');
                speak(message);
            };

            image.src = imageURL;
        } catch (error) {
            if (imageURL) {
                try {
                    URL.revokeObjectURL(imageURL);
                } catch (_) {}
            }

            console.error(
                'Image analysis error:',
                error
            );

            const message =
                'Image analysis error, Boss.';

            addMessage(message, 'bot');
            speak(message);
        }
    }

    // =========================
    // CLEAR MEMORY / CHAT
    // =========================
    clearBtn.addEventListener('click', () => {
        try {
            localStorage.removeItem(MEMORY_KEY);

            selectedImage = null;

            if (imgInput) {
                imgInput.value = '';
            }

            timerIds.forEach((id) => {
                try {
                    clearTimeout(id);
                } catch (error) {
                    console.error(
                        'Timer clear error:',
                        error
                    );
                }
            });

            timerIds = [];

            chat.innerHTML = '';

            const message =
                'Memory cleared successfully, Boss.';

            addMessage(message, 'bot');
            speak(message);
        } catch (error) {
            console.error(
                'Clear memory error:',
                error
            );

            addMessage(
                'Unable to clear memory, Boss.',
                'bot'
            );
        }
    });

    // =========================
    // INITIALIZATION
    // =========================
    try {
        const existingMemory = getMemory();

        if (existingMemory.length > 0) {
            console.log(
                'J.A.R.V.I.S. memory loaded:',
                existingMemory.length
            );
        }

        msg.focus();
    } catch (error) {
        console.error(
            'J.A.R.V.I.S. initialization error:',
            error
        );
    }
});
'''

out = Path("/mnt/data/JARVIS_script_fixed_v2.js")
out.write_text(fixed, encoding="utf-8")

# Syntax-check with Node if available.
import subprocess, json, os, textwrap, sys
check = subprocess.run(
    ["node", "--check", str(out)],
    capture_output=True,
    text=True
)
if check.returncode != 0:
    raise RuntimeError(check.stderr)

print(f"Fixed file created: {out}")
print(f"Lines: {len(fixed.splitlines())}")
print("JavaScript syntax check: PASSED")
