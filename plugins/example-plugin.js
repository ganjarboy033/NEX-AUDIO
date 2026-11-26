/*
 * Contoh kerangka plugin NEXORA.
 * Ganti domain dan implementasikan run() untuk sumber yang memang Anda miliki/diizinkan.
 * Output item: { label, ext, kind: 'audio'|'video'|'image', url }
 */
window.NX_PLUGIN = {
  id: 'example-direct-media',
  name: 'Example Direct Media',
  match(url) {
    try { return new URL(url).hostname === 'media.example.org'; }
    catch (_) { return false; }
  },
  async run(url) {
    // Contoh ini hanya mengembalikan URL langsung yang dipilih pengguna.
    return {
      title: 'Direct media',
      items: [{ label: 'Media', ext: 'mp4', kind: 'video', url }]
    };
  }
};
