# Transit Data Back End

This repo contains the backend functions which query the database connected to https://github.com/KevinBritten/Transit-Data-Front-End/.

## API Reference

This backend service provides a set of API endpoints to manage user authentication and data retrieval through HTTP triggers. Below is a reference for each available endpoint:

### `POST /api/changepassword`

- **Description:** Changes the password of a user.
- **Invoke URL:** `https://transitvanierbackend.azurewebsites.net/api/changepassword`
- **Request Parameters:**
  - `accessToken` (cookie): The token for authenticating the request.
  - `oldPassword` (string): The current password of the user.
  - `password` (string): The new password to be set.
- **Outputs:**
  - `status` (int): Status code of the operation.
  - `message` (string): Result message.

### `POST /api/checktoken`

- **Description:** Checks the validity of the access token.
- **Invoke URL:** `https://transitvanierbackend.azurewebsites.net/api/checktoken`
- **Request Parameters:**
  - `accessToken` (cookie): The token to be validated.
- **Outputs:**
  - `status` (int): Status code of the validation.
  - `message` (string): Result message.

### `POST /api/getdatafromprocedure`

- **Description:** Retrieves data by executing a stored procedure.
- **Invoke URL:** `https://transitvanierbackend.azurewebsites.net/api/getdatafromprocedure`
- **Request Parameters:**
  - `accessToken` (cookie): The token to be validated.
  - `procedureName` (string): The procedure to call from the following list [
    "LongTermRevenueSummary",
    "LongTermTrafficProc",
    "MidTermRevenueSummary",
    "MidTermTraffic",
    "RevenueDetailsFareProducts",
    "RevenueDetailsPOS",
    "ShortTermTrafficProc",
    ]
  - `params` (array): An array of objects containing additional parameters depending on which procedure is called.
- **Outputs:** The data returned by the stored procedure.

### `POST /api/loginuser`

- **Description:** Authenticates a user and returns an access token.
- **Invoke URL:** `https://transitvanierbackend.azurewebsites.net/api/loginuser`
- **Request Parameters:**
  - `username` (string): The username of the user.
  - `password` (string): The password of the user.
- **Outputs:**
  - `status` (int): Status code of the authentication.
  - `message` (string): Result message.
  - `accessToken` (string): The access token to be used for authenticated requests (sent as a cookie).
  - `expirationDateTime` (DateTime): The expiration date and time of the access token.

### `POST /api/logoutuser`

- **Description:** Logs out a user by invalidating the access token.
- **Invoke URL:** `https://transitvanierbackend.azurewebsites.net/api/logoutuser`
- **Request Parameters:**
  - `accessToken` (cookie): The token to be invalidated.
- **Outputs:**
  - `status` (int): Status code of the operation.
  - `message` (string): Result message.

### `POST /api/signupuser`

- **Description:** Registers a new user in the system.
- **Invoke URL:** `https://transitvanierbackend.azurewebsites.net/api/signupuser`
- **Request Parameters:**
  - `agencyID` (int): The agency ID associated with the user.
  - `firstName` (string): The first name of the user.
  - `lastName` (string): The last name of the user.
  - `username` (string): The username of the user.
  - `password` (string): The password for the new user.
- **Outputs:**
  - `status` (int): Status code of the operation.
  - `message` (string): Result message.
