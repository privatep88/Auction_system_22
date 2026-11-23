import React from 'react';
import { BRAND_CONFIG, getBrandLogoUrl } from '../config/brand';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'حدث خطأ تشغيلي غير متوقع أثناء عرض الواجهة.',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[SAHER Runtime Boundary]', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const logoSrc = getBrandLogoUrl();

    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#EEF3F8] flex items-center justify-center p-4 sm:p-6 text-slate-900"
      >
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-l from-[#072B56] via-[#0B4F93] to-[#0E64B5] px-6 py-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/95 rounded-lg p-1.5 shadow-sm">
                <img
                  src={logoSrc}
                  alt={BRAND_CONFIG.logoAlt}
                  className="h-7 w-auto object-contain"
                />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold">
                  نظام التقرير المالي لمزادات المركبات – {BRAND_CONFIG.nameAr}
                </h1>
                <p className="text-[11px] text-sky-100/90">
                  {BRAND_CONFIG.nameEn} Vehicle Auctions – Financial Analytics
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <h2 className="text-sm font-bold text-amber-900 mb-1">
                تم اعتراض خطأ تشغيلي لمنع توقف النظام
              </h2>
              <p className="text-xs leading-relaxed text-amber-800">
                تعذر إكمال عرض أحد مكونات الصفحة الحالية، وقد تم حماية بيانات النظام
                والسجلات المالية المخزنة. يمكنك إعادة تحميل الواجهة للمتابعة.
              </p>
            </div>

            {this.state.errorMessage && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] font-mono text-slate-600 break-words dir-ltr text-left">
                {this.state.errorMessage}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 rounded-xl bg-[#0B4F93] hover:bg-[#093E75] text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                إعادة تحميل النظام
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
