//Konfigurasi backend
const API_URL = "https://backend-sistem-prediksi-calon-ketua-production.up.railway.app";

// Fungsi Keanggotaan (Membership Functions) - Disesuaikan per variabel
// Rapot: Domain 0-40 (setelah konversi), MF rendah/sedang/tinggi
function mfRapotRendah(x) {
    if (x <= 10) return 1;
    else if (x > 10 && x < 20) return (20 - x) / 10;
    else return 0;
}

function mfRapotSedang(x) {
    if (x <= 10 || x >= 30) return 0;
    else if (x > 10 && x < 20) return (x - 10) / 10;
    else if (x >= 20 && x < 30) return (30 - x) / 10;
    else return 0;
}

function mfRapotTinggi(x) {
    if (x <= 20) return 0;
    else if (x > 20 && x < 30) return (x - 20) / 10;
    else return 1;
}

// Sikap: Domain 10-40, MF buruk/baik/sangat baik (aturan berbeda)
function mfSikapBuruk(x) {
    if (x <= 15) return 1;
    else if (x > 15 && x < 25) return (25 - x) / 10;
    else return 0;
}

function mfSikapBaik(x) {
    if (x <= 20 || x >= 35) return 0;
    else if (x > 20 && x < 30) return (x - 20) / 10;
    else if (x >= 30 && x < 35) return (35 - x) / 5;
    else return 0;
}

function mfSikapSangatBaik(x) {
    if (x <= 30) return 0;
    else if (x > 30 && x < 35) return (x - 30) / 5;
    else return 1;
}

// Prestasi: Domain 10-30, MF rendah/tinggi (aturan berbeda, lebih sederhana)
function mfPrestasiRendah(x) {
    if (x <= 15) return 1;
    else if (x > 15 && x < 20) return (20 - x) / 5;
    else return 0;
}

function mfPrestasiTinggi(x) {
    if (x <= 20) return 0;
    else if (x > 20 && x < 25) return (x - 20) / 5;
    else return 1;
}

// Output (Rekomendasi): Domain 0-100, MF tidak direkomendasikan/direkomendasikan/sangat direkomendasikan
function mfOutputTidakRekomendasi(x) {
    if (x <= 30) return 1;
    else if (x > 30 && x < 50) return (50 - x) / 20;
    else return 0;
}

function mfOutputRekomendasi(x) {
    if (x <= 30 || x >= 80) return 0;
    else if (x > 30 && x < 50) return (x - 30) / 20;
    else if (x >= 50 && x < 80) return (80 - x) / 30;
    else return 0;
}

function mfOutputSangatRekomendasi(x) {
    if (x <= 70) return 0;
    else if (x > 70 && x < 90) return (x - 70) / 20;
    else return 1;
}

// Rule Base yang Diperluas (18 rule untuk semua kombinasi rapot, sikap, prestasi)
// Logika: Jika semua tinggi/sangat baik → sangat; jika campuran → rekomendasi; jika ada rendah/buruk → tidak
const rules = [
    // Rapot Rendah
    { rapot: 'rendah', sikap: 'buruk', prestasi: 'rendah', output: 'tidak' },
    { rapot: 'rendah', sikap: 'buruk', prestasi: 'tinggi', output: 'tidak' },
    { rapot: 'rendah', sikap: 'baik', prestasi: 'rendah', output: 'tidak' },
    { rapot: 'rendah', sikap: 'baik', prestasi: 'tinggi', output: 'rekomendasi' },
    { rapot: 'rendah', sikap: 'sangat_baik', prestasi: 'rendah', output: 'rekomendasi' },
    { rapot: 'rendah', sikap: 'sangat_baik', prestasi: 'tinggi', output: 'rekomendasi' },
    // Rapot Sedang
    { rapot: 'sedang', sikap: 'buruk', prestasi: 'rendah', output: 'tidak' },
    { rapot: 'sedang', sikap: 'buruk', prestasi: 'tinggi', output: 'rekomendasi' },
    { rapot: 'sedang', sikap: 'baik', prestasi: 'rendah', output: 'rekomendasi' },
    { rapot: 'sedang', sikap: 'baik', prestasi: 'tinggi', output: 'rekomendasi' },
    { rapot: 'sedang', sikap: 'sangat_baik', prestasi: 'rendah', output: 'rekomendasi' },
    { rapot: 'sedang', sikap: 'sangat_baik', prestasi: 'tinggi', output: 'sangat' },
    // Rapot Tinggi
    { rapot: 'tinggi', sikap: 'buruk', prestasi: 'rendah', output: 'tidak' },
    { rapot: 'tinggi', sikap: 'buruk', prestasi: 'tinggi', output: 'rekomendasi' },
    { rapot: 'tinggi', sikap: 'baik', prestasi: 'rendah', output: 'rekomendasi' },
    { rapot: 'tinggi', sikap: 'baik', prestasi: 'tinggi', output: 'sangat' },
    { rapot: 'tinggi', sikap: 'sangat_baik', prestasi: 'rendah', output: 'rekomendasi' },  // Ini yang match input Anda
    { rapot: 'tinggi', sikap: 'sangat_baik', prestasi: 'tinggi', output: 'sangat' },
];

