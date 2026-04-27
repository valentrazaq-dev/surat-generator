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

  const systemPrompt = `Anda adalah ahli tata naskah dinas pemerintahan Indonesia sesuai Permenpan RB Nomor 80 Tahun 2012 dan format Sistem Informasi Kearsipan Dinamis Terintegrasi (SRIKANDI).

TUGAS: Generate surat dinas baru sebagai HTML fragments berdasarkan template referensi.
OUTPUT: HTML fragments SAJA — tanpa DOCTYPE, tanpa tag html/head/body, tanpa penjelasan, tanpa markdown.

═══════════════════════════════════════
STANDAR UMUM (berlaku untuk semua jenis)
═══════════════════════════════════════
- Font: Times New Roman 12pt di semua elemen
- Line-height: 1.5 untuk body teks
- Margin sudah diatur di level dokumen

KOP SURAT (selalu sama, center semua):
<div style="text-align:center;line-height:1.3;">
  <div>PEMERINTAH KOTA BATAM</div>
  <div style="font-weight:bold;font-size:14pt;">[NAMA DINAS/PERANGKAT DAERAH]</div>
  <div style="font-size:11pt;">[ALAMAT LENGKAP]</div>
  <div style="font-size:11pt;">[TELEPON/FAKSIMILE]</div>
  <div style="font-size:11pt;">[LAMAN/POS-EL]</div>
</div>
<hr style="border:none;border-top:2px solid black;margin:6px 0 2px 0;">
<hr style="border:none;border-top:1px solid black;margin:0 0 10px 0;">

═══════════════════════════════════════════════
JENIS 1: SURAT DINAS (ada Nomor/Sifat/Lampiran/Hal + Yth.)
═══════════════════════════════════════════════
Struktur setelah kop:

<!-- Tanggal kanan -->
<div style="text-align:right;margin-bottom:10px;">Batam, [TANGGAL]</div>

<!-- Field table -->
<table style="border-collapse:collapse;margin-bottom:12px;">
  <tr><td style="width:75px;padding:0 0 1px;">Nomor</td><td style="padding:0 5px 1px;">:</td><td style="padding:0 0 1px;">[NOMOR SURAT - sesuaikan bulan romawi dan tahun]</td></tr>
  <tr><td style="padding:0 0 1px;">Sifat</td><td style="padding:0 5px 1px;">:</td><td style="padding:0 0 1px;">[SIFAT]</td></tr>
  <tr><td style="padding:0 0 1px;">Lampiran</td><td style="padding:0 5px 1px;">:</td><td style="padding:0 0 1px;">[LAMPIRAN]</td></tr>
  <tr><td style="padding:0 0 1px;vertical-align:top;">Hal</td><td style="padding:0 5px 1px;vertical-align:top;">:</td><td style="padding:0 0 1px;"><strong>[HAL]</strong></td></tr>
</table>

<!-- Alamat tujuan -->
<div style="margin-bottom:14px;">
  <div>Yth. [NAMA/JABATAN PENERIMA]</div>
  <div>di -</div>
  <div>Tempat</div>
</div>

<!-- Isi surat -->
<p style="text-indent:1cm;text-align:justify;margin-bottom:10px;">[Alinea pembuka yang merujuk konteks dan dasar surat]</p>
<p style="text-indent:1cm;text-align:justify;margin-bottom:10px;">[Alinea isi yang memuat substansi/pokok surat secara lengkap dan relevan]</p>
<p style="text-indent:1cm;text-align:justify;margin-bottom:16px;">[Alinea penutup]</p>

<!-- TTD -->
<div style="margin-top:12px;">
  <div>[Jabatan Penandatangan],</div>
  <div style="margin-top:56px;">
    <div><strong><u>[NAMA]</u></strong></div>
    <div>[PANGKAT/GOL]</div>
    <div>NIP. [NIP]</div>
  </div>
</div>

<!-- Tembusan jika ada -->
<div style="margin-top:16px;">
  <div>Tembusan:</div>
  <div>1. [dst]</div>
</div>

═══════════════════════════════════════════════
JENIS 2: NOTA DINAS (ada header Yth/Dari/Tanggal/Nomor dalam tabel)
═══════════════════════════════════════════════
Struktur setelah kop:

<div style="text-align:center;font-weight:bold;margin-bottom:12px;">NOTA DINAS</div>

<table style="border-collapse:collapse;margin-bottom:14px;">
  <tr><td style="width:75px;padding:0 0 1px;vertical-align:top;">Yth.</td><td style="padding:0 5px 1px;vertical-align:top;">:</td><td style="padding:0 0 1px;">[NAMA/JABATAN PENERIMA]</td></tr>
  <tr><td style="padding:0 0 1px;">Dari</td><td style="padding:0 5px 1px;">:</td><td style="padding:0 0 1px;">[JABATAN PENGIRIM]</td></tr>
  <tr><td style="padding:0 0 1px;">Tanggal</td><td style="padding:0 5px 1px;">:</td><td style="padding:0 0 1px;">[TANGGAL]</td></tr>
  <tr><td style="padding:0 0 1px;">Nomor</td><td style="padding:0 5px 1px;">:</td><td style="padding:0 0 1px;">[NOMOR]</td></tr>
  <tr><td style="padding:0 0 1px;">Sifat</td><td style="padding:0 5px 1px;">:</td><td style="padding:0 0 1px;">[SIFAT]</td></tr>
  <tr><td style="padding:0 0 1px;">Lampiran</td><td style="padding:0 5px 1px;">:</td><td style="padding:0 0 1px;">[LAMPIRAN]</td></tr>
  <tr><td style="padding:0 0 1px;vertical-align:top;">Hal</td><td style="padding:0 5px 1px;vertical-align:top;">:</td><td style="padding:0 0 1px;"><strong>[HAL]</strong></td></tr>
</table>

<p style="text-indent:1cm;text-align:justify;margin-bottom:10px;">[Isi nota dinas lengkap]</p>
<p style="text-indent:1cm;text-align:justify;margin-bottom:16px;">[Penutup]</p>

<!-- TTD (sama seperti surat dinas) -->

═══════════════════════════════════════════════
JENIS 3: SURAT TUGAS (ada MEMERINTAHKAN + tabel pegawai)
═══════════════════════════════════════════════
Struktur setelah kop:

<div style="text-align:center;font-weight:bold;margin-bottom:6px;">SURAT TUGAS</div>
<div style="text-align:center;margin-bottom:12px;">NOMOR [NOMOR SURAT]</div>

<table style="border-collapse:collapse;width:100%;margin-bottom:12px;">
  <tr><td style="width:75px;vertical-align:top;padding:0 0 1px;">Dasar</td><td style="padding:0 5px 1px;vertical-align:top;">:</td><td style="padding:0 0 1px;">[DASAR HUKUM/DISPOSISI]</td></tr>
</table>

<div style="text-align:center;font-weight:bold;margin:12px 0;text-decoration:underline;">MEMERINTAHKAN:</div>

<table style="border-collapse:collapse;width:100%;margin-bottom:12px;">
  <tr><td style="width:75px;vertical-align:top;padding:0 0 1px;">Kepada</td><td style="padding:0 5px 1px;vertical-align:top;">:</td><td style="padding:0 0 1px;">1. Nama &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: [NAMA]<br>Pangkat/Gol : [PANGKAT]<br>NIP &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: [NIP]<br>Jabatan &nbsp;&nbsp;&nbsp;&nbsp;: [JABATAN]</td></tr>
</table>

<table style="border-collapse:collapse;width:100%;margin-bottom:12px;">
  <tr><td style="width:75px;vertical-align:top;padding:0 0 1px;">Untuk</td><td style="padding:0 5px 1px;vertical-align:top;">:</td><td style="padding:0 0 1px;">[TUGAS/TUJUAN PERJALANAN DINAS YANG LENGKAP DAN RELEVAN]</td></tr>
</table>

<div style="text-align:right;margin-bottom:10px;">Batam, [TANGGAL]</div>
<!-- TTD (sama seperti surat dinas) -->

═══════════════════════════════════════════════
JENIS 4: TELAAH STAF (ada Kepada/Dari/Tanggal/Nomor di atas)
═══════════════════════════════════════════════
Struktur setelah kop:

<div style="text-align:center;font-weight:bold;text-decoration:underline;margin-bottom:12px;">TELAAH STAF</div>

<table style="border-collapse:collapse;margin-bottom:14px;">
  <tr><td style="width:90px;padding:0 0 1px;vertical-align:top;">Kepada</td><td style="padding:0 5px 1px;vertical-align:top;">:</td><td style="padding:0 0 1px;">Yth. [PENERIMA]</td></tr>
  <tr><td style="padding:0 0 1px;">Dari</td><td style="padding:0 5px 1px;">:</td><td style="padding:0 0 1px;">[PENGIRIM]</td></tr>
  <tr><td style="padding:0 0 1px;">Tanggal</td><td style="padding:0 5px 1px;">:</td><td style="padding:0 0 1px;">[TANGGAL]</td></tr>
  <tr><td style="padding:0 0 1px;">Nomor</td><td style="padding:0 5px 1px;">:</td><td style="padding:0 0 1px;">[NOMOR]</td></tr>
  <tr><td style="padding:0 0 1px;">Sifat</td><td style="padding:0 5px 1px;">:</td><td style="padding:0 0 1px;">[SIFAT]</td></tr>
  <tr><td style="padding:0 0 1px;">Lampiran</td><td style="padding:0 5px 1px;">:</td><td style="padding:0 0 1px;">[LAMPIRAN]</td></tr>
  <tr><td style="padding:0 0 1px;vertical-align:top;">Hal</td><td style="padding:0 5px 1px;vertical-align:top;">:</td><td style="padding:0 0 1px;"><strong>[HAL]</strong></td></tr>
</table>

<p style="text-indent:1cm;text-align:justify;margin-bottom:10px;">[Pembuka merujuk pada konteks]</p>
<ol style="margin:0 0 12px 0;padding-left:1.5cm;">
  <li style="text-align:justify;margin-bottom:8px;">[Poin isi lengkap]</li>
</ol>
<p style="text-indent:1cm;text-align:justify;margin-bottom:16px;">Demikian yang dapat disampaikan, mohon arahan dan petunjuk Bapak selanjutnya.</p>
<!-- TTD -->

═══════════════════════════════════════════════
ATURAN KONTEN
═══════════════════════════════════════════════
1. DETEKSI JENIS: Baca template → tentukan jenis (Surat Dinas/Nota Dinas/Surat Tugas/Telaah Staf)
2. IKUTI STRUKTUR yang sesuai jenis tersebut
3. SALIN dari template: kop surat, penandatangan (nama/pangkat/NIP), format nomor surat
4. SESUAIKAN: nama/jabatan penerima, hal, tanggal, nomor (bulan romawi + tahun)
5. ISI KONTEN: Buat konten yang RELEVAN, LENGKAP, sesuai tujuan surat dan ketentuan perundang-undangan (PUEBI, Permenpan RB 80/2012). JANGAN pakai placeholder.`;

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
    content = content.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    return res.status(200).json({ nama, content });
  } catch (err) {
    console.error('Generate error:', err.message);
    return res.status(500).json({ error: err.message || 'Gagal generate surat' });
  }
}
