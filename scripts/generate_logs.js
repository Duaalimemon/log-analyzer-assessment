const fs = require('fs');

// Bilkul direct aur simple name, bina kisi complex path ke
const outputFile = "test_server.log";

const methods = ['GET', 'POST', 'PUT', 'DELETE'];
const paths = ['/api/users', '/api/login', '/api/products', '/api/checkout', '/api/dashboard'];
const statuses = ['200', '201', '400', '401', '404', '500'];

function createPerfectLine() {
    const timestamp = new Date().toISOString();
    const ip = `192.168.1.${Math.floor(Math.random() * 255)}`;
    const method = methods[Math.floor(Math.random() * methods.length)];
    const route = paths[Math.floor(Math.random() * paths.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const responseTime = `${Math.floor(Math.random() * 500) + 10}ms`;

    return `${timestamp} ${ip} ${method} ${route} ${status} ${responseTime}`;
}

function createAnomalousLine() {
    const types = [
        () => `2026/05/21 14:23:01 10.0.0.5 GET /api/products 200 120ms`,
        () => `2026-05-21T14:23:01Z 10.0.0.5 GET /api/users 200 0.15s`,
        () => `2026-05-21T14:23:01Z 10.0.0.5 POST /api/login - 89ms`,
        () => ``, 
        () => `Error: Connect ECONNREFUSED 127.0.0.1:5432`,
        () => JSON.stringify({ time: "2026-05-21T14:23:01Z", level: "info", path: "/api/health", status: 200, duration_ms: 12 })
    ];
    return types[Math.floor(Math.random() * types.length)]();
}

function generateLogFile(totalLines = 1000) {
    // Console log taake pata chale script chal rahi hai
    console.log("-----------------------------------------");
    console.log(`⏳ Processing: Creating ${totalLines} log lines...`);
    
    let fileContent = "";
    for (let i = 0; i < totalLines; i++) {
        const isAnomaly = Math.random() < 0.10; 
        const line = isAnomaly ? createAnomalousLine() : createPerfectLine();
        fileContent += line + '\n';
    }

    // Synchronous write taake Windows forcely file banaye
    fs.writeFileSync(outputFile, fileContent, 'utf-8');
    
    console.log(` Success! '${outputFile}'`);
    console.log("-----------------------------------------");
}

generateLogFile(1000);