const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
}

// Initialize database
const db = new sqlite3.Database(path.join(dbDir, 'whatsapp.db'));

// Create tables if they don't exist
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // WhatsApp accounts table
    db.run(`CREATE TABLE IF NOT EXISTS whatsapp_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        waba_id TEXT NOT NULL,
        phone_number_id TEXT,
        access_token TEXT,
        platform_api_key TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
    
    // Webhook configurations table
    db.run(`CREATE TABLE IF NOT EXISTS webhook_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        waba_id TEXT NOT NULL,
        webhook_url TEXT,
        api_access BOOLEAN DEFAULT 0,
        api_key TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
});

// User functions
const createUser = (email, password, name) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                reject(err);
                return;
            }
            
            const stmt = db.prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)");
            stmt.run([email, hash, name], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, email, name });
                }
            });
            stmt.finalize();
        });
    });
};

const findUserByEmail = (email) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

const findUserById = (id) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// WhatsApp account functions
const saveWhatsAppAccount = (userId, wabaId, phoneNumberId, accessToken, platformApiKey) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare("INSERT OR REPLACE INTO whatsapp_accounts (user_id, waba_id, phone_number_id, access_token, platform_api_key) VALUES (?, ?, ?, ?, ?)");
        stmt.run([userId, wabaId, phoneNumberId, accessToken, platformApiKey], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, userId, wabaId, phoneNumberId, accessToken, platformApiKey });
            }
        });
        stmt.finalize();
    });
};

const getWhatsAppAccountsByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM whatsapp_accounts WHERE user_id = ?", [userId], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

const getWhatsAppAccountByWabaId = (wabaId) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM whatsapp_accounts WHERE waba_id = ?", [wabaId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// Webhook configuration functions
const saveWebhookConfig = (userId, wabaId, webhookUrl, apiAccess, apiKey) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare("INSERT OR REPLACE INTO webhook_configs (user_id, waba_id, webhook_url, api_access, api_key) VALUES (?, ?, ?, ?, ?)");
        stmt.run([userId, wabaId, webhookUrl, apiAccess ? 1 : 0, apiKey], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, userId, wabaId, webhookUrl, apiAccess, apiKey });
            }
        });
        stmt.finalize();
    });
};

const getWebhookConfigByWabaId = (wabaId) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM webhook_configs WHERE waba_id = ?", [wabaId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                // Convert api_access from 0/1 to boolean
                if (row) {
                    row.apiAccess = row.api_access === 1;
                }
                resolve(row);
            }
        });
    });
};

const getWebhookConfigsByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM webhook_configs WHERE user_id = ?", [userId], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                // Convert api_access from 0/1 to boolean
                rows.forEach(row => {
                    row.apiAccess = row.api_access === 1;
                });
                resolve(rows);
            }
        });
    });
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    saveWhatsAppAccount,
    getWhatsAppAccountsByUserId,
    getWhatsAppAccountByWabaId,
    saveWebhookConfig,
    getWebhookConfigByWabaId,
    getWebhookConfigsByUserId
};