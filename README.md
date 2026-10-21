# Learnova LMS

The active application uses Next.js App Router with TypeScript components.
The original interface and application behavior are preserved.

- `frontend/app/`: native Next.js pages, layouts and API health endpoint.
- `frontend/learnova/`: active components, styles, data and utilities.
- `frontend/lib/`: navigation integration and shared types.
- `frontend/public/`: public assets.
- `frontend/tests/`: browser regression tests.
- `backend/src/`: original Express backend.
- `backend/server/`: original live-class WebSocket signaling service.

Run `npm run dev` from the root or `frontend/`. It starts Next.js and the local
live-class signaling service together, reusing an existing service on port 8080.
The launcher stops only services that it started. Run `npm run backend` in a
separate terminal when the Express service is needed. `npm run signaling` remains
available for running signaling separately. Production `npm start` still needs a
separately managed signaling service (or `NEXT_PUBLIC_SIGNALING_URL`).

Lecture files are stored in `backend/storage/live-materials/` and served through
`/api/live-materials`. Set `LEARNOVA_MATERIALS_DIR` to use another persistent
storage directory. Upload a file, then select **Share with Students** to show it
in the classroom. Images, PDFs and text support previews; office documents have
an open/download link. Earlier metadata-only uploads must be uploaded again.

The root package installs shared dependencies and forwards commands to the two
applications. Alternatively, run frontend commands from `frontend/`, and backend
commands from `backend/`. Next.js generates its build output in `frontend/.next/`.

Checks: `npm run build`, `npm run typecheck`, `npm test`, and
`npm run lint -- --quiet`.

React and React DOM remain required Next.js dependencies. The active TSX
components and browser hooks are part of the Next.js application.

After a production build, run browser regressions with
`node --test frontend/tests/post-migration-regressions.test.mjs`.

Live classroom workflow: a teacher starts a class for an assigned course/batch;
its enrolled students use **Attend Live Class** inside the LMS. No external
Zoom/Meet link is required. Students enter a waiting room; the teacher admits or
rejects them. Classroom controls include actual microphone/camera capture,
approved screen sharing, participant video tiles, raise/lower hand, real-time
chat, mute individual/all students, remove participant, and lock/unlock entry.
Admission survives a reconnect in the same tab; a new browser/tab requires its
own admission. Muting does not allow the teacher to turn on a student's mic.

Teacher recording uses the browser's MediaRecorder and explicit screen-capture
permission. Select the classroom tab with tab audio; stop and **Download
Recording** before leaving. Output is a local WebM file, not a cloud recording
or an automatically archived recording in the LMS. Unsupported browsers show
an error; they do not report a successful recording. Participants see a
recording indicator. Large recordings consume device memory.

The current application still uses demo student/teacher identities and local
enrollments; signaling role declarations are not authenticated server sessions.
Authenticated membership/host enforcement and a TURN service remain necessary
before exposing this as a public production conferencing service. Media uses
peer connections (a small-class mesh), not Zoom's large-meeting infrastructure.
Actual separate-device/WAN sessions have not been verified by the automated tests.

Live checks after a production build:
`node --test frontend/tests/live-class-directory.test.mjs` and
`node --test frontend/tests/live-class-browser.test.mjs`.
The latter uses separate browsers, actual WebRTC, canvas/audio test streams and
validates a real recorded WebM; it does not capture personal devices.
