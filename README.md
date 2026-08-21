# EmpowHer

EmpowHer is a simple MERN app for a hyperlocal support network for women and trusted workers.

## Features

- MVC backend with controllers, routes, middlewares, models, and config folders
- React client inside the `client` folder
- Tailwind CSS setup
- Login as a woman user or as a worker
- PIN-code based locality selection with Indian post office results
- Same-locality dashboard connections
- Women can mark local workers safe and increase their safety rating
- Safety Pin option shows a "to be implemented soon" message

## Run

```bash
npm install
npm run dev
```

Client: `http://127.0.0.1:5173`

API health: `http://127.0.0.1:4000/api/health`

## Notes

## Project Structure

```text
client/
  src/
    pages/
    services/
server/
  src/
    config/
    controllers/
    middlewares/
    models/
    routes/
```

## Environment

Server env is already placed at `server/.env`.

Client env is already placed at `client/.env`.

Locality selection uses the free Postal PIN Code API from the client, so no map API key is needed for signup or locality changes.

The app uses MongoDB from `server/.env`:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/empowher
```