// Fungsi untuk mendapatkan derajat keanggotaan input
function fuzzifyRapot(x) {
    return {
        rendah: mfRapotRendah(x),
        sedang: mfRapotSedang(x),
        tinggi: mfRapotTinggi(x)
    };
}

function fuzzifySikap(x) {
    return {
        buruk: mfSikapBuruk(x),
        baik: mfSikapBaik(x),
        sangat_baik: mfSikapSangatBaik(x)
    };
}

function fuzzifyPrestasi(x) {
    return {
        rendah: mfPrestasiRendah(x),
        tinggi: mfPrestasiTinggi(x)
    };
}

// Evaluasi Rule dan Aggregation
function evaluateRules(rapotFuzzy, sikapFuzzy, prestasiFuzzy) {
    let aggregated = Array(101).fill(0); // Domain output 0-100

    rules.forEach(rule => {
        let alpha = Math.min(
            rapotFuzzy[rule.rapot] || 0,
            sikapFuzzy[rule.sikap.replace(' ', '_')] || 0, // Handle spasi
            prestasiFuzzy[rule.prestasi] || 0
        ); // Firing strength (min untuk AND)

        // Implication: Clip MF output
        for (let out = 0; out <= 100; out++) {
            let muOut = 0;
            if (rule.output === 'tidak') muOut = mfOutputTidakRekomendasi(out);
            else if (rule.output === 'rekomendasi') muOut = mfOutputRekomendasi(out);
            else if (rule.output === 'sangat') muOut = mfOutputSangatRekomendasi(out);

            aggregated[out] = Math.max(aggregated[out], Math.min(alpha, muOut));
        }
    });

    return aggregated;
}

// Defuzzifikasi Centroid
function centroid(aggregated) {
    let sumNum = 0, sumDen = 0;
    for (let x = 0; x <= 100; x++) {
        sumNum += x * aggregated[x];
        sumDen += aggregated[x];
    }
    return sumDen === 0 ? 0 : sumNum / sumDen;
}

