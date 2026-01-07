import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
    // User-facing routes
    index("routes/home.tsx"),
    route("quizzes", "routes/quizzes.tsx"),
    route("quizzes/:id", "routes/quizzes.$id.tsx"),
    route("results/:id", "routes/results.$id.tsx"),
    route("progress", "routes/progress.tsx"),

    // Admin routes (nested under admin layout)
    layout("routes/admin.tsx", [
        route("admin/quizzes", "routes/admin.quizzes.tsx"),
        route("admin/quizzes/new", "routes/admin.quizzes.new.tsx"),
        route("admin/quizzes/:id/edit", "routes/admin.quizzes.$id.edit.tsx"),
    ]),
] satisfies RouteConfig;

