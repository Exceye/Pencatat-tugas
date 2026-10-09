// Kunci penyimpanan di localStorage browser
const KUNCI = "tugas-sekolah";

// Ambil elemen dari HTML
const form = document.getElementById("form-tugas");
const inputJudul = document.getElementById("judul");
const inputMapel = document.getElementById("mapel");
const inputTenggat = document.getElementById("tenggat");
const daftar = document.getElementById("daftar");
const kosong = document.getElementById("kosong");
const ringkasan = document.getElementById("ringkasan");
const progres = document.querySelector(".progres");
const progresIsi = document.getElementById("progres-isi");
const tombolFilter = document.querySelectorAll(".filter button");

let tugas = muat();      // daftar semua tugas
let filter = "semua";    // "semua" | "belum" | "selesai"

// ---------- Penyimpanan ----------
function muat() {
  try {
    const data = JSON.parse(localStorage.getItem(KUNCI));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function simpan() {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(tugas));
  } catch (e) {
    // Abaikan jika penyimpanan tidak tersedia (mis. mode privat)
  }
}

// ---------- Aksi ----------
form.addEventListener("submit", function (e) {
