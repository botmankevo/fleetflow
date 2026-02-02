"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Contributor = {
    name: string;
    email: string;
    avatar: string;
    role: string;
};

type Project = {
    id: string;
    title: string;
    repo: string;
    status: "Active" | "Inactive" | "In Progress";
    team: string;
    tech: string;
    createdAt: string;
    contributors: Contributor[];
};

const data: Project[] = [
    {
        id: "1",
        title: "ShadCN Clone",
        repo: "https://github.com/ruixenui/ruixen-buttons",
        status: "Active",
        team: "UI Guild",
        tech: "Next.js",
        createdAt: "2024-06-01",
        contributors: [
            {
                name: "Srinath G",
                email: "srinath@example.com",
                avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop",
                role: "UI Lead",
            },
            {
                name: "Kavya M",
                email: "kavya@example.com",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
                role: "Designer",
            },
        ],
    },
    {
        id: "2",
        title: "RUIXEN Components",
        repo: "https://github.com/ruixenui/ruixen-buttons",
        status: "In Progress",
        team: "Component Devs",
        tech: "React",
        createdAt: "2024-05-22",
        contributors: [
            {
                name: "Arjun R",
                email: "arjun@example.com",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
                role: "Developer",
            },
            {
                name: "Divya S",
                email: "divya@example.com",
                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
                role: "QA",
            },
        ],
    },
    {
        id: "3",
        title: "CV Jobs Platform",
        repo: "https://github.com/ruixenui/ruixen-buttons",
        status: "Active",
        team: "CV Core",
        tech: "Spring Boot",
        createdAt: "2024-06-05",
        contributors: [
            {
                name: "Manoj T",
                email: "manoj@example.com",
                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
                role: "Backend Lead",
            },
        ],
    },
];

const allColumns = [
    "Project",
    "Repository",
    "Team",
    "Tech",
    "Created At",
    "Contributors",
    "Status",
] as const;

export function ContributorsTable() {
    const [visibleColumns, setVisibleColumns] = useState<string[]>([...allColumns]);
    const [statusFilter, setStatusFilter] = useState("");
    const [techFilter, setTechFilter] = useState("");

    const filteredData = data.filter((project) => {
        return (
            (!statusFilter || project.status === statusFilter) &&
            (!techFilter || project.tech.toLowerCase().includes(techFilter.toLowerCase()))
        );
    });

    const toggleColumn = (col: string) => {
        setVisibleColumns((prev) =>
            prev.includes(col)
                ? prev.filter((c) => c !== col)
                : [...prev, col]
        );
    };

    return (
        <div className="space-y-4 p-6 glass-card border border-glass-border">
            <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
                <div className="flex gap-2 flex-wrap">
                    <Input
                        placeholder="Search technology..."
                        value={techFilter}
                        onChange={(e) => setTechFilter(e.target.value)}
                        className="w-48 bg-white/50"
                    />
                    <Input
                        placeholder="Filter status..."
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-48 bg-white/50"
                    />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-xl">
                            Columns
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                        {allColumns.map((col) => (
                            <DropdownMenuCheckboxItem
                                key={col}
                                checked={visibleColumns.includes(col)}
                                onCheckedChange={() => toggleColumn(col)}
                            >
                                {col}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Table className="w-full">
                <TableHeader>
                    <TableRow>
                        {visibleColumns.includes("Project") && <TableHead>Project</TableHead>}
                        {visibleColumns.includes("Repository") && <TableHead>Repository</TableHead>}
                        {visibleColumns.includes("Team") && <TableHead>Team</TableHead>}
                        {visibleColumns.includes("Tech") && <TableHead>Tech</TableHead>}
                        {visibleColumns.includes("Created At") && <TableHead>Created At</TableHead>}
                        {visibleColumns.includes("Contributors") && <TableHead>Contributors</TableHead>}
                        {visibleColumns.includes("Status") && <TableHead>Status</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData.length ? (
                        filteredData.map((project) => (
                            <TableRow key={project.id}>
                                {visibleColumns.includes("Project") && (
                                    <TableCell className="font-bold text-slate-900">{project.title}</TableCell>
                                )}
                                {visibleColumns.includes("Repository") && (
                                    <TableCell>
                                        <a
                                            href={project.repo}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline font-medium"
                                        >
                                            {project.repo.replace("https://github.com/", "")}
                                        </a>
                                    </TableCell>
                                )}
                                {visibleColumns.includes("Team") && <TableCell>{project.team}</TableCell>}
                                {visibleColumns.includes("Tech") && (
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none">
                                            {project.tech}
                                        </Badge>
                                    </TableCell>
                                )}
                                {visibleColumns.includes("Created At") && <TableCell className="text-slate-500 font-mono text-xs">{project.createdAt}</TableCell>}
                                {visibleColumns.includes("Contributors") && (
                                    <TableCell>
                                        <div className="flex -space-x-3">
                                            <TooltipProvider>
                                                {project.contributors.map((contributor, idx) => (
                                                    <Tooltip key={idx}>
                                                        <TooltipTrigger asChild>
                                                            <Avatar className="h-8 w-8 ring-2 ring-white hover:z-10 shadow-sm transition-transform hover:-translate-y-1">
                                                                <AvatarImage src={contributor.avatar} alt={contributor.name} />
                                                                <AvatarFallback>{contributor.name[0]}</AvatarFallback>
                                                            </Avatar>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <div className="p-1">
                                                                <p className="font-bold">{contributor.name}</p>
                                                                <p className="text-xs text-muted-foreground">{contributor.role}</p>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ))}
                                            </TooltipProvider>
                                        </div>
                                    </TableCell>
                                )}
                                {visibleColumns.includes("Status") && (
                                    <TableCell>
                                        <Badge
                                            className={cn(
                                                "rounded-lg px-2",
                                                project.status === "Active" && "bg-emerald-100 text-emerald-700 border-emerald-200",
                                                project.status === "Inactive" && "bg-slate-100 text-slate-600 border-slate-200",
                                                project.status === "In Progress" && "bg-amber-100 text-amber-700 border-amber-200",
                                            )}
                                        >
                                            {project.status}
                                        </Badge>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={allColumns.length} className="text-center py-12 text-slate-400 font-medium">
                                No contributors data found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

export default ContributorsTable;
