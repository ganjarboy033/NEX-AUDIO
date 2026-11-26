package nx;

import android.app.Service;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

/** Kontrol mini mengambang sederhana; aktif hanya setelah izin overlay diberikan pengguna. */
public class OverlayService extends Service {
    private WindowManager wm; private View chip; private WindowManager.LayoutParams lp;
    @Override public void onCreate(){super.onCreate();
        if(Build.VERSION.SDK_INT>=23&&!android.provider.Settings.canDrawOverlays(this)){stopSelf();return;}
        wm=(WindowManager)getSystemService(WINDOW_SERVICE);
        TextView v=new TextView(this);v.setText("  ▶  NEXORA  ×  ");v.setTextColor(Color.WHITE);v.setTextSize(13);v.setPadding(12,12,12,12);v.setBackgroundColor(0xEE20263A);
        v.setOnClickListener(x->send(NativePlayerService.TOGGLE));v.setOnLongClickListener(x->{send(NativePlayerService.STOP);stopSelf();return true;});
        v.setOnTouchListener(new View.OnTouchListener(){int sx,sy,ox,oy;public boolean onTouch(View view,MotionEvent e){if(e.getAction()==0){sx=(int)e.getRawX();sy=(int)e.getRawY();ox=lp.x;oy=lp.y;return false;}if(e.getAction()==2){lp.x=ox+(int)e.getRawX()-sx;lp.y=oy+(int)e.getRawY()-sy;try{wm.updateViewLayout(chip,lp);}catch(Exception ignored){}return true;}return false;}});
        int type=Build.VERSION.SDK_INT>=26?WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY:WindowManager.LayoutParams.TYPE_PHONE;
        lp=new WindowManager.LayoutParams(WindowManager.LayoutParams.WRAP_CONTENT,WindowManager.LayoutParams.WRAP_CONTENT,type,WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,PixelFormat.TRANSLUCENT);
        lp.gravity=Gravity.TOP|Gravity.END;lp.x=18;lp.y=180;chip=v;try{wm.addView(chip,lp);}catch(Exception e){stopSelf();}
    }
    private void send(String a){try{Intent i=new Intent(this,NativePlayerService.class).setAction(a);if(Build.VERSION.SDK_INT>=26)startForegroundService(i);else startService(i);}catch(Exception ignored){}}
    @Override public int onStartCommand(Intent i,int f,int id){return START_NOT_STICKY;}
    @Override public void onDestroy(){if(wm!=null&&chip!=null)try{wm.removeView(chip);}catch(Exception ignored){}super.onDestroy();}
    @Override public IBinder onBind(Intent i){return null;}
}
