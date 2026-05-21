const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Terminal se file ka path pakadne ke liye (e.g., node analyzer.js test_server.log)
const logFilePath = process.argv[2];

if (!logFilePath) {
    console.error("❌ Ghalat Tarika! Please file ka path sath den. Example:");
    console.error("node analyzer.js test_server.log\n");
    process.exit(1);
}

// Metrics store karne ke liye ek object
const metrics = {
    totalLines: 0,
    validLines: 0,
    malformedLines: 0,
    jsonLines: 0,
    statusCodes: {},
    endpoints: {}, // Response times save karne ke liye
};

// Response time ko hamesha Milliseconds (ms) mein convert karne ka function
function parseResponseTime(timeStr) {
    if (!timeStr) return 0;
    const cleanStr = timeStr.toString().trim().toLowerCase();
    
    if (cleanStr.endsWith('ms')) {
        return parseFloat(cleanStr.replace('ms', ''));
    } else if (cleanStr.endsWith('s')) {
        return parseFloat(cleanStr.replace('s', '')) * 1000; // Seconds ko ms banaya
    }
    
    // Agar sirf number ho bina unit ke
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
}

async function processLogs() {
    const absolutePath = path.resolve(logFilePath);
    
    if (!fs.existsSync(absolutePath)) {
        console.error(`❌ File nahi mili: ${absolutePath}`);
        process.exit(1);
    }

    // Stream reader banaya taake memory full na ho
    const fileStream = fs.createReadStream(absolutePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    console.log(`\n============== LOG ANALYZER START ==============`);
    console.log(`Reading file: ${logFilePath}...\n`);

    for await (const line of rl) {
        metrics.totalLines++;

        // Edge Case 1: Agar line bilkul khali (blank) hai
        if (!line.trim()) {
            metrics.malformedLines++;
            continue;
        }

        try {
            // Edge Case 2: Agar line JSON format mein hai
            if (line.trim().startsWith('{')) {
                const jsonData = JSON.parse(line);
                metrics.jsonLines++;
                metrics.validLines++;
                
                const status = jsonData.status || '-';
                metrics.statusCodes[status] = (metrics.statusCodes[status] || 0) + 1;
                
                const pathName = jsonData.path || 'UNKNOWN';
                const duration = parseResponseTime(jsonData.duration_ms || 0);
                
                if (!metrics.endpoints[pathName]) metrics.endpoints[pathName] = [];
                metrics.endpoints[pathName].push(duration);
                continue;
            }

            // Standard Log Line Parsing using Regex
            // Shapes handle karega: Timestamp IP Method Path Status ResponseTime
            const parts = line.split(/\s+/);
            
            // Basic validation: Sahi line mein kam se kam kaafi fields honi chahiyen
            if (parts.length < 5) {
                metrics.malformedLines++;
                continue;
            }

            // Standard array mapping based on our generator shape
            const method = parts[2];
            const endpoint = parts[3];
            const status = parts[4];
            const rawResponseTime = parts[5];

            // Check if method is valid HTTP method (safeguard against garbage text)
            const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
            if (!validMethods.includes(method)) {
                metrics.malformedLines++;
                continue;
            }

            metrics.validLines++;
            
            // Status code counting
            metrics.statusCodes[status] = (metrics.statusCodes[status] || 0) + 1;

            // Response time calculation
            const durationMs = parseResponseTime(rawResponseTime);
            if (!metrics.endpoints[endpoint]) {
                metrics.endpoints[endpoint] = [];
            }
            metrics.endpoints[endpoint].push(durationMs);

        } catch (error) {
            // Agar koi bhi aisi unexpected line aye jo crash kar sakti ho, wo yahan catch ho jayegi
            metrics.malformedLines++;
        }
    }

    printReport();
}

function printReport() {
    console.log(`============== FINAL REPORT ==============`);
    console.log(`📊 Total Lines Processed : ${metrics.totalLines}`);
    console.log(`✅ Valid Lines Parsed    : ${metrics.validLines} (including ${metrics.jsonLines} JSON lines)`);
    console.log(`⚠️  Malformed/Skipped    : ${metrics.malformedLines}`);
    console.log(`------------------------------------------`);
    
    console.log(`\n🔒 HTTP Status Codes Summary:`);
    Object.entries(metrics.statusCodes).forEach(([code, count]) => {
        console.log(`  Code ${code}: ${count} times`);
    });

    console.log(`\n🐢 Top 3 Slowest Endpoints (Average Performance):`);
    
    const avgSpeeds = Object.entries(metrics.endpoints).map(([endpoint, times]) => {
        const sum = times.reduce((a, b) => a + b, 0);
        const avg = sum / times.length;
        return { endpoint, avg: avg.toFixed(2), hits: times.length };
    });

    // Sort by slowest (highest avg)
    avgSpeeds.sort((a, b) => b.avg - a.avg);

    avgSpeeds.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.endpoint} -> Avg Time: ${item.avg}ms (${item.hits} hits)`);
    });
    
    console.log(`\n==========================================`);
}

processLogs();