from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.ticket import DocumentationGuide, Ticket


GUIDES = [
    {
        "id": "login-authentication",
        "title": "Login & Authentication Issues",
        "category": "Authentication",
        "symptoms": "Users cannot sign in, receive invalid credentials errors, or are repeatedly redirected to the login screen.",
        "possible_causes": "Expired SSO or signing certificate; identity-provider outage; clock skew; account lockout; stale session cookies.",
        "troubleshooting_steps": "1. Confirm whether the issue affects one user or all users.\n2. Check identity-provider and authentication-service health.\n3. Review authentication logs for the affected user and timestamp.\n4. Verify certificate expiry, callback URL, and system clock.\n5. Test with a fresh private browser session.",
        "resolution": "Renew or correct the authentication configuration, unlock affected accounts when appropriate, and verify a successful sign-in with the reporter.",
    },
    {
        "id": "database-connections",
        "title": "Database Connection Issues",
        "category": "Database",
        "symptoms": "Application requests fail with connection timeouts, database unavailable errors, or slow queries.",
        "possible_causes": "Database service interruption; exhausted connection pool; network or DNS issue; invalid credentials; long-running query or lock.",
        "troubleshooting_steps": "1. Check database service health and recent restarts.\n2. Confirm host, port, DNS resolution, and network reachability.\n3. Review connection-pool saturation and database connection limits.\n4. Inspect slow-query and lock logs around the reported time.\n5. Validate credentials through the approved secret configuration.",
        "resolution": "Restore connectivity or service health, release stale connections or resolve the blocking query, and verify a representative application transaction.",
    },
    {
        "id": "application-errors",
        "title": "Application Errors",
        "category": "Application Error",
        "symptoms": "Users encounter a 500 error, unexpected crash, blank page, or a failed workflow.",
        "possible_causes": "Unhandled application exception; recent deployment regression; missing configuration; invalid request data; downstream dependency failure.",
        "troubleshooting_steps": "1. Record the exact error, timestamp, user, and affected workflow.\n2. Correlate request or trace IDs with application logs.\n3. Check deployment history and dependency health.\n4. Reproduce with a safe test case and identify the failing component.\n5. Escalate with sanitized logs and reproduction steps if code changes are needed.",
        "resolution": "Apply the approved configuration fix or rollback/patch, confirm the affected workflow succeeds, and document the evidence and any follow-up work.",
    },
    {
        "id": "network-connectivity",
        "title": "Network Connectivity Issues",
        "category": "Network",
        "symptoms": "The application is unreachable, requests intermittently fail, or only users on a particular network are affected.",
        "possible_causes": "DNS misconfiguration; VPN or firewall rule; proxy issue; packet loss; routing or upstream service interruption.",
        "troubleshooting_steps": "1. Compare affected and unaffected users, locations, and networks.\n2. Check DNS resolution and service health.\n3. Verify VPN, proxy, firewall, and certificate status.\n4. Capture safe connectivity diagnostics and request timestamps.\n5. Check for a related network change or provider incident.",
        "resolution": "Correct the approved network or DNS setting, restore the affected route, and confirm the application is reachable from the impacted network.",
    },
    {
        "id": "performance-issues",
        "title": "Performance Issues",
        "category": "Performance",
        "symptoms": "Pages or background jobs take unusually long, time out, or slow down during peak periods.",
        "possible_causes": "Resource saturation; slow query; traffic spike; inefficient downstream request; cache miss; queue backlog.",
        "troubleshooting_steps": "1. Capture when the slowdown began and which actions are affected.\n2. Compare response times and resource metrics with a normal baseline.\n3. Identify slow traces, queries, dependency calls, or queue depth.\n4. Check recent releases and traffic changes.\n5. Apply only approved mitigations and record before/after measurements.",
        "resolution": "Address the confirmed bottleneck or restore capacity, then compare response times against the baseline and monitor for recurrence.",
    },
]


