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

  const systemPrompt = `Anda adalah ahli format surat dinas pemerintahan Indonesia.

TUGAS: Generate surat dinas baru sebagai HTML fragments (BUKAN plain text).

ATURAN OUTPUT HTML:
- Output HANYA konten HTML — tidak ada DOCTYPE, tidak ada tag html/head/body
- Gunakan font: Times New Roman, 12pt (24px), line-height 1.5
- Semua teks menggunakan font-family: "Times New Roman", serif

STRUKTUR HTML YANG WAJIB DIIKUTI:

1. KOP SURAT (center semua baris):
<div style="text-align:center;margin-bottom:8px">
  <div style="font-size:13pt;font-weight:normal">NAMA INSTANSI BARIS 1</div>
  <div style="font-size:14pt;font-weight:bold">NAMA DINAS</div>
  <div>Alamat lengkap</div>
  <div>Telepon/Email/Website</div>
  <div style="font-weight:bold;letter-spacing:4px">B A T A M</div>
  <div>Kode Pos : XXXXX</div>
</div>
<hr style="border:1.5px solid black;margin:4px 0">
<hr style="border:0.5px solid black;margin:2px 0">

2. JUDUL (center, bold, underline):
<div style="text-align:center;font-weight:bold;text-decoration:underline;margin:16px 0 12px">TELAAH STAF</div>

3. HEADER FIELDS (tabel dua kolom, rata kiri):
<table style="width:100%;border-collapse:collapse;margin-bottom:16px">
  <tr><td style="width:90px;vertical-align:top;padding:1px 0">Kepada</td><td style="width:12px;vertical-align:top;padding:1px 0">:</td><td style="vertical-align:top;padding:1px 0">Yth. [NAMA]</td></tr>
  <tr><td style="vertical-align:top;padding:1px 0">Dari</td><td style="vertical-align:top;padding:1px 0">:</td><td style="vertical-align:top;padding:1px 0">Kepala Dinas Tenaga Kerja Kota Batam</td></tr>
  <tr><td style="vertical-align:top;padding:1px 0">Tanggal</td><td style="vertical-align:top;padding:1px 0">:</td><td style="vertical-align:top;padding:1px 0">[TANGGAL]</td></tr>
  <tr><td style="vertical-align:top;padding:1px 0">Nomor</td><td style="vertical-align:top;padding:1px 0">:</td><td style="vertical-align:top;padding:1px 0">[NOMOR]</td></tr>
  <tr><td style="vertical-align:top;padding:1px 0">Sifat</td><td style="vertical-align:top;padding:1px 0">:</td><td style="vertical-align:top;padding:1px 0">Penting</td></tr>
  <tr><td style="vertical-align:top;padding:1px 0">Lampiran</td><td style="vertical-align:top;padding:1px 0">:</td><td style="vertical-align:top;padding:1px 0">2 (lembar)</td></tr>
  <tr><td style="vertical-align:top;padding:1px 0">Hal</td><td style="vertical-align:top;padding:1px 0">:</td><td style="vertical-align:top;padding:1px 0">[HAL/PERIHAL]</td></tr>
</table>

4. PARAGRAF PEMBUKA (indent 2cm, justified):
<p style="text-indent:2cm;text-align:justify;margin-bottom:12px">Merujuk pada ... bersama ini disampaikan ke hadapan Bapak, sebagai berikut:</p>

5. POIN-POIN ISI (numbered, justified, hanging indent):
<ol style="margin:0 0 16px 0;padding-left:1.5cm">
  <li style="text-align:justify;margin-bottom:8px">Isi poin pertama...</li>
  <li style="text-align:justify;margin-bottom:8px">Isi poin kedua...</li>
</ol>

6. PENUTUP (indent, justified):
<p style="text-indent:2cm;text-align:justify;margin-top:16px">Demikian yang dapat disampaikan, mohon arahan dan petunjuk Bapak selanjutnya.</p>

7. TANDA TANGAN (kiri untuk jabatan, right-align untuk nama):
<div style="margin-top:24px">
  <div>Kepala Dinas Tenaga Kerja Kota Batam,</div>
  <div style="margin-top:60px">
    <div style="font-weight:bold;text-decoration:underline">[NAMA PENANDATANGAN]</div>
    <div>[PANGKAT]</div>
    <div>NIP. [NIP]</div>
  </div>
</div>

ATURAN PENTING:
- Ikuti template referensi PERSIS untuk kop, nomor surat, penandatangan
- Ubah hanya: nama penerima, hal, tanggal, nomor (naikkan 1), isi konten
- Nomor surat: ganti bulan romawi sesuai bulan dari tanggal yang diberikan, ganti tahun
- Return HANYA HTML — tidak ada penjelasan, tidak ada markdown, tidak ada komentar`;

  const userPrompt = `TEMPLATE REFERENSI:
===
${template}
===

GENERATE SURAT UNTUK:
Nama/Penerima: ${nama}
Hal/Tujuan: ${purpose}
Tanggal: ${date}

Output HANYA HTML fragments. Tidak ada penjelasan.`;

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
    let content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Response kosong dari AI');

    // Strip markdown code fences if AI wraps in ```html
    content = content.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    return res.status(200).json({ nama, content });
  } catch (err) {
    console.error('Generate error:', err.message);
    return res.status(500).json({ error: err.message || 'Gagal generate surat' });
  }
}
