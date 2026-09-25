from app.schemas.ticket import Category


RULES: tuple[tuple[Category, tuple[str, ...]], ...] = (
    (Category.authentication, ("login", "log in", "sign in", "sign-in", "password", "authentication", "mfa", "sso", "locked out")),
    (Category.database, ("database", "db connection", "sql", "query timeout", "connection timeout", "deadlock", "postgres", "mysql")),
    (Category.application_error, ("500 internal", "internal server error", "exception", "stack trace", "crash", "error 500", "uncaught")),
    (Category.performance, ("slow", "latency", "performance", "lag", "timeout", "takes too long", "high cpu")),
    (Category.access_permission, ("permission denied", "forbidden", "access denied", "unauthorized", "access / permission", "role", "privilege")),
    (Category.network, ("network", "connectivity", "dns", "packet loss", "unreachable", "vpn", "cannot connect")),
    (Category.configuration, ("configuration", "config", "environment variable", "setting", "misconfigured")),
    (Category.hardware, ("hardware", "laptop", "workstation", "printer", "device", "monitor")),
    (Category.documentation, ("documentation", "guide", "runbook", "how do i", "instructions")),
)


def categorize_text(title: str, description: str) -> tuple[Category, str]:
    text = f"{title} {description}".casefold()
    for category, keywords in RULES:
        matched = next((keyword for keyword in keywords if keyword in text), None)
        if matched:
            return category, matched
    return Category.other, "no keyword rule matched"
