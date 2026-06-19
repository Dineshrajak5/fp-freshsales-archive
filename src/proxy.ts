const isPublic =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname === "/offline.html" ||
    /\.(?:png|svg|ico|webmanifest|js)$/.test(request.nextUrl.pathname);