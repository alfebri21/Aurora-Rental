"use strict";

// Isi dengan nomor WhatsApp milikmu untuk demonstrasi.
// Format: 6281234567890, tanpa +, spasi, atau tanda hubung.
const whatsappNumber = "6288229147512";

const bookingDialog = document.querySelector("#booking-dialog");
const bookingForm = document.querySelector("#booking-form");
const closeButton = document.querySelector("#close-booking");
const bookingButtons = document.querySelectorAll(".booking-button");

const selectedCar = document.querySelector("#selected-car");
const customerName = document.querySelector("#customer-name");
const rentalDate = document.querySelector("#rental-date");
const rentalDuration = document.querySelector("#rental-duration");
const rentalService = document.querySelector("#rental-service");
const estimatedTotal = document.querySelector("#estimated-total");

const selfDriveOption = rentalService.querySelector(
  'option[value="self-drive"]'
);

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

let activeCar = null;
let lastBookingButton = null;

// Mengambil tanggal lokal agar tidak bergeser karena zona waktu.
function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function updateMinimumDate() {
  rentalDate.min = getToday();
}

// Mengambil harga sesuai pilihan layanan.
function getDailyPrice() {
  if (!activeCar) return null;

  return rentalService.value === "with-driver"
    ? activeCar.withDriver
    : activeCar.selfDrive;
}

// Menghitung estimasi biaya.
function calculateTotal() {
  const duration = Number(rentalDuration.value);
  const dailyPrice = getDailyPrice();

  if (
    !Number.isInteger(duration) ||
    duration < 1 ||
    !Number.isFinite(dailyPrice) ||
    dailyPrice <= 0
  ) {
    return null;
  }

  const total = dailyPrice * duration;

  return Number.isSafeInteger(total) ? total : null;
}

function updateEstimatedTotal() {
  const total = calculateTotal();

  estimatedTotal.textContent =
    total === null
      ? "Isi durasi sewa yang valid"
      : rupiah.format(total);
}

// Membuka formulir berdasarkan mobil yang dipilih.
bookingButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeCar = {
      name: button.dataset.car,
      selfDrive: button.dataset.selfDrive
        ? Number(button.dataset.selfDrive)
        : null,
      withDriver: button.dataset.withDriver
        ? Number(button.dataset.withDriver)
        : null,
      driverOnly: button.dataset.driverOnly === "true"
    };

    lastBookingButton = button;

    bookingForm.reset();
    customerName.setCustomValidity("");
    rentalDate.setCustomValidity("");

    selectedCar.value = activeCar.name;
    updateMinimumDate();

    // Alphard dan Hiace hanya tersedia dengan sopir.
    const onlyWithDriver =
      activeCar.driverOnly || activeCar.selfDrive === null;

    selfDriveOption.disabled = onlyWithDriver;
    selfDriveOption.hidden = onlyWithDriver;

    rentalService.value = onlyWithDriver
      ? "with-driver"
      : "self-drive";

    updateEstimatedTotal();

    bookingDialog.showModal();
    customerName.focus();
  });
});

// Menutup popup.
closeButton.addEventListener("click", () => {
  bookingDialog.close();
});

// Mengembalikan fokus ke tombol mobil setelah popup ditutup.
// Tombol Escape juga otomatis didukung oleh elemen dialog.
bookingDialog.addEventListener("close", () => {
  lastBookingButton?.focus();
});

// Memperbarui estimasi ketika pilihan berubah.
rentalDuration.addEventListener("input", updateEstimatedTotal);
rentalService.addEventListener("change", updateEstimatedTotal);

customerName.addEventListener("input", () => {
  customerName.setCustomValidity("");
});

rentalDate.addEventListener("input", () => {
  rentalDate.setCustomValidity("");
});

// Menyusun pesan dan membuka WhatsApp.
bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!activeCar) return;

  updateMinimumDate();

  const name = customerName.value.trim();

  customerName.setCustomValidity(
    name ? "" : "Masukkan nama penyewa."
  );

  rentalDate.setCustomValidity(
    rentalDate.value && rentalDate.value < getToday()
      ? "Tanggal sewa tidak boleh sebelum hari ini."
      : ""
  );

  if (!bookingForm.reportValidity()) return;

  const total = calculateTotal();

  if (total === null) {
    alert("Periksa kembali durasi dan pilihan layanan.");
    return;
  }

  if (!/^62[0-9]{8,13}$/.test(whatsappNumber)) {
    alert(
      "Nomor WhatsApp demonstrasi belum diisi dengan benar. " +
      "Isi whatsappNumber di file js/script.js menggunakan nomor milikmu."
    );
    return;
  }

  const date = new Date(`${rentalDate.value}T00:00:00`);

  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);

  const serviceName =
    rentalService.value === "with-driver"
      ? "Dengan sopir"
      : "Lepas kunci";

  const message = [
    "Halo, saya ingin mencoba pemesanan melalui website Aurora.",
    "",
    "*DEMONSTRASI PEMESANAN — BUKAN RESERVASI NYATA*",
    "",
    `Nama: ${name}`,
    `Mobil: ${activeCar.name}`,
    `Tanggal mulai: ${formattedDate}`,
    `Durasi: ${rentalDuration.value} hari`,
    `Layanan: ${serviceName}`,
    `Tarif acuan: ${rupiah.format(getDailyPrice())} / hari`,
    `Estimasi biaya: ${rupiah.format(total)}`,
    "",
    "Estimasi mengikuti tarif acuan pada website.",
    "Cakupan paket dan biaya tambahan belum dikonfirmasi.",
    "",
    "Pesan ini hanya untuk demonstrasi proyek portofolio."
  ].join("\n");

  const whatsappUrl =
    `https://wa.me/${whatsappNumber}` +
    `?text=${encodeURIComponent(message)}`;

  window.location.assign(whatsappUrl);
});

updateMinimumDate();