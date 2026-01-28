const fs = require('fs');
const path = require('path');

async function listModels() {
    try {
        const envPath = path.join(__dirname, '.env.local');
        let apiKey = '';
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const match = content.match(/GEMINI_API_KEY=(.*)/);
            if (match) {
                apiKey = match[1].trim();
            }
        }

        if (!apiKey) {
            console.error("No API KEY found in .env.local");
            return;
        }

        console.log("Using API Key starting with:", apiKey.substring(0, 5) + "...");

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Gemini Models:");
            data.models.forEach(m => {
                // Filter strictly for gemini models to be clean
                if (m.name.toLowerCase().includes('gemini')) {
                    console.log(m.name);
                }
            });
        } else {
            console.log("Error listing models:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Error executing script:", error);
    }
}

listModels();
