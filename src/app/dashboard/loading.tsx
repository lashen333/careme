import { Card, CardContent } from "@/components/ui/card"

export default function DashboardLoading() {
    return (
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-8 animate-pulse">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="h-8 w-48 bg-slate-200 rounded"></div>
                    <div className="mt-2 h-4 w-64 bg-slate-200 rounded"></div>
                </div>
                <div className="h-10 w-28 bg-slate-200 rounded"></div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-slate-200"></div>
                                <div className="space-y-2">
                                    <div className="h-4 w-24 bg-slate-200 rounded"></div>
                                    <div className="h-6 w-16 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-12 space-y-4">
                <div className="h-6 w-32 bg-slate-200 rounded mb-6"></div>
                {[1, 2].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-6 h-32 bg-slate-50"></CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
