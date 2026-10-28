import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, QrCode, MessageSquare, Printer, ExternalLink, Smartphone } from 'lucide-react';
import { TripPlan } from '../types/trip';
import { encodeTripToHash, generateShareSummaryText } from '../utils/itinerary';

interface ShareModalProps {
  trip: TripPlan;
  isOpen: boolean;
  onClose: () => void;
  onSwitchToPrint: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  trip,
  isOpen,
  onClose,
  onSwitchToPrint,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [shareText, setShareText] = useState('');

  // Direct synchronized family URL (opens current trip for all family members)
  const directShareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : `https://ais-pre-roj32syjug5ioupcuvnf6l-986430720266.asia-southeast1.run.app`;

  // Offline backup URL with encoded hash
  const fullBackupUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#${encodeTripToHash(trip)}`
    : directShareUrl;

  useEffect(() => {
    if (isOpen) {
      setShareText(generateShareSummaryText(trip));

      // Ensure server has latest state when opening share modal
      fetch('/api/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip }),
      }).catch((e) => console.warn('Sync on share modal open failed:', e));

      // QR code points directly to the synchronized family URL
      QRCode.toDataURL(directShareUrl, {
        width: 220,
        margin: 2,
        errorCorrectionLevel: 'L',
        color: {
          dark: '#1e293b',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => {
          console.warn('QR code generation fallback:', err);
          setQrDataUrl('');
        });
    }
  }, [isOpen, directShareUrl, trip]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(directShareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs no-print"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">가족에게 일정 공유하기</h3>
              <p className="text-xs text-slate-500">QR코드 스캔 또는 카카오톡 메시지로 공유하세요.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 text-lg leading-none"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* QR Code Block */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5">
          <div className="bg-white p-2 rounded-xl shadow-xs border border-slate-200 shrink-0">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="가족여행 일정 접속 QR 코드"
                className="w-36 h-36 rounded-lg"
              />
            ) : (
              <div className="w-36 h-36 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-xs text-slate-400">
                QR 생성 중...
              </div>
            )}
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <h4 className="text-sm font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span>스마트폰 카메라로 스캔</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              가족들의 스마트폰 카메라로 QR 코드를 비추면 휴대폰 화면에서 즉시 플래너에 접속할 수 있습니다.
            </p>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? '전체 일정 링크 복사 완료!' : '전체 일정 공유 링크 복사'}</span>
            </button>
          </div>
        </div>

        {/* KakaoTalk / Message share text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              카카오톡 / 문자 공유용 텍스트
            </span>
            <button
              onClick={handleCopyText}
              className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
            >
              {copiedText ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600">복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>내용 복사</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed selection:bg-indigo-100">
            {shareText}
          </div>
        </div>

        {/* Print / Export option */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onSwitchToPrint();
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>가족 공유용 인쇄 및 PDF 보기</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
