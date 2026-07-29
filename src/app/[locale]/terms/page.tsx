import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/PageHeader";
import { pageMeta } from "@/lib/seo";
import {
  ADDRESS_LINE,
  BRAND_NAME,
  EMAIL,
  LEGAL_NAME,
  TAX_ID,
} from "@/lib/business";

/**
 * Terms of use, including the booking conditions the business has supplied:
 * payment in full in advance in USD, guaranteed departures, changes up to a
 * month out, compulsory insurance, documents on the traveller.
 *
 * One section is still missing on purpose. The cancellation and refund scale
 * has not been given as numbers — the instruction was to copy another
 * operator's, which is both their copyrighted text and written around a
 * deposit model this business does not use, since it takes 100% up front.
 * Terms that contradict how the money actually moves are worse than an honest
 * gap, so until the percentages arrive the page says the scale comes with the
 * booking confirmation rather than inventing one.
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
          This website is operated by {LEGAL_NAME}, trading as {BRAND_NAME}, a
          tour operator registered in Uzbekistan at {ADDRESS_LINE}, taxpayer
          identification number {TAX_ID}. By using the site you agree to the
          terms below. If you do not agree with them, please do not use the
          site.
        </p>

        <h2>An enquiry is not a booking</h2>
        <p>
          The forms on this site send us an enquiry. An enquiry places you under
          no obligation and does not reserve anything. No trip is booked, and no
          contract exists between us, until we have confirmed your reservation
          in writing and you have paid for it.
        </p>

        <h2>Payment</h2>
        <p>
          Tours are paid in full in advance, in US dollars. We accept payment by
          bank transfer, or by bank card through a payment link we send you. A
          reservation is confirmed once payment has reached us.
        </p>

        <h2>Guaranteed departures</h2>
        <p>
          A departure we have confirmed to you runs as booked. We do not cancel
          a group tour for want of numbers, and you do not need to wait to hear
          whether enough people joined.
        </p>

        <h2>Changing a booking</h2>
        <p>
          You may change your travel dates or the names of travellers up to one
          month before departure. Later than that we cannot guarantee a change,
          because flights, permits and accommodation will already have been
          issued in the names and for the dates given.
        </p>

        <h2>Travel insurance</h2>
        <p>
          Travel insurance is compulsory. You must arrange your own cover before
          you arrive, and it should include medical treatment and repatriation
          for the whole time you are travelling with us. We may ask to see it.
        </p>

        <h2>Visas, passports and documents</h2>
        <p>
          Making sure you hold a valid passport, the correct visa and any other
          document your journey requires is your responsibility, as is meeting
          the entry rules of every country on the itinerary. We will tell you
          what we know and provide supporting letters where they help, but we
          cannot be responsible for a traveller being refused entry or boarding
          because a document was missing or invalid.
        </p>

        <h2>Cancellation</h2>
        <p>
          If you need to cancel, tell us in writing as soon as you can — what
          you can recover depends on how far ahead of departure we hear, because
          flights, permits and accommodation are paid for on your behalf and
          become non-refundable at different points. The scale that applies to
          your trip is set out in your booking confirmation. Ask us before you
          pay if you would like to see it first, and we will send it.
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

        <h2>If something goes wrong</h2>
        <p>
          Tell us while you are still travelling if you can — most problems are
          quicker to put right on the spot. If you want to make a formal
          complaint, send it to <a href={`mailto:${EMAIL}`}>{EMAIL}</a> or call
          us on the numbers given on our{" "}
          <a href={`/${locale}/contact`}>contact page</a>, and we will respond.
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
