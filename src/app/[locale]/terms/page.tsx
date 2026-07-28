import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/PageHeader";
import { pageMeta } from "@/lib/seo";
import { ADDRESS_LINE, BRAND_NAME, EMAIL, LEGAL_NAME } from "@/lib/business";

/**
 * Terms of use.
 *
 * Scoped to what this site actually is: a brochure that takes enquiries. There
 * is no checkout, no payment and no online booking, so there are no payment,
 * cancellation or refund terms here — and none have been written, because the
 * business has not supplied them and inventing a cancellation policy would be
 * worse than having none. Those belong in the booking conditions that go with
 * a confirmed reservation, and the section below says so plainly rather than
 * leaving a visitor to assume this page covers it.
 *
 * English only, for the same reason as the privacy policy.
 */
const UPDATED = "2026-07-28";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return pageMeta({ locale, path: "/terms", title: t("termsTitle") });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  return (
    <div className="tf-section mx-auto max-w-3xl px-4 md:px-6">
      <PageHeader title={t("termsTitle")} />
      <p className="mt-4 text-sm text-muted">
        {t("updated")}: {UPDATED}
      </p>

      <div className="tf-prose mt-10">
        <h2>Who these terms are with</h2>
        <p>
          This website is operated by {LEGAL_NAME}, trading as {BRAND_NAME},
          registered in Uzbekistan at {ADDRESS_LINE}. By using the site you
          agree to the terms below. If you do not agree with them, please do not
          use the site.
        </p>

        <h2>An enquiry is not a booking</h2>
        <p>
          The forms on this site send us an enquiry. An enquiry places you under
          no obligation and does not reserve anything. No trip is booked, and no
          contract exists between us, until we have confirmed your reservation
          in writing and you have accepted the booking conditions that come with
          it. Those booking conditions — including what you pay and when, and
          what happens if either of us cancels or changes the trip — are set out
          separately at the time of booking and are not part of this page.
        </p>

        <h2>Prices and itineraries</h2>
        <p>
          Prices shown are indicative starting prices in US dollars, per person,
          and depend on the season, the group size and what is included. Prices
          in other currencies shown anywhere on the site are approximate
          conversions for guidance only. Itineraries describe what we plan to
          do; weather, road and border conditions, local closures and the
          availability of guides and accommodation can all require a change, and
          we will tell you if that happens.
        </p>
        <p>
          We take care to keep the information on this site accurate and
          current, but we do not warrant that every detail is free of error at
          every moment. Confirmed details are those we give you in writing for
          your trip.
        </p>

        <h2>Using the site</h2>
        <p>
          The text, photographs, itineraries and design on this site belong to
          us or are used with permission. You may read, share and print pages
          for your own use in planning travel. You may not copy or republish
          them commercially, or use automated means to extract the content in
          bulk, without our written permission.
        </p>
        <p>
          Please do not use the enquiry forms to send unsolicited advertising,
          anything unlawful, or anything designed to interfere with the site.
        </p>

        <h2>Links to other sites</h2>
        <p>
          Where we link to another organisation&rsquo;s website or to a social
          media profile, we do so for your convenience. We do not control those
          sites and are not responsible for their content or their handling of
          your data.
        </p>

        <h2>Your privacy</h2>
        <p>
          What we do with the personal data you send us is described in our{" "}
          <a href={`/${locale}/privacy`}>{t("privacyTitle")}</a>.
        </p>

        <h2>Law</h2>
        <p>
          These terms are governed by the law of the Republic of Uzbekistan.
          Nothing here limits any right you have under the mandatory consumer
          law of the country in which you live.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent to{" "}
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
        </p>
      </div>
    </div>
  );
}
