'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    AreaChart, Area, Cell, PieChart, Pie,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
    DollarSign, FileText, Briefcase, TrendingUp, MoreVertical,
    Calendar, ChevronLeft, ChevronRight, ArrowRight,
} from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────

const stats = [
    { icon: DollarSign, value1: '45', value2: '/76', title: 'Invoices Awaiting Payment', label: 'Invoices Awaiting', amount: '$5,569', percentage: 56, progressColor: 'bg-primary' },
    { icon: FileText, value1: '48', value2: '/86', title: 'Converted Leads', label: 'Converted Leads', amount: '52 Completed', percentage: 63, progressColor: 'bg-amber-500' },
    { icon: Briefcase, value1: '16', value2: '/20', title: 'Projects In Progress', label: 'Projects In Progress', amount: '16 Completed', percentage: 78, progressColor: 'bg-emerald-500' },
    { icon: TrendingUp, value1: '46.59', value2: '%', title: 'Conversion Rate', label: 'Conversion Rate', amount: '$2,254', percentage: 46, progressColor: 'bg-rose-500' },
];

const paymentBarData = [
    { month: 'Jan', value: 30 }, { month: 'Feb', value: 40 }, { month: 'Mar', value: 45 },
    { month: 'Apr', value: 50 }, { month: 'May', value: 49 }, { month: 'Jun', value: 60 },
    { month: 'Jul', value: 70 }, { month: 'Aug', value: 91 }, { month: 'Sep', value: 125 },
];

const sparklineData = [
    { v: 25 }, { v: 66 }, { v: 41 }, { v: 89 }, { v: 63 }, { v: 25 }, { v: 44 }, { v: 12 }, { v: 36 },
];

const donutData = [
    { name: 'New', value: 20, color: '#3454d1' },
    { name: 'Contacted', value: 15, color: '#7c3aed' },
    { name: 'Qualified', value: 10, color: '#0891b2' },
    { name: 'Working', value: 18, color: '#10b981' },
    { name: 'Other', value: 10, color: '#f59e0b' },
];

const miniStats = [
    { label: 'Tasks Completed', value: '22/35', percent: 28, color: '#3454d1', data: [{ v: 10 }, { v: 15 }, { v: 12 }, { v: 18 }, { v: 20 }, { v: 25 }, { v: 22 }] },
    { label: 'New Leads', value: '48/100', percent: 34, color: '#10b981', data: [{ v: 5 }, { v: 8 }, { v: 6 }, { v: 10 }, { v: 7 }, { v: 12 }, { v: 9 }] },
    { label: 'Average Revenue', value: '$2,245', percent: 42, color: '#e11d48', data: [{ v: 20 }, { v: 22 }, { v: 25 }, { v: 24 }, { v: 28 }, { v: 30 }, { v: 27 }] },
];

const leads = [
    { id: 1, name: 'Archie Cantones', email: 'arcie.tones@gmail.com', avatar: 'https://i.pravatar.cc/40?img=5', proposal: 'Sent', date: '11/06/2023 10:53', status: 'Completed' },
    { id: 2, name: 'Holmes Cherryman', email: 'golms.chan@gmail.com', avatar: 'https://i.pravatar.cc/40?img=6', proposal: 'New', date: '11/06/2023 10:53', status: 'In Progress' },
    { id: 3, name: 'Malanie Hanvey', email: 'lanie.nveyn@gmail.com', avatar: 'https://i.pravatar.cc/40?img=3', proposal: 'Sent', date: '11/06/2023 10:53', status: 'Completed' },
    { id: 4, name: 'Kenneth Hune', email: 'nneth.une@gmail.com', avatar: 'https://i.pravatar.cc/40?img=4', proposal: 'Returning', date: '11/06/2023 10:53', status: 'Not Interested' },
    { id: 5, name: 'Valentine Maton', email: 'alenine.aton@gmail.com', avatar: 'https://i.pravatar.cc/40?img=2', proposal: 'Sent', date: '11/06/2023 10:53', status: 'Completed' },
];

