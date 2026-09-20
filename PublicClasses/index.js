const sql = require("mssql");

module.exports = async function (context, req) {

    context.log("Ntertainment API - GetClasses");

    // CORS
    if (req.method === "OPTIONS") {
        context.res = {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        };
        return;
    }

    try {

        const config = {
            server: process.env.SQL_SERVER,
            database: process.env.SQL_DATABASE,
            user: process.env.SQL_USER,
            password: process.env.SQL_PASSWORD,
            options: {
                encrypt: true,
                trustServerCertificate: false
            }
        };

        const pool = await sql.connect(config);

        const result = await pool.request().query(`
            SELECT
                ClassId,
                Name,
                Style,
                AgeGroup,
                Level,
                DayOfWeek,
                StartTime,
                EndTime,
                Capacity,
                Price,
                TrialAvailable,
                RegistrationOpen,
                IsActive
            FROM dbo.Classes
            WHERE IsActive = 1
            ORDER BY
                DayOfWeek,
                StartTime
        `);

        context.res = {
            status: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: result.recordset
        };

    } catch (error) {

        context.log.error("GetClasses error:", error);

        context.res = {
            status: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: {
                error: "Er ging iets mis bij het ophalen van de lessen.",
                details: error.message
            }
        };
    }
};
