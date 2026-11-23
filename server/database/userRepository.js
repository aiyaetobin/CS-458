const db = require("./db");

const insertOrUpdateUser = db.prepare(`
    INSERT INTO users (
        google_id,
        email,
        display_name
    )
    VALUES (?,?,?)
    ON CONFLICT(google_id) DO UPDATE SET
        email = excluded.email,
        display_name = excluded.display_name
    `);

const findUserByGoogleId = db.prepare(`
    SELECT 
        id, 
        google_id AS googleId,
        email,
        display_name AS displayName,
        created_at AS createdAt
    FROM users
    WHERE google_id = ?
    `);

function saveUser({googleId, email, displayName}) {
    insertOrUpdateUser.run(
        googleId,
        email,
        displayName
    );
    return findUserByGoogleId.get(googleId);
}

module.exports = {saveUser};