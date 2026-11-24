// All brochure copy lives here (docs/SDD.md N7). Copy rules in SDD §9:
// no partnership/endorsement claims, no logos of government bodies,
// no statistics without a traceable pilot source, always say "estimasi".

export interface Card {
  title: string;
  body: string;
}

export const content = {
  meta: {
    title: "Dari. — Blok M, Dipetakan Ulang",
    description:
      "Prototipe riset peta aksesibilitas pejalan kaki. Coba peta trotoar Blok M dan lihat bagaimana data trotoar bisa dikumpulkan lebih cepat.",
  },

  hook: {
    eyebrow: "Prototipe riset · Dari.",
    title: "Blok M, dipetakan ulang.",
    question:
      "Bagaimana rasanya berjalan di trotoar Blok M jika Anda memakai kursi roda, membawa stroller, atau memakai tongkat?",
    // F7: fill ONLY with a figure traced to approved pilot data, e.g.
    // { value: "…%", label: "…", source: "Pilot Blok M, Nov 2026 (unverified)" }
    stat: null as null | { value: string; label: string; source: string },
    cta: "Coba petanya",
    imageNote: "Foto lapangan menyusul setelah lolos review privasi",
  },

  problem: {
    title: "Data trotoar kota sulit dijaga tetap baru",
    lead: "Kota butuh data trotoar yang rinci untuk merencanakan perbaikan. Cara mengumpulkannya hari ini sering kali:",
    cards: [
      { title: "Lambat", body: "Survei manual per ruas jalan memakan waktu berminggu-minggu untuk satu kawasan." },
      { title: "Mahal", body: "Butuh tim lapangan, alat ukur, dan input data ulang ke sistem." },
      { title: "Cepat basi", body: "Lapak, parkir liar, dan galian berubah lebih cepat daripada jadwal survei berikutnya." },
    ] satisfies Card[],
  },

  tryIt: {
    title: "Coba sendiri",
    lead: "Ketuk segmen trotoar atau titik hambatan untuk melihat estimasi lebar, hambatan, dan seberapa yakin kami terhadap datanya.",
    listToggle: "Lihat sebagai daftar",
    emptyDetail: "Ketuk segmen pada peta untuk melihat detailnya.",
    loading: "Memuat peta…",
    mapError: "Peta tidak dapat dimuat di perangkat ini. Daftar data tetap tersedia di bawah.",
    posterMapError: "Peta tidak dapat dimuat. Coba lagi saat sinyal lebih baik.",
    // Teks petunjuk gestur MapLibre (layar penuh brosur).
    gestures: {
      "CooperativeGesturesHandler.WindowsHelpText": "Gunakan Ctrl + gulir untuk memperbesar peta",
      "CooperativeGesturesHandler.MacHelpText": "Gunakan ⌘ + gulir untuk memperbesar peta",
      "CooperativeGesturesHandler.MobileHelpText": "Gunakan dua jari untuk menggeser peta",
    },
    legend: [
      { key: "yes", label: "Bisa dilalui kursi roda (estimasi)" },
      { key: "no", label: "Terhalang / tidak bisa dilalui" },
      { key: "unknown", label: "Belum diketahui" },
      { key: "obstacle", label: "Hambatan" },
    ],
    badges: {
      demo: "Data ilustrasi — bukan hasil survei",
      pilot: "Pilot riset Blok M — belum diverifikasi",
    },
  },

  howItWorks: {
    title: "Cara kerjanya",
    steps: [
      { title: "Rekam", body: "Petugas berjalan sambil merekam trotoar dengan ponsel." },
      { title: "Ukur", body: "AI mendeteksi hambatan dan mengestimasi lebar trotoar, lengkap dengan tingkat ketidakpastiannya." },
      { title: "Tinjau", body: "Hasilnya masuk ke peta untuk ditinjau manusia sebelum dipakai. Tidak ada yang terbit otomatis." },
    ] satisfies Card[],
  },

  benefits: {
    title: "Dirancang untuk mendukung kota",
    lead: "Dari. masih prototipe riset. Ke depan, pendekatan ini dirancang untuk dapat membantu:",
    cards: [
      { title: "Prioritas perbaikan", body: "Melihat ruas mana yang paling menghambat pejalan kaki, berdasarkan data, bukan hanya laporan." },
      { title: "Perencanaan berbasis bukti", body: "Setiap atribut punya bukti dan tingkat keyakinan yang bisa ditelusuri." },
      { title: "Kanal laporan warga", body: "Warga dapat ikut melaporkan perubahan kondisi trotoar di sekitarnya." },
    ] satisfies Card[],
  },

  transparency: {
    title: "Transparan sejak awal",
    points: [
      "Dari. adalah prototipe riset nonkomersial. Kami tidak menjual peta, data, atau layanan.",
      "Kerja sama dengan pemerintah masih berupa potensi, bukan kemitraan yang sudah berjalan.",
      "Setiap ukuran adalah estimasi dan ditampilkan bersama tingkat ketidakpastiannya.",
      "Wajah, plat nomor, dan teks pada rekaman disamarkan sebelum data diproses lebih lanjut.",
    ],
  },

  cta: {
    title: "Petakan wilayah Anda berikutnya",
    stickyLabel: "Petakan wilayah Anda", // must fit one line on a 360 px phone
    lead: "Tertarik melihat bagaimana pendekatan ini bisa diterapkan di wilayah Anda? Mari berdiskusi.",
    // Fill in before the event (SDD §14 Q2). Leave null to hide the button.
    whatsapp: null as null | { number: string; message: string },
    formUrl: null as null | string,
    email: null as null | string,
    fallback: "Temui tim Dari. di booth untuk berdiskusi langsung.",
  },

  footer: {
    attribution: "Peta dasar © OpenStreetMap contributors · Protomaps",
    engineers: { label: "Untuk engineer", href: null as null | string },
    note: "Dari. — prototipe riset aksesibilitas sipil.",
  },
};

export type Content = typeof content;
