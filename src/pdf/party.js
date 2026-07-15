// Single source for the petitioner's "party without attorney" contact block,
// shared by every form in the packet so the caption is filled identically.
// Address is stored STRUCTURALLY (separate fields), not as one line.
//
// `a` is the flat answers map ({ field_key: value }). A legacy single-line
// petitioner_address (if present) falls back into the street field.
export function buildPartyContact(a = {}) {
  return {
    party_name: a.petitioner_name || '',
    attorney_for: 'Self (Pro Per)',
    party_street: a.party_street || a.petitioner_address || '',
    party_city: a.party_city || '',
    party_state: a.party_state || '',
    party_zip: a.party_zip || '',
    party_phone: a.party_phone || a.petitioner_phone || '',
    party_email: a.party_email || '',
  }
}
