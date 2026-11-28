package `in`.ascensions.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews

class QuestHudWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateSingleWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        const val PREFS_NAME = "ascension_widget_hud"
        const val EXTRA_LAUNCH_ROUTE = "launch_route"

        fun updateAllWidgets(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val component = ComponentName(context, QuestHudWidgetProvider::class.java)
            val ids = manager.getAppWidgetIds(component)
            for (id in ids) {
                updateSingleWidget(context, manager, id)
            }
        }

        private fun updateSingleWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val tier = prefs.getString("tier", "D") ?: "D"
            val completed = prefs.getInt("completedCount", 0)
            val total = prefs.getInt("totalCount", 4)
            val streak = prefs.getInt("streak", 0)
            val anchorTitle = prefs.getString(
                "anchorTitle",
                "Initialize your 30-day mandate. The System awaits."
            ) ?: "Initialize your 30-day mandate. The System awaits."
            val inPenalty = prefs.getBoolean("inPenaltyZone", false)
            val statusText = if (inPenalty) {
                "PENALTY ZONE ACTIVE - ESCAPE BEFORE 23:59"
            } else {
                prefs.getString("statusLine", "PENALTY COUNTDOWN: 23:59") ?: "PENALTY COUNTDOWN: 23:59"
            }

            // Boss Raid metadata
            val bossName = prefs.getString("bossName", "WEEKLY BOSS: COMMANDER IGRIS") ?: "WEEKLY BOSS: COMMANDER IGRIS"
            val bossHpPercent = prefs.getInt("bossHpPercent", 100)
            val bossDefeated = prefs.getBoolean("bossDefeated", false)

            val views = RemoteViews(context.packageName, R.layout.quest_hud_widget)
            views.setInt(
                R.id.widget_root,
                "setBackgroundResource",
                if (inPenalty) R.drawable.widget_hud_penalty_bg else R.drawable.widget_hud_bg
            )
            views.setTextViewText(R.id.widget_rank_badge, "[ RANK $tier ]")
            views.setTextViewText(R.id.widget_quest_count, "QUESTS: $completed/$total")
            views.setTextViewText(R.id.widget_streak, "${streak}D STREAK")
            
            // Boss HP Binding
            views.setTextViewText(
                R.id.widget_boss_name,
                if (bossDefeated) "[ BOSS DEFEATED ]" else bossName.uppercase()
            )
            views.setTextViewText(
                R.id.widget_boss_hp_text,
                if (bossDefeated) "SLAIN" else "$bossHpPercent% HP"
            )
            views.setProgressBar(R.id.widget_boss_progress, 100, if (bossDefeated) 0 else bossHpPercent, false)

            views.setTextViewText(
                R.id.widget_anchor_label,
                if (inPenalty) "SYSTEM SURVIVAL ALERT" else "SYSTEM DIRECTIVE // MANDATE"
            )
            views.setTextViewText(R.id.widget_anchor_title, anchorTitle)
            views.setTextViewText(R.id.widget_status_line, statusText)

            views.setOnClickPendingIntent(
                R.id.widget_root,
                buildLaunchIntent(context, "quests", 101)
            )
            views.setOnClickPendingIntent(
                R.id.widget_focus_btn,
                buildLaunchIntent(context, "focus", 102)
            )

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun buildLaunchIntent(
            context: Context,
            route: String,
            requestCode: Int
        ): PendingIntent {
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra(EXTRA_LAUNCH_ROUTE, route)
            }
            return PendingIntent.getActivity(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }
    }
}
