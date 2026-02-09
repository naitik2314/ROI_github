
import { auth } from "@/auth"

export default auth((req) => {
    // straightforward logic: if not authenticated and trying to access protected route, redirect to login
    // For now, we might want to keep the landing page public.
    // The 'authorized' callback in auth.ts handles the logic.
    // If we return specific responses here, we can override.
})

// Optionally, don't invoke Middleware on some paths
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|.*\\.svg).*)"],
}
