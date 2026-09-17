/**
 * Deterministic Seeding & Atomic Reset Engine
 * myBCA ADAPT — SQLite Relational Store
 */

const { getDb, migrate, queryOne, queryAll } = require('./database');

// 1. Master Feature Catalog (12 Items)
const FEATURES = [
  {
    id: 'auto_save',
    name: 'Tabungan Otomatis Gaji (Auto-Save)',
    category: 'Savings',
    icon: 'bi-piggy-bank',
    points: 20,
    description: 'Alokasikan persentase gaji secara otomatis ke tabungan terpisah setiap tanggal gajian.'
  },
  {
    id: 'health_insurance',
    name: 'Asuransi Kesehatan Mandiri',
    category: 'Protection',
    icon: 'bi-shield-check',
    points: 20,
    description: 'Proteksi kesehatan komprehensif tanpa biaya klaim rumit langsung dari aplikasi.'
  },
  {
    id: 'paylater_reminder',
    name: 'Reminder Paylater Otomatis',
    category: 'Credit',
    icon: 'bi-alarm',
    points: 10,
    description: 'Notifikasi pintar dan auto-debet sebelum jatuh tempo tagihan Paylater agar bebas denda.'
  },
  {
    id: 'joint_account',
    name: 'Joint Account (Rekening Bersama)',
    category: 'Family',
    icon: 'bi-people',
    points: 15,
    description: 'Rekening transparan berdua dengan pasangan untuk kebutuhan dapur dan cicilan bersama.'
  },
  {
    id: 'family_budgeting',
    name: 'Family Budgeting & Expense Tracker',
    category: 'Family',
    icon: 'bi-pie-chart',
    points: 10,
    description: 'Kategorisasi otomatis pos pengeluaran bulanan keluarga dengan limit batas sehat.'
  },
  {
    id: 'family_insurance',
    name: 'Asuransi Jiwa & Keluarga',
    category: 'Protection',
    icon: 'bi-shield-lock',
    points: 20,
    description: 'Perlindungan finansial komprehensif bagi kepala keluarga dan anggota keluarga.'
  },
  {
    id: 'child_savings',
    name: 'Tabungan Pendidikan Anak',
    category: 'Children',
    icon: 'bi-mortarboard',
    points: 20,
    description: 'Tabungan berjangka khusus dengan bunga kompetitif untuk biaya sekolah anak.'
  },
  {
    id: 'qris_merchant',
    name: 'BCA Merchant & QRIS Bisnis',
    category: 'Business',
    icon: 'bi-qr-code-scan',
    points: 15,
    description: 'Terima pembayaran QRIS instan tanpa biaya admin tinggi langsung masuk rekening usaha.'
  },
  {
    id: 'cashflow_report',
    name: 'Laporan Arus Kas Bisnis',
    category: 'Business',
    icon: 'bi-graph-up-arrow',
    points: 10,
    description: 'Analisis otomatis pemasukan vs pengeluaran usaha dengan visualisasi grafik real-time.'
  },
  {
    id: 'student_savings',
    name: 'Tabungan Pelajar & Saku Budget',
    category: 'Student',
    icon: 'bi-wallet2',
    points: 15,
    description: 'Fitur alokasi uang saku mingguan bebas biaya admin bulanan untuk mahasiswa.'
  },
  {
    id: 'conservative_invest',
    name: 'Investasi Konservatif (Reksa Dana)',
    category: 'Investment',
    icon: 'bi-graph-up',
    points: 20,
    description: 'Instrumen reksa dana pasar uang berrisiko rendah untuk persiapan pensiun tenang.'
  },
  {
    id: 'welma_portfolio',
    name: 'Welma Investment Portfolio Tracker',
    category: 'Investment',
    icon: 'bi-briefcase',
    points: 15,
    description: 'Pantau obligasi, saham, dan reksa dana dalam satu dashboard terintegrasi.'
  }
];

