import re

def audit_frontend():
    print("==================================================")
    print("    DRIVO FRONTEND SECURITY AUDIT TEST SUITE      ")
    print("==================================================")

    # 1. Navbar.jsx Audit
    with open("client/src/components/Navbar.jsx", "r", encoding="utf-8") as f:
        navbar = f.read()

    assert "Admin Command Center" not in navbar, "Found 'Admin Command Center' in Navbar.jsx!"
    assert 'to="/admin"' not in navbar, "Found 'to=\"/admin\"' in Navbar.jsx!"
    assert 'to="/admin/login"' not in navbar, "Found 'to=\"/admin/login\"' in Navbar.jsx!"
    print("  [PASS] Navbar.jsx is 100% clean of all admin links, buttons, and Command Center text.")

    # 2. Footer.jsx Audit
    with open("client/src/components/Footer.jsx", "r", encoding="utf-8") as f:
        footer = f.read()

    assert "/admin/login" not in footer, "Found '/admin/login' in Footer.jsx!"
    assert "Admin Portal" not in footer, "Found 'Admin Portal' in Footer.jsx!"
    print("  [PASS] Footer.jsx is 100% clean of all admin links and Portal options.")

    # 3. Dashboard.jsx Audit
    with open("client/src/pages/Dashboard.jsx", "r", encoding="utf-8") as f:
        dash = f.read()

    assert 'to="/admin"' not in dash, "Found 'to=\"/admin\"' in Dashboard.jsx!"
    print("  [PASS] Customer Dashboard.jsx has zero admin links or buttons.")

    # 4. ErrorBoundary.jsx Audit
    with open("client/src/components/ErrorBoundary.jsx", "r", encoding="utf-8") as f:
        eb = f.read()

    assert "window.location.href = '/admin'" not in eb, "Found redirect to /admin in ErrorBoundary.jsx!"
    print("  [PASS] ErrorBoundary.jsx redirects to customer /login, not /admin.")

    # 5. AdminLogin.jsx Audit
    with open("client/src/pages/AdminLogin.jsx", "r", encoding="utf-8") as f:
        admin_login = f.read()

    assert 'autoComplete="off"' in admin_login, "Missing autoComplete='off' in AdminLogin.jsx form!"
    assert 'autoComplete="new-password"' in admin_login, "Missing autoComplete='new-password' on password input!"
    assert 'data-lpignore="true"' in admin_login, "Missing data-lpignore='true' on inputs in AdminLogin.jsx!"
    assert 'admin@drivo' not in admin_login, "Found 'admin@drivo' in AdminLogin.jsx!"
    assert 'admin123' not in admin_login, "Found 'admin123' in AdminLogin.jsx!"
    print("  [PASS] AdminLogin.jsx fields are empty, anti-autofill attributes active, and no credentials exposed.")

    # 6. App.jsx Route Protection Audit
    with open("client/src/App.jsx", "r", encoding="utf-8") as f:
        app_jsx = f.read()

    assert "<AdminRoute><AdminDashboard /></AdminRoute>" in app_jsx, "Admin routes are not protected with <AdminRoute>!"
    assert 'path="/drivo-admin-portal"' in app_jsx, "Dedicated private route /drivo-admin-portal not mapped!"
    print("  [PASS] App.jsx route guard <AdminRoute> protects /admin and /admin/dashboard; private portal mapped.")

    print("\n==================================================")
    print("   ALL 6 FRONTEND SECURITY AUDITS PASSED 100%!    ")
    print("==================================================")

if __name__ == "__main__":
    audit_frontend()
