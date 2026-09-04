# ReflectAI: User-Authenticated AI Journal & Reflection Assistant

ReflectAI is a production-grade full-stack journaling and reflection application built with **React**, **Express**, **Firebase Authentication (Google Sign-In)**, **Cloud Firestore**, and the **Gemini 3.6 Flash API** via `@google/genai`.

The system strictly enforces user data isolation through owner-bound Firestore security rules, protects secret API credentials behind a resilient server-side proxy, and incorporates an automated multi-model fallback ladder.

---

## Architecture & Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Tailwind CSS + Vite | Responsive, accessible journaling canvas, conversation stream, and history panel. |
| **Backend Service** | Express 4.x (Node.js ESM/CJS) | Server-side API proxy shielding `GEMINI_API_KEY`, request validation, and Vite middleware. |
| **User Identity** | Firebase Authentication | Secure Federated Identity via Google Sign-In with zero client-side password handling. |
| **Backend Database** | Cloud Firestore | Isolated document storage for multi-turn user reflections, dialogues, and AI summaries. |
| **AI Processing Engine** | Gemini 3.6 Flash (`@google/genai`) | Empathetic reflection companion and structured insight synthesis with fallback ladder. |
| **Secret Management** | Google Cloud Secret Manager / Env Vars | Secure credential injection preventing token leakage. |

---

## 1. Prerequisites & GCP Setup

### Enable Google Cloud APIs
Ensure you have the Google Cloud SDK (`gcloud`) installed and authenticated:

```bash
# Set your active GCP project
gcloud config set project YOUR_PROJECT_ID

# Enable essential GCP APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  identitytoolkit.googleapis.com
```

---

## 2. Cloud Firestore Security Configuration

ReflectAI ensures that reflections and conversational interactions are strictly scoped to the authenticated owner. Deploy the following security rules to Firestore:

### `firestore.rules`
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /reflections/{reflectionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### Deploy Rules via Firebase CLI
```bash
firebase deploy --only firestore:rules
```

---

## 3. Secret Management Setup

Gemini API keys must never be exposed to the client browser. Store the `GEMINI_API_KEY` securely in Google Cloud Secret Manager and grant read access to Cloud Run's compute service account.

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Identify your Project Number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')

# 3. Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file containing your Gemini key:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The unified Express + Vite dev server will listen on `http://localhost:3000`.

4. **Verify build and type checks**:
   ```bash
   npm run lint
   npm run build
   ```

---

## 5. Cloud Run Deployment Flow

Deploy ReflectAI directly to Google Cloud Run with container builds:

```bash
# Build and deploy service to Cloud Run
gcloud run deploy reflect-ai \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

---

## 6. Required Campaign Verification Binding

Apply the mandatory resource label to register your Cloud Run service for automated challenge verification:

```bash
gcloud run services update reflect-ai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 7. Model Resilience Protocol

Server-side generation calls in `server.ts` utilize a resilient automated model fallback ladder:
1. `gemini-3.6-flash` (Primary fast multimodal model)
2. `gemini-3.1-flash-lite` (High-availability fallback)
3. `gemini-flash-latest` (Dynamic alias)
4. `gemini-3.7-flash` (Deep reasoning fallback)

This guarantees recovery from transient `503 UNAVAILABLE`, `429 RESOURCE_EXHAUSTED`, or upstream outages without degrading the user experience.
