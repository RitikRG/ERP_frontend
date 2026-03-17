# Frontend

Angular frontend for the ERP application.

## Stack

- Angular 20
- Angular Router
- Angular Material
- Font Awesome
- Chart.js / `ng2-charts`
- ZXing for scanning features

## Project Structure

```text
frontend/
  public/
  src/
    app/
      auth/
      core/
      org/
      pages/
      partials/
      services/
    enviornment/
```

## Main App Areas

The application includes routes and screens for:

- Authentication
- Organisation registration
- Dashboard
- Product management
- Supplier management
- Inventory and purchases
- Sales
- Customers and dues
- User and organisation settings

Most business routes are protected by `authGuard`.

## Requirements

- Node.js
- Angular CLI dependencies are installed through `npm install`
- Backend API running and reachable

## Install

```bash
cd frontend
npm install
```

## Run

```bash
npm start
```

Default development URL:

```text
http://localhost:4200
```

## Build

```bash
npm run build
```

## Test

```bash
npm test
```

## Backend Connection

The main frontend services use:

```text
src/enviornment/enviornment.ts
```

Current API base:

```text
https://localhost:4000/api
```

## Important Notes

- The folder is named `enviornment`, not `environment`.
- `src/app/api.service.ts` still hardcodes `http://localhost:3000/api/` and appears separate from the newer service structure that uses `environment.apiUrl`.
- The backend currently has mixed port defaults (`3000` in `server.js`, `4000` in `config.js`), so local setup is simplest if the backend is explicitly started on `4000`.
- The backend runs over HTTPS, so the browser may require you to trust the local development certificate before API requests succeed cleanly.

## Useful Commands

```bash
npm start
npm run build
npm run watch
npm test
```
