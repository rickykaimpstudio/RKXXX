/**
 * Defence in depth for metadata we might ingest from legally approved providers.
 * WARNING: words/metadata screening is NOT child-abuse/violence image recognition;
 * never enable user uploads, open UGC, or automatic publishing on this basis.
 * Every external asset still needs a human-reviewed rights/consent/age record.
 */
export const BLOCKED_SUBJECTS = Object.freeze([
  /\b(?:minor|underage|child|children|preteen|teenager|teen|lolita|loli|shota|schoolgirl|schoolboy|kid|kids|adolescen\w*)\b/i,
  /\b(?:mineur\w*|enfant\w*|adolescen\w*|coll[eè]gien\w*|[eé]coli[eè]re?\w*)\b/i,
  /\b(?:rape|raped|raping|nonconsensual|non-consensual|forced sex|sexual assault|unconsenting)\b/i,
  /\b(?:viol(?:e|é|ée|er|ence sexuelle)|agression sexuelle|sans consentement|forc[eé]e?)\b/i,
  /\b(?:bestiality|zoophil\w*|animal sex|sex with animals|incest|inceste|necrophil\w*)\b/i,
  /\b(?:beheading|decapitat\w*|d[eé]capit\w*|gore|snuff|execution|murder|torture|mutilation)\b/i,
  /\b(?:deepfake nudes|revenge porn|hidden camera|voyeurism|secret filming|cam[eé]ra cach[eé]e|images? intimes? non consensuelles?)\b/i,
]);

export function metadataRisk(text) {
  if (typeof text !== 'string') return 'invalid';
  const sample = text.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').slice(0, 500);
  return BLOCKED_SUBJECTS.some((pattern) => pattern.test(sample)) ? 'blocked-subject' : null;
}

/** A verified item can only be published after independent provider & human checks.
 * These flags MUST be assigned by trusted server processes, not by a client or CSV.
 */
export function approvedEntry(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
  if (!['adultembed','pornhub','xvideos','xhamster','licensed-partner'].includes(item.source)) return false;
  if (!item.providerApproved || !item.humanReviewed || !item.rightsVerified ||
      !item.agesVerified || !item.consentVerified || !item.territoryApproved || item.removed === true) return false;
  if (typeof item.title !== 'string' || item.title.length < 2 || item.title.length > 180) return false;
  if (metadataRisk([item.title,item.category,item.description].filter((x) => typeof x === 'string').join(' '))) return false;
  return true;
}

export const SECURITY_BOUNDARIES = Object.freeze({
  userFileUpload: false,
  userVideoUpload: false,
  userGeneratedContent: false,
  privateAdultCalls: false,
  userChatRooms: false,
  adultCheckoutViaStripe: false,
  autoPublishExternalProviderFeed: false,
  serverAgeVerificationRequired: true,
  humanContentReviewRequired: true,
});
