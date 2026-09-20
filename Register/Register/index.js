const sql = require("mssql");
const crypto = require("crypto");

module.exports = async function (context, req) {

    context.log("Ntertainment API - Register");

    // CORS
    if (req.method === "OPTIONS") {
        context.res = {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        };
        return;
    }

    try {

        const {
            first,
            last,
            email,
            password,
            role
        } = req.body || {};

        // Controle verplichte velden
        if (!first || !last || !email || !password || !role) {
            context.res = {
                status: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*"
                },
                body: {
                    error: "Alle velden zijn verplicht."
                }
            };
            return;
        }

        // Controle wachtwoord
        if (password.length < 8) {
            context.res = {
                status: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*"
                },
                body: {
                    error: "Wachtwoord moet minimaal 8 tekens bevatten."
                }
            };
            return;
        }

        // Rol controleren
        if (!["Parent", "Dancer"].includes(role)) {
            context.res = {
                status: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*"
                },
                body: {
                    error: "Ongeldige rol."
                }
            };
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Azure SQL configuratie
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

        // Verbinding maken met SQL
        const pool = await sql.connect(config);

        // Controleren of e-mailadres al bestaat
        const existing = await pool.request()
            .input("Email", sql.NVarChar(255), normalizedEmail)
            .query(`
                SELECT UserId
                FROM dbo.Users
                WHERE LOWER(Email) = @Email
            `);

        if (existing.recordset.length > 0) {

            context.res = {
                status: 409,
                headers: {
                    "Access-Control-Allow-Origin": "*"
                },
                body: {
                    error: "Dit e-mailadres bestaat al."
                }
            };

            return;
        }

        // Veilig wachtwoord hashen
        const salt = crypto.randomBytes(16);

        const hash = crypto.scryptSync(
            password,
            salt,
            64
        );

        const passwordHash =
            "scrypt$" +
            salt.toString("hex") +
            "$" +
            hash.toString("hex");

        // Nieuwe gebruiker opslaan
        const result = await pool.request()
            .input("Email", sql.NVarChar(255), normalizedEmail)
            .input("FirstName", sql.NVarChar(100), first.trim())
            .input("LastName", sql.NVarChar(100), last.trim())
            .input("Role", sql.NVarChar(20), role)
            .input("PasswordHash", sql.NVarChar(255), passwordHash)
            .query(`
                INSERT INTO dbo.Users
                (
                    Email,
                    FirstName,
                    LastName,
                    Role,
                    IsActive,
                    PasswordHash
                )
                OUTPUT
                    INSERTED.UserId,
                    INSERTED.Email,
                    INSERTED.FirstName,
                    INSERTED.LastName,
                    INSERTED.Role,
                    INSERTED.IsActive
                VALUES
                (
                    @Email,
                    @FirstName,
                    @LastName,
                    @Role,
                    1,
                    @PasswordHash
                )
            `);

        const user = result.recordset[0];

        // Succes
        context.res = {
            status: 201,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: {
                success: true,
                user: user
            }
        };

    } catch (error) {

        context.log.error("Register error:", error);

        context.res = {
            status: 500,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: {
                error: "Er ging iets mis bij het registreren."
            }
        };
    }
};
