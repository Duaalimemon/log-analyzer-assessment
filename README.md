# Server Log Analyzer Tool

A lightweight, robust command-line tool built with Node.js to parse and analyze server log files. It streams large files line-by-line to guarantee memory efficiency and gracefully handles malformed entries, distinct timestamp variations, and mixed JSON logs without crashing.

## Prerequisites
- Node.js installed on your machine (v18 or higher recommended).

## Setup & Installation
1. Clone or download this repository.
2. Open your terminal inside the project root folder (`log-analyzer-assessment`).
3. (Optional) Run `npm install` (though this tool relies entirely on native core modules so no extra dependencies are needed).

## How to Run

### 1. Generate Test Data
To create a mock log file containing a mix of 90% valid lines and 10% structural anomalies (malformed lines, stack traces, JSON logs), run the generator script:
```bash
node scripts/generate_logs.js