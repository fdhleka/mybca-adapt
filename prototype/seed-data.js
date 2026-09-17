/**
 * SEED DATABASE - myBCA ADAPT Prototype
 * Contains realistic user personas, historical transaction data across multiple periods,
 * feature catalog, and preset simulation scenarios for judge testing.
 */

const SEED_DATABASE = {
  // Catalog of myBCA Features
  features: {
    "auto_save": { id: "auto_save", name: "Tabungan Otomatis Gaji (Auto-Save)", category: "Savings", icon: "bi-piggy-bank", points: 20, desc: "Alokasikan persentase gaji secara otomatis ke tabungan terpisah setiap tanggal gajian." },
    "health_insurance": { id: "health_insurance", name: "Asuransi Kesehatan Mandiri", category: "Protection", icon: "bi-shield-check", points: 20, desc: "Proteksi kesehatan komprehensif tanpa biaya klaim rumit langsung dari aplikasi." },
    "paylater_reminder": { id: "paylater_reminder", name: "Reminder Paylater Otomatis", category: "Credit", icon: "bi-alarm", points: 10, desc: "Notifikasi pintar dan auto-debet sebelum jatuh tempo tagihan Paylater agar bebas denda." },
    "joint_account": { id: "joint_account", name: "Joint Account (Rekening Bersama)", category: "Family", icon: "bi-people", points: 15, desc: "Rekening transparan berdua dengan pasangan untuk kebutuhan dapur dan cicilan bersama." },
    "family_budgeting": { id: "family_budgeting", name: "Family Budgeting & Expense Tracker", category: "Family", icon: "bi-pie-chart", points: 10, desc: "Kategorisasi otomatis pos pengeluaran bulanan keluarga dengan limit batas sehat." },
    "family_insurance": { id: "family_insurance", name: "Asuransi Jiwa & Keluarga", category: "Protection", icon: "bi-shield-lock", points: 20, desc: "Perlindungan finansial komprehensif bagi kepala keluarga dan anggota keluarga." },
    "child_savings": { id: "child_savings", name: "Tabungan Pendidikan Anak", category: "Children", icon: "bi-mortarboard", points: 20, desc: "Tabungan berjangka khusus dengan bunga kompetitif untuk biaya sekolah anak." },
    "qris_merchant": { id: "qris_merchant", name: "BCA Merchant & QRIS Bisnis", category: "Business", icon: "bi-qr-code-scan", points: 15, desc: "Terima pembayaran QRIS instan tanpa biaya admin tinggi langsung masuk rekening usaha." },
    "cashflow_report": { id: "cashflow_report", name: "Laporan Arus Kas Bisnis", category: "Business", icon: "bi-graph-up-arrow", points: 10, desc: "Analisis otomatis pemasukan vs pengeluaran usaha dengan visualisasi grafik real-time." },
    "student_savings": { id: "student_savings", name: "Tabungan Pelajar & Saku Budget", category: "Student", icon: "bi-wallet2", points: 15, desc: "Fitur alokasi uang saku mingguan bebas biaya admin bulanan untuk mahasiswa." },
    "conservative_invest": { id: "conservative_invest", name: "Investasi Konservatif (Reksa Dana)", category: "Investment", icon: "bi-graph-up", points: 20, desc: "Instrumen reksa dana pasar uang berrisiko rendah untuk persiapan pensiun tenang." },
    "welma_portfolio": { id: "welma_portfolio", name: "Welma Investment Portfolio Tracker", category: "Investment", icon: "bi-briefcase", points: 15, desc: "Pantau obligasi, saham, dan reksa dana dalam satu dashboard terintegrasi." }
  },

  // Database of Seed Personas
  personas: [
    {
      id: "dimas",
      name: "Dimas Prasetyo",
      title: "Fresh Graduate / Pekerja Baru",
      age: 23,
      occupation: "Junior Software Engineer",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      accountNo: "8820491823",
      balance: 14500000,
      activeFeatures: ["paylater_reminder"],
      timelinessRate: 100, // % on time
      savingsConsistency: false,
      historyBaseline: [ // Month T-1 / baseline
        { date: "2026-07-05", category: "Transfer Masuk", amount: 1500000, desc: "Kiriman Ortu", icon: "bi-arrow-down-left" },
        { date: "2026-07-10", category: "Jajan & Lifestyle", amount: 120000, desc: "Kopi & Cafe", icon: "bi-cup-hot" },
        { date: "2026-07-15", category: "Paylater", amount: 350000, desc: "Beli Sepatu Online", icon: "bi-credit-card" },
        { date: "2026-07-20", category: "Pulsa & Data", amount: 100000, desc: "Paket Internet", icon: "bi-phone" }
      ],
      historyCurrent: [ // Month T (Current) - NEW PATTERNS EMERGED!
        { date: "2026-08-25", category: "Gaji Bulanan", amount: 8500000, desc: "Gaji Utama PT Tech Inovasi", icon: "bi-cash-stack" },
        { date: "2026-08-26", category: "Sewa Kos / Housing", amount: 2200000, desc: "Sewa Kos Bulanan", icon: "bi-house-door" },
        { date: "2026-08-28", category: "Cicilan / Paylater", amount: 650000, desc: "Cicilan Laptop Work", icon: "bi-credit-card" },
        { date: "2026-09-02", category: "Jajan & Lifestyle", amount: 250000, desc: "Dinner Tim Kantor", icon: "bi-cup-hot" },
        { date: "2026-09-05", category: "Tagihan Utilitas", amount: 300000, desc: "Listrik & Water Kos", icon: "bi-lightning-charge" }
      ]
    },
    {
      id: "ayu",
      name: "Ayu Ratnasari",
      title: "Rumah Tangga Baru",
      age: 28,
      occupation: "Marketing Executive",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      accountNo: "5271890241",
      balance: 38200000,
      activeFeatures: ["auto_save", "family_budgeting"],
      timelinessRate: 100,
      savingsConsistency: true,
      historyBaseline: [
        { date: "2026-07-01", category: "Gaji Bulanan", amount: 11000000, desc: "Gaji Perusahaan", icon: "bi-cash-stack" },
        { date: "2026-07-05", category: "Jajan & Lifestyle", amount: 450000, desc: "Belanja Pakaian", icon: "bi-bag" }
      ],
      historyCurrent: [
        { date: "2026-08-25", category: "Gaji Bulanan", amount: 11000000, desc: "Gaji Perusahaan", icon: "bi-cash-stack" },
        { date: "2026-08-27", category: "Transfer Pasangan", amount: 4500000, desc: "Transfer ke Suami (Uang Dapur)", icon: "bi-heart" },
        { date: "2026-08-28", category: "Cicilan KPR / Rumah", amount: 3800000, desc: "Cicilan KPR BCA", icon: "bi-building-gear" },
        { date: "2026-09-01", category: "Supermarket / Dapur", amount: 1200000, desc: "Belanja Mingguan Supermarket", icon: "bi-cart3" }
      ]
    },
    {
      id: "sari",
      name: "Hj. Sari Wijaya",
      title: "Pemilik Usaha (Merchant Bisnis)",
      age: 35,
      occupation: "Owner Catering & Bakery",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      accountNo: "7401293811",
      balance: 125400000,
      activeFeatures: ["qris_merchant", "cashflow_report"],
      timelinessRate: 95,
      savingsConsistency: true,
      historyBaseline: [
        { date: "2026-07-10", category: "Terima QRIS Merchant", amount: 850000, desc: "Pemasukan Catering", icon: "bi-qr-code" },
        { date: "2026-07-12", category: "Transfer Supplier", amount: 2300000, desc: "Bahan Baku Tepung & Gula", icon: "bi-truck" }
      ],
      historyCurrent: [
        { date: "2026-08-20", category: "Terima QRIS Merchant", amount: 3400000, desc: "Pembayaran Event Pesanan", icon: "bi-qr-code" },
        { date: "2026-08-22", category: "Terima QRIS Merchant", amount: 1850000, desc: "Pemasukan Harian Horeca", icon: "bi-qr-code" },
        { date: "2026-08-25", category: "Transfer Supplier", amount: 5600000, desc: "Pembelian Bahan Grosir", icon: "bi-truck" },
        { date: "2026-09-01", category: "Gaji Karyawan", amount: 8000000, desc: "Transfer Gaji 4 Staf", icon: "bi-people-fill" }
      ]
    },
    {
      id: "rina",
      name: "Rina Kartika",
      title: "Mahasiswa Aktif",
      age: 20,
      occupation: "Mahasiswi S1 Ilmu Komputer",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      accountNo: "6029104822",
      balance: 3400000,
      activeFeatures: ["student_savings"],
      timelinessRate: 100,
      savingsConsistency: false,
      historyBaseline: [
        { date: "2026-07-01", category: "Transfer Masuk Ortu", amount: 2000000, desc: "Uang Saku Bulanan", icon: "bi-arrow-down-left" },
        { date: "2026-07-05", category: "Jajan & Hangout", amount: 85000, desc: "Kopi Kampus", icon: "bi-cup-hot" }
      ],
      historyCurrent: [
        { date: "2026-08-28", category: "Transfer Masuk Ortu", amount: 2500000, desc: "Uang Saku & Buku", icon: "bi-arrow-down-left" },
        { date: "2026-08-30", category: "Bayar Kampus / UKT", amount: 1500000, desc: "Pembayaran Semester 5", icon: "bi-book" },
        { date: "2026-09-02", category: "Jajan & Hangout", amount: 65000, desc: "Fast Food", icon: "bi-shop" },
        { date: "2026-09-04", category: "Pulsa & Game", amount: 50000, desc: "Topup Voucher", icon: "bi-phone" }
      ]
    },
    {
      id: "bambang",
      name: "Drs. Bambang Hariyanto",
      title: "Menjelang Pensiun",
      age: 56,
      occupation: "Senior Manager BUMN",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      accountNo: "1092847120",
      balance: 245000000,
      activeFeatures: ["auto_save", "conservative_invest", "welma_portfolio"],
      timelinessRate: 100,
      savingsConsistency: true,
      historyBaseline: [
        { date: "2026-07-25", category: "Gaji Bulanan", amount: 25000000, desc: "Gaji Direksi/Manager", icon: "bi-cash-stack" },
        { date: "2026-07-28", category: "Investasi Deposito", amount: 10000000, desc: "Deposito Berjangka BCA", icon: "bi-safe" }
      ],
      historyCurrent: [
        { date: "2026-08-25", category: "Gaji Bulanan", amount: 25000000, desc: "Gaji Direksi/Manager", icon: "bi-cash-stack" },
        { date: "2026-08-27", category: "Investasi Reksa Dana", amount: 8000000, desc: "Pembelian Reksa Dana Pasar Uang", icon: "bi-graph-up-arrow" },
        { date: "2026-09-01", category: "Pengeluaran Rumah", amount: 4500000, desc: "Belanja & Operasional", icon: "bi-house" }
      ]
    }
  ],

  // Preset scenarios for live interactive demo during presentation (9 Consolidated Categories)
  scenarios: [
    {
      id: "scen_freshgrad",
      name: "🚀 Skenario A: Dimas Terima Gaji & Sewa Kos (Triggers Fresh Grad Kit)",
      personaId: "dimas",
      injectTransactions: [
        { date: "2026-09-10", category: "Gaji & Penghasilan", amount: 8500000, desc: "Gaji Ke-2 PT Tech Inovasi", icon: "bi-cash-stack" },
        { date: "2026-09-11", category: "Hunian & Kos", amount: 2200000, desc: "Pelunasan Kos September", icon: "bi-house-door" }
      ],
      expectedEvent: "FRESH_GRADUATE",
      expectedBundle: "Mulai Kerja Kit"
    },
    {
      id: "scen_newlywed",
      name: "💍 Skenario B: Ayu Transfer Suami & Bayar KPR (Triggers Rumah Tangga Kit)",
      personaId: "ayu",
      injectTransactions: [
        { date: "2026-09-10", category: "Transfer Pasangan", amount: 5000000, desc: "Alokasi Bulanan Suami", icon: "bi-heart" },
        { date: "2026-09-11", category: "Hunian & Kos", amount: 3800000, desc: "Cicilan KPR Bulan Ke-6", icon: "bi-building-gear" }
      ],
      expectedEvent: "NEWLYWED",
      expectedBundle: "Rumah Tangga Baru Kit"
    },
    {
      id: "scen_merchant",
      name: "🏪 Skenario C: Sari Terima QRIS Pelanggan & Transfer Supplier (Triggers Pro Merchant Kit)",
      personaId: "sari",
      injectTransactions: [
        { date: "2026-09-10", category: "Pendapatan Usaha & QRIS", amount: 4500000, desc: "Omset QRIS Toko Roti", icon: "bi-qr-code" },
        { date: "2026-09-11", category: "Operasional & Bisnis", amount: 3200000, desc: "Pembayaran Supplier Kemasan", icon: "bi-truck" }
      ],
      expectedEvent: "BUSINESS_OWNER",
      expectedBundle: "Pro Merchant Kit"
    }
  ]
};