// Fungsi Utama Hitung Fuzzy
function hitungFuzzy() {
    let rapot = parseFloat(document.getElementById("rapot").value);
    let sikap = parseInt(document.getElementById("sikap").value);
    let prestasi = parseInt(document.getElementById("prestasi").value);

    // Validasi input
    if (isNaN(rapot) || rapot < 0 || rapot > 100) {
        alert("Masukkan nilai rapot antara 0-100!");
        return;
    }
    if (sikap === 0) {
        alert("Pilih sikap!");
        return;
    }
    // if (prestasi === 0) {
    //     alert("Pilih prestasi!");
    //     return;
    // }

    // Konversi rapot ke skala fuzzy (0-40, tapi tetap proporsional)
    let rapotFuzzyValue = (rapot / 100) * 40; // Skala ke 0-40

    // Fuzzifikasi
    let rapotFuzzy = fuzzifyRapot(rapotFuzzyValue);
    let sikapFuzzy = fuzzifySikap(sikap);
    let prestasiFuzzy = fuzzifyPrestasi(prestasi);

    // Evaluasi Rule dan Aggregation
    let aggregated = evaluateRules(rapotFuzzy, sikapFuzzy, prestasiFuzzy);

    // Jika semua aggregated = 0 (tidak ada rule match), gunakan default berdasarkan rata-rata fuzzy input
    let hasNonZero = aggregated.some(val => val > 0);
    if (!hasNonZero) {
        // Default: Jika rata-rata fuzzy > 0.5 → rekomendasi, else tidak
        let avgFuzzy = (rapotFuzzy.tinggi + sikapFuzzy.sangat_baik + prestasiFuzzy.tinggi) / 3;
        let defaultOutput = avgFuzzy > 0.5 ? 'rekomendasi' : 'tidak';
        for (let out = 0; out <= 100; out++) {
            let muOut = 0;
            if (defaultOutput === 'tidak') muOut = mfOutputTidakRekomendasi(out);
            else if (defaultOutput === 'rekomendasi') muOut = mfOutputRekomendasi(out);
            else muOut = mfOutputSangatRekomendasi(out);
            aggregated[out] = muOut;  // Gunakan MF penuh sebagai default
        }
    }

    // Defuzzifikasi
    let finalScore = centroid(aggregated);

    // Status berdasarkan output
    let status = "";
    if (finalScore <= 40) status = "Tidak Direkomendasikan";
    else if (finalScore <= 70) status = "Direkomendasikan";
    else status = "Sangat Direkomendasikan";

    // Tampilkan hasil
    document.getElementById("hasil").innerHTML = `
        Derajat Keanggotaan Rapot: Rendah=${rapotFuzzy.rendah.toFixed(2)}, Sedang=${rapotFuzzy.sedang.toFixed(2)}, Tinggi=${rapotFuzzy.tinggi.toFixed(2)}<br>
        Derajat Keanggotaan Sikap: Buruk=${sikapFuzzy.buruk.toFixed(2)}, Baik=${sikapFuzzy.baik.toFixed(2)}, Sangat Baik=${sikapFuzzy.sangat_baik.toFixed(2)}<br>
        Derajat Keanggotaan Prestasi: Rendah=${prestasiFuzzy.rendah.toFixed(2)}, Tinggi=${prestasiFuzzy.tinggi.toFixed(2)}<br><hr>
        Nilai Akhir (Defuzzifikasi): <b>${finalScore.toFixed(2)}</b><br>
        Status: <b>${status}</b>
    `;

    // Visualisasi Kurva MF (contoh untuk rapot)
    drawMFChart(rapotFuzzyValue, rapotFuzzy);
}

// Fungsi untuk menggambar kurva MF menggunakan Chart.js
function drawMFChart(inputValue, fuzzyValues) {
    const ctx = document.getElementById('mfChart').getContext('2d');
    const labels = Array.from({length: 41}, (_, i) => i); // 0-40 untuk rapot
    const dataRendah = labels.map(x => mfRapotRendah(x));
    const dataSedang = labels.map(x => mfRapotSedang(x));
    const dataTinggi = labels.map(x => mfRapotTinggi(x));

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Rendah', data: dataRendah, borderColor: 'red', fill: false },
                { label: 'Sedang', data: dataSedang, borderColor: 'blue', fill: false },
                { label: 'Tinggi', data: dataTinggi, borderColor: 'green', fill: false },
                { label: 'Input Anda', data: [{x: inputValue, y: Math.max(fuzzyValues.rendah, fuzzyValues.sedang, fuzzyValues.tinggi)}], type: 'scatter', backgroundColor: 'black' }
            ]
        },
        options: {
            scales: { x: { title: { display: true, text: 'Nilai Rapot (Fuzzy)' } }, y: { title: { display: true, text: 'Derajat Keanggotaan' } } }
        }
    });
}

// Reset Form
// function resetForm() {
    
// }

