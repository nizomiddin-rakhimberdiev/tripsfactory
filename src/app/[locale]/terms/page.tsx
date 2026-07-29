import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/PageHeader";
import { pageMeta } from "@/lib/seo";
import {
  ADDRESS_LINE,
  BOOKING,
  BRAND_NAME,
  CANCELLATION,
  EMAIL,
  LEGAL_NAME,
  TAX_ID,
} from "@/lib/business";

/**
 * Terms of use and booking conditions.
 *
 * The commercial structure — 20% deposit with a US$300 floor, balance at 45
 * days, and a cancellation scale rising from loss-of-deposit to 100% inside 48
 * hours — was set by the business to match the market norm for Central Asian
 * operators, and supersedes an earlier instruction of payment in full up
 * front. The two could not coexist: the longest-notice bracket charges the
 * deposit and nothing more, which is meaningless without a deposit.
 *
 * The numbers live in lib/business so a percentage cannot drift between this
 * page and an invoice. The wording is this site's own — the policy is a
 * commercial fact and free to adopt, the prose expressing it is not.
 *
 * English only, for the same reason as the privacy policy.
 */
const UPDATED = "2026-07-29";

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
          To hold a booking we ask for a deposit of {BOOKING.depositPercent}% of
          the tour price, and never less than US${BOOKING.depositMinimumUsd}.
          Your booking is confirmed once we have received it and sent you a
          written confirmation; until both have happened, nothing is reserved.
          The deposit is not refundable, because we commit it immediately to
          flights, permits and accommodation held in your name.
        </p>
        <p>
          We invoice the balance after the deposit, and it must reach us no
          later than {BOOKING.balanceDueDays} days before your tour begins. If
          you are booking within {BOOKING.balanceDueDays} days of departure, the
          full price is due at the time of booking unless we agree otherwise
          with you in writing. If a balance is not paid by the date agreed, we
          may treat the booking as cancelled and apply the scale below.
        </p>
        <p>
          Tours are priced and paid in {BOOKING.currency}. We accept bank
          transfer and payment by card through a secure link we send you.
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
          Travel insurance is compulsory for every traveller. You must arrange
          your own cover before you arrive, and it must run for the whole time
          you are with us. It should cover personal injury and medical
          treatment, repatriation, lost or delayed luggage, and cancellation —
          the last of these matters most, because it is what stands between you
          and the charges in the cancellation section above. We may ask to see
          your policy.
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

        <h2>If you cancel</h2>
        <p>
          Cancellations must reach us in writing, from the person who made the
          booking, at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. What you are
          charged depends on how much notice we have, because the money we have
          already committed on your behalf stops being recoverable as departure
          approaches:
        </p>
        <ul>
          {CANCELLATION.map((row) => (
            <li key={row.notice}>
              <strong>{row.notice}</strong> — {row.charge}.
            </li>
          ))}
        </ul>
        <p>
          Once a tour has begun we cannot refund any unused part of it, and that
          includes leaving early through illness. This is what travel insurance
          is for, and why we require it.
        </p>
        <p>
          A tailor-made itinerary can carry different terms, where the suppliers
          we book for you impose their own. Where that is the case we tell you
          before you pay, not afterwards.
        </p>

        <h2>If we cancel or change your tour</h2>
        <p>
          If we cancel before you have paid in full, everything you have paid us
          — including the deposit — is returned to you.
        </p>
        <p>
          After full payment we will only cancel for reasons genuinely outside
          our control: war or civil unrest, a natural disaster, a closed border,
          an epidemic, or a government decision that makes the journey
          impossible. If that happens we will contact you straight away and you
          choose between an equivalent journey and a full refund.
        </p>
        <p>
          Small changes to an itinerary are sometimes unavoidable — a road
          closes, a monument shuts for restoration, a flight is retimed. We will
          tell you and put a comparable arrangement in its place. If we have to
          make a change that materially alters the trip you booked, you may
          accept it, take an alternative, or cancel and be refunded in full.
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
          Once we have confirmed your booking the price is fixed, with one
          exception: if a government introduces or raises a tax, if fuel charges
          rise, or if exchange rates move sharply, we may have to pass that
          through. We will show you exactly what changed and why, and if the
          increase is one you are not willing to accept you may cancel and be
          refunded.
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
