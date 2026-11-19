import { useMemo, useState } from 'react';
import { AlertTriangle, Database, ShieldCheck } from 'lucide-react';
import { A4ReportContent, A4ReportModal, ReportOrientation } from './components/A4ReportModal';
import { DashboardView } from './components/DashboardView';
import { AuctionModal, CollectionModal, VehicleModal } from './components/EntityModals';
import { FilterBar } from './components/FilterBar';
import { Footer } from './components/Footer';
import { HeroBanner } from './components/HeroBanner';
import { ImportModal } from './components/ImportModal';
import { Sidebar } from './components/Sidebar';
import { SmartDialogProvider, useSmartDialog } from './components/SmartDialogSystem';
import { TopBar } from './components/TopBar';
import {
  ArchiveView,
  ComparisonsView,
  FinancialAnalysisView,
  RevenueShareView,
  ServicesFeesView,
  SettingsPermissionsView,
} from './components/views/AnalyticsGovernanceViews';
import {
  AuctionsRegistryView,
  CollectionsView,
  FinancialReportView,
  VehiclesLedgerView,
} from './components/views/FinancialOperationsViews';
import { useAuctionData } from './hooks/useAuctionData';
import {
  ApprovedReport,
  Auction,
  CollectionRecord,
  FilterState,
  ServiceFeeRecord,
  TabId,
  UserRole,
  Vehicle,
} from './types';
import {
  computeFinancialMetrics,
  computeMonthlyTrend,
  filterAuctions,
  filterCollections,
  filterServiceRecords,
  filterVehicles,
} from './utils/calculations';
import { runFinancialValidationSuite } from './utils/demoDataGenerator';
import { formatAED, getMonthLabel, getUaeCurrentDate } from './utils/uaeDate';

export default function App() {
  const auctionData = useAuctionData();

  return (
    <SmartDialogProvider canViewTechnicalDetails={auctionData.activeRole !== 'viewer'}>
      <AppWorkspace auctionData={auctionData} />
    </SmartDialogProvider>
  );
}

