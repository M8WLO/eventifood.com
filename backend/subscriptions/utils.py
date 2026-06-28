def has_feature(tenant, feature_key):
    """Return True if tenant's current plan includes the given feature key."""
    if tenant is None:
        return False
    try:
        tp = tenant.tenant_plan
    except Exception:
        return False
    if tp.plan is None:
        return False
    return feature_key in (tp.plan.feature_flags or [])
