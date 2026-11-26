package nx;

import android.app.*;
import android.content.*;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.audiofx.Equalizer;
import android.media.audiofx.BassBoost;
import android.media.audiofx.Virtualizer;
import android.media.audiofx.Visualizer;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;
import android.graphics.PixelFormat;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.TextView;
import android.graphics.Color;
import android.graphics.Typeface;

/** Pemutar native ringan berbasis API Android; tanpa dependensi player eksternal. */
public class NativePlayerService extends Service {
    public static final String PLAY="nx.play", PAUSE="nx.pause", STOP="nx.stop", TOGGLE="nx.toggle";
    private static final String CHANNEL="nx_playback";
    private MediaPlayer player;
    private MediaSession session;
    private String title="Nexora";
    private AudioManager audio;
    private AudioManager.OnAudioFocusChangeListener focusListener;
    private Equalizer eq; private BassBoost bass; private Virtualizer virt; private Visualizer visualizer;
    private static NativePlayerService instance;

    @Override public void onCreate(){ super.onCreate(); instance=this; createChannel();
        session=new MediaSession(this,"Nexora");
        session.setCallback(new MediaSession.Callback(){
            @Override public void onPlay(){ if(player!=null){ player.start(); updateState(); showNote(); } }
            @Override public void onPause(){ pausePlayer(); }
            @Override public void onStop(){ stopSelf(); }
        });
        session.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS|MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
        session.setActive(true);
        audio=(AudioManager)getSystemService(AUDIO_SERVICE);
        focusListener=change->{ if(change==AudioManager.AUDIOFOCUS_LOSS||change==AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) pausePlayer(); else if(change==AudioManager.AUDIOFOCUS_GAIN&&player!=null&&!player.isPlaying()){try{player.start();updateState();showNote();}catch(Exception ignored){}} };
    }
    @Override public int onStartCommand(Intent i,int flags,int id){
        if(i==null)return START_NOT_STICKY;
        String a=i.getAction();
        if(PLAY.equals(a)) startTrack(i.getStringExtra("url"),i.getStringExtra("title"));
        else if(PAUSE.equals(a)) pausePlayer();
        else if(TOGGLE.equals(a)){ if(player!=null&&player.isPlaying())pausePlayer(); else if(player!=null){player.start();updateState();showNote();} }
        else if(STOP.equals(a)){ stopPlayback(); stopSelf(); }
        return START_NOT_STICKY;
    }
    private void startTrack(String url,String name){
        if(url==null||!(url.startsWith("https://")||url.startsWith("http://")||url.startsWith("content://")||url.startsWith("file://"))) { stopSelf(); return; }
        title=(name==null||name.length()==0)?"Nexora":name;
        try{
            stopPlayback();
            if(audio!=null) audio.requestAudioFocus(focusListener,AudioManager.STREAM_MUSIC,AudioManager.AUDIOFOCUS_GAIN);
            player=new MediaPlayer();
            player.setAudioStreamType(AudioManager.STREAM_MUSIC);
            if(url.startsWith("content://")||url.startsWith("file://")) player.setDataSource(this,Uri.parse(url)); else player.setDataSource(url);
            player.setOnPreparedListener(mp->{ attachEffects(mp.getAudioSessionId()); mp.start(); updateState(); showNote(); });
            player.setOnCompletionListener(mp->{ updateState(); stopSelf(); });
            player.setOnErrorListener((mp,what,extra)->{ stopSelf(); return true; });
            player.prepareAsync();
            showNote();
        }catch(Exception e){ stopSelf(); }
    }
    private void pausePlayer(){ try{if(player!=null&&player.isPlaying())player.pause();}catch(Exception ignored){} updateState();showNote(); }
    private void releaseEffects(){ try{if(visualizer!=null)visualizer.release();}catch(Exception ignored){} visualizer=null; try{if(eq!=null)eq.release();}catch(Exception ignored){} eq=null; try{if(bass!=null)bass.release();}catch(Exception ignored){} bass=null; try{if(virt!=null)virt.release();}catch(Exception ignored){} virt=null; }
    private void attachEffects(int sessionId){ releaseEffects(); try{eq=new Equalizer(0,sessionId);eq.setEnabled(true);}catch(Exception ignored){} try{bass=new BassBoost(0,sessionId);bass.setEnabled(true);}catch(Exception ignored){} try{virt=new Virtualizer(0,sessionId);virt.setEnabled(true);}catch(Exception ignored){} }
    private volatile byte[] spectrum=new byte[0];
    public static boolean enableVisualizer(){NativePlayerService x=instance;if(x==null||x.player==null)return false;try{if(x.visualizer!=null)return true;x.visualizer=new Visualizer(x.player.getAudioSessionId());x.visualizer.setCaptureSize(Visualizer.getCaptureSizeRange()[1]);x.visualizer.setDataCaptureListener(new Visualizer.OnDataCaptureListener(){public void onWaveFormDataCapture(Visualizer v,byte[] d,int r){} public void onFftDataCapture(Visualizer v,byte[] d,int r){x.spectrum=d;}},Visualizer.getMaxCaptureRate()/2,false,true);x.visualizer.setEnabled(true);return true;}catch(Throwable t){x.visualizer=null;return false;}}
    public static void setEffects(int e,int b,int v,float pan){ NativePlayerService x=instance;if(x==null)return;try{if(x.eq!=null){short[] range=x.eq.getBandLevelRange();short level=(short)(range[0]+(range[1]-range[0])*Math.max(0,Math.min(100,e))/100);for(short band=0;band<x.eq.getNumberOfBands();band++)x.eq.setBandLevel(band,level);}}catch(Exception ignored){}try{if(x.bass!=null)x.bass.setStrength((short)Math.max(0,Math.min(1000,b*10)));}catch(Exception ignored){}try{if(x.virt!=null)x.virt.setStrength((short)Math.max(0,Math.min(1000,v*10)));}catch(Exception ignored){}try{if(x.player!=null){float p=Math.max(-1,Math.min(1,pan));x.player.setVolume(p>0?1-p:1,p<0?1+p:1);}}catch(Exception ignored){} }
    public static String getSpectrum(){NativePlayerService x=instance;if(x==null||x.spectrum==null)return "[]";org.json.JSONArray a=new org.json.JSONArray();byte[] d=x.spectrum;for(int i=2;i<Math.min(d.length,66);i+=2)a.put(Math.max(0,d[i]&255));return a.toString();}
    private void stopPlayback(){ releaseEffects(); try{if(player!=null){player.reset();player.release();}}catch(Exception ignored){} player=null; if(audio!=null&&focusListener!=null)try{audio.abandonAudioFocus(focusListener);}catch(Exception ignored){} }
    private void updateState(){
        if(session==null)return;
        int state=player!=null&&player.isPlaying()?PlaybackState.STATE_PLAYING:PlaybackState.STATE_PAUSED;
        long actions=PlaybackState.ACTION_PLAY|PlaybackState.ACTION_PAUSE|PlaybackState.ACTION_PLAY_PAUSE|PlaybackState.ACTION_STOP;
        session.setPlaybackState(new PlaybackState.Builder().setActions(actions).setState(state,player==null?0:player.getCurrentPosition(),1f).build());
        session.setMetadata(new android.media.MediaMetadata.Builder().putString(android.media.MediaMetadata.METADATA_KEY_TITLE,title).putString(android.media.MediaMetadata.METADATA_KEY_ARTIST,"Nexora").build());
    }
    private PendingIntent command(String action){ Intent i=new Intent(this,NativePlayerService.class).setAction(action); return PendingIntent.getService(this,action.hashCode(),i,PendingIntent.FLAG_UPDATE_CURRENT|(Build.VERSION.SDK_INT>=23?PendingIntent.FLAG_IMMUTABLE:0)); }
    private void createChannel(){ if(Build.VERSION.SDK_INT>=26){NotificationChannel c=new NotificationChannel(CHANNEL,"Pemutar",NotificationManager.IMPORTANCE_LOW);c.setDescription("Kontrol pemutaran media");((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(c);} }
    private void showNote(){
        updateState();
        Notification.Builder b=Build.VERSION.SDK_INT>=26?new Notification.Builder(this,CHANNEL):new Notification.Builder(this);
        b.setSmallIcon(android.R.drawable.ic_media_play).setContentTitle(title).setContentText(player!=null&&player.isPlaying()?"Diputar · Nexora":"Dijeda · Nexora").setOngoing(player!=null&&player.isPlaying()).setOnlyAlertOnce(true)
          .addAction(android.R.drawable.ic_media_pause,"Jeda",command(PAUSE)).addAction(android.R.drawable.ic_media_play,"Putar",command(TOGGLE)).addAction(android.R.drawable.ic_menu_close_clear_cancel,"Tutup",command(STOP));
        if(Build.VERSION.SDK_INT>=21)b.setStyle(new Notification.MediaStyle().setMediaSession(session.getSessionToken()).setShowActionsInCompactView(0,1));
        startForeground(21,b.build());
    }
    @Override public void onDestroy(){ if(instance==this)instance=null; stopPlayback(); if(session!=null){session.setActive(false);session.release();} stopForeground(true);super.onDestroy(); }
    @Override public IBinder onBind(Intent i){return null;}
}
