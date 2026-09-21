const { app } = require("@azure/functions");
const sql = require("mssql");
const crypto = require("crypto");

app.http("Login", {
    methods: ["POST", "OPTIONS"],
    authLevel: "anonymous",

    handler: async (request, context) => {

        context.log("Ntertainment API - Login");

        if (request.method === "OPTIONS") {
            return {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                }
            };
        }

        try {

            const body = await request.json();

            const {
                email,
                password
            } = body || {};

            if (!email || !password) {
                return {
                    status: 400,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json"
                    },
                    jsonBody: {
                        error: "E-mailadres en wachtwoord zijn verplicht."
                    }
                };
            }

            const normalizedEmail =
                email.trim().toLowerCase();

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

            const result = await pool.request()
                .input(
                    "Email",
                    sql.NVarChar(255),
                    normalizedEmail
                )
                .query(`
                    SELECT
                        UserId,
                        Email,
                        FirstName,
                        LastName,
                        Role,
                        IsActive,
                        PasswordHash
                    FROM dbo.Users
                    WHERE LOWER(Email) = @Email
                `);

            if (result.recordset.length === 0) {

                return {
                    status: 401,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json"
                    },
                    jsonBody: {
                        error: "E-mailadres of wachtwoord is niet correct."
                    }
                };

            }

            const user =
                result.recordset[0];

            if (!user.IsActive) {

                return {
                    status: 403,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json"
                    },
                    jsonBody: {
                        error: "Dit account is niet actief."
                    }
                };

            }

            /*
             * PasswordHash formaat:
             *
             * scrypt$SALT$HASH
             */

            const parts =
                user.PasswordHash.split("$");

            if (
                parts.length !== 3 ||
                parts[0] !== "scrypt"
            ) {

                context.error(
                    "Ongeldig PasswordHash formaat."
                );

                return {
                    status: 500,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json"
                    },
                    jsonBody: {
                        error: "Accountgegevens zijn ongeldig."
                    }
                };

            }

            const salt =
                Buffer.from(
                    parts[1],
                    "hex"
                );

            const storedHash =
                Buffer.from(
                    parts[2],
                    "hex"
                );

            const calculatedHash =
                crypto.scryptSync(
                    password,
                    salt,
                    64
                );

            const passwordCorrect =
                crypto.timingSafeEqual(
                    calculatedHash,
                    storedHash
                );

            if (!passwordCorrect) {

                return {
                    status: 401,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json"
                    },
                    jsonBody: {
                        error: "E-mailadres of wachtwoord is niet correct."
                    }
                };

            }

            /*
             * Geef NOOIT PasswordHash terug
             * naar de frontend.
             */

            return {
                status: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                },
                jsonBody: {
                    success: true,

                    user: {
                        UserId: user.UserId,
                        Email: user.Email,
                        FirstName: user.FirstName,
                        LastName: user.LastName,
                        Role: user.Role,
                        IsActive: user.IsActive
                    }
                }
            };

        } catch (error) {

            context.error(
                "Login error:",
                error
            );

            return {
                status: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                },
                jsonBody: {
                    success: false,
                    error: "Er ging iets mis bij het aanmelden."
                }
            };

        }

    }

});
