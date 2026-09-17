/**
 * Groq AI Classifier Service
 * myBCA ADAPT
 * Menggunakan Groq AI API untuk mengklasifikasi transaksi secara otomatis
 * dari deskripsi teks (nama pengeluaran/pemasukan) tanpa mengharuskan user memilih kategori manual.
 * Dilengkapi Banking Integrity Rules agar tidak terjadi kesalahan penentuan tipe Kredit (CR) / Debet (DB).
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'allam-2-7b';

// 9 Kategori Transaksi Resmi Terpadu myBCA ADAPT
const VALID_CATEGORIES = [
  'Gaji & Penghasilan',
  'Hunian & Kos',
  'Cicilan & Paylater',
  'Belanja Kebutuhan Pokok',
  'Jajan & Gaya Hidup',
  'Tagihan & Utilitas',
  'Pendapatan Usaha & QRIS',
  'Operasional & Bisnis',
  'Investasi & Deposito'
];

// Integritas Perbankan: Kategori Pengeluaran vs Kategori Pemasukan
const EXPENSE_CATEGORIES = [
  'Belanja Kebutuhan Pokok',
  'Jajan & Gaya Hidup',
  'Hunian & Kos',
  'Cicilan & Paylater',
  'Tagihan & Utilitas',
  'Operasional & Bisnis',
  'Investasi & Deposito'
];

const INCOME_CATEGORIES = [
  'Gaji & Penghasilan',
  'Pendapatan Usaha & QRIS'
];

// Helper fallback rule-based jika offline / network issue
function fallbackRuleBased(text) {
  const lower = text.toLowerCase();

  // Pemasukan / CR
  if (lower.includes('gaji') || lower.includes('payroll') || lower.includes('salary') || lower.includes('penghasilan') || lower.includes('kiriman ortu') || lower.includes('uang saku') || lower.includes('transfer masuk')) {
    return { category: 'Gaji & Penghasilan', type: 'CR', reason: 'Penerimaan gaji, payroll, atau transfer masuk rutin', confidence: 0.95 };
  }
  if (lower.includes('qris') || lower.includes('omset') || lower.includes('pelanggan') || lower.includes('penjualan')) {
    return { category: 'Pendapatan Usaha & QRIS', type: 'CR', reason: 'Penerimaan omset penjualan usaha via QRIS', confidence: 0.95 };
  }

  // Pengeluaran / DB
  if (lower.includes('kos') || lower.includes('kontrakan') || lower.includes('sewa') || lower.includes('kpr') || lower.includes('rumah') || lower.includes('kredit rumah')) {
    return { category: 'Hunian & Kos', type: 'DB', reason: 'Biaya sewa hunian, kos, atau cicilan KPR rumah', confidence: 0.95 };
  }
  if (lower.includes('paylater') || lower.includes('cicil') || lower.includes('angsuran') || lower.includes('shopee paylater')) {
    return { category: 'Cicilan & Paylater', type: 'DB', reason: 'Pembayaran tagihan kredit atau Paylater', confidence: 0.95 };
  }
  if (lower.includes('indomaret') || lower.includes('alfamart') || lower.includes('supermarket') || lower.includes('beras') || lower.includes('minyak') || lower.includes('pasar') || lower.includes('dapur') || lower.includes('ikan') || lower.includes('sayur') || lower.includes('daging') || lower.includes('makan') || lower.includes('ayam')) {
    return { category: 'Belanja Kebutuhan Pokok', type: 'DB', reason: 'Belanja bahan pangan, sembako, dan kebutuhan dapur/makan', confidence: 0.9 };
  }
  if (lower.includes('supplier') || lower.includes('bahan baku') || lower.includes('vendor') || lower.includes('kulakan') || lower.includes('karyawan') || lower.includes('gaji karyawan') || lower.includes('ukt') || lower.includes('spp') || lower.includes('kuliah') || lower.includes('kampus')) {
    return { category: 'Operasional & Bisnis', type: 'DB', reason: 'Biaya operasional usaha, vendor, supplier, atau staf', confidence: 0.95 };
  }
  if (lower.includes('reksa dana') || lower.includes('bibit') || lower.includes('bareksa') || lower.includes('saham') || lower.includes('investasi') || lower.includes('deposito')) {
    return { category: 'Investasi & Deposito', type: 'DB', reason: 'Penempatan dana investasi atau deposito berjangka', confidence: 0.95 };
  }
  if (lower.includes('listrik') || lower.includes('pln') || lower.includes('pdam') || lower.includes('air') || lower.includes('wifi') || lower.includes('indihome') || lower.includes('pulsa') || lower.includes('paket data') || lower.includes('kuota') || lower.includes('telkomsel') || lower.includes('utilitas')) {
    return { category: 'Tagihan & Utilitas', type: 'DB', reason: 'Pembayaran tagihan listrik, air, internet, dan pulsa', confidence: 0.95 };
  }
  if (lower.includes('kopi') || lower.includes('cafe') || lower.includes('nongkrong') || lower.includes('jajan') || lower.includes('resto') || lower.includes('starbucks')) {
    return { category: 'Jajan & Gaya Hidup', type: 'DB', reason: 'Pengeluaran kuliner, hiburan, dan gaya hidup', confidence: 0.95 };
  }

  return { category: 'Belanja Kebutuhan Pokok', type: 'DB', reason: 'Pengeluaran umum kebutuhan sehari-hari', confidence: 0.75 };
}

// Tentukan apakah tipe transaksi CR (Uang Masuk) atau DB (Uang Keluar) dengan Banking Integrity Rules
function determineTransactionType(category, text) {
  const lower = text.toLowerCase();

  // Kata kunci uang masuk eksplisit
  if (
    lower.includes('terima transfer') ||
    lower.includes('transfer masuk') ||
    lower.includes('kiriman ortu') ||
    lower.includes('uang masuk') ||
    lower.includes('gaji') ||
    lower.includes('payroll') ||
    lower.includes('omset') ||
    lower.includes('penjualan') ||
    lower.includes('refund') ||
    lower.includes('cashback')
  ) {
    return 'CR';
  }

  // Kategori resmi pemasukan
  if (INCOME_CATEGORIES.includes(category)) {
    return 'CR';
  }

  // SEMUA kategori belanja, makan, kos, tagihan, cicilan, jajan, operasional ADALAH PENGELUARAN (DB)
  return 'DB';
}

/**
 * Klasifikasikan teks transaksi menggunakan Groq AI
 * @param {string} description - Teks nama pengeluaran/pemasukan
 * @returns {Promise<{category: string, type: 'CR'|'DB', confidence: number, reason: string, source: 'groq'|'fallback'}>}
 */