function AppWorkspace({ auctionData }: { auctionData: ReturnType<typeof useAuctionData> }) {
  const uaeNow = useMemo(() => getUaeCurrentDate(), []);
  const { showConfirm, showSuccess, showError, showToast } = useSmartDialog();

  const {
    user,
    usersList,
    firebaseOnline,
    authError,
    isCloudMode,
    workspaceMode,
    isDemoMode,
    isDemoSeeded,
    demoSeedSummary,
    demoSeedLog,
    switchWorkspaceMode,
    seedDemoWorkspace,
    clearDemoWorkspace,
    activeRole,
    canEdit,
    canApprove,
    canManageSettings,
    actorName,
    auctions,
    vehicles,
    collections,
    serviceRecords,
    approvedReports,
    auditLogs,
    settings,
    hasUnsyncedLocalData,
    signInWithGoogle,
    logout,
    saveAuction,
    deleteAuction,
    saveVehicle,
    updateVehicleSaleDate,
    bulkImportVehicles,
    deleteVehicle,
    saveCollection,
    updateCollectionDate,
    deleteCollection,
    saveServiceRecord,
    deleteServiceRecord,
    approveReport,
    archiveReport,
    updateSettings,
    setRole,
    syncLocalToFirebase,
    clearPeriodLocalData,
  } = auctionData;

  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [filter, setFilter] = useState<FilterState>({
    month: uaeNow.month,
    year: uaeNow.year,
    location: 'all',
    auctionId: 'all',
    status: 'all',
  });

  // Modals state
  const [auctionModalOpen, setAuctionModalOpen] = useState(false);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);

  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [previewSnapshotReport, setPreviewSnapshotReport] = useState<ApprovedReport | null>(null);
  const [printOrientation, setPrintOrientation] = useState<ReportOrientation>('portrait');
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);

  const availableYears = useMemo(() => {
    const years = new Set<number>([
      uaeNow.year - 2,
      uaeNow.year - 1,
      uaeNow.year,
      uaeNow.year + 1,
      ...auctions.map((a) => a.year),
      ...vehicles.map((v) => v.year),
    ]);
    return Array.from(years).sort((a, b) => b - a);
  }, [auctions, vehicles, uaeNow.year]);

  const filteredAuctions = useMemo(
    () => filterAuctions(auctions, filter),
    [auctions, filter]
  );

  const filteredVehicles = useMemo(
    () => filterVehicles(vehicles, filter),
    [vehicles, filter]
  );

  const filteredCollections = useMemo(
    () => filterCollections(collections, filter, filteredVehicles),
    [collections, filter, filteredVehicles]
  );

  const filteredServiceRecords = useMemo(
    () => filterServiceRecords(serviceRecords, filter, filteredVehicles),
    [serviceRecords, filter, filteredVehicles]
  );

  const metrics = useMemo(
    () =>
      computeFinancialMetrics(
        filteredVehicles,
        filteredAuctions,
        filteredCollections,
        settings,
        filter,
        filteredServiceRecords,
        isDemoMode
      ),
    [
      filteredVehicles,
      filteredAuctions,
      filteredCollections,
      settings,
      filter,
      filteredServiceRecords,
      isDemoMode,
    ]
  );

  const monthlyTrend = useMemo(
    () =>
      computeMonthlyTrend(
        vehicles,
        collections,
        filter.year,
        filter.location,
        filter.auctionId
      ),
    [vehicles, collections, filter.year, filter.location, filter.auctionId]
  );

  const notifications = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      detail: string;
      type: 'info' | 'warning' | 'success';
      targetTab?: TabId;
    }> = [];

    if (isDemoMode) {
      items.push({
        id: 'demo_active',
        title: 'بيئة العرض التجريبي (Demo) نشطة',
        detail: 'بيانات تجريبية – ليست بيانات مالية فعلية ومعزولة عن قاعدة الإنتاج.',
        type: 'warning',
        targetTab: 'settings',
      });
    } else if (!isCloudMode) {
      items.push({
        id: 'cloud_prompt',
        title: 'التخزين السحابي (Firebase)',
        detail: 'قم بتسجيل الدخول بحساب Google لحفظ البيانات بشكل دائم ومشترك.',
        type: 'info',
        targetTab: 'settings',
      });
    }

    if (metrics.outstandingReceivables > 0) {
      items.push({
        id: 'receivables',
        title: 'مستحقات قيد التحصيل',
        detail: `توجد مبالغ متبقية للتحصيل بقيمة ${formatAED(metrics.outstandingReceivables)}`,
        type: 'warning',
        targetTab: 'collections',
      });
    }

    const unapprovedAuctions = filteredAuctions.filter((a) => a.status === 'closed');
    if (unapprovedAuctions.length > 0) {
      items.push({
        id: 'unapproved_auc',
        title: 'مزادات بانتظار الاعتماد',
        detail: `يوجد ${unapprovedAuctions.length} مزاد مغلق بانتظار المراجعة والاعتماد.`,
        type: 'warning',
        targetTab: 'auctions',
      });
    }

    if (metrics.soldCount > 0 && metrics.collectionRate !== null && metrics.collectionRate >= 97) {
      items.push({
        id: 'high_collection',
        title: 'كفاءة تحصيل متميزة',
        detail: `تم تحصيل ${metrics.collectionRate.toFixed(2)}% من إجمالي مبيعات الفترة.`,
        type: 'success',
        targetTab: 'financial-report',
      });
    }

    return items;
  }, [filteredAuctions, isCloudMode, isDemoMode, metrics]);

  const visibleNotifications = useMemo(
    () => notifications.filter((n) => !dismissedNotificationIds.includes(n.id)),
    [notifications, dismissedNotificationIds]
  );

  const handleDismissNotification = (id: string) => {
    setDismissedNotificationIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleClearNotifications = () => {
    setDismissedNotificationIds((prev) =>
      Array.from(new Set([...prev, ...notifications.map((n) => n.id)]))
    );
  };

  const handleFilterChange = (next: Partial<FilterState>) => {
    setFilter((prev) => ({ ...prev, ...next }));
  };

  const handleResetFilter = () => {
    setFilter({
      month: uaeNow.month,
      year: uaeNow.year,
      location: 'all',
      auctionId: 'all',
      status: 'all',
    });
    showToast({
      id: 'filter-reset',
      variant: 'info',
      title: 'تمت إعادة ضبط فلاتر العرض',
      description: `الفترة الافتراضية: ${getMonthLabel(uaeNow.month)} ${uaeNow.year}`,
    });
  };

  const handleApplySearch = () => {
    showToast({
      id: 'filter-applied',
      variant: 'info',
      title: 'تم تحديث العرض المالي',
      description: `${metrics.displayedCount} مركبة · إجمالي البيع ${formatAED(metrics.totalSaleValue)}`,
    });
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      showError({
        title: 'تعذر تسجيل الدخول السحابي',
        operationName: 'تسجيل الدخول بحساب Google',
        message: err instanceof Error ? err.message : 'حدث خطأ أثناء المصادقة عبر حساب Google.',
        technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      showToast({
        variant: 'info',
        title: 'تم تسجيل الخروج من الجلسة السحابية',
      });
    } catch (err) {
      showError({
        title: 'تعذر تسجيل الخروج',
        operationName: 'إنهاء الجلسة السحابية',
        message: err instanceof Error ? err.message : 'حدث خطأ أثناء إنهاء الجلسة.',
        technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
      });
    }
  };

  const handleSyncLocal = async () => {
    try {
      await syncLocalToFirebase();
      showSuccess({
        dedupeKey: 'success:sync-local',
        title: 'تمت المزامنة السحابية بنجاح',
        message: 'تم رفع جميع السجلات المحلية غير المتزامنة إلى قاعدة البيانات السحابية بنجاح.',
      });
    } catch (err) {
      showError({
        title: 'تعذر إتمام المزامنة السحابية',
        operationName: 'مزامنة البيانات المحلية إلى السحابة',
        message:
          err instanceof Error ? err.message : 'حدث خطأ أثناء مزامنة السجلات المحلية مع Firebase.',
        technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
        onRetry: handleSyncLocal,
      });
    }
  };

  const handleDeleteAuction = (auc: Auction) => {
    const linkedVehiclesCount = vehicles.filter((v) => v.auctionId === auc.id).length;
    const executeDelete = async () => {
      try {
        await deleteAuction(auc);
        showToast({
          variant: 'success',
          title: 'تم حذف المزاد بنجاح',
          description: `${auc.title} (${auc.auctionCode})`,
        });
      } catch (err) {
        showError({
          title: 'تعذر حذف المزاد',
          operationName: 'حذف سجل المزاد',
          message: err instanceof Error ? err.message : 'حدث خطأ أثناء حذف سجل المزاد.',
          technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
          onRetry: executeDelete,
        });
      }
    };

    showConfirm({
      dedupeKey: `delete-auction:${auc.id}`,
      variant: 'delete',
      title: 'تأكيد حذف سجل المزاد',
      message: `هل أنت متأكد من حذف المزاد "${auc.title}" نهائياً من السجل المالي؟`,
      impactNote:
        linkedVehiclesCount > 0
          ? `تنبيه: توجد ${linkedVehiclesCount} مركبة مرتبطة بهذا المزاد قد يتأثر ربطها التنظيمي.`
          : 'سيتم حذف المزاد وتسجيل الحركة في سجل التدقيق المالي.',
      details: [
        { label: 'اسم المزاد', value: auc.title },
        { label: 'كود المزاد', value: auc.auctionCode, dir: 'ltr', mono: true },
        { label: 'الموقع', value: auc.location },
        { label: 'المركبات المرتبطة', value: `${linkedVehiclesCount}`, mono: true },
      ],
      confirmLabel: 'تأكيد حذف المزاد',
      cancelLabel: 'إلغاء',
      onConfirm: executeDelete,
    });
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    const executeDelete = async () => {
      try {
        await deleteVehicle(vehicle);
        showToast({
          variant: 'success',
          title: 'تم حذف سجل المركبة',
          description: `${vehicle.make} ${vehicle.model} (لوت ${vehicle.lotNumber})`,
        });
      } catch (err) {
        showError({
          title: 'تعذر حذف المركبة',
          operationName: 'حذف سجل المركبة',
          message: err instanceof Error ? err.message : 'حدث خطأ أثناء حذف سجل المركبة.',
          technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
          onRetry: executeDelete,
        });
      }
    };

    showConfirm({
      dedupeKey: `delete-vehicle:${vehicle.id}`,
      variant: 'delete',
      title: 'تأكيد حذف سجل المركبة',
      message: `هل تريد حذف المركبة "${vehicle.make} ${vehicle.model}" من الدفتر المالي؟`,
      impactNote: 'سيؤدي الحذف إلى إزالة قيود التحصيل والخدمات المرتبطة بها وإعادة احتساب الإجماليات.',
      details: [
        { label: 'رقم اللوت', value: vehicle.lotNumber, dir: 'ltr', mono: true },
        { label: 'المركبة', value: `${vehicle.make} ${vehicle.model} (${vehicle.modelYear})` },
        { label: 'سعر البيع', value: formatAED(vehicle.salePrice), dir: 'ltr', mono: true },
        { label: 'المحصل', value: formatAED(vehicle.collectedAmount), dir: 'ltr', mono: true },
      ],
      confirmLabel: 'تأكيد الحذف',
      cancelLabel: 'إلغاء',
      onConfirm: executeDelete,
    });
  };

  const handleDeleteCollection = (record: CollectionRecord) => {
    const executeDelete = async () => {
      try {
        await deleteCollection(record);
        showToast({
          variant: 'success',
          title: 'تم حذف سند التحصيل',
          description: `سند رقم ${record.receiptNo} (${formatAED(record.amount)})`,
        });
      } catch (err) {
        showError({
          title: 'تعذر حذف سند التحصيل',
          operationName: 'حذف سند تحصيل مالي',
          message: err instanceof Error ? err.message : 'حدث خطأ أثناء حذف سند التحصيل.',
          technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
          onRetry: executeDelete,
        });
      }
    };

    showConfirm({
      dedupeKey: `delete-collection:${record.id}`,
      variant: 'delete',
      title: 'تأكيد حذف سند التحصيل',
      message: `هل أنت متأكد من حذف سند التحصيل رقم "${record.receiptNo}"؟`,
      impactNote: 'سيتم خصم مبلغ السند من إجمالي التحصيل وتحديث الرصيد المتبقي تلقائياً.',
      details: [
        { label: 'رقم الإيصال', value: record.receiptNo, dir: 'ltr', mono: true },
        { label: 'المزايد / العميل', value: record.bidderName },
        { label: 'المبلغ المحصل', value: formatAED(record.amount), dir: 'ltr', mono: true },
        { label: 'تاريخ السند', value: record.collectionDate, dir: 'ltr', mono: true },
      ],
      confirmLabel: 'تأكيد حذف السند',
      cancelLabel: 'إلغاء',
      onConfirm: executeDelete,
    });
  };

  const handleDeleteServiceRecord = async (record: ServiceFeeRecord) => {
    const executeDelete = async () => {
      try {
        await deleteServiceRecord(record);
        showToast({
          variant: 'success',
          title: 'تم حذف قيد الخدمة',
          description: `${record.serviceCode} · ${formatAED(record.collectedAmount)}`,
        });
      } catch (err) {
        showError({
          title: 'تعذر حذف قيد الخدمة',
          operationName: 'حذف قيد رسوم الخدمات',
          message: err instanceof Error ? err.message : 'حدث خطأ أثناء حذف قيد الخدمة.',
          technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
          onRetry: executeDelete,
        });
      }
    };

    showConfirm({
      dedupeKey: `delete-service:${record.id}`,
      variant: 'delete',
      title: 'تأكيد حذف قيد رسوم الخدمة',
      message: `هل أنت متأكد من حذف قيد الخدمة "${record.serviceCode}"؟`,
      impactNote: 'سيتم تحديث مجاميع رسوم المنصة والخدمات للوحدة المرتبطة تلقائياً.',
      details: [
        { label: 'كود القيد', value: record.serviceCode, dir: 'ltr', mono: true },
        { label: 'المستفيد', value: record.beneficiary },
        { label: 'المبلغ المحصل', value: formatAED(record.collectedAmount), dir: 'ltr', mono: true },
        { label: 'التاريخ', value: record.serviceDate, dir: 'ltr', mono: true },
      ],
      confirmLabel: 'تأكيد الحذف',
      cancelLabel: 'إلغاء',
      onConfirm: executeDelete,
    });
  };

  const handleArchiveReport = async (report: ApprovedReport) => {
    const executeArchive = async () => {
      try {
        await archiveReport(report);
        showToast({
          variant: 'success',
          title: 'تمت الأرشفة النهائية للتقرير',
          description: report.title,
        });
      } catch (err) {
        showError({
          title: 'تعذر أرشفة التقرير',
          operationName: 'نقل التقرير إلى الأرشيف النهائي',
          message: err instanceof Error ? err.message : 'حدث خطأ أثناء نقل التقرير للأرشيف النهائي.',
          technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
          onRetry: executeArchive,
        });
      }
    };

    showConfirm({
      dedupeKey: `archive-report:${report.id}`,
      variant: 'confirm',
      title: 'تأكيد الأرشفة النهائية للتقرير',
      message: `هل تريد نقل التقرير المعتمد "${report.title}" إلى الأرشيف النهائي؟`,
      impactNote: 'يظل التقرير متاحاً للمعاينة والطباعة الرسمية كنسخة أرشيفية ثابتة.',
      details: [
        { label: 'عنوان التقرير', value: report.title },
        { label: 'صافي المبيعات', value: formatAED(report.totalSale), dir: 'ltr', mono: true },
        { label: 'المحصل', value: formatAED(report.totalCollected), dir: 'ltr', mono: true },
        { label: 'المعتمد', value: report.approvedByName },
      ],
      confirmLabel: 'تأكيد الأرشفة النهائية',
      cancelLabel: 'تراجع',
      onConfirm: executeArchive,
    });
  };

  const handleClearLocalPeriod = (year: number, month: number | 'all') => {
    const periodLabel = `${getMonthLabel(month)} ${year}`;
    showConfirm({
      dedupeKey: `clear-local:${year}:${month}`,
      variant: 'delete',
      title: 'تأكيد تفريغ بيانات الفترة المحلية',
      message: `هل أنت متأكد من حذف جميع السجلات المحلية المخزنة لفترة ${periodLabel}؟`,
      impactNote: 'سيؤدي هذا الإجراء إلى حذف المزادات والمركبات والتحصيلات المحلية لهذه الفترة فقط.',
      details: [
        { label: 'الفترة المستهدفة', value: periodLabel },
        { label: 'بيئة العمل', value: 'التخزين المحلي غير السحابي' },
      ],
      confirmLabel: 'نعم، تفريغ الفترة المحلية',
      cancelLabel: 'إلغاء',
      onConfirm: () => {
        clearPeriodLocalData(year, month);
        showToast({
          variant: 'success',
          title: 'تم تفريغ بيانات الفترة المحلية',
          description: `تم حذف البيانات المحلية الخاصة بفترة ${periodLabel}.`,
        });
      },
    });
  };

  const handleRoleChange = async (role: UserRole, targetUid?: string) => {
    try {
      await setRole(role, targetUid);
      showToast({
        variant: 'success',
        title: 'تم تحديث الصلاحية الوظيفية',
        description: targetUid
          ? 'تم تحديث دور المستخدم في قاعدة البيانات.'
          : 'تم تبديل الدور الوظيفي النشط للجلسة.',
      });
    } catch (err) {
      showError({
        title: 'تعذر تحديث الصلاحية',
        operationName: 'تحديث الدور الوظيفي (RBAC)',
        message: err instanceof Error ? err.message : 'تعذر تعديل صلاحية المستخدم.',
        technicalDetail: err instanceof Error ? err.stack || err.message : undefined,
      });
    }
  };

  const openLivePrintPreview = () => {
    setPreviewSnapshotReport(null);
    setPrintPreviewOpen(true);
  };

  const openSnapshotPrintPreview = (report: ApprovedReport) => {
    setPreviewSnapshotReport(report);
    setPrintPreviewOpen(true);
  };

  const defaultMonthNumber = filter.month === 'all' ? uaeNow.month : filter.month;

  return (
    <div dir="rtl" className="saaed-app-root">
      <div className="no-print flex min-h-screen flex-col bg-[#EEF3F8] text-slate-900">
        {/* Top Corporate Bar */}
      <TopBar
        filter={filter}
        onFilterChange={handleFilterChange}
        user={user}
        actorName={actorName}
        activeRole={activeRole}
        isCloudMode={isCloudMode}
        firebaseOnline={firebaseOnline}
        hasUnsyncedLocalData={hasUnsyncedLocalData}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onSyncLocal={handleSyncLocal}
        onOpenPrintPreview={openLivePrintPreview}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        notifications={visibleNotifications}
        onDismissNotification={handleDismissNotification}
        onClearNotifications={handleClearNotifications}
        onNavigateTab={setActiveTab}
      />

      {/* Main Workspace Split: Right Sidebar + Left Content */}
      <div className="flex flex-1">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          {/* Panoramic Hero Header */}
          <HeroBanner
            canEdit={canEdit}
            onAddAuction={() => {
              setEditingAuction(null);
              setAuctionModalOpen(true);
            }}
            onAddVehicle={() => {
              setEditingVehicle(null);
              setVehicleModalOpen(true);
            }}
            onOpenImport={() => setImportModalOpen(true)}
            onOpenPrintPreview={openLivePrintPreview}
            onNavigateTab={setActiveTab}
          />

          {/* Filter Toolbar */}
          <FilterBar
            filter={filter}
            auctions={auctions}
            availableYears={availableYears}
            onFilterChange={handleFilterChange}
            onResetFilter={handleResetFilter}
            onApplySearch={handleApplySearch}
          />

          {/* Non-intrusive Demo Workspace Alert Banner (when Demo mode active) */}
          {isDemoMode && (
            <div className="no-print mx-4 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-2 text-xs font-extrabold text-amber-950 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
                <span>بيانات تجريبية – ليست بيانات مالية فعلية</span>
                <span className="hidden font-semibold text-amber-800 sm:inline">
                  (بيئة العرض التجريبي Demo Workspace معزولة تماماً عن قاعدة بيانات الإنتاج)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center gap-1 rounded-lg border border-amber-400 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100"
                >
                  <Database className="h-3.5 w-3.5" />
                  <span>إدارة Demo واختبارات التحقق</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchWorkspaceMode('production')}
                  className="flex items-center gap-1 rounded-lg bg-[#0A2C52] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#123d73]"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>العودة لبيئة الإنتاج</span>
                </button>
              </div>
            </div>
          )}

          {authError && (
            <div className="no-print mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700">
              تنبيه المصادقة: {authError}
            </div>
          )}

          {/* Active Tab Viewport */}
          <div className="no-print flex-1">
            {activeTab === 'dashboard' && (
              <DashboardView
                metrics={metrics}
                monthlyTrend={monthlyTrend}
                filter={filter}
                canEdit={canEdit}
                onNavigateTab={setActiveTab}
                onAddAuction={() => {
                  setEditingAuction(null);
                  setAuctionModalOpen(true);
                }}
                onAddVehicle={() => {
                  setEditingVehicle(null);
                  setVehicleModalOpen(true);
                }}
                onOpenImport={() => setImportModalOpen(true)}
                onEditVehicle={(v) => {
                  setEditingVehicle(v);
                  setVehicleModalOpen(true);
                }}
              />
            )}

            {activeTab === 'financial-report' && (
              <FinancialReportView
                metrics={metrics}
                filter={filter}
                auctions={auctions}
                canApprove={canApprove}
                isDemoMode={isDemoMode}
                onOpenPrintPreview={openLivePrintPreview}
                onApproveCurrentReport={async (payload) => {
                  await approveReport(payload);
                }}
              />
            )}

            {activeTab === 'auctions' && (
              <AuctionsRegistryView
                auctions={filteredAuctions}
                vehicles={vehicles}
                serviceRecords={serviceRecords}
                canEdit={canEdit}
                onAddAuction={() => {
                  setEditingAuction(null);
                  setAuctionModalOpen(true);
                }}
                onEditAuction={(auc) => {
                  setEditingAuction(auc);
                  setAuctionModalOpen(true);
                }}
                onDeleteAuction={handleDeleteAuction}
                onSelectAuctionFilter={(auctionId) => {
                  setFilter((prev) => ({ ...prev, auctionId }));
                  setActiveTab('dashboard');
                }}
              />
            )}

            {activeTab === 'vehicles' && (
              <VehiclesLedgerView
                vehicles={filteredVehicles}
                auctions={auctions}
                filter={filter}
                canEdit={canEdit}
                isDemoMode={isDemoMode}
                onAddVehicle={() => {
                  setEditingVehicle(null);
                  setVehicleModalOpen(true);
                }}
                onEditVehicle={(v) => {
                  setEditingVehicle(v);
                  setVehicleModalOpen(true);
                }}
                onUpdateSaleDate={async (vehicle, newSaleDate) => {
                  await updateVehicleSaleDate(vehicle.id, newSaleDate);
                }}
                onDeleteVehicle={handleDeleteVehicle}
                onOpenImport={() => setImportModalOpen(true)}
              />
            )}

            {activeTab === 'collections' && (
              <CollectionsView
                collections={filteredCollections}
                vehicles={filteredVehicles}
                metrics={metrics}
                canEdit={canEdit}
                onAddCollection={() => setCollectionModalOpen(true)}
                onUpdateCollectionDate={async (col, newCollectionDate) => {
                  await updateCollectionDate(col.id, newCollectionDate);
                }}
                onDeleteCollection={handleDeleteCollection}
              />
            )}

            {activeTab === 'revenue-share' && (
              <RevenueShareView
                metrics={metrics}
                auctions={filteredAuctions}
                vehicles={filteredVehicles}
                collections={filteredCollections}
                settings={settings}
                canEdit={canEdit}
                canManageSettings={canManageSettings}
                isDemoMode={isDemoMode}
                onEditAuction={(auc) => {
                  setEditingAuction(auc);
                  setAuctionModalOpen(true);
                }}
                onToggleExcludeServices={async (exclude) => {
                  await updateSettings({
                    defaultSaaedSharePercent: settings.defaultSaaedSharePercent,
                    defaultThirdPartySharePercent: settings.defaultThirdPartySharePercent,
                    defaultPlatformFee: settings.defaultPlatformFee,
                    defaultAdminFee: settings.defaultAdminFee,
                    defaultForkliftFee: settings.defaultForkliftFee,
                    defaultRecoveryFee: settings.defaultRecoveryFee,
                    excludeServicesFromShare: exclude,
                  });
                }}
              />
            )}

            {activeTab === 'services-fees' && (
              <ServicesFeesView
                metrics={metrics}
                vehicles={filteredVehicles}
                serviceRecords={filteredServiceRecords}
                auctions={filteredAuctions.length > 0 ? filteredAuctions : auctions}
                filter={filter}
                canEdit={canEdit}
                isDemoMode={isDemoMode}
                onEditVehicle={(v) => {
                  setEditingVehicle(v);
                  setVehicleModalOpen(true);
                }}
                onAddServiceRecord={saveServiceRecord}
                onDeleteServiceRecord={handleDeleteServiceRecord}
              />
            )}

            {activeTab === 'analysis' && (
              <FinancialAnalysisView metrics={metrics} isDemoMode={isDemoMode} />
            )}

            {activeTab === 'comparisons' && (
              <ComparisonsView
                monthlyTrend={monthlyTrend}
                vehicles={vehicles}
                filter={filter}
                onSelectPeriod={(year, month) => {
                  setFilter((prev) => ({ ...prev, year, month, auctionId: 'all' }));
                  setActiveTab('dashboard');
                }}
              />
            )}

            {activeTab === 'archive' && (
              <ArchiveView
                reports={approvedReports}
                metrics={metrics}
                filter={filter}
                canApprove={canApprove}
                isDemoMode={isDemoMode}
                onApproveCurrent={async (payload) => {
                  await approveReport(payload);
                }}
                onArchiveReport={handleArchiveReport}
                onOpenPrintPreview={openLivePrintPreview}
                onPreviewSnapshot={openSnapshotPrintPreview}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPermissionsView
                settings={settings}
                activeRole={activeRole}
                isCloudMode={isCloudMode}
                canManageSettings={canManageSettings}
                usersList={usersList}
                auditLogs={auditLogs}
                filter={filter}
                workspaceMode={workspaceMode}
                isDemoMode={isDemoMode}
                isDemoSeeded={isDemoSeeded}
                demoSeedSummary={demoSeedSummary}
                demoSeedLog={demoSeedLog}
                onSaveSettings={updateSettings}
                onChangeRole={handleRoleChange}
                onClearLocalPeriod={handleClearLocalPeriod}
                onSwitchWorkspaceMode={switchWorkspaceMode}
                onSeedDemo={seedDemoWorkspace}
                onClearDemo={clearDemoWorkspace}
                onRunValidation={() =>
                  runFinancialValidationSuite({
                    auctions,
                    vehicles,
                    collections,
                    serviceRecords,
                    approvedReports,
                    settings,
                    isDemoMode,
                  })
                }
                onNavigatePeriod={(year, month) => {
                  setFilter((prev) => ({
                    ...prev,
                    year,
                    month,
                    location: 'all',
                    auctionId: 'all',
                    status: 'all',
                  }));
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Corporate Bottom Footer */}
      <Footer />

      {/* Modals */}
      <AuctionModal
        isOpen={auctionModalOpen}
        editing={editingAuction}
        defaultYear={filter.year}
        defaultMonth={defaultMonthNumber}
        defaultLocation={filter.location}
        settings={settings}
        onClose={() => {
          setAuctionModalOpen(false);
          setEditingAuction(null);
        }}
        onSave={async (payload, existingId) => {
          await saveAuction(payload, existingId);
        }}
      />

      <VehicleModal
        isOpen={vehicleModalOpen}
        editing={editingVehicle}
        auctions={auctions}
        defaultAuctionId={filter.auctionId}
        defaultYear={filter.year}
        defaultMonth={defaultMonthNumber}
        defaultLocation={filter.location}
        settings={settings}
        onClose={() => {
          setVehicleModalOpen(false);
          setEditingVehicle(null);
        }}
        onSave={async (payload, existingId) => {
          await saveVehicle(payload, existingId);
        }}
      />

      <CollectionModal
        isOpen={collectionModalOpen}
        auctions={filteredAuctions}
        vehicles={filteredVehicles}
        defaultYear={filter.year}
        defaultMonth={defaultMonthNumber}
        defaultLocation={filter.location}
        onClose={() => setCollectionModalOpen(false)}
        onSave={async (payload) => {
          await saveCollection(payload);
        }}
      />

      <ImportModal
        isOpen={importModalOpen}
        auctions={auctions}
        defaultYear={filter.year}
        defaultMonth={defaultMonthNumber}
        defaultLocation={filter.location}
        settings={settings}
        ownerId={user?.uid || 'local_user'}
        onClose={() => setImportModalOpen(false)}
        onImport={bulkImportVehicles}
      />

      <A4ReportModal
        isOpen={printPreviewOpen}
        onClose={() => {
          setPrintPreviewOpen(false);
          setPreviewSnapshotReport(null);
        }}
        metrics={metrics}
        filter={filter}
        auctions={auctions}
        monthlyTrend={monthlyTrend}
        actorName={actorName}
        isDemoMode={isDemoMode}
        snapshotReport={previewSnapshotReport}
        orientation={printOrientation}
        onOrientationChange={setPrintOrientation}
      />
      </div>

      {/* Dedicated A4 Print Container (hidden on screen, rendered as direct A4 sheets during print) */}
      <div id="saaed-print-sheet-root" className="print-only hidden">
        <A4ReportContent
          metrics={metrics}
          filter={filter}
          auctions={auctions}
          monthlyTrend={monthlyTrend}
          actorName={actorName}
          isDemoMode={isDemoMode}
          snapshotReport={previewSnapshotReport}
          orientation={printOrientation}
        />
      </div>
    </div>
  );
}
