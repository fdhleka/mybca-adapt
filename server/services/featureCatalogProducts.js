/**
 * Official Product Catalog & Onboarding Specifications
 * myBCA ADAPT Feature Registration Flow
 */

const FEATURE_PRODUCTS = {
  conservative_invest: {
    category_title: 'Investasi Welma myBCA',
    subtitle: 'Pilih produk reksa dana atau deposito untuk memulai portofolio investasi Anda',
    requires_initial_balance: true,
    min_amount: 100000,
    default_amount: 500000,
    amount_presets: [100000, 250000, 500000, 1000000, 2500000],
    category_db: 'Investasi & Deposito',
    products: [
      {
        id: 'bca_pu_prima',
        name: 'BCA Reksa Dana Pasar Uang Prima',
        type: 'Reksa Dana Pasar Uang',
        risk_level: 'Sangat Rendah (1/5)',
        risk_badge: 'badge-success',
        est_return: '4.85% p.a.',
        min_amount: 100000,
        manager: 'PT BCA Asset Management',
        description: 'Pilihan tepat untuk pemula & tempat parkir dana darurat. Bebas biaya beli & jual, likuiditas T+1 langsung cair.'
      },
      {
        id: 'bca_pt_makmur',
        name: 'BCA Reksa Dana Pendapatan Tetap Makmur',
        type: 'Pendapatan Tetap (Obligasi)',
        risk_level: 'Moderat (2/5)',
        risk_badge: 'badge-info',
        est_return: '6.65% p.a.',
        min_amount: 250000,
        manager: 'PT Batavia Prosperindo Aset Manajemen',
        description: 'Imbal hasil stabil di atas suku bunga deposito dengan alokasi pada obligasi pemerintah dan BUMN prima.'
      },
      {
        id: 'deposito_mybca_3m',
        name: 'Deposito Berjangka myBCA (Tenor 3 Bulan)',
        type: 'Simpanan Berjangka Perbankan',
        risk_level: 'Dijamin LPS',
        risk_badge: 'badge-primary',
        est_return: '4.25% p.a.',
        min_amount: 1000000,
        manager: 'PT Bank Central Asia Tbk',
        description: 'Bunga tetap dijamin LPS, perpanjangan otomatis pokok & bunga (Automatic Roll Over / ARO) langsung di myBCA.'
      },
      {
        id: 'bca_idx30_dynamic',
        name: 'BCA Saham Index IDX30 Clean Class',
        type: 'Reksa Dana Saham Ekuitas',
        risk_level: 'Tinggi / Agresif (4/5)',
        risk_badge: 'badge-warning',
        est_return: '11.20% p.a. (Hist)',
        min_amount: 500000,
        manager: 'PT Schroders Investment Management',
        description: 'Untuk tujuan finansial jangka panjang (>5 tahun) dengan mengoleksi 30 saham berkapitalisasi terbesar di BEI.'
      }
    ]
  },

  welma_portfolio: {
    category_title: 'Welma Investment & Wealth Tracker',
    subtitle: 'Registrasi Single Investor Identification (SID) & Portofolio Obligasi / SBN myBCA',
    requires_initial_balance: true,
    min_amount: 1000000,
    default_amount: 1000000,
    amount_presets: [1000000, 2000000, 5000000, 10000000],
    category_db: 'Investasi & Deposito',
    products: [
      {
        id: 'sbn_ori_retail',
        name: 'Obligasi Negara Ritel ORI026 / SBR014',
        type: 'Surat Berharga Negara (SBN)',
        risk_level: '100% Garansi Negara',
        risk_badge: 'badge-success',
        est_return: '6.45% p.a. (Fixed)',
        min_amount: 1000000,
        manager: 'Kementerian Keuangan RI & BCA',
        description: 'Kupon bunga tetap ditransfer setiap bulan langsung ke rekening Tahapan BCA Anda. Tanpa risiko gagal bayar.'
      },
      {
        id: 'welma_balanced_growth',
        name: 'Ashmore Dana Campuran Nusantara',
        type: 'Reksa Dana Campuran',
        risk_level: 'Moderat-Tinggi (3/5)',
        risk_badge: 'badge-info',
        est_return: '8.75% p.a.',
        min_amount: 500000,
        manager: 'PT Ashmore Asset Management',
        description: 'Kombinasi fleksibel antara saham bluechip dan obligasi korporasi untuk proteksi nilai dan akselerasi modal.'
      }
    ]
  },

  auto_save: {
    category_title: 'Auto-Save & Kantong Tabungan Impian',
    subtitle: 'Tentukan tujuan tabungan dan alokasikan setoran awal untuk memulai kebiasaan menabung otomatis',
    requires_initial_balance: true,
    min_amount: 50000,
    default_amount: 250000,
    amount_presets: [50000, 100000, 250000, 500000, 1000000],
    category_db: 'Belanja Kebutuhan Pokok',
    products: [
      {
        id: 'kantong_dana_darurat',
        name: 'Kantong Dana Darurat (3x Pengeluaran)',
        type: 'Simpanan Auto-Debet Gaji',
        risk_level: 'Likuid & Aman',
        risk_badge: 'badge-success',
        est_return: 'Bunga Tahapan + Bonus',
        min_amount: 100000,
        manager: 'Tahapan BCA Auto-Save',
        description: 'Debet otomatis 10% dari gaji setiap tanggal gajian untuk membentuk jaring pengaman finansial keluarga.'
      },
      {
        id: 'kantong_impian_travel',
        name: 'Kantong Liburan & Wishlist 2026',
        type: 'Target Simpanan Khusus',
        risk_level: 'Fleksibel Tanpa Pinalti',
        risk_badge: 'badge-primary',
        est_return: 'Bunga Harian',
        min_amount: 50000,
        manager: 'Tahapan BCA Pocket',
        description: 'Kumpulkan dana bertahap untuk traveling, konser musik, atau beli gadget idaman tanpa mengganggu kas operasional.'
      }
    ]
  },

  child_savings: {
    category_title: 'Tahapan Berjangka Pendidikan Anak',
    subtitle: 'Rencanakan masa depan sekolah anak dengan simpanan berjangka terproteksi asuransi jiwa gratis',
    requires_initial_balance: true,
    min_amount: 200000,
    default_amount: 500000,
    amount_presets: [200000, 500000, 1000000, 2000000],
    category_db: 'Operasional & Bisnis',
    products: [
      {
        id: 'tahapan_berjangka_edu',
        name: 'Tahapan Berjangka SiMuda BCA (Tenor 1-5 Thn)',
        type: 'Tabungan Berjangka + Proteksi',
        risk_level: 'Bebas Risiko + Asuransi',
        risk_badge: 'badge-success',
        est_return: '3.75% p.a.',
        min_amount: 200000,
        manager: 'PT Bank Central Asia Tbk',
        description: 'Menjamin ketersediaan dana masuk sekolah SD/SMP/SMA/Kuliah dengan proteksi asuransi hingga Rp 750 Juta.'
      }
    ]
  },

  student_savings: {
    category_title: 'Tabungan Pelajar & Saku Mahasiswa',
    subtitle: 'Buka pos alokasi uang saku bebas biaya admin bulanan untuk mahasiswa',
    requires_initial_balance: true,
    min_amount: 25000,
    default_amount: 100000,
    amount_presets: [25000, 50000, 100000, 250000],
    category_db: 'Operasional & Bisnis',
    products: [
      {
        id: 'simpel_bca_saku',
        name: 'BCA SimPel & Pocket Mahasiswa Pintar',
        type: 'Tabungan Mahasiswa',
        risk_level: 'Bebas Admin',
        risk_badge: 'badge-success',
        est_return: 'Bebas Biaya Admin',
        min_amount: 25000,
        manager: 'PT Bank Central Asia Tbk',
        description: 'Uang saku terbagi per minggu secara disiplin, limit transaksi aman dari godaan impulsif.'
      }
    ]
  },

  health_insurance: {
    category_title: 'Asuransi Kesehatan Mandiri BCA Life',
    subtitle: 'Pilih proteksi rawat inap dan rawat jalan tanpa biaya klaim rumit',
    requires_initial_balance: true,
    min_amount: 75000,
    default_amount: 150000,
    amount_presets: [75000, 150000, 300000],
    category_db: 'Tagihan & Utilitas',
    products: [
      {
        id: 'bca_life_silver',
        name: 'BCA Life Hospital Cash Silver',
        type: 'Santunan Tunai Harian',
        risk_level: 'Cover Rp 500rb/hari',
        risk_badge: 'badge-info',
        est_return: 'Premi Rp 75.000/bln',
        min_amount: 75000,
        manager: 'PT Asuransi Jiwa BCA (BCA Life)',
        description: 'Santunan tunai harian saat rawat inap di rumah sakit rekanan, proses klaim cepat via upload dokumen di myBCA.'
      },
      {
        id: 'bca_life_gold',
        name: 'BCA Life Comprehensive Health Gold',
        type: 'Asuransi Kesehatan Penuh',
        risk_level: 'Cover Limit Rp 150 Juta/thn',
        risk_badge: 'badge-primary',
        est_return: 'Premi Rp 150.000/bln',
        min_amount: 150000,
        manager: 'PT Asuransi Jiwa BCA (BCA Life)',
        description: 'Menanggung biaya kamar ICU, tindakan operasi, pembedahan, dan konsultasi dokter spesialis secara cashless.'
      }
    ]
  },

  family_insurance: {
    category_title: 'Asuransi Jiwa & Keluarga BCA Life',
    subtitle: 'Perlindungan masa depan keluarga tercinta dengan jaminan uang pertanggungan pasti',
    requires_initial_balance: true,
    min_amount: 150000,
    default_amount: 250000,
    amount_presets: [150000, 250000, 500000],
    category_db: 'Tagihan & Utilitas',
    products: [
      {
        id: 'bca_life_heritage',
        name: 'BCA Life Heritage Protection Plan',
        type: 'Asuransi Jiwa Berjangka',
        risk_level: 'UP Rp 1.000.000.000',
        risk_badge: 'badge-primary',
        est_return: 'Premi Rp 250.000/bln',
        min_amount: 250000,
        manager: 'PT Asuransi Jiwa BCA (BCA Life)',
        description: 'Perlindungan nafkah bagi keluarga jika terjadi risiko tak terduga pada pencari nafkah utama.'
      }
    ]
  },

  joint_account: {
    category_title: 'Joint Account (Rekening Bersama Pasangan)',
    subtitle: 'Buka rekening bersama untuk pengelolaan anggaran dapur dan cicilan rumah tangga transparan',
    requires_initial_balance: true,
    min_amount: 250000,
    default_amount: 500000,
    amount_presets: [250000, 500000, 1000000, 2000000],
    category_db: 'Belanja Kebutuhan Pokok',
    products: [
      {
        id: 'tahapan_joint_or',
        name: 'Tahapan BCA Joint Account (Status "OR")',
        type: 'Rekening Bersama Fleksibel',
        risk_level: '2 Kartu ATM / myBCA',
        risk_badge: 'badge-info',
        est_return: 'Akses Berdua',
        min_amount: 250000,
        manager: 'PT Bank Central Asia Tbk',
        description: 'Kedua pasangan memiliki akses monitoring mutasi bersama secara real-time untuk transparansi finansial.'
      }
    ]
  },

  family_budgeting: {
    category_title: 'Family Budgeting & Expense Tracker',
    subtitle: 'Setup batas anggaran pengeluaran bulanan keluarga dan notifikasi limit pintar',
    requires_initial_balance: false,
    min_amount: 0,
    default_amount: 0,
    amount_presets: [],
    category_db: 'Belanja Kebutuhan Pokok',
    products: [
      {
        id: 'smart_family_budget',
        name: 'BCA Smart Family Budget Controller',
        type: 'Expense Management Tool',
        risk_level: 'Otomatisasi Kategori',
        risk_badge: 'badge-success',
        est_return: 'Hemat hingga 20%',
        min_amount: 0,
        manager: 'myBCA ADAPT Engine',
        description: 'Kategorisasi otomatis belanja kebutuhan pokok, tagihan dapur, dan pembatasan pengeluaran konsumtif.'
      }
    ]
  },

  qris_merchant: {
    category_title: 'Pendaftaran BCA Merchant & QRIS Usaha',
    subtitle: 'Registrasi merchant QRIS resmi BCA langsung aktif untuk menerima pembayaran usaha',
    requires_initial_balance: false,
    min_amount: 0,
    default_amount: 0,
    amount_presets: [],
    category_db: 'Operasional & Bisnis',
    products: [
      {
        id: 'qris_merchant_pro',
        name: 'QRIS Usaha myBCA Bisnis (Dinamis & Statis)',
        type: 'Penerimaan Pembayaran Merchant',
        risk_level: 'MDR 0% Usaha Mikro',
        risk_badge: 'badge-success',
        est_return: 'Settlement H+0 Tiga Kali Sehari',
        min_amount: 0,
        manager: 'BCA Merchant Solution',
        description: 'Dapatkan QRIS berstandar BI instan, print standee resmi BCA, dan laporan penjualan live masuk ke rekening.'
      }
    ]
  },

  cashflow_report: {
    category_title: 'Laporan Arus Kas Bisnis & Pajak',
    subtitle: 'Aktifkan analitik laporan laba/rugi otomatis dari mutasi rekening usaha',
    requires_initial_balance: false,
    min_amount: 0,
    default_amount: 0,
    amount_presets: [],
    category_db: 'Operasional & Bisnis',
    products: [
      {
        id: 'pro_cashflow_ai',
        name: 'Laporan Arus Kas & Analisis Margin Laba Otomatis',
        type: 'Analitik Keuangan Bisnis',
        risk_level: 'Terintegrasi e-Statement',
        risk_badge: 'badge-primary',
        est_return: 'Laporan Otomatis PDF/Excel',
        min_amount: 0,
        manager: 'myBCA Business Analytics',
        description: 'Memisahkan arus kas pribadi dan bisnis secara cerdas tanpa perlu pencatatan buku kas manual.'
      }
    ]
  },

  paylater_reminder: {
    category_title: 'BCA Paylater Smart Reminder & Auto-Debet',
    subtitle: 'Atur jadwal pelunasan tagihan kredit dan pengingat jatuh tempo otomatis',
    requires_initial_balance: false,
    min_amount: 0,
    default_amount: 0,
    amount_presets: [],
    category_db: 'Cicilan & Paylater',
    products: [
      {
        id: 'reminder_paylater_smart',
        name: 'Smart Auto-Debet Paylater & Anti-Denda',
        type: 'Manajemen Kredit & Skor BI Checking',
        risk_level: 'Bebas Denda Keterlambatan',
        risk_badge: 'badge-success',
        est_return: 'Proteksi Skor Kredit SLIK',
        min_amount: 0,
        manager: 'BCA Consumer Credit',
        description: 'Auto-debet otomatis di tanggal gajian, memastikan riwayat kredit Anda selalu berpredikat Kol-1 Lancar.'
      }
    ]
  }
};

function getFeatureOnboardingDetails(featureId) {
  return FEATURE_PRODUCTS[featureId] || {
    category_title: 'Aktivasi Fitur Layanan myBCA',
    subtitle: 'Konfirmasi pendaftaran dan aktivasi fitur perbankan',
    requires_initial_balance: false,
    min_amount: 0,
    default_amount: 0,
    amount_presets: [],
    category_db: 'Operasional & Bisnis',
    products: [
      {
        id: featureId + '_std',
        name: 'Layanan Resmi BCA ADAPT',
        type: 'Fitur Digital',
        risk_level: 'Terintegrasi myBCA',
        risk_badge: 'badge-primary',
        est_return: 'Layanan Prioritas',
        min_amount: 0,
        manager: 'PT Bank Central Asia Tbk',
        description: 'Aktivasi langsung terhubung dengan akun Tahapan BCA Anda.'
      }
    ]
  };
}

module.exports = {
  FEATURE_PRODUCTS,
  getFeatureOnboardingDetails
};