SAMPLE_TICKETS = [
    ("Users unable to sign in after SSO certificate rotation", "Several users receive a redirect loop after this morning's identity-provider certificate change. Login worked yesterday.", "Authentication", "Critical", "Investigating", "Maya Chen", "login-authentication", 0, 12),
    ("Database connection timeout on invoice search", "Invoice search intermittently returns a database connection timeout during peak usage. Other screens remain available.", "Database", "High", "Assigned", "Jordan Lee", "database-connections", 1, None),
    ("500 error when exporting monthly report", "The monthly report export returns a 500 Internal Server Error for finance users. The on-screen report still loads.", "Application Error", "High", "Open", "Unassigned", "application-errors", 1, None),
    ("Application response time elevated this afternoon", "The case overview takes 8–10 seconds to open for multiple users; normal response is under 2 seconds.", "Performance", "High", "Investigating", "Avery Patel", "performance-issues", 2, 95),
    ("Permission denied when uploading contract files", "A recently added team member cannot upload PDF contracts and sees a permission denied message.", "Access / Permission", "Medium", "Waiting for User", "Sam Rivera", None, 2, None),
    ("Intermittent access from the London office", "Users at the London office report intermittent connectivity. Mobile hotspot access works consistently.", "Network", "Medium", "Assigned", "Jordan Lee", "network-connectivity", 3, None),
    ("PDF attachment upload fails above 10 MB", "Uploading PDF attachments larger than 10 MB fails with a generic error. Smaller files upload normally.", "Application Error", "Medium", "Open", "Unassigned", "application-errors", 3, None),
    ("New staging environment missing mail relay setting", "Password reset emails do not send in staging after the environment was rebuilt. Production is unaffected.", "Configuration", "Low", "Resolved", "Maya Chen", None, 4, 68),
    ("Laptop display dock disconnects during calls", "The external display and wired network disconnect intermittently when the USB-C dock is moved.", "Hardware", "Low", "Closed", "Sam Rivera", None, 5, 180),
    ("SSO user remains locked after password reset", "The account still shows as locked in the application after the identity-provider password reset completed.", "Authentication", "Medium", "Resolved", "Maya Chen", "login-authentication", 6, 44),
    ("Slow dashboard load for operations team", "Operations dashboard takes about 6 seconds at shift start, then improves later in the day.", "Performance", "Medium", "Investigating", "Avery Patel", "performance-issues", 7, None),
    ("Unable to find current onboarding instructions", "New starters are using an outdated access guide and are unsure which request form to submit.", "Documentation", "Low", "Closed", "Sam Rivera", None, 8, 75),
    ("VPN DNS lookup fails for internal portal", "The internal portal hostname does not resolve for two users connected to VPN. Public sites are reachable.", "Network", "High", "Waiting for User", "Jordan Lee", "network-connectivity", 9, None),
    ("Duplicate rows in customer activity export", "The CSV export contains duplicate activity rows for a small set of customer records; on-screen results look correct.", "Database", "Medium", "Resolved", "Avery Patel", "database-connections", 10, 130),
    ("Application theme setting resets after sign out", "A user's saved display preference returns to the default theme after a new sign-in.", "Configuration", "Low", "Open", "Unassigned", "application-errors", 12, None),
]


def seed_database(db: Session) -> None:
    if db.scalar(select(func.count()).select_from(Ticket)):
        return

    for guide in GUIDES:
        db.add(DocumentationGuide(**guide))

    now = datetime.now(timezone.utc)
    for index, (title, description, category, priority, status, assignee, guide, age_days, resolution_minutes) in enumerate(SAMPLE_TICKETS, start=1):
        created_at = now - timedelta(days=age_days, hours=(index * 2) % 18 + 1)
        resolution_at = created_at + timedelta(minutes=resolution_minutes) if resolution_minutes else None
        db.add(Ticket(
            ticket_id=f"TKT-{index:04d}",
            title=title,
            description=description,
            category=category,
            priority=priority,
            status=status,
            assigned_to=assignee,
            created_at=created_at,
            updated_at=(resolution_at or now - timedelta(hours=index * 2)),
            investigation_notes=("Reviewed service logs and reproduced the reported behavior." if status in ("Investigating", "Resolved", "Closed") else ""),
            root_cause=("A configuration or capacity issue was isolated during investigation." if status in ("Resolved", "Closed") else ""),
            resolution=("Applied the approved corrective action and confirmed the workflow with the reporter." if resolution_at else ""),
            documentation_link=guide,
            resolution_at=resolution_at,
        ))
    db.commit()
