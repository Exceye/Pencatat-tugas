(() => {
  "use strict";

  const KUNCI = "tugas-sekolah";
  const form = document.getElementById("form-tugas");
  const inputJudul = document.getElementById("judul");
  const inputMapel = document.getElementById("mapel");
  const inputTenggat = document.getElementById("tenggat");
  const daftar = document.getElementById("daftar");
  const kosong = document.getElementById("kosong");
  const ringkasan = document.getElementById("ringkasan");
  const progres = document.querySelector(".progres");
  const progresIsi = document.getElementById("progres-isi");
  const tombolFilter = [...document.querySelectorAll("[data-filter]")];
  const tombolHapusSelesai = document.getElementById("hapus-selesai");
  const status = document.getElementById("status");

  let filterAktif = "semua";
  let tugas = muat();

  function muat() {
    try {
      const data = JSON.parse(localStorage.getItem(KUNCI) || "[]");
      if (!Array.isArray(data)) return [];
      // Bersihkan data lama/invalid supaya satu item rusak tidak merusak aplikasi.
      return data.filter((item) => item && typeof item === "object")
        .map((item) => ({
          id: typeof item.id === "string" ? item.id : buatId(),
          judul: String(item.judul ?? "").trim().slice(0, 100),
          mapel: String(item.mapel ?? "").trim().slice(0, 40),
          tenggat: tanggalValid(item.tenggat) ? item.tenggat : "",
          selesai: item.selesai === true
        }))
        .filter((item) => item.judul.length > 0);
    } catch (error) {
      console.warn("Data tugas tidak dapat dibaca; mulai dengan daftar kosong.", error);
      return [];
    }
  }

  function simpan() {
    try {
      localStorage.setItem(KUNCI, JSON.stringify(tugas));
      return true;
    } catch (error) {
      console.error("Gagal menyimpan tugas.", error);
      status.textContent = "Perubahan belum tersimpan. Periksa ruang penyimpanan browser.";
      return false;
    }
  }

  function buatId() {
    return (globalThis.crypto && typeof crypto.randomUUID === "function")
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function tanggalValid(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  }

  function formatTanggal(value) {
    if (!tanggalValid(value)) return "";
    const [y, m, d] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric", month: "short", year: "numeric"
    }).format(new Date(y, m - 1, d));
  }

  function buatTeks(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = text;
    return el;
  }

  function buatTombol(label, className, aksi, id, ariaLabel) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.dataset.aksi = aksi;
    button.dataset.id = id;
    if (ariaLabel) button.setAttribute("aria-label", ariaLabel);
    return button;
  }

  function render() {
    daftar.replaceChildren();
    const terlihat = tugas.filter((item) => {
      if (filterAktif === "belum") return !item.selesai;
      if (filterAktif === "selesai") return item.selesai;
      return true;
    });

    kosong.hidden = terlihat.length > 0;
    kosong.textContent = tugas.length === 0
      ? "Belum ada tugas. Tambahkan tugas pertamamu di atas."
      : "Tidak ada tugas untuk filter ini.";

    terlihat.sort((a, b) => {
      if (a.selesai !== b.selesai) return Number(a.selesai) - Number(b.selesai);
      if (a.tenggat && b.tenggat) return a.tenggat.localeCompare(b.tenggat);
      if (a.tenggat) return -1;
      if (b.tenggat) return 1;
      return 0;
    });

    for (const item of terlihat) {
      const li = document.createElement("li");
      li.className = `tugas${item.selesai ? " tugas-selesai" : ""}`;
      const main = document.createElement("div");
      main.className = "tugas-utama";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.selesai;
      checkbox.dataset.aksi = "toggle";
      checkbox.dataset.id = item.id;
      checkbox.setAttribute("aria-label", `Tandai "${item.judul}" ${item.selesai ? "belum selesai" : "selesai"}`);
      main.append(checkbox);

      const detail = document.createElement("div");
      detail.className = "detail";
      detail.append(buatTeks("p", "judul-tugas", item.judul));

      const meta = [];
      if (item.mapel) meta.push(item.mapel);
      if (item.tenggat) meta.push(`Tenggat: ${formatTanggal(item.tenggat)}`);
      if (meta.length) detail.append(buatTeks("p", "meta", meta.join(" · ")));
      main.append(detail);
      li.append(main);

      const actions = document.createElement("div");
      actions.className = "aksi";
      actions.append(
        buatTombol("Edit", "button button-quiet", "edit", item.id, `Edit ${item.judul}`),
        buatTombol("Hapus", "button button-danger", "hapus", item.id, `Hapus ${item.judul}`)
      );
      li.append(actions);
      daftar.append(li);
    }

    const selesai = tugas.filter((item) => item.selesai).length;
    const total = tugas.length;
    const persen = total ? Math.round((selesai / total) * 100) : 0;
    ringkasan.textContent = total
      ? `${selesai} dari ${total} tugas selesai`
      : "Belum ada tugas";
    progresIsi.style.width = `${persen}%`;
    progres.setAttribute("aria-valuenow", String(persen));
    tombolHapusSelesai.disabled = selesai === 0;

    tombolFilter.forEach((button) => {
      const aktif = button.dataset.filter === filterAktif;
      button.classList.toggle("aktif", aktif);
      button.setAttribute("aria-pressed", String(aktif));
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const judul = inputJudul.value.trim();
    if (!judul) {
      inputJudul.setCustomValidity("Nama tugas wajib diisi.");
      inputJudul.reportValidity();
      inputJudul.setCustomValidity("");
      inputJudul.focus();
      return;
    }

    tugas.unshift({
      id: buatId(),
      judul: judul.slice(0, 100),
      mapel: inputMapel.value.trim().slice(0, 40),
      tenggat: tanggalValid(inputTenggat.value) ? inputTenggat.value : "",
      selesai: false
    });
    simpan();
    form.reset();
    inputJudul.focus();
    status.textContent = "Tugas berhasil ditambahkan.";
    render();
  });

  tombolFilter.forEach((button) => {
    button.addEventListener("click", () => {
      filterAktif = button.dataset.filter;
      render();
    });
  });

  daftar.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.dataset.aksi !== "toggle") return;
    const item = tugas.find((t) => t.id === target.dataset.id);
    if (!item) return;
    item.selesai = target.checked;
    simpan();
    status.textContent = item.selesai ? "Tugas ditandai selesai." : "Tugas ditandai belum selesai.";
    render();
  });

  daftar.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-aksi]");
    if (!button) return;
    const item = tugas.find((t) => t.id === button.dataset.id);
    if (!item) return;

    if (button.dataset.aksi === "hapus") {
      if (!confirm(`Hapus tugas "${item.judul}"?`)) return;
      tugas = tugas.filter((t) => t.id !== item.id);
      simpan();
      status.textContent = "Tugas dihapus.";
      render();
    } else if (button.dataset.aksi === "edit") {
      const judulBaru = prompt("Ubah nama tugas:", item.judul);
      if (judulBaru === null) return;
      if (!judulBaru.trim()) {
        alert("Nama tugas tidak boleh kosong.");
        return;
      }
      const mapelBaru = prompt("Ubah mata pelajaran (boleh dikosongkan):", item.mapel);
      if (mapelBaru === null) return;
      const tenggatBaru = prompt("Ubah tenggat dengan format YYYY-MM-DD, atau kosongkan:", item.tenggat);
      if (tenggatBaru === null) return;
      if (tenggatBaru.trim() && !tanggalValid(tenggatBaru.trim())) {
        alert("Format tanggal tidak valid. Gunakan YYYY-MM-DD.");
        return;
      }
      item.judul = judulBaru.trim().slice(0, 100);
      item.mapel = mapelBaru.trim().slice(0, 40);
      item.tenggat = tenggatBaru.trim();
      simpan();
      status.textContent = "Tugas diperbarui.";
      render();
    }
  });

  tombolHapusSelesai.addEventListener("click", () => {
    const jumlah = tugas.filter((item) => item.selesai).length;
    if (!jumlah || !confirm(`Hapus ${jumlah} tugas yang sudah selesai?`)) return;
    tugas = tugas.filter((item) => !item.selesai);
    simpan();
    status.textContent = `${jumlah} tugas selesai dihapus.`;
    render();
  });

  render();
})();
