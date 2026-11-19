import { useCallback, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '../firebase';
import {
  ApprovedReport,
  Auction,
  AuditLog,
  CollectionRecord,
  DemoSeedSummary,
  ServiceFeeRecord,
  SystemSettings,
  UserProfile,
  UserRole,
  Vehicle,
  WorkspaceMode,
} from '../types';
import { generateDemoDataset } from '../utils/demoDataGenerator';
import { formatIsoDateParts, parseIsoDateParts } from '../utils/saleDate';
import { generateSafeId, getUaeCurrentDate } from '../utils/uaeDate';

const LOCAL_STORAGE_KEY = 'saaed_auction_workspace_v1';
const DEMO_STORAGE_KEY = 'saaed_auction_demo_workspace_v1';
const WORKSPACE_MODE_KEY = 'saaed_workspace_mode_v1';

const DEFAULT_SETTINGS: SystemSettings = {
  id: 'default_settings',
  defaultSaaedSharePercent: 70,
  defaultThirdPartySharePercent: 30,
  defaultPlatformFee: 0,
  defaultAdminFee: 0,
  defaultForkliftFee: 0,
  defaultRecoveryFee: 0,
  excludeServicesFromShare: true,
  ownerId: 'local_user',
};

const DEFAULT_DEMO_SETTINGS: SystemSettings = {
  id: 'demo_settings',
  defaultSaaedSharePercent: 70,
  defaultThirdPartySharePercent: 30,
  defaultPlatformFee: 100,
  defaultAdminFee: 200,
  defaultForkliftFee: 200,
  defaultRecoveryFee: 400,
  excludeServicesFromShare: true,
  ownerId: 'demo_workspace',
};

interface LocalStore {
  auctions: Auction[];
  vehicles: Vehicle[];
  collections: CollectionRecord[];
  serviceRecords: ServiceFeeRecord[];
  approvedReports: ApprovedReport[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  localRole: UserRole;
}

interface DemoStore {
  auctions: Auction[];
  vehicles: Vehicle[];
  collections: CollectionRecord[];
  serviceRecords: ServiceFeeRecord[];
  approvedReports: ApprovedReport[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  seededAt?: string;
  seedLog: string[];
}

function loadLocalStore(): LocalStore {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LocalStore>;
      return {
        auctions: Array.isArray(parsed.auctions) ? parsed.auctions.filter((a) => !a.isDemo) : [],
        vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles.filter((v) => !v.isDemo) : [],
        collections: Array.isArray(parsed.collections) ? parsed.collections.filter((c) => !c.isDemo) : [],
        serviceRecords: Array.isArray(parsed.serviceRecords) ? parsed.serviceRecords.filter((s) => !s.isDemo) : [],
        approvedReports: Array.isArray(parsed.approvedReports) ? parsed.approvedReports.filter((r) => !r.isDemo) : [],
        auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs.filter((l) => !l.isDemo) : [],
        settings: parsed.settings
          ? { ...DEFAULT_SETTINGS, ...parsed.settings }
          : DEFAULT_SETTINGS,
        localRole: parsed.localRole || 'admin',
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    auctions: [],
    vehicles: [],
    collections: [],
    serviceRecords: [],
    approvedReports: [],
    auditLogs: [],
    settings: DEFAULT_SETTINGS,
    localRole: 'admin',
  };
}

function saveLocalStore(store: LocalStore) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

function loadDemoStore(): DemoStore {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DemoStore>;
      return {
        auctions: Array.isArray(parsed.auctions) ? parsed.auctions : [],
        vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : [],
        collections: Array.isArray(parsed.collections) ? parsed.collections : [],
        serviceRecords: Array.isArray(parsed.serviceRecords) ? parsed.serviceRecords : [],
        approvedReports: Array.isArray(parsed.approvedReports) ? parsed.approvedReports : [],
        auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
        settings: parsed.settings
          ? { ...DEFAULT_DEMO_SETTINGS, ...parsed.settings }
          : DEFAULT_DEMO_SETTINGS,
        seededAt: parsed.seededAt,
        seedLog: Array.isArray(parsed.seedLog) ? parsed.seedLog : [],
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    auctions: [],
    vehicles: [],
    collections: [],
    serviceRecords: [],
    approvedReports: [],
    auditLogs: [],
    settings: DEFAULT_DEMO_SETTINGS,
    seedLog: [],
  };
}

function saveDemoStore(store: DemoStore): boolean {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

function loadWorkspaceMode(): WorkspaceMode {
  try {
    const saved = localStorage.getItem(WORKSPACE_MODE_KEY);
    if (saved === 'demo') return 'demo';
  } catch {
    // ignore
  }
  return 'production';
}

export function useAuctionData() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [firebaseOnline, setFirebaseOnline] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(() => loadWorkspaceMode());
  const [localStore, setLocalStore] = useState<LocalStore>(() => loadLocalStore());
  const [demoStore, setDemoStore] = useState<DemoStore>(() => loadDemoStore());

  const [cloudAuctions, setCloudAuctions] = useState<Auction[]>([]);
  const [cloudVehicles, setCloudVehicles] = useState<Vehicle[]>([]);
  const [cloudCollections, setCloudCollections] = useState<CollectionRecord[]>([]);
  const [cloudReports, setCloudReports] = useState<ApprovedReport[]>([]);
  const [cloudAuditLogs, setCloudAuditLogs] = useState<AuditLog[]>([]);
  const [cloudSettings, setCloudSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    let mounted = true;
    const syncConnection = () => {
      testFirestoreConnection().then((ok) => {
        if (mounted) setFirebaseOnline(ok);
      });
    };
    const handleOffline = () => {
      if (mounted) setFirebaseOnline(false);
    };

    syncConnection();
    window.addEventListener('online', syncConnection);
    window.addEventListener('offline', handleOffline);

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      setAuthReady(true);
      if (fbUser) {
        try {
          const userRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            const isBootstrap = fbUser.email === 'mr.aljefre@gmail.com';
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || 'user@saaed.ae',
              displayName: fbUser.displayName || 'مستخدم ساعد',
              role: isBootstrap ? 'admin' : 'finance',
              department: 'إدارة مزادات المركبات',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(userRef, newProfile);
            setUserProfile({ ...newProfile, role: isBootstrap ? 'admin' : 'finance' });
          } else {
            setUserProfile(snap.data() as UserProfile);
          }
        } catch (err) {
          console.error('Profile sync check:', err);
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => {
      mounted = false;
      window.removeEventListener('online', syncConnection);
      window.removeEventListener('offline', handleOffline);
      unsub();
    };
  }, []);

  // Real-time Firestore listeners when authenticated (Production workspace)
  useEffect(() => {
    if (!authReady || !user) {
      setCloudAuctions([]);
      setCloudVehicles([]);
      setCloudCollections([]);
      setCloudReports([]);
      setCloudAuditLogs([]);
      setCloudSettings(null);
      setUsersList([]);
      return;
    }

    const isBootstrapAdmin = user.email === 'mr.aljefre@gmail.com' && user.emailVerified;

    const makeQuery = (colName: string) =>
      isBootstrapAdmin
        ? collection(db, colName)
        : query(collection(db, colName), where('ownerId', '==', user.uid));

    const unsubAuctions = onSnapshot(
      makeQuery('auctions'),
      (snap) => {
        setCloudAuctions(snap.docs.map((d) => d.data() as Auction).filter((a) => !a.isDemo));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'auctions')
    );

    const unsubVehicles = onSnapshot(
      makeQuery('vehicles'),
      (snap) => {
        setCloudVehicles(snap.docs.map((d) => d.data() as Vehicle).filter((v) => !v.isDemo));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'vehicles')
    );

    const unsubCollections = onSnapshot(
      makeQuery('collections'),
      (snap) => {
        setCloudCollections(snap.docs.map((d) => d.data() as CollectionRecord).filter((c) => !c.isDemo));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'collections')
    );

    const unsubReports = onSnapshot(
      makeQuery('approvedReports'),
      (snap) => {
        setCloudReports(snap.docs.map((d) => d.data() as ApprovedReport).filter((r) => !r.isDemo));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'approvedReports')
    );

    const unsubLogs = onSnapshot(
      makeQuery('auditLogs'),
      (snap) => {
        const items = snap.docs.map((d) => d.data() as AuditLog).filter((l) => !l.isDemo);
        items.sort((a, b) => String(b.id).localeCompare(String(a.id)));
        setCloudAuditLogs(items);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'auditLogs')
    );

    const unsubSettings = onSnapshot(
      makeQuery('systemSettings'),
      (snap) => {
        const first = snap.docs[0]?.data() as SystemSettings | undefined;
        setCloudSettings(first || null);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'systemSettings')
    );

    const usersQ = isBootstrapAdmin
      ? collection(db, 'users')
      : query(collection(db, 'users'), where('uid', '==', user.uid));

    const unsubUsers = onSnapshot(
      usersQ,
      (snap) => {
        setUsersList(snap.docs.map((d) => d.data() as UserProfile));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    );

    return () => {
      unsubAuctions();
      unsubVehicles();
      unsubCollections();
      unsubReports();
      unsubLogs();
      unsubSettings();
      unsubUsers();
    };
  }, [authReady, user]);

  const updateLocalStore = useCallback((updater: (prev: LocalStore) => LocalStore) => {
    setLocalStore((prev) => {
      const next = updater(prev);
      saveLocalStore(next);
      return next;
    });
  }, []);

  const updateDemoStore = useCallback((updater: (prev: DemoStore) => DemoStore) => {
    setDemoStore((prev) => {
      const next = updater(prev);
      saveDemoStore(next);
      return next;
    });
  }, []);

  const switchWorkspaceMode = useCallback((mode: WorkspaceMode) => {
    setWorkspaceMode(mode);
    try {
      localStorage.setItem(WORKSPACE_MODE_KEY, mode);
    } catch {
      // ignore
    }
  }, []);

  const isDemoMode = workspaceMode === 'demo';
  const isCloudMode = Boolean(user) && !isDemoMode;

  const auctions = isDemoMode
    ? demoStore.auctions
    : isCloudMode
      ? cloudAuctions
      : localStore.auctions;
  const vehicles = isDemoMode
    ? demoStore.vehicles
    : isCloudMode
      ? cloudVehicles
      : localStore.vehicles;
  const collections = isDemoMode
    ? demoStore.collections
    : isCloudMode
      ? cloudCollections
      : localStore.collections;
  const serviceRecords = isDemoMode
    ? demoStore.serviceRecords
    : isCloudMode
      ? []
      : localStore.serviceRecords;
  const approvedReports = isDemoMode
    ? demoStore.approvedReports
    : isCloudMode
      ? cloudReports
      : localStore.approvedReports;
  const auditLogs = isDemoMode
    ? demoStore.auditLogs
    : isCloudMode
      ? cloudAuditLogs
      : localStore.auditLogs;
  const settings = isDemoMode
    ? demoStore.settings
    : isCloudMode
      ? cloudSettings || { ...DEFAULT_SETTINGS, ownerId: user?.uid || 'local_user' }
      : localStore.settings;

  const activeRole: UserRole = isDemoMode
    ? localStore.localRole
    : isCloudMode
      ? userProfile?.role || (user?.email === 'mr.aljefre@gmail.com' ? 'admin' : 'finance')
      : localStore.localRole;

  const canEdit = activeRole === 'admin' || activeRole === 'finance';
  const canApprove = activeRole === 'admin' || activeRole === 'finance' || activeRole === 'auditor';
  const canManageSettings = activeRole === 'admin';

  const actorName =
    user?.displayName || userProfile?.displayName || 'خالد الهاشمي';

  const isDemoSeeded = demoStore.vehicles.length > 0;
  const novDemoVehs = demoStore.vehicles.filter((v) => v.year === 2026 && v.month === 11);
  const demoSeedSummary: DemoSeedSummary = {
    auctionsCount: demoStore.auctions.length,
    novemberVehiclesCount: novDemoVehs.length,
    novemberSoldCount: novDemoVehs.filter((v) => v.status === 'sold').length,
    novemberUnsoldCount: novDemoVehs.filter((v) => v.status === 'unsold').length,
    totalVehiclesCount: demoStore.vehicles.length,
    collectionsCount: demoStore.collections.length,
    servicesCount: demoStore.serviceRecords.length,
    reportsCount: demoStore.approvedReports.length,
    seededAt: demoStore.seededAt,
  };

  // --- Explicit On-Demand Demo Workspace Seeding (Idempotent & Isolated) ---
  const seedDemoWorkspace = useCallback(async (): Promise<{
    ok: boolean;
    persistedToStorage: boolean;
    message: string;
  }> => {
    const logs: string[] = [];
    const uae = getUaeCurrentDate();
    try {
      const dataset = generateDemoDataset('demo_workspace');
      logs.push(`[${uae.formattedDateTime}] بدء التهيئة المعزولة لبيئة العرض التجريبي (Demo Workspace)...`);
      logs.push(
        `[${uae.formattedDateTime}] تم توليد ${dataset.auctions.length} مزادات، ${dataset.vehicles.length} مركبة (منها 1,250 في نوفمبر 2026)، ${dataset.collections.length} سند تحصيل، ${dataset.serviceRecords.length} قيد خدمات.`
      );

      const nowIso = new Date().toISOString();
      const seedAuditEntry: AuditLog = {
        id: generateSafeId('demo_log'),
        entityType: 'demo_workspace',
        entityId: 'DEMO-SEED-2026',
        action: 'تهيئة البيانات التجريبية',
        summary: `تمت تهيئة بيئة العرض التجريبي بـ ${dataset.vehicles.length} مركبة و${dataset.collections.length} عملية تحصيل و${dataset.serviceRecords.length} قيد خدمة (بأسلوب Idempotent دون تكرار).`,
        actorName,
        year: 2026,
        month: 11,
        isDemo: true,
        ownerId: 'demo_workspace',
        createdAt: nowIso,
      };

      const nextDemoStore: DemoStore = {
        auctions: dataset.auctions,
        vehicles: dataset.vehicles,
        collections: dataset.collections,
        serviceRecords: dataset.serviceRecords,
        approvedReports: dataset.approvedReports,
        auditLogs: [seedAuditEntry],
        settings: DEFAULT_DEMO_SETTINGS,
        seededAt: nowIso,
        seedLog: [],
      };

      const persisted = saveDemoStore(nextDemoStore);
      if (persisted) {
        logs.push(`[${uae.formattedDateTime}] تم الحفظ بنجاح في مساحة التخزين المعزولة للمتصفح (لا يتم المساس بقاعدة بيانات الإنتاج).`);
      } else {
        logs.push(`[${uae.formattedDateTime}] تنبيه: سعة التخزين المحلي ممتلئة؛ البيانات التجريبية نشطة في ذاكرة الجلسة الحالية ولن تؤثر على بيانات الإنتاج.`);
      }
      nextDemoStore.seedLog = logs;
      if (persisted) saveDemoStore(nextDemoStore);

      setDemoStore(nextDemoStore);
      switchWorkspaceMode('demo');
      return {
        ok: true,
        persistedToStorage: persisted,
        message: persisted
          ? 'تمت تهيئة وتفعيل بيئة العرض التجريبي (Demo) بنجاح دون المساس ببيانات الإنتاج.'
          : 'تم تفعيل بيئة العرض التجريبي في الذاكرة الحالية (تعذر الحفظ في localStorage بسبب السعة).',
      };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'خطأ غير متوقع أثناء تهيئة البيانات التجريبية';
      logs.push(`[${uae.formattedDateTime}] فشل التهيئة: ${errMsg}`);
      updateDemoStore((prev) => ({ ...prev, seedLog: logs }));
      return { ok: false, persistedToStorage: false, message: errMsg };
    }
  }, [actorName, switchWorkspaceMode, updateDemoStore]);

  const clearDemoWorkspace = useCallback(() => {
    const emptyDemo: DemoStore = {
      auctions: [],
      vehicles: [],
      collections: [],
      serviceRecords: [],
      approvedReports: [],
      auditLogs: [],
      settings: DEFAULT_DEMO_SETTINGS,
      seedLog: [`[${getUaeCurrentDate().formattedDateTime}] تم حذف بيانات Demo فقط بنجاح دون المساس ببيانات الإنتاج.`],
    };
    setDemoStore(emptyDemo);
    try {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      const host = typeof window !== 'undefined' ? window.location.hostname : '';

      if (code === 'auth/unauthorized-domain') {
        setAuthError(
          `النطاق (${host || 'الحالي'}) غير مضاف في قائمة النطاقات المصرح بها (Authorized Domains) داخل Firebase Authentication. يمكنك إضافة النطاق في لوحة تحكم Firebase أو الاستمرار بالعمل في الوضع المحلي / بيئة العرض التجريبي.`
        );
      } else if (code === 'auth/popup-blocked') {
        setAuthError(
          'تم حظر نافذة تسجيل الدخول المنبثقة من المتصفح. يرجى السماح بالنوافذ المنبثقة لهذا الموقع ثم إعادة المحاولة.'
        );
      } else if (code === 'auth/popup-closed-by-user') {
        setAuthError('تم إغلاق نافذة تسجيل الدخول قبل إتمام المصادقة.');
      } else if (code === 'auth/network-request-failed') {
        setAuthError(
          'تعذر الاتصال بخدمة المصادقة السحابية. تحقق من الاتصال بالإنترنت أو استمر بالعمل في الوضع المحلي.'
        );
      } else {
        const msg = err instanceof Error ? err.message : 'تعذر تسجيل الدخول عبر Google';
        setAuthError(msg);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const addAuditEntry = useCallback(
    async (
      entityType: string,
      entityId: string,
      action: string,
      summary: string,
      year?: number,
      month?: number
    ) => {
      const uae = getUaeCurrentDate();
      const logId = generateSafeId('log');
      const entry: AuditLog = {
        id: logId,
        entityType: entityType.slice(0, 64),
        entityId: entityId.slice(0, 128),
        action: action.slice(0, 64),
        summary: summary.slice(0, 500),
        actorName: actorName.slice(0, 120),
        year: year || uae.year,
        month: month || uae.month,
        ...(isDemoMode ? { isDemo: true } : {}),
        ownerId: isDemoMode ? 'demo_workspace' : user?.uid || 'local_user',
        createdAt: isCloudMode ? serverTimestamp() : new Date().toISOString(),
      };

      if (isDemoMode) {
        updateDemoStore((prev) => ({
          ...prev,
          auditLogs: [entry, ...prev.auditLogs].slice(0, 250),
        }));
      } else if (isCloudMode && user) {
        try {
          await setDoc(doc(db, 'auditLogs', logId), entry);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `auditLogs/${logId}`);
        }
      } else {
        updateLocalStore((prev) => ({
          ...prev,
          auditLogs: [entry, ...prev.auditLogs].slice(0, 250),
        }));
      }
    },
    [actorName, isCloudMode, isDemoMode, updateDemoStore, updateLocalStore, user]
  );

  // --- CRUD Actions ---
  const saveAuction = useCallback(
    async (
      payload: Omit<Auction, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
      existingId?: string
    ) => {
      if (!canEdit) throw new Error('ليس لديك صلاحية تعديل المزادات');
      const id = existingId || generateSafeId(isDemoMode ? 'DEMO-AUC' : 'auc');
      const ownerId = isDemoMode ? 'demo_workspace' : user?.uid || 'local_user';

      if (isDemoMode) {
        const nowIso = new Date().toISOString();
        updateDemoStore((prev) => {
          const exists = prev.auctions.some((a) => a.id === id);
          const nextAuctions = exists
            ? prev.auctions.map((a) =>
                a.id === id ? { ...a, ...payload, isDemo: true, updatedAt: nowIso } : a
              )
            : [
                {
                  ...payload,
                  id,
                  isDemo: true,
                  ownerId,
                  createdAt: nowIso,
                  updatedAt: nowIso,
                },
                ...prev.auctions,
              ];
          return { ...prev, auctions: nextAuctions };
        });
      } else if (isCloudMode && user) {
        const ref = doc(db, 'auctions', id);
        if (existingId) {
          try {
            await updateDoc(ref, {
              title: payload.title.slice(0, 200),
              auctionCode: payload.auctionCode.slice(0, 64),
              location: payload.location.slice(0, 120),
              year: payload.year,
              month: payload.month,
              ...(payload.auctionDate ? { auctionDate: payload.auctionDate.slice(0, 32) } : {}),
              status: payload.status,
              saaedSharePercent: payload.saaedSharePercent,
              thirdPartySharePercent: payload.thirdPartySharePercent,
              ...(payload.notes !== undefined ? { notes: payload.notes.slice(0, 1000) } : {}),
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `auctions/${id}`);
          }
        } else {
          const newDoc: Auction = {
            id,
            title: payload.title.slice(0, 200),
            auctionCode: payload.auctionCode.slice(0, 64),
            location: payload.location.slice(0, 120),
            year: payload.year,
            month: payload.month,
            ...(payload.auctionDate ? { auctionDate: payload.auctionDate.slice(0, 32) } : {}),
            status: payload.status,
            saaedSharePercent: payload.saaedSharePercent,
            thirdPartySharePercent: payload.thirdPartySharePercent,
            ...(payload.notes ? { notes: payload.notes.slice(0, 1000) } : {}),
            ownerId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          try {
            await setDoc(ref, newDoc);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `auctions/${id}`);
          }
        }
      } else {
        const nowIso = new Date().toISOString();
        updateLocalStore((prev) => {
          const exists = prev.auctions.some((a) => a.id === id);
          const nextAuctions = exists
            ? prev.auctions.map((a) =>
                a.id === id ? { ...a, ...payload, updatedAt: nowIso } : a
              )
            : [
                {
                  ...payload,
                  id,
                  ownerId,
                  createdAt: nowIso,
                  updatedAt: nowIso,
                },
                ...prev.auctions,
              ];
          return { ...prev, auctions: nextAuctions };
        });
      }

      await addAuditEntry(
        'auction',
        id,
        existingId ? 'تحديث مزاد' : 'إنشاء مزاد',
        `${existingId ? 'تحديث بيانات' : 'إضافة'} المزاد "${payload.title}" (${payload.auctionCode})`,
        payload.year,
        payload.month
      );
      return id;
    },
    [addAuditEntry, canEdit, isCloudMode, isDemoMode, updateDemoStore, updateLocalStore, user]
  );

  const deleteAuction = useCallback(
    async (auction: Auction) => {
      if (!canEdit) throw new Error('ليس لديك صلاحية حذف المزادات');
      if (isDemoMode) {
        updateDemoStore((prev) => ({
          ...prev,
          auctions: prev.auctions.filter((a) => a.id !== auction.id),
        }));
      } else if (isCloudMode) {
        try {
          await deleteDoc(doc(db, 'auctions', auction.id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `auctions/${auction.id}`);
        }
      } else {
        updateLocalStore((prev) => ({
          ...prev,
          auctions: prev.auctions.filter((a) => a.id !== auction.id),
        }));
      }
      await addAuditEntry(
        'auction',
        auction.id,
        'حذف مزاد',
        `حذف المزاد "${auction.title}" (${auction.auctionCode})`,
        auction.year,
        auction.month
      );
    },
    [addAuditEntry, canEdit, isCloudMode, isDemoMode, updateDemoStore, updateLocalStore]
  );

  const syncVehicleServiceRecords = (
    existingServices: ServiceFeeRecord[],
    vehicle: Vehicle,
    isDemo: boolean,
    nowIso: string
  ): ServiceFeeRecord[] => {
    const others = existingServices.filter((s) => s.vehicleId !== vehicle.id);
    const feeMap: Array<{
      type: 'platform' | 'admin' | 'forklift' | 'recovery';
      amount: number;
      beneficiary: string;
    }> = [
      { type: 'platform', amount: vehicle.platformFee, beneficiary: 'شركة ساعد – رسوم المنصة الإلكترونية' },
      { type: 'admin', amount: vehicle.adminFee, beneficiary: 'شركة ساعد – الرسوم الإدارية' },
      { type: 'forklift', amount: vehicle.forkliftFee, beneficiary: 'شركة ساعد – تشغيل الرافعات الشوكية' },
      { type: 'recovery', amount: vehicle.recoveryFee, beneficiary: 'شركة ساعد – خدمات الريكفري والنقل' },
    ];
    const generated: ServiceFeeRecord[] = [];
    for (const item of feeMap) {
      if (item.amount > 0) {
        const srvId = `${isDemo ? 'DEMO-SRV' : 'srv'}_${vehicle.id}_${item.type}`;
        generated.push({
          id: srvId,
          serviceCode: srvId,
          serviceType: item.type,
          auctionId: vehicle.auctionId,
          vehicleId: vehicle.id,
          lotNumber: vehicle.lotNumber,
          serviceDate: vehicle.saleDate || getUaeCurrentDate().isoDate,
          amountDue: item.amount,
          collectedAmount: item.amount,
          collectionStatus: 'collected',
          referenceNo: `SRV-${vehicle.lotNumber}-${item.type.toUpperCase()}`,
          beneficiary: item.beneficiary,
          year: vehicle.year,
          month: vehicle.month,
          location: vehicle.location,
          ...(isDemo ? { isDemo: true } : {}),
          ownerId: vehicle.ownerId,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }
    }
    return [...generated, ...others];
  };

  const saveVehicle = useCallback(
    async (
      payload: Omit<Vehicle, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
      existingId?: string
    ) => {
      if (!canEdit) throw new Error('ليس لديك صلاحية تعديل المركبات');
      const id = existingId || generateSafeId(isDemoMode ? 'DEMO-VEH' : 'veh');
      const ownerId = isDemoMode ? 'demo_workspace' : user?.uid || 'local_user';

      if (isDemoMode || !isCloudMode) {
        const nowIso = new Date().toISOString();
        const payStatus: 'paid' | 'partial' | 'unpaid' =
          payload.status === 'unsold'
            ? 'unpaid'
            : payload.collectedAmount >= payload.salePrice && payload.salePrice > 0
              ? 'paid'
              : payload.collectedAmount > 0
                ? 'partial'
                : 'unpaid';

        const updatedVehicle: Vehicle = {
          ...payload,
          id,
          paymentStatus: payStatus,
          ...(payload.status === 'sold' && !payload.saleDate
            ? { saleDate: getUaeCurrentDate().isoDate }
            : {}),
          ...(isDemoMode ? { isDemo: true } : {}),
          ownerId,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        const applyUpdate = <T extends { vehicles: Vehicle[]; serviceRecords: ServiceFeeRecord[]; collections: CollectionRecord[] }>(
          prev: T
        ): T => {
          const exists = prev.vehicles.some((v) => v.id === id);
          const nextVehicles = exists
            ? prev.vehicles.map((v) =>
                v.id === id ? { ...v, ...updatedVehicle, createdAt: v.createdAt || nowIso } : v
              )
            : [updatedVehicle, ...prev.vehicles];

          const nextServices = syncVehicleServiceRecords(
            prev.serviceRecords,
            updatedVehicle,
            isDemoMode,
            nowIso
          );

          // Keep linked collection record synchronized if exactly 1 collection record exists for this vehicle
          const linkedCols = prev.collections.filter((c) => c.vehicleId === id);
          let nextCollections = prev.collections;
          if (linkedCols.length === 1 && payload.status === 'sold') {
            nextCollections = prev.collections.map((c) =>
              c.vehicleId === id
                ? {
                    ...c,
                    amountDue: payload.salePrice,
                    amount: payload.collectedAmount,
                    remainingAmount: Math.max(0, payload.salePrice - payload.collectedAmount),
                    paymentStatus: payStatus,
                    updatedAt: nowIso,
                  }
                : c
            );
          } else if (linkedCols.length === 0 && payload.status === 'sold' && payload.collectedAmount > 0) {
            const payId = generateSafeId(isDemoMode ? 'DEMO-PAY' : 'col');
            nextCollections = [
              {
                id: payId,
                auctionId: payload.auctionId,
                vehicleId: id,
                lotNumber: payload.lotNumber,
                receiptNo: payId,
                bidderName: payload.buyerName || 'مزايد',
                amountDue: payload.salePrice,
                amount: payload.collectedAmount,
                remainingAmount: Math.max(0, payload.salePrice - payload.collectedAmount),
                paymentStatus: payStatus,
                method: 'bank_transfer',
                collectionDate: updatedVehicle.saleDate || getUaeCurrentDate().isoDate,
                financialRef: `FIN-${payload.lotNumber}`,
                collectionType: 'vehicle_sale',
                year: payload.year,
                month: payload.month,
                location: payload.location,
                notes: 'قيد تحصيل مرتبط تلقائياً بالمركبة',
                ...(isDemoMode ? { isDemo: true } : {}),
                ownerId,
                createdAt: nowIso,
                updatedAt: nowIso,
              },
              ...prev.collections,
            ];
          }

          return {
            ...prev,
            vehicles: nextVehicles,
            serviceRecords: nextServices,
            collections: nextCollections,
          };
        };

        if (isDemoMode) {
          updateDemoStore((prev) => applyUpdate(prev));
        } else {
          updateLocalStore((prev) => applyUpdate(prev));
        }
      } else if (isCloudMode && user) {
        const ref = doc(db, 'vehicles', id);
        if (existingId) {
          try {
            await updateDoc(ref, {
              auctionId: payload.auctionId,
              lotNumber: payload.lotNumber.slice(0, 64),
              make: payload.make.slice(0, 80),
              model: payload.model.slice(0, 80),
              modelYear: payload.modelYear,
              ...(payload.vin !== undefined ? { vin: payload.vin.slice(0, 64) } : {}),
              location: payload.location.slice(0, 120),
              year: payload.year,
              month: payload.month,
              estimatedValue: payload.estimatedValue,
              salePrice: payload.salePrice,
              collectedAmount: payload.collectedAmount,
              status: payload.status,
              ...(payload.saleDate ? { saleDate: payload.saleDate } : {}),
              platformFee: payload.platformFee,
              adminFee: payload.adminFee,
              forkliftFee: payload.forkliftFee,
              recoveryFee: payload.recoveryFee,
              ...(payload.buyerName !== undefined ? { buyerName: payload.buyerName.slice(0, 120) } : {}),
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `vehicles/${id}`);
          }
        } else {
          const newDoc: Vehicle = {
            id,
            auctionId: payload.auctionId,
            lotNumber: payload.lotNumber.slice(0, 64),
            make: payload.make.slice(0, 80),
            model: payload.model.slice(0, 80),
            modelYear: payload.modelYear,
            ...(payload.vin ? { vin: payload.vin.slice(0, 64) } : {}),
            location: payload.location.slice(0, 120),
            year: payload.year,
            month: payload.month,
            estimatedValue: payload.estimatedValue,
            salePrice: payload.salePrice,
            collectedAmount: payload.collectedAmount,
            status: payload.status,
            ...(payload.saleDate ? { saleDate: payload.saleDate } : {}),
            platformFee: payload.platformFee,
            adminFee: payload.adminFee,
            forkliftFee: payload.forkliftFee,
            recoveryFee: payload.recoveryFee,
            ...(payload.buyerName ? { buyerName: payload.buyerName.slice(0, 120) } : {}),
            ownerId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          try {
            await setDoc(ref, newDoc);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `vehicles/${id}`);
          }
        }
      }

      await addAuditEntry(
        'vehicle',
        id,
        existingId ? 'تحديث مركبة' : 'إضافة مركبة',
        `${existingId ? 'تحديث' : 'إدراج'} مركبة ${payload.make} ${payload.model} (لوت ${payload.lotNumber})`,
        payload.year,
        payload.month
      );
      return id;
    },
    [addAuditEntry, canEdit, isCloudMode, isDemoMode, updateDemoStore, updateLocalStore, user]
  );

  const updateVehicleSaleDate = useCallback(
    async (vehicleId: string, newSaleDate: string): Promise<Vehicle> => {
      if (!canEdit) {
        throw new Error('ليس لديك صلاحية تعديل تاريخ بيع المركبة حسب مستوى الصلاحية الحالي.');
      }
      const parsed = parseIsoDateParts(newSaleDate);
      if (!parsed) {
        throw new Error('تاريخ البيع غير صالح. يجب إدخال تاريخ صحيح بصيغة YYYY-MM-DD.');
      }
      const normalizedDate = formatIsoDateParts(parsed.year, parsed.month, parsed.day);
      const target = vehicles.find((v) => v.id === vehicleId);
      if (!target) {
        throw new Error('تعذر العثور على سجل المركبة المحدد لتحديث تاريخ البيع.');
      }

      const previousDate = target.saleDate || 'غير محدد';
      let updatedRecord: Vehicle = {
        ...target,
        saleDate: normalizedDate,
        year: parsed.year,
        month: parsed.month,
      };

      if (isDemoMode || !isCloudMode) {
        const nowIso = new Date().toISOString();
        updatedRecord = {
          ...updatedRecord,
          updatedAt: nowIso,
        };
        const applyDateUpdate = <T extends { vehicles: Vehicle[] }>(prev: T): T => ({
          ...prev,
          vehicles: prev.vehicles.map((v) =>
            v.id === vehicleId
              ? {
                  ...v,
                  saleDate: normalizedDate,
                  year: parsed.year,
                  month: parsed.month,
                  updatedAt: nowIso,
                }
              : v
          ),
        });
        if (isDemoMode) {
          updateDemoStore((prev) => applyDateUpdate(prev));
        } else {
          updateLocalStore((prev) => applyDateUpdate(prev));
        }
      } else if (isCloudMode && user) {
        const ref = doc(db, 'vehicles', vehicleId);
        try {
          await updateDoc(ref, {
            saleDate: normalizedDate,
            year: parsed.year,
            month: parsed.month,
            updatedAt: serverTimestamp(),
          });
          const verifiedSnap = await getDocFromServer(ref).catch(() => getDoc(ref));
          if (!verifiedSnap.exists()) {
            throw new Error('تعذر التحقق من سجل المركبة بعد تحديث تاريخ البيع في قاعدة البيانات.');
          }
          const serverData = verifiedSnap.data() as Vehicle;
          if (serverData.saleDate !== normalizedDate) {
            throw new Error('لم تتطابق القيمة المحفوظة في قاعدة البيانات مع التاريخ الجديد.');
          }
          updatedRecord = serverData;
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `vehicles/${vehicleId}`);
        }
      }

      await addAuditEntry(
        'vehicle',
        vehicleId,
        'تعديل تاريخ البيع',
        `تعديل تاريخ بيع المركبة ${target.make} ${target.model} (لوت ${target.lotNumber}) من ${previousDate} إلى ${normalizedDate}`,
        parsed.year,
        parsed.month
      );

      return updatedRecord;
    },
    [addAuditEntry, canEdit, isCloudMode, isDemoMode, updateDemoStore, updateLocalStore, user, vehicles]
  );

  const bulkImportVehicles = useCallback(
    async (
      items: Omit<Vehicle, 'createdAt' | 'updatedAt'>[],
      year: number,
      month: number
    ) => {
      if (!canEdit) throw new Error('ليس لديك صلاحية استيراد المركبات');
      if (items.length === 0) return;
      const ownerId = isDemoMode ? 'demo_workspace' : user?.uid || 'local_user';

      if (isDemoMode) {
        const nowIso = new Date().toISOString();
        updateDemoStore((prev) => ({
          ...prev,
          vehicles: [
            ...items.map((it) => ({
              ...it,
              isDemo: true,
              ownerId,
              createdAt: nowIso,
              updatedAt: nowIso,
            })),
            ...prev.vehicles,
          ],
        }));
      } else if (isCloudMode && user) {
        const chunkSize = 400;
        for (let i = 0; i < items.length; i += chunkSize) {
          const chunk = items.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          for (const item of chunk) {
            const ref = doc(db, 'vehicles', item.id);
            batch.set(ref, {
              ...item,
              ownerId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
          try {
            await batch.commit();
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'vehicles/bulkImport');
          }
        }
      } else {
        const nowIso = new Date().toISOString();
        updateLocalStore((prev) => ({
          ...prev,
          vehicles: [
            ...items.map((it) => ({
              ...it,
              ownerId,
              createdAt: nowIso,
              updatedAt: nowIso,
            })),
            ...prev.vehicles,
          ],
        }));
      }

      await addAuditEntry(
        'vehicle_import',
        generateSafeId('imp'),
        'استيراد Excel/CSV',
        `استيراد ${items.length} مركبة إلى النظام المالي`,
        year,
        month
      );
    },
    [addAuditEntry, canEdit, isCloudMode, isDemoMode, updateDemoStore, updateLocalStore, user]
  );

  const deleteVehicle = useCallback(
    async (vehicle: Vehicle) => {
      if (!canEdit) throw new Error('ليس لديك صلاحية حذف المركبات');
      if (isDemoMode) {
        updateDemoStore((prev) => ({
          ...prev,
          vehicles: prev.vehicles.filter((v) => v.id !== vehicle.id),
          collections: prev.collections.filter((c) => c.vehicleId !== vehicle.id),
          serviceRecords: prev.serviceRecords.filter((s) => s.vehicleId !== vehicle.id),
        }));
      } else if (isCloudMode) {
        try {
          await deleteDoc(doc(db, 'vehicles', vehicle.id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `vehicles/${vehicle.id}`);
        }
      } else {
        updateLocalStore((prev) => ({
          ...prev,
          vehicles: prev.vehicles.filter((v) => v.id !== vehicle.id),
          collections: prev.collections.filter((c) => c.vehicleId !== vehicle.id),
          serviceRecords: prev.serviceRecords.filter((s) => s.vehicleId !== vehicle.id),
        }));
      }
      await addAuditEntry(
        'vehicle',
        vehicle.id,
        'حذف مركبة',
        `حذف المركبة ${vehicle.make} ${vehicle.model} (لوت ${vehicle.lotNumber})`,
        vehicle.year,
        vehicle.month
      );
    },
    [addAuditEntry, canEdit, isCloudMode, isDemoMode, updateDemoStore, updateLocalStore]
  );

  const saveCollection = useCallback(
    async (
      payload: Omit<CollectionRecord, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
      existingId?: string
    ) => {
      if (!canEdit) throw new Error('ليس لديك صلاحية تسجيل التحصيلات');
      const id = existingId || generateSafeId(isDemoMode ? 'DEMO-PAY' : 'col');
      const ownerId = isDemoMode ? 'demo_workspace' : user?.uid || 'local_user';

      if (isDemoMode || !isCloudMode) {
        const nowIso = new Date().toISOString();
        const applyColUpdate = <T extends { collections: CollectionRecord[]; vehicles: Vehicle[] }>(
          prev: T
        ): T => {
          const linkedVeh = payload.vehicleId
            ? prev.vehicles.find((v) => v.id === payload.vehicleId)
            : undefined;
          const exists = prev.collections.some((c) => c.id === id);

          const nextVehicles = payload.vehicleId
            ? prev.vehicles.map((v) => {
                if (v.id !== payload.vehicleId) return v;
                const prevAmount = exists
                  ? prev.collections.find((c) => c.id === id)?.amount || 0
                  : 0;
                const newCollected = Math.max(0, (v.collectedAmount || 0) - prevAmount + payload.amount);
                const pStatus: 'paid' | 'partial' | 'unpaid' =
                  newCollected >= v.salePrice && v.salePrice > 0
                    ? 'paid'
                    : newCollected > 0
                      ? 'partial'
                      : 'unpaid';
                return {
                  ...v,
                  collectedAmount: newCollected,
                  paymentStatus: pStatus,
                  updatedAt: nowIso,
                };
              })
            : prev.vehicles;

          const updatedVehAfter = payload.vehicleId
            ? nextVehicles.find((v) => v.id === payload.vehicleId)
            : undefined;
          const amountDue = updatedVehAfter?.salePrice ?? payload.amountDue ?? payload.amount;
          const remaining = Math.max(0, amountDue - (updatedVehAfter?.collectedAmount ?? payload.amount));
          const paymentStatus: 'paid' | 'partial' | 'unpaid' =
            remaining === 0 && amountDue > 0 ? 'paid' : payload.amount > 0 ? 'partial' : 'unpaid';

          const enrichedRecord: CollectionRecord = {
            ...payload,
            id,
            lotNumber: linkedVeh?.lotNumber || payload.lotNumber,
            amountDue,
            remainingAmount: remaining,
            paymentStatus,
            collectionType: payload.collectionType || 'vehicle_sale',
            financialRef: payload.financialRef || `FIN-${payload.receiptNo}`,
            ...(isDemoMode ? { isDemo: true } : {}),
            ownerId,
            createdAt: nowIso,
            updatedAt: nowIso,
          };

          const nextCollections = exists
            ? prev.collections.map((c) => (c.id === id ? { ...c, ...enrichedRecord } : c))
            : [enrichedRecord, ...prev.collections];

          return { ...prev, collections: nextCollections, vehicles: nextVehicles };
        };

        if (isDemoMode) {
          updateDemoStore((prev) => applyColUpdate(prev));
        } else {
          updateLocalStore((prev) => applyColUpdate(prev));
        }
      } else if (isCloudMode && user) {
        const ref = doc(db, 'collections', id);
        const firestorePayload = {
          auctionId: payload.auctionId,
          ...(payload.vehicleId ? { vehicleId: payload.vehicleId } : {}),
          receiptNo: payload.receiptNo.slice(0, 64),
          bidderName: payload.bidderName.slice(0, 120),
          amount: payload.amount,
          method: payload.method,
          collectionDate: payload.collectionDate.slice(0, 32),
          year: payload.year,
          month: payload.month,
          ...(payload.location ? { location: payload.location.slice(0, 120) } : {}),
          ...(payload.notes ? { notes: payload.notes.slice(0, 500) } : {}),
        };

        if (existingId) {
          try {
            await updateDoc(ref, {
              ...firestorePayload,
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `collections/${id}`);
          }
        } else {
          try {
            await setDoc(ref, {
              ...firestorePayload,
              id,
              ownerId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `collections/${id}`);
          }
        }

        if (!existingId && payload.vehicleId) {
          const targetVeh = vehicles.find((v) => v.id === payload.vehicleId);
          if (targetVeh) {
            try {
              await updateDoc(doc(db, 'vehicles', targetVeh.id), {
                collectedAmount: (targetVeh.collectedAmount || 0) + payload.amount,
                updatedAt: serverTimestamp(),
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, `vehicles/${targetVeh.id}`);
            }
          }
        }
      }

      await addAuditEntry(
        'collection',
        id,
        existingId ? 'تحديث سند تحصيل' : 'تسجيل سند تحصيل',
        `سند تحصيل رقم ${payload.receiptNo} بمبلغ AED ${payload.amount} من ${payload.bidderName}`,
        payload.year,
        payload.month
      );
      return id;
    },
    [addAuditEntry, canEdit, isCloudMode, isDemoMode, updateDemoStore, updateLocalStore, user, vehicles]
  );

  const updateCollectionDate = useCallback(
    async (collectionId: string, newCollectionDate: string): Promise<CollectionRecord> => {
      if (!canEdit) {
        throw new Error('ليس لديك صلاحية تعديل تاريخ الدفع حسب مستوى الصلاحية الحالي.');
      }
      const parsed = parseIsoDateParts(newCollectionDate);
      if (!parsed) {
        throw new Error('تاريخ الدفع غير صالح. يجب إدخال تاريخ صحيح بصيغة YYYY-MM-DD.');
      }
      const normalizedDate = formatIsoDateParts(parsed.year, parsed.month, parsed.day);
      const target = collections.find((c) => c.id === collectionId);
      if (!target) {
        throw new Error('تعذر العثور على سجل عملية التحصيل المحددة لتحديث تاريخ الدفع.');
      }

      const previousDate = target.collectionDate || 'غير محدد';
      let updatedRecord: CollectionRecord = {
        ...target,
        collectionDate: normalizedDate,
        year: parsed.year,
        month: parsed.month,
      };

      if (isDemoMode || !isCloudMode) {
        const nowIso = new Date().toISOString();
        updatedRecord = {
          ...updatedRecord,
          updatedAt: nowIso,
        };
        const applyDateUpdate = <T extends { collections: CollectionRecord[] }>(prev: T): T => ({
          ...prev,
          collections: prev.collections.map((c) =>
            c.id === collectionId
              ? {
                  ...c,
                  collectionDate: normalizedDate,
                  year: parsed.year,
                  month: parsed.month,
                  updatedAt: nowIso,
                }
              : c
          ),
        });
        if (isDemoMode) {
          updateDemoStore((prev) => applyDateUpdate(prev));
        } else {
          updateLocalStore((prev) => applyDateUpdate(prev));
        }
      } else if (isCloudMode && user) {
        const ref = doc(db, 'collections', collectionId);
        try {
          await updateDoc(ref, {
            collectionDate: normalizedDate,
            year: parsed.year,
            month: parsed.month,
            updatedAt: serverTimestamp(),
          });
          const verifiedSnap = await getDocFromServer(ref).catch(() => getDoc(ref));
          if (!verifiedSnap.exists()) {
            throw new Error('تعذر التحقق من سجل التحصيل بعد تحديث تاريخ الدفع في قاعدة البيانات.');
          }
          const serverData = verifiedSnap.data() as CollectionRecord;
          if (serverData.collectionDate !== normalizedDate) {
            throw new Error('لم تتطابق القيمة المحفوظة في قاعدة البيانات مع تاريخ الدفع الجديد.');
          }
          updatedRecord = serverData;
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `collections/${collectionId}`);
        }
      }

      await addAuditEntry(
        'collection',
        collectionId,
        'تعديل تاريخ الدفع',
        `تعديل تاريخ الدفع لعملية التحصيل ${target.receiptNo} (${target.bidderName}) من ${previousDate} إلى ${normalizedDate}`,
        parsed.year,
        parsed.month
      );

      return updatedRecord;
    },
    [addAuditEntry, canEdit, collections, isCloudMode, isDemoMode, updateDemoStore, updateLocalStore, user]
  );

  const deleteCollection = useCallback(
    async (record: CollectionRecord) => {
      if (!canEdit) throw new Error('ليس لديك صلاحية حذف التحصيلات');
      if (isDemoMode || !isCloudMode) {
        const nowIso = new Date().toISOString();
        const applyDel = <T extends { collections: CollectionRecord[]; vehicles: Vehicle[] }>(
          prev: T
        ): T => ({
          ...prev,
          collections: prev.collections.filter((c) => c.id !== record.id),
          vehicles: record.vehicleId
            ? prev.vehicles.map((v) => {
                if (v.id !== record.vehicleId) return v;
                const nextCollected = Math.max(0, (v.collectedAmount || 0) - record.amount);
                return {
                  ...v,
                  collectedAmount: nextCollected,
                  paymentStatus: nextCollected >= v.salePrice && v.salePrice > 0 ? 'paid' : nextCollected > 0 ? 'partial' : 'unpaid',
                  updatedAt: nowIso,
                };
              })
            : prev.vehicles,
        });
        if (isDemoMode) updateDemoStore(applyDel);
        else updateLocalStore(applyDel);
      } else if (isCloudMode) {
        try {
          await deleteDoc(doc(db, 'collections', record.id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `collections/${record.id}`);
        }
      }
      await addAuditEntry(
        'collection',
        record.id,
        'حذف سند تحصيل',
        `حذف سند تحصيل رقم ${record.receiptNo} بمبلغ AED ${record.amount}`,
        record.year,
        record.month
      );
    },
    [addAuditEntry, canEdit, isCloudMode, isDemoMode, updateDemoStore, updateLocalStore]
  );

  // --- Granular Service Fee Records CRUD (synced bi-directionally with Vehicles) ---
  const saveServiceRecord = useCallback(
    async (
      payload: Omit<ServiceFeeRecord, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
    ) => {
      if (!canEdit) throw new Error('ليس لديك صلاحية إضافة أو تعديل رسوم الخدمات');
      if (isCloudMode) {
        // In cloud mode, map service fee directly onto linked vehicle field so Firestore rules stay 100% compliant
        if (payload.vehicleId) {
          const target = vehicles.find((v) => v.id === payload.vehicleId);
          if (target) {
            const fieldMap = {
              platform: 'platformFee',
              admin: 'adminFee',
              forklift: 'forkliftFee',
              recovery: 'recoveryFee',
            } as const;
            const key = fieldMap[payload.serviceType];
            await saveVehicle({ ...target, [key]: (target[key] || 0) + payload.collectedAmount }, target.id);
          }
        }
        return generateSafeId('srv');
      }

      const id = generateSafeId(isDemoMode ? 'DEMO-SRV' : 'srv');
      const nowIso = new Date().toISOString();
      const ownerId = isDemoMode ? 'demo_workspace' : 'local_user';
      const newRecord: ServiceFeeRecord = {
        ...payload,
        id,
        serviceCode: payload.serviceCode || id,
        ...(isDemoMode ? { isDemo: true } : {}),
        ownerId,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const applySrv = <T extends { serviceRecords: ServiceFeeRecord[]; vehicles: Vehicle[] }>(
        prev: T
      ): T => {
        const nextServices = [newRecord, ...prev.serviceRecords];
        const nextVehicles = payload.vehicleId
          ? prev.vehicles.map((v) => {
              if (v.id !== payload.vehicleId) return v;
              const vehServices = nextServices.filter((s) => s.vehicleId === v.id);
              const sumType = (t: ServiceFeeRecord['serviceType']) =>
                vehServices.filter((s) => s.serviceType === t).reduce((sum, s) => sum + s.collectedAmount, 0);
              return {
                ...v,
                platformFee: sumType('platform'),
                adminFee: sumType('admin'),
                forkliftFee: sumType('forklift'),
                recoveryFee: sumType('recovery'),
                updatedAt: nowIso,
              };
            })
          : prev.vehicles;
        return { ...prev, serviceRecords: nextServices, vehicles: nextVehicles };
      };

      if (isDemoMode) updateDemoStore(applySrv);
      else updateLocalStore(applySrv);

      await addAuditEntry(
        'service_fee',
        id,
        'إضافة رسم خدمة',
        `تسجيل رسم ${payload.serviceType} بمبلغ AED ${payload.collectedAmount} (${newRecord.serviceCode})`,
        payload.year,
        payload.month
      );
      return id;
    },
    [addAuditEntry, canEdit, isCloudMode, isDemoMode, saveVehicle, updateDemoStore, updateLocalStore, vehicles]
  );

  const deleteServiceRecord = useCallback(
    async (record: ServiceFeeRecord) => {
      if (!canEdit) throw new Error('ليس لديك صلاحية حذف قيود الخدمات');
      const nowIso = new Date().toISOString();
      const applyDel = <T extends { serviceRecords: ServiceFeeRecord[]; vehicles: Vehicle[] }>(
        prev: T
      ): T => {
        const nextServices = prev.serviceRecords.filter((s) => s.id !== record.id);
        const nextVehicles = record.vehicleId
          ? prev.vehicles.map((v) => {
              if (v.id !== record.vehicleId) return v;
              const vehServices = nextServices.filter((s) => s.vehicleId === v.id);
              const sumType = (t: ServiceFeeRecord['serviceType']) =>
                vehServices.filter((s) => s.serviceType === t).reduce((sum, s) => sum + s.collectedAmount, 0);
              return {
                ...v,
                platformFee: sumType('platform'),
                adminFee: sumType('admin'),
                forkliftFee: sumType('forklift'),
                recoveryFee: sumType('recovery'),
                updatedAt: nowIso,
              };
            })
          : prev.vehicles;
        return { ...prev, serviceRecords: nextServices, vehicles: nextVehicles };
      };

      if (isDemoMode) updateDemoStore(applyDel);
      else if (!isCloudMode) updateLocalStore(applyDel);

      await addAuditEntry(
        'service_fee',
        record.id,
        'حذف قيد خدمة',
        `حذف رسم الخدمة ${record.serviceCode} بمبلغ AED ${record.collectedAmount}`,
        record.year,
        record.month
      );
    },
    [addAuditEntry, canEdit, isCloudMode, isDemoMode, updateDemoStore, updateLocalStore]
  );

  const approveReport = useCallback(
    async (
      payload: Omit<ApprovedReport, 'id' | 'ownerId' | 'approvedByName' | 'createdAt' | 'updatedAt'>
    ) => {
      if (!canApprove) throw new Error('ليس لديك صلاحية اعتماد التقارير');
      const id = generateSafeId(isDemoMode ? 'DEMO-SNAP' : 'rep');
      const ownerId = isDemoMode ? 'demo_workspace' : user?.uid || 'local_user';
      const nowIso = new Date().toISOString();

      // Compute immutable snapshot version for this period
      const existingSamePeriod = approvedReports.filter(
        (r) => r.year === payload.year && r.month === payload.month && r.periodType === payload.periodType
      );
      const nextVersion = existingSamePeriod.length + 1;

      if (isDemoMode) {
        updateDemoStore((prev) => ({
          ...prev,
          approvedReports: [
            {
              ...payload,
              id,
              approvedByName: actorName,
              approvedAt: nowIso,
              version: nextVersion,
              isDemo: true,
              ownerId,
              createdAt: nowIso,
              updatedAt: nowIso,
            },
            ...prev.approvedReports,
          ],
        }));
      } else if (isCloudMode && user) {
        // Keep exact keys allowed by firestore.rules isValidApprovedReport
        const firestoreStatus: 'approved' | 'archived' =
          payload.status === 'archived' ? 'archived' : 'approved';
        try {
          await setDoc(doc(db, 'approvedReports', id), {
            id,
            title: payload.title.slice(0, 200),
            periodType: payload.periodType,
            year: payload.year,
            month: payload.month,
            ...(payload.auctionId ? { auctionId: payload.auctionId } : {}),
            ...(payload.location ? { location: payload.location.slice(0, 120) } : {}),
            totalVehicles: payload.totalVehicles,
            soldVehicles: payload.soldVehicles,
            totalEstimated: payload.totalEstimated,
            totalSale: payload.totalSale,
            totalCollected: payload.totalCollected,
            saaedShareAmount: payload.saaedShareAmount,
            thirdPartyShareAmount: payload.thirdPartyShareAmount,
            totalServices: payload.totalServices,
            approvedByName: actorName.slice(0, 120),
            status: firestoreStatus,
            ...(payload.notes ? { notes: payload.notes.slice(0, 1000) } : {}),
            ownerId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `approvedReports/${id}`);
        }
      } else {
        updateLocalStore((prev) => ({
          ...prev,
          approvedReports: [
            {
              ...payload,
              id,
              approvedByName: actorName,
              approvedAt: nowIso,
              version: nextVersion,
              ownerId,
              createdAt: nowIso,
              updatedAt: nowIso,
            },
            ...prev.approvedReports,
          ],
        }));
      }

      await addAuditEntry(
        'approved_report',
        id,
        'اعتماد نسخة تقرير (Snapshot)',
        `اعتماد وحفظ "${payload.title}" - الإصدار v${nextVersion}`,
        payload.year,
        payload.month || getUaeCurrentDate().month
      );
      return id;
    },
    [
      actorName,
      addAuditEntry,
      approvedReports,
      canApprove,
      isCloudMode,
      isDemoMode,
      updateDemoStore,
      updateLocalStore,
      user,
    ]
  );

  const archiveReport = useCallback(
    async (report: ApprovedReport) => {
      if (!canApprove) throw new Error('ليس لديك صلاحية أرشفة التقارير');
      if (isDemoMode) {
        updateDemoStore((prev) => ({
          ...prev,
          approvedReports: prev.approvedReports.map((r) =>
            r.id === report.id ? { ...r, status: 'archived', updatedAt: new Date().toISOString() } : r
          ),
        }));
      } else if (isCloudMode) {
        try {
          await updateDoc(doc(db, 'approvedReports', report.id), {
            status: 'archived',
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `approvedReports/${report.id}`);
        }
      } else {
        updateLocalStore((prev) => ({
          ...prev,
          approvedReports: prev.approvedReports.map((r) =>
            r.id === report.id ? { ...r, status: 'archived' } : r
          ),
        }));
      }
      await addAuditEntry(
        'approved_report',
        report.id,
        'أرشفة تقرير',
        `نقل التقرير "${report.title}" إلى الأرشيف النهائي`,
        report.year,
        report.month || getUaeCurrentDate().month
      );
    },
    [addAuditEntry, canApprove, isCloudMode, isDemoMode, updateDemoStore, updateLocalStore]
  );

  const updateSettings = useCallback(
    async (next: Omit<SystemSettings, 'id' | 'ownerId' | 'updatedAt'>) => {
      if (!canManageSettings) throw new Error('صلاحية تحديث الإعدادات مقصورة على مدير النظام');
      const ownerId = isDemoMode ? 'demo_workspace' : user?.uid || 'local_user';
      const settingId = isDemoMode ? 'demo_settings' : isCloudMode ? `settings_${ownerId}` : 'default_settings';

      if (isDemoMode) {
        updateDemoStore((prev) => ({
          ...prev,
          settings: {
            ...next,
            id: settingId,
            ownerId,
            updatedAt: new Date().toISOString(),
          },
        }));
      } else if (isCloudMode && user) {
        const ref = doc(db, 'systemSettings', settingId);
        const firestoreSettings = {
          defaultSaaedSharePercent: next.defaultSaaedSharePercent,
          defaultThirdPartySharePercent: next.defaultThirdPartySharePercent,
          defaultPlatformFee: next.defaultPlatformFee,
          defaultAdminFee: next.defaultAdminFee,
          defaultForkliftFee: next.defaultForkliftFee,
          defaultRecoveryFee: next.defaultRecoveryFee,
        };
        try {
          const snap = await getDoc(ref);
          if (snap.exists()) {
            await updateDoc(ref, {
              ...firestoreSettings,
              updatedAt: serverTimestamp(),
            });
          } else {
            await setDoc(ref, {
              ...firestoreSettings,
              id: settingId,
              ownerId,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `systemSettings/${settingId}`);
        }
      } else {
        updateLocalStore((prev) => ({
          ...prev,
          settings: {
            ...next,
            id: settingId,
            ownerId,
            updatedAt: new Date().toISOString(),
          },
        }));
      }

      const uae = getUaeCurrentDate();
      await addAuditEntry(
        'settings',
        settingId,
        'تحديث الإعدادات المالية',
        `تحديث نسب التوزيع الافتراضية (${next.defaultSaaedSharePercent}% ساعد / ${next.defaultThirdPartySharePercent}% طرف ثالث)`,
        uae.year,
        uae.month
      );
    },
    [addAuditEntry, canManageSettings, isCloudMode, isDemoMode, updateDemoStore, updateLocalStore, user]
  );

  const setRole = useCallback(
    async (role: UserRole, targetUid?: string) => {
      if (isCloudMode && targetUid && canManageSettings) {
        try {
          await updateDoc(doc(db, 'users', targetUid), {
            role,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
        }
      } else {
        updateLocalStore((prev) => ({ ...prev, localRole: role }));
      }
    },
    [canManageSettings, isCloudMode, updateLocalStore]
  );

  const syncLocalToFirebase = useCallback(async () => {
    if (!user || isDemoMode) return;
    const batch = writeBatch(db);
    let count = 0;

    for (const a of localStore.auctions.filter((x) => !x.isDemo)) {
      batch.set(doc(db, 'auctions', a.id), {
        ...a,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      count++;
    }
    for (const v of localStore.vehicles.filter((x) => !x.isDemo)) {
      batch.set(doc(db, 'vehicles', v.id), {
        ...v,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      count++;
    }
    for (const c of localStore.collections.filter((x) => !x.isDemo)) {
      batch.set(doc(db, 'collections', c.id), {
        ...c,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      count++;
    }
    for (const r of localStore.approvedReports.filter((x) => !x.isDemo)) {
      batch.set(doc(db, 'approvedReports', r.id), {
        ...r,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      count++;
    }

    if (count > 0) {
      try {
        await batch.commit();
        updateLocalStore((prev) => ({
          ...prev,
          auctions: [],
          vehicles: [],
          collections: [],
          approvedReports: [],
        }));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'syncLocalToFirebase');
      }
    }
  }, [isDemoMode, localStore, updateLocalStore, user]);

  const clearPeriodLocalData = useCallback(
    (year: number, month: number | 'all') => {
      if (isCloudMode || isDemoMode) return;
      updateLocalStore((prev) => ({
        ...prev,
        auctions: prev.auctions.filter(
          (a) => !(a.year === year && (month === 'all' || a.month === month))
        ),
        vehicles: prev.vehicles.filter(
          (v) => !(v.year === year && (month === 'all' || v.month === month))
        ),
        collections: prev.collections.filter(
          (c) => !(c.year === year && (month === 'all' || c.month === month))
        ),
        serviceRecords: prev.serviceRecords.filter(
          (s) => !(s.year === year && (month === 'all' || s.month === month))
        ),
      }));
    },
    [isCloudMode, isDemoMode, updateLocalStore]
  );

  const hasUnsyncedLocalData =
    Boolean(user) &&
    !isDemoMode &&
    (localStore.auctions.length > 0 ||
      localStore.vehicles.length > 0 ||
      localStore.collections.length > 0);

  return {
    user,
    authReady,
    userProfile,
    usersList,
    firebaseOnline,
    authError,
    isCloudMode,
    workspaceMode,
    isDemoMode,
    isDemoSeeded,
    demoSeedSummary,
    demoSeedLog: demoStore.seedLog,
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
  };
}
