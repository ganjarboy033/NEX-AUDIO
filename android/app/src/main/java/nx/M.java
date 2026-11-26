package nx;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

/** Activity tunggal: WebView yang memuat assets/index.html + jembatan native "NX". */
public class M extends Activity {
    WebView w;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        requestWindowFeature(1);                       // tanpa title bar
        getWindow().setStatusBarColor(0xFF0C1020);
        getWindow().setNavigationBarColor(0xFF0C1020);
        requestMediaPermissions();
        w = new WebView(this);
        WebSettings s = w.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        w.setBackgroundColor(0xFF0C1020);
        w.addJavascriptInterface(new B(this), "NX");
        setContentView(w);
        Intent i = getIntent();
        String u = "file:///android_asset/index.html";
        if ("android.intent.action.SEND".equals(i.getAction())) {
            String t = i.getStringExtra("android.intent.extra.TEXT");
            if (t != null) u = u + "?s=" + Uri.encode(t);
        }
        w.loadUrl(u);
    }

    private void requestMediaPermissions() {
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            String[] p = {"android.permission.READ_MEDIA_AUDIO", "android.permission.READ_MEDIA_VIDEO", "android.permission.READ_MEDIA_IMAGES", "android.permission.POST_NOTIFICATIONS"};
            boolean need=false; for(String x:p) if(checkSelfPermission(x)!=android.content.pm.PackageManager.PERMISSION_GRANTED) need=true;
            if(need) requestPermissions(p,41);
        } else if (android.os.Build.VERSION.SDK_INT >= 23 && checkSelfPermission("android.permission.READ_EXTERNAL_STORAGE")!=android.content.pm.PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{"android.permission.READ_EXTERNAL_STORAGE"},41);
        }
    }

    @Override public void onPictureInPictureModeChanged(boolean inPip, android.content.res.Configuration c) { super.onPictureInPictureModeChanged(inPip,c); if(w!=null)w.evaluateJavascript("document.body.classList.toggle('pip-mode',"+inPip+")",null); }

    @Override protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        String t = i.getStringExtra("android.intent.extra.TEXT");
        if (t != null) w.evaluateJavascript("window.__share&&__share(decodeURIComponent(\"" + Uri.encode(t) + "\"))", null);
    }

    @Override public void onBackPressed() {
        if (w.getUrl() == null) { super.onBackPressed(); return; }
        w.evaluateJavascript("window.__back&&__back()", null);
    }
}
