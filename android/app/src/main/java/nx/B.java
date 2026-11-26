package nx;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.webkit.JavascriptInterface;
import java.util.Hashtable;

/** Jembatan JS -> native (window.NX). HTTP bebas-CORS, DownloadManager, clipboard. */
public class B {
    Activity a;
    Hashtable m = new Hashtable();

    public B(Activity a) { this.a = a; }

    /** packed = method \u0001 url \u0001 headers(\n) \u0001 body \u0001 timeoutMs ; hasil diambil lewat poll(id) */
    @JavascriptInterface public void req(String id, String packed) {
        new Thread(new H(m, id, packed)).start();
    }

    @JavascriptInterface public String poll(String id) { return (String) m.remove(id); }

    @JavascriptInterface public String dl(String url, String name, String mime, String hd) {
        try {
            DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
            r.setTitle(name);
            r.setMimeType(mime);
            r.setNotificationVisibility(1);
            r.setDestinationInExternalPublicDir("Download", name);
            String[] hs = hd.split("\n");
            for (int i = 0; i < hs.length; i++) {
                int k = hs[i].indexOf(':');
                if (k > 0) r.addRequestHeader(hs[i].substring(0, k).trim(), hs[i].substring(k + 1).trim());
            }
            DownloadManager d = (DownloadManager) a.getSystemService("download");
            return String.valueOf(d.enqueue(r));
        } catch (Throwable t) { return ""; }
    }

    /** "status|bytes|total" ; status: 1 antre, 2 jalan, 4 jeda, 8 selesai, 16 gagal */
    @JavascriptInterface public String dlState(String id) {
        try {
            DownloadManager d = (DownloadManager) a.getSystemService("download");
            DownloadManager.Query q = new DownloadManager.Query();
            q.setFilterById(new long[]{Long.parseLong(id)});
            Cursor c = d.query(q);
            String r = "";
            if (c.moveToFirst()) {
                StringBuilder s = new StringBuilder();
                s.append(c.getInt(c.getColumnIndex("status")));
                s.append("|");
                s.append(c.getLong(c.getColumnIndex("bytes_so_far")));
                s.append("|");
                s.append(c.getLong(c.getColumnIndex("total_size")));
                r = s.toString();
            }
            c.close();
            return r;
        } catch (Throwable t) { return ""; }
    }

    @JavascriptInterface public void copy(String t) {
        try {
            ClipboardManager c = (ClipboardManager) a.getSystemService("clipboard");
            c.setPrimaryClip(ClipData.newPlainText("nx", t));
        } catch (Throwable e) { }
    }

    @JavascriptInterface public String paste() {
        try {
            ClipboardManager c = (ClipboardManager) a.getSystemService("clipboard");
            ClipData d = c.getPrimaryClip();
            if (d == null || d.getItemCount() == 0) return "";
            return d.getItemAt(0).coerceToText(a).toString();
        } catch (Throwable e) { return ""; }
    }

    @JavascriptInterface public void open(String u) {
        try {
            Intent i = new Intent("android.intent.action.VIEW", Uri.parse(u));
            i.addFlags(0x10000000);
            a.startActivity(i);
        } catch (Throwable e) { }
    }

    @JavascriptInterface public void downloads() {
        try {
            Intent i = new Intent("android.intent.action.VIEW_DOWNLOADS");
            i.addFlags(0x10000000);
            a.startActivity(i);
        } catch (Throwable e) { }
    }


