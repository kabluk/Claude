import type { DirectoryContent } from '@/lib/types'

const c: DirectoryContent = {
  circuitNames: { '2': 'Второй', '5': 'Пятый', '9': 'Девятый', '11': 'Одиннадцатый' },
  facility: {
    labels: {
      addr: 'Адрес',
      phone: 'Телефон',
      tablets: 'Планшеты',
      st: 'Штат',
      circuit: 'Апелляционный округ',
      hours: 'Часы',
    },
    warnByFacility: {
      adelanto: {
        title: 'Адрес путают',
        body: [
          'На сторонних сайтах встречается другой номер дома. Официальный адрес для почты — тот, что указан выше.',
        ],
      },
    },
    lettersH2: 'Письма и открытки',
    letters: [
      'Обычная открытка почтой доходит надёжнее любого сервиса',
      'Книги — только новые и напрямую от продавца',
      'Мягкая обложка: твёрдую проверяют дольше и часто не пропускают',
      'На конверте обязателен A-Number',
    ],
    stateH2: 'Страница штата',
  },
  statePage: {
    lede: 'Суды, учреждения, бесплатная помощь и фонды залога — по штату.',
    circuitLine: 'Апелляционный округ',
    courtsH2: 'Иммиграционные суды',
    facilitiesH2: 'Учреждения',
    helpH2: 'Бесплатная помощь',
    helpLinks: [
      {
        href: 'https://www.justice.gov/eoir/list-pro-bono-legal-service-providers',
        label: 'Список pro bono организаций EOIR',
      },
      { href: 'https://www.freedomforimmigrants.org', label: 'Карта учреждений и ресурсов Freedom for Immigrants' },
      { href: 'https://www.immigrationlawhelp.org', label: 'Каталог бесплатной и недорогой помощи' },
    ],
    fundsH2: 'Фонды залога',
    fundsEmpty:
      'Проверенного списка фондов пока нет. Мы не публикуем ссылки, которые не проверили: мёртвая ссылка хуже отсутствия раздела.',
    fundedLine: 'В этом штате существуют программы бесплатного представительства — списки по ссылкам ниже.',
    verifyNote: 'Списки и телефоны меняются. Дата актуальности — 27 июля 2026.',
  },
}

export default c
