# NEXORA 3.0.0

Downloader + scraper + media library + native player. UI tetap HTML/CSS/JS tanpa framework besar; kemampuan sistem memakai API Android bawaan.

## Fitur 3.0.0

- Scraper otomatis lama dipertahankan (`web/engine.js` tidak dirombak).
- DownloadManager Android, batch, riwayat, koleksi, backup, playlist, OTA scraper.
- Native background player berbasis `MediaPlayer` + `MediaSession` platform.
- Equalizer platform, BassBoost, Virtualizer, stereo pan dan orbit 8D sederhana pada audio yang diputar oleh native player.
- Visualizer FFT native opsional. Izin mikrofon/RECORD_AUDIO baru diminta saat pengguna menekan Visualizer.
- MediaStore scanner audio/video/gambar (dibatasi maksimum 1.500 item per scan).
- Metadata reader dan album art tertanam untuk media yang dapat dibaca `MediaMetadataRetriever`.
- Metadata editor lokal (sidecar aplikasi; tidak menulis ulang tag ID3 file asli).
- Lirik LRC manual dengan sinkronisasi waktu dan penyimpanan lokal per media.
- PiP sistem Android 8+ melalui Activity; dukungan aktual tergantung perangkat dan WebView.
- Scraper plugin JS pilihan pengguna. Plugin dijalankan sebagai kode tepercaya di WebView; hanya pasang file dari sumber yang dipercaya.
- Floating control overlay untuk play/pause; bukan floating video window terpisah.

## Ringan

- Tidak memakai Media3/ExoPlayer, Compose, React, atau database server.
- Native audio effects menggunakan Android AudioEffect; tidak menambah library player eksternal.
- MediaStore mengembalikan metadata + URI, bukan menyalin file media.
- Visualizer hanya aktif setelah diminta pengguna; animasi UI dibatasi ketika halaman player tidak terbuka.
- Scraper engine lama dan alur unduh otomatis tetap dipertahankan.

## Plugin scraper

Impor file `.js` dari Media > Scraper Plugin. Plugin harus menetapkan `window.NX_PLUGIN` dengan `id`, `name`, `match(url)`, dan `run(url, context)`. `run` mengembalikan object berisi `title` dan `items`; setiap item memakai bentuk yang sama seperti scraper bawaan (`label`, `ext`, `kind`, `url`). Contoh ada di `plugins/example-plugin.js`.

**Keamanan:** plugin JS bisa menjalankan kode di dalam WebView. Jangan memasang plugin tidak tepercaya.

## Build APK

Gunakan GitHub Actions: push ke branch `main`, atau buka Actions → Build APK → Run workflow.

Persyaratan: JDK 17, Gradle 8.9, Android Gradle Plugin 8.6.1, Android SDK platform 35.

```bash
gradle -p android assembleRelease
```

APK: `android/app/build/outputs/apk/release/app-release.apk`.

## Package & versi

- Application ID: `nx.app`
- Version: `3.0.0` (code 8)
- Min SDK: 24 (Android 7.0)
- Target SDK: 35

## Batasan yang perlu diuji di perangkat

- Audio FX dan visualizer berlaku untuk audio yang diputar oleh Native Player. File `blob:` dan sebagian URL ber-header khusus tetap diputar melalui WebView sehingga tidak melewati Android AudioEffect.
- Visualizer memerlukan izin RECORD_AUDIO; jika izin ditolak, visualizer tidak aktif.
- Metadata editor menyimpan judul/artis/album sebagai data lokal aplikasi, tidak mengubah tag file asli.
- Lirik tidak diambil otomatis dari internet; pengguna dapat menempelkan format LRC.
- Album art diambil jika tertanam dan bisa dibaca Android; tidak semua media memilikinya.
- PiP memerlukan Android 8+; floating control overlay memerlukan izin tampil di atas aplikasi lain.
- Native player masih memakai MediaPlayer platform; format/codec bergantung dukungan Android perangkat.
- Belum diuji pada perangkat fisik. Build native final perlu dijalankan lewat GitHub Actions/Android SDK.
