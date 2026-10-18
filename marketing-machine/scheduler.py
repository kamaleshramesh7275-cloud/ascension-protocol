"""
24/7 Autonomous Background Scheduler for Secondary Laptop
Runs lightweight cron triggers in the background using APScheduler (<80MB RAM).
"""
import time
import sys
from datetime import datetime
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

from main_pipeline import run_marketing_cycle
from telegram_notifier import send_telegram_alert

def morning_job():
    print(f"\n[Scheduler] Triggering 07:30 AM Morning Discipline Drop...")
    run_marketing_cycle("Morning dopamine detox & waking up with iron discipline")

def midday_job():
    print(f"\n[Scheduler] Triggering 01:30 PM Mid-Day Focus Drop...")
    run_marketing_cycle("Air-Gap deep work chamber protocol for college exams and coding")

def evening_job():
    print(f"\n[Scheduler] Triggering 07:30 PM Night Accountability Drop...")
    run_marketing_cycle("Solo Leveling hunter ranking: accountability court before sleep")

def start_daemon():
    scheduler = BlockingScheduler()

    # Schedule 3 daily drops (7:30 AM, 1:30 PM, 7:30 PM)
    scheduler.add_job(morning_job, CronTrigger(hour=7, minute=30))
    scheduler.add_job(midday_job, CronTrigger(hour=13, minute=30))
    scheduler.add_job(evening_job, CronTrigger(hour=19, minute=30))

    boot_msg = (
        "🤖 *Ascension Marketing Node Online*\n"
        "Node status: 24/7 Daemon Active on secondary laptop.\n"
        "Daily drops scheduled at:\n"
        "• 07:30 AM IST (Morning Protocol)\n"
        "• 01:30 PM IST (Mid-Day Focus)\n"
        "• 07:30 PM IST (Night Accountability)"
    )
    print("=" * 60)
    print("🤖 ASCENSION MARKETING MACHINE DAEMON RUNNING")
    print("Scheduled Drops: 07:30 AM | 01:30 PM | 07:30 PM IST")
    print("Press Ctrl+C to terminate.")
    print("=" * 60)
    
    send_telegram_alert(boot_msg)

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("\n[Scheduler] Daemon terminated safely.")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--now":
        print("[Scheduler] Immediate test execution requested (--now)...")
        run_marketing_cycle()
    else:
        start_daemon()
