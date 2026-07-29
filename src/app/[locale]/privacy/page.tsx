import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/PageHeader";
import { pageMeta } from "@/lib/seo";
import {
  ADDRESS_LINE,
  EMAIL,
  LEGAL_NAME,
  PHONE,
  BRAND_NAME,
} from "@/lib/business";

/**
 * Privacy policy.
 *
 * Written from what the code actually does, not from a template: the field
 * list is the enquiry form's schema, the storage description is where the lead
 * route puts it, and the cookie section is the single cookie a live crawl
 * found. Anything the audit could not verify — how long records are kept, for
 * instance — is described in terms of purpose rather than given an invented
 * number.
 *
 * English only for now. The rest of the site is translated, but machine
 * translating a legal document before a lawyer has approved the source is how
 * you end up with eight versions that say slightly different things.
 */
const UPDATED = "2026-07-28";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return pageMeta({ locale, path: "/privacy", title: t("privacyTitle") });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  return (
    <div className="tf-section mx-auto max-w-3xl px-4 md:px-6">
      <PageHeader title={t("privacyTitle")} />
      <p className="mt-4 text-sm text-muted">
        {t("updated")}: {UPDATED}
      </p>

      <div className="tf-prose mt-10">
        <h2>Who we are</h2>
        <p>
          {BRAND_NAME} is operated by {LEGAL_NAME}, a tour operator registered
          in Uzbekistan at {ADDRESS_LINE}. We are the controller of the personal
          data described below. You can reach us at{" "}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a> or {PHONE.display}.
        </p>

        <h2>What we collect</h2>
        <p>
          We collect personal data only when you send us an enquiry. The form
          asks for your name and email address, which are required so that we
          can reply, and optionally your phone number, preferred start date,
          number of travellers and a message. We also record which tour page the
          enquiry came from and which language you were reading the site in, so
          that we answer about the right journey in the right language.
        </p>
        <p>
          We do not run analytics, advertising or any third-party tracking on
          this site. We do not buy personal data, and we do not build profiles.
        </p>

        <h2>Why we may process it, and on what basis</h2>
        <p>
          We use what you send us to answer your enquiry, to prepare and discuss
          a possible itinerary, and — if you go on to travel with us — to
          arrange and deliver that trip. Where you are in the European Economic
          Area, the legal basis is that processing is necessary to take steps at
          your request before entering into a contract, and thereafter to
          perform it. We do not use your enquiry to send marketing unless you
          ask us to.
        </p>

        <h2>Where it goes</h2>
        <p>
          Enquiries are stored in this site&rsquo;s content database, hosted by
          Neon on Amazon Web Services infrastructure in Frankfurt, Germany. A
          notification containing the same details is sent to our team over
          Telegram so that we see it quickly. The site itself is hosted by
          Vercel. These three providers process the data on our behalf and under
          contract; we do not sell or share it with anyone else.
        </p>
        <p>
          Because our team is in Uzbekistan, data stored in the EEA is accessed
          from outside it. Where that transfer concerns personal data protected
          by EU law, it takes place on the basis of the appropriate safeguards
          that apply to that transfer.
        </p>

        <h2>How long we keep it</h2>
        <p>
          We delete the content of an enquiry — your dates, party size and
          message — one year after we last discussed it with you. We keep your
          name and contact details for longer, so that we recognise you if you
          travel with us again and so that we can answer questions about a trip
          you have already taken.
        </p>
        <p>
          You can end that at any time: ask us to delete your details and we
          will, except where we are required to keep a record for accounting or
          tax purposes. We will tell you if that exception applies to you.
        </p>

        <h2>Cookies</h2>
        <p>
          This site sets one cookie, <code>NEXT_LOCALE</code>. It remembers
          which of the eight site languages you chose so that you are not sent
          back to English on your next page. It contains nothing else, it is not
          shared, and it is not used to track you. Because it is strictly
          necessary to provide the language you asked for, we do not ask for
          consent to set it — and because there is no analytics or advertising
          on the site, there is nothing else to consent to.
        </p>

        <h2>Your rights</h2>
        <p>
          You can ask us for a copy of the personal data we hold about you, ask
          us to correct it if it is wrong, ask us to delete it, or object to our
          using it. Write to <a href={`mailto:${EMAIL}`}>{EMAIL}</a> and we will
          respond. If you are in the European Economic Area or the United
          Kingdom and you are not satisfied with our response, you have the
          right to complain to your national data protection authority.
        </p>

        <h2>Automated decisions</h2>
        <p>
          We do not make any decision about you by automated means, and we do
          not profile you.
        </p>

        <h2>Changes</h2>
        <p>
          If we change how we handle personal data, we will update this page and
          the date shown at the top of it.
        </p>
      </div>
    </div>
  );
}
