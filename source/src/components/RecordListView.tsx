import React, { useMemo, useState } from 'react';
import { ConsultationRecord } from '../types';
import { FileText, Search } from 'lucide-react';
import { LEVEL_NAMES } from '../utils/engine';

interface RecordListViewProps {
  records: ConsultationRecord[];
  onOpenRecord: (recordId: number) => void;
}

export const RecordListView: React.FC<RecordListViewProps> = ({ records, onOpenRecord }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)),
    [records],
  );
  const filteredRecords = sortedRecords.filter((record) => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return true;
    return [record.name, record.studentNo, record.studentCls, record.target, record.method, record.purpose, record.content]
      .some((value) => value?.toLocaleLowerCase().includes(query));
  });

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">상담 기록</h1>
          <p className="text-xs text-slate-500 mt-1">저장된 상담 일지와 사건 기록을 날짜순으로 확인합니다.</p>
        </div>
        <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
          전체 {records.length}건
        </span>
      </div>

      <div className="relative max-w-lg">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="학생 이름, 학번, 상담 내용으로 검색..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0E6B5C] focus:ring-2 focus:ring-[#0E6B5C]/15"
        />
      </div>

      {filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredRecords.map((record) => (
            <button
              type="button"
              key={record.id}
              onClick={() => onOpenRecord(record.id)}
              className="text-left p-4 rounded-2xl border border-slate-200 hover:border-[#0E6B5C] bg-white hover:bg-[#FAFDFC] transition-all shadow-xs hover:shadow-sm space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500">
                    <span className="font-bold text-slate-900">{record.name || '학생'}</span>
                    {(record.studentCls || record.studentNo) && <span>·</span>}
                    {record.studentCls && <span>{record.studentCls}반</span>}
                    {record.studentNo && <span className="font-mono">{record.studentNo}</span>}
                  </div>
                  <h2 className="font-bold text-sm text-slate-800 mt-1.5 truncate">
                    {record.purpose || `${record.target} ${record.method} 상담`}
                  </h2>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] whitespace-nowrap shrink-0 ${
                    record.level === 2
                      ? 'bg-red-100 text-red-800'
                      : record.level === 1
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {LEVEL_NAMES[record.level]}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span>{record.date}</span>
                <span>·</span>
                <span>{record.target}</span>
                <span>·</span>
                <span>{record.method}</span>
                <span>·</span>
                <span>{record.kind}</span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed break-keep">{record.content}</p>
              {record.result.signals.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {record.result.signals.slice(0, 4).map((signal) => (
                    <span key={signal.code} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                      {signal.label}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-2">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">
            {searchQuery ? '검색 결과가 없습니다.' : '등록된 상담 기록이 없습니다.'}
          </p>
          <p className="text-xs text-slate-400">메모를 상담 일지로 전환하거나 새 기록을 작성해 주세요.</p>
        </div>
      )}
    </section>
  );
};
