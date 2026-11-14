import { LearnPage } from "./Home";
import { APP_NAME } from "../brand";

export function Privacy({ onBack }: { onBack?: () => void }) {
  return (
    <LearnPage title="Privacy" onBack={onBack} backHref={onBack ? undefined : "/"}>
      <article className="panel parent-panel privacy centered-card">
        <h2>Saved on this device</h2>
        <p>{APP_NAME} needs no account, real name, or camera. Names, notes, settings, and game progress stay in this browser. Requests may include age groups and topics from your choices. Clear this site’s data in your browser settings to erase it.</p>
        <h2>Voice is optional</h2>
        <p>The microphone works only with your permission. Hold the talk button to speak. Cloudflare Workers AI turns your voice into text. When enabled, Groq receives game words to choose a reply. {APP_NAME} does not save voice recordings or their text here. Avoid saying names or other personal details. You can play every mission with buttons.</p>
        <h2>Questions in Learn</h2>
        <p>Ask {APP_NAME} sends the question text to our server. When enabled, Groq receives your question to answer it. {APP_NAME} does not save your questions or log them. Please leave out names, addresses, schools, and phone numbers.</p>
        <h2>Video library</h2>
        <p>Videos play through YouTube. YouTube may show ads or suggest other videos. For ages 1–2, videos start without sound. Tap to hear them. You can turn off the next video's automatic start. Older children tap to start their first video.</p>
      </article>
    </LearnPage>
  );
}
