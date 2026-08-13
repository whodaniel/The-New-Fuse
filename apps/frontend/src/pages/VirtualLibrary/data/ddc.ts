import type { ClassificationNode } from '../types';

export const DDC_NODES: ClassificationNode[] = [
  {
    code: '000',
    label: 'Computer Science & General Works',
    description: 'Computer science, knowledge, systems, news',
    parentId: undefined,
    system: 'ddc',
    crosswalks: { lcc: ['A', 'Z'], udc: ['0'] },
    color: 0x4a6fa5,
    childrenIds: ['001', '010', '020', '030', '040', '050', '060', '070', '080', '090'],
  },
  {
    code: '100',
    label: 'Philosophy & Psychology',
    description: 'Philosophy, psychology, logic, ethics',
    parentId: undefined,
    system: 'ddc',
    crosswalks: { lcc: ['B'], udc: ['1'] },
    color: 0x7b4a8c,
    childrenIds: ['110', '120', '130', '140', '150', '160', '170', '180', '190'],
  },
  {
    code: '200',
    label: 'Religion',
    description: 'Religion, mythology, theology',
    parentId: undefined,
    system: 'ddc',
    crosswalks: { lcc: ['BL', 'BM', 'BP', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BX'], udc: ['2'] },
    color: 0xc4a35a,
    childrenIds: ['210', '220', '230', '240', '250', '260', '270', '280', '290'],
  },
  {
    code: '300',
    label: 'Social Sciences',
    description: 'Social sciences, economics, law, education',
    parentId: undefined,
    system: 'ddc',
    crosswalks: { lcc: ['H', 'J', 'K', 'L'], udc: ['3'] },
    color: 0x8b3a3a,
    childrenIds: ['310', '320', '330', '340', '350', '360', '370', '380', '390'],
  },
  {
    code: '400',
    label: 'Language',
    description: 'Language, linguistics, literature',
    parentId: undefined,
    system: 'ddc',
    crosswalks: { lcc: ['P'], udc: ['8'] },
    color: 0x3a7b5e,
    childrenIds: ['410', '420', '430', '440', '450', '460', '470', '480', '490'],
  },
  {
    code: '500',
    label: 'Science',
    description: 'Natural sciences, mathematics, astronomy',
    parentId: undefined,
    system: 'ddc',
    crosswalks: { lcc: ['Q'], udc: ['5'] },
    color: 0x2d7d9a,
    childrenIds: ['510', '520', '530', '540', '550', '560', '570', '580', '590'],
  },
  {
    code: '600',
    label: 'Technology',
    description: 'Technology, medicine, engineering, agriculture',
    parentId: undefined,
    system: 'ddc',
    crosswalks: { lcc: ['T', 'R'], udc: ['6'] },
    color: 0xb35c2e,
    childrenIds: ['610', '620', '630', '640', '650', '660', '670', '680', '690'],
  },
  {
    code: '700',
    label: 'Arts & Recreation',
    description: 'Arts, sports, music, recreation',
    parentId: undefined,
    system: 'ddc',
    crosswalks: { lcc: ['N', 'M', 'GV'], udc: ['7'] },
    color: 0xa83256,
    childrenIds: ['710', '720', '730', '740', '750', '760', '770', '780', '790'],
  },
  {
    code: '800',
    label: 'Literature',
    description: 'Literature, rhetoric, criticism',
    parentId: undefined,
    system: 'ddc',
    crosswalks: { lcc: ['PN', 'PQ', 'PR', 'PS', 'PT'], udc: ['8'] },
    color: 0x5a3a8b,
    childrenIds: ['810', '820', '830', '840', '850', '860', '870', '880', '890'],
  },
  {
    code: '900',
    label: 'History & Geography',
    description: 'History, biography, geography, travel',
    parentId: undefined,
    system: 'ddc',
    crosswalks: { lcc: ['D', 'E', 'F', 'G'], udc: ['9'] },
    color: 0x6b4a3a,
    childrenIds: ['910', '920', '930', '940', '950', '960', '970', '980', '990'],
  },

  // 000 divisions
  { code: '001', label: 'Knowledge', parentId: '000', system: 'ddc', crosswalks: { lcc: ['AZ'] }, color: 0x4a6fa5, childrenIds: [] },
  { code: '010', label: 'Bibliographies', parentId: '000', system: 'ddc', crosswalks: { lcc: ['Z'] }, color: 0x4a6fa5, childrenIds: [] },
  { code: '020', label: 'Library & Information Sciences', parentId: '000', system: 'ddc', crosswalks: { lcc: ['Z'] }, color: 0x4a6fa5, childrenIds: [] },
  { code: '030', label: 'Encyclopedias & Books of Facts', parentId: '000', system: 'ddc', crosswalks: { lcc: ['AE'] }, color: 0x4a6fa5, childrenIds: [] },
  { code: '050', label: 'Magazines & Serials', parentId: '000', system: 'ddc', crosswalks: { lcc: ['AP'] }, color: 0x4a6fa5, childrenIds: [] },
  { code: '060', label: 'Associations & Organizations', parentId: '000', system: 'ddc', crosswalks: { lcc: ['AS'] }, color: 0x4a6fa5, childrenIds: [] },
  { code: '070', label: 'News Media & Journalism', parentId: '000', system: 'ddc', crosswalks: { lcc: ['PN'] }, color: 0x4a6fa5, childrenIds: [] },
  { code: '080', label: 'Quotations', parentId: '000', system: 'ddc', crosswalks: { lcc: ['PN'] }, color: 0x4a6fa5, childrenIds: [] },
  { code: '090', label: 'Manuscripts & Rare Books', parentId: '000', system: 'ddc', crosswalks: { lcc: ['Z'] }, color: 0x4a6fa5, childrenIds: [] },

  // 100 divisions
  { code: '110', label: 'Metaphysics', parentId: '100', system: 'ddc', crosswalks: { lcc: ['BD'] }, color: 0x7b4a8c, childrenIds: [] },
  { code: '120', label: 'Epistemology', parentId: '100', system: 'ddc', crosswalks: { lcc: ['BD'] }, color: 0x7b4a8c, childrenIds: [] },
  { code: '130', label: 'Parapsychology & Occultism', parentId: '100', system: 'ddc', crosswalks: { lcc: ['BF'] }, color: 0x7b4a8c, childrenIds: [] },
  { code: '140', label: 'Philosophical Schools', parentId: '100', system: 'ddc', crosswalks: { lcc: ['B'] }, color: 0x7b4a8c, childrenIds: [] },
  { code: '150', label: 'Psychology', parentId: '100', system: 'ddc', crosswalks: { lcc: ['BF'] }, color: 0x7b4a8c, childrenIds: [] },
  { code: '160', label: 'Logic', parentId: '100', system: 'ddc', crosswalks: { lcc: ['BC'] }, color: 0x7b4a8c, childrenIds: [] },
  { code: '170', label: 'Ethics', parentId: '100', system: 'ddc', crosswalks: { lcc: ['BJ'] }, color: 0x7b4a8c, childrenIds: [] },
  { code: '180', label: 'Ancient Philosophy', parentId: '100', system: 'ddc', crosswalks: { lcc: ['B'] }, color: 0x7b4a8c, childrenIds: [] },
  { code: '190', label: 'Modern Philosophy', parentId: '100', system: 'ddc', crosswalks: { lcc: ['B'] }, color: 0x7b4a8c, childrenIds: [] },

  // 200 divisions
  { code: '210', label: 'Philosophy of Religion', parentId: '200', system: 'ddc', crosswalks: { lcc: ['BL'] }, color: 0xc4a35a, childrenIds: [] },
  { code: '220', label: 'Bible', parentId: '200', system: 'ddc', crosswalks: { lcc: ['BS'] }, color: 0xc4a35a, childrenIds: [] },
  { code: '230', label: 'Christianity', parentId: '200', system: 'ddc', crosswalks: { lcc: ['BR', 'BT', 'BV'] }, color: 0xc4a35a, childrenIds: [] },
  { code: '240', label: 'Christian Moral & Devotional Theology', parentId: '200', system: 'ddc', crosswalks: { lcc: ['BV'] }, color: 0xc4a35a, childrenIds: [] },
  { code: '250', label: 'Christian Pastoral Practice', parentId: '200', system: 'ddc', crosswalks: { lcc: ['BV'] }, color: 0xc4a35a, childrenIds: [] },
  { code: '260', label: 'Christian Social Theology', parentId: '200', system: 'ddc', crosswalks: { lcc: ['BR'] }, color: 0xc4a35a, childrenIds: [] },
  { code: '270', label: 'Christian Church History', parentId: '200', system: 'ddc', crosswalks: { lcc: ['BR'] }, color: 0xc4a35a, childrenIds: [] },
  { code: '280', label: 'Christian Denominations', parentId: '200', system: 'ddc', crosswalks: { lcc: ['BX'] }, color: 0xc4a35a, childrenIds: [] },
  { code: '290', label: 'Other Religions', parentId: '200', system: 'ddc', crosswalks: { lcc: ['BL', 'BM', 'BP', 'BQ', 'BX'] }, color: 0xc4a35a, childrenIds: [] },

  // 300 divisions
  { code: '310', label: 'Statistics', parentId: '300', system: 'ddc', crosswalks: { lcc: ['HA'] }, color: 0x8b3a3a, childrenIds: [] },
  { code: '320', label: 'Political Science', parentId: '300', system: 'ddc', crosswalks: { lcc: ['J'] }, color: 0x8b3a3a, childrenIds: [] },
  { code: '330', label: 'Economics', parentId: '300', system: 'ddc', crosswalks: { lcc: ['HB', 'HC'] }, color: 0x8b3a3a, childrenIds: [] },
  { code: '340', label: 'Law', parentId: '300', system: 'ddc', crosswalks: { lcc: ['K'] }, color: 0x8b3a3a, childrenIds: [] },
  { code: '350', label: 'Public Administration', parentId: '300', system: 'ddc', crosswalks: { lcc: ['J'] }, color: 0x8b3a3a, childrenIds: [] },
  { code: '360', label: 'Social Problems & Services', parentId: '300', system: 'ddc', crosswalks: { lcc: ['HN', 'HV'] }, color: 0x8b3a3a, childrenIds: [] },
  { code: '370', label: 'Education', parentId: '300', system: 'ddc', crosswalks: { lcc: ['L'] }, color: 0x8b3a3a, childrenIds: [] },
  { code: '380', label: 'Commerce', parentId: '300', system: 'ddc', crosswalks: { lcc: ['HF', 'HG'] }, color: 0x8b3a3a, childrenIds: [] },
  { code: '390', label: 'Customs & Folklore', parentId: '300', system: 'ddc', crosswalks: { lcc: ['GR', 'GT'] }, color: 0x8b3a3a, childrenIds: [] },

  // 400 divisions
  { code: '410', label: 'Linguistics', parentId: '400', system: 'ddc', crosswalks: { lcc: ['P'] }, color: 0x3a7b5e, childrenIds: [] },
  { code: '420', label: 'English & Old English', parentId: '400', system: 'ddc', crosswalks: { lcc: ['PE'] }, color: 0x3a7b5e, childrenIds: [] },
  { code: '430', label: 'Germanic Languages', parentId: '400', system: 'ddc', crosswalks: { lcc: ['PF'] }, color: 0x3a7b5e, childrenIds: [] },
  { code: '440', label: 'Romance Languages', parentId: '400', system: 'ddc', crosswalks: { lcc: ['PC'] }, color: 0x3a7b5e, childrenIds: [] },
  { code: '450', label: 'Italian & Romanian', parentId: '400', system: 'ddc', crosswalks: { lcc: ['PC'] }, color: 0x3a7b5e, childrenIds: [] },
  { code: '460', label: 'Spanish & Portuguese', parentId: '400', system: 'ddc', crosswalks: { lcc: ['PC'] }, color: 0x3a7b5e, childrenIds: [] },
  { code: '470', label: 'Latin', parentId: '400', system: 'ddc', crosswalks: { lcc: ['PA'] }, color: 0x3a7b5e, childrenIds: [] },
  { code: '480', label: 'Classical Greek', parentId: '400', system: 'ddc', crosswalks: { lcc: ['PA'] }, color: 0x3a7b5e, childrenIds: [] },
  { code: '490', label: 'Other Languages', parentId: '400', system: 'ddc', crosswalks: { lcc: ['PL', 'PM'] }, color: 0x3a7b5e, childrenIds: [] },

  // 500 divisions
  { code: '510', label: 'Mathematics', parentId: '500', system: 'ddc', crosswalks: { lcc: ['QA'] }, color: 0x2d7d9a, childrenIds: [] },
  { code: '520', label: 'Astronomy', parentId: '500', system: 'ddc', crosswalks: { lcc: ['QB'] }, color: 0x2d7d9a, childrenIds: [] },
  { code: '530', label: 'Physics', parentId: '500', system: 'ddc', crosswalks: { lcc: ['QC'] }, color: 0x2d7d9a, childrenIds: [] },
  { code: '540', label: 'Chemistry', parentId: '500', system: 'ddc', crosswalks: { lcc: ['QD'] }, color: 0x2d7d9a, childrenIds: [] },
  { code: '550', label: 'Earth Sciences', parentId: '500', system: 'ddc', crosswalks: { lcc: ['QE'] }, color: 0x2d7d9a, childrenIds: [] },
  { code: '560', label: 'Paleontology', parentId: '500', system: 'ddc', crosswalks: { lcc: ['QE'] }, color: 0x2d7d9a, childrenIds: [] },
  { code: '570', label: 'Biology', parentId: '500', system: 'ddc', crosswalks: { lcc: ['QH', 'QP', 'QR'] }, color: 0x2d7d9a, childrenIds: [] },
  { code: '580', label: 'Botany', parentId: '500', system: 'ddc', crosswalks: { lcc: ['QK'] }, color: 0x2d7d9a, childrenIds: [] },
  { code: '590', label: 'Zoology', parentId: '500', system: 'ddc', crosswalks: { lcc: ['QL'] }, color: 0x2d7d9a, childrenIds: [] },

  // 600 divisions
  { code: '610', label: 'Medicine & Health', parentId: '600', system: 'ddc', crosswalks: { lcc: ['R'] }, color: 0xb35c2e, childrenIds: [] },
  { code: '620', label: 'Engineering', parentId: '600', system: 'ddc', crosswalks: { lcc: ['TA', 'TB', 'TC', 'TD', 'TE', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TN', 'TP', 'TR', 'TS', 'TT', 'TX'] }, color: 0xb35c2e, childrenIds: [] },
  { code: '630', label: 'Agriculture', parentId: '600', system: 'ddc', crosswalks: { lcc: ['S'] }, color: 0xb35c2e, childrenIds: [] },
  { code: '640', label: 'Home & Family', parentId: '600', system: 'ddc', crosswalks: { lcc: ['TX'] }, color: 0xb35c2e, childrenIds: [] },
  { code: '650', label: 'Management & Business', parentId: '600', system: 'ddc', crosswalks: { lcc: ['HF'] }, color: 0xb35c2e, childrenIds: [] },
  { code: '660', label: 'Chemical Engineering', parentId: '600', system: 'ddc', crosswalks: { lcc: ['TP'] }, color: 0xb35c2e, childrenIds: [] },
  { code: '670', label: 'Manufacturing', parentId: '600', system: 'ddc', crosswalks: { lcc: ['TS'] }, color: 0xb35c2e, childrenIds: [] },
  { code: '680', label: 'Computer Engineering', parentId: '600', system: 'ddc', crosswalks: { lcc: ['TK'] }, color: 0xb35c2e, childrenIds: [] },
  { code: '690', label: 'Building Construction', parentId: '600', system: 'ddc', crosswalks: { lcc: ['TH'] }, color: 0xb35c2e, childrenIds: [] },

  // 700 divisions
  { code: '710', label: 'Landscaping', parentId: '700', system: 'ddc', crosswalks: { lcc: ['SB'] }, color: 0xa83256, childrenIds: [] },
  { code: '720', label: 'Architecture', parentId: '700', system: 'ddc', crosswalks: { lcc: ['NA'] }, color: 0xa83256, childrenIds: [] },
  { code: '730', label: 'Sculpture', parentId: '700', system: 'ddc', crosswalks: { lcc: ['NB', 'NC'] }, color: 0xa83256, childrenIds: [] },
  { code: '740', label: 'Drawing & Decorative Arts', parentId: '700', system: 'ddc', crosswalks: { lcc: ['NC', 'NK'] }, color: 0xa83256, childrenIds: [] },
  { code: '750', label: 'Painting', parentId: '700', system: 'ddc', crosswalks: { lcc: ['ND'] }, color: 0xa83256, childrenIds: [] },
  { code: '760', label: 'Prints', parentId: '700', system: 'ddc', crosswalks: { lcc: ['NE'] }, color: 0xa83256, childrenIds: [] },
  { code: '770', label: 'Photography', parentId: '700', system: 'ddc', crosswalks: { lcc: ['TR'] }, color: 0xa83256, childrenIds: [] },
  { code: '780', label: 'Music', parentId: '700', system: 'ddc', crosswalks: { lcc: ['M'] }, color: 0xa83256, childrenIds: [] },
  { code: '790', label: 'Recreation & Sports', parentId: '700', system: 'ddc', crosswalks: { lcc: ['GV'] }, color: 0xa83256, childrenIds: [] },

  // 800 divisions
  { code: '810', label: 'American Literature', parentId: '800', system: 'ddc', crosswalks: { lcc: ['PS'] }, color: 0x5a3a8b, childrenIds: [] },
  { code: '820', label: 'English Literature', parentId: '800', system: 'ddc', crosswalks: { lcc: ['PR'] }, color: 0x5a3a8b, childrenIds: [] },
  { code: '830', label: 'German Literature', parentId: '800', system: 'ddc', crosswalks: { lcc: ['PT'] }, color: 0x5a3a8b, childrenIds: [] },
  { code: '840', label: 'French Literature', parentId: '800', system: 'ddc', crosswalks: { lcc: ['PQ'] }, color: 0x5a3a8b, childrenIds: [] },
  { code: '850', label: 'Italian Literature', parentId: '800', system: 'ddc', crosswalks: { lcc: ['PQ'] }, color: 0x5a3a8b, childrenIds: [] },
  { code: '860', label: 'Spanish Literature', parentId: '800', system: 'ddc', crosswalks: { lcc: ['PQ'] }, color: 0x5a3a8b, childrenIds: [] },
  { code: '870', label: 'Latin Literature', parentId: '800', system: 'ddc', crosswalks: { lcc: ['PA'] }, color: 0x5a3a8b, childrenIds: [] },
  { code: '880', label: 'Greek Literature', parentId: '800', system: 'ddc', crosswalks: { lcc: ['PA'] }, color: 0x5a3a8b, childrenIds: [] },
  { code: '890', label: 'Other Literatures', parentId: '800', system: 'ddc', crosswalks: { lcc: ['PL', 'PM', 'PN', 'PZ'] }, color: 0x5a3a8b, childrenIds: [] },

  // 900 divisions
  { code: '910', label: 'Geography & Travel', parentId: '900', system: 'ddc', crosswalks: { lcc: ['G'] }, color: 0x6b4a3a, childrenIds: [] },
  { code: '920', label: 'Biography', parentId: '900', system: 'ddc', crosswalks: { lcc: ['CT'] }, color: 0x6b4a3a, childrenIds: [] },
  { code: '930', label: 'Ancient History', parentId: '900', system: 'ddc', crosswalks: { lcc: ['D'] }, color: 0x6b4a3a, childrenIds: [] },
  { code: '940', label: 'European History', parentId: '900', system: 'ddc', crosswalks: { lcc: ['D'] }, color: 0x6b4a3a, childrenIds: [] },
  { code: '950', label: 'Asian History', parentId: '900', system: 'ddc', crosswalks: { lcc: ['DS'] }, color: 0x6b4a3a, childrenIds: [] },
  { code: '960', label: 'African History', parentId: '900', system: 'ddc', crosswalks: { lcc: ['DT'] }, color: 0x6b4a3a, childrenIds: [] },
  { code: '970', label: 'North American History', parentId: '900', system: 'ddc', crosswalks: { lcc: ['E', 'F'] }, color: 0x6b4a3a, childrenIds: [] },
  { code: '980', label: 'South American History', parentId: '900', system: 'ddc', crosswalks: { lcc: ['F'] }, color: 0x6b4a3a, childrenIds: [] },
  { code: '990', label: 'History of Other Areas', parentId: '900', system: 'ddc', crosswalks: { lcc: ['DU', 'DX'] }, color: 0x6b4a3a, childrenIds: [] },
];

export function getDDCMainClasses(): ClassificationNode[] {
  return DDC_NODES.filter((n) => n.parentId === undefined);
}

export function getDDCChildren(parentCode: string): ClassificationNode[] {
  return DDC_NODES.filter((n) => n.parentId === parentCode);
}

export function findDDCByCode(code: string): ClassificationNode | undefined {
  return DDC_NODES.find((n) => n.code === code);
}

export function findDDCByLCC(lccCode: string): ClassificationNode[] {
  const prefix = lccCode.match(/^[A-Z]+/)?.[0] || lccCode;
  return DDC_NODES.filter((n) => {
    const lccCrosswalks = n.crosswalks['lcc'] || [];
    return lccCrosswalks.some(
      (c) => prefix.startsWith(c) || c.startsWith(prefix),
    );
  });
}
