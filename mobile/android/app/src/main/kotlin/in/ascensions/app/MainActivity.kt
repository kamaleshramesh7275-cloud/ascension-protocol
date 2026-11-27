package `in`.ascensions.app

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val channelName = "in.ascensions.app/widget"
    private var methodChannel: MethodChannel? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        methodChannel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, channelName)
        methodChannel?.setMethodCallHandler { call, result ->
            when (call.method) {
                "updateWidgetHud" -> {
                    val args = call.arguments as? Map<*, *>
                    if (args != null) {
                        val prefs = applicationContext.getSharedPreferences(
                            QuestHudWidgetProvider.PREFS_NAME,
                            Context.MODE_PRIVATE
                        )
                        prefs.edit().apply {
                            putString("tier", args["tier"]?.toString() ?: "D")
                            putInt("completedCount", (args["completedCount"] as? Number)?.toInt() ?: 0)
                            putInt("totalCount", (args["totalCount"] as? Number)?.toInt() ?: 3)
                            putInt("streak", (args["streak"] as? Number)?.toInt() ?: 0)
                            putString(
                                "anchorTitle",
                                args["anchorTitle"]?.toString() ?: "Tap to inspect daily directives"
                            )
                            putBoolean("inPenaltyZone", args["inPenaltyZone"] as? Boolean ?: false)
                            putString("statusLine", args["statusLine"]?.toString() ?: "RESETS AT 00:00")
                            apply()
                        }
                        QuestHudWidgetProvider.updateAllWidgets(applicationContext)
                    }
                    result.success(true)
                }

                "requestPinWidget" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        val manager = getSystemService(AppWidgetManager::class.java)
                        val provider = ComponentName(this, QuestHudWidgetProvider::class.java)
                        if (manager != null && manager.isRequestPinAppWidgetSupported) {
                            val requested = manager.requestPinAppWidget(provider, null, null)
                            result.success(requested)
                        } else {
                            result.success(false)
                        }
                    } else {
                        result.success(false)
                    }
                }

                "consumeLaunchRoute" -> {
                    val route = intent?.getStringExtra(QuestHudWidgetProvider.EXTRA_LAUNCH_ROUTE)
                    intent?.removeExtra(QuestHudWidgetProvider.EXTRA_LAUNCH_ROUTE)
                    result.success(route)
                }

                else -> result.notImplemented()
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val route = intent.getStringExtra(QuestHudWidgetProvider.EXTRA_LAUNCH_ROUTE)
        if (!route.isNullOrEmpty()) {
            intent.removeExtra(QuestHudWidgetProvider.EXTRA_LAUNCH_ROUTE)
            methodChannel?.invokeMethod("onWidgetDeepLink", route)
        }
    }
}