// Fungsi Utama Hitung Fuzzy untuk Multiple Calon
function hitungFuzzyMultiple(calonData) {
    let results = [];
    calonData.forEach(calon => {
        let rapot = parseFloat(calon.rapot);
        let sikap = parseInt(calon.sikap);
        let prestasi = parseInt(calon.prestasi);
        let nama = calon.nama;

        // Validasi (sama seperti asli, tapi per calon)
        if (isNaN(rapot) || rapot < 0 || rapot > 100 || sikap === 0 || prestasi === 0 || !nama.trim()) {
            alert(`Data calon ${nama} tidak valid! Pastikan semua field diisi.`);
            return;
        }

        // Konversi dan fuzzifikasi (sama)
        let rapotFuzzyValue = (rapot / 100) * 40;
        let rapotFuzzy = fuzzifyRapot(rapotFuzzyValue);
        let sikapFuzzy = fuzzifySikap(sikap);
        let prestasiFuzzy = fuzzifyPrestasi(prestasi);

        // Evaluasi dan defuzzifikasi
        let aggregated = evaluateRules(rapotFuzzy, sikapFuzzy, prestasiFuzzy);
        let finalScore = centroid(aggregated);

        // Status
        let status = "";
        if (finalScore <= 40) status = "Tidak Direkomendasikan";
        else if (finalScore <= 70) status = "Direkomendasikan";
        else status = "Sangat Direkomendasikan";

        results.push({ nama, score: finalScore.toFixed(2), status });
    });
    return results;
}

// Fungsi untuk generate form dinamis
function generateForms(numCalon) {
    const container = document.getElementById('calonContainer');
    container.innerHTML = ''; // Clear existing
    for (let i = 1; i <= numCalon; i++) {
        const formHtml = `
            <div class="col-md-6 mb-4">
                <div class="card p-3">
                    <h4 class="card-title"><i class="bi bi-person"></i> Calon ${i}</h4>
                    <div class="mb-3">
                        <label class="form-label">Nama Calon</label>
                        <input type="text" class="form-control" id="nama${i}" placeholder="Masukkan nama">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Nilai Rata-Rata Rapot (0-100)</label>
                        <input type="number" class="form-control" id="rapot${i}" min="0" max="100" step="0.01" placeholder="Masukkan nilai rapot">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Sikap</label>
                        <select class="form-select" id="sikap${i}">
                            <option value="0">Pilih Opsi</option>
                            <option value="40">A</option>
                            <option value="30">B</option>
                            <option value="20">C</option>
                            <option value="10">D</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Prestasi</label>
                        <select class="form-select" id="prestasi${i}">
                            <option value="0">Tidak Ada</option>
                            <option value="10">Kecamatan</option>
                            <option value="30">Provinsi</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += formHtml;
    }
}

// Fungsi Hitung dan Redirect ke Halaman Hasil
async function hitungDanTampilkan() {
    const numCalon = parseInt(document.getElementById('numCalon').value);
    if (isNaN(numCalon) || numCalon < 1 || numCalon > 10) {
        alert("Pilih jumlah calon antara 1-10!");
        return;
    }

    let calonData = [];
    for (let i = 1; i <= numCalon; i++) {
        calonData.push({
            nama: document.getElementById(`nama${i}`).value,
            rapot: document.getElementById(`rapot${i}`).value,
            sikap: document.getElementById(`sikap${i}`).value,
            prestasi: document.getElementById(`prestasi${i}`).value
        });
    }

    const results = hitungFuzzyMultiple(calonData);
    if (results.length !== numCalon) return;

    try {
        let response;

        if (window.editId) {
            // MODE EDIT (PUT) – hanya perbarui 1 data
            const updatedData = {
                ...calonData[0],
                score: results[0].score,
                status: results[0].status
            };

            response = await fetch(`${API_URL}/api/candidates/${window.editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
        } else {
            // MODE TAMBAH BARU (POST) – simpan semua hasil
            const payload = results.map(r => ({
                ...calonData.find(c => c.nama === r.nama),
                score: r.score,
                status: r.status
            }));

            response = await fetch(`${API_URL}/api/candidates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (!response.ok) throw new Error('Save/Update failed');

        localStorage.setItem('fuzzyResults', JSON.stringify(results));
        window.location.href = 'result.html';
    } catch (err) {
        alert('Error saving/updating to database: ' + err.message);
    }
}

// Reset Form
function resetForm() {
    document.getElementById('numCalon').value = '1';
    document.getElementById('calonContainer').innerHTML = '';
    generateForms(1); // Default 1 calon

    document.getElementById("rapot").value = "";
    document.getElementById("sikap").value = "0";
    document.getElementById("prestasi").value = "0";
    document.getElementById("hasil").innerHTML = "";
    // Reset chart jika perlu
    const ctx = document.getElementById('mfChart').getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}