/* =========================================================
   KONFIGURASI BACKEND
========================================================= */
const API_URL = "https://backend-sistem-prediksi-calon-ketua-production.up.railway.app";

/* =========================================================
   MEMBERSHIP FUNCTION - INPUT
========================================================= */
// Rapot (0–40)
function mfRapotRendah(x) {
    if (x <= 10) return 1;
    if (x < 20) return (20 - x) / 10;
    return 0;
}
function mfRapotSedang(x) {
    if (x <= 10 || x >= 30) return 0;
    if (x < 20) return (x - 10) / 10;
    return (30 - x) / 10;
}
function mfRapotTinggi(x) {
    if (x <= 20) return 0;
    if (x < 30) return (x - 20) / 10;
    return 1;
}

// Sikap (10–40)
function mfSikapBuruk(x) {
    if (x <= 15) return 1;
    if (x < 25) return (25 - x) / 10;
    return 0;
}
function mfSikapBaik(x) {
    if (x <= 20 || x >= 35) return 0;
    if (x < 30) return (x - 20) / 10;
    return (35 - x) / 5;
}
function mfSikapSangatBaik(x) {
    if (x <= 30) return 0;
    if (x < 35) return (x - 30) / 5;
    return 1;
}

// Prestasi (10–30)
function mfPrestasiRendah(x) {
    if (x <= 15) return 1;
    if (x < 20) return (20 - x) / 5;
    return 0;
}
function mfPrestasiTinggi(x) {
    if (x <= 20) return 0;
    if (x < 25) return (x - 20) / 5;
    return 1;
}

/* =========================================================
   MEMBERSHIP FUNCTION - OUTPUT
========================================================= */
function mfOutputTidak(x) {
    if (x <= 30) return 1;
    if (x < 50) return (50 - x) / 20;
    return 0;
}
function mfOutputRekom(x) {
    if (x <= 30 || x >= 80) return 0;
    if (x < 50) return (x - 30) / 20;
    return (80 - x) / 30;
}
function mfOutputSangat(x) {
    if (x <= 70) return 0;
    if (x < 90) return (x - 70) / 20;
    return 1;
}

/* =========================================================
   RULE BASE
========================================================= */
const rules = [
    { rapot: 'rendah', sikap: 'buruk', prestasi: 'rendah', output: 'tidak' },
    { rapot: 'rendah', sikap: 'baik', prestasi: 'tinggi', output: 'rekom' },
    { rapot: 'sedang', sikap: 'baik', prestasi: 'tinggi', output: 'rekom' },
    { rapot: 'sedang', sikap: 'sangat', prestasi: 'tinggi', output: 'sangat' },
    { rapot: 'tinggi', sikap: 'baik', prestasi: 'tinggi', output: 'sangat' },
    { rapot: 'tinggi', sikap: 'sangat', prestasi: 'tinggi', output: 'sangat' },
];

/* =========================================================
   FUZZY PROCESS
========================================================= */
function fuzzifyRapot(x) {
    return {
        rendah: mfRapotRendah(x),
        sedang: mfRapotSedang(x),
        tinggi: mfRapotTinggi(x),
    };
}
function fuzzifySikap(x) {
    return {
        buruk: mfSikapBuruk(x),
        baik: mfSikapBaik(x),
        sangat: mfSikapSangatBaik(x),
    };
}
function fuzzifyPrestasi(x) {
    return {
        rendah: mfPrestasiRendah(x),
        tinggi: mfPrestasiTinggi(x),
    };
}

function centroid(agg) {
    let num = 0, den = 0;
    agg.forEach((v, i) => {
        num += i * v;
        den += v;
    });
    return den === 0 ? 0 : num / den;
}

function inferensi(r, s, p) {
    let agg = Array(101).fill(0);

    rules.forEach(rule => {
        let alpha = Math.min(r[rule.rapot], s[rule.sikap], p[rule.prestasi]);
        for (let i = 0; i <= 100; i++) {
            let mu =
                rule.output === 'tidak' ? mfOutputTidak(i) :
                rule.output === 'rekom' ? mfOutputRekom(i) :
                mfOutputSangat(i);
            agg[i] = Math.max(agg[i], Math.min(alpha, mu));
        }
    });

    return centroid(agg);
}

/* =========================================================
   HITUNG & SIMPAN KE BACKEND
========================================================= */
async function hitungDanTampilkan() {
    const rapot = +document.getElementById("rapot").value;
    const sikap = +document.getElementById("sikap").value;
    const prestasi = +document.getElementById("prestasi").value;

    const r = fuzzifyRapot((rapot / 100) * 40);
    const s = fuzzifySikap(sikap);
    const p = fuzzifyPrestasi(prestasi);

    const score = inferensi(r, s, p);
    const status = score <= 40 ? "Tidak Direkomendasikan"
        : score <= 70 ? "Direkomendasikan"
        : "Sangat Direkomendasikan";

    await fetch(`${API_URL}/api/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ rapot, sikap, prestasi, score, status }])
    });

    document.getElementById("hasil").innerHTML =
        `<b>${score.toFixed(2)}</b> (${status})`;
}