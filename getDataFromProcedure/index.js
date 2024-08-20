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

  const allowedProcedures = [
    "LongTermRevenueSummary",
    "LongTermTrafficProc",
    "MidTermRevenueSummary",
    "MidTermTraffic",
    "RevenueDetailsFareProducts",
    "RevenueDetailsPOS",
    "ShortTermTrafficProc",
  ];

  let data = req.body; // Use real data in production

  // Check if the procedure is allowed
  if (!allowedProcedures.includes(data.procedure)) {
    context.res = {
      headers,
      status: 400,
      body: JSON.stringify({ error: "Invalid procedure name." }),
    };
    return;
  }

  // Validate the params before proceeding
  const isValid = data.params.every((param) => {
    return (
      typeof param.key === "string" &&
      typeof param.value !== "undefined" &&
      sql[param.type] // Ensure the type is valid in mssql
    );
  });

  if (!isValid) {
    context.res = {
      headers,
      status: 400,
      body: JSON.stringify({ error: "Invalid parameters." }),
    };
    return;
  }

  try {
    console.log("Attempting to connect to the database...");
    let pool = await sql.connect(config);
    console.log("Connected to the database successfully.");

    let result = await pool
      .request()
      .input("accessToken", sql.VarChar, accessToken)
      .output("status", sql.Int)
      .output("message", sql.VarChar)
      .execute("checkToken");

    const { status, message } = result.output;

    if (status != 200) {
      console.error("Invalid access token", message);
      context.res = {
        headers,
        status: 401,
        body: JSON.stringify({ error: "Invalid access token" }),
      };
      return;
    }

    let request = pool.request();

    result = await getResult(data, request);

    console.log("Query executed successfully:", result);
    context.res = {
      headers,
      status: 200,
      body: JSON.stringify(result.recordsets),
    };
  } catch (err) {
    console.error("SQL error", err);
    context.res = {
      headers,
      status: 500,
      body: JSON.stringify({ error: "Server Error" }),
    };
  }

  async function getResult(data, request) {
    let { procedure, params } = data;
    params.forEach((param) => {
      let { key, type, value } = param;
      request.input(key, sql[type], value);
    });

    return await request.execute(procedure);
  }
};
