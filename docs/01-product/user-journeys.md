# User Journeys

## Journey A — First practice session (happy path)

1. **Land on lobby**  
   User opens the app, sees a Meet-like preview tile (camera off until permission), level selector (Junior / Mid / Senior), and “Start interview”.

2. **Configure session**  
   Optional: estimate duration, select focus tags (e.g. JavaScript, .NET, OOP). Defaults are fine for first run.

3. **Permission gate**  
   User clicks Start → browser prompts for camera and microphone.  
   - Allowed → preview shows self-view; continue.  
   - Denied → clear error + retry / continue with mic-only if camera denied (camera preferred).

4. **Enter room**  
   Three tiles appear: Applicant (live), HR, Technical. Controls bar: mute, camera toggle, leave. Question panel empty until greeting.

5. **Greeting**  
   HR greets (TTS + text). Short intro of how the session will work. User does not need to speak yet (or optional “Ready” click).

6. **Section loop**  
   For each section (see [session flow](../03-interview/session-flow.md)):
   - Active interviewer asks (TTS + on-screen question).
   - Think time (timer visible; user can start early).
   - User clicks mic → speaks → live transcript.
   - User stops mic (or auto-stop on silence later).
   - Interviewer acknowledgment (TTS + text).
   - Delivery feedback card (metrics + tips).
   - User clicks **Next question**.

7. **Section handoff**  
   Brief UI cue: “Moving to Technical interview” when HR section ends; Technical becomes active speaker.

8. **End session**  
   After last question or user leaves → summary screen with link to full report.

9. **Report**  
   List of turns: section, interviewer, question, transcript, delivery scores, advice. User can revisit later (local storage / later DB).

## Journey B — Permission denied

1. Start interview → deny mic.  
2. Block entry to spoken session with explanation.  
3. Offer retry permission. (Typed-answer mode is a post-MVP escape hatch.)

## Journey C — Mid-session leave

1. User clicks Leave during a question.  
2. Confirm dialog: “End session? Progress so far can still be saved to report.”  
3. Partial report for completed turns only.

## Journey D — Weak answer review (post-session)

1. Open report.  
2. Filter by section or low delivery score.  
3. Re-read question + transcript + tips.  
4. (Later) Start a “retry this question” mini-session — out of MVP.

## Journey E — Level change next time

1. Return to lobby.  
2. Switch Mid → Senior.  
3. New session pulls harder technical bank; HR bank stays similar with deeper follow-ups.

## Primary screens touched

| Step | Screen |
| --- | --- |
| Configure | Lobby |
| Permissions | Permission gate / lobby overlay |
| Practice | Live session |
| Review | Report |

See [UI/UX](../02-ux/ui-ux.md) and [wireframes](../02-ux/wireframes.md).
