# ============================================
# TERMINAL COMMANDS - COPY PASTE SATU-SATU
# ============================================
# Jalankan dari dalam folder: surat-generator/
# ============================================

# STEP 1: Init git
git init

# STEP 2: Add semua file
git add .

# STEP 3: Commit
git commit -m "Initial deploy: Surat Generator AI"

# STEP 4: Buat repo di GitHub dulu (manual):
# → Buka github.com → New repository
# → Name: surat-generator
# → Private: boleh
# → Jangan centang README
# → Klik Create repository
# → Copy URL repo (contoh: https://github.com/USERNAME/surat-generator.git)

# STEP 5: Connect ke GitHub (ganti URL sesuai repo lo)
git remote add origin https://github.com/USERNAME/surat-generator.git

# STEP 6: Push
git branch -M main
git push -u origin main

# ============================================
# SETELAH PUSH - SETUP VERCEL
# ============================================
# 1. Buka vercel.com → Login dengan GitHub
# 2. Klik "Add New Project"
# 3. Import repo "surat-generator"
# 4. Di bagian "Environment Variables", tambah:
#    Key: ANTHROPIC_API_KEY
#    Value: sk-ant-xxxxxxx (API key lo)
# 5. Klik Deploy
# 6. Tunggu 2-3 menit
# 7. URL live siap!
# ============================================

# KALAU ADA ERROR "permission denied" di Mac/Linux:
chmod +x . && git init

# KALAU git push minta username/password:
# Pakai Personal Access Token GitHub (bukan password biasa)
# Settings → Developer settings → Personal access tokens → Generate new token
# Centang: repo
