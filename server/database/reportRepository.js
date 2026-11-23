const db = require("./db");

function saveReport(userId, searchedIsbn, reportData) {
    const statement = db.prepare(`
        INSERT INTO reports (
            user_id,
            searched_isbn,
            report_data
        )
        VALUES(?,?,?)
        `);

        const result = statement.run(
            userId,
            searchedIsbn,
            JSON.stringify(reportData)
        );

        return Number( result.lastInsertRowid);

}
module.exports = {saveReport};
