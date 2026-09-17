/**
 * Groq AI Recommender Service
 * myBCA ADAPT
 * Menghasilkan rekomendasi fitur cerdas dan alasan finansial kontekstual
 * menggunakan model Groq AI berdasarkan profil, saldo rekening, pola transaksi,
 * dan kalkulasi rata-rata pengeluaran bulanan (Anti-Meleset Engine).
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'allam-2-7b';
const { analyzeUserCashflow } = require('./cashflowCalculator');

// In-memory short cache untuk efisiensi token dan performa ultra cepat
const recCache = new Map();

/**
 * Dapatkan rekomendasi fitur terpersonalisasi via Groq AI
 * @param {Object} user - Objek user/persona (id, name, title, role, occupation)
 * @param {Object} account - Objek rekening (account_no, balance)
 * @param {Array} transactions - Daftar transaksi periode berjalan
 * @param {Array} catalog - Katalog 12 fitur myBCA
 * @param {Array} activeFeatureIds - ID fitur yang sudah aktif
 * @returns {Promise<Array>} Daftar rekomendasi fitur terurut dengan skor dan alasan AI
 */
async function getGroqRecommendations(user, account, transactions = [], catalog = [], activeFeatureIds = []) {
  // Kandidat fitur yang belum aktif
  const candidates = catalog.filter(f => !activeFeatureIds.includes(f.id));
  if (candidates.length === 0) {
    return [];
  }

  // Cek cache
  const cacheKey = `${user?.id || 'guest'}_${(activeFeatureIds || []).sort().join('-')}_${transactions.length}_${account?.balance || 0}`;
  const cached = recCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < 30000)) { // Cache valid 30 detik
    return cached.data;
  }

  // Analisis rata-rata cashflow bulanan nasabah
  const cashflow = analyzeUserCashflow(user?.id);

  // Hitung ringkasan transaksi per kategori
  const catSummary = {};
  for (const t of transactions) {
    const cat = t.category || 'Lainnya';
    if (!catSummary[cat]) {
      catSummary[cat] = { count: 0, amount: 0 };
    }
    catSummary[cat].count += 1;
    catSummary[cat].amount += Number(t.amount || 0);
  }

  const summaryLines = Object.entries(catSummary).map(
    ([cat, info]) => `- ${cat}: ${info.count}x (Total Rp ${info.amount.toLocaleString('id-ID')})`
  );

  const candidateLines = candidates.map(
    f => `- ${f.id}: ${f.name} (${f.description})`
  );

  const balanceText = account ? `Rp ${Number(account.balance).toLocaleString('id-ID')}` : 'Rp 0';
  const roleText = user?.title || user?.role || user?.occupation || 'Nasabah myBCA';

  try {
    const prompt = `Kamu adalah AI Financial Advisor cerdas perbankan myBCA ADAPT.
Profil Nasabah: ${user.name} (${roleText})
Saldo Rekening: ${balanceText}

Analisis Arus Kas Riil Nasabah (Engine Anti-Meleset):
- Rata-rata Pengeluaran Bulanan: Rp ${cashflow.average_monthly_expense.toLocaleString('id-ID')}
- Pemasukan Bulanan: Rp ${cashflow.average_monthly_income.toLocaleString('id-ID')}
- Surplus Kas Bersih: Rp ${cashflow.net_surplus.toLocaleString('id-ID')}
- Rekomendasi Alokasi Tabungan Aman: Rp ${cashflow.recommendations.optimal.toLocaleString('id-ID')}/bulan (15% pemasukan)

Pola Mutasi Transaksi Terkini:
${summaryLines.length > 0 ? summaryLines.join('\n') : '- Belum ada transaksi tercatat'}

Daftar Fitur yang Belum Aktif:
${candidateLines.join('\n')}

Panduan Ahli Finansial Perbankan:
- Fresh Graduate / Pekerja Baru (terima gaji, bayar sewa kos, cicilan): Prioritaskan auto_save (Auto-Save Gaji) atau health_insurance (Asuransi Kesehatan Mandiri) atau conservative_invest.
- Khusus auto_save: Kaitkan alasan secara eksplisit dengan rata-rata pengeluaran bulanan (Rp ${cashflow.average_monthly_expense.toLocaleString('id-ID')}) dan jelaskan kalkulasi nominal auto-save (Rp ${cashflow.recommendations.optimal.toLocaleString('id-ID')}/bulan) agar arus kas harian tidak meleset.
- Rumah Tangga Baru / Pasangan: Prioritaskan joint_account, family_budgeting, family_insurance.
- Merchant / Pengusaha (omset QRIS, biaya operasional/supplier): Prioritaskan qris_merchant, cashflow_report.
- Mahasiswa: Prioritaskan student_savings.
- Pra-Pensiun / Senior: Prioritaskan conservative_invest, welma_portfolio.

Tugas:
Pilihlah 3 fitur terbaik yang paling relevan untuk nasabah di atas.
Untuk tiap fitur, tentukan skor kecocokan (score 75-98) dan tuliskan alasan cerdas (1-2 kalimat) dalam Bahasa Indonesia profesional yang mengaitkan transaksi nyata nasabah dengan manfaat fitur.

Output WAJIB berupa array JSON murni tanpa pembuka/penutup markdown seperti format berikut:
[
  {"feature_id": "nama_id", "score": 95, "reason": "Alasan cerdas mengaitkan transaksi..."}
]`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s timeout

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'myBCA-ADAPT-Groq-Advisor/1.0'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 380,
        temperature: 0.1
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Groq API returned HTTP ${response.status}`);
    }

    const resJson = await response.json();
    const content = resJson.choices?.[0]?.message?.content || '';

    // Ekstraksi array JSON dari respon Groq
    const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      throw new Error('Groq did not return valid JSON array');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Groq returned empty array');
    }

    // Gabungkan dengan metadata fitur katalog
    const candidateMap = new Map(candidates.map(c => [c.id, c]));
    const groqRecs = [];
    const usedIds = new Set();

    for (const item of parsed) {
      if (item.feature_id && candidateMap.has(item.feature_id) && !usedIds.has(item.feature_id)) {
        const feat = candidateMap.get(item.feature_id);
        usedIds.add(item.feature_id);
        groqRecs.push({
          feature_id: feat.id,
          name: feat.name,
          category: feat.category,
          icon: feat.icon,
          points: feat.points,
          description: feat.description,
          score: Math.min(99, Math.max(70, parseInt(item.score, 10) || 85)),
          reason: item.reason || `Dianalisis cerdas oleh AI Groq untuk profil ${user.name}`,
          source: 'groq',
          signals: summaryLines.slice(0, 3)
        });
      }
    }

    // Lengkapi sisa kandidat yang tidak dipilih Groq dengan skor lebih rendah
    for (const feat of candidates) {
      if (!usedIds.has(feat.id)) {
        groqRecs.push({
          feature_id: feat.id,
          name: feat.name,
          category: feat.category,
          icon: feat.icon,
          points: feat.points,
          description: feat.description,
          score: 30 + (feat.points || 10),
          reason: `Rekomendasi pendukung ekosistem finansial myBCA`,
          source: 'groq_catalog',
          signals: []
        });
      }
    }

    // Urutkan skor tertinggi ke terendah
    groqRecs.sort((a, b) => b.score - a.score);

    // Simpan ke cache
    recCache.set(cacheKey, { timestamp: Date.now(), data: groqRecs });
    return groqRecs;

  } catch (err) {
    // Graceful fallback ke rule-based mathematical propensity engine
    return null;
  }
}

module.exports = {
  getGroqRecommendations
};
