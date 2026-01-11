import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    // User-facing routes
    index("routes/home.tsx"),
    route("quizzes", "routes/quizzes.tsx"),
    route("quizzes/:id", "routes/quizzes.$id.tsx"),
    route("results/:id", "routes/results.$id.tsx"),
    route("progress", "routes/progress.tsx"),
    route("progress/:quizId", "routes/progress.$quizId.tsx"),

    // Auth routes
    route("auth/login", "routes/auth.login.tsx"),
    route("auth/register", "routes/auth.register.tsx"),
    route("auth/logout", "routes/auth.logout.tsx"),

    // Admin routes (nested under admin layout)
    layout("routes/admin.tsx", [
        route("admin/quizzes", "routes/admin.quizzes.tsx"),
        route("admin/quizzes/new", "routes/admin.quizzes.new.tsx"),
        route("admin/quizzes/:id/edit", "routes/admin.quizzes.$id.edit.tsx"),
    ]),
] satisfies RouteConfig;