const schedule = [
    { day: 20, month: 'Dec', title: 'React Dashboard Design', time: '11:30am - 12:30pm', avatars: [1, 2, 3, 4], bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary' },
    { day: 30, month: 'Dec', title: 'Admin Design Concept', time: '10:00am - 12:00pm', avatars: [2, 3, 5], bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500' },
    { day: 17, month: 'Dec', title: 'Standup Team Meeting', time: '8:00am - 9:00am', avatars: [1, 2, 3], bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500' },
    { day: 25, month: 'Dec', title: 'Zoom Team Meeting', time: '03:30pm - 05:30pm', avatars: [2, 4, 5], bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-500' },
];

const projects = [
    { name: 'Apps Development', type: 'Applications', percent: 54, img: 'https://www.google.com/s2/favicons?sz=64&domain=apple.com' },
    { name: 'Dashboard Design', type: 'App UI Kit', percent: 86, img: 'https://www.google.com/s2/favicons?sz=64&domain=figma.com' },
    { name: 'Facebook Marketing', type: 'Marketing', percent: 90, img: 'https://www.google.com/s2/favicons?sz=64&domain=facebook.com' },
    { name: 'React Dashboard Github', type: 'Dashboard', percent: 37, img: 'https://www.google.com/s2/favicons?sz=64&domain=github.com' },
    { name: 'Paypal Payment Gateway', type: 'Payment', percent: 29, img: 'https://www.google.com/s2/favicons?sz=64&domain=paypal.com' },
];

const team = [
    { name: 'Alexandra Della', role: 'Frontend Developer', avatar: 'https://i.pravatar.cc/40?img=1', progress: 75, color: 'bg-primary' },
    { name: 'Archie Cantones', role: 'UI/UX Designer', avatar: 'https://i.pravatar.cc/40?img=5', progress: 90, color: 'bg-emerald-500' },
    { name: 'Malanie Hanvey', role: 'Backend Developer', avatar: 'https://i.pravatar.cc/40?img=3', progress: 68, color: 'bg-amber-500' },
    { name: 'Kenneth Hune', role: 'Digital Marketer', avatar: 'https://i.pravatar.cc/40?img=4', progress: 55, color: 'bg-violet-500' },
];

const BADGE_MAP: Record<string, string> = {
    Completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'In Progress': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'Not Interested': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    Sent: 'bg-muted text-muted-foreground border-border',
    New: 'bg-primary/10 text-primary border-primary/20',
    Returning: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    return (
        <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${BADGE_MAP[status] ?? 'bg-muted text-muted-foreground'}`}>
            {status}
        </Badge>
    );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
    return (
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${value}%` }} />
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VendorDashboardPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const isDark = mounted && resolvedTheme === 'dark';

    const mutedColor = isDark ? '#334155' : '#e2e8f0';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const primaryColor = '#3454d1';

    return (
        <div className="space-y-6">

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {stats.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <Card key={i} className="border-border shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-muted flex items-center justify-center rounded-full size-10 shrink-0">
                                            <Icon className="size-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-0.5">
                                                <span className="text-2xl font-bold">{s.value1}</span>
                                                <span className="text-2xl font-bold">{s.value2}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">{s.title}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="size-7 text-muted-foreground/50">
                                        <MoreVertical className="size-4" />
                                    </Button>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs text-muted-foreground">{s.label}</span>
                                        <span className="text-xs text-muted-foreground">{s.amount} ({s.percentage}%)</span>
                                    </div>
                                    <ProgressBar value={s.percentage} color={s.progressColor} />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart */}
                <Card className="lg:col-span-2 border-border shadow-sm flex flex-col overflow-hidden">
                    <CardHeader className="px-6 py-4 border-b border-border flex flex-row justify-between items-center space-y-0">
                        <CardTitle className="font-bold text-[15px]">Payment Records</CardTitle>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><MoreVertical className="size-4" /></Button>
                    </CardHeader>
                    <CardContent className="p-6 flex-1">
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={paymentBarData} barSize={20}>
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 11 }} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ background: isDark ? '#1e293b' : '#fff', border: 'none', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                                        labelStyle={{ color: textColor, fontWeight: 600 }}
                                        cursor={{ fill: mutedColor, opacity: 0.5 }}
                                    />
                                    <Bar dataKey="value" fill={primaryColor} radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                    <CardFooter className="px-6 py-4 border-t border-border bg-muted/20">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                            {[
                                { label: 'Awaiting', value: '$5,486', color: '#3454d1', w: 81 },
                                { label: 'Completed', value: '$10,275', color: '#10b981', w: 82 },
                                { label: 'Rejected', value: '$3,868', color: '#e11d48', w: 68 },
                                { label: 'Revenue', value: '$50,668', color: isDark ? '#f8fafc' : '#0f172a', w: 75 },
                            ].map((item) => (
                                <div key={item.label} className="space-y-1.5">
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                                    <p className="text-[15px] font-bold text-foreground">{item.value}</p>
                                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all" style={{ width: `${item.w}%`, backgroundColor: item.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardFooter>
                </Card>

                {/* Total Sales + mini list */}
                <div className="flex flex-col gap-6">
                    <Card className="bg-primary text-primary-foreground border-none relative overflow-hidden h-[185px] shadow-lg">
                        <CardContent className="p-6 h-full flex flex-col justify-between relative z-10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-xl" />
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-3xl font-bold">30,569</p>
                                    <p className="text-[13px] font-semibold opacity-80 uppercase tracking-wider mt-1">Total Sales Overall</p>
                                </div>
                                <Badge className="bg-white/20 hover:bg-white/30 text-white border-transparent text-[11px] font-bold">+12.5%</Badge>
                            </div>
                            <div className="h-[55px] opacity-50">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={sparklineData}>
                                        <Area type="monotone" dataKey="v" stroke="#fff" strokeWidth={2} fill="#fff" fillOpacity={0.15} dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex-1 border-border shadow-sm overflow-hidden p-0">
                        <CardContent className="p-0 divide-y divide-border">
                            {[
                                { img: 'https://www.google.com/s2/favicons?sz=64&domain=shopify.com', name: 'Shopify eCommerce', type: 'Sales', amount: '$1,200', trend: '+12%' },
                                { img: 'https://www.google.com/s2/favicons?sz=64&domain=apple.com', name: 'iOS App Store', type: 'Sales', amount: '$1,450', trend: '+8%' },
                                { img: 'https://www.google.com/s2/favicons?sz=64&domain=figma.com', name: 'Figma Platform', type: 'Sales', amount: '$1,250', trend: '+5%' },
                            ].map((item) => (
                                <div key={item.name} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                                    <div className="relative size-10 shrink-0 border border-border rounded-xl overflow-hidden bg-background p-2">
                                        <Image src={item.img} alt={item.name} fill className="object-contain p-1.5" unoptimized />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-[13px] truncate">{item.name}</p>
                                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{item.type}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-[13px]">{item.amount}</p>
                                        <p className="text-[11px] font-semibold text-emerald-500">{item.trend}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ── Mini Sparkline Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {miniStats.map((s) => (
                    <Card key={s.label} className="border-border shadow-sm hover:-translate-y-1 transition-all">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                                    <p className="text-2xl font-bold mt-1">{s.value}</p>
                                </div>
                                <Badge variant="outline" className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 border-emerald-500/20 px-2 py-1">
                                    <TrendingUp className="size-3 mr-1" />{s.percent}%
                                </Badge>
                            </div>
                            <div className="h-[60px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={s.data}>
                                        <Area type="monotone" dataKey="v" stroke={s.color} strokeWidth={2} fill={s.color} fillOpacity={0.15} dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-2 italic text-center">+{s.percent}% more than last week</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Donut + Analytics ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-border shadow-sm">
                    <CardHeader className="px-6 py-4 border-b border-border flex flex-row justify-between items-center space-y-0">
                        <CardTitle className="font-bold text-[15px]">Target Audience Overview</CardTitle>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><MoreVertical className="size-4" /></Button>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center">
                            <div className="size-[160px] mb-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                                            {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-3 w-full">
                                {donutData.slice(0, 4).map((item) => (
                                    <div key={item.name} className="flex flex-col items-center p-3 rounded-xl bg-muted/50 border border-border">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="size-2 rounded-full" style={{ background: item.color }} />
                                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{item.name}</span>
                                        </div>
                                        <span className="font-bold text-[16px]">{item.value}K</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-border shadow-sm flex flex-col">
                    <CardHeader className="px-6 py-4 border-b border-border flex flex-row justify-between items-center space-y-0">
                        <CardTitle className="font-bold text-[15px]">Strategic Analytics</CardTitle>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><MoreVertical className="size-4" /></Button>
                    </CardHeader>
                    <CardContent className="p-6 flex flex-col items-center justify-center min-h-[250px] space-y-4 flex-1">
                        <div className="p-4 rounded-2xl bg-muted border border-border">
                            <TrendingUp className="size-8 text-primary opacity-50" />
                        </div>
                        <h4 className="font-bold text-foreground">Premium Analytics Insights</h4>
                        <p className="text-[13px] text-muted-foreground text-center max-w-sm">
                            Unlock detailed insights into your CRM performance with Strategic Intelligence.
                        </p>
                        <Button variant="outline" className="rounded-xl font-bold text-xs uppercase tracking-widest px-8 border-primary/20 hover:bg-primary/5 hover:text-primary">
                            View Reports <ChevronRight className="size-3 ml-1" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* ── Latest Leads Table ── */}
            <Card className="border-border shadow-sm overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-border flex flex-row justify-between items-center space-y-0">
                    <CardTitle className="font-bold text-[15px]">Latest Leads</CardTitle>
                    <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><MoreVertical className="size-4" /></Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-border bg-muted/30">
                                    <TableHead className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">User</TableHead>
                                    <TableHead className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Proposal</TableHead>
                                    <TableHead className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Date</TableHead>
                                    <TableHead className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-border">
                                {leads.map((lead) => (
                                    <TableRow key={lead.id} className="hover:bg-muted/50 transition-colors border-none">
                                        <TableCell className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-9 border border-border">
                                                    <AvatarImage src={lead.avatar} />
                                                    <AvatarFallback>{lead.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-[13px] leading-none">{lead.name}</p>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">{lead.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-3"><StatusBadge status={lead.proposal} /></TableCell>
                                        <TableCell className="px-6 py-3">
                                            <span className="text-[12px] text-muted-foreground flex items-center gap-1.5">
                                                <Calendar className="size-3" /> {lead.date}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-6 py-3"><StatusBadge status={lead.status} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="px-6 py-3 border-t border-border bg-muted/10 flex items-center justify-between">
                    <p className="text-[12px] text-muted-foreground">Showing 1 to 5 of 24 entries</p>
                    <div className="flex gap-1.5">
                        <Button variant="outline" size="icon" className="size-8 rounded-lg"><ChevronLeft className="size-3.5" /></Button>
                        {[1, 2, 3].map((n) => (
                            <Button key={n} variant={n === 1 ? 'default' : 'outline'} size="icon" className="size-8 rounded-lg">{n}</Button>
                        ))}
                        <Button variant="outline" size="icon" className="size-8 rounded-lg"><ChevronRight className="size-3.5" /></Button>
                    </div>
                </CardFooter>
            </Card>

            {/* ── Schedule + Projects + Team ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Upcoming Schedule */}
                <Card className="border-border shadow-sm flex flex-col">
                    <CardHeader className="px-6 py-4 border-b border-border flex flex-row justify-between items-center space-y-0">
                        <CardTitle className="font-bold text-[15px]">Upcoming Schedule</CardTitle>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><MoreVertical className="size-4" /></Button>
                    </CardHeader>
                    <CardContent className="px-6 py-2 divide-y divide-border flex-1">
                        {schedule.map((event, i) => (
                            <div key={i} className="flex gap-4 py-4">
                                <div className={cn('size-11 rounded-2xl flex flex-col items-center justify-center shrink-0 border-2', event.bg, event.border)}>
                                    <span className={cn('text-[16px] font-black leading-none', event.text)}>{event.day}</span>
                                    <span className={cn('text-[9px] font-bold uppercase mt-0.5', event.text)}>{event.month}</span>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="font-bold text-[13px] leading-tight">{event.title}</p>
                                    <p className="text-[11px] text-muted-foreground">{event.time}</p>
                                    <div className="flex -space-x-1.5 mt-1.5">
                                        {event.avatars.map((n) => (
                                            <Avatar key={n} className="size-6 border-2 border-background">
                                                <AvatarImage src={`https://i.pravatar.cc/40?img=${n}`} />
                                                <AvatarFallback>U</AvatarFallback>
                                            </Avatar>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter className="px-6 py-3 border-t border-border bg-muted/10">
                        <Button variant="link" className="p-0 h-auto text-[12px] font-bold text-primary uppercase tracking-wider">
                            View All Schedule <ArrowRight className="ml-1 size-3" />
                        </Button>
                    </CardFooter>
                </Card>

                {/* Project Progress */}
                <Card className="border-border shadow-sm flex flex-col">
                    <CardHeader className="px-6 py-4 border-b border-border flex flex-row justify-between items-center space-y-0">
                        <CardTitle className="font-bold text-[15px]">Project Progress</CardTitle>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><MoreVertical className="size-4" /></Button>
                    </CardHeader>
                    <CardContent className="px-6 py-2 divide-y divide-border flex-1">
                        {projects.map((project, i) => (
                            <div key={i} className="py-4 space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 shrink-0 bg-background border border-border rounded-xl p-2 relative overflow-hidden">
                                        <Image src={project.img} alt={project.name} fill className="object-contain p-1.5" unoptimized />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-[13px] truncate">{project.name}</p>
                                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">{project.type}</p>
                                    </div>
                                    <span className="font-bold text-[13px] text-primary">{project.percent}%</span>
                                </div>
                                <ProgressBar value={project.percent} color={project.percent > 70 ? 'bg-emerald-500' : project.percent > 40 ? 'bg-primary' : 'bg-rose-500'} />
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter className="px-6 py-3 border-t border-border bg-muted/10">
                        <Button variant="link" className="p-0 h-auto text-[12px] font-bold text-primary uppercase tracking-wider">
                            View All Projects <ArrowRight className="ml-1 size-3" />
                        </Button>
                    </CardFooter>
                </Card>

                {/* Team Management */}
                <Card className="border-border shadow-sm flex flex-col">
                    <CardHeader className="px-6 py-4 border-b border-border flex flex-row justify-between items-center space-y-0">
                        <CardTitle className="font-bold text-[15px]">Team Management</CardTitle>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground"><MoreVertical className="size-4" /></Button>
                    </CardHeader>
                    <CardContent className="px-6 py-2 divide-y divide-border flex-1">
                        {team.map((member, i) => (
                            <div key={i} className="py-4 space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="relative size-10 shrink-0">
                                        <Avatar className="size-10 border border-border">
                                            <AvatarImage src={member.avatar} />
                                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-emerald-500 border-2 border-background rounded-full" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-[13px] truncate">{member.name}</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">{member.role}</p>
                                    </div>
                                    <Badge variant="outline" className="rounded-lg bg-muted text-foreground font-bold border-border text-[11px]">
                                        {member.progress}%
                                    </Badge>
                                </div>
                                <ProgressBar value={member.progress} color={member.color} />
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter className="px-6 py-3 border-t border-border bg-muted/10">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-widest">Last update: 12m ago</p>
                    </CardFooter>
                </Card>
            </div>

        </div>
    );
}
