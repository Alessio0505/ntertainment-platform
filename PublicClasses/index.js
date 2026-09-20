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

        // Check environment variables
        if (
            !process.env.SQL_SERVER ||
            !process.env.SQL_DATABASE ||
            !process.env.SQL_USER ||
            !process.env.SQL_PASSWORD
        ) {
            throw new Error("SQL environment variables ontbreken.");
        }

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

        context.log("Connecting to SQL...");

        const pool = await sql.connect(config);

        context.log("Connected to SQL.");

        const result = await pool.request().query(`
            SELECT
                ClassId,
                Name,
                Style,
                AgeGroup,
                Level,
                DayOfWeek,
                CONVERT(varchar(8), StartTime, 108) AS StartTime,
                CONVERT(varchar(8), EndTime, 108) AS EndTime,
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

        context.log(`Found ${result.recordset.length} active classes.`);

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
                success: false,
                error: error.message
            }
        };
    }
};