// 2. Life Event Master Rules & Smart Bundles (5 Rules)
const LIFE_EVENT_RULES = [
  {
    id: 'FRESH_GRADUATE',
    name: 'Mulai Kerja / Fresh Graduate',
    bundle_name: 'Mulai Kerja Kit',
    required_signals: JSON.stringify(['Gaji & Penghasilan', 'Hunian & Kos']),
    optional_signals: JSON.stringify(['Cicilan & Paylater', 'Tagihan & Utilitas']),
    features_to_bundle: JSON.stringify(['auto_save', 'health_insurance']),
    bonus_points: 25,
    description: 'Sistem mendeteksi masuknya Gaji Utama pertama & pembayaran Sewa Kos. Waktunya membangun fondasi finansial mandiri!'
  },
  {
    id: 'NEWLYWED',
    name: 'Rumah Tangga Baru',
    bundle_name: 'Rumah Tangga Baru Kit',
    required_signals: JSON.stringify(['Transfer Pasangan', 'Hunian & Kos']),
    optional_signals: JSON.stringify(['Belanja Kebutuhan Pokok']),
    features_to_bundle: JSON.stringify(['joint_account', 'family_budgeting', 'family_insurance']),
    bonus_points: 30,
    description: 'Sistem mendeteksi transfer rutin ke pasangan & cicilan KPR. Alokasikan dana bersama lebih transparan!'
  },
  {
    id: 'BUSINESS_OWNER',
    name: 'Pemilik Usaha (Merchant)',
    bundle_name: 'Pro Merchant Kit',
    required_signals: JSON.stringify(['Pendapatan Usaha & QRIS', 'Operasional & Bisnis']),
    optional_signals: JSON.stringify(['Tagihan & Utilitas']),
    features_to_bundle: JSON.stringify(['qris_merchant', 'cashflow_report']),
    bonus_points: 25,
    description: 'Sistem mendeteksi transaksi penerimaan QRIS & biaya operasional bisnis berulang. Optimalkan arus kas usaha Anda!'
  },
  {
    id: 'STUDENT',
    name: 'Mahasiswa / Pelajar',
    bundle_name: 'Mahasiswa Starter Pack',
    required_signals: JSON.stringify(['Operasional & Bisnis', 'Gaji & Penghasilan']),
    optional_signals: JSON.stringify(['Jajan & Gaya Hidup']),
    features_to_bundle: JSON.stringify(['student_savings']),
    bonus_points: 15,
    description: 'Sistem mendeteksi transaksi rutin kampus dan kiriman orang tua. Kelola saku mingguan lebih hemat!'
  },
  {
    id: 'PRE_RETIREMENT',
    name: 'Persiapan Pensiun',
    bundle_name: 'Golden Age Retirement Kit',
    required_signals: JSON.stringify(['Investasi & Deposito', 'Belanja Kebutuhan Pokok']),
    optional_signals: JSON.stringify(['Tagihan & Utilitas']),
    features_to_bundle: JSON.stringify(['conservative_invest', 'welma_portfolio']),
    bonus_points: 35,
    description: 'Sistem mendeteksi portofolio investasi stabil. Amankan dana masa depan dengan instrumen konservatif.'
  }
];

// 3. Preset Presentation Scenarios (3 Scenarios)
const SCENARIOS = [
  {
    id: 'scen_freshgrad',
    name: '🚀 Skenario A: Dimas Terima Gaji & Sewa Kos (Triggers Fresh Grad Kit)',
    persona_id: 'dimas',
    expected_event: 'FRESH_GRADUATE',
    expected_bundle: 'Mulai Kerja Kit',
    payload_transactions: JSON.stringify([
      { date: '2026-09-10', category: 'Gaji & Penghasilan', amount: 8500000, desc: 'Gaji Ke-2 PT Tech Inovasi', type: 'CR', icon: 'bi-cash-stack' },
      { date: '2026-09-11', category: 'Hunian & Kos', amount: 2200000, desc: 'Pelunasan Kos September', type: 'DB', icon: 'bi-house-door' }
    ])
  },
  {
    id: 'scen_newlywed',
    name: '💍 Skenario B: Ayu Transfer Suami & Bayar KPR (Triggers Rumah Tangga Kit)',
    persona_id: 'ayu',
    expected_event: 'NEWLYWED',
    expected_bundle: 'Rumah Tangga Baru Kit',
    payload_transactions: JSON.stringify([
      { date: '2026-09-10', category: 'Transfer Pasangan', amount: 5000000, desc: 'Alokasi Bulanan Suami', type: 'DB', icon: 'bi-heart' },
      { date: '2026-09-11', category: 'Hunian & Kos', amount: 3800000, desc: 'Cicilan KPR Bulan Ke-6', type: 'DB', icon: 'bi-building-gear' }
    ])
  },
  {
    id: 'scen_merchant',
    name: '🏪 Skenario C: Sari Terima QRIS Pelanggan & Transfer Supplier (Triggers Pro Merchant Kit)',
    persona_id: 'sari',
    expected_event: 'BUSINESS_OWNER',
    expected_bundle: 'Pro Merchant Kit',
    payload_transactions: JSON.stringify([
      { date: '2026-09-10', category: 'Pendapatan Usaha & QRIS', amount: 4500000, desc: 'Omset QRIS Toko Roti', type: 'CR', icon: 'bi-qr-code' },
      { date: '2026-09-11', category: 'Operasional & Bisnis', amount: 3200000, desc: 'Pembayaran Supplier Kemasan', type: 'DB', icon: 'bi-truck' }
    ])
  }
];

