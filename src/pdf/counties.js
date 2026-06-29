// CountyInfo — Superior Court branch/address per supported county, used to fill
// the FL-100 caption (court name + address). Keyed by the county name as stored
// on the User record. Family-law filing locations for each county.
export const COUNTY_INFO = {
  'Los Angeles': {
    courtName: 'Superior Court of California, County of Los Angeles',
    street: '111 N. Hill Street',
    mailing: '111 N. Hill Street',
    cityZip: 'Los Angeles, CA 90012',
    branch: 'Stanley Mosk Courthouse',
  },
  'San Diego': {
    courtName: 'Superior Court of California, County of San Diego',
    street: '1100 Union Street',
    mailing: '1100 Union Street',
    cityZip: 'San Diego, CA 92101',
    branch: 'Central Division — Family Law',
  },
  Orange: {
    courtName: 'Superior Court of California, County of Orange',
    street: '341 The City Drive South',
    mailing: 'P.O. Box 14171',
    cityZip: 'Orange, CA 92868',
    branch: 'Lamoreaux Justice Center',
  },
  Riverside: {
    courtName: 'Superior Court of California, County of Riverside',
    street: '4175 Main Street',
    mailing: '4175 Main Street',
    cityZip: 'Riverside, CA 92501',
    branch: 'Family Law Division',
  },
  'San Bernardino': {
    courtName: 'Superior Court of California, County of San Bernardino',
    street: '351 N. Arrowhead Avenue',
    mailing: '351 N. Arrowhead Avenue',
    cityZip: 'San Bernardino, CA 92415',
    branch: 'Family Law Division',
  },
}

export const countyInfo = (county) => COUNTY_INFO[county] || null
