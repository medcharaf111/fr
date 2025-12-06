// frontend/src/pages/SecretaryDashboard.tsx
import React, { useMemo, useState, FormEvent, useEffect } from "react";
import api from "../lib/api";
import {
    BarChart as ReBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    Calendar,
    ClipboardList,
    FileText,
    Flag,
    Layers,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Plus,
    Download,
    MoreVertical,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "../components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

// --- translations & language hook (unchanged) ---
type Lang = "ar" | "en";

const translations: Record<Lang, Record<string, string>> = {
    en: {
        "lang.ar": "العربية",
        "lang.en": "English",
        "lang.toggleToAr": "العربية",
        "lang.toggleToEn": "English",

        // Page
        "page.title": "Secretary General Administrative Platform",
        "page.subtitle":
            "Central platform for the Secretary General to oversee and steer administrative workflows.",

        // Intro section (specification you provided)
        "intro.sectionTitle": "Secretary General Platform",
        "intro.goalTitle": "Goal / Objective",
        "intro.goalAr": "إنشاء منصة إدارية للكاتب العام للإشراف على سير العمل الإداري.",
        "intro.goalEn":
            "Create an administrative platform for the Secretary General to oversee administrative workflow.",
        "intro.functionsTitle": "Required Functions / الوظائف المطلوبة",
        "intro.func.decisions": "Track ministerial decisions and their implementation.",
        "intro.func.documents": "Manage document and correspondence workflow.",
        "intro.func.meetings": "Monitor ministerial meetings.",
        "intro.func.tasks": "Manage priority tasks.",
        "intro.func.reports": "Administrative operations reports.",

        // Top buttons
        "btn.newMeeting": "Schedule meeting",
        "btn.newTask": "Add priority task",
        "btn.export": "Export summary report",
        "btn.exportDetailed": "Export detailed report",

        // Tabs
        "tabs.overview": "Overview",
        "tabs.decisions": "Decisions",
        "tabs.documents": "Documents",
        "tabs.meetings": "Meetings",
        "tabs.tasks": "Priority tasks",
        "tabs.reports": "Reports",

        // Cards
        "card.decisions.title": "Ministerial decisions",
        "card.decisions.subtitle.impl": "In implementation",
        "card.decisions.subtitle.completed": "Completed",
        "card.decisions.subtitle.overdue": "Overdue",

        "card.documents.title": "Documents and correspondence",
        "card.documents.subtitle.waitingSignature": "Awaiting signature",
        "card.documents.subtitle.urgent": "Urgent",

        "card.meetings.title": "Meetings",
        "card.meetings.subtitle.pendingFollowup": "With pending follow‑up",
        "card.meetings.subtitle.completedFollowup": "Completed with follow‑up",

        "card.tasks.title": "Priority tasks",
        "card.tasks.subtitle.high": "High priority",
        "card.tasks.subtitle.completed": "Completed",
        "card.tasks.subtitle.overdue": "Overdue",

        // Overview
        "overview.title": "Snapshot of administrative workflow",
        "overview.subtitle":
            "Today’s consolidated view of decisions, documents, meetings, and priority tasks.",
        "overview.chart.tasksByStatus": "Tasks by status",
        "overview.focus.overdueTitle": "Focus on overdue items",
        "overview.focus.overdueText":
            "You currently have {decOverdue} overdue decisions and {taskOverdue} overdue priority tasks. Consider sending reminders to the responsible directorates.",
        "overview.focus.docsText":
            "Several documents are still awaiting signature. Early signing will unblock multiple downstream procedures.",

        // Decisions tab
        "decisions.tab.title": "Tracking ministerial decisions",
        "decisions.tab.subtitle":
            "Monitor the implementation status of ministerial decisions across sectors and units.",
        "decisions.tab.stats":
            "Total decisions: {total} • Overdue: {overdue} • Completed: {completed}",
        "decisions.btn.add": "Add ministerial decision",

        // Documents tab
        "documents.tab.title": "Documents and correspondence workflow",
        "documents.tab.subtitle":
            "Monitor incoming documents and the progress of their processing stages.",
        "documents.tab.stats":
            "Total: {total} • Urgent: {urgent} • Awaiting signature: {waitingSignature}",

        // Meetings tab
        "meetings.tab.title": "Ministerial meetings",
        "meetings.tab.subtitle":
            "Track key meetings and ensure related follow‑up actions are completed.",
        "meetings.tab.stats":
            "Total meetings: {total} • With pending follow‑up: {pending}",

        // Tasks tab
        "tasks.tab.title": "Priority administrative tasks",
        "tasks.tab.subtitle":
            "Manage high‑priority tasks assigned to directorates and units.",
        "tasks.tab.stats":
            "Total tasks: {total} • High priority: {high} • Overdue: {overdue}",

        // Reports tab
        "reports.tab.title": "Administrative operations reports",
        "reports.tab.subtitle":
            "Performance of directorates in implementing decisions and processing workflows.",
        "reports.chart.onTime": "On‑time completion by directorate",
        "reports.chart.avgTime": "Average decision implementation time (days)",
        "reports.chart.onTimeLegend": "On time (%)",
        "reports.chart.avgTimeLegend": "Average days",

        // Tables
        "table.decisions.ref": "Reference",
        "table.decisions.subject": "Subject",
        "table.decisions.sector": "Sector",
        "table.decisions.unit": "Responsible unit",
        "table.decisions.deadline": "Deadline",
        "table.decisions.status": "Status",
        "table.decisions.progress": "Progress",

        "table.documents.ref": "Reference",
        "table.documents.type": "Type",
        "table.documents.origin": "Origin",
        "table.documents.stage": "Stage",
        "table.documents.deadline": "Deadline",
        "table.documents.urgent": "Urgency",
        "table.documents.normal": "Normal",

        "table.meetings.date": "Date",
        "table.meetings.title": "Title",
        "table.meetings.organizer": "Organizer",
        "table.meetings.type": "Type",
        "table.meetings.status": "Status",
        "table.meetings.followup": "Follow‑up",

        "table.tasks.title": "Task",
        "table.tasks.owner": "Responsible entity",
        "table.tasks.priority": "Priority",
        "table.tasks.status": "Status",
        "table.tasks.dueDate": "Due date",

        // Status & priority
        "status.decision.draft": "Draft",
        "status.decision.in_review": "Under review",
        "status.decision.in_implementation": "Being implemented",
        "status.decision.completed": "Completed",
        "status.decision.overdue": "Overdue",

        "status.task.not_started": "Not started",
        "status.task.in_progress": "In progress",
        "status.task.completed": "Completed",
        "status.task.overdue": "Overdue",

        "priority.high": "High",
        "priority.medium": "Medium",
        "priority.low": "Low",

        // Chart labels
        "tasks.chart.notStarted": "Not started",
        "tasks.chart.inProgress": "In progress",
        "tasks.chart.completed": "Completed",
        "tasks.chart.overdue": "Overdue",

        // Badges
        "badge.completed": "Completed",
        "badge.pending": "Pending",
        "badge.urgent": "Urgent",
    },
    ar: {
        "lang.ar": "العربية",
        "lang.en": "الإنجليزية",
        "lang.toggleToAr": "العربية",
        "lang.toggleToEn": "English",

        // Page
        "page.title": "منصة الكاتب العام للإدارة",
        "page.subtitle":
            "منصة مركزية للكاتب العام للإشراف على سير العمل الإداري وتوجيهه.",

        // Intro section (specification)
        "intro.sectionTitle": "منصة الكاتب العام",
        "intro.goalTitle": "الهدف / Objective",
        "intro.goalAr": "إنشاء منصة إدارية للكاتب العام للإشراف على سير العمل الإداري.",
        "intro.goalEn":
            "Create an administrative platform for the Secretary General to oversee administrative workflow.",
        "intro.functionsTitle": "الوظائف المطلوبة / Required Functions",
        "intro.func.decisions": "متابعة القرارات الوزارية وتنفيذها.",
        "intro.func.documents": "إدارة سير المستندات والمراسلات.",
        "intro.func.meetings": "متابعة الاجتماعات الوزارية.",
        "intro.func.tasks": "إدارة المهام ذات أولوية.",
        "intro.func.reports": "إصدار تقارير حول العمليات الإدارية.",

        // Top buttons
        "btn.newMeeting": "برمجة اجتماع",
        "btn.newTask": "إضافة مهمة ذات أولوية",
        "btn.export": "تصدير تقرير موجز",
        "btn.exportDetailed": "تصدير تقرير مفصل",

        // Tabs
        "tabs.overview": "نظرة عامة",
        "tabs.decisions": "القرارات",
        "tabs.documents": "المستندات",
        "tabs.meetings": "الاجتماعات",
        "tabs.tasks": "مهام الأولوية",
        "tabs.reports": "التقارير",

        // Cards
        "card.decisions.title": "القرارات الوزارية",
        "card.decisions.subtitle.impl": "قيد التنفيذ",
        "card.decisions.subtitle.completed": "منجزة",
        "card.decisions.subtitle.overdue": "متأخرة",

        "card.documents.title": "المستندات والمراسلات",
        "card.documents.subtitle.waitingSignature": "في انتظار التوقيع",
        "card.documents.subtitle.urgent": "مستعجلة",

        "card.meetings.title": "الاجتماعات",
        "card.meetings.subtitle.pendingFollowup": "بمتابعة معلّقة",
        "card.meetings.subtitle.completedFollowup": "منجزة مع المتابعة",

        "card.tasks.title": "مهام ذات أولوية",
        "card.tasks.subtitle.high": "أولوية عالية",
        "card.tasks.subtitle.completed": "منجزة",
        "card.tasks.subtitle.overdue": "متأخرة",

        // Overview
        "overview.title": "لمحة عن سير العمل الإداري",
        "overview.subtitle":
            "عرض مُجمل لحالة القرارات، المستندات، الاجتماعات، والمهام ذات الأولوية خلال اليوم.",
        "overview.chart.tasksByStatus": "المهام حسب الحالة",
        "overview.focus.overdueTitle": "تركيز على العناصر المتأخرة",
        "overview.focus.overdueText":
            "لديك حالياً {decOverdue} قرارات متأخرة و{taskOverdue} مهام أولوية متأخرة. يُستحسن توجيه تذكير للإدارات المعنية.",
        "overview.focus.docsText":
            "لا تزال بعض المستندات في انتظار التوقيع. التعجيل بالتوقيع يساهم في تسريع بقية الإجراءات.",

        // Decisions tab
        "decisions.tab.title": "متابعة تنفيذ القرارات الوزارية",
        "decisions.tab.subtitle":
            "متابعة حالة تنفيذ القرارات الوزارية عبر مختلف القطاعات والهياكل.",
        "decisions.tab.stats":
            "إجمالي القرارات: {total} • المتأخرة: {overdue} • المنجزة: {completed}",
        "decisions.btn.add": "إضافة قرار وزاري",

        // Documents tab
        "documents.tab.title": "سير عمل المستندات والمراسلات",
        "documents.tab.subtitle":
            "متابعة تدفق المستندات الواردة ومراحل معالجتها.",
        "documents.tab.stats":
            "الإجمالي: {total} • المستعجلة: {urgent} • في انتظار التوقيع: {waitingSignature}",

        // Meetings tab
        "meetings.tab.title": "الاجتماعات الوزارية",
        "meetings.tab.subtitle":
            "متابعة الاجتماعات الرئيسية وضمان إنجاز إجراءات المتابعة المرتبطة بها.",
        "meetings.tab.stats":
            "إجمالي الاجتماعات: {total} • بمتابعة معلّقة: {pending}",

        // Tasks tab
        "tasks.tab.title": "المهام الإدارية ذات الأولوية",
        "tasks.tab.subtitle":
            "إدارة المهام ذات الأولوية المسندة إلى الإدارات والوحدات.",
        "tasks.tab.stats":
            "إجمالي المهام: {total} • أولوية عالية: {high} • متأخرة: {overdue}",

        // Reports tab
        "reports.tab.title": "تقارير العمليات الإدارية",
        "reports.tab.subtitle":
            "قياس أداء الإدارات في تنفيذ القرارات ومعالجة الملفات.",
        "reports.chart.onTime": "نسبة الإنجاز في الآجال حسب الإدارة",
        "reports.chart.avgTime": "متوسط مدة تنفيذ القرارات (بالأيام)",
        "reports.chart.onTimeLegend": "في الآجال (%)",
        "reports.chart.avgTimeLegend": "متوسط الأيام",

        // Tables
        "table.decisions.ref": "المرجع",
        "table.decisions.subject": "موضوع القرار",
        "table.decisions.sector": "القطاع",
        "table.decisions.unit": "الهيكل المسؤول",
        "table.decisions.deadline": "تاريخ الاستحقاق",
        "table.decisions.status": "الحالة",
        "table.decisions.progress": "نسبة التقدّم",

        "table.documents.ref": "المرجع",
        "table.documents.type": "نوع المستند",
        "table.documents.origin": "الجهة الواردة",
        "table.documents.stage": "المرحلة",
        "table.documents.deadline": "تاريخ الاستحقاق",
        "table.documents.urgent": "درجة الاستعجال",
        "table.documents.normal": "عادية",

        "table.meetings.date": "التاريخ والوقت",
        "table.meetings.title": "عنوان الاجتماع",
        "table.meetings.organizer": "الجهة المنظِّمة",
        "table.meetings.type": "طبيعة الاجتماع",
        "table.meetings.status": "حالة الاجتماع",
        "table.meetings.followup": "حالة المتابعة",

        "table.tasks.title": "موضوع المهمة",
        "table.tasks.owner": "الجهة المكلفة",
        "table.tasks.priority": "درجة الأولوية",
        "table.tasks.status": "حالة الإنجاز",
        "table.tasks.dueDate": "تاريخ الاستحقاق",

        // Status & priority
        "status.decision.draft": "مسودة",
        "status.decision.in_review": "قيد المراجعة",
        "status.decision.in_implementation": "قيد التنفيذ",
        "status.decision.completed": "منجزة",
        "status.decision.overdue": "متأخرة",

        "status.task.not_started": "لم تنطلق",
        "status.task.in_progress": "قيد الإنجاز",
        "status.task.completed": "منجزة",
        "status.task.overdue": "متأخرة",

        "priority.high": "عالية",
        "priority.medium": "متوسطة",
        "priority.low": "منخفضة",

        // Chart labels
        "tasks.chart.notStarted": "لم تنطلق",
        "tasks.chart.inProgress": "قيد الإنجاز",
        "tasks.chart.completed": "منجزة",
        "tasks.chart.overdue": "متأخرة",

        // Badges
        "badge.completed": "منجزة",
        "badge.pending": "معلّقة",
        "badge.urgent": "مستعجلة",
    },
};
const useSimpleLanguage = (lang: Lang) => {
    const t = (key: string): string => translations[lang][key] ?? key;
    const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";
    return { t, dir };
};


// --- types ---
type DecisionStatus = "draft" | "in_review" | "in_implementation" | "completed" | "overdue";
type Decision = {
    id: number;
    ref: string;
    title: string;
    sector: string;
    unit: string;
    deadline: string;
    status: DecisionStatus;
    progress: number;
};

type DocumentStage = "received" | "processing" | "waiting_signature" | "archived";
type DocumentItem = {
    id: number;
    ref: string;
    type: string;
    origin: string;
    stage: DocumentStage;
    deadline: string;
    isUrgent: boolean;
};

type MeetingStatus = "scheduled" | "in_progress" | "completed" | "followup_pending";
type Meeting = {
    id: number;
    title: string;
    date: string;
    organizer: string;
    type: string;
    status: MeetingStatus;
    followupCompleted: boolean;
};

type TaskStatus = "not_started" | "in_progress" | "completed" | "overdue";
type TaskPriority = "high" | "medium" | "low";
type PriorityTask = {
    id: number;
    title: string;
    owner: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: string;
};

type DirectoratePerformance = {
    name: string;
    onTimeRate: number;
    avgDecisionTimeDays: number;
};

// --- extended mock data (fallback) (decisions/documents/meetings/tasks) and new datasets ---
const decisionsFallback: Decision[] = [
    {
        id: 1,
        ref: "ق-و/2025/001",
        title: "رقمنة ملفات التلاميذ على المستوى الوطني",
        sector: "التعليم الثانوي",
        unit: "الإدارة العامة لتكنولوجيا المعلومات",
        deadline: "31-12-2025",
        status: "in_implementation",
        progress: 60,
    },
    {
        id: 2,
        ref: "ق-و/2025/015",
        title: "برنامج تكوين المدرسين في الاستعمال البيداغوجي للذكاء الاصطناعي",
        sector: "التعليم الابتدائي",
        unit: "الإدارة العامة للتكوين وتطوير الكفاءات",
        deadline: "15-07-2025",
        status: "overdue",
        progress: 40,
    },
    {
        id: 3,
        ref: "ق-و/2025/021",
        title: "تعزيز شروط السلامة داخل المؤسسات التربوية",
        sector: "جميع المراحل",
        unit: "الإدارة العامة للبنية التحتية",
        deadline: "01-11-2025",
        status: "in_review",
        progress: 20,
    },
    {
        id: 4,
        ref: "ق-و/2024/099",
        title: "مراجعة نظام الامتحانات الوطنية",
        sector: "التعليم الثانوي",
        unit: "الإدارة العامة للامتحانات",
        deadline: "30-09-2024",
        status: "completed",
        progress: 100,
    },
    {
        id: 5,
        ref: "ق-و/2025/030",
        title: "تعميم المنصات الرقمية للتواصل مع الأولياء",
        sector: "التعليم الأساسي",
        unit: "الإدارة العامة للتلميذ والمدرس",
        deadline: "30-10-2025",
        status: "in_implementation",
        progress: 35,
    },
    {
        id: 6,
        ref: "ق-و/2025/042",
        title: "خطة صيانة عاجلة للمؤسسات التربوية الريفية",
        sector: "التعليم الإعدادي",
        unit: "الإدارة العامة للبنية التحتية",
        deadline: "30-08-2025",
        status: "draft",
        progress: 10,
    },
];

const documentsFallback: DocumentItem[] = [
    {
        id: 1,
        ref: "م/2025/1001",
        type: "عريضة شكاية",
        origin: "المندوبية الجهوية للتربية تونس 1",
        stage: "processing",
        deadline: "20-06-2025",
        isUrgent: true,
    },
    {
        id: 2,
        ref: "م/2025/1002",
        type: "طلب اعتمادات مالية",
        origin: "مدرسة ابتدائية بأريانة",
        stage: "waiting_signature",
        deadline: "18-06-2025",
        isUrgent: false,
    },
    {
        id: 3,
        ref: "م/2025/1003",
        type: "تقرير تفقد بيداغوجي",
        origin: "مصلحة التفقد بصفاقس",
        stage: "received",
        deadline: "25-06-2025",
        isUrgent: false,
    },
    {
        id: 4,
        ref: "م/2025/1004",
        type: "مراسلة من وزارة المالية",
        origin: "وزارة المالية",
        stage: "processing",
        deadline: "22-06-2025",
        isUrgent: true,
    },
    {
        id: 5,
        ref: "م/2025/1005",
        type: "مذكرة داخلية",
        origin: "ديوان الوزير",
        stage: "archived",
        deadline: "01-06-2025",
        isUrgent: false,
    },
];

const meetings: Meeting[] = [
    {
        id: 1,
        title: "الاجتماع الأسبوعي للتنسيق مع المندوبيات الجهوية",
        date: "15-06-2025 09:00",
        organizer: "الكاتب العام",
        type: "اجتماع تنسيقي",
        status: "scheduled",
        followupCompleted: false,
    },
    {
        id: 2,
        title: "جلسة متابعة جاهزية الامتحانات الوطنية",
        date: "16-06-2025 14:00",
        organizer: "السيد الوزير",
        type: "اجتماع استراتيجي",
        status: "followup_pending",
        followupCompleted: false,
    },
    {
        id: 3,
        title: "متابعة برنامج التحول الرقمي بالوزارة",
        date: "10-06-2025 10:00",
        organizer: "الكاتب العام",
        type: "اجتماع متابعة مشروع",
        status: "completed",
        followupCompleted: true,
    },
    {
        id: 4,
        title: "جلسة تقييم نتائج الامتحانات الوطنية",
        date: "05-07-2025 11:00",
        organizer: "الإدارة العامة للامتحانات",
        type: "اجتماع تقويمي",
        status: "scheduled",
        followupCompleted: false,
    },
];

const tasks: PriorityTask[] = [
    {
        id: 1,
        title: "المصادقة على خارطة طريق رقمنة الخدمات لسنة 2025",
        owner: "الإدارة العامة لتكنولوجيا المعلومات",
        priority: "high",
        status: "in_progress",
        dueDate: "20-06-2025",
    },
    {
        id: 2,
        title: "تذكير المندوبيات الجهوية بتقارير السلامة داخل المؤسسات التربوية",
        owner: "ديوان الوزير",
        priority: "medium",
        status: "not_started",
        dueDate: "18-06-2025",
    },
    {
        id: 3,
        title: "استكمال الاتفاقية مع مشغل الاتصالات لتدعيم الربط بالأنترنات",
        owner: "الإدارة العامة للشراكات والتعاون",
        priority: "high",
        status: "overdue",
        dueDate: "05-06-2025",
    },
    {
        id: 4,
        title: "إعداد تقرير نصف سنوي حول أداء الإدارات الجهوية",
        owner: "الإدارة العامة للتقييم والمتابعة",
        priority: "medium",
        status: "in_progress",
        dueDate: "30-06-2025",
    },
    {
        id: 5,
        title: "تحيين دليل إجراءات العمل الإداري",
        owner: "الإدارة العامة للشؤون الإدارية",
        priority: "low",
        status: "not_started",
        dueDate: "31-07-2025",
    },
];

const directoratePerformance: DirectoratePerformance[] = [
    { name: "الإدارة العامة لتكنولوجيا المعلومات", onTimeRate: 92, avgDecisionTimeDays: 18 },
    { name: "الإدارة العامة للتكوين وتطوير الكفاءات", onTimeRate: 76, avgDecisionTimeDays: 32 },
    { name: "الإدارة العامة للامتحانات", onTimeRate: 88, avgDecisionTimeDays: 22 },
    { name: "الإدارة العامة للبنية التحتية", onTimeRate: 69, avgDecisionTimeDays: 40 },
    { name: "الإدارة العامة للتقييم والمتابعة", onTimeRate: 81, avgDecisionTimeDays: 25 },
];

// إضافية: تطور المهام اليومي خلال أسبوع (إنشاء/إنجاز)
const dailyTasksTrend = [
    { day: "السبت", created: 4, completed: 1 },
    { day: "الأحد", created: 2, completed: 0 },
    { day: "الاثنين", created: 5, completed: 3 },
    { day: "الثلاثاء", created: 6, completed: 4 },
    { day: "الأربعاء", created: 3, completed: 2 },
    { day: "الخميس", created: 4, completed: 5 },
    { day: "الجمعة", created: 1, completed: 2 },
];

// توزيع المستندات حسب المرحلة
const documentsByStageData = [
    { stage: "واردة", key: "received" as DocumentStage },
    { stage: "قيد المعالجة", key: "processing" as DocumentStage },
    { stage: "في انتظار التوقيع", key: "waiting_signature" as DocumentStage },
    { stage: "مؤرشفة", key: "archived" as DocumentStage },
];

// توزيع الاجتماعات حسب الحالة
const meetingsByStatusData = [
    { status: "مبرمج", key: "scheduled" as MeetingStatus },
    { status: "قيد الانعقاد", key: "in_progress" as MeetingStatus },
    { status: "منتهٍ", key: "completed" as MeetingStatus },
    { status: "بمتابعة معلّقة", key: "followup_pending" as MeetingStatus },
];

// توزيع المهام حسب درجة الأولوية
const tasksByPriorityData = [
    { label: "أولوية عالية", key: "high" as TaskPriority },
    { label: "أولوية متوسطة", key: "medium" as TaskPriority },
    { label: "أولوية منخفضة", key: "low" as TaskPriority },
];

// ألوان للـ Pie
const PIE_COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#a855f7"];

// --- helper functions ---
const statusBadgeVariant: Record<DecisionStatus, "default" | "outline" | "secondary" | "destructive"> = {
    draft: "outline",
    in_review: "secondary",
    in_implementation: "default",
    completed: "default",
    overdue: "destructive",
};

const SecretaryDashboard: React.FC = () => {
    const { toast } = useToast();
    const [lang, setLang] = useState<Lang>("ar");
    const { t, dir } = useSimpleLanguage(lang);
    // --- Modal state ---
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);

    // --- Form state ---
    const [newMeeting, setNewMeeting] = useState({ title: '', date: '', organizer: '', type: '' });
    const [newTask, setNewTask] = useState({ title: '', owner: '', priority: 'high' as TaskPriority, dueDate: '' });

    // Make meetings & tasks dynamic (stateful) so forms can add entries
    const [meetingsData, setMeetingsData] = useState<Meeting[]>([]);
    const [tasksData, setTasksData] = useState<PriorityTask[]>([]);
    const [decisionsData, setDecisionsData] = useState<Decision[]>([]);
    const [documentsData, setDocumentsData] = useState<DocumentItem[]>([]);
    const [showEditTaskModal, setShowEditTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState<PriorityTask | null>(null);
    // Decisions state (create/edit)
    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [newDecision, setNewDecision] = useState<Partial<Decision>>({ ref: '', title: '', sector: '', unit: '', deadline: '', status: 'draft', progress: 0 });
    const [showEditDecisionModal, setShowEditDecisionModal] = useState(false);
    const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
    // Documents state (create/edit)
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [newDocument, setNewDocument] = useState<Partial<DocumentItem>>({ ref: '', type: '', origin: '', stage: 'received', deadline: '', isUrgent: false });
    const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
    const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(null);
    // Meetings edit state
    const [showEditMeetingModal, setShowEditMeetingModal] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

    // Fetch tasks and meetings from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const tasksResponse = await api.get('/secretary/tasks/');
                const rawTasks = Array.isArray(tasksResponse.data)
                    ? tasksResponse.data
                    : Array.isArray(tasksResponse.data?.results)
                    ? tasksResponse.data.results
                    : [];
                const normalizedTasks: PriorityTask[] = (rawTasks as any[]).map(t => ({
                    id: t.id,
                    title: t.title,
                    owner: t.owner || '',
                    priority: (t.priority || 'high') as TaskPriority,
                    status: (t.status || 'not_started') as TaskStatus,
                    dueDate: t.due_date || '',
                }));
                setTasksData(normalizedTasks);

                const meetingsResponse = await api.get('/secretary/meetings/');
                const meetingsPayload = Array.isArray(meetingsResponse.data)
                    ? meetingsResponse.data
                    : Array.isArray(meetingsResponse.data?.results)
                    ? meetingsResponse.data.results
                    : null;
                if (meetingsPayload) setMeetingsData(meetingsPayload as Meeting[]);
                else {
                    console.error('Error: meetings API did not return a list.', meetingsResponse.data);
                    setMeetingsData([]);
                }

                // Decisions
                try {
                    const decisionsResp = await api.get('/secretary/decisions/');
                    const raw = Array.isArray(decisionsResp.data) ? decisionsResp.data : decisionsResp.data?.results || [];
                    const normalized: Decision[] = (raw as any[]).map(d => ({
                        id: d.id,
                        ref: d.ref,
                        title: d.title,
                        sector: d.sector,
                        unit: d.unit,
                        deadline: d.deadline,
                        status: d.status as DecisionStatus,
                        progress: d.progress ?? 0,
                    }));
                    setDecisionsData(normalized);
                } catch (e) {
                    console.warn('Decisions API not available, using fallback.');
                }

                // Documents
                try {
                    const documentsResp = await api.get('/secretary/documents/');
                    const raw = Array.isArray(documentsResp.data) ? documentsResp.data : documentsResp.data?.results || [];
                    const normalized: DocumentItem[] = (raw as any[]).map(doc => ({
                        id: doc.id,
                        ref: doc.ref,
                        type: doc.document_type,
                        origin: doc.origin,
                        stage: doc.stage as DocumentStage,
                        deadline: doc.deadline || '',
                        isUrgent: !!doc.is_urgent,
                    }));
                    setDocumentsData(normalized);
                } catch (e) {
                    console.warn('Documents API not available, using fallback.');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setTasksData([]); // Also set to empty on catch
                setMeetingsData([]);
            }
        };

        fetchData();
    }, []);

    // --- Export logic ---
    const exportCSV = (data: any[], filename: string) => {
        if (!data.length) return;
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(h => {
                    const v = row[h];
                    if (v === undefined || v === null) return '';
                    const str = String(v);
                    return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
                }).join(',')
            )
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);}

    // --- filters & “management views” to achieve the goals ---
    // 1) القرارات الوزارية
    const [decisionsStatusFilter, setDecisionsStatusFilter] = useState<DecisionStatus | "all">("all");
    const [decisionsShowOnlyOverdue, setDecisionsShowOnlyOverdue] = useState(false);

    // 2) المستندات والمراسلات
    const [documentsUrgentFilter, setDocumentsUrgentFilter] = useState<"all" | "urgent" | "normal">("all");
    const [documentsStageFilter, setDocumentsStageFilter] = useState<DocumentStage | "all">("all");

    // 3) الاجتماعات الوزارية
    const [meetingsStatusFilter, setMeetingsStatusFilter] = useState<MeetingStatus | "all">("all");
    const [meetingsFollowupFilter, setMeetingsFollowupFilter] = useState<"all" | "pending" | "completed">("all");

    // 4) المهام ذات الأولوية
    const [tasksPriorityFilter, setTasksPriorityFilter] = useState<TaskPriority | "all">("all");
    const [tasksStatusFilter, setTasksStatusFilter] = useState<TaskStatus | "all">("all");

    const statusLabel: Record<DecisionStatus, string> = {
        draft: t("status.decision.draft"),
        in_review: t("status.decision.in_review"),
        in_implementation: t("status.decision.in_implementation"),
        completed: t("status.decision.completed"),
        overdue: t("status.decision.overdue"),
    };

    const taskStatusLabel: Record<TaskStatus, string> = {
        not_started: t("status.task.not_started"),
        in_progress: t("status.task.in_progress"),
        completed: t("status.task.completed"),
        overdue: t("status.task.overdue"),
    };

    const taskPriorityLabel: Record<TaskPriority, string> = {
        high: t("priority.high"),
        medium: t("priority.medium"),
        low: t("priority.low"),
    };

    const decisionsSource = decisionsData.length ? decisionsData : decisionsFallback;
    const documentsSource = documentsData.length ? documentsData : documentsFallback;

    const decisionsStats = useMemo(() => {
        const total = decisionsSource.length;
        const completed = decisionsSource.filter((d) => d.status === "completed").length;
        const overdue = decisionsSource.filter((d) => d.status === "overdue").length;
        const inImplementation = decisionsSource.filter((d) => d.status === "in_implementation").length;
        return { total, completed, overdue, inImplementation };
    }, [decisionsSource]);

    const documentsStats = useMemo(() => {
        const total = documentsSource.length;
        const urgent = documentsSource.filter((d) => d.isUrgent).length;
        const waitingSignature = documentsSource.filter((d) => d.stage === "waiting_signature").length;
        return { total, urgent, waitingSignature };
    }, [documentsSource]);

    const meetingsStats = useMemo(() => {
        const total = meetingsData.length;
        const followupPending = meetingsData.filter((m) => m.status === "followup_pending").length;
        const completedWithFollowup = meetingsData.filter(
            (m) => m.status === "completed" && m.followupCompleted
        ).length;
        return { total, followupPending, completedWithFollowup };
    }, [meetingsData]);

    const tasksStats = useMemo(() => {
        const total = tasksData.length;
        const overdue = tasksData.filter((t) => t.status === "overdue").length;
        const highPriority = tasksData.filter((t) => t.priority === "high").length;
        const completed = tasksData.filter((t) => t.status === "completed").length;
        return { total, overdue, highPriority, completed };
    }, [tasksData]);

    const tasksByStatusForChart = useMemo(
        () => [
            {
                status: t("tasks.chart.notStarted"),
                count: tasksData.filter((t) => t.status === "not_started").length,
            },
            {
                status: t("tasks.chart.inProgress"),
                count: tasksData.filter((t) => t.status === "in_progress").length,
            },
            {
                status: t("tasks.chart.completed"),
                count: tasksData.filter((t) => t.status === "completed").length,
            },
            {
                status: t("tasks.chart.overdue"),
                count: tasksData.filter((t) => t.status === "overdue").length,
            },
        ],
        [t, tasksData]
    );

    // --- derived lists according to filters (this is the “code that does the goals”) ---
    const filteredDecisions = useMemo(
        () =>
            decisionsSource.filter((d) => {
                if (decisionsStatusFilter !== "all" && d.status !== decisionsStatusFilter) return false;
                if (decisionsShowOnlyOverdue && d.status !== "overdue") return false;
                return true;
            }),
        [decisionsSource, decisionsStatusFilter, decisionsShowOnlyOverdue]
    );

    const filteredDocuments = useMemo(
        () =>
            documentsSource.filter((doc) => {
                if (documentsUrgentFilter === "urgent" && !doc.isUrgent) return false;
                if (documentsUrgentFilter === "normal" && doc.isUrgent) return false;
                if (documentsStageFilter !== "all" && doc.stage !== documentsStageFilter) return false;
                return true;
            }),
        [documentsSource, documentsUrgentFilter, documentsStageFilter]
    );

    const filteredMeetings = useMemo(
        () =>
            meetingsData.filter((m) => {
                if (meetingsStatusFilter !== "all" && m.status !== meetingsStatusFilter) return false;
                if (meetingsFollowupFilter === "pending" && m.followupCompleted) return false;
                if (meetingsFollowupFilter === "completed" && !m.followupCompleted) return false;
                return true;
            }),
        [meetingsStatusFilter, meetingsFollowupFilter, meetingsData]
    );

    const filteredTasks = useMemo(
        () =>
            tasksData.filter((task) => {
                if (tasksPriorityFilter !== "all" && task.priority !== tasksPriorityFilter) return false;
                if (tasksStatusFilter !== "all" && task.status !== tasksStatusFilter) return false;
                return true;
            }),
        [tasksPriorityFilter, tasksStatusFilter, tasksData]
    );

    // مشتقات للرسوم من البيانات أعلاه
    const documentsStageChartData = useMemo(
        () =>
            documentsByStageData.map((s) => ({
                stage: s.stage,
                count: documentsSource.filter((d) => d.stage === s.key).length,
            })),
        [documentsSource]
    );

    const meetingsStatusChartData = useMemo(
        () =>
            meetingsByStatusData.map((s) => ({
                status: s.status,
                count: meetingsData.filter((m) => m.status === s.key).length,
            })),
        [meetingsData]
    );

    const handleSortTasksByPriority = () => {
        const order: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
        setTasksData((prev) => [...prev].sort((a, b) => order[a.priority] - order[b.priority]));
        toast({ title: "تمت إعادة الترتيب", description: "تم ترتيب المهام حسب الأولوية." });
    };

    const handleSendOverdueTaskReminders = () => {
        const overdue = tasksData.filter(t => t.status === 'overdue');
        toast({ title: "تم إرسال تنبيه", description: `تم تحديد ${overdue.length} مهام متأخرة للتنبيه.` });
    };

    const tasksPriorityChartData = useMemo(
        () =>
            tasksByPriorityData.map((p) => ({
                priority: p.label,
                count: tasksData.filter((t) => t.priority === p.key).length,
            })),
        [tasksData]
    );

    const decisionsBySectorData = useMemo(() => {
        const map = new Map<string, { sector: string; total: number; overdue: number }>();
        decisionsSource.forEach((d) => {
            const entry = map.get(d.sector) ?? { sector: d.sector, total: 0, overdue: 0 };
            entry.total += 1;
            if (d.status === "overdue") entry.overdue += 1;
            map.set(d.sector, entry);
        });
        return Array.from(map.values());
    }, [decisionsSource]);

    // --- Export handlers ---
    const handleExportSummary = () => {
        const summary = [
            {
                decisions_total: decisionsSource.length,
                decisions_overdue: decisionsSource.filter(d => d.status === 'overdue').length,
                documents_total: documentsSource.length,
                documents_waiting_signature: documentsSource.filter(d => d.stage === 'waiting_signature').length,
                meetings_total: meetingsData.length,
                meetings_followup_pending: meetingsData.filter(m => m.status === 'followup_pending').length,
                tasks_total: tasksData.length,
                tasks_overdue: tasksData.filter(t => t.status === 'overdue').length,
                tasks_high_priority: tasksData.filter(t => t.priority === 'high').length,
            }
        ];
        exportCSV(summary, 'summary_report.csv');
    };

    const handleExportDetailed = () => {
        const rows: any[] = [];
        decisionsSource.forEach(d => rows.push({
            type: 'decision', ref: d.ref, title: d.title, sector: d.sector, unit: d.unit, deadline: d.deadline, status: d.status, progress: d.progress
        }));
        documentsSource.forEach(doc => rows.push({
            type: 'document', ref: doc.ref, title: doc.type, origin: doc.origin, stage: doc.stage, deadline: doc.deadline, urgent: doc.isUrgent
        }));
        meetingsData.forEach(m => rows.push({
            type: 'meeting', title: m.title, date: m.date, organizer: m.organizer, meeting_type: m.type, status: m.status, followupCompleted: m.followupCompleted
        }));
        tasksData.forEach(tk => rows.push({
            type: 'task', title: tk.title, owner: tk.owner, priority: tk.priority, status: tk.status, dueDate: tk.dueDate
        }));
        exportCSV(rows, 'detailed_report.csv');
    };

    return (
        <div className="min-h-screen bg-gray-50" dir={dir}>
            <main className="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-6">
                {/* header with language toggle */}
                <header className="flex flex-col md:flex-row-reverse md:items-center md:justify-between gap-3">
                    <div className="text-right">
                        <h1 className="text-3xl font-bold text-gray-900">
                            {t("page.title")}
                        </h1>
                        <p className="text-gray-600">
                            {t("page.subtitle")}
                        </p>
                    </div>
                    <div className="flex flex-row-reverse items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLang((prev) => (prev === "ar" ? "en" : "ar"))}
                        >
                            {lang === "ar" ? t("lang.toggleToEn") : t("lang.toggleToAr")}
                        </Button>
                        {/* Responsive buttons */}
                        <div className="hidden md:flex flex-row-reverse items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setShowMeetingModal(true)}>
                                <Calendar className="ms-2 h-4 w-4" />
                                {t("btn.newMeeting")}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowTaskModal(true)}>
                                <Plus className="ms-2 h-4 w-4" />
                                {t("btn.newTask")}
                            </Button>
                            <Button size="sm" onClick={() => handleExportSummary()}>
                                <Download className="ms-2 h-4 w-4" />
                                {t("btn.export")}
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleExportDetailed()}>
                                <Download className="ms-2 h-4 w-4" />
                                {t("btn.exportDetailed")}
                            </Button>
                        </div>
                        <div className="md:hidden">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align={lang === "ar" ? "start" : "end"}>
                                    <DropdownMenuItem onSelect={() => setShowMeetingModal(true)}>
                                        <Calendar className="ms-2 h-4 w-4" />
                                        <span>{t("btn.newMeeting")}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setShowTaskModal(true)}>
                                        <Plus className="ms-2 h-4 w-4" />
                                        <span>{t("btn.newTask")}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleExportSummary()}>
                                        <Download className="ms-2 h-4 w-4" />
                                        <span>{t("btn.export")}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleExportDetailed()}>
                                        <Download className="ms-2 h-4 w-4" />
                                        <span>{t("btn.exportDetailed")}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* بدل فقرة الهدف، اجعلها شريط تحكم يختصر الوظائف */}
                <section className="bg-white border rounded-lg p-4 space-y-3 text-right">
                    <h2 className="text-lg font-semibold text-gray-900">منصة الكاتب العام – نظرة عملية</h2>
                    <p className="text-sm text-gray-700">
                        هذه اللوحة توفّر للكاتب العام أدوات لمتابعة تنفيذ القرارات، سير المستندات،
                        الاجتماعات، والمهام ذات الأولوية، إضافة إلى مؤشرات أداء للإدارات.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                        <div className="border rounded-md p-3">
                            <p className="font-semibold mb-1">متابعة القرارات الوزارية</p>
                            <p className="text-gray-700">
                                عرض القرارات حسب حالة التنفيذ مع إبراز القرارات المتأخرة على مستوى كل هيكل.
                            </p>
                        </div>
                        <div className="border rounded-md p-3">
                            <p className="font-semibold mb-1">إدارة سير المستندات</p>
                            <p className="text-gray-700">
                                مراقبة الملفات المستعجلة والمستندات في انتظار التوقيع وإحالتها على الإدارات المختصة.
                            </p>
                        </div>
                        <div className="border rounded-md p-3">
                            <p className="font-semibold mb-1">متابعة الاجتماعات الوزارية</p>
                            <p className="text-gray-700">
                                ضمان أن كل اجتماع استراتيجي مرفوق بخطة متابعة ومهام واضحة ومسندة.
                            </p>
                        </div>
                        <div className="border rounded-md p-3">
                            <p className="font-semibold mb-1">إدارة المهام ذات الأولوية</p>
                            <p className="text-gray-700">
                                ترتيب المهام حسب الأولوية ومراقبة إنجازها على مستوى الإدارات المختلفة.
                            </p>
                        </div>
                    </div>
                </section>

                {/* top overview cards */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="text-right">
                        <CardHeader className="pb-2 items-end">
                            <CardDescription className="text-right">
                                {t("card.decisions.title")}
                            </CardDescription>
                            <CardTitle className="flex flex-row-reverse items-center gap-2 text-2xl">
                                <Layers className="h-5 w-5 text-blue-600" />
                                {decisionsStats.total}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-right">
                            <p className="text-sm text-gray-600">
                                {t("card.decisions.subtitle.impl")}: {decisionsStats.inImplementation} •{" "}
                                {t("card.decisions.subtitle.completed")}: {decisionsStats.completed}
                            </p>
                            {decisionsStats.overdue > 0 && (
                                <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                                    <AlertTriangle className="h-4 w-4" />
                                    {t("card.decisions.subtitle.overdue")}: {decisionsStats.overdue}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="text-right">
                        <CardHeader className="pb-2 items-end">
                            <CardDescription className="text-right">
                                {t("card.documents.title")}
                            </CardDescription>
                            <CardTitle className="flex flex-row-reverse items-center gap-2 text-2xl">
                                <FileText className="h-5 w-5 text-emerald-600" />
                                {documentsStats.total}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-right">
                            <p className="text-sm text-gray-600">
                                {t("card.documents.subtitle.waitingSignature")}:{" "}
                                {documentsStats.waitingSignature}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                                {t("card.documents.subtitle.urgent")}: {documentsStats.urgent}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="text-right">
                        <CardHeader className="pb-2 items-end">
                            <CardDescription className="text-right">
                                {t("card.meetings.title")}
                            </CardDescription>
                            <CardTitle className="flex flex-row-reverse items-center gap-2 text-2xl">
                                <Calendar className="h-5 w-5 text-indigo-600" />
                                {meetingsStats.total}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-right">
                            <p className="text-sm text-gray-600">
                                {t("card.meetings.subtitle.pendingFollowup")}:{" "}
                                {meetingsStats.followupPending}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                                {t("card.meetings.subtitle.completedFollowup")}:{" "}
                                {meetingsStats.completedWithFollowup}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="text-right">
                        <CardHeader className="pb-2 items-end">
                            <CardDescription className="text-right">
                                {t("card.tasks.title")}
                            </CardDescription>
                            <CardTitle className="flex flex-row-reverse items-center gap-2 text-2xl">
                                <Flag className="h-5 w-5 text-rose-600" />
                                {tasksStats.total}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-right">
                            <p className="text-sm text-gray-600">
                                {t("card.tasks.subtitle.high")}: {tasksStats.highPriority}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                                {t("card.tasks.subtitle.completed")}: {tasksStats.completed} •{" "}
                                {t("card.tasks.subtitle.overdue")}: {tasksStats.overdue}
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* main tabs */}
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="flex flex-row-reverse">
                        <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
                        <TabsTrigger value="decisions">{t("tabs.decisions")}</TabsTrigger>
                        <TabsTrigger value="documents">{t("tabs.documents")}</TabsTrigger>
                        <TabsTrigger value="meetings">{t("tabs.meetings")}</TabsTrigger>
                        <TabsTrigger value="tasks">{t("tabs.tasks")}</TabsTrigger>
                        <TabsTrigger value="reports">{t("tabs.reports")}</TabsTrigger>
                    </TabsList>

                    {/* Overview tab: إضافة رسم ثاني (تطور المهام اليومي) */}
                    <TabsContent value="overview" className="space-y-4">
                        <Card className="text-right">
                            <CardHeader className="items-end">
                                <CardTitle className="flex flex-row-reverse items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-600" />
                                    {t("overview.title")}
                                </CardTitle>
                                <CardDescription className="text-right">
                                    {t("overview.subtitle")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="text-right">
                                    <h3 className="text-sm font-semibold mb-2 text-gray-700">
                                        {t("overview.chart.tasksByStatus")}
                                    </h3>
                                    <div className="h-60">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ReBarChart data={tasksByStatusForChart}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="status" />
                                                <YAxis allowDecimals={false} />
                                                <Tooltip />
                                                <Bar dataKey="count" fill="#2563eb" />
                                            </ReBarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex flex-row-reverse gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-blue-900">
                                                {t("overview.focus.overdueTitle")}
                                            </p>
                                            <p className="text-sm text-blue-800">
                                                {t("overview.focus.overdueText")
                                                    .replace("{decOverdue}", String(decisionsStats.overdue))
                                                    .replace("{taskOverdue}", String(tasksStats.overdue))}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex flex-row-reverse gap-2">
                                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                                        <p className="text-sm text-amber-800 text-right">
                                            {t("overview.focus.docsText")}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* NEW: تطوّر المهام اليومية (إنشاء/إنجاز) */}
                        <Card className="text-right">
                            <CardHeader className="items-end">
                                <CardTitle className="flex flex-row-reverse items-center gap-2">
                                    <ClipboardList className="h-5 w-5 text-emerald-600" />
                                    تطوّر إنشاء وإنجاز المهام خلال الأسبوع
                                </CardTitle>
                                <CardDescription>
                                    مقارنة عدد المهام الجديدة بعدد المهام المنجزة حسب اليوم.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dailyTasksTrend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="day" />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="created"
                                                name="مهام جديدة"
                                                stroke="#0ea5e9"
                                                fill="#0ea5e933"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="completed"
                                                name="مهام منجزة"
                                                stroke="#22c55e"
                                                fill="#22c55e33"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Decisions tab: إضافة رسم لعدد القرارات حسب القطاع والمتأخرة */}
                    <TabsContent value="decisions">
                        <Card className="text-right">
                            <CardHeader className="items-end">
                                <CardTitle>{t("decisions.tab.title")}</CardTitle>
                                <CardDescription>
                                    {t("decisions.tab.subtitle")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* existing stats + add filters bar */}
                                <div className="mb-4 space-y-2">
                                    <div className="flex flex-row-reverse justify-between items-center gap-2">
                                        <p className="text-sm text-gray-600">
                                            {t("decisions.tab.stats")
                                                .replace("{total}", String(decisionsStats.total))
                                                .replace("{overdue}", String(decisionsStats.overdue))
                                                .replace("{completed}", String(decisionsStats.completed))}
                                        </p>
                                        <Button size="sm" variant="outline" onClick={() => setShowDecisionModal(true)}>
                                            {t("decisions.btn.add")}
                                        </Button>
                                    </div>

                                    {/* تصفية حسب حالة التنفيذ / القرارات المتأخرة */}
                                    <div className="flex flex-wrap gap-2 justify-end items-center">
                                        <span className="text-sm text-gray-700">
                                            تصفية حسب حالة التنفيذ:
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                variant={decisionsStatusFilter === "all" ? "default" : "outline"}
                                                onClick={() => setDecisionsStatusFilter("all")}
                                            >
                                                الكل
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={
                                                    decisionsStatusFilter === "in_implementation"
                                                        ? "default"
                                                        : "outline"
                                                }
                                                onClick={() => setDecisionsStatusFilter("in_implementation")}
                                            >
                                                {statusLabel.in_implementation}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={
                                                    decisionsStatusFilter === "completed" ? "default" : "outline"
                                                }
                                                onClick={() => setDecisionsStatusFilter("completed")}
                                            >
                                                {statusLabel.completed}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={decisionsStatusFilter === "overdue" ? "default" : "outline"}
                                                onClick={() => setDecisionsStatusFilter("overdue")}
                                            >
                                                {statusLabel.overdue}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex flex-row-reverse items-center gap-2">
                                        <label className="flex items-center gap-1 text-sm text-gray-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="cursor-pointer"
                                                checked={decisionsShowOnlyOverdue}
                                                onChange={(e) =>
                                                    setDecisionsShowOnlyOverdue(e.target.checked)
                                                }
                                            />
                                            عرض القرارات المتأخرة فقط
                                        </label>
                                        <Button size="sm" variant="outline" className="ms-auto">
                                            تنزيل تقرير عن تنفيذ القرارات
                                        </Button>
                                    </div>
                                </div>

                                {/* table – uses filteredDecisions */}
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="text-right">
                                                <TableHead>{t("table.decisions.ref")}</TableHead>
                                                <TableHead>{t("table.decisions.subject")}</TableHead>
                                                <TableHead>{t("table.decisions.sector")}</TableHead>
                                                <TableHead>{t("table.decisions.unit")}</TableHead>
                                                <TableHead>{t("table.decisions.deadline")}</TableHead>
                                                <TableHead>{t("table.decisions.status")}</TableHead>
                                                <TableHead>{t("table.decisions.progress")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredDecisions.map((d) => (
                                                <TableRow key={d.id} className="text-right">
                                                    <TableCell className="font-medium">{d.ref}</TableCell>
                                                    <TableCell className="font-medium flex flex-row-reverse items-center gap-2">
                                                        {d.title}
                                                        <Button variant="outline" size="sm" type="button" onClick={() => { setEditingDecision(d); setShowEditDecisionModal(true); }}>
                                                            تعديل
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell>{d.sector}</TableCell>
                                                    <TableCell>{d.unit}</TableCell>
                                                    <TableCell>{d.deadline}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={statusBadgeVariant[d.status]}>
                                                            {statusLabel[d.status]}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm">{d.progress}%</span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* NEW chart under table */}
                                <div className="mt-6">
                                    <h3 className="text-sm font-semibold mb-2 text-gray-700">
                                        توزيع القرارات حسب القطاع وحالة التأخير
                                    </h3>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ReBarChart data={decisionsBySectorData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="sector" />
                                                <YAxis allowDecimals={false} />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="total" fill="#0ea5e9" name="إجمالي القرارات" />
                                                <Bar dataKey="overdue" fill="#ef4444" name="قرارات متأخرة" />
                                            </ReBarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Documents tab: إضافة مخطط دائري للمرحلة */}
                    <TabsContent value="documents">
                        <Card className="text-right">
                            <CardHeader className="items-end">
                                <CardTitle>{t("documents.tab.title")}</CardTitle>
                                <CardDescription>
                                    {t("documents.tab.subtitle")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-3">
                                    {t("documents.tab.stats")
                                        .replace("{total}", String(documentsStats.total))
                                        .replace("{urgent}", String(documentsStats.urgent))
                                        .replace("{waitingSignature}", String(documentsStats.waitingSignature))}
                                </p>

                                {/* filters + actions */}
                                <div className="mb-4 space-y-2">
                                    <div className="flex flex-wrap gap-2 justify-end items-center">
                                        <span className="text-sm text-gray-700">
                                            تصفية حسب درجة الاستعجال:
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                variant={documentsUrgentFilter === "all" ? "default" : "outline"}
                                                onClick={() => setDocumentsUrgentFilter("all")}
                                            >
                                                الكل
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={documentsUrgentFilter === "urgent" ? "default" : "outline"}
                                                onClick={() => setDocumentsUrgentFilter("urgent")}
                                            >
                                                مستعجلة
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={documentsUrgentFilter === "normal" ? "default" : "outline"}
                                                onClick={() => setDocumentsUrgentFilter("normal")}
                                            >
                                                عادية
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 justify-end items-center">
                                        <span className="text-sm text-gray-700">تصفية حسب المرحلة:</span>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                variant={documentsStageFilter === "all" ? "default" : "outline"}
                                                onClick={() => setDocumentsStageFilter("all")}
                                            >
                                                الكل
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={documentsStageFilter === "received" ? "default" : "outline"}
                                                onClick={() => setDocumentsStageFilter("received")}
                                            >
                                                واردة
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={documentsStageFilter === "processing" ? "default" : "outline"}
                                                onClick={() => setDocumentsStageFilter("processing")}
                                            >
                                                قيد المعالجة
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={
                                                    documentsStageFilter === "waiting_signature"
                                                        ? "default"
                                                        : "outline"
                                                }
                                                onClick={() => setDocumentsStageFilter("waiting_signature")}
                                            >
                                                في انتظار التوقيع
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 justify-end">
                                        <Button size="sm" variant="outline" onClick={() => toast({ title: 'تمت الإحالة', description: 'تمت إحالة المستند إلى الإدارة العامة المختصة.' }) }>
                                            إحالة على الإدارة العامة المختصة
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => toast({ title: 'تم إرسال التذكير', description: 'تم إرسال تذكير بالتوقيع على المستندات المتأخرة.' }) }>
                                            تذكير بالتوقيع على المستندات المتأخرة
                                        </Button>
                                        <Button size="sm" onClick={() => setShowDocumentModal(true)}>
                                            إضافة مستند
                                        </Button>
                                    </div>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="text-right">
                                                <TableHead>{t("table.documents.ref")}</TableHead>
                                                <TableHead>{t("table.documents.type")}</TableHead>
                                                <TableHead>{t("table.documents.origin")}</TableHead>
                                                <TableHead>{t("table.documents.stage")}</TableHead>
                                                <TableHead>{t("table.documents.deadline")}</TableHead>
                                                <TableHead>{t("table.documents.urgent")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredDocuments.map((doc) => (
                                                <TableRow key={doc.id} className="text-right">
                                                    <TableCell className="font-medium flex flex-row-reverse items-center gap-2">
                                                        {doc.ref}
                                                        <Button variant="outline" size="sm" type="button" onClick={() => { setEditingDocument(doc); setShowEditDocumentModal(true); }}>
                                                            تعديل
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell>{doc.type}</TableCell>
                                                    <TableCell>{doc.origin}</TableCell>
                                                    <TableCell>{doc.stage}</TableCell>
                                                    <TableCell>{doc.deadline}</TableCell>
                                                    <TableCell>
                                                        {doc.isUrgent ? (
                                                            <Badge variant="destructive">
                                                                {t("badge.urgent")}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-xs text-gray-500">
                                                                {t("table.documents.normal")}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="mt-6">
                                    <h3 className="text-sm font-semibold mb-2 text-gray-700">
                                        توزيع المستندات حسب المرحلة
                                    </h3>
                                    <div className="h-72 flex justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={documentsStageChartData}
                                                    dataKey="count"
                                                    nameKey="stage"
                                                    outerRadius={90}
                                                    innerRadius={50}
                                                    paddingAngle={2}
                                                >
                                                    {documentsStageChartData.map((_, index) => (
                                                        <Cell
                                                            key={index}
                                                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Meetings tab: إضافة رسم للأجتماعات حسب الحالة */}
                    <TabsContent value="meetings">
                        <Card className="text-right">
                            <CardHeader className="items-end">
                                <CardTitle>{t("meetings.tab.title")}</CardTitle>
                                <CardDescription>
                                    {t("meetings.tab.subtitle")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-3">
                                    {t("meetings.tab.stats")
                                        .replace("{total}", String(meetingsStats.total))
                                        .replace("{pending}", String(meetingsStats.followupPending))}
                                </p>

                                <div className="mb-4 space-y-2">
                                    <div className="flex flex-wrap gap-2 justify-end items-center">
                                        <span className="text-sm text-gray-700">
                                            حالة الاجتماع:
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                variant={meetingsStatusFilter === "all" ? "default" : "outline"}
                                                onClick={() => setMeetingsStatusFilter("all")}
                                            >
                                                الكل
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={meetingsStatusFilter === "scheduled" ? "default" : "outline"}
                                                onClick={() => setMeetingsStatusFilter("scheduled")}
                                            >
                                                مبرمج
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={
                                                    meetingsStatusFilter === "in_progress" ? "default" : "outline"
                                                }
                                                onClick={() => setMeetingsStatusFilter("in_progress")}
                                            >
                                                قيد الانعقاد
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={meetingsStatusFilter === "completed" ? "default" : "outline"}
                                                onClick={() => setMeetingsStatusFilter("completed")}
                                            >
                                                منتهٍ
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={
                                                    meetingsStatusFilter === "followup_pending"
                                                        ? "default"
                                                        : "outline"
                                                }
                                                onClick={() => setMeetingsStatusFilter("followup_pending")}
                                            >
                                                بمتابعة معلّقة
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 justify-end items-center">
                                        <span className="text-sm text-gray-700">
                                            حالة المتابعة:
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                variant={meetingsFollowupFilter === "all" ? "default" : "outline"}
                                                onClick={() => setMeetingsFollowupFilter("all")}
                                            >
                                                الكل
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={meetingsFollowupFilter === "pending" ? "default" : "outline"}
                                                onClick={() => setMeetingsFollowupFilter("pending")}
                                            >
                                                متابعة معلّقة
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={
                                                    meetingsFollowupFilter === "completed" ? "default" : "outline"
                                                }
                                                onClick={() => setMeetingsFollowupFilter("completed")}
                                            >
                                                متابعة منجزة
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 justify-end">
                                        <Button size="sm" variant="outline" onClick={() => toast({ title: 'تم إنشاء المحضر', description: 'تم إعداد محضر الاجتماع وإسناد المهام (محاكاة).' }) }>
                                            إعداد محضر اجتماع وإسناد مهام
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => toast({ title: 'تم إرسال التذكير', description: 'تم إرسال تذكير بتنفيذ مخرجات الاجتماعات (محاكاة).' }) }>
                                            إرسال تذكير بتنفيذ مخرجات الاجتماعات
                                        </Button>
                                    </div>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="text-right">
                                                <TableHead>{t("table.meetings.date")}</TableHead>
                                                <TableHead>{t("table.meetings.title")}</TableHead>
                                                <TableHead>{t("table.meetings.organizer")}</TableHead>
                                                <TableHead>{t("table.meetings.type")}</TableHead>
                                                <TableHead>{t("table.meetings.status")}</TableHead>
                                                <TableHead>{t("table.meetings.followup")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredMeetings.map((m) => (
                                                <TableRow key={m.id} className="text-right">
                                                    <TableCell>{m.date}</TableCell>
                                                    <TableCell className="font-medium flex flex-row-reverse items-center gap-2">
                                                        {m.title}
                                                        <Button variant="outline" size="sm" type="button" onClick={() => { setEditingMeeting(m); setShowEditMeetingModal(true); }}>
                                                            تعديل
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell>{m.organizer}</TableCell>
                                                    <TableCell>{m.type}</TableCell>
                                                    <TableCell>{m.status}</TableCell>
                                                    <TableCell>
                                                        {m.followupCompleted ? (
                                                            <Badge>
                                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                {t("badge.completed")}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline">
                                                                {t("badge.pending")}
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="mt-6">
                                    <h3 className="text-sm font-semibold mb-2 text-gray-700">
                                        توزيع الاجتماعات حسب الحالة
                                    </h3>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ReBarChart data={meetingsStatusChartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="status" />
                                                <YAxis allowDecimals={false} />
                                                <Tooltip />
                                                <Bar dataKey="count" fill="#6366f1" name="عدد الاجتماعات" />
                                            </ReBarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Tasks tab – implements “إدارة المهام ذات الأولوية” */}
                    <TabsContent value="tasks">
                        <Card className="text-right">
                            <CardHeader className="items-end">
                                <CardTitle>{t("tasks.tab.title")}</CardTitle>
                                <CardDescription>
                                    {t("tasks.tab.subtitle")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-3">
                                    {t("tasks.tab.stats")
                                        .replace("{total}", String(tasksStats.total))
                                        .replace("{high}", String(tasksStats.highPriority))
                                        .replace("{overdue}", String(tasksStats.overdue))}
                                </p>

                                <div className="mb-4 space-y-2">
                                    <div className="flex flex-wrap gap-2 justify-end items-center">
                                        <span className="text-sm text-gray-700">
                                            درجة الأولوية:
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                variant={tasksPriorityFilter === "all" ? "default" : "outline"}
                                                onClick={() => setTasksPriorityFilter("all")}
                                            >
                                                الكل
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={tasksPriorityFilter === "high" ? "default" : "outline"}
                                                onClick={() => setTasksPriorityFilter("high")}
                                            >
                                                {taskPriorityLabel.high}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={tasksPriorityFilter === "medium" ? "default" : "outline"}
                                                onClick={() => setTasksPriorityFilter("medium")}
                                            >
                                                {taskPriorityLabel.medium}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={tasksPriorityFilter === "low" ? "default" : "outline"}
                                                onClick={() => setTasksPriorityFilter("low")}
                                            >
                                                {taskPriorityLabel.low}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-end items-center">
                                        <span className="text-sm text-gray-700">
                                            حالة الإنجاز:
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                variant={tasksStatusFilter === "all" ? "default" : "outline"}
                                                onClick={() => setTasksStatusFilter("all")}
                                            >
                                                الكل
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={tasksStatusFilter === "not_started" ? "default" : "outline"}
                                                onClick={() => setTasksStatusFilter("not_started")}
                                            >
                                                {taskStatusLabel.not_started}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={tasksStatusFilter === "in_progress" ? "default" : "outline"}
                                                onClick={() => setTasksStatusFilter("in_progress")}
                                            >
                                                {taskStatusLabel.in_progress}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={tasksStatusFilter === "completed" ? "default" : "outline"}
                                                onClick={() => setTasksStatusFilter("completed")}
                                            >
                                                {taskStatusLabel.completed}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={tasksStatusFilter === "overdue" ? "default" : "outline"}
                                                onClick={() => setTasksStatusFilter("overdue")}
                                            >
                                                {taskStatusLabel.overdue}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 justify-end">
                                        <Button size="sm" variant="outline" onClick={handleSortTasksByPriority}>
                                            إعادة ترتيب المهام حسب الأولوية
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={handleSendOverdueTaskReminders}>
                                            إرسال تنبيه بالمهام المتأخرة
                                        </Button>
                                    </div>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="text-right">
                                                <TableHead>{t("table.tasks.title")}</TableHead>
                                                <TableHead>{t("table.tasks.owner")}</TableHead>
                                                <TableHead>{t("table.tasks.priority")}</TableHead>
                                                <TableHead>{t("table.tasks.status")}</TableHead>
                                                <TableHead>{t("table.tasks.dueDate")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredTasks.map((tTask) => (
                                                <TableRow key={tTask.id} className="text-right cursor-pointer hover:bg-gray-50" onClick={() => { setEditingTask(tTask); setShowEditTaskModal(true); }}>
                                                    <TableCell className="font-medium flex flex-row-reverse items-center gap-2">
                                                        {tTask.title}
                                                        <Button variant="outline" size="sm" type="button" onClick={(e) => { e.stopPropagation(); setEditingTask(tTask); setShowEditTaskModal(true); }}>
                                                            تعديل
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell>{tTask.owner}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                tTask.priority === "high"
                                                                    ? "destructive"
                                                                    : tTask.priority === "medium"
                                                                    ? "default"
                                                                    : "outline"
                                                            }
                                                        >
                                                            {taskPriorityLabel[tTask.priority]}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{taskStatusLabel[tTask.status]}</TableCell>
                                                    <TableCell>{tTask.dueDate}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Reports tab – “إصدار تقارير حول العمليات الإدارية” */}
                    <TabsContent value="reports">
                        <Card className="text-right">
                            <CardHeader className="items-end">
                                <CardTitle>{t("reports.tab.title")}</CardTitle>
                                <CardDescription>
                                    {t("reports.tab.subtitle")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="text-right">
                                        <h3 className="text-sm font-semibold mb-2 text-gray-700">
                                            {t("reports.chart.onTime")}
                                        </h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ReBarChart data={directoratePerformance}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis domain={[0, 100]} />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="onTimeRate" fill="#16a34a" name={t("reports.chart.onTimeLegend")} />
                                                </ReBarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-sm font-semibold mb-2 text-gray-700">
                                            {t("reports.chart.avgTime")}
                                        </h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ReBarChart data={directoratePerformance}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar
                                                        dataKey="avgDecisionTimeDays"
                                                        fill="#f97316"
                                                        name={t("reports.chart.avgTimeLegend")}
                                                    />
                                                </ReBarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row-reverse">
                                    <Button size="sm" onClick={() => handleExportDetailed()}>{t("btn.exportDetailed")}</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
                {/* Global Modals (meeting & task) */}
                <Dialog open={showMeetingModal} onOpenChange={setShowMeetingModal}>
                    <DialogContent dir={dir} className="text-right">
                        <DialogHeader>
                            <DialogTitle>{t("btn.newMeeting")}</DialogTitle>
                            <DialogDescription>
                                أدخل بيانات الاجتماع ثم اضغط حفظ لإضافته للقائمة.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            onSubmit={async (e: FormEvent) => {
                                e.preventDefault();
                                if (!newMeeting.title || !newMeeting.date) return;

                                // Optimistic update
                                const tempId = Date.now();
                                const item: Meeting = {
                                    id: tempId,
                                    title: newMeeting.title,
                                    date: newMeeting.date,
                                    organizer: newMeeting.organizer || "غير محدد",
                                    type: newMeeting.type || "اجتماع",
                                    status: "scheduled",
                                    followupCompleted: false,
                                };
                                setMeetingsData(prev => [item, ...prev]);
                                setNewMeeting({ title: '', date: '', organizer: '', type: '' });
                                setShowMeetingModal(false);

                                try {
                                    const response = await api.post('/secretary/meetings/', {
                                        title: newMeeting.title,
                                        meeting_date: newMeeting.date,
                                        agenda: newMeeting.type || newMeeting.organizer || "",
                                    });
                                    // Replace optimistic item with real one
                                    setMeetingsData(prev =>
                                        prev.map(m => (m.id === tempId ? response.data : m))
                                    );
                                } catch (error) {
                                    console.error("Failed to create meeting:", error);
                                    // Revert on failure
                                    setMeetingsData(prev => prev.filter(m => m.id !== tempId));
                                }
                            }}
                            className="space-y-3"
                        >
                            <div className="space-y-1">
                                <label className="text-sm font-medium">عنوان الاجتماع</label>
                                <input
                                    className="w-full border rounded px-2 py-1 text-sm"
                                    value={newMeeting.title}
                                    onChange={(e) => setNewMeeting(m => ({ ...m, title: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">التاريخ والوقت</label>
                                <input
                                    type="datetime-local"
                                    className="w-full border rounded px-2 py-1 text-sm"
                                    value={newMeeting.date}
                                    onChange={(e) => setNewMeeting(m => ({ ...m, date: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">المنظم</label>
                                <input
                                    className="w-full border rounded px-2 py-1 text-sm"
                                    value={newMeeting.organizer}
                                    onChange={(e) => setNewMeeting(m => ({ ...m, organizer: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">النوع</label>
                                <input
                                    className="w-full border rounded px-2 py-1 text-sm"
                                    value={newMeeting.type}
                                    onChange={(e) => setNewMeeting(m => ({ ...m, type: e.target.value }))}
                                />
                            </div>
                            <DialogFooter className="flex flex-row-reverse gap-2">
                                <Button type="submit" size="sm">حفظ الاجتماع</Button>
                                <Button size="sm" variant="outline" type="button" onClick={() => setShowMeetingModal(false)}>إلغاء</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                {/* Create Decision Modal */}
                <Dialog open={showDecisionModal} onOpenChange={setShowDecisionModal}>
                    <DialogContent dir={dir} className="text-right">
                        <DialogHeader>
                            <DialogTitle>إضافة قرار وزاري</DialogTitle>
                            <DialogDescription>أدخل تفاصيل القرار ثم احفظ.</DialogDescription>
                        </DialogHeader>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const tempId = Date.now();
                                const item: Decision = {
                                    id: tempId,
                                    ref: String(newDecision.ref || ''),
                                    title: String(newDecision.title || ''),
                                    sector: String(newDecision.sector || ''),
                                    unit: String(newDecision.unit || ''),
                                    deadline: String(newDecision.deadline || ''),
                                    status: (newDecision.status as DecisionStatus) || 'draft',
                                    progress: Number(newDecision.progress ?? 0),
                                };
                                if (!item.ref || !item.title) return;
                                setDecisionsData(prev => [item, ...prev]);
                                setShowDecisionModal(false);
                                try {
                                    const resp = await api.post('/secretary/decisions/', {
                                        ref: item.ref,
                                        title: item.title,
                                        sector: item.sector,
                                        unit: item.unit,
                                        deadline: item.deadline,
                                        status: item.status,
                                        progress: item.progress,
                                    });
                                    setDecisionsData(prev => prev.map(d => d.id === tempId ? resp.data : d));
                                } catch (err) {
                                    console.error('Failed to create decision', err);
                                    setDecisionsData(prev => prev.filter(d => d.id !== tempId));
                                }
                            }}
                            className="space-y-3"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">المرجع</label>
                                    <input className="w-full border rounded px-2 py-1 text-sm" value={newDecision.ref as string} onChange={(e)=> setNewDecision(s=>({...s, ref: e.target.value}))} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">الموضوع</label>
                                    <input className="w-full border rounded px-2 py-1 text-sm" value={newDecision.title as string} onChange={(e)=> setNewDecision(s=>({...s, title: e.target.value}))} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">القطاع</label>
                                    <input className="w-full border rounded px-2 py-1 text-sm" value={newDecision.sector as string} onChange={(e)=> setNewDecision(s=>({...s, sector: e.target.value}))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">الهيكل المسؤول</label>
                                    <input className="w-full border rounded px-2 py-1 text-sm" value={newDecision.unit as string} onChange={(e)=> setNewDecision(s=>({...s, unit: e.target.value}))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">تاريخ الاستحقاق</label>
                                    <input type="date" className="w-full border rounded px-2 py-1 text-sm" value={newDecision.deadline as string} onChange={(e)=> setNewDecision(s=>({...s, deadline: e.target.value}))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">الحالة</label>
                                    <select className="w-full border rounded px-2 py-1 text-sm" value={newDecision.status as string} onChange={(e)=> setNewDecision(s=>({...s, status: e.target.value as DecisionStatus}))}>
                                        <option value="draft">مسودة</option>
                                        <option value="in_review">قيد المراجعة</option>
                                        <option value="in_implementation">قيد التنفيذ</option>
                                        <option value="completed">منجزة</option>
                                        <option value="overdue">متأخرة</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">نسبة التقدم</label>
                                <input type="number" min={0} max={100} className="w-full border rounded px-2 py-1 text-sm" value={Number(newDecision.progress ?? 0)} onChange={(e)=> setNewDecision(s=>({...s, progress: Number(e.target.value)}))} />
                            </div>
                            <DialogFooter className="flex flex-row-reverse gap-2">
                                <Button type="submit" size="sm">حفظ القرار</Button>
                                <Button size="sm" variant="outline" type="button" onClick={()=> setShowDecisionModal(false)}>إلغاء</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Decision Modal */}
                <Dialog open={showEditDecisionModal} onOpenChange={setShowEditDecisionModal}>
                    <DialogContent dir={dir} className="text-right max-w-md">
                        <DialogHeader>
                            <DialogTitle>تعديل القرار</DialogTitle>
                            <DialogDescription>تحيين معطيات القرار.</DialogDescription>
                        </DialogHeader>
                        {editingDecision && (
                            <form
                                onSubmit={async (e)=>{
                                    e.preventDefault();
                                    try {
                                        const payload = {
                                            ref: editingDecision.ref,
                                            title: editingDecision.title,
                                            sector: editingDecision.sector,
                                            unit: editingDecision.unit,
                                            deadline: editingDecision.deadline,
                                            status: editingDecision.status,
                                            progress: editingDecision.progress,
                                        };
                                        await api.patch(`/secretary/decisions/${editingDecision.id}/`, payload);
                                        setDecisionsData(prev => prev.map(d => d.id === editingDecision.id ? { ...editingDecision } : d));
                                        setShowEditDecisionModal(false);
                                        setEditingDecision(null);
                                    } catch (err) {
                                        console.error('Failed to update decision', err);
                                    }
                                }}
                                className="space-y-3"
                            >
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">المرجع</label>
                                        <input className="w-full border rounded px-2 py-1 text-sm" value={editingDecision.ref} onChange={(e)=> setEditingDecision(d => d ? ({...d, ref: e.target.value}) : d)} required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">الموضوع</label>
                                        <input className="w-full border rounded px-2 py-1 text-sm" value={editingDecision.title} onChange={(e)=> setEditingDecision(d => d ? ({...d, title: e.target.value}) : d)} required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">القطاع</label>
                                        <input className="w-full border rounded px-2 py-1 text-sm" value={editingDecision.sector} onChange={(e)=> setEditingDecision(d => d ? ({...d, sector: e.target.value}) : d)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">الهيكل المسؤول</label>
                                        <input className="w-full border rounded px-2 py-1 text-sm" value={editingDecision.unit} onChange={(e)=> setEditingDecision(d => d ? ({...d, unit: e.target.value}) : d)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">تاريخ الاستحقاق</label>
                                        <input type="date" className="w-full border rounded px-2 py-1 text-sm" value={editingDecision.deadline} onChange={(e)=> setEditingDecision(d => d ? ({...d, deadline: e.target.value}) : d)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">الحالة</label>
                                        <select className="w-full border rounded px-2 py-1 text-sm" value={editingDecision.status} onChange={(e)=> setEditingDecision(d => d ? ({...d, status: e.target.value as DecisionStatus}) : d)}>
                                            <option value="draft">مسودة</option>
                                            <option value="in_review">قيد المراجعة</option>
                                            <option value="in_implementation">قيد التنفيذ</option>
                                            <option value="completed">منجزة</option>
                                            <option value="overdue">متأخرة</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">نسبة التقدم</label>
                                    <input type="number" min={0} max={100} className="w-full border rounded px-2 py-1 text-sm" value={editingDecision.progress} onChange={(e)=> setEditingDecision(d => d ? ({...d, progress: Number(e.target.value)}) : d)} />
                                </div>
                                <DialogFooter className="flex flex-row-reverse gap-2">
                                    <Button type="submit" size="sm">حفظ</Button>
                                    <Button type="button" size="sm" variant="outline" onClick={()=> { setShowEditDecisionModal(false); setEditingDecision(null); }}>إلغاء</Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Create Document Modal */}
                <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
                    <DialogContent dir={dir} className="text-right">
                        <DialogHeader>
                            <DialogTitle>إضافة مستند</DialogTitle>
                            <DialogDescription>أدخل تفاصيل المستند ثم احفظ.</DialogDescription>
                        </DialogHeader>
                        <form
                            onSubmit={async (e)=>{
                                e.preventDefault();
                                const tempId = Date.now();
                                const item: DocumentItem = {
                                    id: tempId,
                                    ref: String(newDocument.ref || ''),
                                    type: String(newDocument.type || ''),
                                    origin: String(newDocument.origin || ''),
                                    stage: (newDocument.stage as DocumentStage) || 'received',
                                    deadline: String(newDocument.deadline || ''),
                                    isUrgent: Boolean(newDocument.isUrgent),
                                };
                                if (!item.ref || !item.type) return;
                                setDocumentsData(prev => [item, ...prev]);
                                setShowDocumentModal(false);
                                try {
                                    const resp = await api.post('/secretary/documents/', {
                                        ref: item.ref,
                                        document_type: item.type,
                                        origin: item.origin,
                                        stage: item.stage,
                                        deadline: item.deadline || null,
                                        is_urgent: item.isUrgent,
                                    });
                                    setDocumentsData(prev => prev.map(d => d.id === tempId ? {
                                        id: resp.data.id,
                                        ref: resp.data.ref,
                                        type: resp.data.document_type,
                                        origin: resp.data.origin,
                                        stage: resp.data.stage,
                                        deadline: resp.data.deadline || '',
                                        isUrgent: !!resp.data.is_urgent,
                                    } : d));
                                } catch (err) {
                                    console.error('Failed to create document', err);
                                    setDocumentsData(prev => prev.filter(d => d.id !== tempId));
                                }
                            }}
                            className="space-y-3"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">المرجع</label>
                                    <input className="w-full border rounded px-2 py-1 text-sm" value={newDocument.ref as string} onChange={(e)=> setNewDocument(s=>({...s, ref: e.target.value}))} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">نوع المستند</label>
                                    <input className="w-full border rounded px-2 py-1 text-sm" value={newDocument.type as string} onChange={(e)=> setNewDocument(s=>({...s, type: e.target.value}))} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">الجهة الواردة</label>
                                    <input className="w-full border rounded px-2 py-1 text-sm" value={newDocument.origin as string} onChange={(e)=> setNewDocument(s=>({...s, origin: e.target.value}))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">المرحلة</label>
                                    <select className="w-full border rounded px-2 py-1 text-sm" value={newDocument.stage as string} onChange={(e)=> setNewDocument(s=>({...s, stage: e.target.value as DocumentStage}))}>
                                        <option value="received">واردة</option>
                                        <option value="processing">قيد المعالجة</option>
                                        <option value="waiting_signature">في انتظار التوقيع</option>
                                        <option value="archived">مؤرشفة</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">تاريخ الاستحقاق</label>
                                    <input type="date" className="w-full border rounded px-2 py-1 text-sm" value={newDocument.deadline as string} onChange={(e)=> setNewDocument(s=>({...s, deadline: e.target.value}))} />
                                </div>
                                <div className="space-y-1 flex items-center gap-2">
                                    <input type="checkbox" checked={!!newDocument.isUrgent} onChange={(e)=> setNewDocument(s=>({...s, isUrgent: e.target.checked}))} />
                                    <span className="text-sm">مستعجل</span>
                                </div>
                            </div>
                            <DialogFooter className="flex flex-row-reverse gap-2">
                                <Button type="submit" size="sm">حفظ المستند</Button>
                                <Button size="sm" variant="outline" type="button" onClick={()=> setShowDocumentModal(false)}>إلغاء</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Document Modal */}
                <Dialog open={showEditDocumentModal} onOpenChange={setShowEditDocumentModal}>
                    <DialogContent dir={dir} className="text-right max-w-md">
                        <DialogHeader>
                            <DialogTitle>تعديل المستند</DialogTitle>
                            <DialogDescription>تحيين معطيات المستند.</DialogDescription>
                        </DialogHeader>
                        {editingDocument && (
                            <form
                                onSubmit={async (e)=>{
                                    e.preventDefault();
                                    try {
                                        const payload = {
                                            ref: editingDocument.ref,
                                            document_type: editingDocument.type,
                                            origin: editingDocument.origin,
                                            stage: editingDocument.stage,
                                            deadline: editingDocument.deadline || null,
                                            is_urgent: editingDocument.isUrgent,
                                        };
                                        const resp = await api.patch(`/secretary/documents/${editingDocument.id}/`, payload);
                                        const updated: DocumentItem = {
                                            id: resp.data.id,
                                            ref: resp.data.ref,
                                            type: resp.data.document_type,
                                            origin: resp.data.origin,
                                            stage: resp.data.stage,
                                            deadline: resp.data.deadline || '',
                                            isUrgent: !!resp.data.is_urgent,
                                        };
                                        setDocumentsData(prev => prev.map(d => d.id === editingDocument.id ? updated : d));
                                        setShowEditDocumentModal(false);
                                        setEditingDocument(null);
                                    } catch (err) {
                                        console.error('Failed to update document', err);
                                    }
                                }}
                                className="space-y-3"
                            >
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">المرجع</label>
                                        <input className="w-full border rounded px-2 py-1 text-sm" value={editingDocument.ref} onChange={(e)=> setEditingDocument(d => d ? ({...d, ref: e.target.value}) : d)} required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">نوع المستند</label>
                                        <input className="w-full border rounded px-2 py-1 text-sm" value={editingDocument.type} onChange={(e)=> setEditingDocument(d => d ? ({...d, type: e.target.value}) : d)} required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">الجهة الواردة</label>
                                        <input className="w-full border rounded px-2 py-1 text-sm" value={editingDocument.origin} onChange={(e)=> setEditingDocument(d => d ? ({...d, origin: e.target.value}) : d)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">المرحلة</label>
                                        <select className="w-full border rounded px-2 py-1 text-sm" value={editingDocument.stage} onChange={(e)=> setEditingDocument(d => d ? ({...d, stage: e.target.value as DocumentStage}) : d)}>
                                            <option value="received">واردة</option>
                                            <option value="processing">قيد المعالجة</option>
                                            <option value="waiting_signature">في انتظار التوقيع</option>
                                            <option value="archived">مؤرشفة</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">تاريخ الاستحقاق</label>
                                        <input type="date" className="w-full border rounded px-2 py-1 text-sm" value={editingDocument.deadline} onChange={(e)=> setEditingDocument(d => d ? ({...d, deadline: e.target.value}) : d)} />
                                    </div>
                                    <div className="space-y-1 flex items-center gap-2">
                                        <input type="checkbox" checked={!!editingDocument.isUrgent} onChange={(e)=> setEditingDocument(d => d ? ({...d, isUrgent: e.target.checked}) : d)} />
                                        <span className="text-sm">مستعجل</span>
                                    </div>
                                </div>
                                <DialogFooter className="flex flex-row-reverse gap-2">
                                    <Button type="submit" size="sm">حفظ</Button>
                                    <Button type="button" size="sm" variant="outline" onClick={()=> { setShowEditDocumentModal(false); setEditingDocument(null); }}>إلغاء</Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Edit Meeting Modal */}
                <Dialog open={showEditMeetingModal} onOpenChange={setShowEditMeetingModal}>
                    <DialogContent dir={dir} className="text-right max-w-md">
                        <DialogHeader>
                            <DialogTitle>تعديل الاجتماع</DialogTitle>
                            <DialogDescription>تحيين معطيات الاجتماع.</DialogDescription>
                        </DialogHeader>
                        {editingMeeting && (
                            <form
                                onSubmit={async (e)=>{
                                    e.preventDefault();
                                    try {
                                        const payload: any = {
                                            title: editingMeeting.title,
                                            meeting_date: editingMeeting.date,
                                            organizer: editingMeeting.organizer,
                                            meeting_type: editingMeeting.type,
                                            status: editingMeeting.status,
                                            followup_completed: editingMeeting.followupCompleted,
                                        };
                                        await api.patch(`/secretary/meetings/${editingMeeting.id}/`, payload);
                                        setMeetingsData(prev => prev.map(m => m.id === editingMeeting.id ? { ...editingMeeting } : m));
                                        setShowEditMeetingModal(false);
                                        setEditingMeeting(null);
                                    } catch (err) {
                                        console.error('Failed to update meeting', err);
                                    }
                                }}
                                className="space-y-3"
                            >
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">عنوان الاجتماع</label>
                                    <input className="w-full border rounded px-2 py-1 text-sm" value={editingMeeting.title} onChange={(e)=> setEditingMeeting(m => m ? ({...m, title: e.target.value}) : m)} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">التاريخ والوقت</label>
                                    <input type="datetime-local" className="w-full border rounded px-2 py-1 text-sm" value={editingMeeting.date} onChange={(e)=> setEditingMeeting(m => m ? ({...m, date: e.target.value}) : m)} required />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">المنظم</label>
                                        <input className="w-full border rounded px-2 py-1 text-sm" value={editingMeeting.organizer} onChange={(e)=> setEditingMeeting(m => m ? ({...m, organizer: e.target.value}) : m)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">النوع</label>
                                        <input className="w-full border rounded px-2 py-1 text-sm" value={editingMeeting.type} onChange={(e)=> setEditingMeeting(m => m ? ({...m, type: e.target.value}) : m)} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">الحالة</label>
                                        <select className="w-full border rounded px-2 py-1 text-sm" value={editingMeeting.status} onChange={(e)=> setEditingMeeting(m => m ? ({...m, status: e.target.value as MeetingStatus}) : m)}>
                                            <option value="scheduled">مبرمج</option>
                                            <option value="in_progress">قيد الانعقاد</option>
                                            <option value="completed">منتهٍ</option>
                                            <option value="followup_pending">بمتابعة معلّقة</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1 flex items-center gap-2">
                                        <input type="checkbox" checked={!!editingMeeting.followupCompleted} onChange={(e)=> setEditingMeeting(m => m ? ({...m, followupCompleted: e.target.checked}) : m)} />
                                        <span className="text-sm">المتابعة منجزة</span>
                                    </div>
                                </div>
                                <DialogFooter className="flex flex-row-reverse gap-2">
                                    <Button type="submit" size="sm">حفظ</Button>
                                    <Button type="button" size="sm" variant="outline" onClick={()=> { setShowEditMeetingModal(false); setEditingMeeting(null); }}>إلغاء</Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
                    <DialogContent dir={dir} className="text-right">
                        <DialogHeader>
                            <DialogTitle>{t("btn.newTask")}</DialogTitle>
                            <DialogDescription>
                                أضف مهمة ذات أولوية مع تحديد الجهة المكلفة وتاريخ الاستحقاق.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            onSubmit={async (e: FormEvent) => {
                                e.preventDefault();
                                if (!newTask.title || !newTask.dueDate) return;

                                // Optimistically add to UI
                                const tempId = Date.now();
                                const item: PriorityTask = {
                                    id: tempId,
                                    title: newTask.title,
                                    owner: newTask.owner || "غير محدد",
                                    priority: newTask.priority as TaskPriority,
                                    status: "not_started",
                                    dueDate: newTask.dueDate,
                                };
                                setTasksData(prev => [item, ...prev]);
                                setShowTaskModal(false);
                                setNewTask({ title: '', owner: '', priority: 'high', dueDate: '' });

                                try {
                                    // Send to backend
                                    const response = await api.post('/secretary/tasks/', {
                                        title: newTask.title,
                                        description: newTask.owner ? `Responsible: ${newTask.owner} | Priority: ${newTask.priority}` : undefined,
                                        due_date: newTask.dueDate,
                                    });

                                    // Replace optimistic item with real one from server
                                    setTasksData(prev =>
                                        prev.map(t => (t.id === tempId ? response.data : t))
                                    );
                                } catch (error) {
                                    console.error("Failed to create task:", error);
                                    // Revert optimistic update on failure
                                    setTasksData(prev => prev.filter(t => t.id !== tempId));
                                    // Optionally, show an error message to the user
                                }
                            }}
                            className="space-y-3"
                        >
                            <div className="space-y-1">
                                <label className="text-sm font-medium">عنوان المهمة</label>
                                <input
                                    className="w-full border rounded px-2 py-1 text-sm"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask(m => ({ ...m, title: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">الجهة المكلفة</label>
                                <input
                                    className="w-full border rounded px-2 py-1 text-sm"
                                    value={newTask.owner}
                                    onChange={(e) => setNewTask(m => ({ ...m, owner: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">درجة الأولوية</label>
                                <select
                                    className="w-full border rounded px-2 py-1 text-sm"
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask(m => ({ ...m, priority: e.target.value as TaskPriority }))}
                                >
                                    <option value="high">عالية</option>
                                    <option value="medium">متوسطة</option>
                                    <option value="low">منخفضة</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">تاريخ الاستحقاق</label>
                                <input
                                    type="date"
                                    className="w-full border rounded px-2 py-1 text-sm"
                                    value={newTask.dueDate}
                                    onChange={(e) => setNewTask(m => ({ ...m, dueDate: e.target.value }))}
                                    required
                                />
                            </div>
                            <DialogFooter className="flex flex-row-reverse gap-2">
                                <Button type="submit" size="sm">حفظ المهمة</Button>
                                <Button size="sm" variant="outline" type="button" onClick={() => setShowTaskModal(false)}>إلغاء</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                {/* Edit Task Modal */}
                <Dialog open={showEditTaskModal} onOpenChange={setShowEditTaskModal}>
                    <DialogContent dir={dir} className="text-right max-w-md">
                        <DialogHeader>
                            <DialogTitle>تعديل المهمة</DialogTitle>
                            <DialogDescription>تحيين خصائص المهمة المختارة.</DialogDescription>
                        </DialogHeader>
                        {editingTask && (
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    try {
                                        const payload = {
                                            title: editingTask.title,
                                            owner: editingTask.owner,
                                            priority: editingTask.priority,
                                            status: editingTask.status,
                                            due_date: editingTask.dueDate || null,
                                        };
                                        await api.patch(`/secretary/tasks/${editingTask.id}/`, payload);
                                        setTasksData(prev => prev.map(t => t.id === editingTask.id ? { ...editingTask } : t));
                                        setShowEditTaskModal(false);
                                        setEditingTask(null);
                                    } catch (err) {
                                        console.error('Failed to update task', err);
                                    }
                                }}
                                className="space-y-3"
                            >
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">عنوان</label>
                                    <input
                                        className="w-full border rounded px-2 py-1 text-sm"
                                        value={editingTask.title}
                                        onChange={(e) => setEditingTask(t => t ? { ...t, title: e.target.value } : t)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">الجهة المكلفة</label>
                                    <input
                                        className="w-full border rounded px-2 py-1 text-sm"
                                        value={editingTask.owner}
                                        onChange={(e) => setEditingTask(t => t ? { ...t, owner: e.target.value } : t)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">الأولوية</label>
                                        <select
                                            className="w-full border rounded px-2 py-1 text-sm"
                                            value={editingTask.priority}
                                            onChange={(e) => setEditingTask(t => t ? { ...t, priority: e.target.value as TaskPriority } : t)}
                                        >
                                            <option value="high">عالية</option>
                                            <option value="medium">متوسطة</option>
                                            <option value="low">منخفضة</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">الحالة</label>
                                        <select
                                            className="w-full border rounded px-2 py-1 text-sm"
                                            value={editingTask.status}
                                            onChange={(e) => setEditingTask(t => t ? { ...t, status: e.target.value as TaskStatus } : t)}
                                        >
                                            <option value="not_started">لم تنطلق</option>
                                            <option value="in_progress">قيد الإنجاز</option>
                                            <option value="completed">منجزة</option>
                                            <option value="overdue">متأخرة</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">تاريخ الاستحقاق</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded px-2 py-1 text-sm"
                                        value={editingTask.dueDate}
                                        onChange={(e) => setEditingTask(t => t ? { ...t, dueDate: e.target.value } : t)}
                                    />
                                </div>
                                <DialogFooter className="flex flex-row-reverse gap-2">
                                    <Button type="submit" size="sm">حفظ</Button>
                                    <Button type="button" size="sm" variant="outline" onClick={() => { setShowEditTaskModal(false); setEditingTask(null); }}>إلغاء</Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
};

export default SecretaryDashboard;