// 4. Initial Voucher Catalog & Targets (Admin & Quest System)
const VOUCHERS = [
  {
    id: 'vouch_indomaret_50k',
    code: 'BCA-INDO-50K',
    title: 'Voucher Belanja Indomaret Rp 50.000',
    merchant: 'Indomaret',
    category: 'Shopping',
    icon: 'bi-cart-check',
    reward_value: 50000,
    reward_type: 'DISCOUNT',
    target_type: 'CATEGORY_TX_COUNT',
    target_value: 2,
    target_category: 'Belanja Kebutuhan Pokok',
    description: 'Dapatkan potongan belanja Rp 50.000 dengan melakukan minimal 2x transaksi Belanja Kebutuhan Pokok di myBCA.',
    expiry_date: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    id: 'vouch_kopikenangan_25k',
    code: 'BCA-KENANGAN-25K',
    title: 'Diskon Kopi Kenangan Rp 25.000',
    merchant: 'Kopi Kenangan',
    category: 'F&B',
    icon: 'bi-cup-hot',
    reward_value: 25000,
    reward_type: 'DISCOUNT',
    target_type: 'MIN_HEALTH_SCORE',
    target_value: 60,
    target_category: null,
    description: 'Nikmati kopi favoritmu! Raih Skor Kesehatan Finansial minimal 60 PTS untuk membuka voucher ini.',
    expiry_date: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    id: 'vouch_welma_cashback_100k',
    code: 'BCA-WELMA-100K',
    title: 'Cashback Reksa Dana Welma Rp 100.000',
    merchant: 'BCA Welma',
    category: 'Investment',
    icon: 'bi-graph-up-arrow',
    reward_value: 100000,
    reward_type: 'CASHBACK',
    target_type: 'MIN_SAVINGS_ALLOC',
    target_value: 500000,
    target_category: null,
    description: 'Cashback unit penyertaan Reksa Dana Rp 100.000 dengan mengalokasikan tabungan/investasi minimal Rp 500.000.',
    expiry_date: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    id: 'vouch_tokopedia_50k',
    code: 'BCA-TOPED-50K',
    title: 'Diskon Belanja Tokopedia Rp 50.000',
    merchant: 'Tokopedia',
    category: 'Shopping',
    icon: 'bi-bag-heart',
    reward_value: 50000,
    reward_type: 'DISCOUNT',
    target_type: 'ACTIVE_FEATURE_COUNT',
    target_value: 3,
    target_category: null,
    description: 'Aktifkan minimal 3 fitur kesehatan finansial myBCA untuk klaim voucher belanja Tokopedia Rp 50.000.',
    expiry_date: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    id: 'vouch_gold_lifestyle_75k',
    code: 'BCA-GOLD-75K',
    title: 'Lifestyle Voucher BCA Prioritas Rp 75.000',
    merchant: 'BCA Merchant Network',
    category: 'Lifestyle',
    icon: 'bi-award',
    reward_value: 75000,
    reward_type: 'DISCOUNT',
    target_type: 'MIN_HEALTH_SCORE',
    target_value: 70,
    target_category: null,
    description: 'Spesial Gold Tier! Capai Skor Kesehatan Finansial minimal 70 PTS untuk menikmati potongan belanja lifestyle Rp 75.000.',
    expiry_date: '2026-12-31',
    status: 'ACTIVE'
  }
];

