# Sunshine – Frontend

The frontend of our project, built using React. It provides the user interface and allows users to interact with the system.

## Technologies Used

* React
* JavaScript
* CSS

## Installation and Setup

1. Clone the repository.

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL displayed in your terminal.

## Backend

The frontend is prepared to communicate with a Laravel API through the centralized client at
`src/services/apiClient.js`. API endpoints will be integrated as the corresponding frontend features are
implemented.

### Environment configuration

Set the public API base URL in your local `.env` file:

```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

All Vite variables are exposed in the browser. Do not place passwords, tokens, API keys, or other secrets in
`VITE_*` variables.

### API client

Use `apiClient` from `src/services/apiClient.js` for JSON API requests instead of configuring `fetch` in
individual components. It supports `get`, `post`, `put`, `patch`, and `delete`, and returns JSON data or `null`
for a `204 No Content` response.

The client is authentication-ready: a future authentication feature can register a token provider with
`setAuthTokenProvider`. No token storage or token name has been assumed yet.

## Developers

## Project Management, Scrum, Analysis, Compilation
Sy, John Howell J.
## Categorization Strategy, Use Case Diagram
Suan, Christopher B.
## Database, ERD, Data Models
Vasquez, Aljrome 
## Architecture, DFD
Tinasas, Shiela Mae C. 
## Business Rules, Alert Logic, FIFO Engine
Zarate, Christopher M.
## QA, Validation, Testing Scenarios 
Vecina, Aryana C. 