    @JavascriptInterface public String nativePlay(String url, String title) {
        try {
            Intent i = new Intent(a, NativePlayerService.class).setAction(NativePlayerService.PLAY);
            i.putExtra("url", url); i.putExtra("title", title);
            if (android.os.Build.VERSION.SDK_INT >= 26) a.startForegroundService(i); else a.startService(i);
            return "ok";
        } catch (Throwable t) { return "error"; }
    }
    @JavascriptInterface public void nativeControl(String action) {
        try {
            String a0 = "pause".equals(action) ? NativePlayerService.PAUSE : "stop".equals(action) ? NativePlayerService.STOP : NativePlayerService.TOGGLE;
            a.startService(new Intent(a, NativePlayerService.class).setAction(a0));
        } catch (Throwable ignored) { }
    }
    @JavascriptInterface public void overlaySettings() {
        try { if (android.os.Build.VERSION.SDK_INT >= 23 && !android.provider.Settings.canDrawOverlays(a)) {
            Intent i = new Intent(android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + a.getPackageName()));
            a.startActivity(i);
        }} catch(Throwable ignored) { }
    }
    @JavascriptInterface public String startOverlay() {
        try {
            if (android.os.Build.VERSION.SDK_INT >= 23 && !android.provider.Settings.canDrawOverlays(a)) return "permission";
            a.startService(new Intent(a, OverlayService.class)); return "ok";
        } catch(Throwable t) { return "error"; }
    }
    @JavascriptInterface public void stopOverlay() { try { a.stopService(new Intent(a, OverlayService.class)); } catch(Throwable ignored) { } }
    @JavascriptInterface public String scanMedia() {
        org.json.JSONArray out = new org.json.JSONArray();
        String[] projection = {"_id", "_display_name", "mime_type", "duration", "size"};
        android.net.Uri[] roots = {android.provider.MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI, android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI};
        for (int ri=0; ri<roots.length; ri++) {
            android.net.Uri root=roots[ri];
            String[] cols = ri==2 ? new String[]{"_id","_display_name","mime_type","size"} : projection;
            android.database.Cursor c = null;
            try {
                c = a.getContentResolver().query(root, cols, null, null, "date_added DESC");
                if (c == null) continue;
                int id=c.getColumnIndex("_id"), name=c.getColumnIndex("_display_name"), mime=c.getColumnIndex("mime_type"), dur=c.getColumnIndex("duration"), size=c.getColumnIndex("size");
                while(c.moveToNext() && out.length()<1500) {
                    org.json.JSONObject o=new org.json.JSONObject();
                    o.put("id",c.getLong(id)); o.put("name",c.getString(name)); o.put("mime",c.getString(mime));
                    o.put("duration",dur>=0?c.getLong(dur):0); o.put("size",size>=0?c.getLong(size):0);
                    o.put("uri",android.content.ContentUris.withAppendedId(root,c.getLong(id)).toString()); out.put(o);
                }
            } catch(Throwable ignored) { } finally { if(c!=null)c.close(); }
        }
        return out.toString();
    }


    @JavascriptInterface public void audioFx(int eq, int bass, int virtualizer, float pan) { NativePlayerService.setEffects(eq,bass,virtualizer,pan); }
    @JavascriptInterface public String spectrum() { return NativePlayerService.getSpectrum(); }
    @JavascriptInterface public String enableVisualizer() { try { if(android.os.Build.VERSION.SDK_INT>=23 && a.checkSelfPermission("android.permission.RECORD_AUDIO")!=android.content.pm.PackageManager.PERMISSION_GRANTED){a.requestPermissions(new String[]{"android.permission.RECORD_AUDIO"},52);return "permission";} return NativePlayerService.enableVisualizer()?"ok":"error";}catch(Throwable t){return "error";} }
    @JavascriptInterface public void pip() { try { if (android.os.Build.VERSION.SDK_INT >= 26) { android.app.PictureInPictureParams p = new android.app.PictureInPictureParams.Builder().setAspectRatio(new android.util.Rational(16,9)).build(); a.enterPictureInPictureMode(p); } } catch(Throwable ignored) {} }
    @JavascriptInterface public String metadata(String uri) {
        android.media.MediaMetadataRetriever r=new android.media.MediaMetadataRetriever();
        try { r.setDataSource(a, Uri.parse(uri)); org.json.JSONObject o=new org.json.JSONObject();
            String[] keys={android.media.MediaMetadataRetriever.METADATA_KEY_TITLE,android.media.MediaMetadataRetriever.METADATA_KEY_ARTIST,android.media.MediaMetadataRetriever.METADATA_KEY_ALBUM,android.media.MediaMetadataRetriever.METADATA_KEY_DURATION,android.media.MediaMetadataRetriever.METADATA_KEY_MIMETYPE};
            String[] names={"title","artist","album","duration","mime"}; for(int i=0;i<keys.length;i++)o.put(names[i],r.extractMetadata(Integer.parseInt(keys[i]))==null?"":r.extractMetadata(Integer.parseInt(keys[i])));
            byte[] art=r.getEmbeddedPicture(); if(art!=null && art.length<250000)o.put("art","data:image/jpeg;base64,"+android.util.Base64.encodeToString(art,android.util.Base64.NO_WRAP));
            return o.toString();
        } catch(Throwable t){return "{}";} finally {try{r.release();}catch(Throwable ignored){}}
    }

    @JavascriptInterface public void exit() { a.finish(); }
}