// 5. Personas, Accounts, Active Features, and Categorized Mutations (35 mutations total)
const PERSONAS_DATA = [
  {
    user: {
      id: 'dimas',
      bca_id: 'dimas2026',
      password: 'Password123!',
      name: 'Dimas Prasetyo',
      email: 'dimas.prasetyo@mybca.co.id',
      age: 23,
      title: 'Fresh Graduate / Pekerja Baru',
      occupation: 'Junior Software Engineer',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      timeliness_rate: 100.0,
      savings_consistency: 0
    },
    account: {
      id: 'acc_dimas',
      account_no: '8820491823',
      account_type: 'Tahapan BCA',
      currency: 'IDR',
      balance: 14500000,
      status: 'ACTIVE'
    },
    activeFeatures: ['paylater_reminder'],
    transactions: [
      // Baseline (4)
      { date: '2026-07-05', category: 'Gaji & Penghasilan', amount: 1500000, type: 'CR', desc: 'Kiriman Ortu', icon: 'bi-arrow-down-left', period: 'baseline' },
      { date: '2026-07-10', category: 'Jajan & Gaya Hidup', amount: 120000, type: 'DB', desc: 'Kopi & Cafe', icon: 'bi-cup-hot', period: 'baseline' },
      { date: '2026-07-15', category: 'Cicilan & Paylater', amount: 350000, type: 'DB', desc: 'Beli Sepatu Online', icon: 'bi-credit-card', period: 'baseline' },
      { date: '2026-07-20', category: 'Tagihan & Utilitas', amount: 100000, type: 'DB', desc: 'Paket Internet', icon: 'bi-phone', period: 'baseline' },
      // Current (5)
      { date: '2026-08-25', category: 'Gaji & Penghasilan', amount: 8500000, type: 'CR', desc: 'Gaji Utama PT Tech Inovasi', icon: 'bi-cash-stack', period: 'current' },
      { date: '2026-08-26', category: 'Hunian & Kos', amount: 2200000, type: 'DB', desc: 'Sewa Kos Bulanan', icon: 'bi-house-door', period: 'current' },
      { date: '2026-08-28', category: 'Cicilan & Paylater', amount: 650000, type: 'DB', desc: 'Cicilan Laptop Work', icon: 'bi-credit-card', period: 'current' },
      { date: '2026-09-02', category: 'Jajan & Gaya Hidup', amount: 250000, type: 'DB', desc: 'Dinner Tim Kantor', icon: 'bi-cup-hot', period: 'current' },
      { date: '2026-09-05', category: 'Tagihan & Utilitas', amount: 300000, type: 'DB', desc: 'Listrik & Water Kos', icon: 'bi-lightning-charge', period: 'current' }
    ]
  },
  {
    user: {
      id: 'ayu',
      bca_id: 'ayu2026',
      password: 'Password123!',
      name: 'Ayu Ratnasari',
      email: 'ayu.ratnasari@mybca.co.id',
      age: 28,
      title: 'Rumah Tangga Baru',
      occupation: 'Marketing Executive',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      timeliness_rate: 100.0,
      savings_consistency: 1
    },
    account: {
      id: 'acc_ayu',
      account_no: '5271890241',
      account_type: 'Tahapan BCA',
      currency: 'IDR',
      balance: 38200000,
      status: 'ACTIVE'
    },
    activeFeatures: ['auto_save', 'family_budgeting'],
    transactions: [
      // Baseline (3)
      { date: '2026-07-01', category: 'Gaji & Penghasilan', amount: 11000000, type: 'CR', desc: 'Gaji Perusahaan', icon: 'bi-cash-stack', period: 'baseline' },
      { date: '2026-07-05', category: 'Jajan & Gaya Hidup', amount: 450000, type: 'DB', desc: 'Belanja Pakaian', icon: 'bi-bag', period: 'baseline' },
      { date: '2026-07-15', category: 'Tagihan & Utilitas', amount: 250000, type: 'DB', desc: 'Listrik Rumah', icon: 'bi-lightning-charge', period: 'baseline' },
      // Current (4)
      { date: '2026-08-25', category: 'Gaji & Penghasilan', amount: 11000000, type: 'CR', desc: 'Gaji Perusahaan', icon: 'bi-cash-stack', period: 'current' },
      { date: '2026-08-27', category: 'Transfer Pasangan', amount: 4500000, type: 'DB', desc: 'Transfer ke Suami (Uang Dapur)', icon: 'bi-heart', period: 'current' },
      { date: '2026-08-28', category: 'Hunian & Kos', amount: 3800000, type: 'DB', desc: 'Cicilan KPR BCA', icon: 'bi-building-gear', period: 'current' },
      { date: '2026-09-01', category: 'Belanja Kebutuhan Pokok', amount: 1200000, type: 'DB', desc: 'Belanja Mingguan Supermarket', icon: 'bi-cart3', period: 'current' }
    ]
  },
  {
    user: {
      id: 'sari',
      bca_id: 'sari2026',
      password: 'Password123!',
      name: 'Hj. Sari Wijaya',
      email: 'sari.wijaya@mybca.co.id',
      age: 35,
      title: 'Pemilik Usaha (Merchant Bisnis)',
      occupation: 'Owner Catering & Bakery',
      avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      timeliness_rate: 95.0,
      savings_consistency: 1
    },
    account: {
      id: 'acc_sari',
      account_no: '7401293811',
      account_type: 'BCA Bisnis',
      currency: 'IDR',
      balance: 125400000,
      status: 'ACTIVE'
    },
    activeFeatures: ['qris_merchant', 'cashflow_report'],
    transactions: [
      // Baseline (3)
      { date: '2026-07-10', category: 'Pendapatan Usaha & QRIS', amount: 850000, type: 'CR', desc: 'Pemasukan Catering', icon: 'bi-qr-code', period: 'baseline' },
      { date: '2026-07-12', category: 'Operasional & Bisnis', amount: 2300000, type: 'DB', desc: 'Bahan Baku Tepung & Gula', icon: 'bi-truck', period: 'baseline' },
      { date: '2026-07-20', category: 'Tagihan & Utilitas', amount: 150000, type: 'DB', desc: 'Paket Internet Usaha', icon: 'bi-phone', period: 'baseline' },
      // Current (4)
      { date: '2026-08-20', category: 'Pendapatan Usaha & QRIS', amount: 3400000, type: 'CR', desc: 'Pembayaran Event Pesanan', icon: 'bi-qr-code', period: 'current' },
      { date: '2026-08-22', category: 'Pendapatan Usaha & QRIS', amount: 1850000, type: 'CR', desc: 'Pemasukan Harian Horeca', icon: 'bi-qr-code', period: 'current' },
      { date: '2026-08-25', category: 'Operasional & Bisnis', amount: 5600000, type: 'DB', desc: 'Pembelian Bahan Grosir', icon: 'bi-truck', period: 'current' },
      { date: '2026-09-01', category: 'Operasional & Bisnis', amount: 8000000, type: 'DB', desc: 'Transfer Gaji 4 Staf', icon: 'bi-people-fill', period: 'current' }
    ]
  },
  {
    user: {
      id: 'rina',
      bca_id: 'rina2026',
      password: 'Password123!',
      name: 'Rina Kartika',
      email: 'rina.kartika@mybca.co.id',
      age: 20,
      title: 'Mahasiswa Aktif',
      occupation: 'Mahasiswi S1 Ilmu Komputer',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      timeliness_rate: 100.0,
      savings_consistency: 0
    },
    account: {
      id: 'acc_rina',
      account_no: '6029104822',
      account_type: 'Tahapan Xpresi',
      currency: 'IDR',
      balance: 3400000,
      status: 'ACTIVE'
    },
    activeFeatures: ['student_savings'],
    transactions: [
      // Baseline (2)
      { date: '2026-07-01', category: 'Gaji & Penghasilan', amount: 2000000, type: 'CR', desc: 'Uang Saku Bulanan', icon: 'bi-arrow-down-left', period: 'baseline' },
      { date: '2026-07-05', category: 'Jajan & Gaya Hidup', amount: 85000, type: 'DB', desc: 'Kopi Kampus', icon: 'bi-cup-hot', period: 'baseline' },
      // Current (4)
      { date: '2026-08-28', category: 'Gaji & Penghasilan', amount: 2500000, type: 'CR', desc: 'Uang Saku & Buku', icon: 'bi-arrow-down-left', period: 'current' },
      { date: '2026-08-30', category: 'Operasional & Bisnis', amount: 1500000, type: 'DB', desc: 'Pembayaran Semester 5', icon: 'bi-book', period: 'current' },
      { date: '2026-09-02', category: 'Jajan & Gaya Hidup', amount: 65000, type: 'DB', desc: 'Fast Food', icon: 'bi-shop', period: 'current' },
      { date: '2026-09-04', category: 'Tagihan & Utilitas', amount: 50000, type: 'DB', desc: 'Topup Voucher Data', icon: 'bi-phone', period: 'current' }
    ]
  },
  {
    user: {
      id: 'bambang',
      bca_id: 'bambang2026',
      password: 'Password123!',
      name: 'Drs. Bambang Hariyanto',
      email: 'bambang.hariyanto@mybca.co.id',
      age: 56,
      title: 'Menjelang Pensiun',
      occupation: 'Senior Manager BUMN',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      timeliness_rate: 100.0,
      savings_consistency: 1
    },
    account: {
      id: 'acc_bambang',
      account_no: '1092847120',
      account_type: 'Tahapan BCA',
      currency: 'IDR',
      balance: 245000000,
      status: 'ACTIVE'
    },
    activeFeatures: ['auto_save', 'conservative_invest', 'welma_portfolio'],
    transactions: [
      // Baseline (3)
      { date: '2026-07-20', category: 'Jajan & Gaya Hidup', amount: 1500000, type: 'DB', desc: 'Dining Keluarga', icon: 'bi-cup-hot', period: 'baseline' },
      { date: '2026-07-25', category: 'Gaji & Penghasilan', amount: 25000000, type: 'CR', desc: 'Gaji Direksi/Manager', icon: 'bi-cash-stack', period: 'baseline' },
      { date: '2026-07-28', category: 'Investasi & Deposito', amount: 10000000, type: 'DB', desc: 'Deposito Berjangka BCA', icon: 'bi-safe', period: 'baseline' },
      // Current (3)
      { date: '2026-08-25', category: 'Gaji & Penghasilan', amount: 25000000, type: 'CR', desc: 'Gaji Direksi/Manager', icon: 'bi-cash-stack', period: 'current' },
      { date: '2026-08-27', category: 'Investasi & Deposito', amount: 8000000, type: 'DB', desc: 'Pembelian Reksa Dana Pasar Uang', icon: 'bi-graph-up-arrow', period: 'current' },
      { date: '2026-09-01', category: 'Belanja Kebutuhan Pokok', amount: 4500000, type: 'DB', desc: 'Belanja & Operasional Rumah', icon: 'bi-house', period: 'current' }
    ]
  }
];