async function classifyTransaction(description) {
  if (!description || typeof description !== 'string' || !description.trim()) {
    return {
      category: 'Belanja Kebutuhan Pokok',
      type: 'DB',
      confidence: 0.5,
      reason: 'Deskripsi transaksi kosong',
      source: 'fallback'
    };
  }

  const cleanText = description.trim();

  try {
    const prompt = `Kamu adalah AI pengkategori transaksi perbankan myBCA ADAPT.
Pilih SATU kategori paling tepat dari daftar 9 kategori resmi ini:
1. Gaji & Penghasilan (pemasukan gaji kantor, payroll, uang saku masuk) -> Tipe: CR
2. Hunian & Kos (pengeluaran sewa kos, kontrakan, cicilan rumah KPR) -> Tipe: DB
3. Cicilan & Paylater (pengeluaran paylater, kartu kredit, angsuran) -> Tipe: DB
4. Belanja Kebutuhan Pokok (pengeluaran sembako, minimarket, beras, makan, ikan, sayur, belanja pasar) -> Tipe: DB
5. Jajan & Gaya Hidup (pengeluaran kopi, kafe, makan restoran, nongkrong, hiburan) -> Tipe: DB
6. Tagihan & Utilitas (pengeluaran listrik PLN, air PDAM, pulsa, kuota internet, WiFi) -> Tipe: DB
7. Pendapatan Usaha & QRIS (pemasukan uang masuk hasil penjualan/omset usaha/QRIS) -> Tipe: CR
8. Operasional & Bisnis (pengeluaran bisnis: beli bahan baku, supplier, vendor, kulakan, gaji karyawan) -> Tipe: DB
9. Investasi & Deposito (pengeluaran penempatan reksa dana, saham, deposito berjangka) -> Tipe: DB

PENTING TENTANG TIPE TRANSAKSI:
- Tipe WAJIB 'CR' (Uang Masuk / Pemasukan) HANYA untuk: Gaji & Penghasilan ATAU Pendapatan Usaha & QRIS.
- Tipe WAJIB 'DB' (Uang Keluar / Pengeluaran) untuk SEMUA pembelian makanan, belanja pasar, ikan/daging, jajan, sewa kos, cicilan, tagihan, dan operasional.

Nama Transaksi: "${cleanText}"

Format jawaban WAJIB:
Kategori: <tuliskan persis nama kategori di atas>
Tipe: <DB jika uang keluar / CR jika uang masuk>
Alasan: <penjelasan 1 kalimat>`;

    const requestBody = {
      model: GROQ_MODEL,
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 80,
      temperature: 0.1
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 detik timeout

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'myBCA-ADAPT-AI-Agent/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Groq API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    // Ekstraksi kategori dari output teks (cek baris 'Kategori: ...' terlebih dahulu)
    let matchedCategory = null;
    let reason = 'Dianalisis secara otomatis oleh AI Agent Groq.';

    const catLineMatch = rawContent.match(/Kategori:\s*([^\n\r]+)/i);
    if (catLineMatch && catLineMatch[1]) {
      const candidate = catLineMatch[1].trim();
      for (const cat of VALID_CATEGORIES) {
        if (candidate.toLowerCase().includes(cat.toLowerCase())) {
          matchedCategory = cat;
          break;
        }
      }
    }

    if (!matchedCategory) {
      for (const cat of VALID_CATEGORIES) {
        if (rawContent.includes(cat)) {
          matchedCategory = cat;
          break;
        }
      }
    }

    const reasonMatch = rawContent.match(/Alasan:\s*([^\n\r]+)/i);
    if (reasonMatch && reasonMatch[1]) {
      reason = reasonMatch[1].trim();
    }

    if (!matchedCategory) {
      const fb = fallbackRuleBased(cleanText);
      matchedCategory = fb.category;
      reason = fb.reason;
    }

    // Ekstraksi tipe dari output jika terdeteksi eksplisit
    let type = determineTransactionType(matchedCategory, cleanText);
    const typeMatch = rawContent.match(/Tipe:\s*(CR|DB)/i);
    if (typeMatch && typeMatch[1]) {
      const suggestedType = typeMatch[1].toUpperCase();

      // Banking Integrity Guard:
      // Kategori Pengeluaran (Belanja, Jajan, Kos, Tagihan, Cicilan, dll) TIDAK BOLEH jadi CR
      // kecuali deskripsi secara eksplisit memuat kata kunci refund / cashback!
      if (suggestedType === 'CR' && EXPENSE_CATEGORIES.includes(matchedCategory)) {
        const lower = cleanText.toLowerCase();
        if (lower.includes('refund') || lower.includes('cashback') || lower.includes('kembalian') || lower.includes('uang masuk') || lower.includes('transfer masuk')) {
          type = 'CR';
        } else {
          type = 'DB'; // Overrule kesalahan LLM ke standar aman akuntansi perbankan!
        }
      } else if (suggestedType === 'DB' && INCOME_CATEGORIES.includes(matchedCategory)) {
        const lower = cleanText.toLowerCase();
        if (lower.includes('potong') || lower.includes('biaya') || lower.includes('pajak')) {
          type = 'DB';
        } else {
          type = 'CR';
        }
      } else {
        type = suggestedType;
      }
    }

    return {
      category: matchedCategory,
      type: type,
      confidence: 0.96,
      reason: reason,
      source: 'groq'
    };

  } catch (err) {
    // Graceful fallback ke rule-based NLP jika Groq lambat/unreachable
    const fb = fallbackRuleBased(cleanText);
    return {
      ...fb,
      source: 'fallback'
    };
  }
}

module.exports = {
  classifyTransaction,
  VALID_CATEGORIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES
};
