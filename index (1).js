const { app } = require("@azure/functions");
const sql = require("mssql");

app.http("PublicClasses", {
    methods: ["GET", "OPTIONS"],
    authLevel: "anonymous",

    handler: async (request, context) => {

        context.log("Ntertainment API - GetClasses");

        // CORS
        if (request.method === "OPTIONS") {
            return {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                }
            };
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

            context.log("Connecting to SQL...");

            const pool = await sql.connect(config);

            context.log("SQL connected");

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
                ORDER BY DayOfWeek, StartTime
            `);

            context.log(`Found ${result.recordset.length} classes`);

            return {
                status: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                },
                jsonBody: result.recordset
            };

        } catch (error) {

            context.error("GetClasses error:", error);

            return {
                status: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                },
                jsonBody: {
                    success: false,
                    error: error.message
                }
            };
        }
    }
});