/**
 * Seed database with pristine datasets inside a single transaction
 */
function seedDatabase(db = null) {
  const startTime = Date.now();
  const conn = db || getDb();
  migrate(conn);

  conn.exec('BEGIN TRANSACTION;');

  try {
    // 1. Clean existing records in reverse foreign key dependency order
    conn.exec('DELETE FROM audit_logs;');
    conn.exec('DELETE FROM user_vouchers;');
    conn.exec('DELETE FROM vouchers;');
    conn.exec('DELETE FROM user_life_events;');
    conn.exec('DELETE FROM user_features;');
    conn.exec('DELETE FROM transactions;');
    conn.exec('DELETE FROM simulation_scenarios;');
    conn.exec('DELETE FROM life_event_rules;');
    conn.exec('DELETE FROM features;');
    conn.exec('DELETE FROM accounts;');
    conn.exec('DELETE FROM users;');

    // 2. Insert Master Features (12 items)
    const insertFeature = conn.prepare(
      'INSERT INTO features (id, name, category, icon, points, description) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const feat of FEATURES) {
      insertFeature.run(feat.id, feat.name, feat.category, feat.icon, feat.points, feat.description);
    }

    // 3. Insert Life Event Rules (5 rules)
    const insertRule = conn.prepare(
      'INSERT INTO life_event_rules (id, name, bundle_name, required_signals, optional_signals, features_to_bundle, bonus_points, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const rule of LIFE_EVENT_RULES) {
      insertRule.run(
        rule.id,
        rule.name,
        rule.bundle_name,
        rule.required_signals,
        rule.optional_signals,
        rule.features_to_bundle,
        rule.bonus_points,
        rule.description
      );
    }

    // 4. Insert Users, Accounts, Active Features, and Transactions
    const insertUser = conn.prepare(
      'INSERT INTO users (id, bca_id, password, name, email, age, title, occupation, avatar_url, timeliness_rate, savings_consistency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insertAccount = conn.prepare(
      'INSERT INTO accounts (id, user_id, account_no, account_type, currency, balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const insertUserFeature = conn.prepare(
      'INSERT INTO user_features (user_id, feature_id, status) VALUES (?, ?, ?)'
    );
    const insertTransaction = conn.prepare(
      'INSERT INTO transactions (account_id, user_id, date, category, amount, type, description, icon, period) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    let totalActiveFeatures = 0;
    let totalTransactions = 0;

    for (const p of PERSONAS_DATA) {
      insertUser.run(
        p.user.id,
        p.user.bca_id,
        p.user.password,
        p.user.name,
        p.user.email,
        p.user.age,
        p.user.title,
        p.user.occupation,
        p.user.avatar_url,
        p.user.timeliness_rate,
        p.user.savings_consistency
      );

      insertAccount.run(
        p.account.id,
        p.user.id,
        p.account.account_no,
        p.account.account_type,
        p.account.currency,
        p.account.balance,
        p.account.status
      );

      for (const featId of p.activeFeatures) {
        insertUserFeature.run(p.user.id, featId, 'ACTIVE');
        totalActiveFeatures++;
      }

      for (const tx of p.transactions) {
        insertTransaction.run(
          p.account.id,
          p.user.id,
          tx.date,
          tx.category,
          tx.amount,
          tx.type,
          tx.desc,
          tx.icon,
          tx.period
        );
        totalTransactions++;
      }
    }

    // 5. Insert Simulation Scenarios (3 scenarios) - after users exist
    const insertScenario = conn.prepare(
      'INSERT INTO simulation_scenarios (id, name, persona_id, expected_event, expected_bundle, payload_transactions) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const scen of SCENARIOS) {
      insertScenario.run(
        scen.id,
        scen.name,
        scen.persona_id,
        scen.expected_event,
        scen.expected_bundle,
        scen.payload_transactions
      );
    }

    // 6. Insert Master Vouchers & Quests (Admin Seed)
    const insertVoucher = conn.prepare(
      'INSERT INTO vouchers (id, code, title, merchant, category, icon, reward_value, reward_type, target_type, target_value, target_category, description, expiry_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const v of VOUCHERS) {
      insertVoucher.run(
        v.id,
        v.code,
        v.title,
        v.merchant,
        v.category,
        v.icon,
        v.reward_value,
        v.reward_type,
        v.target_type,
        v.target_value,
        v.target_category,
        v.description,
        v.expiry_date,
        v.status
      );
    }

    // 7. Record Initial Audit Log
    conn.prepare(
      'INSERT INTO audit_logs (user_id, engine, message, payload) VALUES (?, ?, ?, ?)'
    ).run(
      null,
      'SYSTEM',
      'Database successfully reset to pristine seed state.',
      JSON.stringify({ personas: PERSONAS_DATA.length, features: FEATURES.length, vouchers: VOUCHERS.length, transactions: totalTransactions })
    );

    conn.exec('COMMIT;');

    const durationMs = Date.now() - startTime;

    return {
      success: true,
      durationMs,
      summary: {
        personas_seeded: PERSONAS_DATA.length,
        accounts_seeded: PERSONAS_DATA.length,
        features_seeded: FEATURES.length,
        vouchers_seeded: VOUCHERS.length,
        rules_seeded: LIFE_EVENT_RULES.length,
        scenarios_seeded: SCENARIOS.length,
        transactions_seeded: totalTransactions,
        active_features_seeded: totalActiveFeatures
      }
    };
  } catch (err) {
    conn.exec('ROLLBACK;');
    throw err;
  }
}

/**
 * 1-Click Atomic Reset Function
 */
function resetDatabase(db = null) {
  const result = seedDatabase(db);
  return {
    success: true,
    message: 'Database berhasil di-reset ke kondisi awal (pristine seeds).',
    reset_timestamp: new Date().toISOString(),
    duration_ms: result.durationMs,
    summary: result.summary
  };
}

// Execute if run directly from CLI
if (require.main === module) {
  console.log('Seeding SQLite database with pristine dataset...');
  const res = seedDatabase();
  console.log(`Seeding completed in ${res.durationMs}ms:`, res.summary);
}

module.exports = {
  FEATURES,
  VOUCHERS,
  LIFE_EVENT_RULES,
  SCENARIOS,
  PERSONAS_DATA,
  seedDatabase,
  resetDatabase
};
