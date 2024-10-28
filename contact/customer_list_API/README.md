# API Demo for Connecting UI and Backend(Express)
This is demonstration of connecting UI to Backend using HTML,CSS, JavaScript and Express.

## Running the API
1. Ensure Express.js is installed by running:
   ```
   npm install express
   ```
2. Install the nodemon module. This module enables your server to restart on its when changes are applied to the server files.
   ```
   npm install nodemon
   ```
3. Run the server by typing the command below:
   ```
   nodemon  index.js
   ```
4. The API will be running at http://localhost:3000

## API Endpoints/Routes
- Root Route or `/`: Displays available routes.
- GET `/api/users`: Returns all users.
- GET `/api/users/(id)`: Fetches a specific user by ID.
- GET `/api/users/(id)/(name)/(email)/(age)/(salary)`: Retrieves and displays parameters. Replace (id) and others with actual values.
- POST `/api/users`: Adds a new user through a form submission page.
- DELETE `/api/delete/(id)`: Deletes a user by ID.
