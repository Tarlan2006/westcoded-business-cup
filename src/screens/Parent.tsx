import { LearnPage } from "./Home";
import { APP_NAME } from "../brand";

export function Privacy({ onBack }: { onBack?: () => void }) {
  return (
    <LearnPage title="Privacy" onBack={onBack} backHref={onBack ? undefined : "/"}>
      <article className="panel parent-panel privacy centered-card">
        <h2>Profiles stay on this device</h2>
        <p>{APP_NAME} needs no account, real name, or camera. The nickname, optional notes, setup choices, and game progress stay in this browser. Requests can include an age range and topics based on the selected needs. Clear this site’s data in your browser settings to remove the saved profile.</p>
        <h2>Voice is optional</h2>
        <p>The microphone is used for a round only when you hold the talk button and allow access. Cloudflare Workers AI transcribes the audio for that request. When Groq is enabled, it receives words from the game’s vocabulary to choose the next response. {APP_NAME} saves neither audio nor transcripts to the profile. Avoid saying names or other personal details. You can play every mission with buttons.</p>
        <h2>Questions in Learn</h2>
        <p>Ask {APP_NAME} sends the question text to our server. If Groq is enabled, it receives the question to answer it. {APP_NAME} does not save questions to the profile or record them in its logs. Please leave out names, addresses, schools, and phone numbers.</p>
        <h2>Video library</h2>
        <p>When you open a video, its player loads from YouTube and may show ads or related videos. You choose when to start playback.</p>
      </article>
    </LearnPage>
  );
}
