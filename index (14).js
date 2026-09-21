const { app } = require("@azure/functions");
const sql = require("mssql");
const crypto = require("crypto");

app.http("UpdateProfile", {
    methods: ["POST", "OPTIONS"],
    authLevel: "anonymous",

    handler: async (request, context) => {

        context.log("Ntertainment API - UpdateProfile");

        // CORS preflight
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
                userId,
                first,
                last,
                email,
                password,
                currentPassword
            } = body || {};

            // --------------------------------------------------
            // VALIDATION
            // --------------------------------------------------

            if (!userId) {
                return {
                    status: 400,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json"
                    },
                    jsonBody: {
                        error: "Gebruiker ontbreekt."
                    }
                };
            }

            if (!first || !last || !email) {
                return {
                    status: 400,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json"
                    },
                    jsonBody: {
                        error: "Voornaam, achternaam en e-mailadres zijn verplicht."
                    }
                };
            }

            const normalizedEmail =
                email.trim().toLowerCase();

            // --------------------------------------------------
            // SQL CONFIG
            // --------------------------------------------------

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

            // --------------------------------------------------
            // GET CURRENT USER
            // --------------------------------------------------

            const currentResult = await pool.request()
                .input(
                    "UserId",
                    sql.Int,
                    Number(userId)
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
                    WHERE UserId = @UserId
                `);

            if (currentResult.recordset.length === 0) {
                return {
                    status: 404,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json"
                    },
                    jsonBody: {
                        error: "Gebruiker niet gevonden."
                    }
                };
            }

            const currentUser =
                currentResult.recordset[0];

            // --------------------------------------------------
            // CHECK EMAIL
            // --------------------------------------------------

            const emailCheck = await pool.request()
                .input(
                    "Email",
                    sql.NVarChar(255),
                    normalizedEmail
                )
                .input(
                    "UserId",
                    sql.Int,
                    Number(userId)
                )
                .query(`
                    SELECT UserId
                    FROM dbo.Users
                    WHERE LOWER(Email) = @Email
                    AND UserId <> @UserId
                `);

            if (emailCheck.recordset.length > 0) {
                return {
                    status: 409,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json"
                    },
                    jsonBody: {
                        error: "Dit e-mailadres wordt al gebruikt."
                    }
                };
            }

            // --------------------------------------------------
            // PREPARE UPDATE
            // --------------------------------------------------

            let passwordHash = currentUser.PasswordHash;

            // --------------------------------------------------
            // PASSWORD CHANGE
            // --------------------------------------------------

            if (password) {

                if (!currentPassword) {
                    return {
                        status: 400,
                        headers: {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type": "application/json"
                        },
                        jsonBody: {
                            error: "Je huidige wachtwoord is verplicht om je wachtwoord te wijzigen."
                        }
                    };
                }

                // Validate current password

                const parts =
                    currentUser.PasswordHash.split("$");

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

                const calculatedCurrentHash =
                    crypto.scryptSync(
                        currentPassword,
                        salt,
                        64
                    );

                const currentPasswordCorrect =
                    crypto.timingSafeEqual(
                        calculatedCurrentHash,
                        storedHash
                    );

                if (!currentPasswordCorrect) {
                    return {
                        status: 401,
                        headers: {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type": "application/json"
                        },
                        jsonBody: {
                            error: "Huidig wachtwoord is niet correct."
                        }
                    };
                }

                // Validate new password

                if (password.length < 8) {
                    return {
                        status: 400,
                        headers: {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type": "application/json"
                        },
                        jsonBody: {
                            error: "Nieuw wachtwoord moet minimaal 8 tekens bevatten."
                        }
                    };
                }

                // Create new password hash

                const newSalt =
                    crypto.randomBytes(16);

                const newHash =
                    crypto.scryptSync(
                        password,
                        newSalt,
                        64
                    );

                passwordHash =
                    "scrypt$" +
                    newSalt.toString("hex") +
                    "$" +
                    newHash.toString("hex");
            }

            // --------------------------------------------------
            // UPDATE USER
            // --------------------------------------------------

            const result = await pool.request()
                .input(
                    "UserId",
                    sql.Int,
                    Number(userId)
                )
                .input(
                    "Email",
                    sql.NVarChar(255),
                    normalizedEmail
                )
                .input(
                    "FirstName",
                    sql.NVarChar(100),
                    first.trim()
                )
                .input(
                    "LastName",
                    sql.NVarChar(100),
                    last.trim()
                )
                .input(
                    "PasswordHash",
                    sql.NVarChar(255),
                    passwordHash
                )
                .query(`
                    UPDATE dbo.Users

                    SET
                        Email = @Email,
                        FirstName = @FirstName,
                        LastName = @LastName,
                        PasswordHash = @PasswordHash

                    OUTPUT
                        INSERTED.UserId,
                        INSERTED.Email,
                        INSERTED.FirstName,
                        INSERTED.LastName,
                        INSERTED.Role,
                        INSERTED.IsActive

                    WHERE UserId = @UserId
                `);

            if (result.recordset.length === 0) {
                return {
                    status: 404,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json"
                    },
                    jsonBody: {
                        error: "Gebruiker kon niet worden bijgewerkt."
                    }
                };
            }

            const user =
                result.recordset[0];

            // --------------------------------------------------
            // SUCCESS
            // --------------------------------------------------

            return {
                status: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                },
                jsonBody: {
                    success: true,
                    message: "Profiel succesvol bijgewerkt.",
                    user: user
                }
            };

        } catch (error) {

            context.error(
                "UpdateProfile error:",
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
                    error: "Er ging iets mis bij het bijwerken van je profiel."
                }
            };
        }
    }
});
