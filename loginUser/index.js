module.exports = async function (context, req) {
  const sql = require("mssql");
  const origin = req.headers.origin;

  const headers = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
  };

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    context.res = {
      headers: {
        ...headers,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      status: 204,
      body: "",
    };
    return;
  }

  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT),
    options: {
      encrypt: process.env.DB_TRUST_CERTIFICATE === "true", // Logically check for string 'true'
      trustServerCertificate: process.env.DB_ENCRYPT === "true", // Logically check for string 'true'
    },
    requestTimeout: 600000,
  };

  let data = req.body;

  try {
    console.log("Attempting to connect to the database...");
    let pool = await sql.connect(config);
    console.log("Connected to the database successfully.");

    let result = await pool
      .request()
      .input("username", sql.VarChar, data.username)
      .input("password", sql.VarChar, data.password)
      .output("status", sql.Int)
      .output("message", sql.VarChar)
      .output("accessToken", sql.VarChar)
      .output("expirationDateTime", sql.DateTime)
      .execute("LoginUser");

    const { status, message, accessToken, expirationDateTime } = result.output;

    const cookieOptions = [
      `accessToken=${accessToken}`, // The cookie value
      `HttpOnly`, // Make the cookie inaccessible via JavaScript
      `Secure`, // Ensure the cookie is only sent over HTTPS
      `SameSite=None`, // Protect against CSRF
      `Path=/`, // The path the cookie is valid for
      `Expires=${new Date(expirationDateTime).toUTCString()}`, // Set expiration date
    ];

    console.log("Query executed successfully:", result);
    context.res = {
      headers: { ...headers, "Set-Cookie": cookieOptions.join("; ") },
      status: 200,
      body: { status, message },
    };
  } catch (err) {
    console.error("SQL error", err);
    context.res = {
      headers,
      status: 500,
      body: JSON.stringify({ error: "Server Error" }),
    };
  }
};
