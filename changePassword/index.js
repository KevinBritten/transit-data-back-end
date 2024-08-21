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

  function getTokenFromHeaders(req) {
    const cookieHeader = req.headers.cookie || "";
    const tokenMatch = cookieHeader.match(/accessToken=([^;]+)/);
    return tokenMatch ? tokenMatch[1] : null;
  }

  const accessToken = getTokenFromHeaders(req);

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
      .input("accessToken", sql.VarChar, accessToken)
      .input("oldPassword", sql.VarChar, data.oldPassword)
      .input("password", sql.VarChar, data.password)
      .output("status", sql.Int)
      .output("message", sql.VarChar)
      .execute("ChangePassword");

    const { status, message } = result.output;
    if (status == 401) {
      console.error("Old password incorrect", message);
      context.res = {
        headers,
        status: 401,
        body: JSON.stringify({ error: "Old password incorrect" }),
      };
      return;
    } else if (status != 200) {
      console.error("Invalid access token", message);
      context.res = {
        headers,
        status,
        body: JSON.stringify({ error: "Invalid access token" }),
      };
      return;
    }

    console.log("Query executed successfully:", result);
    context.res = {
      headers,
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
