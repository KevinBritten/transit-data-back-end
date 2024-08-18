module.exports = async function (context, req) {
  const sql = require("mssql");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    context.res = {
      headers: {
        "Access-Control-Allow-Origin": "*",
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
    requestTimeout: 60000,
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
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
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
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      status: 400,
      body: JSON.stringify({ error: "Invalid parameters." }),
    };
    return;
  }

  try {
    console.log("Attempting to connect to the database...");
    let pool = await sql.connect(config);
    console.log("Connected to the database successfully.");

    let request = pool.request();
    let result = await getResult(data, request);

    console.log("Query executed successfully:", result);
    context.res = {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      status: 200,
      body: JSON.stringify(result.recordsets),
    };
  } catch (err) {
    console.error("SQL error", err);
    context.res = {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
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
