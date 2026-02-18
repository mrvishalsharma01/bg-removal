# Background Removal App

A full-stack web application that removes backgrounds from images using an external AI API. Users sign in with Clerk, get free credits on signup, and can process images; credits are deducted per removal. The app includes a credit system and a buy-credits page (plans UI; payment integration is prepared via Razorpay dependency but not wired in the UI).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)

---

## Features

- **Background removal**: Upload an image; the app sends it to the ClipDrop API and returns an image with the background removed.
- **User authentication**: Sign in/sign up via [Clerk](https://clerk.com). JWT from Clerk is used to authenticate requests to your backend.
- **Credit system**: Each user gets 5 free credits on signup. One credit is consumed per background removal. Credits are stored in MongoDB and synced via Clerk webhooks.
- **Responsive UI**: Built with React and Tailwind CSS; works on mobile and desktop.
- **Result page**: Side-by-side view of original and result, with options to download or try another image.
- **Buy credits page**: Plan cards (Basic, Advanced, Business) are displayed; purchase flow can be extended with Razorpay.

---

## Tech Stack

| Layer        | Technology |
|-------------|------------|
| **Frontend** | React 19, Vite 6, React Router 7, Tailwind CSS 4, Clerk React, Axios, React Toastify |
| **Backend**  | Node.js, Express 5, ES Modules |
| **Database** | MongoDB (Mongoose) |
| **Auth**     | Clerk (hosted auth + webhooks) |
| **Background removal** | ClipDrop API (remove-background v1) |
| **File upload** | Multer (server-side) |
| **Deployment** | Vercel (client + server via `vercel.json`) |

---

## Project Structure

```
bg-removal/
├── client/                 # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── assets/         # Images, SVGs, assets.js (logo, plans, testimonials)
│   │   ├── components/     # Header, Footer, Navbar, Upload, Steps, Testimonials, BgSlider
│   │   ├── context/        # AppContext (credits, image, resultImage, removeBg, loadCredits)
│   │   ├── pages/          # Home, Result, BuyCredit
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                 # Express backend
│   ├── configs/            # mongodb.js (DB connection)
│   ├── controllers/        # UserController (webhooks, credits), ImageController (remove-bg)
│   ├── middlewares/        # auth.js (JWT/clerkId), multer.js (file upload)
│   ├── models/             # userModel (clerkId, email, photo, name, creditBalance)
│   ├── routes/             # userRoutes, imageRoutes
│   ├── server.js
│   └── package.json
├── README.md
└── INTERVIEW_QA.md         # Interview Q&A for this project
```

---

## How It Works

### 1. User flow

1. User visits the app; can sign in via Clerk (navbar “Get Started” or when uploading).
2. On first signup, Clerk fires a `user.created` webhook; your server creates a user in MongoDB with `creditBalance: 5`.
3. User uploads an image (Home or Upload section). If not signed in, Clerk sign-in is opened.
4. Frontend navigates to `/result`, shows the original image and a loading state, and sends the image to `POST /api/image/remove-bg` with the Clerk JWT in headers.
5. Backend checks credits, forwards the image to ClipDrop, decrements credit, and returns the result as a base64 data URL.
6. Result page shows original vs result and offers “Download” and “Try another image.” If credits reach 0, user can be redirected to `/buy`.

### 2. Backend flow (remove background)

- **Route**: `POST /api/image/remove-bg`  
- **Middlewares**: `upload.single('image')` (Multer) → `authUser` (JWT decode, set `req.body.clerkId`).
- **Controller**: Load user by `clerkId`, check `creditBalance > 0`, read file from `req.file.path`, send to ClipDrop with `x-api-key`, get binary response, convert to base64 data URL, decrement credit, respond with `resultImage` and new `creditBalance`.

### 3. Auth

- Frontend: Clerk provides `getToken()`. Token is sent as `token` header to your API.
- Backend: `authUser` uses `jwt.decode(token)` (no signature verification; Clerk JWTs can be verified with Clerk’s JWKS in production). `clerkId` from the token is attached to `req.body` for use in controllers.

### 4. Webhooks

- Clerk sends `user.created`, `user.updated`, `user.deleted` to `POST /api/user/webhooks`.
- Server verifies payload with Svix and the webhook secret, then creates/updates/deletes the user in MongoDB so your DB stays in sync with Clerk.

---

## Setup & Installation

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- [Clerk](https://clerk.com) account (application + API keys)
- [ClipDrop](https://clipdrop.co) API key for background removal

### Backend

```bash
cd server
npm install
cp .env.example .env   # or create .env with required variables
# Edit .env with your MONGODB_URI, CLERK_WEBHOOK_SECRET, CLIPDROP_API
npm run server         # dev with nodemon
# or
npm start              # production
```

### Frontend

```bash
cd client
npm install
# Create .env with VITE_BACKEND_URL and VITE_CLERK_PUBLISHABLE_KEY
npm run dev
```

### Clerk setup

1. Create an application in Clerk.
2. Add Clerk’s webhook endpoint: `https://your-api-domain/api/user/webhooks`.
3. Subscribe to `user.created`, `user.updated`, `user.deleted` and copy the webhook signing secret to `CLERK_WEBHOOK_SECRET`.
4. Use the publishable key in the frontend (`VITE_CLERK_PUBLISHABLE_KEY`).

---

## Environment Variables

### Server (`server/.env`)

| Variable               | Description                          |
|------------------------|--------------------------------------|
| `PORT`                 | Server port (default 4000)           |
| `MONGODB_URI`          | MongoDB connection string            |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret (Svix)  |
| `CLIPDROP_API`         | ClipDrop API key                     |

### Client (`client/.env`)

| Variable                     | Description                    |
|-----------------------------|--------------------------------|
| `VITE_BACKEND_URL`          | Backend base URL (e.g. http://localhost:4000) |
| `VITE_CLERK_PUBLISHABLE_KEY`| Clerk publishable key          |

**Security note:** Do not commit real `.env` files. Use `.env.example` with placeholders and rotate any exposed keys.

---

## API Reference

| Method | Endpoint               | Auth   | Description |
|--------|------------------------|--------|-------------|
| GET    | `/`                    | No     | Health check: “API Working” |
| POST   | `/api/user/webhooks`   | No (Svix) | Clerk webhooks (user created/updated/deleted) |
| GET    | `/api/user/credits`    | Yes (token) | Returns `{ success, credits }` |
| POST   | `/api/image/remove-bg` | Yes (token) | Body: multipart with `image` file. Returns `{ success, resultImage, creditBalance }` or error (e.g. no credits, no file). |

---

## Deployment

- **Client**: Static build (`npm run build` in `client`); can be deployed to Vercel (see `client/vercel.json`).
- **Server**: Deployed as a Node server (e.g. Vercel serverless via `server/vercel.json`). Ensure `MONGODB_URI`, `CLERK_WEBHOOK_SECRET`, and `CLIPDROP_API` are set in the deployment environment.
- **Clerk**: Set production URLs in Clerk dashboard and update webhook URL to the production API.

---

## Possible Improvements

- Verify Clerk JWT signature using JWKS instead of only decoding.
- Add Razorpay (or another provider) on the Buy Credit page for actual payments and credit top-up.
- Add file size/type validation and rate limiting on `/api/image/remove-bg`.
- Optional: delete uploaded files after processing (currently commented in `ImageController`) and configure Multer `destination` for predictable storage.
- Add error boundaries and loading states for a smoother UX.

---

## License

ISC (as per package.json).
