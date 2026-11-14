import type { AnalysisResult } from "@/lib/types";

/**
 * SINGLE SWAP POINT. When the idea is chosen, edit this file (see docs/IDEA_SWAP.md).
 * The preset below is a PLACEHOLDER (medical bill checker) so the skeleton demos end-to-end.
 */
export const product = {
  name: "BillCheck",
  track: "Money" as "Money" | "Entertainment" | "Skills",
  tagline: "Found a surprise bill? Find out in 60 seconds if you can fight it.",
  subtitle:
    "Paste your medical bill or insurance denial. Get the errors, what to dispute, and a ready-to-send letter.",
  audience: "Americans 25-45 with employer or marketplace health insurance",

  input: {
    label: "Paste your bill, EOB or denial letter",
    placeholder: "Paste the text of your bill here. Remove your name and account numbers if you like.",
    maxChars: 12000,
    sampleLabel: "Try a sample bill",
    sampleText: `ST. MARY GENERAL HOSPITAL - ITEMIZED STATEMENT
Date of service: 03/12/2026   Insurance: Aetna PPO (in-network facility)
99285 Emergency dept visit, level 5 ........ $2,850.00
99285 Emergency dept visit, level 5 ........ $2,850.00
36415 Venipuncture ......................... $85.00
85025 CBC w/ diff .......................... $190.00
80053 Comprehensive metabolic panel ........ $240.00
71046 Chest X-ray, 2 views ................. $620.00
Anesthesia group (OUT OF NETWORK) .......... $1,900.00
Total billed ............................... $8,735.00
Insurance paid ............................. $1,200.00
Patient responsibility ..................... $7,535.00`,
  },

  /** System prompt for the LLM. Must keep the JSON contract at the end. */
  systemPrompt: `You are a careful US consumer-advocate assistant helping adults find errors and savings in their medical bills.
Given the user's pasted text, identify: duplicate charges, upcoding, unbundled services, out-of-network charges at in-network facilities (No Surprises Act), charges that look inconsistent with insurance payment, and anything worth disputing.
Be concrete with dollar amounts taken from the text. Do not invent numbers that are not supported by the text; say "unclear" instead.
You are not a lawyer or doctor. Never give legal or medical advice; give information and suggest next steps.
Return ONLY valid JSON, no markdown, matching this TypeScript type:
{ "headline": string, "summary": string, "totalUsd": number, "findings": [{"title": string, "detail": string, "severity": "high"|"medium"|"low", "amountUsd": number}], "nextSteps": string[], "draft": string }
"draft" is a polite, firm dispute letter the user can send to the billing department, using placeholders like [Your name], [Account #].`,

  /** Shown when no API key is configured, or the model fails. Keeps the live demo alive. */
  sampleResult: {
    headline: "We found 3 issues worth disputing",
    summary:
      "A likely duplicate ER charge and an out-of-network anesthesia bill at an in-network hospital could be reduced or removed.",
    totalUsd: 4750,
    findings: [
      {
        title: "Possible duplicate: ER visit level 5 billed twice",
        detail: "Code 99285 appears twice on the same date of service for $2,850 each.",
        severity: "high",
        amountUsd: 2850,
      },
      {
        title: "Out-of-network anesthesia at an in-network hospital",
        detail:
          "The No Surprises Act generally protects you from balance billing for out-of-network providers at in-network facilities in many situations.",
        severity: "high",
        amountUsd: 1900,
      },
      {
        title: "Patient responsibility looks high versus insurance payment",
        detail: "Insurance paid $1,200 on $8,735 billed. Ask for the EOB to confirm the allowed amount.",
        severity: "medium",
      },
    ],
    nextSteps: [
      "Request an itemized bill and your insurer's Explanation of Benefits (EOB).",
      "Call billing, ask them to review the duplicate 99285 line, and write down the date, name and reference number.",
      "Send the dispute letter below and ask for collections to be paused while it is reviewed.",
      "If the anesthesia bill stays, file a complaint through the federal No Surprises help desk.",
    ],
    draft: `Dear Billing Department,

I am writing to dispute charges on my statement for date of service 03/12/2026 (Account # [Account #]).

1. CPT 99285 appears twice on the same date for $2,850.00 each. Please review and remove the duplicate.
2. An out-of-network anesthesia charge of $1,900.00 was billed although the facility is in-network. Please review under the No Surprises Act and remove or reprice it.

Please provide an itemized bill and place the account on hold while this dispute is reviewed.

Sincerely,
[Your name]`,
  } satisfies AnalysisResult,

  pricing: {
    freeUses: 2,
    priceLabel: "$9",
    priceNote: "one-time per case, or $4.99/mo for unlimited checks",
    cta: "Unlock full report + letter",
  },

  /** Landing page copy. */
  pains: [
    "Nearly half of insured adults get a bill they didn't expect to pay.",
    "Most people never dispute it, even though disputes often work.",
    "Nobody tells you where to start.",
  ],
  steps: [
    { title: "Paste", text: "Drop in your bill, EOB or denial letter." },
    { title: "Review", text: "See errors, duplicates and what is worth disputing." },
    { title: "Send", text: "Copy a ready-made letter and the exact next steps." },
  ],
  disclaimer:
    "Informational only. Not legal, medical or financial advice. Do not paste anything you are not comfortable sharing.",
};

export type Product = typeof product;
