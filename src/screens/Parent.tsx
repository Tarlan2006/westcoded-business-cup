import { t } from "../i18n/index";
import { LearnPage } from "./Home";

export function Privacy({ onBack }: { onBack?: () => void }) {
  return (
    <LearnPage title={t("app.privacy")} onBack={onBack} backHref={onBack ? undefined : "/"}>
      <article className="panel parent-panel privacy centered-card">
        <h2>{t("parent.savedOnThisDevice")}</h2>
        <p>{t("parent.needsNoAccountRealNameOrCamera")}</p>
        <h2>{t("parent.voiceIsOptional")}</h2>
        <p>{t("parent.theMicrophoneWorksOnlyWithYourPermission")}</p>
        <h2>{t("parent.questionsInLearn")}</h2>
        <p>{t("parent.askSendsTheQuestionTextToOur")}</p>
        <h2>{t("activitySuggestions.videoLibrary")}</h2>
        <p>{t("parent.videosPlayThroughYoutubeYoutubeMayShow")}</p>
      </article>
    </LearnPage>
  );
}
