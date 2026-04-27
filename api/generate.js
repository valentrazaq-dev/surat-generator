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

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: `Anda adalah ahli format surat dinas pemerintahan Indonesia yang sangat teliti dan presisi.

TUGAS UTAMA: Generate satu surat baru yang format-nya IDENTIK dengan template referensi yang diberikan.

ATURAN WAJIB - TIDAK BOLEH DILANGGAR:
1. Salin PERSIS semua elemen format: kop surat, nomor surat, lampiran, perihal, pembuka, penutup, blok tanda tangan, tembusan
2. Ubah HANYA: nama/jabatan/instansi penerima sesuai nama yang diberikan, isi konten sesuai tujuan, dan tanggal
3. Jika ada nomor surat dengan angka urut, pertahankan atau naikkan 1 angka
4. Gunakan Bahasa Indonesia formal dan baku yang tepat
5. Pertahankan semua spasi, enter, dan formatting kosong dari template
6. PENTING: Return HANYA teks surat saja - tidak ada penjelasan, tidak ada markdown, tidak ada komentar apapun
7. Mulai langsung dari baris pertama kop surat atau header surat`,
        messages: [
          {
            role: 'user',
            content: `TEMPLATE REFERENSI (ikuti format ini PERSIS):
===
${template}
===

GENERATE SURAT UNTUK:
Nama/Penerima: ${nama}
Hal/Tujuan: ${purpose}
Tanggal: ${date}

Return HANYA isi surat saja. Tidak ada penjelasan. Tidak ada komentar.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || `Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text?.trim();

    if (!content) throw new Error('Response kosong dari AI');

    return res.status(200).json({ nama, content });
  } catch (err) {
    console.error('Generate error:', err.message);
    return res.status(500).json({ error: err.message || 'Gagal generate surat' });
  }
}
