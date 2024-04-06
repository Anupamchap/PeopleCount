const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Connect to SQLite database
const db = new sqlite3.Database('data.db');

// Create table if not exists
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS data (
        EndTime TEXT PRIMARY KEY,
        "in" INTEGER,
        "out" INTEGER,
        totalInside INTEGER
    )`);
});

// Middleware to log requests
app.use((req, res, next) => {
    fs.appendFile('request.log', `${new Date().toISOString()} - ${req.method} ${req.url}\n`, (err) => {
        if (err) console.error(err);
    });
    next();
    
});

app.use(express.json());
// Upsert API endpoint
app.post('/api/data', (req, res) => {
    console.log(req)
    const { EndTime, in: inVal, out, totalInside } = req.body;

    
    // Perform upsert operation
    db.run(`INSERT OR REPLACE INTO data (EndTime, "in", "out", totalInside) VALUES (?, ?, ?, ?)`, [EndTime, inVal, out, totalInside], function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        console.log(`A row has been inserted or updated with rowid ${this.lastID}`);
        res.status(200).json({ message: 'Data upserted successfully' });
    });
});

app.delete('/api/data', (req, res) => {
    // Perform delete operation
    db.run(`DELETE FROM data`, function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        console.log(`All data has been deleted`);
        res.status(200).json({ message: 'All data deleted successfully' });
    });
});

app.get('/api/data', (req, res) => {
    // Fetch data from the database
    console.log('API CALLED')
    db.all('SELECT * FROM data', (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        // Send the fetched data as a response
        res.status(200).json(rows);
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});