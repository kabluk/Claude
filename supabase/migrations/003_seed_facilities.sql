-- ============================================================
-- 003_seed_facilities.sql
-- Seed initial facility data
-- ============================================================

insert into facilities (id, name, address, phone, mail_format_notes, deposit_system, deposit_url, vav_available, vav_notes) values
  (
    gen_random_uuid(),
    'Adelanto ICE Processing Center',
    '10250 Rancho Road, Adelanto, CA 92301',
    '(760) 246-3300',
    'Address mail to: [Detainee Full Name], [A-Number], Adelanto ICE Processing Center, 10250 Rancho Road, Adelanto, CA 92301. A-Number required on all mail.',
    'telmate',
    'https://www.telmate.com',
    true,
    'Virtual attorney visitation available via Telmate. Contact facility to schedule. Attorney must register in advance.'
  );
