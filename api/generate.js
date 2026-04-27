export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { template, nama, purpose, date } = req.body;

  if (!template?.trim() || !nama?.trim() || !purpose?.trim() || !date?.trim()) {
    return res.status(400).json({ error: 'Semua field harus diisi' });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY belum diset' });
  }

  const systemPrompt = `Anda adalah ahli format surat dinas pemerintahan Indonesia yang sangat teliti.

TUGAS: Buat satu surat baru yang format dan strukturnya IDENTIK dengan template referensi.

ATURAN FORMAT - WAJIB DIIKUTI:
1. Salin PERSIS struktur layout: kop surat, nomor, lampiran, perihal, alamat tujuan, isi, penutup, blok tanda tangan, paraf hirarkhi, tembusan
2. Gunakan SPASI dan TAB yang SAMA PERSIS dengan template untuk setiap baris
3. Alignment teks (kiri/tengah/kanan) harus sama persis dengan template
4. Ubah HANYA: nama penerima, hal/perihal, tanggal, isi konten yang relevan, nomor urut surat (naikkan 1)
5. Paraf hirarkhi (Sekretaris, Kabid, dll) WAJIB disertakan jika ada di template
6. Gunakan Bahasa Indonesia formal dan baku
7. Return HANYA teks surat mentah - TANPA penjelasan, TANPA markdown, TANPA komentar
8. Mulai langsung dari baris pertama header/kop surat
9. Pertahankan baris kosong antar bagian persis seperti template`;

  const userPrompt = `TEMPLATE REFERENSI (ikuti layout, spasi, dan tab PERSIS):
===
${template}
===

GENERATE SURAT BARU:
Nama/Penerima: ${nama}
Hal/Tujuan: ${purpose}
Tanggal: ${date}

PENTING: Salin semua spasi dan tab dari template persis apa adanya. Hanya ganti konten yang relevan.
Return HANYA teks surat. Tidak ada kata pengantar atau penjelasan.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4096,
        temperature: 0.1,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Response kosong dari AI');

    return res.status(200).json({ nama, content });
  } catch (err) {
    console.error('Generate error:', err.message);
    return res.status(500).json({ error: err.message || 'Gagal generate surat' });
  }
}
